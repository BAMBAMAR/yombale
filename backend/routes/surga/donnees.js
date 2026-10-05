// backend/routes/surga/donnees.js
// Routes REST d'export et suppression des données personnelles Surga (Tranche 16)
// Zéro émoji, vouvoiement strict D19, conformité CDP Sénégal & RGPD

const express = require('express');
const router = express.Router();
const { verifierToken } = require('../../middlewares/auth');
const {
  exporterDonneesUtilisateur,
  supprimerDonneesUtilisateur,
} = require('../../services/surga/donnees-service');

/**
 * GET /api/surga/donnees/export
 * Téléchargement des données personnelles au format JSON (authentification stricte JWT obligatoire)
 */
router.get('/donnees/export', verifierToken, async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Veuillez vous authentifier pour exporter vos données personnelles.',
      });
    }

    const donnees = await exporterDonneesUtilisateur({ userId });

    // Envoi sous forme de fichier téléchargeable
    const filename = `surga-donnees-${Date.now()}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(JSON.stringify(donnees, null, 2));
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/surga/donnees/supprimer
 * Purge irréversible et complète des données personnelles (authentification stricte JWT obligatoire)
 */
router.delete('/donnees/supprimer', verifierToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const confirmation = req.body?.confirmation;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Veuillez vous authentifier pour demander la suppression de vos données.',
      });
    }

    if (confirmation !== 'SUPPRIMER') {
      return res.status(400).json({
        success: false,
        error: 'Veuillez confirmer l opération en renseignant la mention SUPPRIMER.',
      });
    }

    const bilan = await supprimerDonneesUtilisateur({ userId });

    return res.json({
      success: true,
      message: 'L ensemble de vos données Surga a été définitivement supprimé avec succès.',
      bilan,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

