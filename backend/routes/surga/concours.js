// backend/routes/surga/concours.js
// Routes API pour le suivi des concours & examens du Sénégal (Tranche 13)
// Zéro émoji, vouvoiement strict D19, sécurité multi-tenant anti-IDOR

const express = require('express');
const router = express.Router();
const { tokenOptional } = require('../../middlewares/auth');
const {
  CATEGORIES_CONCOURS,
  listerConcours,
  recupererConcoursParId,
  suivreConcours,
  nePlusSuivreConcours,
  listerConcoursSuivis,
  genererSyntheseConcoursBriefing,
} = require('../../services/surga/concours-service');

/**
 * GET /api/surga/concours/categories
 * Catégories officielles des concours
 */
router.get('/concours/categories', (req, res) => {
  return res.json({
    success: true,
    categories: CATEGORIES_CONCOURS,
  });
});

/**
 * GET /api/surga/concours
 * Liste des concours et examens avec filtres
 */
router.get('/concours', async (req, res) => {
  try {
    const {
      categorie = 'tous',
      statut = 'tous',
      niveau = 'tous',
      q = '',
      page = 1,
      limit = 20,
    } = req.query;

    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const result = await listerConcours({
      categorie,
      statut,
      niveau,
      q,
      limit: parseInt(limit, 10) || 20,
      offset,
    });

    return res.json({
      success: true,
      total: result.total,
      concours: result.concours,
    });
  } catch (error) {
    console.error('[SurgaConcours] Erreur liste concours:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors du chargement des concours',
    });
  }
});

/**
 * GET /api/surga/concours/suivis
 * Liste des concours suivis par l'utilisateur connecté
 */
router.get('/concours/suivis', tokenOptional, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      // Mode invité : retourne simulation ou vide
      return res.json({
        success: true,
        guest: true,
        concours: [],
        message: 'Connectez-vous pour synchroniser vos rappels de concours.',
      });
    }

    const suivis = await listerConcoursSuivis(userId);
    return res.json({
      success: true,
      concours: suivis,
    });
  } catch (error) {
    console.error('[SurgaConcours] Erreur liste concours suivis:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors du chargement de vos concours suivis',
    });
  }
});

/**
 * GET /api/surga/concours/synthese
 * Synthèse concise pour le briefing matinal au vouvoiement strict D19
 */
router.get('/concours/synthese', tokenOptional, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const suivis = userId ? await listerConcoursSuivis(userId) : [];
    const synthese = genererSyntheseConcoursBriefing(suivis);

    return res.json({
      success: true,
      synthese,
    });
  } catch (error) {
    console.error('[SurgaConcours] Erreur synthèse concours:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur synthèse concours',
    });
  }
});

/**
 * GET /api/surga/concours/:id
 * Fiche détaillée d'un concours avec pièces à fournir et centres de préparation
 */
router.get('/concours/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const concours = await recupererConcoursParId(id);

    if (!concours) {
      return res.status(404).json({
        success: false,
        error: 'Concours ou examen introuvable',
      });
    }

    return res.json({
      success: true,
      concours,
    });
  } catch (error) {
    console.error('[SurgaConcours] Erreur fiche concours:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors du chargement du concours',
    });
  }
});

/**
 * POST /api/surga/concours/:id/suivre
 * Suivre un concours et programmer les rappels J-30 / J-7 / J-1
 */
router.post('/concours/:id/suivre', tokenOptional, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { id } = req.params;
    const { phone } = req.body || {};

    const resultat = await suivreConcours({
      userId: userId || null,
      concoursId: id,
      phone: phone || null,
    });

    return res.json({
      success: true,
      message: resultat.message,
      suivi: resultat.suivi,
      concours: resultat.concours,
    });
  } catch (error) {
    console.error('[SurgaConcours] Erreur suivi concours:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de l enregistrement du suivi',
    });
  }
});

/**
 * DELETE /api/surga/concours/:id/suivre
 * Ne plus suivre un concours et désactiver les rappels
 */
router.delete('/concours/:id/suivre', tokenOptional, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { id } = req.params;

    const ok = await nePlusSuivreConcours(userId, id);
    return res.json({
      success: ok,
      message: 'Vous ne suivez plus ce concours.',
    });
  } catch (error) {
    console.error('[SurgaConcours] Erreur désabonnement concours:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la désactivation du suivi',
    });
  }
});

module.exports = router;
