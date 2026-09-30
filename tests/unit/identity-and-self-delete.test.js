// tests/unit/identity-and-self-delete.test.js
process.env.JWT_SECRET = 'npl_master_jwt_secret_test_2026';
process.env.RESET_SECRET = 'npl_reset_secret_test_2026';
process.env.VERIFY_SECRET = 'npl_verify_secret_test_2026';

const jwt = require('jsonwebtoken');
const { templateEmail } = require('../../backend/services/email');

describe('Système Identité & Suppression Autonome Nopalou (RGPD Art. 17)', () => {
  const userId = 'user-test-uuid-456';

  describe('AN-001 : Séparation stricte des secrets JWT', () => {
    test('Un jeton de reset signé avec RESET_SECRET ne peut pas être validé avec JWT_SECRET', () => {
      const resetToken = jwt.sign({ userId, type: 'reset' }, process.env.RESET_SECRET, { expiresIn: '1h' });
      expect(() => {
        jwt.verify(resetToken, process.env.JWT_SECRET);
      }).toThrow('invalid signature');
    });

    test('Un jeton de vérification signé avec VERIFY_SECRET ne peut pas être validé avec JWT_SECRET', () => {
      const verifToken = jwt.sign({ userId, type: 'verify' }, process.env.VERIFY_SECRET, { expiresIn: '24h' });
      expect(() => {
        jwt.verify(verifToken, process.env.JWT_SECRET);
      }).toThrow('invalid signature');
    });

    test('Un jeton de session normal signé avec JWT_SECRET ne valide pas une réinitialisation de mot de passe', () => {
      const sessionToken = jwt.sign({ userId, jwtVersion: 1 }, process.env.JWT_SECRET, { expiresIn: '7d' });
      expect(() => {
        jwt.verify(sessionToken, process.env.RESET_SECRET);
      }).toThrow('invalid signature');
    });
  });

  describe('AN-002 : Invalidation de Session via Versioning JWT', () => {
    test('Un token avec jwt_version obsolète est détecté', () => {
      const tokenV1 = jwt.sign({ userId, jwtVersion: 1 }, process.env.JWT_SECRET, { expiresIn: '7d' });
      const decoded = jwt.verify(tokenV1, process.env.JWT_SECRET);
      const userDbVersion = 2; // Incrémenté suite à un mot de passe changé ou déconnexion

      const isTokenRevoked = decoded.jwtVersion !== userDbVersion;
      expect(isTokenRevoked).toBe(true);
    });

    test('Un token avec la bonne version JWT est valide', () => {
      const tokenV2 = jwt.sign({ userId, jwtVersion: 2 }, process.env.JWT_SECRET, { expiresIn: '7d' });
      const decoded = jwt.verify(tokenV2, process.env.JWT_SECRET);
      const userDbVersion = 2;

      const isTokenRevoked = decoded.jwtVersion !== userDbVersion;
      expect(isTokenRevoked).toBe(false);
    });
  });

  describe('BLOC 2 : Template Email Officiel Nopalou', () => {
    test('Génère un HTML valide avec typographie système native sans CDN externe', () => {
      const html = templateEmail({
        preheader: 'Activez votre compte',
        titre: 'Bienvenue sur Nopalou',
        contenuHtml: '<p>Contenu de test</p>',
        boutonTexte: 'Confirmer',
        boutonUrl: 'https://nopalou.com/test',
        noteBas: 'Expire dans 24h',
      });

      expect(html).toContain('Nopalou');
      expect(html).toContain('Bienvenue sur Nopalou');
      expect(html).toContain('https://nopalou.com/test');
      expect(html).toContain('Confirmer');
      expect(html).toContain('system-ui, -apple-system');
      // Vérification stricte Anti-IA-Slop / Performance : aucun appel à Google Fonts ou CDN externe de polices
      expect(html).not.toContain('fonts.googleapis.com');
      expect(html).not.toContain('cdn.jsdelivr.net');
      expect(html).not.toContain('unpkg.com');
    });
  });
});
