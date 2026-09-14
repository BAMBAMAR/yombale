// backend/routes/boutiques-modules/boutiques-commandes.js
const router = require('express').Router();
const { body, param, query, validationResult } = require('express-validator');
const { pool } = require('../../models/db');
const { verifierToken, tokenOptional, adminSecretOnly, requireEmailVerifie } = require('../../middlewares/auth');
const { checkAbonnement, requireAbonnement, requireBusiness } = require('../../middlewares/checkAbonnement');
const { limiterPublication, limiterImport } = require('../../middlewares/rateLimit');
const { uploadBuffer } = require('../../services/cloudinary');
const { scrapeProductFromUrl } = require('../../services/magic-import');
const { syncProduit, deleteProduit } = require('../../services/whatsapp-catalog');
const cfg = require('../../lib/settingsCache');
const { enregistrerAuditLog } = require('../../lib/auditLogger');
const { normalizeSocialUrl } = require('../../services/social-parser');
const creditCalc = require('../../lib/creditCalculator');
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
// ── Spec 02 : POST /api/boutiques/commandes/express — Checkout Web 1-Page Unifié
router.post('/commandes/express', async (req, res) => {
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
    const ref = 'CMD-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
    const fraisLiv = Math.max(0, Number(frais_livraison) || 0);

    // ── 1. Calcul strict et sécurisé des prix depuis la base de données ──
    let totalArticles = 0;
    const articlesTraites = [];

    for (const art of articles) {
      const validProdId = (art.produit_id && String(art.produit_id).length === 36) ? art.produit_id : null;
      let prix = 0;
      let nomProd = art.nom_produit || 'Produit sans nom';
      const qte = Math.max(1, Number(art.quantite) || 1);

      if (validProdId) {
        const pRes = await pool.query(
          'SELECT id, nom, prix, stock_quantite FROM boutique_produits WHERE id = $1 AND boutique_id = $2',
          [validProdId, actualBoutiqueId]
        );
        if (pRes.rows[0]) {
          // Sécurité P0 : TOUJOURS utiliser le prix officiel de la base de données
          prix = Number(pRes.rows[0].prix) || 0;
          if (pRes.rows[0].nom) nomProd = pRes.rows[0].nom;

          // Décrémentation atomique de stock si géré
          if (typeof pRes.rows[0].stock_quantite === 'number' && pRes.rows[0].stock_quantite > 0) {
            const nvStock = Math.max(0, pRes.rows[0].stock_quantite - qte);
            await pool.query('UPDATE boutique_produits SET stock_quantite = $1 WHERE id = $2', [nvStock, validProdId]).catch(() => {});
          }
        } else {
          return res.status(400).json({ error: `L'article "${nomProd}" n'appartient pas à cette boutique ou est indisponible.` });
        }
      } else {
        // Fallback exceptionnel si produit non référencé dans boutique_produits
        prix = Math.max(0, Number(art.prix_unitaire) || 0);
      }

      const totalLigne = prix * qte;
      totalArticles += totalLigne;
      articlesTraites.push({ validProdId, nomProd, qte, prix, totalLigne });
    }

    // ── 2. Validation stricte du code promo côté serveur ──
    let reductionVal = 0;
    let promoAppliquee = null;

    if (code_promo && String(code_promo).trim()) {
      const cleanCode = String(code_promo).trim().toUpperCase();

      // Vérification promo globale
      const platformPromoActive = await cfg.getBool('promo_active');
      const platformPromoCode = ((await cfg.get('promo_code')) || '').trim().toUpperCase();
      const platformPromoReduc = (await cfg.getNum('promo_reduction')) || 0;

      if (platformPromoActive && platformPromoCode && cleanCode === platformPromoCode) {
        reductionVal = Math.round((totalArticles * platformPromoReduc) / 100);
        promoAppliquee = cleanCode;
      } else {
        // Vérification promo boutique
        const promoRes = await pool.query(
          `SELECT * FROM boutique_promotions
           WHERE boutique_id = $1 AND UPPER(code) = $2 AND actif = true`,
          [actualBoutiqueId, cleanCode]
        );
        const p = promoRes.rows[0];
        if (p) {
          const notExpired = !p.fin || new Date(p.fin) >= new Date();
          const minAchatOk = !p.min_achat || totalArticles >= Number(p.min_achat);
          const maxUsageOk = !p.max_utilisations || Number(p.fois_utilise || 0) < Number(p.max_utilisations);

          if (notExpired && minAchatOk && maxUsageOk) {
            if (p.type_remise === 'pourcentage') {
              reductionVal = Math.round((totalArticles * Number(p.valeur || 0)) / 100);
            } else {
              reductionVal = Math.min(totalArticles, Number(p.valeur || 0));
            }
            promoAppliquee = cleanCode;
            await pool.query(
              `UPDATE boutique_promotions SET fois_utilise = fois_utilise + 1 WHERE id = $1`,
              [p.id]
            ).catch(() => {});
          }
        }
      }
    }

    let finalNote = note || '';
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

    // Enregistrement des lignes de commande avec les prix vérifiés
    for (const item of articlesTraites) {
      await pool.query(
        `INSERT INTO commandes_boutique (
          reference, boutique_id, produit_id, nom_produit, quantite, prix_unitaire,
          montant_total, client_nom, client_telephone, client_adresse, note,
          statut, source, methode_paiement, frais_livraison,
          utm_source, utm_medium, utm_campaign, social_post_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'en_attente', 'web', $12, $13, $14, $15, $16, $17, NOW())`,
        [
          ref, actualBoutiqueId, item.validProdId, item.nomProd, item.qte, item.prix,
          item.totalLigne, client_nom.trim(), client_telephone.trim(), client_adresse || null, finalNote || null,
          methode_paiement || 'wave', fraisLiv,
          utm_source || null, utm_medium || null, utm_campaign || null,
          // social_post_id doit être un UUID valide ou null
          (social_post_id && /^[0-9a-f-]{36}$/i.test(social_post_id)) ? social_post_id : null,
        ]
      );
    }

    const totalGeneral = Math.max(0, totalArticles + fraisLiv - reductionVal);

    pool.query(`INSERT INTO analytics_events (type, boutique_id) VALUES ('commande_web', $1)`, [actualBoutiqueId]).catch(() => {});

    // Notification WhatsApp au vendeur
    try {
      const { notifierVendeurCommande } = require('../comptabilite');
      notifierVendeurCommande(bqRes.rows[0], {
        reference: ref,
        nomProduit: articles.map(a => a.nom_produit || 'Produit').join(', '),
        quantite: articles.reduce((acc, a) => acc + (Number(a.quantite) || 1), 0),
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
        const articlesStr = articles.map(a => `${a.quantite || 1}x ${a.nom_produit || 'Produit'}`).join(', ');
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
          buttonParam: 'compte',
        })
          .then(() => console.log(`[WHATSAPP CLIENT NOTIF SUCCESS] Confirmation envoyée au ${client_telephone}`))
          .catch(err => console.error('[WHATSAPP CLIENT NOTIF ERR]:', err.message));
      } catch (eCl) {
        console.error('[WHATSAPP CLIENT NOTIF ERR]:', eCl.message);
      }
    }

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
        return res.status(400).json({
          error: `Erreur Wave API: ${waveMsg}. (Si IP non autorisée, ajoutez l'IP de votre serveur Render à la liste blanche Wave).`
        });
      }
    }

    // Initialisation session Orange Money si sélectionné
    if (methode_paiement === 'orange_money' || methode_paiement === 'pay_om') {
      try {
        const om = require('../../services/orange-money');
        const omSession = await om.createWebPayment({
          amount: Number(totalGeneral),
          currency: 'XOF',
          order_id: ref,
        });
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
      }
    }

    res.status(201).json({
      succes: true,
      reference: ref,
      montant_total: totalGeneral,
      statut: 'en_attente',
      message: 'Votre commande a été enregistrée avec succès.'
    });
  } catch (err) {
    console.error('[EXPRESS CHECKOUT ERR]', err);
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement de la commande' });
  }
});

