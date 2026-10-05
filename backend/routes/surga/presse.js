// backend/routes/surga/presse.js
// API de la Revue de Presse résumée Surga (Tranche 8)
// Rubriques : economie, societe, tech, politique, general
// Sourcing strict : résumés courts (< 180 car), lien obligatoire vers la source originale

const express = require('express');
const router = express.Router();
const {
  recupererRevuePresse,
  collecterTousLesFlux,
  RUBRIQUES_VALIDES,
} = require('../../services/surga/rss-collector');
const { synchroniserUnesProjetBi } = require('../../services/surga/kiosque-service');

// GET /api/surga/presse
// Retourne la revue de presse résumée avec filtrage optionnel par rubrique
router.get('/presse', async (req, res) => {
  try {
    const { rubrique, limit, offset } = req.query;

    const articles = await recupererRevuePresse({
      rubrique: rubrique ? String(rubrique).toLowerCase() : null,
      limit: limit ? parseInt(limit, 10) : 20,
      offset: offset ? parseInt(offset, 10) : 0,
    });

    return res.json({
      success: true,
      rubrique: rubrique || 'toutes',
      rubriques_disponibles: ['toutes', ...RUBRIQUES_VALIDES],
      total: articles.length,
      articles,
    });
  } catch (err) {
    console.error('[SURGA PRESSE ERROR]:', err);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de la revue de presse.',
    });
  }
});

// POST /api/surga/presse/refresh
// Force l'ingestion des derniers flux RSS d'actualité et la synchronisation du Kiosque ProjetBI
router.post('/presse/refresh', async (req, res) => {
  try {
    const [result, resultUnes] = await Promise.all([
      collecterTousLesFlux(),
      synchroniserUnesProjetBi().catch(() => ({ total: 0 })),
    ]);

    return res.json({
      success: true,
      totalNouveaux: result.totalNouveaux,
      totalUnes: resultUnes.total || 0,
      message: `${result.totalNouveaux} article(s) et ${resultUnes.total || 0} Une(s) actualisée(s).`,
    });
  } catch (err) {
    console.error('[SURGA PRESSE REFRESH ERROR]:', err);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de l actualisation des flux de presse.',
    });
  }
});

module.exports = router;
