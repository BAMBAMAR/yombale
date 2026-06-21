const router = require('express').Router();
const axios  = require('axios');
const crypto = require('crypto');
const { pool } = require('../models/db');
const notifs   = require('../services/notifications');
const { limiterEcriture, limiterAuth, limiterGeneral } = require('../middlewares/rateLimit');
const { verifierToken } = require('../middlewares/auth');

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
  const sig      = req.headers['x-wave-signature'];
  const expected = crypto
    .createHmac('sha256', process.env.WAVE_WEBHOOK_SECRET)
    .update(JSON.stringify(req.body)).digest('hex');
  if (sig !== expected) return res.status(401).json({ error: 'Signature invalide' });

  const { type, data } = req.body;
  if (type === 'checkout.session.completed') {
    await pool.query(
      "INSERT INTO commandes (reference,montant,statut,methode_paiement) VALUES ($1,$2,'payee','wave') ON CONFLICT (reference) DO NOTHING",
      [data.client_reference, data.amount]
    );
    // Activer une annonce classifiée si le paiement lui est lié (ref = ann_userId_annonceId)
    if (data.client_reference && data.client_reference.startsWith('ann_')) {
      const parts = data.client_reference.split('_');
      const annonceId = parts[2];
      if (annonceId) {
        await pool.query(
          "UPDATE annonces_classifiees SET payee=true, commande_ref=$1 WHERE id=$2",
          [data.client_reference, annonceId]
        );
      }
    }
    if (data.customer_phone)
      await notifs.confirmationCommande(data.customer_phone, data.client_reference);
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

    const montant = 1500; // FCFA
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

module.exports = router;