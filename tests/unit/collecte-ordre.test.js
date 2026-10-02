// tests/unit/collecte-ordre.test.js : AUD-194 (les 13 sites sont visités du plus en retard au plus récent)
// Racine surchargeable (COLLECTE_BACK_ROOT) pour le contrôle par mutation sur l'ancien code.
process.env.NODE_ENV = 'test';
const path = require('path');
const RACINE_BACK = process.env.COLLECTE_BACK_ROOT || path.join(__dirname, '..', '..', 'backend');
const chemin = (...p) => path.join(RACINE_BACK, ...p);
const erreurHttp = (status) => Object.assign(new Error('HTTP ' + status), { response: { status } });

describe('AUD-194 : trierParAnciennete (fonction pure)', () => {
  const lib = () => require(chemin('lib', 'ordreCollecte.js'));
  const cfg = (...noms) => noms.map((nom) => ({ nom, id: nom.toLowerCase() }));

  test('le relevé le plus ancien passe en premier', () => {
    const dates = new Map([['A', '2026-09-24T18:00:00Z'], ['B', '2026-09-19T10:00:00Z'], ['C', '2026-09-21T10:00:00Z']]);
    expect(lib().trierParAnciennete(cfg('A', 'B', 'C'), dates).map((c) => c.nom)).toEqual(['B', 'C', 'A']);
  });

  test('un site qui n\'a jamais rien rendu passe après tous ceux qu\'on sait lire (il ne monopolise pas le passage)', () => {
    const dates = new Map([['B', '2026-09-24T10:00:00Z'], ['C', '2026-09-20T10:00:00Z']]);
    expect(lib().trierParAnciennete(cfg('A', 'B', 'C', 'D'), dates).map((c) => c.nom)).toEqual(['C', 'B', 'A', 'D']);
  });

  test('égalité ou aucune date : ordre de configuration conservé', () => {
    expect(lib().trierParAnciennete(cfg('A', 'B', 'C'), new Map()).map((c) => c.nom)).toEqual(['A', 'B', 'C']);
    const m = new Map([['A', '2026-09-20T00:00:00Z'], ['B', '2026-09-20T00:00:00Z']]);
    expect(lib().trierParAnciennete(cfg('A', 'B'), m).map((c) => c.nom)).toEqual(['A', 'B']);
  });

  test('reprise après interruption : un passage coupé après 3 sites, le suivant commence par ceux qui n\'ont pas été visités', () => {
    const noms = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'];
    const dates = new Map(noms.map((n, i) => [n, `2026-09-19T0${i}:00:00Z`]));
    const premier = lib().trierParAnciennete(cfg(...noms), dates).map((c) => c.nom);
    premier.slice(0, 3).forEach((n) => dates.set(n, '2026-09-24T12:00:00Z'));   // seuls 3 sites relevés avant le redémarrage
    const second = lib().trierParAnciennete(cfg(...noms), dates).map((c) => c.nom);
    expect(second.slice(0, 3).sort()).toEqual(premier.slice(3).sort());
  });
});

describe('AUD-194 : datesDernierReleve', () => {
  const lib = () => require(chemin('lib', 'ordreCollecte.js'));
  test('prend la date la plus récente entre les passages réussis et les offres relevées ; supporte une table absente', async () => {
    const pool = { query: jest.fn(async (sql) => {
      if (/FROM scraping_runs/.test(sql)) return { rows: [{ source: 'A', dernier: '2026-09-20T00:00:00Z' }] };
      return { rows: [{ nom: 'A', dernier: '2026-09-22T00:00:00Z' }, { nom: 'B', dernier: '2026-09-19T00:00:00Z' }] };
    }) };
    const d = await lib().datesDernierReleve(pool, ['A', 'B']);
    expect(new Date(d.get('A')).toISOString()).toBe('2026-09-22T00:00:00.000Z');
    expect(new Date(d.get('B')).toISOString()).toBe('2026-09-19T00:00:00.000Z');
    const casse = { query: jest.fn().mockRejectedValue(new Error('la relation scraping_runs n\'existe pas')) };
    expect((await lib().datesDernierReleve(casse, ['A'])).size).toBe(0);
  });
});

describe('AUD-194 : lancerScrapingNouveauxSites visite le plus en retard d\'abord', () => {
  test('les sites de fin de liste de configuration passent en premier quand leur relevé est le plus ancien', async () => {
    jest.resetModules();
    jest.doMock('axios', () => ({ get: jest.fn(), post: jest.fn() }));
    jest.doMock(chemin('models', 'db'), () => ({ pool: { query: jest.fn() } }));
    jest.doMock(chemin('services', 'admin-alerts'), () => ({ alerterAdmin: jest.fn().mockResolvedValue({}) }));
    const axios = require('axios');
    const pool = require(chemin('models', 'db')).pool;
    // relevés connus (état du 24/09 : tête de liste fraîche, queue en retard) ; Nova et Dakar Market : jamais rien rendu
    const dernier = {
      'Kanje': '2026-08-05T00:00:00Z', 'Electronic Corp SN': '2026-09-24T18:12:00Z', 'Dakar Mondial Téléphone': '2026-09-24T18:17:00Z',
      'Kaynoo': '2026-09-24T12:42:00Z', 'Master Office Déco': '2026-09-24T18:32:00Z', 'AfriQ Market': '2026-09-21T19:52:00Z',
      'Electrolux Dakar': '2026-09-21T20:02:00Z', 'Soumari': '2026-09-21T20:16:00Z', 'Promo.sn': '2026-09-21T20:30:00Z',
      'Electroménager Dakar': '2026-09-19T19:12:00Z', 'Univers Cosmetix': '2026-09-19T19:26:00Z',
    };
    pool.query.mockImplementation(async (sql) => {
      if (/FROM marchands m JOIN offres o/.test(sql)) return { rows: Object.entries(dernier).map(([nom, d]) => ({ nom, dernier: d })) };
      return { rows: [] };
    });
    const hotes = [];
    axios.get.mockImplementation(async (url) => {
      const h = new URL(url).host;
      if (hotes[hotes.length - 1] !== h && !hotes.includes(h)) hotes.push(h);
      throw erreurHttp(404);
    });
    jest.spyOn(global, 'setTimeout').mockImplementation((fn) => { fn(); return 0; });
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const sc = require(chemin('services', 'scraper.js'));
    await sc.lancerScrapingNouveauxSites();
    jest.restoreAllMocks();
    expect(hotes.slice(0, 4)).toEqual(['kanje.sn', 'electromenager-dakar.com', 'universcosmetix.com', 'shop.afriqmarket.com']);
    expect(hotes.slice(-2).sort()).toEqual(['dakarmarket.sn', 'nova.sn']);   // jamais réussis : en dernier
    expect(hotes[0]).not.toBe('nova.sn');                                    // ordre de configuration abandonné
  });
});
