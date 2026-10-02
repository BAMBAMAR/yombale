// tests/unit/collecte-p3.test.js : AUD-190 (compaction de historique_prix), AUD-191 (offreEstMorte), AUD-192 (ARTP : TLS vérifié,
// cron, passage mesuré), AUD-193 (URL d'achat normalisée). Partie « base » : vraie base PostgreSQL JETABLE, seulement si
// COLLECTE_TEST_DB_URL est défini (jamais la production), voir tests/unit/collecte-immo.test.js pour la commande.
// Racine surchargeable (COLLECTE_BACK_ROOT) pour le contrôle par mutation sur l'ancien code.
process.env.NODE_ENV = 'test';
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const RACINE_BACK = process.env.COLLECTE_BACK_ROOT || path.join(__dirname, '..', '..', 'backend');
const chemin = (...p) => path.join(RACINE_BACK, ...p);
const erreurHttp = (status) => Object.assign(new Error('HTTP ' + status), { response: { status } });

describe('AUD-193 : normaliserUrlAchat', () => {
  const n = () => require(chemin('lib', 'urlAchat.js')).normaliserUrlAchat;
  test.each([
    ['https://www.jumia.sn/x-1.html?utm_source=a&utm_medium=b', 'https://www.jumia.sn/x-1.html'],
    ['https://www.jumia.sn/x-1.html#catalog-listing', 'https://www.jumia.sn/x-1.html'],
    ['https://kanje.sn/?p=123&fbclid=zzz', 'https://kanje.sn/?p=123'],
    ['https://m.sn/produit?id=77&gclid=1&color=noir', 'https://m.sn/produit?id=77&color=noir'],
    ['  https://m.sn/a  ', 'https://m.sn/a'],
    ['/produit/abc', '/produit/abc'],
  ])('%j → %j', (entree, attendu) => expect(n()(entree)).toBe(attendu));
  test('vide ou non texte : null', () => { expect(n()('')).toBeNull(); expect(n()(null)).toBeNull(); expect(n()(42)).toBeNull(); });
});

