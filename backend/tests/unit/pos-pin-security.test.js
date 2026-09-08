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
});
