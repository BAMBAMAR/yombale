// tests/unit/collecte-facebook.test.js : AUD-177 (Facebook : rotation, session invalide, base injoignable, codes de sortie)
// Navigateur et base simulés : aucun accès à Facebook ni à une base réelle. La partie navigateur réel (extraction du DOM
// après chaque série de défilements) NE PEUT PAS être validée ici : elle exige une session Facebook réelle.
// Racine surchargeable (COLLECTE_BACK_ROOT) pour le contrôle par mutation sur l'ancien code.
process.env.NODE_ENV = 'test';
const fs = require('fs');
const lireReel = fs.readFileSync.bind(fs);   // copies des vraies fonctions, avant les espions (requireActual renverrait le module espionné)
const existeReel = fs.existsSync.bind(fs);
const path = require('path');

const RACINE_BACK = process.env.COLLECTE_BACK_ROOT || path.join(__dirname, '..', '..', 'backend');
const RACINE_DEPOT = path.join(RACINE_BACK, '..');
const chemin = (...p) => path.join(RACINE_BACK, ...p);

let pool; let scrapingLock; let playwright; let fb; let ecritures; let scraperImmo;

// faux navigateur : `scenario` pilote ce que renvoie la page
function fauxNavigateur(scenario) {
  const page = {
    goto: jest.fn().mockResolvedValue(undefined),
    waitForTimeout: jest.fn().mockResolvedValue(undefined),
    url: jest.fn(() => 'https://www.facebook.com/'),
    click: jest.fn(), fill: jest.fn(), waitForSelector: jest.fn(), waitForURL: jest.fn(),
    request: { get: jest.fn() },
    evaluate: jest.fn(async (fn) => {
      const src = typeof fn === 'function' ? fn.toString() : '';
      if (/murConnexion/.test(src)) return scenario.garde ? scenario.garde() : { murConnexion: false, feedAbsent: false };
      if (fn && fn.name === 'extrairePostsDom') return scenario.posts ? scenario.posts() : [];
      return undefined; // défilement, dépliage des « Voir plus »
    }),
  };
  const contexte = { newPage: jest.fn().mockResolvedValue(page) };
  const navigateur = { newContext: jest.fn().mockResolvedValue(contexte), close: jest.fn().mockResolvedValue(undefined) };
  return { page, navigateur };
}

