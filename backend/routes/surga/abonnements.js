// backend/routes/surga/abonnements.js
// Routes API pour les Abonnements Surga Premium & Espaces Pro (Tranche 15)
// Zéro émoji, vouvoiement strict D19, sécurité multi-tenant anti-IDOR

const express = require('express');
const router = express.Router();
const { tokenOptional, verifierToken } = require('../../middlewares/auth');
const {
  getCataloguePlans,
  verifierStatutPremium,
  initierSouscription,
  activerAbonnementParReference,
  traiterWebhookWaveSurga,
} = require('../../services/surga/abonnement-service');

/**
 * GET /api/surga/abonnements/plans
 * Liste des formules d'abonnements B2C et B2B
 */
router.get('/abonnements/plans', (req, res) => {
  try {
    const plans = getCataloguePlans();
    return res.json({
      success: true,
      plans,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/surga/abonnements/mon-statut
 * Récupère le statut Premium du compte connecté ou d'un numéro de téléphone
 */
router.get('/abonnements/mon-statut', tokenOptional, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const phone = req.query.phone;

    const statut = await verifierStatutPremium({ userId, phone });
    return res.json({
      success: true,
      ...statut,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/surga/abonnements/initier
 * Initie une intention de paiement Wave / Orange Money
 */
router.post('/abonnements/initier', tokenOptional, async (req, res) => {
  try {
    const userId = req.user?.userId || null;
    const { plan, cycle = 'mensuel', provider = 'wave', phone, metadata } = req.body;

    if (!plan) {
      return res.status(400).json({
        success: false,
        error: 'Veuillez sélectionner un plan d\'abonnement.',
      });
    }

    const host = req.get('host');
    const protocol = req.protocol;
    const baseUrl = `${protocol}://${host}`;

    const resultat = await initierSouscription({
      userId,
      phone,
      planKey: plan,
      cycle,
      provider,
      metadata,
      baseUrl,
    });

    return res.json(resultat);
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/surga/abonnements/verifier
 * Vérifie et active un abonnement suite à un retour de passerelle (certification obligatoire)
 */
router.post('/abonnements/verifier', async (req, res) => {
  try {
    const { reference } = req.body;
    if (!reference) {
      return res.status(400).json({
        success: false,
        error: 'La référence de paiement est obligatoire.',
      });
    }

    const abonnementActive = await activerAbonnementParReference(reference);

    return res.json({
      success: true,
      message: 'Votre souscription a bien été certifiée et activée avec succès.',
      abonnement: abonnementActive,
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/surga/abonnements/webhook-wave
 * Webhook officiel Wave pour la validation cryptographique instantanée des abonnements
 */
router.post('/abonnements/webhook-wave', async (req, res) => {
  try {
    const resultat = await traiterWebhookWaveSurga(req);
    return res.json(resultat);
  } catch (err) {
    console.error('[SURGA ABO WAVE WEBHOOK ERR]:', err.message);
    return res.status(400).json({ success: false, error: err.message });
  }
});

module.exports = router;

