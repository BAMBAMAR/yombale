// backend/routes/surga/shopping.js
// Route API pour le service Shopping Nopalou dans Surga

const express = require('express');
const router = express.Router();
const { listerShopping } = require('../../services/surga/shopping-service');

/**
 * GET /api/surga/shopping
 * Récupère les boutiques Nopalou et leurs produits avec recherche et filtres
 */
router.get('/shopping', async (req, res) => {
  try {
    const { categorie = 'tous', q = '', limit = 50 } = req.query;
    const resultat = await listerShopping({
      categorie,
      q,
      limit: parseInt(limit, 10) || 50,
    });

    return res.json({
      success: true,
      boutiques: resultat.boutiques,
      produits: resultat.produits,
      totalBoutiques: resultat.totalBoutiques,
      totalProduits: resultat.totalProduits,
    });
  } catch (err) {
    console.error('[GET /api/surga/shopping]', err.message);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des boutiques et produits',
    });
  }
});

module.exports = router;
