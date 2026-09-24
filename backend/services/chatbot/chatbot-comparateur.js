// backend/services/chatbot/chatbot-comparateur.js
// Module spécialisé dans la gestion conversationnelle du Comparateur de Prix Nopalou sur WhatsApp

'use strict';

const {
  detecterIntentionComparateur,
  extraireSujetComparaison,
  comparerPrixProduits,
  formaterComparatifWhatsApp,
} = require('../whatsapp-comparator');
const { sendWhatsAppText, sendWhatsAppButtons3 } = require('../whatsapp');

const SITE = process.env.FRONTEND_URL || 'https://nopalou.com';

/**
 * Traite un message utilisateur exprimant une intention de comparaison de prix.
 * @param {string} phone - Numéro WhatsApp de l'utilisateur
 * @param {string} text - Message texte envoyé
 * @param {object} [options] - Options optionnelles (fonction de correction fuzzy, etc.)
 * @returns {Promise<boolean>} - true si la requête a été traitée (ou message d'aide envoyé), false pour fallback
 */
async function traiterRequeteComparateur(phone, text, options = {}) {
  const sujet = extraireSujetComparaison(text);
  if (!sujet || sujet.length < 2) {
    await sendWhatsAppText(
      phone,
      `⚖️ *Comparateur de Prix Nopalou*\n\nPour comparer des prix en direct entre marchands, indiquez simplement le produit désiré.\n\n*Exemples :*\n• _comparer iphone 13_\n• _comparer climatiseur_\n• _moins cher samsung s23_\n• _meilleur prix téléviseur_`
    );
    return true;
  }

  let resComp = await comparerPrixProduits(sujet);
  if (!resComp.offres || resComp.offres.length === 0) {
    // Si aucun résultat direct, tentative avec correction fuzzy
    const corrigerFuzzy = options.corrigerRequeteFuzzy;
    if (typeof corrigerFuzzy === 'function') {
      const fuzzySujet = corrigerFuzzy(sujet);
      if (fuzzySujet && fuzzySujet !== sujet) {
        const resFuzzy = await comparerPrixProduits(fuzzySujet);
        if (resFuzzy.offres && resFuzzy.offres.length > 0) {
          resComp = resFuzzy;
        }
      }
    }
  }

  if (!resComp.offres || resComp.offres.length === 0) {
    return false; // Relais vers la recherche générale
  }

  const { texte, boutons } = formaterComparatifWhatsApp(resComp, SITE);
  if (boutons && boutons.length > 0) {
    await sendWhatsAppButtons3(phone, texte, boutons).catch(async () => {
      await sendWhatsAppText(phone, texte);
    });
  } else {
    await sendWhatsAppText(phone, texte);
  }
  return true;
}

module.exports = {
  detecterIntentionComparateur,
  extraireSujetComparaison,
  comparerPrixProduits,
  formaterComparatifWhatsApp,
  traiterRequeteComparateur,
};
