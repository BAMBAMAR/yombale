// backend/services/surga/share-formatter.js
// Générateur de messages de partage pour Surga (vers WhatsApp et réseaux)
// Zéro émoji Unicode, formatage sobre en Markdown, vouvoiement strict

const BASE_URL = 'https://nopalou.com/surga';

/**
 * Génère le message WhatsApp pour une brève d'actualité
 */
function formaterPartageBreve({ titre, source, resume, urlSource }) {
  let msg = `*Surga — Actualité*\n`;
  msg += `*${titre}*\n\n`;
  if (resume) {
    msg += `${resume}\n\n`;
  }
  msg += `• Source : ${source || 'Presse sénégalaise'}\n`;
  if (urlSource) {
    msg += `• Article : ${urlSource}\n`;
  }
  msg += `\nRetrouvez votre briefing quotidien sur Surga :\n${BASE_URL}?utm_source=whatsapp_share`;
  return msg;
}

/**
 * Génère le message WhatsApp pour un événement sportif
 */
function formaterPartageSport({ competition, equipeDomicile, equipeExterieur, score, heure, statut }) {
  let msg = `*Surga — Sport & Résultats*\n`;
  msg += `*${competition || 'Compétition'}*\n\n`;
  msg += `• Affiche : ${equipeDomicile} vs ${equipeExterieur}\n`;
  if (score) {
    msg += `• Score : ${score}\n`;
  } else if (heure) {
    msg += `• Horaire : ${heure}\n`;
  }
  if (statut) {
    const statutLisible = statut === 'TERMINE' ? 'Terminé' : statut === 'EN_COURS' ? 'En direct' : 'À venir';
    msg += `• Statut : ${statutLisible}\n`;
  }
  msg += `\nSuivez le sport sénégalais et international sur Surga :\n${BASE_URL}?utm_source=whatsapp_share`;
  return msg;
}

/**
 * Génère le message WhatsApp pour une synthèse de calcul ou de dépense
 */
function formaterPartageCalcul({ expression, resultatFormate }) {
  let msg = `*Surga — Calculatrice*\n\n`;
  msg += `• Calcul : ${expression}\n`;
  msg += `• Résultat exact : ${resultatFormate}\n\n`;
  msg += `Calculé avec le moteur déterministe Surga :\n${BASE_URL}?utm_source=whatsapp_share`;
  return msg;
}

/**
 * Construit l'URL de partage direct vers WhatsApp
 */
function genererLienWhatsApp(texte) {
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(texte)}`;
}

module.exports = {
  BASE_URL,
  formaterPartageBreve,
  formaterPartageSport,
  formaterPartageCalcul,
  genererLienWhatsApp,
};
