// backend/middlewares/rateLimiter.js
// Limiteur de débit distribué (Redis + In-Memory Fallback)
// Protège les routes publiques sensibles (Agent IA, Recherche, etc.) contre les abus et scrapers

const { cacheGet, cacheSet } = require('../services/redis-cache');

/**
 * Crée un middleware de limitation de débit
 * @param {object} options
 * @param {number} [options.windowMs=60000] - Fenêtre en millisecondes (défaut 1 minute)
 * @param {number} [options.max=30] - Nombre maximum de requêtes par fenêtre
 * @param {string} [options.prefix='general'] - Préfixe de la clé de cache
 * @param {string} [options.message] - Message d'erreur
 */
function createRateLimiter(options = {}) {
  const windowMs = options.windowMs || 60000;
  const max = options.max || 30;
  const prefix = options.prefix || 'rl';
  const message = options.message || 'Trop de requêtes, veuillez réessayer dans un instant.';
  const windowSeconds = Math.ceil(windowMs / 1000);

  return async function rateLimiterMiddleware(req, res, next) {
    try {
      const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || '127.0.0.1';
      const key = `ratelimit:${prefix}:${clientIp}`;

      const record = await cacheGet(key);
      const now = Date.now();

      if (!record) {
        // Première requête dans la fenêtre
        await cacheSet(key, { count: 1, resetAt: now + windowMs }, windowSeconds);
        res.setHeader('X-RateLimit-Limit', max);
        res.setHeader('X-RateLimit-Remaining', max - 1);
        res.setHeader('X-RateLimit-Reset', Math.ceil((now + windowMs) / 1000));
        return next();
      }

      if (record.count >= max) {
        const retryAfterSec = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
        res.setHeader('Retry-After', retryAfterSec);
        res.setHeader('X-RateLimit-Limit', max);
        res.setHeader('X-RateLimit-Remaining', 0);
        res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetAt / 1000));
        return res.status(429).json({
          success: false,
          error: message,
          retryAfter: retryAfterSec
        });
      }

      // Incrémentation
      const newCount = record.count + 1;
      const ttlRemaining = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
      await cacheSet(key, { count: newCount, resetAt: record.resetAt }, ttlRemaining);

      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, max - newCount));
      res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetAt / 1000));
      return next();
    } catch (err) {
      console.warn('[RATE LIMITER WARN]: Erreur traitement rate limit, fallback autorisé:', err.message);
      return next();
    }
  };
}

module.exports = {
  createRateLimiter
};
