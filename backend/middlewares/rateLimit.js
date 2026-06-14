const rateLimit = require('express-rate-limit');

const limiterGeneral = rateLimit({
  windowMs: 15 * 60 * 1000, max: 100,
  message: { error: 'Trop de requêtes — réessayez dans 15 min' },
  standardHeaders: true
});

const limiterAuth = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,
  message: { error: 'Trop de tentatives de connexion' }
});

const limiterRecherche = rateLimit({
  windowMs: 60 * 1000, max: 60,
  message: { error: 'Trop de recherches — attendez 1 minute' }
});

const limiterPublication = rateLimit({
  windowMs: 60 * 60 * 1000, max: 5,
  message: { error: 'Trop d\'annonces publiées — réessayez dans 1 heure' }
});

module.exports = { limiterGeneral, limiterAuth, limiterRecherche, limiterPublication };