// backend/lib/phoneNormalizer.js
// Module unifié de normalisation, validation et détection d'opérateur pour les numéros de téléphone (Sénégal & International)

'use strict';

/**
 * Nettoie une chaîne brute de téléphone de tout caractère Unicode invisible, espace insécable ou parasite.
 * @param {string} raw
 * @returns {string}
 */
function nettoyerCaracteresInvisibles(raw) {
  if (!raw) return '';
  return String(raw)
    .replace(/[\u200B-\u200D\uFEFF\u00A0\u202F\u200E\s\-\.\(\)]/g, '')
    .trim();
}

/**
 * Normalise un numéro de téléphone pour l'API WhatsApp et la base de données.
 * Standardisé au format international sans signe '+' (ex: '221771234567').
 * @param {string|number} phone - Numéro brut
 * @returns {string} Numéro normalisé sans '+'
 */
function normalisePhone(phone) {
  if (!phone) return '';
  let clean = nettoyerCaracteresInvisibles(phone);
  let num = clean.replace(/[^\d]/g, '');

  if (num.startsWith('00221')) num = num.slice(2);
  else if (num.startsWith('00')) num = num.slice(2);

  // Si c'est un numéro local sénégalais à 9 chiffres, ajouter l'indicatif 221
  if (num.length === 9) {
    num = '221' + num;
  }

  return num;
}

/**
 * Alias de compatibilité pour normalisePhone
 */
function normaliserTelephone(phone) {
  const norm = normalisePhone(phone);
  return norm.length > 0 ? norm : null;
}

/**
 * Analyse détaillée et validation spécifique pour le Sénégal (+221).
 * Détecte l'opérateur (Orange, Free, Expresso, Promobile, Fixe).
 * @param {string|number} rawPhone
 * @returns {object} { valide: boolean, local: string, national: string, e164: string, formate: string, operateur: string, estMobileWhatsApp: boolean, brut: string, erreur?: string }
 */
function normaliserTelephoneSenegal(rawPhone) {
  if (!rawPhone) return { valide: false, erreur: 'Numéro vide' };

  const brut = String(rawPhone)
    .replace(/[\u200B-\u200D\uFEFF\u00A0\u202F\u200E]/g, '')
    .trim();

  let num = brut.replace(/[^\d+]/g, '');

  if (num.startsWith('+221')) num = num.slice(4);
  else if (num.startsWith('00221')) num = num.slice(5);
  else if (num.startsWith('221') && num.length >= 11) num = num.slice(3);

  num = num.replace(/[^\d]/g, '');

  // Au Sénégal, les numéros mobiles/fixes font 9 chiffres
  // Mobiles : 70 (Expresso), 75 (Promobile), 76 (Free/Yas), 77 & 78 (Orange), 72 (Mobile)
  // Fixes : 30, 33, 36 (Sonatel / Expresso Fixe)
  if (num.length !== 9) {
    return {
      valide: false,
      brut,
      erreur: `Longueur invalide (${num.length} chiffres au lieu de 9)`
    };
  }

  const prefix = num.slice(0, 2);
  let operateur = 'Autre';
  let estMobileWhatsApp = false;
  if (prefix === '77' || prefix === '78') {
    operateur = 'Orange';
    estMobileWhatsApp = true;
  } else if (prefix === '76') {
    operateur = 'Free (Yas)';
    estMobileWhatsApp = true;
  } else if (prefix === '70') {
    operateur = 'Expresso';
    estMobileWhatsApp = true;
  } else if (prefix === '75') {
    operateur = 'Promobile';
    estMobileWhatsApp = true;
  } else if (prefix === '72') {
    operateur = 'Mobile (72)';
    estMobileWhatsApp = true;
  } else if (prefix === '33' || prefix === '30' || prefix === '36') {
    operateur = 'Fixe';
    estMobileWhatsApp = false;
  }

  const national = '221' + num;
  const e164 = '+221' + num;
  const formate = `${num.slice(0, 2)} ${num.slice(2, 5)} ${num.slice(5, 7)} ${num.slice(7, 9)}`;

  return {
    valide: true,
    estMobileWhatsApp,
    local: num,
    national,
    e164,
    formate,
    operateur,
    brut,
  };
}

/**
 * Vérifie si un numéro est valide après normalisation (longueur internationale 10 à 15 chiffres).
 * @param {string|number} phone
 * @returns {boolean}
 */
function estNumeroValide(phone) {
  const norm = normalisePhone(phone);
  if (!norm) return false;
  return norm.length >= 10 && norm.length <= 15;
}

module.exports = {
  normalisePhone,
  normaliserTelephone,
  normaliserTelephoneSenegal,
  estNumeroValide,
  nettoyerCaracteresInvisibles,
};
