// backend/routes/surga/assistant.js
// Route d'exécution de l'assistant unifié Surga (LLM + Actions & Données Locales)

const express = require('express');
const router = express.Router();
const { traiterRequeteSurgaAssistant } = require('../../services/surga/assistant-llm');

/**
 * POST /api/surga/assistant
 * Traite une requête de l'Omnibar Surga (rédaction, question, action locale, navigation)
 */
router.post('/assistant', async (req, res) => {
  try {
    const rawQuery = req.body?.query || req.body?.requete;
    const userId = req.user?.id || req.body?.userId || null;

    if (!rawQuery || typeof rawQuery !== 'string' || !rawQuery.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Requête vide',
      });
    }

    const query = rawQuery.trim();

    const resultat = await traiterRequeteSurgaAssistant({
      query,
      userId,
    });

    return res.json({
      success: true,
      resultat,
    });
  } catch (err) {
    console.error('[SURGA ASSISTANT ROUTE ERR]:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors du traitement de la requête par l\'assistant Surga.',
    });
  }
});

module.exports = router;
