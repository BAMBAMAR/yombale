// SRG-A1-004 : un numéro, un compte, quelle que soit l'écriture du numéro.
const {
  chiffresCanoniques,
  normaliserTelephoneCompte,
  resolverComptesParTelephone,
  telephoneEstLibrePourCompte,
  SQL_TEL_CANONIQUE,
} = require('../../backend/lib/telephoneIntegrity');

// Faux pool : rend les lignes fournies et garde la dernière requête.
const fauxPool = (lignes) => {
  const pool = { appels: [], query: async (sql, params) => { pool.appels.push({ sql, params }); return { rows: lignes }; } };
  return pool;
};

describe('Téléphone des comptes : forme canonique (SRG-A1-004)', () => {
  test('cinq écritures d un même numéro sénégalais donnent la même forme', () => {
    const ecritures = ['+221771234567', '771234567', '00221771234567', '221771234567', '77 123 45 67', '+221 77-123-45-67', ' +221771234567 '];
    for (const e of ecritures) expect(chiffresCanoniques(e)).toBe('221771234567');
  });

  test('un numéro d un autre pays garde son indicatif ; un numéro à neuf chiffres écrit avec « + » n est pas pris pour un numéro sénégalais', () => {
    expect(chiffresCanoniques('+33 6 12 34 56 78')).toBe('33612345678');
    expect(chiffresCanoniques('0033612345678')).toBe('33612345678');
    expect(chiffresCanoniques('33612345678')).toBe('33612345678');
    expect(chiffresCanoniques('+378 66 12 34')).toBe('378661234');
    expect(chiffresCanoniques(null)).toBe('');
    expect(chiffresCanoniques(771234567)).toBe('221771234567');
  });

  test('numéro enregistré : format international avec « + », ou refus', () => {
    expect(normaliserTelephoneCompte('77 123 45 67')).toBe('+221771234567');
    expect(normaliserTelephoneCompte('0033612345678')).toBe('+33612345678');
    // Numéro local d'un autre pays, sans indicatif : le pays n'est pas connu.
    expect(normaliserTelephoneCompte('0612345678')).toBeNull();
    expect(normaliserTelephoneCompte('1234')).toBeNull();
    expect(normaliserTelephoneCompte('1'.repeat(22))).toBeNull();
    expect(normaliserTelephoneCompte('')).toBeNull();
  });

  test('la résolution compare la forme canonique, pas l écriture', async () => {
    const pool = fauxPool([{ id: 'a', _compte_actif: true }]);
    const { rows, ambigu } = await resolverComptesParTelephone(pool, '77 123 45 67', 'id');
    expect(pool.appels[0].params).toEqual(['221771234567']);
    expect(pool.appels[0].sql).toContain(SQL_TEL_CANONIQUE);
    expect(rows).toEqual([{ id: 'a' }]);
    expect(ambigu).toBe(false);
  });

  test('un compte actif prime sur un compte en cours de suppression ; deux comptes actifs restent ambigus', async () => {
    const mixte = await resolverComptesParTelephone(fauxPool([{ id: 'ancien', _compte_actif: false }, { id: 'actif', _compte_actif: true }]), '+221771234567');
    expect(mixte.rows).toEqual([{ id: 'actif' }]);
    expect(mixte.ambigu).toBe(false);

    const seulEnSuppression = await resolverComptesParTelephone(fauxPool([{ id: 'ancien', _compte_actif: false }]), '+221771234567');
    expect(seulEnSuppression.rows).toEqual([{ id: 'ancien' }]);

    const deuxActifs = await resolverComptesParTelephone(fauxPool([{ id: 'a', _compte_actif: true }, { id: 'b', _compte_actif: true }]), '+221771234567');
    expect(deuxActifs.ambigu).toBe(true);
  });

  test('une saisie trop courte n interroge pas la base', async () => {
    const pool = fauxPool([{ id: 'a', _compte_actif: true }]);
    expect(await resolverComptesParTelephone(pool, '12')).toEqual({ rows: [], ambigu: false });
    expect(pool.appels.length).toBe(0);
  });

  test('un numéro porté par un autre compte, même en cours de suppression, n est pas libre', async () => {
    expect(await telephoneEstLibrePourCompte(fauxPool([{ id: 'autre' }]), '771234567', 'moi')).toBe(false);
    expect(await telephoneEstLibrePourCompte(fauxPool([{ id: 'moi' }]), '771234567', 'moi')).toBe(true);
    expect(await telephoneEstLibrePourCompte(fauxPool([]), '771234567', null)).toBe(true);
    expect(await telephoneEstLibrePourCompte(fauxPool([{ id: 'autre' }]), '', 'moi')).toBe(true);
  });
});
