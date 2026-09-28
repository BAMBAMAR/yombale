const crypto = require('crypto');

function getSecret() {
  return process.env.JWT_SECRET || process.env.SESSION_SECRET || 'nopalou_credit_secret_key_2026';
}

/**
 * Génère un jeton sécurisé HMAC pour le règlement public d'une créance sans mot de passe
 * @param {string} clientId 
 * @param {string} boutiqueId 
 * @param {number} dureeJours 
 * @returns {string} token
 */
function genererCreditToken(clientId, boutiqueId, dureeJours = 30) {
  if (!clientId || !boutiqueId) {
    throw new Error('clientId et boutiqueId requis pour générer un creditToken');
  }

  const exp = Math.floor(Date.now() / 1000) + (dureeJours * 86400);
  const payload = `${clientId}:${boutiqueId}:${exp}`;
  const hmac = crypto.createHmac('sha256', getSecret()).update(payload).digest('hex');
  const tokenRaw = `${payload}:${hmac}`;
  return Buffer.from(tokenRaw).toString('base64url');
}

/**
 * Valide un jeton de règlement de créance
 * @param {string} token 
 * @returns {{ valide: boolean, clientId?: string, boutiqueId?: string, error?: string }}
 */
function validerCreditToken(token) {
  if (!token || typeof token !== 'string') {
    return { valide: false, error: 'Token manquant' };
  }

  try {
    const raw = Buffer.from(token, 'base64url').toString('utf-8');
    const parts = raw.split(':');
    if (parts.length !== 4) {
      return { valide: false, error: 'Format de token invalide' };
    }

    const [clientId, boutiqueId, expStr, signature] = parts;
    const exp = parseInt(expStr, 10);

    if (isNaN(exp) || Math.floor(Date.now() / 1000) > exp) {
      return { valide: false, error: 'Lien de paiement expiré' };
    }

    const expectedPayload = `${clientId}:${boutiqueId}:${expStr}`;
    const expectedSig = crypto.createHmac('sha256', getSecret()).update(expectedPayload).digest('hex');

    // Timing-safe compare
    const sigBuf = Buffer.from(signature, 'hex');
    const expBuf = Buffer.from(expectedSig, 'hex');
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return { valide: false, error: 'Signature du lien invalide' };
    }

    return {
      valide: true,
      clientId,
      boutiqueId
    };
  } catch (err) {
    return { valide: false, error: 'Token illisible ou corrompu' };
  }
}

module.exports = {
  genererCreditToken,
  validerCreditToken
};
