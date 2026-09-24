const router = require('express').Router();
const axios  = require('axios');
const crypto = require('crypto');
const { pool } = require('../models/db');
const notifs   = require('../services/notifications');
const { limiterEcriture, limiterAuth, limiterGeneral } = require('../middlewares/rateLimit');
const { verifierToken, adminSecretOnly } = require('../middlewares/auth');
const { requireAdminAuth, requireAdminRole } = require('../middlewares/admin-rbac');
const { enregistrerAdminLog } = require('../lib/adminAuditLogger');
const cfg = require('../lib/settingsCache');
const wave = require('../services/wave');
const multer = require('multer');
const { uploadBuffer } = require('../services/cloudinary');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

// Prix dynamiques — lus depuis la table settings (avec cache 5 min)
const plansCache = require('../lib/plansCache');

async function getPrix() {
  const [annonce, sponsoring, boost, boostJours, decouverte, pro, business, commissionBiz, promoActive, promoReduc] = await Promise.all([
    cfg.getNum('prix_annonce'),
    cfg.getNum('prix_sponsoring'),
    cfg.getNum('prix_boost'),
    cfg.getNum('boost_duree_jours'),
    cfg.getNum('plan_decouverte_prix'),
    cfg.getNum('plan_pro_prix'),
    cfg.getNum('plan_business_prix'),
    cfg.getNum('commission_business'),
    cfg.getBool('promo_active'),
    cfg.getNum('promo_reduction'),
  ]);

  const pDecouverte = await plansCache.getPlan('decouverte');
  const pPro        = await plansCache.getPlan('pro');
  const pBusiness   = await plansCache.getPlan('business');

  return {
    annonce:       annonce    || 1500,
    sponsoring:    sponsoring || 5000,
    boost:         boost      || 500,
    boostJours:    boostJours || 7,
    decouverte:    pDecouverte?.prix_mensuel || decouverte || 2500,
    pro:           pPro?.prix_mensuel        || pro        || 5000,
    business:      pBusiness?.prix_mensuel   || business   || 10000,
    commissionBiz: commissionBiz || 2.0,
    promo:         promoActive ? promoReduc : 0,
  };
}

async function getNumeroDepotManuel() {
  try {
    const custom = await cfg.get('wave_numero_depot_manuel');
    return custom || process.env.WAVE_NUMERO_DEPOT_MANUEL || '777202086';
  } catch {
    return process.env.WAVE_NUMERO_DEPOT_MANUEL || '777202086';
  }
}

// Calcule le montant réel attendu pour une référence, à partir des prix settings —
// ignore le montant déclaré par le client (utile pour methode='manuel', où ce montant n'est qu'indicatif).
async function montantAttendu(reference, montantDeclare) {
  const prix = await getPrix();
  if (reference.startsWith('ann_'))   return prix.annonce;
  if (reference.startsWith('boost_')) return prix.boost;
  if (reference.startsWith('immo_') || reference.startsWith('bout_') || reference.startsWith('prod_')) return prix.sponsoring;
  if (reference.startsWith('abmt_')) {
    const parts = reference.split('_');
    const plan = parts[2];
    const dureeMois = parseInt(parts[3] || '1', 10) || 1;
    const prixMensuel = { decouverte: prix.decouverte, pro: prix.pro, business: prix.business }[plan] ?? montantDeclare;
    const [reduc3, reduc6, reduc12] = await Promise.all([
      cfg.getNum('reduc_3_mois'),
      cfg.getNum('reduc_6_mois'),
      cfg.getNum('reduc_12_mois'),
    ]);
    let remise = 0;
    if (dureeMois === 3) remise = (reduc3 || 10) / 100;
    else if (dureeMois === 6) remise = (reduc6 || 15) / 100;
    else if (dureeMois === 12) remise = (reduc12 || 25) / 100;
    return Math.round((prixMensuel * dureeMois) * (1 - remise));
  }
  if (reference.startsWith('CMD-')) {
    const cmdRes = await pool.query(
      `SELECT montant_total FROM commandes_boutique WHERE reference = $1 LIMIT 1`,
      [reference]
    );
    if (cmdRes.rows[0]) return Math.round(Number(cmdRes.rows[0].montant_total));
  }
  return montantDeclare;
}

