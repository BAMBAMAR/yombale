// AUD-132 : lien signé et expirant pour télécharger le PDF d'un bail depuis un message WhatsApp.
// Remplace l'ancien lien `?tel=<numéro>` : un numéro de téléphone n'est pas un secret.
// Le lien ne donne accès qu'à la lecture du PDF du bail désigné, pendant la durée choisie (7 jours par défaut).
const crypto = require('crypto');

function getSecret() {
  const secret = process.env.LOCATAIRE_TOKEN_SECRET || process.env.JWT_SECRET;
  if (!secret) throw new Error('LOCATAIRE_TOKEN_SECRET ou JWT_SECRET requis pour signer un lien de bail');
  return secret;
}

function signer(payload) {
  // Séparation de domaine : un lien de bail ne peut pas être rejoué comme autre type de jeton HMAC du projet
  return crypto.createHmac('sha256', getSecret()).update(`bail-pdf:${payload}`).digest('hex');
}

/** @returns {string} jeton opaque (base64url) à placer dans `?lien=` */
function genererLienBail(bailId, dureeJours = 7) {
  if (!bailId) throw new Error('bailId requis');
  const exp = Math.floor(Date.now() / 1000) + dureeJours * 86400;
  const payload = `${bailId}:${exp}`;
  return Buffer.from(`${payload}:${signer(payload)}`).toString('base64url');
}

/** @returns {{ valide: boolean, error?: string }} */
function validerLienBail(token, bailId) {
  if (!token || typeof token !== 'string' || !bailId) return { valide: false, error: 'Lien manquant' };
  try {
    const parts = Buffer.from(token, 'base64url').toString('utf-8').split(':');
    if (parts.length !== 3) return { valide: false, error: 'Lien invalide' };
    const [id, expStr, sig] = parts;
    const exp = parseInt(expStr, 10);
    if (id !== bailId) return { valide: false, error: 'Lien invalide' };
    if (!Number.isFinite(exp) || Math.floor(Date.now() / 1000) > exp) return { valide: false, error: 'Lien expiré' };
    const expected = Buffer.from(signer(`${id}:${expStr}`), 'hex');
    const actual = Buffer.from(sig, 'hex');
    if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
      return { valide: false, error: 'Lien invalide' };
    }
    return { valide: true };
  } catch {
    return { valide: false, error: 'Lien invalide' };
  }
}

module.exports = { genererLienBail, validerLienBail };
