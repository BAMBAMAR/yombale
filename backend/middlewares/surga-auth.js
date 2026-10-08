// backend/middlewares/surga-auth.js
// Authentification des routes Surga.
// SRG-A1-005 : le middleware partagé tokenOptional accepte un jeton sans contrôler la révocation de session
// (jwt_version), la suspension ni la suppression du compte. Les routes Surga qui lisent ou écrivent des données
// personnelles s'appuient sur lui : un jeton révoqué y restait utilisable. Cette variante applique les mêmes
// contrôles que verifierToken ; un jeton présenté mais invalide vaut « invité », jamais « utilisateur ».
const jwt = require('jsonwebtoken');
const { pool } = require('../models/db');
const { verifierToken } = require('./auth');

const TYPES_JETON_NON_SESSION = new Set(['verify', 'reset', '2fa_pending', 'magic']);

function lireJeton(req) {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];
  if (!token && req.headers.cookie) {
    const cookies = Object.fromEntries(
      req.headers.cookie.split(';').map((c) => {
        const parts = c.trim().split('=');
        return [parts[0], parts.slice(1).join('=')];
      })
    );
    token = cookies['nopalou_session'] || cookies['token'] || cookies['session'];
  }
  if (!token && req.query?.token) token = req.query.token;
  return token || null;
}

async function tokenOptional(req, res, next) {
  const token = lireJeton(req);
  if (!token) return next();

  // Un jeton a été présenté et refusé. Le client est prévenu par un en-tête, pour proposer la reconnexion.
  // - Lecture : la requête continue en invité (les contenus publics restent servis).
  // - Écriture : 401. Répondre « succès, mode invité » à quelqu'un qui se croit connecté faisait marquer sa saisie
  //   comme envoyée alors que rien n'était écrit.
  const refuser = () => {
    res.setHeader('X-Surga-Session', 'invalide');
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
      return res.status(401).json({ success: false, requireAuth: true, code: 'SESSION_INVALIDE', error: 'Session expirée ou révoquée, veuillez vous reconnecter.' });
    }
    return next();
  };

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return refuser();
  }
  if (!decoded || TYPES_JETON_NON_SESSION.has(decoded.type) || !decoded.userId) return refuser();

  try {
    const { rows } = await pool.query(
      'SELECT jwt_version, suspendu, anonymise_le FROM utilisateurs WHERE id = $1',
      [decoded.userId]
    );
    const u = rows[0];
    if (!u || u.suspendu || u.anonymise_le) return refuser();
    // Un jeton d'une autre version que celle du compte est une session révoquée.
    // Limite connue : le cookie de session signé par le frontend (frontend-next/src/lib/session.ts) ne porte pas de
    // version ; il est accepté ici comme par verifierToken, et n'est donc pas révocable avant son expiration.
    if (decoded.jwtVersion !== undefined && u.jwt_version && decoded.jwtVersion !== u.jwt_version) return refuser();
  } catch (err) {
    // Base injoignable : la session ne peut être ni confirmée ni refusée. Répondre en invité ferait croire à un compte
    // connecté que ses données sont vides ; la requête échoue donc franchement.
    console.error('[SURGA AUTH DB ERROR]', err.message);
    return res.status(503).json({ success: false, code: 'SERVICE_INDISPONIBLE', error: 'Service momentanément indisponible, veuillez réessayer.' });
  }

  req.user = decoded;
  return next();
}

module.exports = { tokenOptional, verifierToken };
