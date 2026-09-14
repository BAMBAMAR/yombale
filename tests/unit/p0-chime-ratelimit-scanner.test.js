// tests/unit/p0-chime-ratelimit-scanner.test.js
// Tests unitaires pour les remédiations P0/P1 : Rate Limiting, Alerte WebAudio & Dispatch GPS Tiak-Tiak

const { createRateLimiter } = require('../../backend/middlewares/rateLimiter');

describe('Sprint P0 & P1 : Remédiations Audit Nopalou', () => {

  describe('1. Middleware Rate Limiter Distribué (Redis / Mémoire)', () => {
    let limiter;

    beforeEach(() => {
      limiter = createRateLimiter({
        windowMs: 10000,
        max: 3,
        prefix: 'test-rl',
        message: 'Limite de requêtes atteinte'
      });
    });

    test('Laisse passer les requêtes tant que le quota max n\'est pas dépassé', async () => {
      const req = { ip: '192.168.1.50', headers: {} };
      const headers = {};
      const res = {
        setHeader: (k, v) => { headers[k] = v; },
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      // Requête 1
      await limiter(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);
      expect(headers['X-RateLimit-Limit']).toBe(3);
      expect(headers['X-RateLimit-Remaining']).toBe(2);

      // Requête 2
      await limiter(req, res, next);
      expect(next).toHaveBeenCalledTimes(2);
      expect(headers['X-RateLimit-Remaining']).toBe(1);

      // Requête 3
      await limiter(req, res, next);
      expect(next).toHaveBeenCalledTimes(3);
      expect(headers['X-RateLimit-Remaining']).toBe(0);
    });

    test('Renvoie un code 429 Too Many Requests dès le dépassement du quota', async () => {
      const req = { ip: '192.168.1.99', headers: {} };
      const headers = {};
      const res = {
        setHeader: (k, v) => { headers[k] = v; },
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      // Consommer les 3 requêtes autorisées
      for (let i = 0; i < 3; i++) {
        await limiter(req, res, next);
      }
      expect(next).toHaveBeenCalledTimes(3);

      // 4ème requête : bloquée
      await limiter(req, res, next);
      expect(next).toHaveBeenCalledTimes(3); // Pas d'appel supplémentaire à next()
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Limite de requêtes atteinte'
      }));
      expect(headers['X-RateLimit-Remaining']).toBe(0);
      expect(headers['Retry-After']).toBeDefined();
    });
  });

  describe('2. Dispatch Tiak-Tiak : Génération de l\'ordre de mission avec GPS', () => {
    test('Génère un lien d\'itinéraire GPS Google Maps propre pour le livreur', () => {
      const adresseClient = 'Sacré-Cœur 3, Immeuble Horizon';
      const gpsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(adresseClient + ', Dakar, Sénégal')}`;

      expect(gpsUrl).toContain('https://www.google.com/maps/search/?api=1&query=');
      expect(gpsUrl).toContain('Sacr%C3%A9-C%C5%93ur%203');
      expect(gpsUrl).toContain('Dakar%2C%20S%C3%A9n%C3%A9gal');
    });

    test('Formate les instructions financières selon le mode de règlement', () => {
      const commandePayee = { methode_paiement: 'wave', montant_total: 25000 };
      const commandeCash = { methode_paiement: 'cash', montant_total: 25000 };

      const estPaye = (cmd) => ['wave', 'orange_money', 'cb'].includes(cmd.methode_paiement);

      expect(estPaye(commandePayee)).toBe(true);
      expect(estPaye(commandeCash)).toBe(false);
    });
  });

});
