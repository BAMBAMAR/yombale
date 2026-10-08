// backend/routes/surga/trafic.js
// Routes API pour le suivi du trafic routier à Dakar en temps réel

const express = require('express');
const router = express.Router();
const {
  AXES_ROUTIERS_DAKAR,
  getEtatTraficComplet,
  genererSyntheseBriefingTrafic,
  enregistrerSignalement,
  getAlertesPresseTrafic,
} = require('../../services/surga/trafic-service');
const { tokenOptional } = require('../../middlewares/surga-auth');

/**
 * GET /api/surga/trafic
 * État des axes de Dakar : mesures du créneau, signalements des usagers, titres de presse sur la circulation
 */
router.get('/trafic', async (req, res) => {
  try {
    const etat = await getEtatTraficComplet();
    const synthese = genererSyntheseBriefingTrafic(etat.axes, req.query.quartier || 'Dakar');
    // Les titres de presse complètent l'écran ; leur lecture en échec ne retire pas le reste.
    const alertesPresse = await getAlertesPresseTrafic().catch((e) => { console.warn('[SurgaTrafic] Alertes de presse illisibles :', e.message); return []; });

    return res.json({
      success: true,
      source: etat.source,
      disponible: etat.disponible,
      total: etat.axes.length,
      axes: etat.axes,
      incidents: etat.incidents,
      alertesPresse,
      mesures: etat.mesures,
      synthese,
      derniereMiseAJour: etat.derniereMiseAJour,
    });
  } catch (error) {
    console.error('[SurgaTrafic] Erreur chargement trafic:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du trafic',
    });
  }
});

/**
 * GET /api/surga/trafic/synthese
 * Synthèse concise pour le briefing matinal et le vocal
 */
router.get('/trafic/synthese', async (req, res) => {
  try {
    const etat = await getEtatTraficComplet();
    const synthese = genererSyntheseBriefingTrafic(etat.axes, req.query.quartier || 'Dakar');

    return res.json({
      success: true,
      source: etat.source,
      disponible: etat.disponible,
      synthese,
    });
  } catch (error) {
    console.error('[SurgaTrafic] Erreur synthèse trafic:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur synthèse trafic',
    });
  }
});

/**
 * GET /api/surga/trafic/incidents
 * Liste des incidents majeurs et ralentissements signalés en direct
 */
router.get('/trafic/incidents', async (req, res) => {
  try {
    const etat = await getEtatTraficComplet();
    return res.json({
      success: true,
      source: etat.source,
      incidents: etat.incidents || [],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Erreur incidents trafic',
    });
  }
});

/**
 * GET /api/surga/trafic/axes
 * Liste des axes disponibles pour le formulaire de signalement
 */
router.get('/trafic/axes', (req, res) => {
  return res.json({
    success: true,
    axes: AXES_ROUTIERS_DAKAR.map((a) => ({
      id: a.id,
      nom: a.nom,
      origine: a.origine,
      destination: a.destination,
      pointsChauds: a.pointsChauds,
    })),
  });
});

/**
 * POST /api/surga/trafic/signalements
 * Enregistrer un signalement de ralentissement / accident
 */
router.post('/trafic/signalements', require('../../middlewares/surga-limites').limiterSignalement, tokenOptional, async (req, res) => {
  try {
    const { axeId, typeSignalement, commentaire } = req.body;
    if (!axeId || !typeSignalement) {
      return res.status(400).json({
        success: false,
        error: 'axeId et typeSignalement sont obligatoires',
      });
    }

    const userId = req.user?.userId || null;
    const signalement = await enregistrerSignalement({
      axeId,
      typeSignalement,
      commentaire,
      userId,
    });

    return res.status(201).json({
      success: true,
      signalement,
    });
  } catch (error) {
    console.error('[SurgaTrafic] Erreur création signalement:', error);
    if (error.code === 'ENREGISTREMENT_IMPOSSIBLE') {
      return res.status(503).json({ success: false, error: error.message });
    }
    return res.status(400).json({
      success: false,
      error: error.message || 'Erreur lors du signalement',
    });
  }
});

module.exports = router;
