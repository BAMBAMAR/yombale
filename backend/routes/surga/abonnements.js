// backend/routes/surga/abonnements.js
// Routes API pour les Abonnements Surga Premium & Espaces Pro (Tranche 15)
// Zéro émoji, vouvoiement strict D19, sécurité multi-tenant anti-IDOR

const express = require('express');
const router = express.Router();
const { tokenOptional, verifierToken } = require('../../middlewares/surga-auth');
const {
  verifierStatutPremium,
  initierSouscription,
  activerAbonnementParReference,
  traiterWebhookWaveSurga,
} = require('../../services/surga/abonnement-service');
const offre = require('../../services/surga/offre-service');

/**
 * GET /api/surga/abonnements/plans
 * Liste des formules d'abonnements B2C et B2B
 */
router.get('/abonnements/plans', async (req, res) => {
  try {
    // Formules en vente, lues en base : ce que la console fixe est ce que le public voit et ce qui est encaissé.
    return res.json({ success: true, plans: await offre.chargerPlans() });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/surga/abonnements/offre
 * L'offre complète pour l'écran d'abonnement : formules en vente avec leurs durées et tarifs, quotas gratuits,
 * ouverture des ventes. Tout vient de la console d'administration.
 */
router.get('/abonnements/offre', async (req, res) => {
  try {
    return res.json({ success: true, ...(await offre.getOffrePublique()) });
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
    // SRG-A1-010 : le statut est celui du compte de la session. Un numéro passé en paramètre n'identifie personne :
    // il permettait de lire sans jeton l'abonnement d'un tiers, y compris avec un numéro partiel ou un joker.
    const userId = req.user?.userId;
    if (!userId) {
      return res.json({ success: true, estPremium: false, plan: null, guest: true });
    }

    const statut = await verifierStatutPremium({ userId });
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

    const resultat = await initierSouscription({
      userId,
      phone,
      planKey: plan,
      cycle,
      provider,
      metadata,
    });

    return res.json(resultat);
  } catch (err) {
    const statut = err.code === 'PAIEMENT_INDISPONIBLE' ? 503 : err.code === 'VENTES_FERMEES' ? 403 : 400;
    return res.status(statut).json({ success: false, error: err.message, code: err.code || undefined });
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

