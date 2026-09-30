// tests/helpers/mock-auth.js
// Remplace verifierToken pour les tests unitaires de ROUTES dont la base est entièrement simulée (pool.query mocké).
// Le vrai verifierToken exécute une requête supplémentaire (version de session / suspension, AN-002) qui décale
// les réponses simulées dans l'ordre (AUD-020). Ici on garde la vérification de signature du jeton, sans requête.
// La logique réelle de révocation de session est couverte par les tests d'intégration et d'authentification.
//
// Usage dans une suite :
//   jest.mock('../../backend/middlewares/auth', () => require('../helpers/mock-auth'));
const jwt = require('jsonwebtoken');
const actual = jest.requireActual('../../backend/middlewares/auth');

function extraireJeton(req) {
  const h = req.headers && req.headers.authorization;
  return h && h.split(' ')[1];
}

function verifierToken(req, res, next) {
  const token = extraireJeton(req);
  if (!token) return res.status(401).json({ error: 'Token manquant' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (err) {
    return res.status(401).json({ error: err.name === 'TokenExpiredError' ? 'Session expirée' : 'Token invalide' });
  }
}

module.exports = { ...actual, verifierToken };
