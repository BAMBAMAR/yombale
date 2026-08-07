const router = require('express').Router();
const axios  = require('axios');
const crypto = require('crypto');
const { pool } = require('../models/db');
const notifs   = require('../services/notifications');
const { limiterEcriture, limiterAuth, limiterGeneral } = require('../middlewares/rateLimit');
const { verifierToken, adminSecretOnly } = require('../middlewares/auth');
const cfg = require('../lib/settingsCache');
const multer = require('multer');
const { uploadBuffer } = require('../services/cloudinary');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

// Prix dynamiques — lus depuis la table settings (avec cache 5 min)
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
  return {
    annonce:       annonce    || 1500,
    sponsoring:    sponsoring || 5000,
    boost:         boost      || 500,
    boostJours:    boostJours || 7,
    decouverte:    decouverte || 5000,
    pro:           pro        || 15000,
    business:      business   || 35000,
    commissionBiz: commissionBiz || 2.0,
    promo:         promoActive ? promoReduc : 0,
  };
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
    const prixMensuel = { pro: prix.pro, business: prix.business }[plan] ?? montantDeclare;
    let remise = 0;
    if (dureeMois === 3) remise = 0.10;
    else if (dureeMois === 6) remise = 0.15;
    else if (dureeMois === 12) remise = 0.25;
    return Math.round((prixMensuel * dureeMois) * (1 - remise));
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
  // Abonnement Boutique Pro/Business : ref = abmt_userId_plan ou abmt_userId_plan_duree
  if (ref && ref.startsWith('abmt_')) {
    const parts = ref.split('_');
    const userId = parts[1];
    const plan   = parts[2];
    const dureeMois = parseInt(parts[3] || '1', 10) || 1;
    const pxAbmt = await getPrix();
    const PRIX   = { pro: pxAbmt.pro, business: pxAbmt.business };
    if (userId && plan && PRIX[plan]) {
      const fin = new Date(Date.now() + dureeMois * 30 * 24 * 60 * 60 * 1000).toISOString();
      const abonnementRow = await pool.query(
        `INSERT INTO abonnements (utilisateur_id, plan, statut, prix_mensuel, fin, commande_ref)
         VALUES ($1,$2,'actif',$3,$4,$5)
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

// POST /api/paiement/wave/initier
router.post('/wave/initier', verifierToken, limiterEcriture, async (req, res) => {
  try {
    if (!(await cfg.getBool('paiement_wave'))) {
      return res.status(403).json({ error: 'Paiement Wave temporairement indisponible' });
    }
    const user_id  = req.user.userId;
    const { montant, produit_id } = req.body;
    const session = await axios.post(
      'https://api.wave.com/v1/checkout/sessions',
      {
        amount:           montant,
        currency:         'XOF',
        success_url:      `${process.env.FRONTEND_URL}/paiement/succes?ref=${produit_id}`,
        error_url:        `${process.env.FRONTEND_URL}/paiement/erreur`,
        client_reference: `pm_${user_id}_${produit_id}`
      },
      { headers: { Authorization: `Bearer ${process.env.WAVE_API_KEY}` } }
    );
    res.json({ wave_url: session.data.wave_launch_url, session_id: session.data.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/paiement/wave/webhook — appelé automatiquement par Wave
router.post('/wave/webhook', limiterGeneral, async (req, res) => {
  const sig      = req.headers['x-wave-signature'] || '';
  const expected = crypto
    .createHmac('sha256', process.env.WAVE_WEBHOOK_SECRET)
    .update(JSON.stringify(req.body)).digest('hex');
  const sigBuf = Buffer.from(sig, 'hex');
  const expBuf = Buffer.from(expected, 'hex');
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return res.status(401).json({ error: 'Signature invalide' });
  }

  const { type, data } = req.body;
  if (type === 'checkout.session.completed') {
    const ref = await appliquerPaiementReussi(data.client_reference, data.amount, 'wave');
    if (data.customer_phone)
      await notifs.confirmationCommande(data.customer_phone, ref);
  }
  res.sendStatus(200);
});

// POST /api/paiement/annonce/initier — paiement d'une annonce classifiée (Wave)
router.post('/annonce/initier', verifierToken, limiterEcriture, async (req, res) => {
  try {
    if (!(await cfg.getBool('paiement_wave'))) {
      return res.status(403).json({ error: 'Paiement Wave temporairement indisponible' });
    }
    const userId    = req.user.userId;
    const { annonce_id } = req.body;
    if (!annonce_id) return res.status(400).json({ error: 'annonce_id requis' });

    // Vérifier que l'annonce appartient à cet utilisateur et n'est pas encore payée
    const r = await pool.query(
      'SELECT id FROM annonces_classifiees WHERE id=$1 AND utilisateur_id=$2 AND payee=false AND supprimee=false',
      [annonce_id, userId]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Annonce introuvable ou déjà payée' });

    const prix = await getPrix();
    const montant = prix.annonce;
    const clientRef = `ann_${userId}_${annonce_id}`;

    const session = await require('axios').post(
      'https://api.wave.com/v1/checkout/sessions',
      {
        amount:           montant,
        currency:         'XOF',
        success_url:      `${process.env.FRONTEND_URL}/paiement/succes?ref=${annonce_id}&type=annonce`,
        error_url:        `${process.env.FRONTEND_URL}/paiement/erreur`,
        client_reference: clientRef,
      },
      { headers: { Authorization: `Bearer ${process.env.WAVE_API_KEY}` } }
    );
    res.json({ wave_url: session.data.wave_launch_url, session_id: session.data.id });
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

// POST /api/paiement/immo-sponsoring/initier — mise en avant immo 30j (Wave)
router.post('/immo-sponsoring/initier', verifierToken, limiterEcriture, async (req, res) => {
  try {
    if (!(await cfg.getBool('paiement_wave'))) {
      return res.status(403).json({ error: 'Paiement Wave temporairement indisponible' });
    }
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
    const session = await axios.post(
      'https://api.wave.com/v1/checkout/sessions',
      {
        amount:           prixSponsoImmo,
        currency:         'XOF',
        success_url:      `${process.env.FRONTEND_URL}/paiement/succes?ref=${immo_id}&type=immo-sponsoring`,
        error_url:        `${process.env.FRONTEND_URL}/paiement/erreur`,
        client_reference: clientRef,
      },
      { headers: { Authorization: `Bearer ${process.env.WAVE_API_KEY}` } }
    );
    res.json({ wave_url: session.data.wave_launch_url, session_id: session.data.id });
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

// POST /api/paiement/produit-sponsoring/initier — mise en avant produit 30j (Wave)
router.post('/produit-sponsoring/initier', verifierToken, limiterEcriture, async (req, res) => {
  try {
    if (!(await cfg.getBool('paiement_wave'))) {
      return res.status(403).json({ error: 'Paiement Wave temporairement indisponible' });
    }
    const userId = req.user.userId;
    const { produit_id } = req.body;
    if (!produit_id) return res.status(400).json({ error: 'produit_id requis' });

    const r = await pool.query('SELECT id FROM produits WHERE id=$1', [produit_id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'Produit introuvable' });

    const clientRef = `prod_${userId}_${produit_id}`;
    const { sponsoring: prixSponsoProd } = await getPrix();
    const session = await axios.post(
      'https://api.wave.com/v1/checkout/sessions',
      {
        amount:           prixSponsoProd,
        currency:         'XOF',
        success_url:      `${process.env.FRONTEND_URL}/paiement/succes?ref=${produit_id}&type=produit-sponsoring`,
        error_url:        `${process.env.FRONTEND_URL}/paiement/erreur`,
        client_reference: clientRef,
      },
      { headers: { Authorization: `Bearer ${process.env.WAVE_API_KEY}` } }
    );
    res.json({ wave_url: session.data.wave_launch_url, session_id: session.data.id });
  } catch (err) {
    const detail = err?.response?.data ?? err?.message ?? 'inconnu';
    console.error('[produit-sponsoring] erreur Wave:', detail);
    res.status(500).json({ error: 'Erreur serveur', detail });
  }
});

// POST /api/paiement/boutique-sponsoring/initier — mise en avant boutique 30j (Wave)
router.post('/boutique-sponsoring/initier', verifierToken, limiterEcriture, async (req, res) => {
  try {
    if (!(await cfg.getBool('paiement_wave'))) {
      return res.status(403).json({ error: 'Paiement Wave temporairement indisponible' });
    }
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
    const session = await axios.post(
      'https://api.wave.com/v1/checkout/sessions',
      {
        amount:           prixSponsoBout,
        currency:         'XOF',
        success_url:      `${process.env.FRONTEND_URL}/paiement/succes?ref=${boutique_id}&type=boutique-sponsoring`,
        error_url:        `${process.env.FRONTEND_URL}/paiement/erreur`,
        client_reference: clientRef,
      },
      { headers: { Authorization: `Bearer ${process.env.WAVE_API_KEY}` } }
    );
    res.json({ wave_url: session.data.wave_launch_url, session_id: session.data.id });
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
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
  // Validation HMAC-SHA256 (même pattern que Wave)
  if (process.env.ORANGE_WEBHOOK_SECRET) {
    const sig      = req.headers['x-orange-signature'] || req.headers['authorization'] || '';
    const expected = crypto
      .createHmac('sha256', process.env.ORANGE_WEBHOOK_SECRET)
      .update(req.rawBody || JSON.stringify(req.body)).digest('hex');
    const clean = sig.replace(/^sha256=/, '');
    const sigBuf = Buffer.from(clean, 'hex');
    const expBuf = Buffer.from(expected, 'hex');
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return res.status(401).json({ error: 'Signature Orange invalide' });
    }
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
router.get('/stats', adminSecretOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        COUNT(*)                                                             AS total_transactions,
        COALESCE(SUM(montant), 0)                                           AS revenus_total,
        COUNT(*) FILTER (WHERE methode_paiement = 'wave')                  AS transactions_wave,
        COUNT(*) FILTER (WHERE methode_paiement = 'orange')                AS transactions_orange,
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
    if (!(await cfg.getBool('paiement_wave'))) {
      return res.status(403).json({ error: 'Paiement Wave temporairement indisponible' });
    }
    const userId = req.user.userId;
    const { annonce_id } = req.body;
    if (!annonce_id) return res.status(400).json({ error: 'annonce_id requis' });

    const r = await pool.query(
      'SELECT id FROM annonces_classifiees WHERE id=$1 AND utilisateur_id=$2 AND supprimee=false',
      [annonce_id, userId]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Annonce introuvable' });

    const clientRef = `boost_${userId}_${annonce_id}`;
    const { boost: prixBoost } = await getPrix();
    const session = await require('axios').post(
      'https://api.wave.com/v1/checkout/sessions',
      {
        amount:           prixBoost,
        currency:         'XOF',
        success_url:      `${process.env.FRONTEND_URL}/paiement/succes?ref=${annonce_id}&type=boost`,
        error_url:        `${process.env.FRONTEND_URL}/paiement/erreur`,
        client_reference: clientRef,
      },
      { headers: { Authorization: `Bearer ${process.env.WAVE_API_KEY}` } }
    );
    res.json({ wave_url: session.data.wave_launch_url });
  } catch (err) { res.status(500).json({ error: err.message }); }
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
router.get('/manuel/liste', adminSecretOnly, async (req, res) => {
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
router.post('/manuel/:id/valider', adminSecretOnly, async (req, res) => {
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
      [req.headers['x-admin-secret'] ? 'admin' : 'admin', req.params.id]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error('[PAIEMENT MANUEL VALIDER]', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/paiement/manuel/:id/rejeter — rejette un dépôt déclaré (admin)
router.post('/manuel/:id/rejeter', adminSecretOnly, async (req, res) => {
  try {
    const { motif } = req.body;
    const { rows } = await pool.query(
      `UPDATE paiements_manuels SET statut='rejete', motif_rejet=$1
       WHERE id=$2 AND statut='en_attente'
       RETURNING id`,
      [motif || null, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Déclaration introuvable ou déjà traitée' });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
module.exports.appliquerPaiementReussi = appliquerPaiementReussi;