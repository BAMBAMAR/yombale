// backend/services/prospection-vision.js
// Service OCR et extraction intelligente pour les captures d'écran de prospection
// Spécifiquement calibré pour les Lives TikTok, statuts WhatsApp et stories Instagram au Sénégal

'use strict';

let Tesseract;
try {
  Tesseract = require('tesseract.js');
} catch (e) {
  console.warn('[PROSPECTION_VISION] Tesseract non disponible:', e.message);
  Tesseract = null;
}

const { normaliserTelephoneSenegal } = require('../lib/phoneNormalizer');

/**
 * Nettoie une chaîne de caractères obfusquée typique des Lives TikTok
 * Ex: "77$175&59&35" -> "77 175 59 35"
 * Ex: "778303832##" -> "778303832"
 * Ex: "78-207-94-34" -> "78 207 94 34"
 */
function deobfusquerNumeroTikTok(str) {
  if (!str) return '';
  let s = String(str);
  // Correction de l'esperluette & mal lue en '8' entre deux blocs de 2 chiffres (ex: 59835 -> 59 35)
  s = s.replace(/(\d{2})8(\d{2})\b/g, '$1 $2');
  return s
    .replace(/[$&#*_/\s.-]+/g, ' ')
    .replace(/[#*]+$/, '')
    .trim();
}

/**
 * Extrait et normalise tous les numéros de téléphone sénégalais possibles depuis un texte brut ou OCR
 */
function extraireNumerosTikTok(texte) {
  if (!texte) return [];
  const resultats = [];
  const vus = new Set();

  const ajouterSiValide = (numStr, rawOrigine) => {
    if (!numStr) return;
    const norm = normaliserTelephoneSenegal(numStr);
    if (norm.valide && !vus.has(norm.national)) {
      vus.add(norm.national);
      resultats.push({
        national: norm.national,
        telephone_brut: rawOrigine || norm.formate,
        telephone_formate: norm.formate,
        operateur: norm.operateur,
      });
    }
  };

  // 1. Recherche par blocs de chiffres et symboles courants
  const regex = /(?:(?:\+?221|00221)[-.\s$&#*_]*)?(7[05678]|33)[$&#*_.\s-]*([0-9]{1,3})[$&#*_.\s-]*([0-9]{1,3})[$&#*_.\s-]*([0-9]{1,3})[$&#*_.\s-]*([0-9]{0,3})/g;
  let m;
  while ((m = regex.exec(texte)) !== null) {
    const rawMatch = m[0];
    const nettoie = deobfusquerNumeroTikTok(rawMatch);
    ajouterSiValide(nettoie, rawMatch.trim());
  }

  // 2. Recherche sur tous les tokens de chiffres isolés ou semi-obfusqués
  const tokens = texte.split(/[\s\r\n]+/);
  for (const tok of tokens) {
    // Si le token contient au moins 7 chiffres et commence par 7 ou 221
    if (!/(?:7[05678]|221)/.test(tok)) continue;

    let clean = tok.replace(/[$&#*_\s.-]/g, '');

    // S'il commence par 221 et fait 12 chiffres
    if (clean.startsWith('221') && clean.length === 12) {
      ajouterSiValide(clean.slice(3), tok);
      continue;
    }

    // Cas standard 9 chiffres
    if (/^7[05678]\d{7}$/.test(clean)) {
      ajouterSiValide(clean, tok);
      continue;
    }

    // Cas avec suffixe ## ou 44 (ex: 778303832## ou 77830383244)
    if (/^7[05678]\d{7}(?:44|##|\d{1,2})$/.test(clean)) {
      ajouterSiValide(clean.slice(0, 9), tok);
      continue;
    }

    // Cas d'esperluette & lue comme un 8 par l'OCR (10 chiffres, ex: 7717559835 -> 77 175 59 35)
    if (/^7[05678]\d{5}8\d{2}$/.test(clean)) {
      const sansHuitParasite = clean.slice(0, 7) + clean.slice(8);
      ajouterSiValide(sansHuitParasite, tok);
      continue;
    }

    // Cas avec 8 parasite au début et au milieu (11 ou 12 chiffres)
    if (/^7[05678]8\d{3}8\d{2}8\d{2}$/.test(clean)) {
      const sansHuit = clean.replace(/8/g, '');
      if (sansHuit.length === 8) {
        // Rétablir le 7 initial ou reconstituer
        const reconstruit = clean[0] + clean[1] + clean.slice(3, 6) + clean.slice(7, 9) + clean.slice(10);
        ajouterSiValide(reconstruit, tok);
      }
    }
  }

  return resultats;
}

/**
 * Extrait le pseudo du commerçant depuis le bandeau supérieur de l'interface TikTok Live
 */
function extrairePseudoTikTok(texte) {
  if (!texte) return null;

  const lignes = texte.split(/[\r\n]+/).map((l) => l.trim()).filter(Boolean);

  for (let i = 0; i < Math.min(lignes.length, 12); i++) {
    const l = lignes[i];

    // Ignorer les lignes système évidentes
    if (/^(?:classement|quotidien|saisis|live|suivre|\+|partager|cadeau|rose|coeur)/i.test(l)) continue;
    if (/^\d+[\s%kKmMBG]*$/.test(l)) continue; // Heure, batterie, pourcentages

    // Motif 1 : Pseudo suivi de "+ Suivre" ou "Suivre" (ex: "Abdou B... + Suivre", "KiaMass ... + Suivre")
    const matchSuivre = l.match(/(?:^|[^\w])([a-zA-Z0-9_\u00C0-\u017F.\s-]{2,25}?)(?:\s*\.{2,3})?\s*(?:\+\s*Suivre|Suivre)/i);
    if (matchSuivre && matchSuivre[1]) {
      const clean = matchSuivre[1].replace(/[^\w\s.-]/g, '').trim();
      if (clean.length >= 2 && !/^(?:suivre|live|classement)$/i.test(clean)) return clean;
    }

    // Motif 2 : Pseudo avec points de suspension (ex: "Abdou B...", "KiaMass ...")
    const matchPoints = l.match(/^([a-zA-Z0-9_\u00C0-\u017F\s-]{2,20})\s*\.{2,3}/i);
    if (matchPoints && matchPoints[1]) {
      const clean = matchPoints[1].trim();
      if (clean.length >= 2 && !/^(?:saisis|ton|messa)$/i.test(clean)) return clean;
    }
  }

  return null;
}

/**
 * Détecte la catégorie de produits selon le texte de l'écran ou les stickers
 */
function detecterCategorieCapture(texte) {
  if (!texte) return 'mode';
  const t = texte.toLowerCase();

  if (/coque|iphone|samsung|chargeur|ecouteur|airpod|magsafe|reconditionne|telephone|laptop|ordinateur/i.test(t)) {
    return 'tech';
  }
  if (/tapis|priere|rideau|drap|housse|couverture|coussin|salon|deco|maison/i.test(t)) {
    return 'maison';
  }
  if (/creme|savon|pommade|lait|parfum|bio|gommage|visage|peau|beaute|cosmetique/i.test(t)) {
    return 'cosmetique';
  }
  if (/gros|douzaine|carton|balle|fournisseur|import|chine|dubai|turquie/i.test(t)) {
    return 'grossiste';
  }
  if (/robe|salopette|jean|pantalon|t-shirt|taille|ensemble|bazin|wax|tissu|voile|veste/i.test(t)) {
    return 'mode';
  }

  return 'mode';
}

/**
 * Analyse une capture d'écran (Buffer ou data URL base64) via Tesseract OCR
 */
async function analyserCaptureProspection(imageInput, options = {}) {
  if (!imageInput) {
    throw new Error('Aucune image fournie pour l\'analyse OCR');
  }

  let buffer;
  if (Buffer.isBuffer(imageInput)) {
    buffer = imageInput;
  } else if (typeof imageInput === 'string') {
    // Si format Data URL: data:image/...;base64,...
    const base64Data = imageInput.replace(/^data:image\/\w+;base64,/, '');
    buffer = Buffer.from(base64Data, 'base64');
  } else {
    throw new Error('Format d\'image non supporté');
  }

  if (!Tesseract) {
    throw new Error('Le moteur OCR Tesseract n\'est pas disponible sur le serveur');
  }

  let textOcr = '';

  try {
    // Première passe avec PSM.SPARSE_TEXT (idéal pour les stickers et texte incrusté de TikTok)
    const worker = await Tesseract.createWorker('fra+eng');
    try {
      await worker.setParameters({
        tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT,
      });
      const res = await worker.recognize(buffer);
      textOcr = res.data?.text || '';
    } finally {
      await worker.terminate();
    }
  } catch (err) {
    console.warn('[PROSPECTION_VISION_SPARSE_ERR]', err.message);
  }

  // Si peu ou pas de texte, tentative avec OCR par défaut
  if (!textOcr || textOcr.length < 15) {
    try {
      const resFallback = await Tesseract.recognize(buffer, 'fra+eng');
      textOcr = `${textOcr}\n${resFallback.data?.text || ''}`;
    } catch (_) {}
  }

  // Extraction des composants
  const numeros = extraireNumerosTikTok(textOcr);
  const pseudo = extrairePseudoTikTok(textOcr);
  const categorieDetectee = detecterCategorieCapture(textOcr);
  const estTikTokLive = /classement quotidien|suivre|saisis ton messa/i.test(textOcr) || Boolean(pseudo);

  const leads = numeros.map((num) => {
    const nomBoutique = pseudo ? `@${pseudo}` : `Vendeur Live (${num.telephone_formate})`;
    return {
      nom_boutique: nomBoutique,
      contact_nom: pseudo || null,
      telephone: num.national,
      telephone_brut: num.telephone_brut,
      telephone_formate: num.telephone_formate,
      operateur: num.operateur,
      categorie: options.categorie || categorieDetectee,
      ville: options.ville || 'Dakar',
      quartier: options.quartier || 'Dakar',
      source: estTikTokLive ? 'tiktok_live' : 'capture_ecran',
      notes: `Extrait de capture ${estTikTokLive ? 'Live TikTok' : 'écran'} (Sticker: ${num.telephone_brut})`,
    };
  });

  return {
    success: true,
    estTikTokLive,
    pseudoDetecte: pseudo,
    categorieSuggeree: categorieDetectee,
    totalNumeros: numeros.length,
    leads,
    rawOcr: textOcr.slice(0, 500),
  };
}

module.exports = {
  deobfusquerNumeroTikTok,
  extraireNumerosTikTok,
  extrairePseudoTikTok,
  detecterCategorieCapture,
  analyserCaptureProspection,
};
