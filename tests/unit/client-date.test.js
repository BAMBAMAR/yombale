// AUD-096 : la date d'une opération saisie hors-ligne n'est acceptée que dans une fenêtre bornée.
const { parseClientDate, PASSE_MAX_MS, FUTUR_MAX_MS } = require('../../backend/lib/clientDate');

describe('parseClientDate (AUD-096)', () => {
  const now = Date.parse('2026-09-30T20:00:00.000Z');

  test('accepte la date réelle d\'une vente saisie hors-ligne quelques heures plus tôt', () => {
    expect(parseClientDate('2026-09-30T18:05:00.000Z', now)).toBe('2026-09-30T18:05:00.000Z');
  });

  test('accepte une date limite : 30 jours dans le passé, 5 minutes dans le futur', () => {
    expect(parseClientDate(new Date(now - PASSE_MAX_MS + 1000).toISOString(), now)).not.toBeNull();
    expect(parseClientDate(new Date(now + FUTUR_MAX_MS - 1000).toISOString(), now)).not.toBeNull();
  });

  test('refuse une horloge d\'appareil fausse : trop ancienne ou dans le futur', () => {
    expect(parseClientDate(new Date(now - PASSE_MAX_MS - 1000).toISOString(), now)).toBeNull();
    expect(parseClientDate(new Date(now + FUTUR_MAX_MS + 60_000).toISOString(), now)).toBeNull();
  });

  test('refuse les valeurs illisibles ou non textuelles (le serveur retombe sur NOW())', () => {
    expect(parseClientDate(undefined, now)).toBeNull();
    expect(parseClientDate(null, now)).toBeNull();
    expect(parseClientDate('pas une date', now)).toBeNull();
    expect(parseClientDate(1790000000000, now)).toBeNull();
    expect(parseClientDate('x'.repeat(100), now)).toBeNull();
  });
});
