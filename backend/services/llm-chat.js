// backend/services/llm-chat.js — Service IA Conversationnel Hybride Nopalou (Gemini 1.5 Flash RAG)
const axios = require('axios');
const cfg = require('../lib/settingsCache');

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

/**
 * Récupère la clé API Gemini depuis les variables d'environnement ou le cache de paramètres DB
 */
async function getGeminiApiKey() {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    (await cfg.get('gemini_api_key')) ||
    null
  );
}

/**
 * Système Prompt optimisé pour le commerce et l'immobilier au Sénégal
 */
const SYSTEM_INSTRUCTION = `
Tu es Nopalou Assistant, l'agent IA conversationnel officiel de Nopalou (plateforme sénégalaise tout-en-un combinant comparateur de prix e-commerce, carnet de crédit marchand, caisse tactile POS et portail immobilier).
Tu réponds aux utilisateurs de Dakar et de toute la région du Sénégal ainsi qu'à la diaspora.
Tu comprends parfaitement le français, l'anglais, et les expressions wolof usuelles (ex: "dama beug jënd", "bor", "fey bor", "tiak-tiak", "wàññi ko", "amna", "ñaata lay jar").

RÈGLES ABSOLUES :
1. Sois toujours concis, chaleureux, professionnel et direct (2 à 3 phrases maximum).
2. Si l'utilisateur cherche un produit (smartphone, parfum, montre, vêtement...), aide-le à préciser sa recherche ou oriente-le vers le comparateur.
3. Si l'utilisateur cherche un appartement ou une villa à Dakar (Almadies, Ngor, Mermoz, Plateau, Yoff...), confirme sa zone et oriente-le vers les annonces immobilières.
4. Si l'utilisateur demande comment vendre ou créer une boutique, explique que c'est gratuit le 1er mois avec caisse POS et synchronisation WhatsApp.
5. Ne mentionne jamais de numéro de contact autre que le support officiel WhatsApp Nopalou (+221 70 871 79 42).
`;

/**
 * Génère une réponse intelligente assistée par Gemini Flash RAG
 * @param {Object} params
 * @param {string} params.userMessage Message saisi par le visiteur
 * @param {Array} params.contextItems Articles ou biens déjà trouvés en base de données
 * @param {string} params.searchQuery Terme de recherche nettoyé
 */
async function generateLlmChatReply({ userMessage, contextItems = [], searchQuery = '' }) {
  const apiKey = await getGeminiApiKey();

  // Si aucune clé Gemini configurée, bascule fluide en fallback déterministe
  if (!apiKey) {
    return {
      success: false,
      isAiGenerated: false,
      reason: 'no_api_key',
    };
  }

  try {
    let contextPrompt = '';
    if (contextItems && contextItems.length > 0) {
      const topItems = contextItems.slice(0, 3).map(
        (it) => `- ${it.titre || it.nom} (${it.prix ? it.prix + ' FCFA' : 'Prix sur demande'}) [${it.boutiqueNom || 'Boutique certifiée'}]`
      );
      contextPrompt = `\nArticles trouvés en catalogue Nopalou :\n${topItems.join('\n')}\n`;
    }

    const payload = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${SYSTEM_INSTRUCTION}\n\nContexte actuel :${contextPrompt}\nQuestion utilisateur : "${userMessage}"`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 250,
        topP: 0.8,
      },
    };

    const response = await axios.post(`${GEMINI_API_BASE}?key=${apiKey.trim()}`, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 6000,
    });

    const candidate = response.data?.candidates?.[0];
    const rawText = candidate?.content?.parts?.[0]?.text?.trim();

    if (!rawText) {
      return { success: false, isAiGenerated: false, reason: 'empty_gemini_response' };
    }

    return {
      success: true,
      isAiGenerated: true,
      reply: rawText,
    };
  } catch (err) {
    console.warn('[GEMINI CHATBOT WARN]:', err?.response?.data?.error?.message || err.message);
    return {
      success: false,
      isAiGenerated: false,
      error: err.message,
    };
  }
}

/**
 * Analyse sémantique avancée de la requête utilisateur pour extraire mots-clés et filtres
 */
async function extractSearchIntentWithLlm(userMessage) {
  const apiKey = await getGeminiApiKey();
  if (!apiKey) return null;

  try {
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Extrais l'intention principale et les filtres sous forme JSON strict (sans markdown, sans balises) pour cette recherche e-commerce/immobilier sénégalaise : "${userMessage}".
Format attendu:
{"type": "produit" | "immo" | "faq" | "autre", "keyword": "nom du produit ou bien", "quartier": "quartier si immo ou null", "budgetMax": nombre ou null}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 100,
      },
    };

    const res = await axios.post(`${GEMINI_API_BASE}?key=${apiKey.trim()}`, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 4000,
    });

    let text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(text);
  } catch {
    return null;
  }
}

module.exports = {
  generateLlmChatReply,
  extractSearchIntentWithLlm,
  getGeminiApiKey,
};
