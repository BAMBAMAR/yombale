// backend/routes/surga/kiosque.js
// Route API pour le Kiosque des Unes de la presse sénégalaise

const express = require('express');
const { requireAdminAuth } = require('../../middlewares/admin-rbac');
const router = express.Router();
const { recupererUnesDuJour, synchroniserUnesProjetBi } = require('../../services/surga/kiosque-service');

// GET /api/surga/kiosque
// Retourne la liste des Unes de la presse sénégalaise
router.get('/kiosque', async (req, res) => {
  try {
    const { limit } = req.query;
    const unes = await recupererUnesDuJour({
      limit: limit ? parseInt(limit, 10) : 50,
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

// POST /api/surga/kiosque/sync
// Force la synchronisation des Unes depuis ProjetBI (LE-PROJET)
// SRG-A1-014 : déclencheur réservé à l'administration ; l'application ne l'appelle pas.
router.post('/kiosque/sync', requireAdminAuth, async (req, res) => {
  try {
    const result = await synchroniserUnesProjetBi();
    const unes = await recupererUnesDuJour({ limit: 50 });

    return res.json({
      success: true,
      message: `Synchronisation réussie : ${result.total || unes.length} Unes disponibles.`,
      ...result,
      unes,
    });
  } catch (err) {
    console.error('[SURGA KIOSQUE SYNC ERROR]:', err);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la synchronisation des Unes depuis ProjetBI.',
    });
  }
});

module.exports = router;
