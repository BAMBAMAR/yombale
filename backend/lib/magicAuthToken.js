// backend/lib/magicAuthToken.js
// Génération et validation de jetons d'accès transparents (Magic Links)
// Permet aux commerçants relancés sur WhatsApp d'accéder directement à leur espace
// sans se heurter au mur d'authentification dans la WebView mobile.

const crypto = require('crypto');

// AUD-171 : aucun secret par défaut. Sans JWT_SECRET ni SESSION_SECRET, aucun jeton n'est signé ni accepté.
function getSecret() {
  const s = process.env.JWT_SECRET || process.env.SESSION_SECRET;
  if (!s) throw new Error('JWT_SECRET ou SESSION_SECRET requis (aucun secret par défaut)');
  return s;
}

/**
 * Génère un jeton Magic Link signé HMAC
 * @param {Object} options
 * @param {string} options.userId - ID de l'utilisateur commerçant
 * @param {string} [options.boutiqueId] - ID de la boutique
 * @param {string} [options.telephone] - Numéro de téléphone normalisé
 * @param {number} [options.expiresInHours=72] - Durée de validité en heures (défaut 72h)
 * @returns {string} Token base64url sécurisé
 */
function genererMagicToken({ userId, boutiqueId = '', telephone = '', expiresInHours = 72 }) {
  if (!userId) {
    throw new Error('userId requis pour générer un magic token');
  }
  const exp = Date.now() + expiresInHours * 3600 * 1000;
  const data = `${userId}:${boutiqueId || ''}:${telephone || ''}:${exp}`;
  const sig = crypto.createHmac('sha256', getSecret()).update(data).digest('hex');

  const payload = {
    u: userId,
    b: boutiqueId || '',
    t: telephone || '',
    exp,
    s: sig,
  };

  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

/**
 * Valide un jeton Magic Link
 * @param {string} token
 * @returns {{ valide: boolean, userId?: string, boutiqueId?: string, telephone?: string, erreur?: string }}
 */
function validerMagicToken(token) {
  let secret;
  try { secret = getSecret(); } catch (e) { return { valide: false, erreur: 'secret_absent' }; }
  try {
    if (!token || typeof token !== 'string') {
      return { valide: false, erreur: 'token_manquant' };
    }

    const jsonStr = Buffer.from(token, 'base64url').toString('utf8');
    const { u: userId, b: boutiqueId, t: telephone, exp, s: sig } = JSON.parse(jsonStr);

    if (!userId || !exp || !sig) {
      return { valide: false, erreur: 'payload_incomplet' };
    }

    if (Date.now() > Number(exp)) {
      return { valide: false, erreur: 'token_expire' };
    }

    const data = `${userId}:${boutiqueId || ''}:${telephone || ''}:${exp}`;
    const attendu = crypto.createHmac('sha256', secret).update(data).digest('hex');

    const bufSig = Buffer.from(sig);
    const bufAttendu = Buffer.from(attendu);

    if (bufSig.length !== bufAttendu.length || !crypto.timingSafeEqual(bufSig, bufAttendu)) {
      return { valide: false, erreur: 'signature_invalide' };
    }

    return {
      valide: true,
      userId,
      boutiqueId: boutiqueId || null,
      telephone: telephone || null,
    };
  } catch (err) {
    return { valide: false, erreur: 'format_invalide' };
  }
}

module.exports = {
  genererMagicToken,
  validerMagicToken,
};
