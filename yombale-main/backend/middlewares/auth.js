const jwt = require('jsonwebtoken');

function verifierToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token manquant' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError')
      return res.status(401).json({ error: 'Session expirée' });
    return res.status(401).json({ error: 'Token invalide' });
  }
}

function tokenOptional(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (token) {
    try { req.user = jwt.verify(token, process.env.JWT_SECRET); } catch {}
  }
  next();
}

module.exports = { verifierToken, tokenOptional };