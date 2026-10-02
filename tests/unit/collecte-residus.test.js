const { normaliserUrlAchat } = require('../../backend/lib/urlAchat');
const { nettoyerResidus } = require('../../backend/lib/residusCollecte');

describe('AUD-193 residus de collecte', () => {
  test('retire les parametres de position de liste, garde ceux qui identifient la fiche', () => {
    expect(normaliserUrlAchat('https://x.sn/a?page=3&pos=20&cur_pos=20&ads_per_page=21&ads_count=2038&lid=abc&indexPosition=19'))
      .toBe('https://x.sn/a?page=3');
    expect(normaliserUrlAchat('https://x.sn/a?product_id=12&utm_source=fb#top')).toBe('https://x.sn/a?product_id=12');
  });

  test('lecture seule par defaut : aucune ecriture', async () => {
    const ecritures = [];
    const pool = {
      query: jest.fn(async (sql) => {
        if (/^\s*UPDATE/i.test(sql)) ecritures.push(sql);
        if (/count\(\*\)/i.test(sql)) return { rows: [{ n: 2 }] };
        if (/FROM offres WHERE url_achat ~/i.test(sql)) return { rows: [{ id: 1, marchand_id: 1, url_achat: 'https://x.sn/a?utm_source=z' }] };
        return { rows: [] };
      }),
    };
    expect(await nettoyerResidus(pool)).toEqual({ placeholdersImmo: 2, urlsNormalisees: 1, urlsEnConflit: 0 });
    expect(ecritures).toHaveLength(0);
    await nettoyerResidus(pool, { execute: true });
    expect(ecritures).toHaveLength(2);
  });
});