beforeEach(() => {
  jest.resetModules();
  process.env.FB_SESSION_JSON = '{"cookies":[],"origins":[]}';
  delete process.env.BACKEND_URL; delete process.env.ADMIN_SECRET;
  jest.doMock(chemin('models', 'db'), () => ({ pool: { query: jest.fn() } }));
  jest.doMock(chemin('services', 'admin-alerts'), () => ({ alerterAdmin: jest.fn().mockResolvedValue({}) }));
  jest.doMock('playwright', () => ({ chromium: { launch: jest.fn() } }));
  jest.doMock('tesseract.js', () => { throw new Error('absent'); });
  pool = require(chemin('models', 'db')).pool;
  pool.query.mockResolvedValue({ rows: [] });
  scrapingLock = require(chemin('lib', 'scrapingLock'));
  playwright = require('playwright');
  fb = require(chemin('services', 'scraper-immo-facebook.js'));
  scraperImmo = fb.scraperImmo;
  // état de rotation simulé : le prochain groupe à visiter est le n° 30 ; on capture toutes les écritures
  ecritures = [];
  jest.spyOn(fs, 'existsSync').mockImplementation((p) => (/fb-session/.test(String(p)) ? false : existeReel(p)));
  jest.spyOn(fs, 'readFileSync').mockImplementation((p, enc) => (/fb-scraper-state/.test(String(p)) ? '{"dernierIndexGroupe":30}' : lireReel(p, enc)));
  jest.spyOn(fs, 'writeFileSync').mockImplementation((p, contenu) => { if (/fb-scraper-state/.test(String(p))) ecritures.push(JSON.parse(contenu).dernierIndexGroupe); });
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => { jest.restoreAllMocks(); scrapingLock.relacher(); });

describe('AUD-177 : base injoignable', () => {
  test('rien n\'est lancé : pas de navigateur, verrou libéré, rotation inchangée, statut echec explicite', async () => {
    pool.query.mockRejectedValue(new Error('getaddrinfo ENOTFOUND base-distante'));
    const r = await scraperImmo({ dryRun: false, maxGroupes: 3 });
    expect(r.statut).toBe('echec');
    expect(r.motifs).toContain('base_injoignable');
    expect(r.erreurs[0]).toMatch(/injoignable/);
    expect(playwright.chromium.launch).not.toHaveBeenCalled();
    expect(ecritures).toEqual([]);
    expect(scrapingLock.tenterAcquerir('test')).toBe(true); // le verrou n'est pas resté pris
  });
});

describe('AUD-177 : session Facebook invalidée', () => {
  test('le groupe non visité est repris au prochain passage : l\'index n\'est jamais avancé au-delà du groupe en cours', async () => {
    const { navigateur } = fauxNavigateur({ garde: () => ({ murConnexion: true, feedAbsent: false }) });
    playwright.chromium.launch.mockResolvedValue(navigateur);
    const r = await scraperImmo({ dryRun: false, maxGroupes: 15 });
    expect(r.statut).toBe('echec');
    expect(r.motifs).toContain('session_invalide');
    expect(ecritures.length).toBeGreaterThan(0);
    expect(Math.max(...ecritures)).toBe(30);   // avant : 45 écrit AVANT le passage, 15 groupes sautés
    expect(navigateur.close).toHaveBeenCalled();
  });
});

describe('AUD-177 : rotation et mesure d\'un passage normal', () => {
  test('l\'index avance groupe par groupe puis à la fin du passage ; passage sans article = echec', async () => {
    const { navigateur } = fauxNavigateur({});
    playwright.chromium.launch.mockResolvedValue(navigateur);
    const r = await scraperImmo({ dryRun: false, maxGroupes: 3 });
    expect(ecritures).toEqual([30, 31, 32, 33]);
    expect(r.statut).toBe('echec');                 // 0 post lu : jamais « ok »
    expect(r.diagnostic).toHaveLength(3);           // articlesVisibles par groupe, pour confirmer l'hypothèse de virtualisation du fil
    expect(r.diagnostic[0].articlesVisibles.length).toBe(4); // 3 extractions intermédiaires (défilements 5, 10, 15) + la finale
  });

  test('posts lus : passage non echec, motifs de rejet (sans téléphone) écrits dans scraping_runs', async () => {
    const posts = [
      { texte: 'Vend iPhone 12 128go très bon état 250000 FCFA contact 771234567', imgs: [], href: 'https://www.facebook.com/groups/x/posts/1', contactNom: 'Awa Fall', refExterneId: '1' },
      { texte: 'Joli salon à vendre, prix à débattre, disponible', imgs: [], href: 'https://www.facebook.com/groups/x/posts/2', contactNom: 'Moussa Ba', refExterneId: '2' },
    ];
    const { navigateur } = fauxNavigateur({ posts: () => posts });
    playwright.chromium.launch.mockResolvedValue(navigateur);
    const r = await scraperImmo({ dryRun: false, maxGroupes: 2 });
    expect(r.scrapes).toBe(4);                      // 2 posts × 2 groupes
    expect(r.statut).not.toBe('echec');
    const insertRun = pool.query.mock.calls.find((c) => /INSERT INTO scraping_runs/.test(c[0]));
    expect(insertRun).toBeDefined();
    expect(JSON.parse(insertRun[1][16]).sans_telephone).toBeGreaterThan(0);   // items_rejetes
  });
});

describe('AUD-177 : fusion des extractions successives', () => {
  test('un post revu plus tard remplace la version précédente (texte déplié) ; clé = identifiant du post ou lien', () => {
    const m = new Map();
    expect(fb.accumulerPosts(m, [{ refExterneId: '1', href: 'a', texte: 'court…' }, { refExterneId: null, href: 'b', texte: 'sans id' }])).toBe(2);
    fb.accumulerPosts(m, [{ refExterneId: '1', href: 'a', texte: 'texte complet déplié' }]);
    expect(m.size).toBe(2);
    expect(m.get('1').texte).toBe('texte complet déplié');
    expect(m.get('b').texte).toBe('sans id');
  });
});

describe('AUD-177 : codes de sortie des lanceurs', () => {
  const lire = (rel) => lireReel(path.join(RACINE_DEPOT, rel), 'utf8');
  test('le .bat de la tâche planifiée propage le code de Node (sinon Tee-Object le remplace par 0)', () => {
    expect(lire('scripts/run-scraper-task.bat')).toMatch(/Tee-Object[^\r\n]*-Append; exit \$LASTEXITCODE"/);
  });
  test('sync-immo-local.js et scraper-facebook-local.js sortent en erreur sur un passage echec', () => {
    expect(lire('scripts/sync-immo-local.js')).toMatch(/s\.statut === 'echec'/);
    expect(lire('backend/scripts/scraper-facebook-local.js')).toMatch(/stats\.statut === 'echec'/);
  });
});
