// backend/services/commande-service.js — Logique métier de gestion et notification des commandes boutique
// Extrait de routes/comptabilite.js pour casser l'inversion de dépendance avec services/whatsapp-chatbot.js

const { pool } = require('../models/db');
const { sendWhatsAppNotification } = require('./whatsapp');

const STATUTS_VALIDES = ['en_attente', 'confirmee', 'en_preparation', 'expediee', 'livree', 'annulee'];

function genRefCommande() {
  return `C-${Date.now().toString(36).toUpperCase()}`;
}

// Construit et envoie le message WhatsApp de notification au vendeur.
// Extrait de creerCommandeBoutique pour permettre à un appelant (ex: panier
// multi-articles) de notifier une seule fois après plusieurs insertions.
async function notifierVendeurCommande(boutique, {
  reference, nomProduit, quantite, montantTotal, fraisLivraison,
  methodePaiement, clientNom, clientTelephone, clientAdresse, note,
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
        `UPDATE commandes_boutique SET notes = COALESCE(notes, '') || ' [Notif vendeur impossible: absence de numéro]' WHERE reference = $1`,
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
  const msg = `${isCredit ? '🚨 *Demande d\'achat à crédit (Carnet)*' : '🛒 *Nouvelle commande*'} — *${boutique.nom}*\n\n` +
    `Réf : *${reference}*\n` +
    `Produit : ${nomProduit} × ${quantite}\n` +
    (montantTotal > 0 ? `Montant : *${montantFmt} FCFA*\n` : '') +
    (fraisLivraison > 0 ? `Livraison : ${new Intl.NumberFormat('fr-FR').format(fraisLivraison)} FCFA\n` : '') +
    `💳 Paiement souhaité : ${methodeLabel[methodePaiement] || methodePaiement}\n\n` +
    `👤 Client : ${clientNom}\n` +
    `📞 ${clientTelephone}${clientAdresse ? `\n📍 ${clientAdresse}` : ''}${note ? `\n📝 ${note}` : ''}\n\n` +
    `👉 *Consultez vos commandes ici :*\n${lienCommandes}\n\n` +
    `⚡ Répondez vite pour confirmer !`;

  const titleTpl = (isCredit ? `🚨 Achat Crédit (Carnet) — ${boutique.nom}` : `🛒 Nouvelle commande — ${boutique.nom}`).slice(0, 60);
  // Le template Meta 'nopalou_fiche_texte' autorise jusqu'à 1000 caractères dans le paramètre detail.
  // On y intègre l'ensemble des coordonnées client (Nom, Tel, Adresse, Paiement) pour que le commerçant
  // dispose de TOUTES les informations vitales même en dehors de la fenêtre 24h Meta sans avoir à écrire au bot.
  const payLabel = methodeLabel[methodePaiement] || methodePaiement || 'Wave';
  const detailTpl = `Réf ${reference} — ${nomProduit} × ${quantite}${montantTotal > 0 ? ` (${montantFmt} FCFA)` : ''}\n` +
    `👤 Client : ${clientNom || 'Client'}\n` +
    `📞 Tél : ${clientTelephone || 'Non renseigné'}` +
    (clientAdresse ? `\n📍 Adresse : ${clientAdresse}` : '') +
    `\n💳 Paiement : ${payLabel}` +
    (fraisLivraison > 0 ? ` | Livr: ${new Intl.NumberFormat('fr-FR').format(fraisLivraison)} F` : '');

  sendWhatsAppNotification(vendeurTel, {
    textMessage: msg,
    title: titleTpl,
    montant: `${montantFmt} FCFA`,
    detail: detailTpl.slice(0, 1000),
    url: lienCommandes,
    buttonParam: btnParam,
    type: 'commande',
  })
    .then(async () => {
      console.log(`[WHATSAPP VENDEUR NOTIF SUCCESS] Notification commande ${reference} envoyée à ${vendeurTel}`);
      try {
        await pool.query(
          `UPDATE commandes_boutique SET notes = COALESCE(notes, '') || ' [Notif WhatsApp vendeur transmise]' WHERE reference = $1`,
          [reference]
        );
      } catch (_) {}
    })
    .catch(async (err) => {
      console.error(`[WHATSAPP VENDEUR NOTIF ERR]:`, err.message);
      try {
        await pool.query(
          `UPDATE commandes_boutique SET notes = COALESCE(notes, '') || ' [Échec Notif WhatsApp: ' || $1 || ']' WHERE reference = $2`,
          [err.message.slice(0, 80), reference]
        );
      } catch (_) {}
    });
}

// Logique de création de commande, partagée entre la route HTTP publique
// (POST /:boutiqueId/commandes, source='web') et le chatbot WhatsApp (source='whatsapp').
// Lève une erreur avec .status (404/400) et .message (message utilisateur) en cas d'échec.
// N'envoie PAS de notification elle-même — l'appelant appelle notifierVendeurCommande()
// séparément (permet de grouper la notification pour un panier multi-articles).
async function creerCommandeBoutique({
  boutiqueId, produitId, quantite = 1, clientNom, clientTelephone, clientAdresse,
  note, source = 'web', methodePaiement = 'wave', zoneLivraisonId,
  nomProduitManuel, prixUnitaireManuel, groupeCommande, items = [], varianteId,
  codePromo, montantReduction, formuleEchelonnement,
  utm_source, utm_medium, utm_campaign, social_post_id,
}) {
  const bQuery = 'SELECT id, nom, slug, telephone, whatsapp, utilisateur_id FROM boutiques WHERE (id::text = $1 OR slug = $1)';
  const { rows: [boutique] } = await pool.query(bQuery, [boutiqueId]);
  if (!boutique) {
    const e = new Error('Boutique introuvable');
    e.status = 404;
    throw e;
  }

  const actualBoutiqueId = boutique.id;
  let fraisLivraison = 0;

  const validZoneId = (zoneLivraisonId && String(zoneLivraisonId).length === 36 && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(zoneLivraisonId)) ? zoneLivraisonId : null;
  const validProduitId = (produitId && String(produitId).length === 36 && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(produitId)) ? produitId : null;
  const validVarianteId = (varianteId && String(varianteId).length === 36 && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(varianteId)) ? varianteId : null;

  if (validZoneId) {
    const { rows: [zone] } = await pool.query(
      'SELECT prix, nom FROM zones_livraison WHERE id = $1 AND boutique_id = $2',
      [validZoneId, actualBoutiqueId]
    );
    if (zone) fraisLivraison = Number(zone.prix);
  }

  // Validation stricte anti-panier vide (P0)
  const hasItems = Array.isArray(items) && items.length > 0;
  if (!hasItems && !produitId && !nomProduitManuel) {
    const e = new Error('Au moins un article ou produit est requis pour passer commande');
    e.status = 400;
    throw e;
  }

  // Normalisation des articles de commande (multi-articles ou article unique)
  let normalizedItems = [];
  if (hasItems) {
    normalizedItems = items.map(it => ({
      produit_id: (it.produit_id && String(it.produit_id).length === 36) ? it.produit_id : (it.id && String(it.id).length === 36 ? it.id : null),
      variante_id: (it.variante_id && String(it.variante_id).length === 36) ? it.variante_id : null,
      nom_produit: String(it.nom_produit || it.nom || 'Produit').slice(0, 300),
      details_variante: it.details_variante ? String(it.details_variante).slice(0, 255) : null,
      prix_unitaire: Number(it.prix_unitaire || it.prix || 0),
      quantite: Math.max(1, parseInt(it.quantite, 10) || 1),
    }));
  } else {
    let nomP = nomProduitManuel || 'Produit';
    let pxU = Number(prixUnitaireManuel) || 0;
    if (validProduitId) {
      const { rows: [p] } = await pool.query(
        'SELECT nom, prix, stock_quantite FROM boutique_produits WHERE id = $1 AND boutique_id = $2',
        [validProduitId, actualBoutiqueId]
      );
      if (p) {
        if (!nomProduitManuel && p.nom) nomP = p.nom;
        if (!prixUnitaireManuel && p.prix) pxU = Number(p.prix);
      }
    }
    normalizedItems = [{
      produit_id: validProduitId,
      variante_id: validVarianteId,
      nom_produit: nomP,
      details_variante: null,
      prix_unitaire: pxU,
      quantite: Math.max(1, parseInt(quantite, 10) || 1),
    }];
  }

  // Vérification si le client est blacklisté pour les achats à crédit
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
      if (blackRes.rows[0]) {
        const e = new Error('⛔ Votre compte est actuellement bloqué par la boutique pour les achats à crédit.');
        e.status = 400;
        throw e;
      }
    }
  }

  const sousTotal = normalizedItems.reduce((acc, it) => acc + (it.prix_unitaire * it.quantite), 0);
  const totalQuantite = normalizedItems.reduce((acc, it) => acc + it.quantite, 0);
  const reductionVal = Math.max(0, Number(montantReduction) || 0);
  const montantTotal = Math.max(0, sousTotal + fraisLivraison - reductionVal);
  const nomProduitGlobal = normalizedItems.map(it => `${it.quantite}x ${it.nom_produit}${it.details_variante ? ` (${it.details_variante})` : ''}`).join(', ');
  const ref = genRefCommande();

  let finalNote = note || '';
  if (formuleEchelonnement && typeof formuleEchelonnement === 'object') {
    const apportFmt = formuleEchelonnement.apport ? `${formuleEchelonnement.apport} FCFA` : '0 FCFA';
    const echelonNote = `[Échelonnement: Apport ${apportFmt}, ${formuleEchelonnement.nb_echeances || 3}x (${formuleEchelonnement.frequence || 'mensuel'})]`;
    finalNote = finalNote ? `${finalNote} | ${echelonNote}` : echelonNote;
  }
  if (codePromo && String(codePromo).trim()) {
    const promoNote = `[Code Promo: ${String(codePromo).trim().toUpperCase()}${reductionVal > 0 ? ` (-${reductionVal} FCFA)` : ''}]`;
    finalNote = finalNote ? `${finalNote} | ${promoNote}` : promoNote;

    // Incrémentation du compteur d'utilisation
    await pool.query(
      `UPDATE boutique_promotions 
       SET fois_utilise = fois_utilise + 1 
       WHERE boutique_id = $1 AND UPPER(code) = $2`,
      [actualBoutiqueId, String(codePromo).trim().toUpperCase()]
    ).catch(() => {});
  }

  // Protection Idempotence / Anti-Double Soumission Commande (verrou 5 secondes)
  if (clientTelephone && actualBoutiqueId) {
    const existingCmd = await pool.query(
      `SELECT * FROM commandes_boutique
       WHERE boutique_id = $1
         AND client_telephone = $2
         AND montant_total = $3
         AND created_at >= NOW() - INTERVAL '5 seconds'
       LIMIT 1`,
      [actualBoutiqueId, clientTelephone, montantTotal]
    );
    if (existingCmd.rows[0]) {
      console.warn(`[IDEMPOTENCE COMMANDE] Double soumission bloquée (ref existante: ${existingCmd.rows[0].reference})`);
      return { commande: existingCmd.rows[0], boutique };
    }
  }

  const validSocialPostId = (social_post_id && String(social_post_id).length === 36 && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(social_post_id)) ? social_post_id : null;

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

    const { rows: [commande] } = await client.query(
      `INSERT INTO commandes_boutique
         (reference, boutique_id, produit_id, nom_produit, quantite, prix_unitaire, montant_total,
          client_nom, client_telephone, client_adresse, note, source, methode_paiement, zone_livraison_id, frais_livraison, groupe_commande,
          utm_source, utm_medium, utm_campaign, social_post_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20) RETURNING *`,
      [ref, actualBoutiqueId, normalizedItems[0]?.produit_id || null, nomProduitGlobal.slice(0, 300), totalQuantite, sousTotal, montantTotal,
       clientNom, clientTelephone, clientAdresse || null, finalNote || null, source,
       methodePaiement, validZoneId, fraisLivraison, groupeCommande || null,
       utm_source || null, utm_medium || null, utm_campaign || null, validSocialPostId]
    );

    // Insertion détaillée de chaque article et décrémentation des stocks
    for (const it of normalizedItems) {
      let prixAchat = null;
      if (it.produit_id) {
        const pData = await client.query('SELECT prix_achat FROM boutique_produits WHERE id=$1', [it.produit_id]);
        prixAchat = pData.rows[0]?.prix_achat ? Number(pData.rows[0].prix_achat) : null;
      }

      await client.query(
        `INSERT INTO commandes_boutique_items
           (commande_id, boutique_id, produit_id, variante_id, nom_produit, details_variante, prix_unitaire, prix_achat, quantite, montant_total)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [commande.id, actualBoutiqueId, it.produit_id, it.variante_id, it.nom_produit, it.details_variante, it.prix_unitaire, prixAchat, it.quantite, it.prix_unitaire * it.quantite]
      );

      // Décrémentation du stock sur la variante
      if (it.variante_id) {
        await client.query(
          `UPDATE boutique_produit_variantes
           SET stock_quantite = GREATEST(0, stock_quantite - $1)
           WHERE id = $2 AND boutique_id = $3`,
          [it.quantite, it.variante_id, actualBoutiqueId]
        );
      }

      // Décrémentation du stock sur le produit parent
      if (it.produit_id) {
        await client.query(
          `UPDATE boutique_produits
           SET stock_quantite = GREATEST(0, stock_quantite - $1),
               en_stock = CASE WHEN (stock_quantite - $1) <= 0 THEN false ELSE en_stock END
           WHERE id = $2 AND boutique_id = $3 AND stock_quantite IS NOT NULL`,
          [it.quantite, it.produit_id, actualBoutiqueId]
        );
      }
    }

    if (inTransaction) {
      await client.query('COMMIT');
      inTransaction = false;
    }

    // Télémétrie non-bloquante
    await pool.query(
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

module.exports = {
  STATUTS_VALIDES,
  genRefCommande,
  notifierVendeurCommande,
  creerCommandeBoutique,
};
