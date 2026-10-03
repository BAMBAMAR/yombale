// backend/services/commande-service.js — Logique métier de gestion et notification des commandes boutique
// Extrait de routes/comptabilite.js pour casser l'inversion de dépendance avec services/whatsapp-chatbot.js

const { pool } = require('../models/db');
const { sendWhatsAppNotification } = require('./whatsapp');
const notificationEnvois = require('./notification-envois');

const STATUTS_VALIDES = ['en_attente', 'confirmee', 'en_preparation', 'expediee', 'livree', 'annulee'];

// Le libellé agrégé d'une commande contient déjà les quantités (« 2x Robe, 1x Boubou ») : on n'y ajoute pas
// « × quantité totale » (AUD-101 : « 2x Robe × 2 », « 2x Robe, 1x Boubou × 3 »).
function libelleProduit(nomProduit, quantite) {
  return /^\d+x\s/.test(String(nomProduit || '')) ? String(nomProduit) : `${nomProduit} × ${quantite}`;
}

function genRefCommande() {
  // Suffixe aléatoire : deux commandes créées dans la même milliseconde ne doivent pas se heurter à UNIQUE(reference)
  const suffixe = require('crypto').randomBytes(2).toString('hex').toUpperCase();
  return `C-${Date.now().toString(36).toUpperCase()}${suffixe}`;
}

