// tests/unit/collecte-prix.test.js : AUD-187 (un seul parseur de prix pour tous les scrapers)
// Racine surchargeable (COLLECTE_BACK_ROOT) pour le contrôle par mutation sur l'ancien code.
const fs = require('fs');
const path = require('path');
const RACINE_BACK = process.env.COLLECTE_BACK_ROOT || path.join(__dirname, '..', '..', 'backend');
const lire = (rel) => fs.readFileSync(path.join(RACINE_BACK, rel), 'utf8');
const prix = () => require(path.join(RACINE_BACK, 'lib', 'prix.js'));

describe('AUD-187 : parsePrix, une table de vérité unique', () => {
  test.each([
    ['1.500.000 FCFA', 1500000], ['1500000', 1500000], ['1 500 000 F', 1500000], ['1 500 000 FCFA', 1500000],
    ['1 500 000 F', 1500000], ['1.250.000F', 1250000], ['1,500,000', 1500000],
    ['1,5M', 1500000], ['1,5 million', 1500000], ['1.5M', 1500000], ['2 M', 2000000], ['12 millions', 12000000],
    ['CFA 155,000', 155000], ['155 000 CFA', 155000], ['155,000', 155000], ['25.000', 25000], ['25.000 FCFA', 25000],
    ['150 000,50 F', 150000], ['25000.00', 25000], ['25000.0', 25000], ['1500,5', 1500],
    ['2 500 F CFA', 2500], ['15k', 15000], ['15 K', 15000], ['35.5k', 35500],
    ['350000/mois', 350000], ['Prix : 45 000 F', 45000], ['250 000 FCFA / mois', 250000],
    ['85 000 - 95 000 FCFA', 85000],
    [25000, 25000], [25000.4, 25000],
  ])('%j → %j', (entree, attendu) => {
    expect(prix().parsePrix(entree, { min: 100 })).toBe(attendu);
  });

  test.each([['Gratuit'], [''], [null], [undefined], ['sur demande'], ['0'], ['12,50'], ['50 F'], ['1,5']])(
    '%j → null (pas un prix exploitable)', (entree) => {
      expect(prix().parsePrix(entree, { min: 100 })).toBeNull();
    });

  test('les seuils sont ceux de l\'appelant : 5 000 refusé en immo (min 10 000), accepté en commerce (min 500)', () => {
    expect(prix().parsePrix('5 000 F', { min: 10000 })).toBeNull();
    expect(prix().parsePrix('5 000 F', { min: 500 })).toBe(5000);
    expect(prix().parsePrix('3 000 000 000', { max: 999e6 })).toBeNull();
  });

  test('une fourchette est lue en deux bornes, sans rien trancher en silence', () => {
    expect(prix().parsePrixPlage('85 000 - 95 000 FCFA')).toMatchObject({ min: 85000, max: 95000 });
    expect(prix().parsePrixPlage('150 000 FCFA')).toBeNull();
    expect(prix().parsePrixPlage('95 000 - 85 000')).toBeNull();
  });
});

describe('AUD-187 : extrairePrixTexte (texte libre)', () => {
  test.each([
    ['Villa 5 chambres à vendre, 150 000 000 FCFA', 150000000],
    ['F3 à louer 250 000 FCFA par mois', 250000],
    ['Terrain 300 m2 à vendre, 12 millions', 12000000],
    ['Studio meublé 1,5M négociable', 1500000],
    ['iPhone 12 neuf Prix 35k négociable', 35000],
    ['Prix : 25000', 25000],
    ['Vend robe bazin a 15000', 15000],
  ])('%j → %j', (texte, attendu) => {
    expect(prix().extrairePrixTexte(texte)).toBe(attendu);
  });

  test('un numéro de téléphone n\'est jamais pris pour un prix', () => {
    expect(prix().extrairePrixTexte('Disponible a 771234567, appelez vite')).toBeNull();
    expect(prix().extrairePrixTexte('contact 77 123 45 67')).toBeNull();
  });

  test('un callback de validation (cohérence par catégorie) est respecté', () => {
    expect(prix().extrairePrixTexte('Villa 5 000 FCFA ou 800 000 FCFA', { valider: (v) => v >= 15000 })).toBe(800000);
  });
});

describe('AUD-187 : tous les scrapers utilisent le parseur commun', () => {
  test.each([
    ['services/scraper.js', /require\('\.\.\/lib\/prix'\)/],
    ['services/scraper-new-sites.js', /require\('\.\.\/lib\/prix'\)/],
    ['services/scraper-immo-expat.js', /require\('\.\.\/lib\/prix'\)/],
    ['services/scraper-immo-coinafrique.js', /require\('\.\.\/lib\/prix'\)/],
    ['services/scraper-immo-facebook.js', /require\('\.\.\/lib\/prix'\)/],
    ['services/omnisource-collector.js', /require\('\.\.\/lib\/prix'\)/],
  ])('%s', (fichier, motif) => {
    expect(lire(fichier)).toMatch(motif);
  });

  test('plus de parseur de prix local dans les scrapers (fonctions nettoyerPrix / parsePrix à corps propre)', () => {
    expect(lire('services/scraper.js')).not.toMatch(/split\(\/\\n\|\\r\|\\t\|\\s\{2,\}/);
    expect(lire('services/scraper-new-sites.js')).not.toMatch(/split\(\/\\n\|\\r\|\\t\|\\s\{2,\}/);
    expect(lire('services/scraper-immo-expat.js')).not.toMatch(/txt\.replace\(\/\[\^0-9\]\/g/);
    expect(lire('services/scraper-immo-coinafrique.js')).not.toMatch(/replace\(\/\[\^0-9\]\/g,''\), 10\)/);
  });
});

describe('AUD-187 : le prix brut de la source est conservé à côté du prix normalisé', () => {
  test('la migration ajoute offres.prix_brut', () => {
    expect(lire('migrate-inline.js')).toMatch(/ALTER TABLE offres ADD COLUMN IF NOT EXISTS prix_brut TEXT/);
  });

  test('sauvegarderProduits écrit prix_brut (mise à jour d\'une offre connue et création)', async () => {
    jest.resetModules();
    jest.doMock(path.join(RACINE_BACK, 'models', 'db'), () => ({ pool: { query: jest.fn() } }));
    jest.doMock('axios', () => ({ get: jest.fn() }));
    const pool = require(path.join(RACINE_BACK, 'models', 'db')).pool;
    const sc = require(path.join(RACINE_BACK, 'services', 'scraper.js'));
    const appels = [];
    pool.query.mockImplementation(async (sql, params) => {
      appels.push({ sql, params });
      if (/FROM marchands WHERE/.test(sql)) return { rows: [{ id: 'm1' }] };
      if (/FROM offres WHERE marchand_id/.test(sql)) return { rows: [{ id: 'o1', produit_id: 'p1', prix: 1 }] };
      return { rows: [] };
    });
    await sc.sauvegarderProduits([{ titre: 'Produit test prix brut', prix: 1500000, prix_brut: '1,5M FCFA', url: 'https://x.sn/a.html' }], 'Marchand test', 'https://x.sn');
    const maj = appels.find((a) => /UPDATE offres SET/.test(a.sql));
    expect(maj.sql).toMatch(/prix_brut = COALESCE\(\$5, prix_brut\)/);
    expect(maj.params[4]).toBe('1,5M FCFA');
    expect(lire('services/scraper.js')).toMatch(/INSERT INTO offres\(produit_id, marchand_id, prix, url_achat, titre_marchand, specs, scraped_at, stock, prix_brut, vendeur_ref\)/);
  });
});