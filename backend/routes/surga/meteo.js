// backend/routes/surga/meteo.js
// API de consultation météo et marées pour Surga

const express = require('express');
const router = express.Router();
const { tokenOptional } = require('../../middlewares/auth');
const { getMeteo, VILLES_SENEGAL } = require('../../services/surga/meteo-service');

// GET /api/surga/meteo
// Retourne la météo en direct, marées, indice UV et prévisions 3 jours
router.get('/meteo', tokenOptional, async (req, res) => {
  try {
    const ville = req.query.ville || 'Dakar';
    const donnees = await getMeteo(ville);
    res.json({
      success: true,
      meteo: donnees,
      villes_disponibles: Object.keys(VILLES_SENEGAL),
    });
  } catch (err) {
    console.error('[SURGA METEO ERR]:', err.message);
    res.status(500).json({ success: false, error: 'Impossible de récupérer la météo' });
  }
});

module.exports = router;
