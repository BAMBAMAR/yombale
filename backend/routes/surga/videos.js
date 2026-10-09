// backend/routes/surga/videos.js
// Routes REST pour les alertes vidéos : Séries & Lutte sénégalaise (Tranche 17)
// Anti-IDOR, vérification JWT, Zero-Emoji, Low-Data

const express = require('express');
const router = express.Router();
const { verifierToken, tokenOptional } = require('../../middlewares/surga-auth');
const {
  getSources,
  getDernieresVideos,
  getAbonnementsUtilisateur,
  toggleAbonnementUtilisateur,
} = require('../../services/surga/video-service');

/**
 * GET /api/surga/videos/sources
 * Récupère le catalogue des sources vidéo officielles (Séries TV et Lutte)
 */
router.get('/videos/sources', tokenOptional, async (req, res) => {
  try {
    const { type } = req.query;
    const sources = await getSources({ type: type || null, actifOnly: true });

    let abonnementsIds = [];
    const userId = req.user?.userId || req.user?.id;
    if (userId) {
      const abos = await getAbonnementsUtilisateur(userId);
      abonnementsIds = abos.map((a) => a.source_id);
    }

    const sourcesEnrichies = sources.map((s) => ({
      ...s,
      est_abonne: abonnementsIds.includes(s.id),
    }));

    res.json({
      success: true,
      sources: sourcesEnrichies,
      total: sourcesEnrichies.length,
    });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/surga/videos/abonnements
 * Récupère les abonnements de l'utilisateur connecté (Anti-IDOR)
 */
router.get('/videos/abonnements', verifierToken, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Utilisateur non authentifié.' });
    }

    const abonnements = await getAbonnementsUtilisateur(userId);
    res.json({
      success: true,
      abonnements,
      total: abonnements.length,
    });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/surga/videos/abonnements/:sourceId/toggle
 * Active ou désactive le suivi d'une série ou d'une chaîne de lutte
 */
router.post('/videos/abonnements/:sourceId/toggle', verifierToken, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { sourceId } = req.params;
    const { canal = 'in_app' } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Utilisateur non authentifié.' });
    }

    if (!sourceId) {
      return res.status(400).json({ success: false, error: 'Identifiant de source manquant.' });
    }

    const resultat = await toggleAbonnementUtilisateur(userId, sourceId, canal);
    res.json({
      success: true,
      ...resultat,
      message: resultat.abonne
        ? 'Abonnement activé avec succès. Vous recevrez une alerte lors des prochaines sorties.'
        : 'Abonnement retiré avec succès.',
    });
  } catch (err) {
    if (err.code === 'ENREGISTREMENT_IMPOSSIBLE') return res.status(503).json({ success: false, error: err.message });
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/surga/videos/derniers
 * Récupère les derniers épisodes et vidéos parus
 */
router.get('/videos/derniers', tokenOptional, async (req, res) => {
  try {
    const { limit = 20, type = null, sourceId = null, suivis_uniquement = '0' } = req.query;
    const userId = req.user?.userId || req.user?.id;

    const filtreUserId = (suivis_uniquement === '1' || suivis_uniquement === 'true') && userId ? userId : null;

    const videos = await getDernieresVideos({
      limit: parseInt(limit, 10) || 20,
      type: type || null,
      sourceId: sourceId || null,
      userId: filtreUserId,
    });

    res.json({
      success: true,
      videos,
      total: videos.length,
    });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

module.exports = router;
