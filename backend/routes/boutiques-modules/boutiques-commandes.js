// backend/routes/boutiques-modules/boutiques-commandes.js
const router = require('express').Router();
const crypto = require('crypto');
const { body, param, query, validationResult } = require('express-validator');
const { pool } = require('../../models/db');
const { verifierToken, tokenOptional, adminSecretOnly, requireEmailVerifie } = require('../../middlewares/auth');
const { checkAbonnement, requireAbonnement, requireBusiness } = require('../../middlewares/checkAbonnement');
const { limiterPublication, limiterImport, limiterCommandeExpress } = require('../../middlewares/rateLimit');
const { uploadBuffer } = require('../../services/cloudinary');
const { scrapeProductFromUrl } = require('../../services/magic-import');
const { syncProduit, deleteProduit } = require('../../services/whatsapp-catalog');
const cfg = require('../../lib/settingsCache');
const { enregistrerAuditLog } = require('../../lib/auditLogger');
const { normalizeSocialUrl } = require('../../services/social-parser');
const creditCalc = require('../../lib/creditCalculator');
const { annulerCommandeNonPayee } = require('../../services/commande-service');
const {
  checkBoutiqueAccess,
  checkBoutiqueQuotas,
  upload,
  uploadProduitPhotos,
  CATS,
  MAX_BOUTIQUES,
  QUOTA_PRODUITS,
  slugify,
  uniqueSlug,
} = require('./helpers');
router.post('/:id/paniers-abandonnes', async (req, res) => {
  try {
    const { id } = req.params;
    const { client_nom, client_tel, articles, total } = req.body;
    if (!client_tel?.trim() || !Array.isArray(articles) || articles.length === 0) {
      return res.status(400).json({ error: 'Numéro de téléphone et articles requis' });
    }

    const isUUID = /^[0-9a-f-]{36}$/i.test(id);
    const bqCond = isUUID ? 'id=$1' : 'slug=$1';
    const b = await pool.query(`SELECT id FROM boutiques WHERE ${bqCond}`, [id]);
    if (!b.rows[0]) return res.status(404).json({ error: 'Boutique introuvable' });

    const r = await pool.query(
      `INSERT INTO paniers_abandonnes (boutique_id, client_nom, client_tel, articles, total)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [b.rows[0].id, client_nom || null, client_tel.trim(), JSON.stringify(articles), Number(total || 0)]
    );

    res.status(201).json({ success: true, panier: r.rows[0] });
  } catch (err) {
    console.error('[PANIERS ABANDONNES POST]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── GET /api/boutiques/:id/paniers-abandonnes — Liste pour le marchand
router.get('/:id/paniers-abandonnes', verifierToken, async (req, res) => {
  try {
    const { id } = req.params;
    const own = await pool.query('SELECT id FROM boutiques WHERE id=$1 AND utilisateur_id=$2', [id, req.user.userId]);
    if (!own.rows[0]) return res.status(403).json({ error: 'Accès refusé' });

    const { rows } = await pool.query(
      `SELECT * FROM paniers_abandonnes WHERE boutique_id=$1 ORDER BY created_at DESC LIMIT 50`,
      [id]
    );

    res.json({ success: true, paniers: rows });
  } catch (err) {
    console.error('[PANIERS ABANDONNES GET]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── POST /api/boutiques/:id/paniers-abandonnes/:cartId/relancer — Relancer par WhatsApp
router.post('/:id/paniers-abandonnes/:cartId/relancer', verifierToken, async (req, res) => {
  try {
    const { id, cartId } = req.params;
    const own = await pool.query('SELECT b.nom, b.whatsapp FROM boutiques b WHERE b.id=$1 AND b.utilisateur_id=$2', [id, req.user.userId]);
    if (!own.rows[0]) return res.status(403).json({ error: 'Accès refusé' });

    const cartRes = await pool.query('SELECT * FROM paniers_abandonnes WHERE id=$1 AND boutique_id=$2', [cartId, id]);
    if (!cartRes.rows[0]) return res.status(404).json({ error: 'Panier introuvable' });

    const cart = cartRes.rows[0];
    await pool.query('UPDATE paniers_abandonnes SET relance_envoyee=true WHERE id=$1', [cartId]);

    const nomBoutique = own.rows[0].nom;
    const itemsText = (cart.articles || []).map((i) => `• ${i.quantite}x ${i.nom}`).join('\n');
    const messageRelance = `Bonjour ${cart.client_nom ? cart.client_nom : ''} ! Nous avons remarqué que vous avez laissé des articles dans votre panier chez ${nomBoutique} :\n\n${itemsText}\n\nProfitez de -5% de réduction si vous finalisez votre commande aujourd'hui ! Lien direct : https://nopalou.com/boutiques/${id}`;

    const digits = cart.client_tel.replace(/\D/g, '');
    const cleanTel = digits.length === 9 ? '221' + digits : digits;
    const lienWhatsappRelance = `https://wa.me/${cleanTel}?text=${encodeURIComponent(messageRelance)}`;

    res.json({ success: true, lienWhatsapp: lienWhatsappRelance, message: messageRelance });
  } catch (err) {
    console.error('[PANIERS ABANDONNES RELANCER]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MODES_PAIEMENT_NUMERIQUES = new Set(['wave', 'pay_wave', 'orange_money', 'pay_om', 'carte_bancaire', 'stripe', 'card']);

// ── Spec 02 : POST /api/boutiques/commandes/express — Checkout Web 1-Page Unifié
router.post('/commandes/express', limiterCommandeExpress, async (req, res) => {
  try {
    const { boutique_id, client_nom, client_telephone, client_adresse, methode_paiement, note, frais_livraison, articles, code_promo, montant_reduction, remise,
      utm_source, utm_medium, utm_campaign, social_post_id, formule_echelonnement } = req.body;

    if (!boutique_id) {
      return res.status(400).json({ error: 'Boutique introuvable ou ID requis.' });
    }
    if (!client_nom || !client_nom.trim() || !client_telephone || !client_telephone.trim()) {
      return res.status(400).json({ error: 'Nom et téléphone du client requis.' });
    }
    if (!Array.isArray(articles) || articles.length === 0) {
      return res.status(400).json({ error: 'Au moins un article est requis dans le panier.' });
    }

    const bqQuery = 'SELECT id, nom, slug, telephone, whatsapp, utilisateur_id FROM boutiques WHERE (id::text = $1 OR slug = $1)';
    const bqRes = await pool.query(bqQuery, [boutique_id]);
    if (!bqRes.rows[0]) {
      return res.status(400).json({ error: 'Boutique introuvable.' });
    }

    const actualBoutiqueId = bqRes.rows[0].id;
    const now = new Date();
    const dateStr = now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0');
    const entropy = crypto.randomBytes(3).toString('hex').toUpperCase();
    const ref = `CMD-${dateStr}-${entropy}`;
    // AUD-084 : les frais de livraison viennent UNIQUEMENT de la zone de la boutique (jamais du corps de requête).
    // Sans zone valide (retrait, frais à convenir) la livraison vaut 0, comme sur la route du panier.
    let fraisLiv = 0;
    if (req.body.zone_livraison_id && UUID_RE.test(String(req.body.zone_livraison_id))) {
      const zRes = await pool.query('SELECT prix FROM zones_livraison WHERE id = $1 AND boutique_id = $2', [req.body.zone_livraison_id, actualBoutiqueId]);
      if (zRes.rows[0]) fraisLiv = Math.max(0, Number(zRes.rows[0].prix) || 0);
    }

    // Remise Club VIP : palier lu AVANT d'ouvrir la connexion de transaction. Demander une seconde connexion du pool
    // pendant qu'on en détient une provoque un interblocage sous charge (AUD-082). Remise à la charge du marchand,
    // seulement si sa boutique a activé le Club VIP (désactivé par défaut).
    const { statutClubVip, remiseLivraison } = require('../../lib/clubVip');
    let statutVip = null;
    if (fraisLiv > 0) {
      try {
        const vr = await pool.query('SELECT COALESCE(club_vip_actif, false) AS actif, club_vip_config AS config FROM boutiques WHERE id = $1', [actualBoutiqueId]);
        if (vr.rows[0]?.actif === true) {
          statutVip = await statutClubVip(pool, client_telephone, { config: vr.rows[0].config || null, boutiqueId: actualBoutiqueId });
        }
      } catch (_) { statutVip = null; }
    }

    const reglagesPromo = { platformPromoActive: false, platformPromoCode: '', platformPromoReduc: 0 };
    if (code_promo && String(code_promo).trim()) {
      reglagesPromo.platformPromoActive = await cfg.getBool('promo_active');
      reglagesPromo.platformPromoCode = ((await cfg.get('promo_code')) || '').trim().toUpperCase();
      reglagesPromo.platformPromoReduc = (await cfg.getNum('promo_reduction')) || 0;
    }

    const client = await pool.connect();
    let clientReleased = false;
    const releaseClient = () => {
      if (!clientReleased) {
        clientReleased = true;
        try { client.release(); } catch {}
      }
    };
    let totalArticles = 0;
    const articlesTraites = [];
    let reductionVal = 0;
    let reductionSurLivraison = 0;
    let promoAppliquee = null;
    let promoIdUtilisee = null;
    let totalGeneral = 0;
    let finalNote = note || '';

    try {
      await client.query('BEGIN');

      // ── 1. Calcul strict et sécurisé des prix depuis la base de données (avec verrou) ──
      for (const art of articles) {
        // AUD-011 : validation UUID stricte (et non plus une simple longueur de 36 caractères)
        const validProdId = (art.produit_id && UUID_RE.test(String(art.produit_id))) ? String(art.produit_id) : null;
        let prix = 0;
        let prixAchat = null;
        let varianteId = null;
        let detailsVariante = null;
        let nomProd = art.nom_produit || 'Produit sans nom';
        const qte = Math.max(1, Math.floor(Number(art.quantite)) || 1);

        if (validProdId) {
          const pRes = await client.query(
            'SELECT id, nom, prix, prix_achat, stock_quantite, en_stock, statut_moderation FROM boutique_produits WHERE id = $1 AND boutique_id = $2 FOR UPDATE',
            [validProdId, actualBoutiqueId]
          );
          if (pRes.rows[0]) {
            // AUD-075 : produit suspendu, hors vente ou sans prix : non commandable
            const pr = pRes.rows[0];
            const indispo = (pr.statut_moderation && pr.statut_moderation !== 'actif')
              || (pr.stock_quantite === null && pr.en_stock === false)
              || !(Number(pr.prix) > 0);
            if (indispo) {
              await client.query('ROLLBACK');
              releaseClient();
              return res.status(409).json({ error: `"${pr.nom}" n'est pas disponible à la vente.` });
            }
            prix = Number(pRes.rows[0].prix) || 0;
            prixAchat = pRes.rows[0].prix_achat != null ? Number(pRes.rows[0].prix_achat) : null;
            if (pRes.rows[0].nom) nomProd = pRes.rows[0].nom;

            // Décrémentation atomique de stock si géré
            if (typeof pRes.rows[0].stock_quantite === 'number') {
              if (pRes.rows[0].stock_quantite < qte) {
                await client.query('ROLLBACK');
                releaseClient();
                return res.status(409).json({
                  error: `Stock insuffisant pour "${nomProd}" (disponible : ${pRes.rows[0].stock_quantite}, demandé : ${qte}).`
                });
              }
              await client.query(
                `UPDATE boutique_produits SET stock_quantite = stock_quantite - $1,
                   en_stock = CASE WHEN stock_quantite - $1 <= 0 THEN false ELSE en_stock END WHERE id = $2`,
                [qte, validProdId]
              );
            }
            // AUD-076 : prix et stock de la variante choisie (résolus côté serveur)
            if (art.variante_id) {
              const vRes = UUID_RE.test(String(art.variante_id)) ? await client.query(
                `SELECT id, prix, stock_quantite, attributs FROM boutique_produit_variantes
                  WHERE id = $1 AND produit_id = $2 AND boutique_id = $3 AND actif = true FOR UPDATE`,
                [art.variante_id, validProdId, actualBoutiqueId]
              ) : { rows: [] };
              const v = vRes.rows[0];
              if (!v) {
                await client.query('ROLLBACK');
                releaseClient();
                return res.status(400).json({ error: `Variante indisponible pour "${nomProd}".` });
              }
              if (v.stock_quantite !== null && Number(v.stock_quantite) < qte) {
                await client.query('ROLLBACK');
                releaseClient();
                return res.status(409).json({ error: `Stock insuffisant pour "${nomProd}" (disponible : ${v.stock_quantite}, demandé : ${qte}).` });
              }
              if (v.prix !== null && Number(v.prix) > 0) prix = Number(v.prix);
              await client.query('UPDATE boutique_produit_variantes SET stock_quantite = stock_quantite - $1 WHERE id = $2 AND stock_quantite IS NOT NULL', [qte, v.id]);
              varianteId = v.id;
              if (v.attributs && typeof v.attributs === 'object') detailsVariante = Object.values(v.attributs).join(' / ').slice(0, 255) || null;
            }
          } else {
            await client.query('ROLLBACK');
            releaseClient();
            return res.status(400).json({ error: `L'article "${nomProd}" n'appartient pas à cette boutique ou est indisponible.` });
          }
        } else {
          // AUD-011 : le prix ne vient JAMAIS du client. Un article sans produit catalogue valide est refusé
          // (le checkout public ne gère que des produits de la boutique, tarifés côté serveur).
          await client.query('ROLLBACK');
          releaseClient();
          return res.status(400).json({ error: `L'article "${nomProd}" n'est pas un produit valide de cette boutique.` });
        }

        const totalLigne = prix * qte;
        totalArticles += totalLigne;
        articlesTraites.push({ validProdId, nomProd, qte, prix, prixAchat, totalLigne, varianteId, detailsVariante });
      }

      // ── 2. Validation stricte du code promo côté serveur ──
      if (code_promo && String(code_promo).trim()) {
        const cleanCode = String(code_promo).trim().toUpperCase();

        // Vérification promo globale (réglages lus avant d'ouvrir la transaction : pas de seconde connexion du pool)
        const { platformPromoActive, platformPromoCode, platformPromoReduc } = reglagesPromo;

        if (platformPromoActive && platformPromoCode && cleanCode === platformPromoCode) {
          reductionVal = Math.round((totalArticles * platformPromoReduc) / 100);
          promoAppliquee = cleanCode;
        } else {
          // Vérification promo boutique
          const promoRes = await client.query(
            `SELECT * FROM boutique_promotions
             WHERE boutique_id = $1 AND UPPER(code) = $2 AND actif = true FOR UPDATE`,
            [actualBoutiqueId, cleanCode]
          );
          const p = promoRes.rows[0];
          if (p) {
            const notExpired = !p.fin || new Date(p.fin) >= new Date();
            const minAchatOk = !p.min_achat || totalArticles >= Number(p.min_achat);
            // AUD-046 : la colonne réelle est `limite_utilisation` (`max_utilisations` n'existe pas : la limite n'était jamais appliquée)
            const limiteUsage = p.limite_utilisation != null ? p.limite_utilisation : p.max_utilisations;
            const maxUsageOk = !limiteUsage || Number(p.fois_utilise || 0) < Number(limiteUsage);

            if (notExpired && minAchatOk && maxUsageOk) {
              if (p.type_remise === 'pourcentage') {
                reductionVal = Math.round((totalArticles * Number(p.valeur || 0)) / 100);
              } else if (p.type_remise === 'livraison_offerte') {
                // AUD-084 : la remise porte sur la livraison, jamais sur le prix des articles
                reductionVal = Math.min(fraisLiv, Number(p.valeur) || fraisLiv);
                reductionSurLivraison = reductionVal;
              } else {
                reductionVal = Math.min(totalArticles, Number(p.valeur || 0));
              }
              promoAppliquee = cleanCode;
              promoIdUtilisee = p.id;
              await client.query(
                `UPDATE boutique_promotions SET fois_utilise = fois_utilise + 1 WHERE id = $1`,
                [p.id]
              );
            }
          }
        }
      }

      if (promoAppliquee) {
        const promoNote = `[Code Promo: ${promoAppliquee}${reductionVal > 0 ? ` (-${reductionVal} FCFA)` : ''}]`;
        finalNote = finalNote ? `${finalNote} | ${promoNote}` : promoNote;
      }

      if (formule_echelonnement && typeof formule_echelonnement === 'object') {
        const appFmt = (Number(formule_echelonnement.apport) || 0).toLocaleString('fr-FR');
        const nbEch = formule_echelonnement.nb_echeances || 3;
        const freq = formule_echelonnement.frequence || 'mensuel';
        const echNote = `[Paiement Échelonné: Apport ${appFmt} FCFA + ${nbEch}x (${freq})]`;
        finalNote = finalNote ? `${finalNote} | ${echNote}` : echNote;
      }

      // AUD-044 / AUD-042 : une commande = UN en-tête portant le total complet (articles + livraison - remise,
      // c'est ce montant que le client paie et que le webhook de paiement contrôle) + ses lignes dans
      // commandes_boutique_items. L'ancien code insérait une ligne par article avec la même référence, ce que
      // la contrainte UNIQUE(reference) refuse : tout panier de 2 articles ou plus échouait en 500.
      // Remise Club VIP (AUD-084) : calculée ICI à partir du palier réel du téléphone (commandes livrées/encaissées),
      // sur la livraison restant à payer après une éventuelle promo « livraison offerte ». Affichage = facturation.
      const fraisRestants = Math.max(0, fraisLiv - reductionSurLivraison);
      const remiseVip = statutVip ? remiseLivraison(statutVip, fraisRestants) : 0;
      if (remiseVip > 0) {
        const vipNote = `[Club VIP ${statutVip.palier} : -${remiseVip} FCFA sur la livraison]`;
        finalNote = finalNote ? `${finalNote} | ${vipNote}` : vipNote;
      }
      totalGeneral = Math.max(0, totalArticles + fraisLiv - reductionVal - remiseVip);
      const totalQte = articlesTraites.reduce((s, a) => s + a.qte, 0);
      const plusieurs = articlesTraites.length > 1;
      const nomHeader = plusieurs
        ? articlesTraites.map(a => `${a.qte}x ${a.nomProd}`).join(', ').slice(0, 300)
        : articlesTraites[0].nomProd;
      const prixHeader = plusieurs ? Math.round(totalArticles / totalQte) : articlesTraites[0].prix;

      const { rows: [entete] } = await client.query(
        `INSERT INTO commandes_boutique (
          reference, boutique_id, produit_id, nom_produit, quantite, prix_unitaire,
          montant_total, client_nom, client_telephone, client_adresse, note,
          statut, source, methode_paiement, frais_livraison,
          utm_source, utm_medium, utm_campaign, social_post_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'en_attente', 'web', $12, $13, $14, $15, $16, $17, NOW())
        RETURNING id`,
        [
          ref, actualBoutiqueId, articlesTraites[0].validProdId, nomHeader, totalQte, prixHeader,
          totalGeneral, client_nom.trim(), client_telephone.trim(), client_adresse || null, finalNote || null,
          methode_paiement || 'wave', fraisLiv,
          utm_source || null, utm_medium || null, utm_campaign || null,
          (social_post_id && UUID_RE.test(String(social_post_id))) ? social_post_id : null,
        ]
      );

      if (remiseVip > 0) {
        await client.query('UPDATE commandes_boutique SET remise_club_vip = $1 WHERE id = $2', [remiseVip, entete.id]);
      }

      for (const item of articlesTraites) {
        await client.query(
          `INSERT INTO commandes_boutique_items
             (commande_id, boutique_id, produit_id, variante_id, nom_produit, details_variante, prix_unitaire, prix_achat, quantite, montant_total)
           VALUES ($1, $2, $3, $9, $4, $10, $5, $6, $7, $8)`,
          [entete.id, actualBoutiqueId, item.validProdId, item.nomProd.slice(0, 300), item.prix, item.prixAchat, item.qte, item.totalLigne, item.varianteId, item.detailsVariante]
        );
      }

      await client.query('COMMIT');
    } catch (errTx) {
      await client.query('ROLLBACK').catch(() => {});
      throw errTx;
    } finally {
      releaseClient();
    }

    // Effets secondaires (analytique, notifications, fidélité) : exécutés seulement une fois la commande viable,
    // c'est-à-dire après la création réussie de la session de paiement pour les modes numériques (AUD-010).
    const apresCreation = async () => {
    pool.query(`INSERT INTO analytics_events (type, boutique_id) VALUES ('commande_web', $1)`, [actualBoutiqueId]).catch(() => {});

    // Notification WhatsApp au vendeur
    try {
      const { notifierVendeurCommande } = require('../../services/commande-service');
      notifierVendeurCommande(bqRes.rows[0], {
        reference: ref,
        // noms et quantités issus de la base (articlesTraites), jamais du corps de requête
        nomProduit: articlesTraites.map(a => a.nomProd).join(', '),
        quantite: articlesTraites.reduce((acc, a) => acc + a.qte, 0),
        montantTotal: totalGeneral,
        fraisLivraison: fraisLiv,
        methodePaiement: methode_paiement || 'wave',
        clientNom: client_nom.trim(),
        clientTelephone: client_telephone.trim(),
        clientAdresse: client_adresse || null,
        note: finalNote || null,
      }).catch(err => console.error('[EXPRESS NOTIF VENDEUR ERR]:', err.message));
    } catch (eNotif) {
      console.error('[EXPRESS NOTIF ERR]:', eNotif.message);
    }

    // Crédit Fidélité automatique sur commande en ligne si client inscrit
    if (client_telephone && String(client_telephone).trim()) {
      try {
        const cleanTel = String(client_telephone).trim().replace(/\s+/g, '');
        const fidCliRes = await pool.query(
          `SELECT * FROM boutique_clients_fidelite WHERE boutique_id = $1 AND (telephone = $2 OR telephone = $3) LIMIT 1`,
          [actualBoutiqueId, cleanTel, cleanTel.replace(/^221/, '')]
        );
        if (fidCliRes.rows[0]) {
          const fidCli = fidCliRes.rows[0];
          const bqFidRes = await pool.query(`SELECT fidelite_actif, fidelite_type, fidelite_taux_cashback FROM boutiques WHERE id = $1`, [actualBoutiqueId]);
          const bqFid = bqFidRes.rows[0];
          if (bqFid && bqFid.fidelite_actif !== false) {
            const taux = Number(bqFid.fidelite_taux_cashback !== undefined ? bqFid.fidelite_taux_cashback : 3.00);
            const gain = Math.round(totalGeneral * (taux / 100));
            const nvDepense = Number(fidCli.total_depense || 0) + totalGeneral;
            const nvCagnotte = Number(fidCli.cagnotte_fcfa || 0) + gain;
            const nvVisites = Number(fidCli.nb_visites || 0) + 1;
            const nvRang = nvDepense >= 500000 ? 'vip' : nvDepense >= 200000 ? 'or' : nvDepense >= 50000 ? 'argent' : 'bronze';

            await pool.query(
              `UPDATE boutique_clients_fidelite 
               SET cagnotte_fcfa = $1, total_depense = $2, nb_visites = $3, rang_fidelite = $4, derniere_visite = NOW(), updated_at = NOW()
               WHERE id = $5`,
              [nvCagnotte, nvDepense, nvVisites, nvRang, fidCli.id]
            );

            if (gain > 0) {
              await pool.query(
                `INSERT INTO boutique_fidelite_mouvements (boutique_id, client_fidelite_id, vente_reference, type_mouvement, valeur_fcfa, points, description)
                 VALUES ($1, $2, $3, 'credit_achat', $4, $5, $6)`,
                [actualBoutiqueId, fidCli.id, ref, gain, Math.floor(totalGeneral / 100), `Gain fidélité commande web ${ref}`]
              );
            }
          }
        }
      } catch (fidErr) {
        console.warn('[FIDELITE COMMANDE WEB ERR]:', fidErr.message);
      }
    }

    // Notification WhatsApp à l'acheteur (client) avec garantie 24H Meta
    if (client_telephone && client_telephone.trim()) {
      try {
        const { sendWhatsAppNotification } = require('../../services/whatsapp');
        const methodeLabel = { wave: 'Wave', orange_money: 'Orange Money', cash: 'Espèces à la livraison', virement: 'Virement bancaire', credit: 'Achat à Crédit' };
        const totalFmt = new Intl.NumberFormat('fr-FR').format(totalGeneral);
        const articlesStr = articlesTraites.map(a => `${a.qte}x ${a.nomProd}`).join(', ');
        const msgClient = `✅ *Commande enregistrée avec succès — ${bqRes.rows[0].nom}*\n\nRéférence : *${ref}*\nArticles : ${articlesStr}\n💰 Total : *${totalFmt} FCFA*${fraisLiv > 0 ? ` (dont ${new Intl.NumberFormat('fr-FR').format(fraisLiv)} FCFA de livraison)` : ''}\n💳 Mode de paiement : ${methodeLabel[methode_paiement] || methode_paiement}\n\n📍 Adresse : ${client_adresse || 'Retrait en boutique'}\n\n🙏 La boutique *${bqRes.rows[0].nom}* a bien reçu votre commande et vous contactera très vite !`;

        const SITE = process.env.FRONTEND_URL || 'https://nopalou.com';
        const titleTpl = `✅ Commande enregistrée — ${bqRes.rows[0].nom}`;
        const detailTpl = `Réf ${ref} : ${articlesStr} (${totalFmt} FCFA). Paiement: ${methodeLabel[methode_paiement] || methode_paiement}`;
        const urlTpl = `${SITE}/suivi-commande?ref=${encodeURIComponent(ref)}`;

        sendWhatsAppNotification(client_telephone.trim(), {
          textMessage: msgClient,
          title: titleTpl,
          montant: `${totalFmt} FCFA`,
          detail: detailTpl,
          url: urlTpl,
          buttonParam: `suivi-commande?ref=${encodeURIComponent(ref)}`,
          type: 'commande',
        })
          .then(() => console.log(`[WHATSAPP CLIENT NOTIF SUCCESS] Confirmation envoyée au ${client_telephone}`))
          .catch(err => console.error('[WHATSAPP CLIENT NOTIF ERR]:', err.message));
      } catch (eCl) {
        console.error('[WHATSAPP CLIENT NOTIF ERR]:', eCl.message);
      }
    }
    }; // fin apresCreation

    // AUD-010 : si la session de paiement ne peut pas être créée, la commande est annulée et le stock restitué
    // (auparavant la commande restait « en_attente » avec son stock consommé, sans aucune possibilité de paiement).
    const compenserEchecPaiement = async (motif) => {
      try { await annulerCommandeNonPayee(ref, motif); } catch (e) { console.error('[EXPRESS COMPENSATION ERR]:', e.message); }
      if (promoIdUtilisee) {
        await pool.query('UPDATE boutique_promotions SET fois_utilise = GREATEST(0, fois_utilise - 1) WHERE id = $1', [promoIdUtilisee]).catch(() => {});
      }
    };

    // Initialisation session Wave si paiement Wave sélectionné
    if ((methode_paiement === 'wave' || methode_paiement === 'pay_wave') && process.env.WAVE_API_KEY && !process.env.WAVE_API_KEY.includes('xxxxxxxx')) {
      try {
        const wave = require('../../services/wave');
        const waveSession = await wave.createCheckoutSession({
          amount: Number(totalGeneral),
          currency: 'XOF',
          success_url: `${process.env.FRONTEND_URL || 'https://nopalou.com'}/paiement/succes?ref=${ref}&type=commande-express`,
          error_url: `${process.env.FRONTEND_URL || 'https://nopalou.com'}/paiement/erreur?ref=${ref}&type=commande-express`,
          client_reference: ref,
        });
        await apresCreation();
        return res.status(201).json({
          succes: true,
          reference: ref,
          montant_total: totalGeneral,
          statut: 'en_attente',
          wave_url: waveSession.wave_url,
          session_id: waveSession.session_id,
          message: 'Commande enregistrée. Redirection vers Wave…'
        });
      } catch (waveErr) {
        const waveMsg = waveErr.response?.data?.message || waveErr.response?.data?.code || waveErr.message;
        console.error('[EXPRESS WAVE INIT ERR]:', waveMsg);
        await compenserEchecPaiement('initialisation Wave impossible');
        return res.status(400).json({
          error: `Erreur Wave API: ${waveMsg}. (Si IP non autorisée, ajoutez l'IP de votre serveur Render à la liste blanche Wave). Votre commande n'a pas été enregistrée.`
        });
      }
    }

    // Initialisation session Orange Money si sélectionné
    if (methode_paiement === 'orange_money' || methode_paiement === 'pay_om') {
      try {
        const om = require('../../services/orange-money');
        // AUD-040 : sans notif_url explicite, le service utilisait /api/paiements/orange-money/webhook,
        // route inexistante : Orange ne pouvait jamais confirmer le paiement.
        const omSession = await om.createWebPayment({
          amount: Number(totalGeneral),
          currency: 'XOF',
          order_id: ref,
          notif_url: `${process.env.BACKEND_URL}/api/paiement/orange/webhook`,
        });
        await apresCreation();
        return res.status(201).json({
          succes: true,
          reference: ref,
          montant_total: totalGeneral,
          statut: 'en_attente',
          om_url: omSession.om_url || omSession.payment_url,
          payment_url: omSession.payment_url,
          pay_token: omSession.pay_token,
          message: 'Commande enregistrée. Redirection vers Orange Money…'
        });
      } catch (omErr) {
        console.error('[EXPRESS OM INIT ERR]:', omErr.message);
        await compenserEchecPaiement('initialisation Orange Money impossible');
        return res.status(502).json({ error: 'Le paiement Orange Money n’a pas pu être initialisé. Votre commande n’a pas été enregistrée, veuillez réessayer ou choisir un autre mode de paiement.' });
      }
    }

    // Initialisation session Stripe si Carte Bancaire sélectionnée
    if (methode_paiement === 'carte_bancaire' || methode_paiement === 'stripe' || methode_paiement === 'card') {
      try {
        const stripeService = require('../../services/stripe');
        const stripeSession = await stripeService.createCheckoutSession({
          amount: Number(totalGeneral),
          currency: (req.body.devise_stripe || req.body.devise || 'XOF').toLowerCase(),
          client_reference: ref,
          customer_email: req.body.client_email || undefined,
          customer_name: client_nom.trim(),
        });
        await apresCreation();
        return res.status(201).json({
          succes: true,
          reference: ref,
          montant_total: totalGeneral,
          statut: 'en_attente',
          stripe_url: stripeSession.stripe_url || stripeSession.url,
          session_id: stripeSession.session_id,
          message: 'Commande enregistrée. Redirection vers le paiement sécurisé par Carte…'
        });
      } catch (stripeErr) {
        console.error('[EXPRESS STRIPE INIT ERR]:', stripeErr.message);
        await compenserEchecPaiement('initialisation Stripe impossible');
        return res.status(502).json({ error: 'Le paiement par carte n’a pas pu être initialisé. Votre commande n’a pas été enregistrée, veuillez réessayer ou choisir un autre mode de paiement.' });
      }
    }

    if (!res.headersSent) {
      await apresCreation();
      res.status(201).json({
        succes: true,
        reference: ref,
        montant_total: totalGeneral,
        statut: 'en_attente',
        message: 'Votre commande a été enregistrée avec succès.'
      });
    }
  } catch (err) {
    console.error('[EXPRESS CHECKOUT ERR]', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Erreur lors de l\'enregistrement de la commande' });
    }
  }
});

// ── GET /api/boutiques/commandes/suivi — Suivi public sécurisé de commande
router.get('/commandes/suivi', async (req, res) => {
  try {
    const { ref, tel, q } = req.query;
    const rawTerm = (ref || q || tel || '').toString().trim();
    if (!rawTerm || rawTerm.length < 5) {
      return res.status(400).json({ error: 'Veuillez fournir une référence complète de commande ou un numéro de téléphone valide.' });
    }

    const cleanDigits = rawTerm.replace(/[^0-9]/g, '');
    const isPhoneSearch = cleanDigits.length >= 9;
    // AUD-079/080 : référence strictement bien formée (jamais de joker ILIKE) ; les références du panier (`C-…`) sont acceptées
    const isReferenceSearch = /^(CMD|PAY|V|C)-[A-Z0-9-]{3,60}$/i.test(rawTerm) || UUID_RE.test(rawTerm);
    if (!isReferenceSearch && /[%_*\\]/.test(rawTerm)) {
      return res.status(400).json({ error: 'Référence de commande invalide.' });
    }

    // AUD-215 : ni référence bien formée ni téléphone complet = aucune recherche (un terme vide dans la branche
    // téléphone donnait `LIKE '%'` et renvoyait les dernières commandes de tous les clients).
    if (!isPhoneSearch && !isReferenceSearch) {
      return res.status(400).json({ error: 'Référence introuvable. Vérifiez le format (ex. C-ABC123) ou saisissez votre numéro complet (9 chiffres).' });
    }

    let query;
    let params;

    if (isReferenceSearch) {
      query = `
        SELECT c.id, c.reference, c.client_nom, c.client_telephone, c.statut, c.montant_total,
               c.methode_paiement, c.created_at, c.boutique_id, c.produit_id, c.nom_produit, c.quantite,
               COALESCE(b.nom, 'Boutique Nopalou') as boutique_nom,
               COALESCE(b.slug, b.id::text) as boutique_slug,
               COALESCE(b.telephone, '') as boutique_whatsapp
        FROM commandes_boutique c
        LEFT JOIN boutiques b ON b.id = c.boutique_id
        WHERE UPPER(c.reference) = UPPER($1) OR c.id::text = LOWER($1)
        ORDER BY c.created_at DESC
        LIMIT 5
      `;
      params = [rawTerm];
    } else {
      const short9 = cleanDigits.slice(-9);
      query = `
        SELECT c.id, c.reference, c.client_nom, c.client_telephone, c.statut, c.montant_total,
               c.methode_paiement, c.created_at, c.boutique_id, c.produit_id, c.nom_produit, c.quantite,
               COALESCE(b.nom, 'Boutique Nopalou') as boutique_nom,
               COALESCE(b.slug, b.id::text) as boutique_slug,
               COALESCE(b.telephone, '') as boutique_whatsapp
        FROM commandes_boutique c
        LEFT JOIN boutiques b ON b.id = c.boutique_id
        WHERE regexp_replace(COALESCE(c.client_telephone, ''), '[^0-9]', '', 'g') LIKE '%' || $1
        ORDER BY c.created_at DESC
        LIMIT 5
      `;
      params = [short9];
    }

    const { rows } = await pool.query(query, params);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Aucune commande trouvée pour cette référence ou ce numéro.' });
    }

    // Masquage RGPD / PII des coordonnées personnelles pour la consultation publique
    const sanitizedRows = rows.map(cmd => {
      const tel = cmd.client_telephone || '';
      const maskedTel = tel.length >= 6 ? `${tel.slice(0, 2)} *** ** ${tel.slice(-2)}` : 'Numéro masqué';
      const nomParts = (cmd.client_nom || 'Client').trim().split(' ');
      const maskedNom = nomParts.length > 1 ? `${nomParts[0]} ${nomParts[1].charAt(0)}.` : nomParts[0];

      // SÉCURITÉ P2 : Limiter les données exposées selon le type de recherche.
      // La recherche par téléphone seul ne renvoie PAS les détails produits ni les slugs boutique
      // pour empêcher l'espionnage des habitudes d'achat d'un tiers à partir de son numéro.
      if (!isReferenceSearch) {
        return {
          id: cmd.id,
          reference: cmd.reference,
          statut: cmd.statut,
          montant_total: cmd.montant_total,
          methode_paiement: cmd.methode_paiement,
          created_at: cmd.created_at,
          client_nom: maskedNom,
          client_telephone: maskedTel,
          // PII/détails retirés sur recherche par téléphone uniquement :
          boutique_nom: 'Boutique Nopalou',
          boutique_slug: null,
          boutique_whatsapp: null,
          nom_produit: null,
          quantite: null,
        };
      }

      return {
        ...cmd,
        client_nom: maskedNom,
        client_telephone: maskedTel,
      };
    });

    res.json({
      success: true,
      commandes: sanitizedRows
    });

  } catch (err) {
    console.error('[GET SUIVI ERR]', err);
    res.status(500).json({ error: 'Erreur lors de la recherche du suivi de commande' });
  }
});

// ── POST /api/boutiques/scan-ocr — OCR du nom de produit depuis la caméra (Haute Vitesse) ──
let ocrWorkerInstance = null;
let ocrWorkerPromise = null;

async function getOcrWorker() {
  if (ocrWorkerInstance) return ocrWorkerInstance;
  if (!ocrWorkerPromise) {
    ocrWorkerPromise = (async () => {
      const { createWorker } = require('tesseract.js');
      const worker = await createWorker('fra+eng');
      ocrWorkerInstance = worker;
      return worker;
    })().catch(err => {
      console.warn('[OCR] Initialisation Worker Tesseract échouée:', err.message);
      ocrWorkerPromise = null;
      ocrWorkerInstance = null;
      return null;
    });
  }
  return ocrWorkerPromise;
}

module.exports = router;
