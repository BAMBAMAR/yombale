// backend/services/ai-agent.js
// Service d'Agent IA Autonome de Vente et Négociation Commerciale (Point 07 Audit)

const { pool } = require('../models/db');

/**
 * Traite un message client et négocie ou répond selon les règles métiers paramétrées
 * @param {string} boutiqueId - UUID de la boutique
 * @param {string} userMessage - Message du client
 * @param {object} cartContext - { articles: Array, totalFCFA: number }
 * @returns {Promise<{ reply: string, discountGranted: number, finalTotal: number }>}
 */
async function processAgentNegotiation(boutiqueId, userMessage, cartContext = {}) {
  if (!boutiqueId || !userMessage) {
    return { reply: 'Bonjour ! Comment puis-je vous aider aujourd\'hui ?', discountGranted: 0, finalTotal: cartContext.totalFCFA || 0 };
  }

  try {
    const { rows } = await pool.query(
      `SELECT prompt_systeme, marge_remise_max, actif FROM boutique_ai_agents WHERE boutique_id = $1`,
      [boutiqueId]
    );

    const config = rows[0] || { prompt_systeme: '', marge_remise_max: 5, actif: true };

    if (!config.actif) {
      return { reply: 'Bonjour, notre assistant virtuel est temporairement désactivé.', discountGranted: 0, finalTotal: cartContext.totalFCFA || 0 };
    }

    const cleanMsg = userMessage.toLowerCase();
    const maxPct = Number(config.marge_remise_max) || 5;
    const initialTotal = Number(cartContext.totalFCFA) || 0;

    // Détection d'intention de négociation / réduction
    const isAskingDiscount = /prix|reduction|remise|rabais|solde|dernier prix|geste|diminuer|waaniko/i.test(cleanMsg);

    if (isAskingDiscount && initialTotal > 0) {
      // Calcul du rabais autorisé (maximum maxPct%)
      const discountPct = Math.min(maxPct, 5); // 5% de geste commercial
      const discountAmount = Math.round((initialTotal * discountPct) / 100);
      const finalTotal = initialTotal - discountAmount;

      return {
        reply: `En tant qu'assistant Nopalou, je peux exceptionnellement vous accorder une remise de ${discountPct}% (${discountAmount.toLocaleString('fr-FR')} FCFA). Votre nouveau total est de ${finalTotal.toLocaleString('fr-FR')} FCFA. Voulez-vous valider votre commande ?`,
        discountGranted: discountAmount,
        finalTotal
      };
    }

    // Réponse standard d'orientation client
    return {
      reply: 'Merci pour votre message ! Tous nos produits sont garantis et expédiés rapidement. Souhaitez-vous des détails sur un produit en particulier ou valider votre commande ?',
      discountGranted: 0,
      finalTotal: initialTotal
    };
  } catch (err) {
    console.error('[AI AGENT ERR]:', err);
    return { reply: 'Une erreur s\'est produite. Notre équipe humaine est à votre disposition.', discountGranted: 0, finalTotal: cartContext.totalFCFA || 0 };
  }
}

module.exports = {
  processAgentNegotiation
};
