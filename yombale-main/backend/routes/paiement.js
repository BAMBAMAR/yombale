const router = require('express').Router();
const axios  = require('axios');
const crypto = require('crypto');
const { pool } = require('../models/db');
const notifs   = require('../services/notifications');

// POST /api/paiement/wave/initier
router.post('/wave/initier', async (req, res) => {
  try {
    const { montant, produit_id, user_id } = req.body;
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
router.post('/wave/webhook', async (req, res) => {
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
    if (data.customer_phone)
      await notifs.confirmationCommande(data.customer_phone, data.client_reference);
  }
  res.sendStatus(200);
});

// POST /api/paiement/orange/initier
router.post('/orange/initier', async (req, res) => {
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