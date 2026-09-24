// tests/unit/phone-normalizer.test.js
const {
  normalisePhone,
  normaliserTelephone,
  normaliserTelephoneSenegal,
  estNumeroValide,
  nettoyerCaracteresInvisibles,
} = require('../../backend/lib/phoneNormalizer');

describe('📞 Centralized Phone Normalizer Tests (Sénégal & International)', () => {
  describe('normalisePhone / normaliserTelephone', () => {
    test('normalise un numéro local sénégalais 9 chiffres vers 221...', () => {
      expect(normalisePhone('771234567')).toBe('221771234567');
      expect(normalisePhone('78 123 45 67')).toBe('221781234567');
      expect(normalisePhone('76-123-45-67')).toBe('221761234567');
    });

    test('gère les préfixes +221 et 00221', () => {
      expect(normalisePhone('+221 77 123 45 67')).toBe('221771234567');
      expect(normalisePhone('00221 70 999 88 77')).toBe('221709998877');
      expect(normalisePhone('221771234567')).toBe('221771234567');
    });

    test('nettoie les caractères invisibles Unicode', () => {
      const dirty = '\u200B+221\u00A077 123 45 67\u200E';
      expect(normalisePhone(dirty)).toBe('221771234567');
    });

    test('retourne chaîne vide pour entrées falsy', () => {
      expect(normalisePhone('')).toBe('');
      expect(normalisePhone(null)).toBe('');
      expect(normalisePhone(undefined)).toBe('');
    });
  });

  describe('normaliserTelephoneSenegal', () => {
    test('identifie correctement Orange', () => {
      const res = normaliserTelephoneSenegal('77 123 45 67');
      expect(res.valide).toBe(true);
      expect(res.operateur).toBe('Orange');
      expect(res.estMobileWhatsApp).toBe(true);
      expect(res.local).toBe('771234567');
      expect(res.national).toBe('221771234567');
      expect(res.e164).toBe('+221771234567');
      expect(res.formate).toBe('77 123 45 67');
    });

    test('identifie Free et Expresso', () => {
      expect(normaliserTelephoneSenegal('76 000 00 00').operateur).toBe('Free (Yas)');
      expect(normaliserTelephoneSenegal('70 000 00 00').operateur).toBe('Expresso');
      expect(normaliserTelephoneSenegal('75 000 00 00').operateur).toBe('Promobile');
    });

    test('identifie les lignes fixes comme non-mobiles WhatsApp', () => {
      const res = normaliserTelephoneSenegal('33 800 00 00');
      expect(res.valide).toBe(true);
      expect(res.operateur).toBe('Fixe');
      expect(res.estMobileWhatsApp).toBe(false);
    });

    test('invalide les longueurs incorrectes', () => {
      const res = normaliserTelephoneSenegal('77 123 45');
      expect(res.valide).toBe(false);
      expect(res.erreur).toContain('Longueur invalide');
    });
  });

  describe('estNumeroValide', () => {
    test('valide numéros internationaux entre 10 et 15 chiffres', () => {
      expect(estNumeroValide('771234567')).toBe(true); // Devient 221771234567 (12 chiffres)
      expect(estNumeroValide('+33612345678')).toBe(true); // 33612345678 (11 chiffres)
      expect(estNumeroValide('123')).toBe(false);
      expect(estNumeroValide('')).toBe(false);
    });
  });
});
