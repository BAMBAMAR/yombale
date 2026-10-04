// backend/routes/surga/kiosque.js
// Route API pour le Kiosque des Unes de la presse sénégalaise

const express = require('express');
const router = express.Router();
const { recupererUnesDuJour } = require('../../services/surga/kiosque-service');

// GET /api/surga/kiosque
// Retourne la liste des Unes de la presse sénégalaise
router.get('/kiosque', async (req, res) => {
  try {
    const { limit } = req.query;
    const unes = await recupererUnesDuJour({
      limit: limit ? parseInt(limit, 10) : 20,
    });

    return res.json({
      success: true,
      total: unes.length,
      date: new Date().toISOString().slice(0, 10),
      unes,
    });
  } catch (err) {
    console.error('[SURGA KIOSQUE ERROR]:', err);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des Unes de presse.',
    });
  }
});

module.exports = router;
