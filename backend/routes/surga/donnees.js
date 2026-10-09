// backend/routes/surga/donnees.js
// Routes REST d'export et suppression des données personnelles Surga (Tranche 16)
// Zéro émoji, vouvoiement strict D19, conformité CDP Sénégal & RGPD

const express = require('express');
const router = express.Router();
const { verifierToken } = require('../../middlewares/surga-auth');
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
    // Le texte de l'erreur de base ne sort pas : il nommait la base et ses tables.
    console.error('[SURGA DONNEES]', err.message);
    return res.status(503).json({ success: false, error: 'L\'export n\'a pas pu être préparé. Veuillez réessayer dans un instant.' });
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

    // D39 : la réponse dit ce qui est conservé.
    const conserves = bilan.abonnements_conserves_anonymises || 0;
    const message = conserves > 0
      ? `Vos données Surga ont été définitivement supprimées. ${conserves > 1 ? `${conserves} paiements d'abonnement sont conservés` : 'Un paiement d\'abonnement est conservé'} pour la comptabilité, sans votre numéro ni votre identifiant : l'abonnement n'est plus rattaché à votre compte.`
      : 'Vos données Surga ont été définitivement supprimées.';

    return res.json({
      success: true,
      message,
      bilan,
    });
  } catch (err) {
    // Le texte de l'erreur de base ne sort pas : il nommait la base et ses tables.
    console.error('[SURGA DONNEES]', err.message);
    return res.status(503).json({ success: false, error: 'La suppression n\'a pas eu lieu : aucune donnée n\'a été retirée. Veuillez réessayer dans un instant.' });
  }
});

module.exports = router;