// Construit et envoie le message WhatsApp de notification au vendeur.
// Extrait de creerCommandeBoutique pour permettre à un appelant (ex: panier
// multi-articles) de notifier une seule fois après plusieurs insertions.
async function notifierVendeurCommande(boutique, {
  reference, nomProduit, quantite, montantTotal, fraisLivraison,
  methodePaiement, clientNom, clientTelephone, clientAdresse, note, zoneNom = null,
}) {
  let vendeurTel = boutique.whatsapp || boutique.telephone;

  // Repli sur le téléphone de l'utilisateur propriétaire de la boutique si manquant sur la boutique
  if (!vendeurTel && boutique.utilisateur_id) {
    try {
      const uRes = await pool.query('SELECT telephone FROM utilisateurs WHERE id=$1', [boutique.utilisateur_id]);
      if (uRes.rows[0]?.telephone) vendeurTel = uRes.rows[0].telephone;
    } catch (eU) {}
  }

  if (!vendeurTel) {
    console.warn(`[WHATSAPP NOTIF VENDEUR] ⚠️ Impossible d'envoyer la notif : Aucun téléphone/whatsapp configuré pour la boutique "${boutique.nom}"`);
    try {
      await pool.query(
        `UPDATE commandes_boutique SET note = COALESCE(note, '') || ' [Notif vendeur impossible: absence de numéro]' WHERE reference = $1`,
        [reference]
      );
    } catch (_) {}
    return;
  }

  const methodeLabel = { wave: 'Wave', orange_money: 'Orange Money', cash: 'Espèces', virement: 'Virement', credit: '💳 Demande d\'Achat à Crédit (Carnet client)' };
  const isCredit = methodePaiement === 'credit';
  const SITE = process.env.FRONTEND_URL || 'https://nopalou.com';
  const bRef = boutique.slug || boutique.id;
  const lienCommandes = bRef ? `${SITE}/boutique?manage=${bRef}&tab=commandes&ref=${encodeURIComponent(reference)}` : `${SITE}/boutique?tab=commandes&ref=${encodeURIComponent(reference)}`;
  const btnParam = bRef ? `boutique?manage=${bRef}&tab=commandes` : 'boutique?tab=commandes';
  const montantFmt = new Intl.NumberFormat('fr-FR').format(montantTotal);
  // AUD-045 : la variable `commande` n'existe pas dans cette fonction (ReferenceError), ce qui empêchait toute
  // notification vendeur pour les commandes sans frais de livraison. Le nom de zone est désormais un paramètre.
  const zoneTxt = String(zoneNom || '').toLowerCase();
  const isAConvenir = (!fraisLivraison || fraisLivraison === 0) && (
    (note && (note.includes('À convenir') || note.includes('a convenir'))) ||
    zoneTxt.includes('convenir')
  );
  const isRetrait = (!fraisLivraison || fraisLivraison === 0) && (
    (note && note.toLowerCase().includes('retrait')) ||
    zoneTxt.includes('retrait') ||
    (clientAdresse && clientAdresse.toLowerCase().includes('retrait'))
  );

  let ligneLivraison = '';
  if (fraisLivraison > 0) {
    ligneLivraison = `🚚 Livraison : ${new Intl.NumberFormat('fr-FR').format(fraisLivraison)} FCFA\n`;
  } else if (isRetrait) {
    ligneLivraison = `🏬 Mode : Retrait gratuit en boutique\n`;
  } else if (isAConvenir) {
    ligneLivraison = `🚚 Livraison : ⚠️ *Frais à convenir avec le client*\n`;
  }

  const cleanTelClient = String(clientTelephone || '').replace(/\D/g, '');
  const telClientWa = cleanTelClient.length === 9 ? `221${cleanTelClient}` : cleanTelClient;
  const ctaAConvenir = (isAConvenir && telClientWa)
    ? `💬 *Convenir du transport avec le client sur WhatsApp :*\n👉 https://wa.me/${telClientWa}\n\n`
    : '';

  const msg = `${isCredit ? '🚨 *Demande d\'achat à crédit (Carnet)*' : '🛒 *Nouvelle commande*'} — *${boutique.nom}*\n\n` +
    `Réf : *${reference}*\n` +
    `Produit : ${libelleProduit(nomProduit, quantite)}\n` +
    (montantTotal > 0 ? `Montant : *${montantFmt} FCFA*${isAConvenir ? ' (+ livraison à part)' : ''}\n` : '') +
    ligneLivraison +
    `💳 Paiement souhaité : ${methodeLabel[methodePaiement] || methodePaiement}\n\n` +
    `👤 Client : ${clientNom}\n` +
    `📞 ${clientTelephone}${clientAdresse ? `\n📍 ${clientAdresse}` : ''}${note ? `\n📝 ${note}` : ''}\n\n` +
    ctaAConvenir +
    `👉 *Consultez vos commandes ici :*\n${lienCommandes}\n\n` +
    `⚡ Répondez vite pour confirmer !`;

  const titleTpl = (isCredit ? `🚨 Achat Crédit (Carnet) — ${boutique.nom}` : `🛒 Nouvelle commande — ${boutique.nom}`).slice(0, 60);
  // Le template Meta 'nopalou_fiche_texte' autorise jusqu'à 1000 caractères dans le paramètre detail.
  // On y intègre l'ensemble des coordonnées client (Nom, Tel, Adresse, Paiement) pour que le commerçant
  // dispose de TOUTES les informations vitales même en dehors de la fenêtre 24h Meta sans avoir à écrire au bot.
  const payLabel = methodeLabel[methodePaiement] || methodePaiement || 'Wave';
  const detailTpl = `Réf ${reference} — ${libelleProduit(nomProduit, quantite)}${montantTotal > 0 ? ` (${montantFmt} FCFA)` : ''}\n` +
    `👤 Client : ${clientNom || 'Client'}\n` +
    `📞 Tél : ${clientTelephone || 'Non renseigné'}` +
    (clientAdresse ? `\n📍 Adresse : ${clientAdresse}` : '') +
    `\n💳 Paiement : ${payLabel}` +
    (fraisLivraison > 0 ? ` | Livr: ${new Intl.NumberFormat('fr-FR').format(fraisLivraison)} F` : isRetrait ? ' | Retrait magasin' : isAConvenir ? ' | Livr: À convenir' : '');

  // Contenu du repli e-mail / SMS, si Meta refuse ou n'accuse pas réception (voir notification-envois.js)
  const payloadRepli = {
    utilisateur_id: boutique.utilisateur_id || null,
    boutique_id: boutique.id || null,
    titre: isCredit ? 'Demande d\'achat à crédit' : 'Nouvelle commande',
    resume: `${boutique.nom}\nRéf ${reference} : ${libelleProduit(nomProduit, quantite)}${montantTotal > 0 ? ` (${montantFmt} FCFA)` : ''}\nClient : ${clientNom || 'Client'} ${clientTelephone || ''}`.trim(),
    lien: lienCommandes,
    lienChemin: bRef ? `/boutique?manage=${bRef}&tab=commandes&ref=${encodeURIComponent(reference)}` : `/boutique?tab=commandes&ref=${encodeURIComponent(reference)}`,
  };

  sendWhatsAppNotification(vendeurTel, {
    textMessage: msg,
    title: titleTpl,
    montant: `${montantFmt} FCFA`,
    detail: detailTpl.slice(0, 1000),
    url: lienCommandes,
    buttonParam: btnParam,
    type: 'commande',
  })
    .then(async (res) => {
      // AUD-102 : sendWhatsAppNotification ne rejette pas en cas d'échec (elle renvoie null après l'échec du
      // modèle et du repli SMS). Seule une réponse porteuse d'un identifiant de message prouve l'envoi.
      const wamid = res?.messages?.[0]?.id;
      const livree = Boolean(res && res.success !== false && (wamid || res.fallback_sms));
      if (!livree) throw new Error('Notification non délivrée (modèle et repli SMS en échec)');
      console.log(`[WHATSAPP VENDEUR NOTIF SUCCESS] Notification commande ${reference} acceptée pour ${vendeurTel}`);
      if (res.fallback_sms) {
        try {
          await pool.query(
            `UPDATE commandes_boutique SET note = COALESCE(note, '') || ' [Notif vendeur transmise par SMS]' WHERE reference = $1`,
            [reference]
          );
        } catch (_) {}
        return;
      }
      // Meta a ACCEPTÉ le message ; il peut encore le refuser par webhook (facture Meta impayée, numéro hors
      // WhatsApp...). La mention « transmise » n'est écrite qu'à l'accusé « delivered » (notification-envois.js) et
      // un échec ou un silence déclenche le repli e-mail / SMS.
      await notificationEnvois.enregistrerEnvoi({
        wamid,
        type: 'commande',
        referenceId: reference,
        destinataire: vendeurTel,
        boutiqueId: boutique.id,
        payload: payloadRepli,
      });
    })
    .catch(async (err) => {
      console.error(`[WHATSAPP VENDEUR NOTIF ERR]:`, err.message);
      try {
        await pool.query(
          `UPDATE commandes_boutique SET note = COALESCE(note, '') || ' [Échec Notif WhatsApp: ' || $1 || ']' WHERE reference = $2`,
          [err.message.slice(0, 80), reference]
        );
        await pool.query(
          `INSERT INTO notification_echecs (type, reference_id, erreur) VALUES ($1, $2, $3)`,
          ['notif_vendeur_commande', reference, err.message.slice(0, 300)]
        );
      } catch (_) {}
      // Échec immédiat (modèle refusé et SMS impossible) : l'e-mail est le dernier canal disponible.
      try {
        const envoi = await pool.query(
          `INSERT INTO notification_envois (wamid, type, reference_id, destinataire, boutique_id, statut, erreur, payload)
           VALUES (NULL, 'commande', $1, $2, $3, 'echec', $4, $5) RETURNING *`,
          [reference, vendeurTel, boutique.id ? String(boutique.id) : null, err.message.slice(0, 300), JSON.stringify(payloadRepli)]
        );
        await notificationEnvois.declencherRepli(envoi.rows[0], { motif: err.message, avecSms: false });
      } catch (eRepli) {
        console.error('[NOTIF REPLI] impossible après échec immédiat:', eRepli.message);
      }
    });
}

