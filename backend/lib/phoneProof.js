// backend/lib/phoneProof.js
// AUD-108 : preuve de possession d'un numéro, délivrée après un OTP WhatsApp valide et exigée par
// POST /api/boutiques/taf-taf. Le jeton est signé avec une clé dérivée de JWT_SECRET : il ne peut
// jamais être accepté comme jeton de session (verifierToken utilise JWT_SECRET brut).
const jwt = require('jsonwebtoken');

const OBJET = 'boutique_creation';
const DUREE = '30m';

function cle() {
  const base = process.env.JWT_SECRET;
  if (!base) throw new Error('JWT_SECRET manquant');
  return `${base}:phone-proof`;
}

function neuf(tel) {
  const d = String(tel || '').replace(/\D/g, '');
  return d.length >= 9 ? d.slice(-9) : d;
}

function creerPreuveTelephone(telephone) {
  return jwt.sign({ tel9: neuf(telephone), objet: OBJET }, cle(), { expiresIn: DUREE });
}

/** @returns {boolean} true si la preuve est valide, non expirée et émise pour ce numéro */
function verifierPreuveTelephone(preuve, telephone) {
  if (!preuve || typeof preuve !== 'string') return false;
  try {
    const p = jwt.verify(preuve, cle());
    return p.objet === OBJET && !!p.tel9 && p.tel9 === neuf(telephone);
  } catch {
    return false;
  }
}

module.exports = { creerPreuveTelephone, verifierPreuveTelephone };
