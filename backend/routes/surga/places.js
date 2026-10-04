// backend/routes/surga/places.js
// Routes API pour les Bons Plans & Bonnes Adresses à Dakar (Tranche 14)
// Zéro émoji, vouvoiement strict D19, sécurité multi-tenant anti-IDOR

const express = require('express');
const router = express.Router();
const { tokenOptional } = require('../../middlewares/auth');
const {
  CATEGORIES_PLACES,
  TAGS_AMBIANCE,
  parserRecherchePlacesNaturelle,
  rechercherPlaces,
  recupererPlaceParId,
  basculerFavoriPlace,
  listerFavorisPlaces,
  genererSynthesePlacesBriefing,
} = require('../../services/surga/places-service');

/**
 * GET /api/surga/places/categories
 * Liste des catégories d'adresses et ambiances
 */
router.get('/places/categories', (req, res) => {
  return res.json({
    success: true,
    categories: CATEGORIES_PLACES,
    ambiances: TAGS_AMBIANCE,
  });
});

/**
 * GET /api/surga/places
 * Recherche multi-critères des bonnes adresses
 */
router.get('/places', async (req, res) => {
  try {
    const {
      categorie = 'tous',
      quartier,
      budget_max,
      ambiance,
      q,
      page = 1,
      limit = 20,
    } = req.query;

    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const result = await rechercherPlaces({
      categorie,
      quartier,
      budgetMax: budget_max ? parseInt(budget_max, 10) : null,
      ambiance,
      q,
      limit: parseInt(limit, 10) || 20,
      offset,
    });

    return res.json({
      success: true,
      total: result.total,
      places: result.places,
    });
  } catch (error) {
    console.error('[SurgaPlaces] Erreur liste places:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des bonnes adresses',
    });
  }
});

/**
 * POST /api/surga/places/recherche-vocale
 * Détection automatique d'envie et recommandation immédiate de 3 adresses
 */
router.post('/places/recherche-vocale', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Veuillez préciser votre envie ou votre quartier.',
      });
    }

    const criteres = parserRecherchePlacesNaturelle(query);
    const result = await rechercherPlaces({
      categorie: criteres.categorie,
      quartier: criteres.quartier,
      ambiance: criteres.ambiance,
      budgetMax: criteres.budgetMax,
      limit: 3,
    });

    return res.json({
      success: true,
      criteres,
      total: result.total,
      recommandations: result.places.slice(0, 3),
      message:
        result.places.length > 0
          ? `Voici ${result.places.length} excellente(s) adresse(s) recommandée(s) pour votre envie.`
          : 'Aucune adresse ne correspond exactement à ces critères. Voici nos suggestions du moment.',
    });
  } catch (error) {
    console.error('[SurgaPlaces] Erreur recherche vocale places:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors du traitement de votre recherche d adresse',
    });
  }
});

/**
 * GET /api/surga/places/favoris
 * Liste des adresses coups de cœur de l'utilisateur
 */
router.get('/places/favoris', tokenOptional, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.json({
        success: true,
        guest: true,
        places: [],
        message: 'Connectez-vous pour synchroniser vos adresses favorites.',
      });
    }

    const favoris = await listerFavorisPlaces(userId);
    return res.json({
      success: true,
      places: favoris,
    });
  } catch (error) {
    console.error('[SurgaPlaces] Erreur liste favoris:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors du chargement de vos favoris',
    });
  }
});

/**
 * GET /api/surga/places/synthese
 * Synthèse concise pour le briefing du matin au vouvoiement strict D19
 */
router.get('/places/synthese', async (req, res) => {
  try {
    const { places } = await rechercherPlaces({ limit: 3 });
    const synthese = genererSynthesePlacesBriefing(places, req.query.quartier || 'Dakar');

    return res.json({
      success: true,
      synthese,
    });
  } catch (error) {
    console.error('[SurgaPlaces] Erreur synthèse places:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur synthèse bonnes adresses',
    });
  }
});

/**
 * GET /api/surga/places/:id
 * Fiche détaillée d'une adresse avec résumé honnête
 */
router.get('/places/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const place = await recupererPlaceParId(id);

    if (!place) {
      return res.status(404).json({
        success: false,
        error: 'Adresse introuvable',
      });
    }

    return res.json({
      success: true,
      place,
    });
  } catch (error) {
    console.error('[SurgaPlaces] Erreur fiche place:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors du chargement de la fiche de l adresse',
    });
  }
});

/**
 * POST /api/surga/places/:id/favori
 * Ajouter ou retirer des favoris
 */
router.post('/places/:id/favori', tokenOptional, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { id } = req.params;

    const estFavori = await basculerFavoriPlace(userId, id);
    return res.json({
      success: true,
      estFavori,
      message: estFavori ? 'Adresse ajoutée à vos favoris.' : 'Adresse retirée de vos favoris.',
    });
  } catch (error) {
    console.error('[SurgaPlaces] Erreur bascule favori:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour des favoris',
    });
  }
});

module.exports = router;
