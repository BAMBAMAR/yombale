// backend/routes/surga/meteo.js
// API de consultation météo et marées pour Surga

const express = require('express');
const router = express.Router();
const { tokenOptional } = require('../../middlewares/auth');
const { getMeteo, VILLES_SENEGAL } = require('../../services/surga/meteo-service');

// GET /api/surga/meteo
// Retourne la météo en direct (par ville ou GPS), marées, indice UV et prévisions 3 jours
router.get('/meteo', tokenOptional, async (req, res) => {
  try {
    const { ville, lat, lon } = req.query;
    let options = 'Dakar';
    if (lat && lon) {
      options = { lat: parseFloat(lat), lon: parseFloat(lon) };
    } else if (ville) {
      options = ville;
    }
    const donnees = await getMeteo(options);
    const localitesList = Object.entries(VILLES_SENEGAL).map(([id, l]) => ({
      id,
      nom: l.nom,
      maritime: l.maritime,
      zone: l.zone || 'Sénégal',
    }));

    res.json({
      success: true,
      meteo: donnees,
      localites: localitesList,
      villes_disponibles: Object.keys(VILLES_SENEGAL),
    });
  } catch (err) {
    console.error('[SURGA METEO ERR]:', err.message);
    res.status(500).json({ success: false, error: 'Impossible de récupérer la météo' });
  }
});

module.exports = router;