// Logique de création de commande, partagée entre la route HTTP publique
// (POST /:boutiqueId/commandes, source='web') et le chatbot WhatsApp (source='whatsapp').
// Lève une erreur avec .status (404/400/409) et .message (message utilisateur) en cas d'échec.
// N'envoie PAS de notification elle-même — l'appelant appelle notifierVendeurCommande()
// séparément (permet de grouper la notification pour un panier multi-articles).
// AUD-073/074/075/076 : prix, disponibilité, stock et variantes sont résolus CÔTÉ SERVEUR dans la transaction,
// sous verrou de ligne. Un article sans produit valide de la boutique est refusé (le prix ne vient jamais du client).
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function erreurCommande(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

async function creerCommandeBoutique({
  boutiqueId, produitId, quantite = 1, clientNom, clientTelephone, clientAdresse,
  note, source = 'web', methodePaiement = 'wave', zoneLivraisonId,
  nomProduitManuel, groupeCommande, items = [], varianteId,
  codePromo, formuleEchelonnement,
  utm_source, utm_medium, utm_campaign, social_post_id,
  idempotencyKey,
}) {
  const bQuery = 'SELECT id, nom, slug, telephone, whatsapp, utilisateur_id, actif FROM boutiques WHERE (id::text = $1 OR slug = $1)';
  const { rows: [boutique] } = await pool.query(bQuery, [boutiqueId]);
  if (!boutique) throw erreurCommande(404, 'Boutique introuvable');
  if (boutique.actif === false) throw erreurCommande(409, 'Cette boutique n\'accepte pas de commandes pour le moment.');

  const actualBoutiqueId = boutique.id;
  let fraisLivraison = 0;

  // AUD-095 : une commande passée hors-ligne (ou renvoyée après réponse perdue) porte une clé d'idempotence ;
  // la même clé retrouve la commande existante au lieu d'en créer une seconde (et de redécrémenter le stock).
  const cleIdem = typeof idempotencyKey === 'string' && idempotencyKey.length > 0 && idempotencyKey.length <= 128 ? idempotencyKey : null;
  if (cleIdem) {
    const { rows: [deja] } = await pool.query('SELECT * FROM commandes_boutique WHERE boutique_id = $1 AND idempotency_key = $2 LIMIT 1', [actualBoutiqueId, cleIdem]);
    if (deja) return { commande: deja, boutique, doublon: true };
  }

  const validZoneId = (zoneLivraisonId && UUID_RE.test(String(zoneLivraisonId))) ? zoneLivraisonId : null;
  if (validZoneId) {
    const { rows: [zone] } = await pool.query(
      'SELECT prix, nom FROM zones_livraison WHERE id = $1 AND boutique_id = $2',
      [validZoneId, actualBoutiqueId]
    );
    if (zone) fraisLivraison = Number(zone.prix);
  }

  // Validation stricte anti-panier vide
  const hasItems = Array.isArray(items) && items.length > 0;
  if (!hasItems && !produitId) {
    throw erreurCommande(400, 'Au moins un article ou produit est requis pour passer commande');
  }

  // Normalisation : seuls l'identifiant produit, la variante et la quantité viennent du client
  const demandes = hasItems
    ? items.map(it => ({
        produit_id: it.produit_id || it.id || null,
        variante_id: it.variante_id || null,
        details_variante: it.details_variante ? String(it.details_variante).slice(0, 255) : null,
        quantite: Math.min(1000, Math.max(1, parseInt(it.quantite, 10) || 1)),
      }))
    : [{ produit_id: produitId, variante_id: varianteId || null, details_variante: null, quantite: Math.min(1000, Math.max(1, parseInt(quantite, 10) || 1)) }];

  // Client bloqué pour les achats à crédit
  if (methodePaiement === 'credit') {
    const cleanTel = String(clientTelephone || '').replace(/\D/g, '');
    const shortTel = cleanTel.length >= 9 ? cleanTel.slice(-9) : cleanTel;
    if (shortTel || clientNom) {
      const blackRes = await pool.query(
        `SELECT id, statut, nom FROM caisse_clients_credits
         WHERE boutique_id = $1
           AND statut = 'bloque'
           AND (
             ($2::text != '' AND REPLACE(REPLACE(telephone, ' ', ''), '+', '') LIKE '%' || $2)
             OR ($3::text != '' AND LOWER(TRIM(nom)) = LOWER(TRIM($3)))
           )
         LIMIT 1`,
        [actualBoutiqueId, shortTel, (clientNom || '').trim()]
      );
      if (blackRes.rows[0]) throw erreurCommande(400, '⛔ Votre compte est actuellement bloqué par la boutique pour les achats à crédit.');
    }
  }

  const validSocialPostId = (social_post_id && UUID_RE.test(String(social_post_id))) ? social_post_id : null;

  // ── Mode transactionnel ACID ───────────────────────────────────────────────
  // Utilise un client dédié de transaction si pool.connect existe (PostgreSQL réel).
  // Retombe gracieusement sur pool pour les suites de tests unitaires mockées en mémoire.
  const hasDedicatedClient = typeof pool.connect === 'function';
  const client = hasDedicatedClient ? await pool.connect() : pool;
  let inTransaction = false;

  try {
    if (hasDedicatedClient) {
      await client.query('BEGIN');
      inTransaction = true;
    }

    // 1. Résolution serveur des lignes (prix, disponibilité, variante) + décrément de stock sous verrou
    const lignes = [];
    for (const d of demandes) {
      if (!d.produit_id || !UUID_RE.test(String(d.produit_id))) {
        throw erreurCommande(400, 'Un article du panier n\'est pas un produit valide de cette boutique.');
      }
      const { rows: [p] } = await client.query(
        `SELECT id, nom, prix, prix_achat, stock_quantite, en_stock, statut_moderation
           FROM boutique_produits WHERE id = $1 AND boutique_id = $2 FOR UPDATE`,
        [d.produit_id, actualBoutiqueId]
      );
      if (!p) throw erreurCommande(400, 'Un article du panier n\'est pas un produit valide de cette boutique.');
      if (p.statut_moderation && p.statut_moderation !== 'actif') {
        throw erreurCommande(409, `"${p.nom}" n'est plus disponible à la vente.`);
      }
      if (p.stock_quantite === null && p.en_stock === false) {
        throw erreurCommande(409, `"${p.nom}" est en rupture de stock.`);
      }

      let prix = Number(p.prix);
      let detailsVariante = d.details_variante;
      let varianteId2 = null;
      if (d.variante_id) {
        if (!UUID_RE.test(String(d.variante_id))) throw erreurCommande(400, `Variante invalide pour "${p.nom}".`);
        const { rows: [v] } = await client.query(
          `SELECT id, prix, stock_quantite, attributs FROM boutique_produit_variantes
            WHERE id = $1 AND produit_id = $2 AND boutique_id = $3 AND actif = true FOR UPDATE`,
          [d.variante_id, p.id, actualBoutiqueId]
        );
        if (!v) throw erreurCommande(400, `Variante indisponible pour "${p.nom}".`);
        varianteId2 = v.id;
        if (v.prix !== null && Number(v.prix) > 0) prix = Number(v.prix);
        if (v.stock_quantite !== null && Number(v.stock_quantite) < d.quantite) {
          throw erreurCommande(409, `Stock insuffisant pour "${p.nom}" (disponible : ${v.stock_quantite}, demandé : ${d.quantite}).`);
        }
        if (!detailsVariante && v.attributs && typeof v.attributs === 'object') {
          detailsVariante = Object.values(v.attributs).join(' / ').slice(0, 255) || null;
        }
        await client.query(
          'UPDATE boutique_produit_variantes SET stock_quantite = stock_quantite - $1 WHERE id = $2 AND stock_quantite IS NOT NULL',
          [d.quantite, v.id]
        );
      }
      if (!Number.isFinite(prix) || prix <= 0) {
        throw erreurCommande(409, `Le prix de "${p.nom}" n'est pas défini : commande impossible.`);
      }
      if (p.stock_quantite !== null) {
        if (Number(p.stock_quantite) < d.quantite) {
          throw erreurCommande(409, `Stock insuffisant pour "${p.nom}" (disponible : ${p.stock_quantite}, demandé : ${d.quantite}).`);
        }
        await client.query(
          `UPDATE boutique_produits
              SET stock_quantite = stock_quantite - $1,
                  en_stock = CASE WHEN stock_quantite - $1 <= 0 THEN false ELSE en_stock END
            WHERE id = $2 AND boutique_id = $3`,
          [d.quantite, p.id, actualBoutiqueId]
        );
      }
      lignes.push({
        produit_id: p.id, variante_id: varianteId2, nom_produit: p.nom,
        details_variante: detailsVariante, prix_unitaire: prix,
        prix_achat: p.prix_achat != null ? Number(p.prix_achat) : null, quantite: d.quantite,
      });
    }

    const sousTotal = lignes.reduce((acc, it) => acc + (it.prix_unitaire * it.quantite), 0);
    const totalQuantite = lignes.reduce((acc, it) => acc + it.quantite, 0);

    // 2. Code promo : toujours recalculé côté serveur (existence, actif, dates, quota, minimum d'achat)
    let reductionVal = 0;
    let promoValidee = null;
    if (codePromo && String(codePromo).trim()) {
      const codeUp = String(codePromo).trim().toUpperCase();
      const { rows: [promo] } = await client.query(
        `SELECT * FROM boutique_promotions WHERE boutique_id = $1 AND UPPER(code) = $2 AND actif = true FOR UPDATE`,
        [actualBoutiqueId, codeUp]
      );
      if (promo) {
        const expiree = promo.fin && new Date(promo.fin) < new Date();
        const quotaAtteint = promo.limite_utilisation !== null && promo.limite_utilisation !== undefined && Number(promo.fois_utilise || 0) >= Number(promo.limite_utilisation);
        const minAchatOk = !promo.min_achat || sousTotal >= Number(promo.min_achat);
        if (!expiree && !quotaAtteint && minAchatOk) {
          if (promo.type_remise === 'pourcentage') {
            reductionVal = Math.round((sousTotal * Number(promo.valeur)) / 100);
          } else if (promo.type_remise === 'fixe') {
            reductionVal = Math.min(sousTotal, Number(promo.valeur));
          } else if (promo.type_remise === 'livraison_offerte') {
            reductionVal = Math.min(fraisLivraison, Number(promo.valeur) || fraisLivraison);
          }
          reductionVal = Math.max(0, Math.round(reductionVal));
          if (reductionVal > 0) promoValidee = promo;
        }
      }
    }

    const montantTotal = Math.max(0, sousTotal + fraisLivraison - reductionVal);
    const nomProduitGlobal = lignes.map(it => `${it.quantite}x ${it.nom_produit}${it.details_variante ? ` (${it.details_variante})` : ''}`).join(', ');

    // 3. Anti double-soumission (5 s) : même boutique, même téléphone, mêmes articles et même montant
    //    (AUD-086 : deux commandes de produits différents au même montant ne sont plus fusionnées)
    if (clientTelephone) {
      const existingCmd = await client.query(
        `SELECT * FROM commandes_boutique
          WHERE boutique_id = $1 AND client_telephone = $2 AND montant_total = $3 AND nom_produit = $4
            AND created_at >= NOW() - INTERVAL '5 seconds'
          LIMIT 1`,
        [actualBoutiqueId, clientTelephone, montantTotal, nomProduitGlobal.slice(0, 300)]
      );
      if (existingCmd.rows[0]) {
        console.warn(`[IDEMPOTENCE COMMANDE] Double soumission bloquée (ref existante: ${existingCmd.rows[0].reference})`);
        if (inTransaction) { await client.query('ROLLBACK'); inTransaction = false; }
        return { commande: existingCmd.rows[0], boutique, doublon: true };
      }
    }

    let finalNote = note || '';
    if (formuleEchelonnement && typeof formuleEchelonnement === 'object') {
      const apportFmt = formuleEchelonnement.apport ? `${formuleEchelonnement.apport} FCFA` : '0 FCFA';
      const echelonNote = `[Échelonnement: Apport ${apportFmt}, ${formuleEchelonnement.nb_echeances || 3}x (${formuleEchelonnement.frequence || 'mensuel'})]`;
      finalNote = finalNote ? `${finalNote} | ${echelonNote}` : echelonNote;
    }
    if (promoValidee) {
      const promoNote = `[Code Promo: ${String(promoValidee.code).toUpperCase()} (-${reductionVal} FCFA)]`;
      finalNote = finalNote ? `${finalNote} | ${promoNote}` : promoNote;
      await client.query(`UPDATE boutique_promotions SET fois_utilise = fois_utilise + 1 WHERE id = $1`, [promoValidee.id]);
    }

    // AUD-101 : prix_unitaire est un prix d'UNE unité (prix moyen pondéré si plusieurs lignes), jamais le total de
    // la ligne ou du panier ; le détail exact par article est dans commandes_boutique_items.
    const prixUnitaireMoyen = totalQuantite > 0 ? Math.round((sousTotal / totalQuantite) * 100) / 100 : sousTotal;

    const ref = genRefCommande();
    const { rows: [commande] } = await client.query(
      `INSERT INTO commandes_boutique
         (reference, boutique_id, produit_id, nom_produit, quantite, prix_unitaire, montant_total,
          client_nom, client_telephone, client_adresse, note, source, methode_paiement, zone_livraison_id, frais_livraison, groupe_commande,
          utm_source, utm_medium, utm_campaign, social_post_id, idempotency_key)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21) RETURNING *`,
      [ref, actualBoutiqueId, lignes[0].produit_id, nomProduitGlobal.slice(0, 300), totalQuantite, prixUnitaireMoyen, montantTotal,
       clientNom, clientTelephone, clientAdresse || null, finalNote || null, source,
       methodePaiement, validZoneId, fraisLivraison, groupeCommande || null,
       utm_source || null, utm_medium || null, utm_campaign || null, validSocialPostId, cleIdem]
    );

    for (const it of lignes) {
      await client.query(
        `INSERT INTO commandes_boutique_items
           (commande_id, boutique_id, produit_id, variante_id, nom_produit, details_variante, prix_unitaire, prix_achat, quantite, montant_total)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [commande.id, actualBoutiqueId, it.produit_id, it.variante_id, it.nom_produit, it.details_variante, it.prix_unitaire, it.prix_achat, it.quantite, it.prix_unitaire * it.quantite]
      );
    }

    if (inTransaction) {
      await client.query('COMMIT');
      inTransaction = false;
    }

    // Télémétrie non-bloquante. Volontairement NON attendue : la connexion de transaction est encore détenue ici
    // (libérée dans `finally`), et attendre une seconde connexion du pool sous charge provoque un interblocage du pool
    // (AUD-082 : 60 commandes simultanées => 32 erreurs 500 « timeout exceeded when trying to connect »).
    pool.query(
      `INSERT INTO analytics_events (type, boutique_id) VALUES ('commande_web', $1)`,
      [actualBoutiqueId]
    ).catch(() => {});

    return { commande, boutique };
  } catch (err) {
    if (inTransaction) {
      await client.query('ROLLBACK').catch(() => {});
    }
    throw err;
  } finally {
    if (hasDedicatedClient && typeof client.release === 'function') {
      client.release();
    }
  }
}

// AUD-010 : annule une commande en ligne jamais payée et restitue son stock, de façon atomique et idempotente.
// Ne touche JAMAIS une commande déjà payée ou déjà traitée (statut différent de `en_attente`).
// Renvoie true si la commande a été annulée, false sinon.
async function annulerCommandeNonPayee(reference, motif = 'paiement non abouti') {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: [cmd] } = await client.query(
      `SELECT id, boutique_id, produit_id, quantite, statut, paiement_recu
         FROM commandes_boutique WHERE reference = $1 FOR UPDATE`,
      [reference]
    );
    if (!cmd || cmd.paiement_recu === true || cmd.statut !== 'en_attente') {
      await client.query('ROLLBACK');
      return false;
    }

    const { rows: items } = await client.query(
      `SELECT produit_id, variante_id, quantite FROM commandes_boutique_items WHERE commande_id = $1`,
      [cmd.id]
    );
    // Commandes historiques sans lignes détaillées : la ligne unique porte produit et quantité
    const lignes = items.length
      ? items
      : (cmd.produit_id ? [{ produit_id: cmd.produit_id, variante_id: null, quantite: cmd.quantite }] : []);

    for (const l of lignes) {
      const qte = Math.max(0, parseInt(l.quantite, 10) || 0);
      if (!qte) continue;
      if (l.produit_id) {
        await client.query(
          `UPDATE boutique_produits
              SET stock_quantite = stock_quantite + $1,
                  en_stock = CASE WHEN stock_quantite + $1 > 0 THEN true ELSE en_stock END
            WHERE id = $2 AND boutique_id = $3 AND stock_quantite IS NOT NULL`,
          [qte, l.produit_id, cmd.boutique_id]
        );
      }
      if (l.variante_id) {
        await client.query(
          `UPDATE boutique_produit_variantes SET stock_quantite = stock_quantite + $1
            WHERE id = $2 AND boutique_id = $3`,
          [qte, l.variante_id, cmd.boutique_id]
        );
      }
    }

    await client.query(
      `UPDATE commandes_boutique
          SET statut = 'annulee', updated_at = NOW(),
              note = COALESCE(note || ' | ', '') || $2
        WHERE id = $1`,
      [cmd.id, `[Annulée automatiquement : ${String(motif).slice(0, 120)}]`]
    );
    await client.query('COMMIT');
    return true;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

// Annule en lot les commandes en ligne à paiement numérique restées impayées au-delà du délai.
// Utilisé par le cron `cron-commandes-impayees`. Renvoie le nombre de commandes annulées.
async function annulerCommandesImpayeesExpirees({ delaiHeures = 2 } = {}) {
  const { rows } = await pool.query(
    `SELECT reference FROM commandes_boutique
      WHERE statut = 'en_attente' AND COALESCE(paiement_recu, false) = false
        AND methode_paiement IN ('wave','pay_wave','orange_money','pay_om','carte_bancaire','stripe','card')
        AND created_at < NOW() - ($1::text || ' hours')::interval
      ORDER BY created_at ASC LIMIT 200`,
    [String(delaiHeures)]
  );
  let annulees = 0;
  for (const r of rows) {
    try {
      if (await annulerCommandeNonPayee(r.reference, `paiement non reçu sous ${delaiHeures} h`)) annulees++;
    } catch (e) {
      console.error('[CRON COMMANDES IMPAYEES] échec annulation', r.reference, e.message);
    }
  }
  return annulees;
}

module.exports = {
  STATUTS_VALIDES,
  genRefCommande,
  notifierVendeurCommande,
  creerCommandeBoutique,
  annulerCommandeNonPayee,
  annulerCommandesImpayeesExpirees,
};
