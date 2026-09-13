// tests/unit/security-and-auth.test.js
// Tests unitaires pour la sécurité et l'authentification renforcée (Phase 7 — P1)

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { validerForceMotDePasse } = require('../../backend/lib/passwordValidator');

describe('Sécurité & Authentification Renforcée (Phase 7 — P1)', () => {
  describe('Robustesse des Mots de Passe', () => {
    test('rejette les mots de passe de moins de 8 caractères', () => {
      const res = validerForceMotDePasse('Pass1!');
      expect(res.valide).toBe(false);
      expect(res.message).toMatch(/au moins 8 caractères/);
    });

    test('rejette les mots de passe sans aucun chiffre', () => {
      const res = validerForceMotDePasse('MotDePasseFort!');
      expect(res.valide).toBe(false);
      expect(res.message).toMatch(/au moins un chiffre/);
    });

    test('rejette les mots de passe sans majuscule ni caractère spécial', () => {
      const res = validerForceMotDePasse('motdepasse1234');
      expect(res.valide).toBe(false);
      expect(res.message).toMatch(/majuscule ou un caractère spécial/);
    });

    test('valide les mots de passe robustes avec majuscule et chiffre', () => {
      const res1 = validerForceMotDePasse('Nopalou2026');
      expect(res1.valide).toBe(true);

      const res2 = validerForceMotDePasse('SuperBoutique2026!');
      expect(res2.valide).toBe(true);

      const res3 = validerForceMotDePasse('passw0rd_pro_sn');
      expect(res3.valide).toBe(true);
    });

    test('rejette les entrées vides ou nulles', () => {
      expect(validerForceMotDePasse('').valide).toBe(false);
      expect(validerForceMotDePasse(null).valide).toBe(false);
      expect(validerForceMotDePasse(undefined).valide).toBe(false);
    });
  });

  describe('Mécanisme 2FA WhatsApp & Tokens', () => {
    const SECRET = 'test_jwt_secret_nopalou_2026';
    const userId = 'usr_uuid_123456';

    test('génère un jeton temporaire 2FA signé avec type 2fa_pending', () => {
      const tempToken = jwt.sign({ userId, type: '2fa_pending' }, SECRET, { expiresIn: '10m' });
      const decoded = jwt.verify(tempToken, SECRET);

      expect(decoded.userId).toBe(userId);
      expect(decoded.type).toBe('2fa_pending');
    });

    test('génère un code OTP à 6 chiffres CSPRNG', () => {
      const code = crypto.randomInt(100000, 1000000).toString();
      expect(code).toHaveLength(6);
      expect(/^\d{6}$/.test(code)).toBe(true);
    });

    test('vérifie la comparaison timing-safe du code OTP', () => {
      const codeAttendu = '482910';
      const codeSaisiExact = '482910';
      const codeSaisiFaux = '482911';

      const bufAttendu = Buffer.from(codeAttendu);
      const bufExact = Buffer.from(codeSaisiExact);
      const bufFaux = Buffer.from(codeSaisiFaux);

      expect(crypto.timingSafeEqual(bufAttendu, bufExact)).toBe(true);
      expect(crypto.timingSafeEqual(bufAttendu, bufFaux)).toBe(false);
    });

    test('rejette les tokens avec un mauvais type', () => {
      const invalidTypeToken = jwt.sign({ userId, type: 'reset' }, SECRET, { expiresIn: '10m' });
      const decoded = jwt.verify(invalidTypeToken, SECRET);
      expect(decoded.type).not.toBe('2fa_pending');
    });
  });
});
