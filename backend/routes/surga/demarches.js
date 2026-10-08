// backend/routes/surga/demarches.js
// Routes REST client pour les démarches administratives sénégalaises vérifiées (Tranche 20)
// Fiches éditoriales officielles, cycle de 90 jours, quotas de suivi, anti-IDOR
// Zéro émoji Unicode, vouvoiement strict D19

const express = require('express');
const router = express.Router();
const { verifierToken, tokenOptional } = require('../../middlewares/surga-auth');
const demarchesService = require('../../services/surga/demarches-service');

/**
 * GET /api/surga/demarches
 * Recherche déterministe et consultation des démarches vérifiées
 */
router.get('/demarches', async (req, res) => {
  try {
    const { q, categorie, mode_demo } = req.query;
    const includeBrouillons = mode_demo === 'true' || mode_demo === '1';

    const resultat = await demarchesService.rechercherDemarches({
      query: q,
      categorie,
      includeBrouillons,
    });

    return res.json({
      success: true,
      ...resultat,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/surga/demarches/categories
 * Liste des catégories officielles
 */
router.get('/demarches/categories', (req, res) => {
  return res.json({
    success: true,
    categories: demarchesService.CATEGORIES_DEMARCHES,
  });
});

/**
 * GET /api/surga/demarches/suivis
 * Récupère les démarches suivies par l'utilisateur connecté (ou vide si invité)
 */
router.get('/demarches/suivis', tokenOptional, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.json({
        success: true,
        guest: true,
        suivis: [],
        total: 0,
        quota: { autorise: false, limite: 1, totalSuivis: 0, guest: true },
      });
    }

    const suivis = await demarchesService.getSuivisUtilisateur(userId);
    const droit = await demarchesService.verifierDroitSuiviDemarche(userId);

    return res.json({
      success: true,
      suivis,
      total: suivis.length,
      quota: droit,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/surga/demarches/:id/suivis
 * Ajoute ou met à jour le suivi d'une démarche (Contrôle de quota gratuit vs Premium)
 */
router.post('/demarches/:id/suivis', verifierToken, async (req, res) => {
  try {
    // Le jeton de session porte « userId » ; « id » n'existe pas et le suivi partait sans propriétaire.
    const userId = req.user.userId;
    const { id } = req.params;
    const { date_echeance, notes } = req.body || {};

    const suivi = await demarchesService.ajouterSuiviDemarche(userId, id, {
      date_echeance,
      notes,
    });

    return res.json({
      success: true,
      suivi,
      message: 'Démarche ajoutée à vos suivis avec succès.',
    });
  } catch (err) {
    if (err.code === 'QUOTA_ATTEINT') {
      return res.status(403).json({
        success: false,
        quota_atteint: true,
        error: err.message,
        limite: err.limite,
      });
    }
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/surga/demarches/:id/suivis
 * Supprime le suivi d'une démarche (Anti-IDOR strict)
 */
router.delete('/demarches/:id/suivis', verifierToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const supprime = await demarchesService.supprimerSuiviDemarche(userId, id);
    return res.json({
      success: supprime,
      message: supprime
        ? 'Le suivi de cette démarche a été retiré.'
        : 'Aucun suivi actif trouvé pour cette démarche.',
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/surga/demarches/:id/signalements
 * Signale une inexactitude ou une erreur sur une démarche (Fiche éditoriale)
 */
router.post('/demarches/:id/signalements', tokenOptional, async (req, res) => {
  try {
    const { id } = req.params;
    const { message, contact_email } = req.body || {};

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Veuillez préciser la nature de l\'erreur ou de l\'inexactitude constatée.',
      });
    }

    // L'ancienne lecture du jeton se faisait ici, avec un secret de repli écrit dans le code et un champ « id »
    // absent du jeton : le signalement n'était jamais rattaché à son auteur.
    const userId = req.user?.userId || null;

    const signalement = await demarchesService.creerSignalement({
      demarche_id: id,
      user_id: userId,
      message,
      contact_email,
    });

    return res.json({
      success: true,
      signalement,
      message: 'Votre signalement a été transmis à notre équipe de vérification. Merci pour votre contribution.',
    });
  } catch (err) {
    if (err.code === 'ENREGISTREMENT_IMPOSSIBLE') return res.status(503).json({ success: false, error: err.message });
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/surga/demarches/:id
 * Consultation détaillée d'une démarche par son identifiant ou son slug
 */
router.get('/demarches/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { mode_demo } = req.query;
    const includeBrouillons = mode_demo === 'true' || mode_demo === '1';

    const demarche = await demarchesService.getDemarcheParIdOuSlug(id, {
      includeBrouillons,
    });

    if (!demarche) {
      return res.status(404).json({
        success: false,
        error: 'Cette démarche administrative est introuvable ou n\'a pas encore été validée par la rédaction.',
        portail_officiel: demarchesService.URL_PORTAIL_OFFICIEL,
      });
    }

    return res.json({
      success: true,
      demarche,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
