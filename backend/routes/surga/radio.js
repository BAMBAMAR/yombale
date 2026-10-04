// backend/routes/surga/radio.js
// Routes API pour les radios locales du Sénégal dans Surga

const express = require('express');
const router = express.Router();
const {
  listerRadios,
  trouverRadioParId,
  proxifierFlux,
} = require('../../services/surga/radio-service');

/**
 * GET /api/surga/radios
 * Liste les stations locales sénégalaises
 */
router.get('/radios', (req, res) => {
  try {
    const { categorie, region, recherche } = req.query;
    const stations = listerRadios({ categorie, region, recherche });
    return res.json({
      success: true,
      total: stations.length,
      stations,
    });
  } catch (error) {
    console.error('[SurgaRadio] Erreur liste radios:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors du chargement des stations de radio',
    });
  }
});

/**
 * GET /api/surga/radios/:id
 * Détails d'une station locale
 */
router.get('/radios/:id', (req, res) => {
  try {
    const radio = trouverRadioParId(req.params.id);
    if (!radio) {
      return res.status(404).json({
        success: false,
        error: 'Station radio introuvable',
      });
    }
    return res.json({
      success: true,
      radio: {
        ...radio,
        streamUrlProxy: `/api/surga/radios/${radio.id}/stream`,
      },
    });
  } catch (error) {
    console.error('[SurgaRadio] Erreur détail radio:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de la station',
    });
  }
});

/**
 * GET /api/surga/radios/:id/stream
 * Proxy de flux audio direct (compatibilité HTTPS et Low-Data)
 */
router.get('/radios/:id/stream', (req, res) => {
  return proxifierFlux(req.params.id, req, res);
});

module.exports = router;
