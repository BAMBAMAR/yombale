// backend/services/whatsapp-comparator.js
// Nopalou — Moteur de Comparaison de Prix Multi-Marchands (Audit M5)
// Fournit la comparaison de prix en direct sur WhatsApp et Web

const { pool } = require('../models/db');

const MOTS_COMPARAISON = [
  'comparer', 'comparatif', 'comparateur', 'comparaison',
  'meilleur prix', 'le moins cher', 'moins cher',
  'versus', ' vs ', 'difference de prix', 'prix le plus bas'
];

function normaliser(str) {
  if (!str) return '';
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

/**
 * Détecte si le message exprime une intention de comparaison de prix
 */
function detecterIntentionComparateur(texte) {
  if (!texte || typeof texte !== 'string') return false;
  const norm = normaliser(texte);
  return MOTS_COMPARAISON.some(m => norm.includes(m));
}

/**
 * Extrait le nom du produit cible en retirant les mots-clés comparatifs
 */
function extraireSujetComparaison(texte) {
  if (!texte) return '';
  return texte
    .replace(/\b(comparer|comparatif|comparateur|comparaison|meilleur prix|le moins cher|moins cher|versus|vs|difference de prix|prix le plus bas|prix de|prix du|prix des|quel est|quelle est|quels sont|quelles sont|quel|quelle|quels|quelles|c'est|cest|est|sont|les|des|du|de|un|une|le|la|pour|sur|dans)\b/gi, ' ')
    .replace(/[?!,:;]/g, ' ')
    .replace(/\.(?!\d)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Recherche les offres correspondantes dans les boutiques actives et la marketplace
 */
async function comparerPrixProduits(sujet) {
  if (!sujet || sujet.length < 2) {
    return { offres: [], sujet: '', minPrix: 0, maxPrix: 0, economieMax: 0 };
  }

  // 1. Offres Boutiques Partenaires
  const rBoutiques = await pool.query(
    `SELECT bp.id, bp.nom, bp.prix, bp.stock_quantite, bp.photos,
            b.nom as boutique_nom, b.slug as boutique_slug, bp.boutique_id,
            'boutique' as source
     FROM boutique_produits bp
     JOIN boutiques b ON b.id = bp.boutique_id
     WHERE b.actif = true AND bp.statut = 'actif'
       AND (bp.stock_quantite IS NULL OR bp.stock_quantite > 0)
       AND (bp.nom ILIKE '%' || $1 || '%' OR bp.description ILIKE '%' || $1 || '%')
     ORDER BY bp.prix ASC
     LIMIT 5`,
    [sujet]
  );

  // 2. Offres Marketplace Générale
  const rMarket = await pool.query(
    `SELECT p.id, p.titre as nom, p.prix, NULL as stock_quantite, p.images as photos,
            'Marketplace Nopalou' as boutique_nom, NULL as boutique_slug, NULL as boutique_id,
            'marketplace' as source
     FROM produits p
     WHERE p.actif = true AND (p.titre ILIKE '%' || $1 || '%' OR p.description ILIKE '%' || $1 || '%')
     ORDER BY p.prix ASC
     LIMIT 5`,
    [sujet]
  );

  const toutesOffres = [...rBoutiques.rows, ...rMarket.rows]
    .filter(o => o.prix && Number(o.prix) > 0)
    .sort((a, b) => Number(a.prix) - Number(b.prix))
    .slice(0, 5);

  const minPrix = toutesOffres.length > 0 ? Number(toutesOffres[0].prix) : 0;
  const maxPrix = toutesOffres.length > 0 ? Number(toutesOffres[toutesOffres.length - 1].prix) : 0;
  const economieMax = Math.max(0, maxPrix - minPrix);

  return {
    sujet,
    offres: toutesOffres,
    minPrix,
    maxPrix,
    economieMax,
  };
}

/**
 * Formate le comparatif pour un envoi WhatsApp avec boutons d'action
 */
function formaterComparatifWhatsApp(resultat, SITE = 'https://nopalou.com') {
  const { sujet, offres, economieMax } = resultat;
  if (!offres || offres.length === 0) {
    return {
      texte: `⚖️ *Comparateur Nopalou : "${sujet}"*\n\nAucune offre active trouvée pour ce terme. Essayez avec un mot plus général ou visitez notre comparateur complet : ${SITE}`,
      boutons: [],
      bestBoutique: null,
    };
  }

  let texte = `⚖️ *Comparatif Prix Nopalou : "${sujet}"*\n\n`;
  texte += `Voici les meilleures offres relevées chez nos marchands partenaires, classées par prix croissant :\n\n`;

  offres.forEach((o, i) => {
    const badge = i === 0 ? '🟢 *[Meilleure offre]*' : `${i + 1}️⃣`;
    const stockTxt = o.stock_quantite ? ` (Stock : ${o.stock_quantite})` : '';
    texte += `${badge} *${o.nom}*\n`;
    texte += `💰 *${Number(o.prix).toLocaleString('fr-FR')} FCFA* — chez _${o.boutique_nom}_${stockTxt}\n\n`;
  });

  if (economieMax > 0) {
    texte += `💡 *Économie constatée : jusqu'à ${economieMax.toLocaleString('fr-FR')} FCFA* d'écart entre marchands !\n\n`;
  }

  const bestBoutique = offres.find(o => o.source === 'boutique');
  let boutons = [];
  if (bestBoutique) {
    texte += `👉 Commandez directement l'offre la moins chère ci-dessous :`;
    boutons = [
      { id: `cmd_produit_${bestBoutique.id}`, title: `🛒 Commander (${Number(bestBoutique.prix).toLocaleString('fr-FR')} F)` },
      { id: `prod_${bestBoutique.id}`, title: '🔍 Voir détails' },
      { id: 'menu', title: '🌐 Menu' },
    ];
  }

  return { texte, boutons, bestBoutique };
}

module.exports = {
  detecterIntentionComparateur,
  extraireSujetComparaison,
  comparerPrixProduits,
  formaterComparatifWhatsApp,
  MOTS_COMPARAISON,
};