// Applique l'effet d'un paiement réussi (annonce, boost, sponsoring, abonnement)
// Appelée par les webhooks Wave/Orange ET par la validation admin d'un paiement manuel.
async function appliquerPaiementReussi(reference, montant, methode) {
  const montantReel = await montantAttendu(reference, montant);
  await pool.query(
    "INSERT INTO commandes (reference,montant,statut,methode_paiement) VALUES ($1,$2,'payee',$3) ON CONFLICT (reference) DO NOTHING",
    [reference, montantReel, methode]
  );

  const ref = reference;

  // Annonce classifiée : ref = ann_userId_annonceId
  if (ref && ref.startsWith('ann_')) {
    const annonceId = ref.split('_')[2];
    if (annonceId) {
      await pool.query(
        "UPDATE annonces_classifiees SET payee=true, actif=true, commande_ref=$1 WHERE id=$2",
        [ref, annonceId]
      );
    }
  }
  // Sponsoring immo : ref = immo_userId_immoId
  if (ref && ref.startsWith('immo_')) {
    const immoId = ref.split('_')[2];
    if (immoId) {
      const until = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      await pool.query(
        "UPDATE annonces_immo SET sponsorisee=true, sponsorisee_jusqu_au=$1, demande_sponsorisation=false WHERE id=$2",
        [until, immoId]
      );
    }
  }
  // Sponsoring boutique : ref = bout_userId_boutiqueId
  if (ref && ref.startsWith('bout_')) {
    const boutiqueId = ref.split('_')[2];
    if (boutiqueId) {
      const until = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      await pool.query(
        "UPDATE boutiques SET sponsorise=true, sponsor_jusqu_au=$1 WHERE id=$2",
        [until, boutiqueId]
      );
    }
  }
  // Sponsoring agence immobilière : ref = spimmo_agenceId_timestamp
  if (ref && ref.startsWith('spimmo_')) {
    const agenceId = ref.split('_')[1];
    if (agenceId) {
      const until = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      await pool.query(
        "UPDATE agences_immo SET sponsorise=true, sponsor_jusqu_au=$1, updated_at=NOW() WHERE id=$2",
        [until, agenceId]
      );
    }
  }
  // Sponsoring produit : ref = prod_userId_produitId
  if (ref && ref.startsWith('prod_')) {
    const produitId = ref.split('_')[2];
    if (produitId) {
      const until = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      await pool.query(
        "UPDATE produits SET sponsorise=true, sponsor_jusqu_au=$1 WHERE id=$2",
        [until, produitId]
      );
    }
  }
  // Loyer immobilier : ref = loyer_echeanceId ou loyer_echeanceId_timestamp
  if (ref && ref.startsWith('loyer_')) {
    const parts = ref.split('_');
    const echeanceId = parts[1];
    if (echeanceId) {
      try {
        const { rows: echRows } = await pool.query(
          `SELECT le.*, ba.agence_id, ba.bien_id, ba.locataire_id
           FROM loyers_echeances le
           JOIN baux_immo ba ON le.bail_id = ba.id
           WHERE le.id = $1`,
          [echeanceId]
        );
        if (echRows.length > 0 && echRows[0].statut !== 'paye') {
          const ech = echRows[0];
          const montantPaye = Number(ech.montant_du);
          const quittanceRef = `QT-${ech.periode}-${ech.id.slice(0, 8).toUpperCase()}`;

          await pool.query(
            `UPDATE loyers_echeances
             SET statut = 'paye',
                 montant_paye = $1,
                 montant_restant = 0,
                 date_paiement = NOW(),
                 mode_paiement = $2,
                 reference_paiement = $3,
                 quittance_url = $4,
                 updated_at = NOW()
             WHERE id = $5`,
            [montantPaye, methode, ref, quittanceRef, echeanceId]
          );

          try {
            const { notifierConfirmationPaiementLoyerWhatsApp } = require('../services/immo-whatsapp-notifications');
            notifierConfirmationPaiementLoyerWhatsApp({
              loyerId: echeanceId,
              methodePaiement: methode
            }).catch(() => {});
          } catch (notifErr) {
            console.warn('[NOTIF LOYER ERR]:', notifErr.message);
          }
        }
      } catch (errLoyer) {
        console.error('[PAIEMENT REUSSI LOYER ERR]:', errLoyer.message);
      }
    }
  }
  // Boost annonce 7 jours : ref = boost_userId_annonceId
  if (ref && ref.startsWith('boost_')) {
    const annonceId = ref.split('_')[2];
    if (annonceId) {
      const boostJours = (await cfg.getNum('boost_duree_jours')) || 7;
      const until = new Date(Date.now() + boostJours * 24 * 60 * 60 * 1000).toISOString();
      await pool.query(
        "UPDATE annonces_classifiees SET boost_until=$1 WHERE id=$2",
        [until, annonceId]
      );
    }
  }
  // Abonnement Boutique Pro/Business : ref = abmt_userId_plan ou abmt_userId_plan_duree ou abmt_userId_plan_duree_timestamp
  if (ref && ref.startsWith('abmt_')) {
    const parts = ref.split('_');
    const userId = parts[1];
    const rawPlan = parts[2];
    const plan = rawPlan === 'taf_taf' ? 'decouverte' : rawPlan;
    const dureeMois = parseInt(parts[3] || '1', 10) || 1;
    const pxAbmt = await getPrix();
    const PRIX   = { decouverte: pxAbmt.decouverte, pro: pxAbmt.pro, business: pxAbmt.business };
    if (userId && plan && PRIX[plan]) {
      // Vérifier si l'utilisateur a déjà un abonnement actif
      const existingAbmt = await pool.query(
        `SELECT id, plan, fin FROM abonnements WHERE utilisateur_id=$1 AND statut='actif' AND fin > NOW() ORDER BY fin DESC LIMIT 1`,
        [userId]
      );
      let dateDebut = new Date();
      if (existingAbmt.rows[0] && existingAbmt.rows[0].plan === plan) {
        // Prolongation de la formule existante
        const currentFin = new Date(existingAbmt.rows[0].fin);
        if (currentFin > dateDebut) dateDebut = currentFin;
      } else if (existingAbmt.rows[0]) {
        // Changement / Upgrade de formule : on clôture l'ancien forfait
        await pool.query(
          `UPDATE abonnements SET statut='annule' WHERE utilisateur_id=$1 AND statut='actif'`,
          [userId]
        );
      }
      const fin = new Date(dateDebut.getTime() + dureeMois * 30 * 24 * 60 * 60 * 1000).toISOString();
      const abonnementRow = await pool.query(
        `INSERT INTO abonnements (utilisateur_id, plan, statut, prix_mensuel, debut, fin, commande_ref)
         VALUES ($1,$2,'actif',$3,NOW(),$4,$5)
         ON CONFLICT (commande_ref) WHERE commande_ref IS NOT NULL DO NOTHING
         RETURNING id`,
        [userId, plan, PRIX[plan], fin, ref]
      );
      if (plan === 'business') {
        await pool.query(
          'UPDATE boutiques SET commission_rate=$1 WHERE utilisateur_id=$2',
          [pxAbmt.commissionBiz, userId]
        );
      }
      if (abonnementRow.rows[0]) {
        try {
          const apporteurActif = await cfg.getBool('apporteur_actif');
          if (apporteurActif) {
            const boutiqueApporteur = await pool.query(
              'SELECT id, apporteur_id FROM boutiques WHERE utilisateur_id=$1 AND apporteur_id IS NOT NULL LIMIT 1',
              [userId]
            );
            if (boutiqueApporteur.rows[0]) {
              const taux = await cfg.getNum('apporteur_taux_commission');
              const montantCommission = Number(PRIX[plan]) * (taux / 100);
              await pool.query(
                `INSERT INTO commissions_apporteur (apporteur_id, boutique_id, abonnement_id, montant)
                 VALUES ($1,$2,$3,$4)`,
                [boutiqueApporteur.rows[0].apporteur_id, boutiqueApporteur.rows[0].id, abonnementRow.rows[0].id, montantCommission]
              );
            }
          }
        } catch (commErr) {
          console.error(`[${methode.toUpperCase()}] commission apporteur:`, commErr.message);
        }
      }
    }
  }

  return ref;
}

