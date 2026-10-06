// backend/routes/surga/immo.js
// Routes API pour le pôle Immobilier et le moteur d'alertes Surga (Tranche 12)
// Zéro émoji, vouvoiement strict D19, sécurité multi-tenant anti-IDOR

const express = require('express');
const router = express.Router();
const { tokenOptional } = require('../../middlewares/auth');
const {
  QUARTIERS_DAKAR,
  parserRechercheImmoNaturelle,
  rechercherBiensImmo,
  recupererBienParId,
  creerAlerteImmo,
  listerAlertesImmo,
  basculerAlerteImmo,
  supprimerAlerteImmo,
  genererSyntheseImmoBriefing,
} = require('../../services/surga/immo-service');

/**
 * GET /api/surga/immo/quartiers
 * Liste officielle des quartiers couverts par Surga à Dakar
 */
router.get('/immo/quartiers', (req, res) => {
  return res.json({
    success: true,
    quartiers: QUARTIERS_DAKAR,
  });
});

/**
 * GET /api/surga/immo/biens
 * Recherche multi-critères dans le pôle immobilier existant
 */
router.get('/immo/biens', async (req, res) => {
  try {
    const {
      type_bien,
      transaction,
      quartier,
      prix_min,
      prix_max,
      meuble,
      q,
      page = 1,
      limit = 20,
    } = req.query;

    const meubleBool =
      meuble === 'true' || meuble === '1'
        ? true
        : meuble === 'false' || meuble === '0'
        ? false
        : null;

    const result = await rechercherBiensImmo({
      typeBien: type_bien,
      transaction,
      quartier,
      prixMin: prix_min ? parseInt(prix_min, 10) : 0,
      prixMax: prix_max ? parseInt(prix_max, 10) : null,
      meuble: meubleBool,
      q,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20,
    });

    return res.json({
      success: true,
      total: result.total,
      biens: result.biens,
    });
  } catch (error) {
    console.error('[SurgaImmo] Erreur recherche biens:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la recherche de biens immobiliers',
    });
  }
});

/**
 * POST /api/surga/immo/recherche-vocale
 * Détecte les critères d'une requête vocale ou textuelle libre et retourne les biens
 */
router.post('/immo/recherche-vocale', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Veuillez énoncer ou écrire votre recherche immobilière.',
      });
    }

    const criteres = parserRechercheImmoNaturelle(query);
    const result = await rechercherBiensImmo({
      typeBien: criteres.typeBien,
      transaction: criteres.transaction,
      quartier: criteres.quartier,
      prixMax: criteres.prixMax,
      meuble: criteres.meuble,
      nbChambres: criteres.nbChambres,
      limit: 15,
    });

    return res.json({
      success: true,
      criteres,
      total: result.total,
      biens: result.biens,
      message:
        result.total > 0
          ? `Nous avons trouvé ${result.total} bien(s) correspondant à votre recherche.`
          : 'Aucun bien disponible ne correspond exactement à ces critères pour le moment. Vous pouvez créer une alerte.',
    });
  } catch (error) {
    console.error('[SurgaImmo] Erreur recherche vocale:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors du traitement de votre recherche vocale',
    });
  }
});

/**
 * GET /api/surga/immo/biens/:id
 * Fiche détaillée d'un bien avec coordonnées de l'agence
 */
router.get('/immo/biens/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const bien = await recupererBienParId(id);

    if (!bien) {
      return res.status(404).json({
        success: false,
        error: 'Bien immobilier introuvable ou non disponible',
      });
    }

    return res.json({
      success: true,
      bien,
    });
  } catch (error) {
    console.error('[SurgaImmo] Erreur détail bien:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors du chargement de la fiche du bien',
    });
  }
});

/**
 * GET /api/surga/immo/alertes
 * Liste des alertes programmées de l'utilisateur
 */
router.get('/immo/alertes', tokenOptional, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.json({
        success: true,
        alertes: [],
        guest: true,
        message: 'Connectez-vous pour synchroniser vos alertes immobilières.',
      });
    }

    const alertes = await listerAlertesImmo(userId);
    return res.json({
      success: true,
      alertes,
    });
  } catch (error) {
    console.error('[SurgaImmo] Erreur liste alertes:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de vos alertes',
    });
  }
});

/**
 * POST /api/surga/immo/alertes
 * Création d'une alerte personnalisée
 */
router.post('/immo/alertes', tokenOptional, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        requireAuth: true,
        error: 'Connectez-vous via WhatsApp pour activer vos alertes immobilières.',
      });
    }
    const {
      titre,
      type_bien,
      transaction,
      quartier,
      prix_max,
      prix_min,
      meuble,
      phone,
    } = req.body;

    if (!titre || typeof titre !== 'string' || !titre.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Le libellé de votre alerte est obligatoire.',
      });
    }

    const alerte = await creerAlerteImmo({
      userId: userId || null,
      phone: phone || null,
      titre,
      typeBien: type_bien || 'tous',
      transaction: transaction || 'location',
      quartier: quartier || null,
      prixMax: prix_max ? parseInt(prix_max, 10) : null,
      prixMin: prix_min ? parseInt(prix_min, 10) : 0,
      meuble: typeof meuble === 'boolean' ? meuble : null,
    });

    return res.status(201).json({
      success: true,
      alerte,
      message: 'Votre alerte immobilière a été activée. Vous serez notifié dès qu un bien conforme sera publié.',
    });
  } catch (error) {
    console.error('[SurgaImmo] Erreur création alerte:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la création de l alerte',
    });
  }
});

/**
 * PATCH /api/surga/immo/alertes/:id/toggle
 * Activer ou désactiver une alerte
 */
router.patch('/immo/alertes/:id/toggle', tokenOptional, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { id } = req.params;

    const modifiee = await basculerAlerteImmo(id, userId);
    if (!modifiee && userId) {
      return res.status(404).json({
        success: false,
        error: 'Alerte introuvable ou non autorisée.',
      });
    }

    return res.json({
      success: true,
      alerte: modifiee,
      message: modifiee && modifiee.actif ? 'Alerte réactivée.' : 'Alerte mise en veille.',
    });
  } catch (error) {
    console.error('[SurgaImmo] Erreur bascule alerte:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour de l alerte',
    });
  }
});

/**
 * DELETE /api/surga/immo/alertes/:id
 * Supprimer une alerte (sécurité anti-IDOR)
 */
router.delete('/immo/alertes/:id', tokenOptional, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { id } = req.params;

    const supprime = await supprimerAlerteImmo(id, userId);
    if (!supprime && userId) {
      return res.status(404).json({
        success: false,
        error: 'Alerte introuvable ou vous n avez pas les droits pour la supprimer.',
      });
    }

    return res.json({
      success: true,
      message: 'Alerte immobilière supprimée avec succès.',
    });
  } catch (error) {
    console.error('[SurgaImmo] Erreur suppression alerte:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression de l alerte',
    });
  }
});

/**
 * GET /api/surga/immo/synthese
 * Synthèse pour le briefing matinal au vouvoiement strict D19
 */
router.get('/immo/synthese', tokenOptional, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const alertes = userId ? await listerAlertesImmo(userId) : [];
    const { biens } = await rechercherBiensImmo({ limit: 5 });
    const synthese = genererSyntheseImmoBriefing(alertes, biens);

    return res.json({
      success: true,
      synthese,
    });
  } catch (error) {
    console.error('[SurgaImmo] Erreur synthèse briefing immo:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur synthèse immo',
    });
  }
});

module.exports = router;
