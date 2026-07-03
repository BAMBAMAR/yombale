const router = require('express').Router();
const axios  = require('axios');
const crypto = require('crypto');
const { pool } = require('../models/db');
const notifs   = require('../services/notifications');
const { limiterEcriture, limiterAuth, limiterGeneral } = require('../middlewares/rateLimit');
const { verifierToken, adminSecretOnly } = require('../middlewares/auth');
const cfg = require('../lib/settingsCache');

// Prix dynamiques — lus depuis la table settings (avec cache 5 min)
async function getPrix() {
  const [annonce, sponsoring, boost, boostJours, pro, business, commissionBiz, promoActive, promoReduc] = await Promise.all([
    cfg.getNum('prix_annonce'),
    cfg.getNum('prix_sponsoring'),
    cfg.getNum('prix_boost'),
    cfg.getNum('boost_duree_jours'),
    cfg.getNum('plan_pro_prix'),
    cfg.getNum('plan_business_prix'),
    cfg.getNum('commission_business'),
    cfg.getBool('promo_active'),
    cfg.getNum('promo_reduction'),
  ]);
  return {
    annonce:       annonce  || 1500,
    sponsoring:    sponsoring || 5000,
    boost:         boost    || 500,
    boostJours:    boostJours || 7,
    pro:           pro      || 15000,
    business:      business || 35000,
    commissionBiz: commissionBiz || 2.0,
    promo:         promoActive ? promoReduc : 0,
  };
}

// POST /api/paiement/wave/initier
router.post('/wave/initier', verifierToken, limiterEcriture, async (req, res) => {
  try {
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
    await pool.query(
      "INSERT INTO commandes (reference,montant,statut,methode_paiement) VALUES ($1,$2,'payee','wave') ON CONFLICT (reference) DO NOTHING",
      [data.client_reference, data.amount]
    );
    const ref = data.client_reference;
    // Annonce classifiée : ref = ann_userId_annonceId
    if (ref && ref.startsWith('ann_')) {
      const parts = ref.split('_');
      const annonceId = parts[2];
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
        const until = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        await pool.query(
          "UPDATE annonces_classifiees SET boost_until=$1 WHERE id=$2",
          [until, annonceId]
        );
      }
    }
    // Abonnement Boutique Pro/Business : ref = abmt_userId_plan
    if (ref && ref.startsWith('abmt_')) {
      const parts = ref.split('_');
      const userId = parts[1];
      const plan   = parts[2];
      const pxAbmt = await getPrix();
      const PRIX   = { pro: pxAbmt.pro, business: pxAbmt.business };
      if (userId && plan && PRIX[plan]) {
        const fin = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        await pool.query(
          `INSERT INTO abonnements (utilisateur_id, plan, statut, prix_mensuel, fin, commande_ref)
           VALUES ($1,$2,'actif',$3,$4,$5)
           ON CONFLICT DO NOTHING`,
          [userId, plan, PRIX[plan], fin, ref]
        );
        // Boutiques Business → commission dynamique
        if (plan === 'business') {
          await pool.query(
            'UPDATE boutiques SET commission_rate=$1 WHERE utilisateur_id=$2',
            [pxAbmt.commissionBiz, userId]
          );
        }
      }
    }
    if (data.customer_phone)
      await notifs.confirmationCommande(data.customer_phone, ref);
  }
  res.sendStatus(200);
});

// POST /api/paiement/annonce/initier — paiement d'une annonce classifiée (Wave)
router.post('/annonce/initier', verifierToken, limiterEcriture, async (req, res) => {
  try {
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

    await pool.query(
      "INSERT INTO commandes (reference,montant,statut,methode_paiement) VALUES ($1,$2,'payee','orange') ON CONFLICT (reference) DO NOTHING",
      [order_id, amount || 0]
    );

    // Annonce classifiée
    if (order_id?.startsWith('ann_')) {
      const annonceId = order_id.replace('ann_', '');
      await pool.query(
        "UPDATE annonces_classifiees SET payee=true, actif=true, commande_ref=$1 WHERE id=$2",
        [order_id, annonceId]
      );
    }
    // Sponsoring immo
    if (order_id?.startsWith('immo_')) {
      const immoId = order_id.split('_')[2];
      if (immoId) {
        const until = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        await pool.query(
          "UPDATE annonces_immo SET sponsorisee=true, sponsorisee_jusqu_au=$1, demande_sponsorisation=false WHERE id=$2",
          [until, immoId]
        );
      }
    }
    // Sponsoring boutique
    if (order_id?.startsWith('bout_')) {
      const boutiqueId = order_id.split('_')[2];
      if (boutiqueId) {
        const until = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        await pool.query(
          "UPDATE boutiques SET sponsorise=true, sponsor_jusqu_au=$1 WHERE id=$2",
          [until, boutiqueId]
        );
      }
    }
    // Sponsoring produit
    if (order_id?.startsWith('prod_')) {
      const produitId = order_id.split('_')[2];
      if (produitId) {
        const until = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        await pool.query(
          "UPDATE produits SET sponsorise=true, sponsor_jusqu_au=$1 WHERE id=$2",
          [until, produitId]
        );
      }
    }
    // Boost annonce 7 jours (Orange)
    if (order_id?.startsWith('boost_')) {
      const annonceId = order_id.split('_')[2];
      if (annonceId) {
        const until = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        await pool.query(
          "UPDATE annonces_classifiees SET boost_until=$1 WHERE id=$2",
          [until, annonceId]
        );
      }
    }
    // Abonnement Pro/Business (Orange)
    if (order_id?.startsWith('abmt_')) {
      const parts  = order_id.split('_');
      const userId = parts[1];
      const plan   = parts[2];
      const pxO    = await getPrix();
      const PRIX   = { pro: pxO.pro, business: pxO.business };
      if (userId && plan && PRIX[plan]) {
        const fin = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        await pool.query(
          `INSERT INTO abonnements (utilisateur_id, plan, statut, prix_mensuel, fin, commande_ref)
           VALUES ($1,$2,'actif',$3,$4,$5)
           ON CONFLICT DO NOTHING`,
          [userId, plan, PRIX[plan], fin, order_id]
        );
        if (plan === 'business') {
          await pool.query('UPDATE boutiques SET commission_rate=$1 WHERE utilisateur_id=$2', [pxO.commissionBiz, userId]);
        }
      }
    }
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

module.exports = router;