// GET /api/paiement/server-ip — Renvoie l'IP publique sortante du serveur (utile pour la Liste Blanche IP Wave)
router.get('/server-ip', async (req, res) => {
  try {
    const ipRes = await axios.get('https://api.ipify.org?format=json', { timeout: 5000 });
    res.json({ outbound_ip: ipRes.data.ip, status: 'ok' });
  } catch (err) {
    res.status(500).json({ error: 'Impossible de déterminer l\'IP sortante', message: err.message });
  }
});

// POST /api/paiement/wave/initier
router.post('/wave/initier', verifierToken, limiterEcriture, async (req, res) => {
  try {

    const user_id  = req.user.userId;
    const { montant, produit_id } = req.body;
    const session = await wave.createCheckoutSession({
      amount:           montant,
      currency:         'XOF',
      success_url:      `${process.env.FRONTEND_URL}/paiement/succes?ref=${produit_id}`,
      error_url:        `${process.env.FRONTEND_URL}/paiement/erreur?ref=pm_${user_id}_${produit_id}&type=commande-express`,
      client_reference: `pm_${user_id}_${produit_id}`,
    });
    res.json({ wave_url: session.wave_url, session_id: session.session_id });
  } catch (err) {
    const detail = err?.response?.data ?? err?.message ?? 'inconnu';
    console.error('[wave/initier] Erreur Wave:', detail);
    const numDepot = await getNumeroDepotManuel();
    res.json({ fallback_manuel: true, error: err.message || 'Erreur Wave API', detail, numero_depot: numDepot, montant: req.body?.montant || 0, reference: `pm_${req.user?.userId}_${req.body?.produit_id}` });
  }
});

// POST /api/paiement/wave/initier-express — initialisation paiement Wave express sans token
router.post('/wave/initier-express', limiterEcriture, async (req, res) => {
  try {
    const { montant, reference, nom_produit } = req.body;
    if (!montant || Number(montant) <= 0) return res.status(400).json({ error: 'Montant invalide' });

    const SITE = process.env.FRONTEND_URL || 'https://nopalou.com';
    const ref = reference || `CMD-${Date.now().toString(36).toUpperCase()}`;

    // SÉCURITÉ P0 : Si la référence est une commande boutique (CMD-*), récupérer impérativement
    // le montant réel en base de données pour empêcher toute falsification du montant côté client.
    let montantFinal = Math.round(Number(montant));
    if (ref.startsWith('CMD-')) {
      const cmdRes = await pool.query(
        `SELECT montant_total FROM commandes_boutique WHERE reference = $1 LIMIT 1`,
        [ref]
      );
      if (cmdRes.rows[0]) {
        montantFinal = Math.round(Number(cmdRes.rows[0].montant_total));
      }
    }

    const session = await wave.createCheckoutSession({
      amount: montantFinal,
      currency: 'XOF',
      success_url: `${SITE}/paiement/succes?ref=${ref}`,
      error_url: `${SITE}/paiement/erreur?ref=${ref}`,
      client_reference: ref,
    });
    res.json({ wave_url: session.wave_url, session_id: session.session_id, reference: ref });
  } catch (err) {
    const detail = err?.response?.data ?? err?.message ?? 'inconnu';
    console.error('[wave/initier-express] Erreur Wave:', detail);
    const numDepot = await getNumeroDepotManuel();
    res.json({ fallback_manuel: true, error: err.message || 'Erreur Wave API', detail, numero_depot: numDepot, montant: req.body?.montant || 0, reference: req.body?.reference || `CMD-${Date.now().toString(36).toUpperCase()}` });
  }
});