describe('AUD-193 + AUD-191 (scraper.js, base et réseau simulés)', () => {
  let axios; let pool; let sc;
  beforeEach(() => {
    jest.resetModules();
    jest.doMock('axios', () => ({ get: jest.fn(), post: jest.fn() }));
    jest.doMock(chemin('models', 'db'), () => ({ pool: { query: jest.fn() } }));
    axios = require('axios'); pool = require(chemin('models', 'db')).pool;
    sc = require(chemin('services', 'scraper.js'));
    jest.spyOn(global, 'setTimeout').mockImplementation((fn) => { fn(); return 0; });
    jest.spyOn(console, 'log').mockImplementation(() => {}); jest.spyOn(console, 'warn').mockImplementation(() => {}); jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  test('AUD-193 : l\'URL d\'achat enregistrée est débarrassée des paramètres de suivi', async () => {
    const appels = [];
    pool.query.mockImplementation(async (sql, params) => {
      appels.push({ sql, params });
      if (/FROM marchands WHERE/.test(sql)) return { rows: [{ id: 'm1' }] };
      if (/FROM offres WHERE marchand_id/.test(sql)) return { rows: [] };
      if (/INSERT INTO produits/.test(sql)) return { rows: [{ id: 'p1' }] };
      if (/INSERT INTO offres/.test(sql)) return { rows: [{ id: 'o1' }] };
      return { rows: [] };
    });
    await sc.sauvegarderProduits([{ titre: 'Samsung Galaxy A15 128Go test url', prix: 100000, url: 'https://www.jumia.sn/a15.html?utm_source=wa#x', image_url: null }], 'Jumia Senegal', 'x');
    const recherche = appels.find((a) => /FROM offres WHERE marchand_id/.test(a.sql));
    expect(recherche.params[1]).toBe('https://www.jumia.sn/a15.html');
    const insertion = appels.find((a) => /INSERT INTO offres/.test(a.sql));
    expect(insertion.params[3]).toBe('https://www.jumia.sn/a15.html');
  });

  const mk = (status, body, finalUrl = 'https://www.jumia.sn/x.html') => ({ status, data: body, request: { res: { responseUrl: finalUrl } } });
  test.each([
    ['404', () => mk(404, ''), true],
    ['texte d\'indisponibilité dans le contenu', () => mk(200, "<html><body><main>Ce produit n'est plus disponible</main></body></html>"), true],
    ['« page introuvable » dans le titre (page d\'erreur)', () => mk(200, '<html><head><title>Page introuvable</title></head><body>Oups</body></html>'), true],
    ['redirigée vers le catalogue Jumia', () => mk(200, '<html>', 'https://www.jumia.sn/catalog/?q=x'), true],
    ['403 de protection : inconnu, jamais mort', () => mk(403, 'Just a moment'), false],
    ['429 : inconnu, jamais mort', () => mk(429, 'Too many'), false],
    ['page vivante normale', () => mk(200, '<html><body><h1>Samsung A15</h1><p>Acheter</p></body></html>'), false],
    ['AUD-191 : page vivante dont le MENU contient « page introuvable » (faux positif d\'avant)', () => mk(200, '<html><body><nav>404 page introuvable</nav><h1>Samsung A15</h1></body></html>'), false],
    ['AUD-191 : page vivante dont un SCRIPT contient « annonce introuvable »', () => mk(200, '<html><body><script>var t = "annonce introuvable";</script><h1>Samsung A15</h1></body></html>'), false],
    ['AUD-191 : page vivante dont le PIED DE PAGE contient « cette annonce n\'existe plus »', () => mk(200, "<html><body><h1>Samsung A15</h1><footer>cette annonce n'existe plus : aide</footer></body></html>"), false],
  ])('offreEstMorte : %s', async (_nom, reponse, attendu) => {
    axios.get.mockImplementation(async () => reponse());
    expect(await sc.offreEstMorte('https://www.jumia.sn/x.html')).toBe(attendu);
  });

  test('AUD-191 : la vérification d\'offres par passage passe de 200 à 600 (réglable par VERIF_OFFRES_PAR_PASSAGE)', async () => {
    pool.query.mockResolvedValue({ rows: [] });
    await sc.nettoyerOffresExpirees();
    expect(pool.query.mock.calls[0][1][0]).toBe(600);
    process.env.VERIF_OFFRES_PAR_PASSAGE = '50';
    await sc.nettoyerOffresExpirees();
    delete process.env.VERIF_OFFRES_PAR_PASSAGE;
    expect(pool.query.mock.calls[1][1][0]).toBe(50);
  });
});

describe('AUD-192 : ARTP (réseau et base simulés)', () => {
  let https; let appels; let artp; let pool;
  const forfait = { id: 1, nom: 'Pass 1Go', operateurId: 1, typeOffreId: 1, active: true, segment: 'mobile', data: 1024, voix: 0, sms: 0, validite: 1440, prix: 500 };
  const charge = (payload) => {
    appels = [];
    jest.spyOn(https, 'get').mockImplementation((url, opts, cb) => {
      appels.push({ url, opts });
      const res = new EventEmitter(); res.statusCode = 200;
      const req = new EventEmitter(); req.setTimeout = () => {}; req.destroy = () => {};
      setImmediate(() => { cb(res); res.emit('data', JSON.stringify(payload(url))); res.emit('end'); });
      return req;
    });
  };
  beforeEach(() => {
    jest.resetModules();
    delete process.env.ARTP_TLS_INSECURE;
    jest.doMock(chemin('models', 'db'), () => ({ pool: { query: jest.fn().mockResolvedValue({ rows: [] }) } }));
    jest.doMock(chemin('services', 'admin-alerts'), () => ({ alerterAdmin: jest.fn().mockResolvedValue({}) }));
    https = require('https'); pool = require(chemin('models', 'db')).pool;
    jest.spyOn(console, 'log').mockImplementation(() => {}); jest.spyOn(console, 'warn').mockImplementation(() => {}); jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());
  const reponses = (offres) => (url) => (/operateurs$/.test(url) ? [{ id: 1, nom: 'Orange', logo: null }] : /type-offres$/.test(url) ? [{ id: 1, nom: 'Internet mobile' }] : offres);

  test('le certificat est vérifié : chaîne de confiance + intermédiaire fourni, jamais rejectUnauthorized: false', async () => {
    charge(reponses([forfait]));
    artp = require(chemin('services', 'scraper-artp.js'));
    await artp.scraperARTP({ dryRun: true });
    expect(appels.length).toBe(3);
    for (const a of appels) {
      expect(a.opts.rejectUnauthorized).not.toBe(false);
      expect(Array.isArray(a.opts.ca)).toBe(true);
      expect(a.opts.ca.some((c) => /Sectigo|BEGIN CERTIFICATE/.test(c) && c.includes('MIIGTDCC'))).toBe(true);
    }
  });

  test('retour arrière explicite ARTP_TLS_INSECURE=true : certificat non vérifié (journalisé)', async () => {
    process.env.ARTP_TLS_INSECURE = 'true';
    charge(reponses([forfait]));
    artp = require(chemin('services', 'scraper-artp.js'));
    await artp.scraperARTP({ dryRun: true });
    expect(appels[0].opts.rejectUnauthorized).toBe(false);
  });

  test('l\'intermédiaire fourni est un certificat d\'autorité valide pour encore plus d\'un an', () => {
    const { X509Certificate } = require('crypto');
    const pem = fs.readFileSync(chemin('certs', 'sectigo-public-server-ca-dv-r36.pem'), 'utf8');
    const x = new X509Certificate(pem.slice(pem.indexOf('-----BEGIN CERTIFICATE-----')));
    expect(x.ca).toBe(true);
    expect(x.subject).toMatch(/Sectigo Public Server Authentication CA DV R36/);
    expect(new Date(x.validTo).getTime()).toBeGreaterThan(Date.now() + 365 * 86400e3);
  });

  test('passage mesuré : aucun forfait lu = échec enregistré (scraping_runs, source ARTP, système telecom)', async () => {
    charge(reponses([]));
    artp = require(chemin('services', 'scraper-artp.js'));
    const r = await artp.scraperARTP({ dryRun: false });
    expect(r.statut).toBe('echec');
    const insert = pool.query.mock.calls.find((c) => /INSERT INTO scraping_runs/.test(c[0]));
    expect(insert[1][0]).toBe('ARTP');
    expect(insert[1][1]).toBe('telecom');
  });

  test('passage mesuré : un forfait valide = non échec', async () => {
    charge(reponses([forfait]));
    artp = require(chemin('services', 'scraper-artp.js'));
    const r = await artp.scraperARTP({ dryRun: false });
    expect(r.inseres).toBe(1);
    expect(r.statut).not.toBe('echec');
  });

  test('un cron hebdomadaire (lundi 05h00) synchronise le catalogue', () => {
    const src = fs.readFileSync(chemin('services', 'scraper.js'), 'utf8');
    expect(src).toMatch(/cron\.schedule\('0 5 \* \* 1'[\s\S]*?sync_artp_telecom[\s\S]*?scraperARTP/);
  });
});

const urlTest = process.env.COLLECTE_TEST_DB_URL;
(urlTest ? describe : describe.skip)('AUD-190 : compaction de historique_prix (base PostgreSQL jetable)', () => {
  let pool; let lib; const tag = 'zz' + Date.now().toString(36).replace(/\d/g, (c) => 'abcdefghij'[c]);
  const ids = {};
  const q = (s, p) => pool.query(s, p);
  const un = async (s, p) => (await q(s, p)).rows[0];
  const serie = async (cle, prix, joursDepart) => {
    for (let i = 0; i < prix.length; i++) {
      await q(`INSERT INTO historique_prix (offre_id, prix, date) VALUES ($1, $2, NOW() - ($3 || ' days')::interval + ($4 || ' hours')::interval)`, [ids[cle], prix[i], String(joursDepart), String(i)]);
    }
  };
  const prixDe = async (cle) => (await q('SELECT prix FROM historique_prix WHERE offre_id = $1 ORDER BY date, id', [ids[cle]])).rows.map((r) => Number(r.prix));

  beforeAll(async () => {
    if (/render\.com|onrender/.test(urlTest)) throw new Error('REFUS : base de production');
    jest.resetModules();
    jest.dontMock(chemin('models', 'db')); // les parties précédentes ont simulé la base : ici on veut la vraie
    process.env.DATABASE_URL = urlTest;
    pool = require(chemin('models', 'db')).pool;
    lib = require(chemin('lib', 'compactionHistorique.js'));
    ids.M = (await un('INSERT INTO marchands (nom, site_url, methode) VALUES ($1, $2, $3) RETURNING id', [`Marchand ${tag}`, 'https://m.test', 'scraper'])).id;
    for (const k of ['ANCIENNE', 'RECENTE']) {
      ids['P' + k] = (await un('INSERT INTO produits (nom, nom_normalise) VALUES ($1, $2) RETURNING id', [`Produit ${k} ${tag}`, `Produit ${k} ${tag}`])).id;
      ids[k] = (await un(`INSERT INTO offres (produit_id, marchand_id, prix, url_achat, titre_marchand, stock, scraped_at) VALUES ($1, $2, 100, $3, 'x', true, NOW()) RETURNING id`, [ids['P' + k], ids.M, `https://m.test/${tag}/${k}`])).id;
    }
    await serie('ANCIENNE', [100, 100, 100, 100, 150, 150, 150, 100], 60);   // lignes de plus de 35 jours
    await serie('RECENTE', [100, 100, 100, 100], 5);                         // fenêtre récente : jamais touchée
  });
  afterAll(async () => {
    await q('DELETE FROM historique_prix WHERE offre_id = ANY($1::uuid[])', [[ids.ANCIENNE, ids.RECENTE]]);
    await q('DELETE FROM produits WHERE nom LIKE $1', [`%${tag}`]);
    await q('DELETE FROM marchands WHERE nom LIKE $1', [`%${tag}`]);
    await pool.end();
  });

  test('lecture seule : annonce 3 lignes supprimables (milieu des paliers) et n\'écrit rien', async () => {
    const b = await lib.compacterHistorique(pool, { execute: false });
    expect(b.supprimables).toBe(3);
    expect(await prixDe('ANCIENNE')).toHaveLength(8);
  });

  test('exécution : les prix d\'entrée et de sortie de chaque palier sont conservés, la fenêtre récente est intacte', async () => {
    const b = await lib.compacterHistorique(pool, { execute: true });
    expect(b.supprimees).toBe(3);
    expect(await prixDe('ANCIENNE')).toEqual([100, 100, 150, 150, 100]);     // courbe identique : 100 → 150 → 100, aux mêmes dates d'inflexion
    expect(await prixDe('RECENTE')).toEqual([100, 100, 100, 100]);
  });

  test('seconde exécution : rien à supprimer (idempotent)', async () => {
    expect((await lib.compacterHistorique(pool, { execute: true })).supprimees).toBe(0);
  });
});