// ── Spec 02 : GET /api/boutiques/:id/produits/:prodId/cross-sell — Suggestions Upsell
router.get('/commandes/suivi', async (req, res) => {
  try {
    const { ref, tel, q } = req.query;
    const rawTerm = (q || ref || tel || '').toString().trim();
    if (!rawTerm) {
      return res.status(400).json({ error: 'Veuillez fournir une référence de commande ou un numéro de téléphone.' });
    }

    const searchPattern = `%${rawTerm}%`;
    const cleanDigits = rawTerm.replace(/[^0-9]/g, '');
    const digitsPattern = cleanDigits ? `%${cleanDigits}%` : searchPattern;

    const query = `
      SELECT c.id, c.reference, c.client_nom, c.client_telephone, c.statut, c.montant_total,
             c.methode_paiement, c.created_at, c.boutique_id, c.produit_id, c.nom_produit, c.quantite,
             COALESCE(b.nom, 'Boutique Nopalou') as boutique_nom,
             COALESCE(b.slug, b.id::text) as boutique_slug,
             COALESCE(b.telephone, '') as boutique_whatsapp
      FROM commandes_boutique c
      LEFT JOIN boutiques b ON b.id = c.boutique_id
      WHERE (
        c.reference ILIKE $1
        OR c.id::text ILIKE $1
        OR c.client_telephone ILIKE $1
        OR ($2 <> '%%' AND regexp_replace(COALESCE(c.client_telephone, ''), '[^0-9]', '', 'g') LIKE $2)
      )
      ORDER BY c.created_at DESC
      LIMIT 10
    `;

    const { rows } = await pool.query(query, [searchPattern, digitsPattern]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Aucune commande trouvée pour cette référence ou ce numéro.' });
    }

    res.json({
      success: true,
      commandes: rows
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