// POST /api/paiement/wave/webhook — appelé automatiquement par Wave
router.post('/wave/webhook', limiterGeneral, async (req, res) => {
  if (!wave.verifyWebhookSignature(req)) {
    return res.status(401).json({ error: 'Signature Wave invalide ou expirée' });
  }

  try {
    const { type, data } = req.body;
    if (type === 'checkout.session.completed') {
      const clientRef = data?.client_reference;
      if (clientRef) {
        const cmdRes = await pool.query(
          `UPDATE commandes_boutique SET paiement_recu = true, statut = CASE WHEN statut = 'en_attente' THEN 'payee' ELSE statut END, updated_at = NOW() WHERE reference = $1 RETURNING *`,
          [clientRef]
        ).catch(e => {
          console.error('[WAVE WEBHOOK CMD UPDATE ERR]:', e.message);
          return { rows: [] };
        });

        if (cmdRes && cmdRes.rows && cmdRes.rows[0]) {
          const cmd = cmdRes.rows[0];
          const bqRes = await pool.query(`SELECT nom, whatsapp, telephone FROM boutiques WHERE id = $1`, [cmd.boutique_id]).catch(() => ({ rows: [] }));
          const boutique = bqRes.rows ? bqRes.rows[0] : null;

          try {
            const { sendWhatsAppNotification } = require('../services/whatsapp');
            const SITE = process.env.FRONTEND_URL || 'https://nopalou.com';
            const montantFmt = new Intl.NumberFormat('fr-FR').format(cmd.montant_total);

            // 1. Notification WhatsApp à l'acheteur (Client) avec garantie 24H Meta
            if (cmd.client_telephone) {
              const msgClient = `🌊 *Paiement Wave Confirmé !*\n\nVotre commande *${cmd.reference}* (*${montantFmt} FCFA*)${boutique ? ` auprès de la boutique *${boutique.nom}*` : ''} a bien été réglée avec succès via Wave.\n\nMerci pour votre confiance !`;
              const titleClient = `🌊 Paiement Wave Confirmé — ${boutique?.nom || 'Nopalou'}`;
              const detailClient = `Réf ${cmd.reference} : Paiement de ${montantFmt} FCFA reçu avec succès via Wave.`;
              const urlClient = `${SITE}/suivi-commande?ref=${encodeURIComponent(cmd.reference)}`;

              sendWhatsAppNotification(cmd.client_telephone, {
                textMessage: msgClient,
                title: titleClient,
                montant: `${montantFmt} FCFA`,
                detail: detailClient,
                url: urlClient,
                buttonParam: `suivi-commande?ref=${encodeURIComponent(cmd.reference)}`,
                type: 'commande',
              }).catch(err => console.error('[WAVE WEBHOOK NOTIF CLIENT ERR]:', err.message));
            }

            // 2. Notification WhatsApp au vendeur (Marchand) avec garantie 24H Meta
            if (boutique) {
              const telVendeur = boutique.whatsapp || boutique.telephone;
              if (telVendeur) {
                const msgVendeur = `🎉 *Nouveau Paiement Wave Reçu !*\n\nLa commande *${cmd.reference}* d'un montant de *${montantFmt} FCFA* a été payée avec succès par le client *${cmd.client_nom || 'Client'}* (${cmd.client_telephone || 'N/A'}).\n\nVous pouvez dès à présent préparer le colis pour la livraison !`;
                const titleVendeur = `🎉 Paiement Wave Reçu — ${boutique.nom}`;
                const detailVendeur = `Réf ${cmd.reference} : ${montantFmt} FCFA réglés par ${cmd.client_nom || 'Client'} (${cmd.client_telephone || 'N/A'}).`;
                const bRef = boutique.slug || boutique.id;
                const lienCommandes = bRef ? `${SITE}/boutique?manage=${bRef}&tab=commandes` : `${SITE}/boutique?tab=commandes`;
                const btnParam = bRef ? `boutique?manage=${bRef}&tab=commandes` : 'boutique?tab=commandes';

                sendWhatsAppNotification(telVendeur, {
                  textMessage: msgVendeur,
                  title: titleVendeur,
                  montant: `${montantFmt} FCFA`,
                  detail: detailVendeur,
                  url: lienCommandes,
                  buttonParam: btnParam,
                  type: 'commande',
                }).catch(err => console.error('[WAVE WEBHOOK NOTIF VENDEUR ERR]:', err.message));
              }
            }
          } catch (whatsappErr) {
            console.error('[WAVE WEBHOOK WHATSAPP SEND ERR]:', whatsappErr.message);
          }
        }
      }
      const ref = await appliquerPaiementReussi(data.client_reference, data.amount, 'wave');
      if (data.customer_phone)
        await notifs.confirmationCommande(data.customer_phone, ref);
    }
    res.sendStatus(200);
  } catch (err) {
    console.error('[WAVE WEBHOOK ERREUR]:', err.message);
    res.status(500).json({ error: 'Erreur lors du traitement du webhook Wave', details: err.message });
  }
});

// ── Stripe Diaspora / Cartes Bancaires Internationales ────────────────
const stripeService = require('../services/stripe');

// POST /api/paiement/stripe/initier — initialisation d'un paiement Stripe (Diaspora / Cartes)
router.post('/stripe/initier', limiterEcriture, async (req, res) => {
  try {
    const { montant, reference, devise, customer_email, customer_name, metadata } = req.body;
    if (!montant || Number(montant) <= 0) {
      return res.status(400).json({ error: 'Montant invalide' });
    }

    const ref = reference || `CMD-ST-${Date.now().toString(36).toUpperCase()}`;
    const cleanCurrency = (devise || 'eur').toLowerCase();

    const session = await stripeService.createCheckoutSession({
      amount: Number(montant),
      currency: cleanCurrency,
      client_reference: ref,
      customer_email,
      customer_name,
      metadata: {
        ...(metadata || {}),
        reference: ref,
      },
    });

    res.json({
      success: true,
      stripe_url: session.stripe_url || session.url,
      session_id: session.session_id,
      reference: ref,
      mode: session.mode,
    });
  } catch (err) {
    console.error('[STRIPE INITIER ERR]:', err.message);
    res.status(500).json({ error: 'Erreur lors de l’initialisation Stripe', detail: err.message });
  }
});

