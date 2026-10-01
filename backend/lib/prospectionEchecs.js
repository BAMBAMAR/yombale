// backend/lib/prospectionEchecs.js
// AUD-113 : traitement des échecs d'envoi WhatsApp de la prospection. Sur la copie d'audit, 19 % des envois
// échouaient (126 plafond marketing Meta 131049, 27 numéros non WhatsApp 131026) et les mêmes leads étaient
// rejoués à chaque campagne parce qu'un échec ne changeait pas leur statut.

const CODES_NUMERO_INVALIDE = [131026, 131051];
const CODE_PLAFOND_MARKETING = 131049;
const SEUIL_PLAFOND_CONSECUTIF = 5;
const JOURS_PAUSE_PLAFOND = 7;

/** Extrait le code d'erreur Meta d'un code brut ou d'un message (« Rejet Meta 131049 : … », « (Code 131026) »). */
function extraireCodeMeta(texte, codeBrut) {
  const direct = Number(codeBrut);
  if (Number.isInteger(direct) && direct > 0) return direct;
  const m = String(texte || '').match(/\b(13\d{4})\b/);
  return m ? Number(m[1]) : null;
}

/**
 * @returns {'numero_invalide'|'plafond_marketing'|'autre'|null}
 */
function classerEchec(code) {
  if (CODES_NUMERO_INVALIDE.includes(code)) return 'numero_invalide';
  if (code === CODE_PLAFOND_MARKETING) return 'plafond_marketing';
  return code ? 'autre' : null;
}

module.exports = {
  extraireCodeMeta,
  classerEchec,
  CODES_NUMERO_INVALIDE,
  CODE_PLAFOND_MARKETING,
  SEUIL_PLAFOND_CONSECUTIF,
  JOURS_PAUSE_PLAFOND,
};
