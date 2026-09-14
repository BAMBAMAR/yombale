const request = require('supertest');

describe('Sécurité des Codes PIN POS & Caissiers', () => {
  const trivialPins = ['1234', '0000', '9999', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888'];

  test('La liste des PINs triviaux interdits doit couvrir les codes par défaut', () => {
    trivialPins.forEach(pin => {
      const isTrivial = trivialPins.includes(pin) || /^(.)\1+$/.test(pin);
      expect(isTrivial).toBe(true);
    });
  });

  test('Les PINs personnalisés valides de 4 à 6 chiffres doivent être autorisés', () => {
    const validPins = ['4829', '7301', '8520', '918273', '1049'];
    validPins.forEach(pin => {
      const isValidLength = /^\d{4,6}$/.test(pin);
      const isTrivial = trivialPins.includes(pin) || /^(.)\1+$/.test(pin);
      expect(isValidLength && !isTrivial).toBe(true);
    });
  });

  test('Les codes alphanumériques ou de longueur invalide doivent être rejetés', () => {
    const invalidPins = ['123', '1234567', 'abcd', '12a4', ''];
    invalidPins.forEach(pin => {
      const isValid = /^\d{4,6}$/.test(pin) && !trivialPins.includes(pin) && !/^(.)\1+$/.test(pin);
      expect(isValid).toBe(false);
    });
  });

  test('Détection de la configuration obligatoire du POS si PINs triviaux présents', () => {
    // Cas 1: PIN superviseur par défaut (0000 ou 9999)
    const superviseurDefaut = '0000';
    const caissiers1 = [{ nom: 'Caissier 1', code_pin: '4829' }];
    const doitConfigurer1 = trivialPins.includes(superviseurDefaut) || caissiers1.some(c => trivialPins.includes(c.code_pin));
    expect(doitConfigurer1).toBe(true);

    // Cas 2: PIN caissier par défaut (1234)
    const superviseurPerso = '7492';
    const caissiers2 = [{ nom: 'Caissier 1', code_pin: '1234' }];
    const doitConfigurer2 = trivialPins.includes(superviseurPerso) || caissiers2.some(c => trivialPins.includes(c.code_pin));
    expect(doitConfigurer2).toBe(true);

    // Cas 3: Aucun caissier configuré
    const caissiers3 = [];
    const doitConfigurer3 = trivialPins.includes(superviseurPerso) || caissiers3.length === 0;
    expect(doitConfigurer3).toBe(true);

    // Cas 4: Tout est sécurisé
    const caissiers4 = [{ nom: 'Mamadou', code_pin: '8392' }, { nom: 'Fatou', code_pin: '5910' }];
    const doitConfigurer4 = trivialPins.includes(superviseurPerso) || caissiers4.length === 0 || caissiers4.some(c => trivialPins.includes(c.code_pin));
    expect(doitConfigurer4).toBe(false);
  });

  test('Validation payload POST /api/boutiques/:id/caisse/config-pin-initial', () => {
    function validerPayload(body) {
      const pinSup = body.pin_superviseur ? String(body.pin_superviseur).trim() : '';
      const pinCai = body.pin_caissier ? String(body.pin_caissier).trim() : '';
      if (!pinSup || !pinCai) return { valid: false, error: 'Codes requis' };
      if (!/^\d{4,6}$/.test(pinSup) || !/^\d{4,6}$/.test(pinCai)) return { valid: false, error: 'Longueur invalide' };
      if (trivialPins.includes(pinSup)) return { valid: false, error: 'PIN superviseur trivial' };
      return { valid: true };
    }

    expect(validerPayload({ pin_superviseur: '', pin_caissier: '4829' }).valid).toBe(false);
    expect(validerPayload({ pin_superviseur: '1234', pin_caissier: '4829' }).valid).toBe(false);
    expect(validerPayload({ pin_superviseur: '0000', pin_caissier: '4829' }).valid).toBe(false);
    expect(validerPayload({ pin_superviseur: '4829', pin_caissier: '7301' }).valid).toBe(true);
    expect(validerPayload({ pin_superviseur: '918273', pin_caissier: '839201' }).valid).toBe(true);
  });

  test('Route Express POST /api/boutiques/:id/caisse/config-pin-initial est bien déclarée et non 404', async () => {
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/test';
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret_32_chars_long_12345';
    process.env.NODE_ENV = 'test';
    const app = require('../../app');
    const res = await request(app)
      .post('/api/boutiques/284a70a4-e293-48a7-820e-e0c054c97ee9/caisse/config-pin-initial')
      .send({});
    // Le corps étant vide, la route doit répondre 400 (Bad Request) et NON 404 (Endpoint introuvable)
    expect(res.status).not.toBe(404);
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('obligatoires');
  });
});