// POST /api/paiement/stripe/webhook — Webhook officiel Stripe avec validation HMAC
router.post('/stripe/webhook', limiterGeneral, async (req, res) => {
  const sigHeader = req.headers['stripe-signature'];
  const rawBody = req.rawBody || JSON.stringify(req.body);

  const isValid = stripeService.verifyWebhookSignature(rawBody, sigHeader);
  if (!isValid && process.env.NODE_ENV === 'production') {
    console.warn('[STRIPE WEBHOOK] ⚠️ Signature Stripe invalide');
    return res.status(401).json({ error: 'Signature Stripe invalide' });
  }

  try {
    const event = req.body;
    const eventType = event?.type;
    const sessionData = event?.data?.object;

    if (eventType === 'checkout.session.completed') {
      const clientRef = sessionData?.client_reference_id || sessionData?.metadata?.reference;
      const amountPaid = sessionData?.amount_total ? Math.round(sessionData.amount_total / 100) : 0;
      const currency = sessionData?.currency || 'eur';

      if (clientRef) {
        // Mise à jour de la commande boutique
        const cmdRes = await pool.query(
          `UPDATE commandes_boutique 
           SET paiement_recu = true, 
               statut = CASE WHEN statut = 'en_attente' THEN 'payee' ELSE statut END, 
               methode_paiement = 'carte_bancaire',
               updated_at = NOW() 
           WHERE reference = $1 RETURNING *`,
          [clientRef]
        ).catch(e => {
          console.error('[STRIPE WEBHOOK CMD UPDATE ERR]:', e.message);
          return { rows: [] };
        });

        if (cmdRes && cmdRes.rows && cmdRes.rows[0]) {
          const cmd = cmdRes.rows[0];
          const bqRes = await pool.query(`SELECT nom, whatsapp, telephone FROM boutiques WHERE id = $1`, [cmd.boutique_id]).catch(() => ({ rows: [] }));
          const boutique = bqRes.rows ? bqRes.rows[0] : null;

          try {
            const { sendWhatsAppNotification } = require('../services/whatsapp');
            const SITE = process.env.FRONTEND_URL || 'https://nopalou.com';
            const montantFmt = new Intl.NumberFormat('fr-FR').format(cmd.montant_total);

            // 1. Notification WhatsApp à l'acheteur
            if (cmd.client_telephone) {
              const msgClient = `💳 *Paiement Carte Bancaire Confirmé !*\n\nVotre commande *${cmd.reference}* (*${montantFmt} FCFA*)${boutique ? ` auprès de la boutique *${boutique.nom}*` : ''} a bien été réglée avec succès via Carte Bancaire (Stripe Diaspora).\n\nMerci pour votre confiance !`;
              const titleClient = `💳 Paiement Confirmé — ${boutique?.nom || 'Nopalou'}`;
              const detailClient = `Réf ${cmd.reference} : Règlement par carte bancaire validé (${amountPaid} ${currency.toUpperCase()}).`;
              const urlClient = `${SITE}/suivi-commande?ref=${encodeURIComponent(cmd.reference)}`;

              sendWhatsAppNotification(cmd.client_telephone, {
                textMessage: msgClient,
                title: titleClient,
                montant: `${montantFmt} FCFA`,
                detail: detailClient,
                url: urlClient,
                buttonParam: `suivi-commande?ref=${encodeURIComponent(cmd.reference)}`,
                type: 'commande',
              }).catch(err => console.error('[STRIPE WEBHOOK NOTIF CLIENT ERR]:', err.message));
            }

            // 2. Notification WhatsApp au marchand vendeur à Dakar
            if (boutique) {
              const telVendeur = boutique.whatsapp || boutique.telephone;
              if (telVendeur) {
                const msgVendeur = `🌍 *Nouveau Paiement Diaspora Reçu (Stripe) !*\n\nLa commande *${cmd.reference}* d'un montant de *${montantFmt} FCFA* a été payée par carte bancaire internationale par *${cmd.client_nom || 'Client Diaspora'}* (${cmd.client_telephone || 'N/A'}).\n\nVous pouvez préparer la commande pour livraison locale !`;
                const titleVendeur = `🌍 Paiement Diaspora Reçu — ${boutique.nom}`;
                const detailVendeur = `Réf ${cmd.reference} : ${montantFmt} FCFA réglés par Carte Bancaire internationale.`;
                const bRef = boutique.slug || boutique.id;
                const lienCommandes = bRef ? `${SITE}/boutique?manage=${bRef}&tab=commandes` : `${SITE}/boutique?tab=commandes`;
                const btnParam = bRef ? `boutique?manage=${bRef}&tab=commandes` : 'boutique?tab=commandes';

                sendWhatsAppNotification(telVendeur, {
                  textMessage: msgVendeur,
                  title: titleVendeur,
                  montant: `${montantFmt} FCFA`,
                  detail: detailVendeur,
                  url: lienCommandes,
                  buttonParam: btnParam,
                  type: 'commande',
                }).catch(err => console.error('[STRIPE WEBHOOK NOTIF VENDEUR ERR]:', err.message));
              }
            }
          } catch (whatsappErr) {
            console.error('[STRIPE WEBHOOK WHATSAPP SEND ERR]:', whatsappErr.message);
          }
        }

        // Appliquer pour les autres types (annonces, boosts, sponsoring)
        await appliquerPaiementReussi(clientRef, amountPaid, 'carte_bancaire');
      }
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('[STRIPE WEBHOOK ERREUR]:', err.message);
    res.status(200).json({ received: true });
  }
});

// POST /api/paiement/confirmer-succes — vérification sécurisée en lecture seule du statut de commande
// Sécurité : Seul le Webhook officiel Wave (signé HMAC) ou l'administrateur peut marquer une commande comme payée.
router.post('/confirmer-succes', async (req, res) => {
  try {
    const { reference } = req.body;
    if (!reference) return res.status(400).json({ error: 'Référence requise' });

    const { rows } = await pool.query(
      `SELECT reference, statut, paiement_recu FROM commandes_boutique WHERE reference = $1 LIMIT 1`,
      [reference]
    );

    if (!rows[0]) {
      return res.status(404).json({ error: 'Commande introuvable' });
    }

    res.json({
      succes: true,
      reference: rows[0].reference,
      paye: Boolean(rows[0].paiement_recu),
      statut: rows[0].statut,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/paiement/annonce/initier — paiement d'une annonce classifiée (Wave)
router.post('/annonce/initier', verifierToken, limiterEcriture, async (req, res) => {
  try {

    const userId    = req.user.userId;
    const { annonce_id } = req.body;
    if (!annonce_id) return res.status(400).json({ error: 'annonce_id requis' });

    const r = await pool.query(
      'SELECT id, utilisateur_id, payee FROM annonces_classifiees WHERE id=$1 AND supprimee=false',
      [annonce_id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Annonce introuvable' });
    const annonceRow = r.rows[0];
    if (annonceRow.payee) return res.status(400).json({ error: 'Annonce déjà payée' });
    if (annonceRow.utilisateur_id && annonceRow.utilisateur_id !== userId && !req.user?.is_admin) {
      return res.status(403).json({ error: 'Non autorisé à payer cette annonce' });
    }

    const prix = await getPrix();
    const montant = prix.annonce;
    const clientRef = `ann_${userId}_${annonce_id}`;

    const session = await wave.createCheckoutSession({
      amount:           montant,
      currency:         'XOF',
      success_url:      `${process.env.FRONTEND_URL}/paiement/succes?ref=${annonce_id}&type=annonce`,
      error_url:        `${process.env.FRONTEND_URL}/paiement/erreur?ref=${annonce_id}&type=annonce`,
      client_reference: clientRef,
    });
    res.json({ wave_url: session.wave_url, session_id: session.session_id });
  } catch (err) {
    const detail = err?.response?.data ?? err?.message ?? 'inconnu';
    console.error('[annonce/initier] Erreur Wave:', detail);
    const numDepot = await getNumeroDepotManuel();
    res.json({ fallback_manuel: true, error: 'Erreur serveur Wave API', detail, numero_depot: numDepot, reference: `ann_${req.user?.userId}_${req.body?.annonce_id}` });
  }
});

// POST /api/paiement/immo-sponsoring/initier — mise en avant immo 30j (Wave)
router.post('/immo-sponsoring/initier', verifierToken, limiterEcriture, async (req, res) => {
  try {

    const userId = req.user.userId;
    const { immo_id } = req.body;
    if (!immo_id) return res.status(400).json({ error: 'immo_id requis' });

    const r = await pool.query(
      'SELECT id FROM annonces_immo WHERE id=$1 AND utilisateur_id=$2 AND supprimee=false',
      [immo_id, userId]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Annonce introuvable' });

    const clientRef = `immo_${userId}_${immo_id}`;
    const { sponsoring: prixSponsoImmo } = await getPrix();
    const session = await wave.createCheckoutSession({
      amount:           prixSponsoImmo,
      currency:         'XOF',
      success_url:      `${process.env.FRONTEND_URL}/paiement/succes?ref=${immo_id}&type=immo-sponsoring`,
      error_url:        `${process.env.FRONTEND_URL}/paiement/erreur?ref=${immo_id}&type=immo-sponsoring`,
      client_reference: clientRef,
    });
    res.json({ wave_url: session.wave_url, session_id: session.session_id });
  } catch (err) {
    const detail = err?.response?.data ?? err?.message ?? 'inconnu';
    console.error('[immo-sponsoring] Erreur Wave:', detail);
    const numDepot = await getNumeroDepotManuel();
    res.json({ fallback_manuel: true, error: 'Erreur serveur Wave API', detail, numero_depot: numDepot, reference: `immo_${req.user?.userId}_${req.body?.immo_id}` });
  }
});

// POST /api/paiement/produit-sponsoring/initier — mise en avant produit 30j (Wave)
router.post('/produit-sponsoring/initier', verifierToken, limiterEcriture, async (req, res) => {
  try {

    const userId = req.user.userId;
    const { produit_id } = req.body;
    if (!produit_id) return res.status(400).json({ error: 'produit_id requis' });

    const r = await pool.query('SELECT id FROM produits WHERE id=$1', [produit_id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'Produit introuvable' });

    const clientRef = `prod_${userId}_${produit_id}`;
    const { sponsoring: prixSponsoProd } = await getPrix();
    const session = await wave.createCheckoutSession({
      amount:           prixSponsoProd,
      currency:         'XOF',
      success_url:      `${process.env.FRONTEND_URL}/paiement/succes?ref=${produit_id}&type=produit-sponsoring`,
      error_url:        `${process.env.FRONTEND_URL}/paiement/erreur?ref=${produit_id}&type=produit-sponsoring`,
      client_reference: clientRef,
    });
    res.json({ wave_url: session.wave_url, session_id: session.session_id });
  } catch (err) {
    const detail = err?.response?.data ?? err?.message ?? 'inconnu';
    console.error('[produit-sponsoring] erreur Wave:', detail);
    const numDepot = await getNumeroDepotManuel();
    res.json({ fallback_manuel: true, error: 'Erreur serveur Wave API', detail, numero_depot: numDepot, reference: `prod_${req.user?.userId}_${req.body?.produit_id}` });
  }
});

// POST /api/paiement/boutique-sponsoring/initier — mise en avant boutique 30j (Wave)
router.post('/boutique-sponsoring/initier', verifierToken, limiterEcriture, async (req, res) => {
  try {

    const userId = req.user.userId;
    const { boutique_id } = req.body;
    if (!boutique_id) return res.status(400).json({ error: 'boutique_id requis' });

    const r = await pool.query(
      'SELECT id FROM boutiques WHERE id=$1 AND utilisateur_id=$2 AND actif=true',
      [boutique_id, userId]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Boutique introuvable' });

    const clientRef = `bout_${userId}_${boutique_id}`;
    const { sponsoring: prixSponsoBout } = await getPrix();
    const session = await wave.createCheckoutSession({
      amount:           prixSponsoBout,
      currency:         'XOF',
      success_url:      `${process.env.FRONTEND_URL}/paiement/succes?ref=${boutique_id}&type=boutique-sponsoring`,
      error_url:        `${process.env.FRONTEND_URL}/paiement/erreur?ref=${boutique_id}&type=boutique-sponsoring`,
      client_reference: clientRef,
    });
    res.json({ wave_url: session.wave_url, session_id: session.session_id });
  } catch (err) {
    const detail = err?.response?.data ?? err?.message ?? 'inconnu';
    console.error('[boutique-sponsoring] Erreur Wave:', detail);
    const numDepot = await getNumeroDepotManuel();
    res.json({ fallback_manuel: true, error: 'Erreur serveur Wave API', detail, numero_depot: numDepot, reference: `bout_${req.user?.userId}_${req.body?.boutique_id}` });
  }
});

// POST /api/paiement/orange/initier
router.post('/orange/initier', verifierToken, limiterEcriture, async (req, res) => {
  try {
    if (!(await cfg.getBool('paiement_orange'))) {
      return res.status(403).json({ error: 'Paiement Orange Money temporairement indisponible' });
    }
    const tokenRes = await axios.post(
      'https://api.orange.com/oauth/v3/token',
      'grant_type=client_credentials',
      { auth: { username: process.env.ORANGE_CLIENT_ID, password: process.env.ORANGE_CLIENT_SECRET } }
    );
    const { montant, commande_id } = req.body;
    const payRes = await axios.post(
      'https://api.orange.com/orange-money-webpay/dev/v1/webpayment',
      {
        merchant_key: process.env.ORANGE_MERCHANT_KEY,
        currency: 'OAF', order_id: commande_id, amount: montant,
        return_url: `${process.env.FRONTEND_URL}/retour-paiement`,
        notif_url:  `${process.env.BACKEND_URL}/api/paiement/orange/webhook`,
        lang: 'fr'
      },
      { headers: { Authorization: `Bearer ${tokenRes.data.access_token}` } }
    );
    res.json({ pay_url: payRes.data.payment_url });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/paiement/orange/webhook — notification de paiement Orange Money
router.post('/orange/webhook', limiterGeneral, async (req, res) => {
  // Validation HMAC-SHA256 (Fail-Closed strict en production)
  const orangeSecret = process.env.ORANGE_WEBHOOK_SECRET;
  if (orangeSecret) {
    const sig      = req.headers['x-orange-signature'] || req.headers['authorization'] || '';
    const expected = crypto
      .createHmac('sha256', orangeSecret)
      .update(req.rawBody || JSON.stringify(req.body)).digest('hex');
    const clean = sig.replace(/^sha256=/, '');
    const sigBuf = Buffer.from(clean, 'hex');
    const expBuf = Buffer.from(expected, 'hex');
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return res.status(401).json({ error: 'Signature Orange invalide' });
    }
  } else if (process.env.NODE_ENV === 'production') {
    console.error('[ORANGE WEBHOOK] ERREUR P0: ORANGE_WEBHOOK_SECRET manquant en production');
    return res.status(500).json({ error: 'Configuration serveur incomplète' });
  }
  try {
    const { status, order_id, amount } = req.body;
    if (status !== 'SUCCESS') return res.sendStatus(200);

    await appliquerPaiementReussi(order_id, amount || 0, 'orange');
    res.sendStatus(200);
  } catch (err) {
    console.error('[Orange webhook]', err.message);
    res.sendStatus(200); // toujours 200 pour éviter les retry
  }
});

// GET /api/paiement/stats — tableau de bord revenus (admin)
router.get('/stats', requireAdminAuth, requireAdminRole('super_admin', 'finance'), async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        COUNT(*)                                                             AS total_transactions,
        COALESCE(SUM(montant), 0)                                           AS revenus_total,
        COUNT(*) FILTER (WHERE methode_paiement = 'wave')                  AS transactions_wave,
        COUNT(*) FILTER (WHERE methode_paiement IN ('orange', 'orange_money')) AS transactions_orange,
        COUNT(*) FILTER (WHERE methode_paiement = 'manuel')                AS transactions_manuel,
        COALESCE(SUM(montant)  FILTER (WHERE created_at >= DATE_TRUNC('month', NOW())), 0) AS revenus_mois,
        COUNT(*)               FILTER (WHERE created_at >= DATE_TRUNC('month', NOW()))     AS transactions_mois,
        COALESCE(SUM(montant)  FILTER (WHERE created_at >= NOW() - INTERVAL '7 days'), 0)  AS revenus_semaine,
        COUNT(*)               FILTER (WHERE reference LIKE 'ann_%')       AS annonces_payees,
        COUNT(*)               FILTER (WHERE reference LIKE 'immo_%')      AS sponsorings_immo,
        COUNT(*)               FILTER (WHERE reference LIKE 'bout_%')      AS sponsorings_boutiques,
        COUNT(*)               FILTER (WHERE reference LIKE 'prod_%')      AS sponsorings_produits
      FROM commandes WHERE statut = 'payee'
    `);

    // Transactions récentes (30 dernières)
    const { rows: recentes } = await pool.query(`
      SELECT reference, montant, methode_paiement, created_at
      FROM commandes WHERE statut = 'payee'
      ORDER BY created_at DESC LIMIT 30
    `);

    res.json({ ...rows[0], recentes });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/paiement/boost/initier — boost annonce 7 jours (500 FCFA, Wave)
router.post('/boost/initier', verifierToken, limiterEcriture, async (req, res) => {
  try {

    const userId = req.user.userId;
    const { annonce_id } = req.body;
    if (!annonce_id) return res.status(400).json({ error: 'annonce_id requis' });

    const r = await pool.query(
      'SELECT id, utilisateur_id FROM annonces_classifiees WHERE id=$1 AND supprimee=false',
      [annonce_id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Annonce introuvable' });
    const annonceRow = r.rows[0];
    if (annonceRow.utilisateur_id && annonceRow.utilisateur_id !== userId && !req.user?.is_admin) {
      return res.status(403).json({ error: 'Non autorisé à booster cette annonce' });
    }

    const clientRef = `boost_${userId}_${annonce_id}`;
    const { boost: prixBoost } = await getPrix();
    const session = await wave.createCheckoutSession({
      amount:           prixBoost,
      currency:         'XOF',
      success_url:      `${process.env.FRONTEND_URL}/paiement/succes?ref=${annonce_id}&type=boost`,
      error_url:        `${process.env.FRONTEND_URL}/paiement/erreur?ref=${annonce_id}&type=boost`,
      client_reference: clientRef,
    });
    res.json({ wave_url: session.wave_url, session_id: session.session_id });
  } catch (err) {
    const detail = err?.response?.data ?? err?.message ?? 'inconnu';
    console.error('[boost/initier] Erreur Wave:', detail);
    const numDepot = await getNumeroDepotManuel();
    res.json({ fallback_manuel: true, error: err.message || 'Erreur Wave API', detail, numero_depot: numDepot, reference: `boost_${req.user?.userId}_${req.body?.annonce_id}` });
  }
});

// POST /api/paiement/manuel/declarer — le client déclare un dépôt Wave/Orange effectué manuellement
router.post('/manuel/declarer', verifierToken, limiterEcriture, upload.single('preuve'), async (req, res) => {
  try {
    if (!(await cfg.getBool('paiement_manuel_actif'))) {
      return res.status(403).json({ error: 'Paiement manuel temporairement indisponible' });
    }
    const userId = req.user.userId;
    const { reference, montant, methode, telephone_expediteur, transaction_id_client } = req.body;

    if (!reference || !montant || !methode || !telephone_expediteur) {
      return res.status(400).json({ error: 'Champs requis manquants' });
    }
    if (!['wave', 'orange'].includes(methode)) {
      return res.status(400).json({ error: 'Méthode invalide' });
    }
    if (!transaction_id_client && !req.file) {
      return res.status(400).json({ error: 'Fournir un ID de transaction ou une preuve de paiement' });
    }

    let preuveUrl = null;
    if (req.file) {
      preuveUrl = await uploadBuffer(req.file.buffer, 'paiements-manuels');
    }

    const { rows } = await pool.query(
      `INSERT INTO paiements_manuels
         (utilisateur_id, reference, montant, methode, telephone_expediteur, transaction_id_client, preuve_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING id`,
      [userId, reference, montant, methode, telephone_expediteur, transaction_id_client || null, preuveUrl]
    );

    res.json({ ok: true, id: rows[0].id });
  } catch (err) {
    console.error('[PAIEMENT MANUEL DECLARER]', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/paiement/manuel/liste — déclarations en attente (admin)
router.get('/manuel/liste', requireAdminAuth, requireAdminRole('super_admin', 'finance'), async (req, res) => {
  try {
    const statut = ['en_attente', 'valide', 'rejete'].includes(req.query.statut) ? req.query.statut : 'en_attente';
    const { rows } = await pool.query(
      `SELECT pm.id, pm.reference, pm.montant, pm.methode, pm.telephone_expediteur,
              pm.transaction_id_client, pm.preuve_url, pm.statut, pm.motif_rejet, pm.created_at,
              u.nom AS utilisateur_nom, u.email AS utilisateur_email, u.telephone AS utilisateur_telephone
       FROM paiements_manuels pm
       JOIN utilisateurs u ON u.id = pm.utilisateur_id
       WHERE pm.statut = $1
       ORDER BY pm.created_at DESC
       LIMIT 200`,
      [statut]
    );
    res.json({ paiements: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/paiement/manuel/:id/valider — valide un dépôt déclaré et applique l'effet (admin)
router.post('/manuel/:id/valider', requireAdminAuth, requireAdminRole('super_admin', 'finance'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, reference, montant, methode, statut FROM paiements_manuels WHERE id=$1`,
      [req.params.id]
    );
    const paiement = rows[0];
    if (!paiement) return res.status(404).json({ error: 'Déclaration introuvable' });
    if (paiement.statut !== 'en_attente') {
      return res.status(409).json({ error: 'Déclaration déjà traitée' });
    }

    await appliquerPaiementReussi(paiement.reference, paiement.montant, 'manuel');

    await pool.query(
      `UPDATE paiements_manuels SET statut='valide', valide_par=$1, valide_at=NOW() WHERE id=$2`,
      [req.adminUser?.nom || req.adminUser?.email || 'admin', req.params.id]
    );

    await enregistrerAdminLog({
      action: 'paiement_manuel_valide',
      cibleType: 'paiement_manuel',
      cibleId: req.params.id,
      description: `Validation administrative du dépôt manuel de ${paiement.montant} FCFA (${paiement.methode}) pour la réf ${paiement.reference}`,
      req,
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('[PAIEMENT MANUEL VALIDER]', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/paiement/manuel/:id/rejeter — rejette un dépôt déclaré (admin)
router.post('/manuel/:id/rejeter', requireAdminAuth, requireAdminRole('super_admin', 'finance'), async (req, res) => {
  try {
    const { motif } = req.body;
    const { rows } = await pool.query(
      `UPDATE paiements_manuels SET statut='rejete', motif_rejet=$1
       WHERE id=$2 AND statut='en_attente'
       RETURNING id`,
      [motif || null, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Déclaration introuvable ou déjà traitée' });

    await enregistrerAdminLog({
      action: 'paiement_manuel_rejete',
      cibleType: 'paiement_manuel',
      cibleId: req.params.id,
      description: `Rejet administratif du dépôt manuel (Motif: ${motif || 'Non précisé'})`,
      req,
    });

    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
module.exports.appliquerPaiementReussi = appliquerPaiementReussi;
