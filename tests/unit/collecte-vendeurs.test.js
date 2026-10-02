// tests/unit/collecte-vendeurs.test.js : AUD-182 (une offre par vendeur sur les places de marché, décision du propriétaire)
// Partie 1 : clé de vendeur (fonctions pures). Partie 2 : vraie base PostgreSQL JETABLE, seulement si COLLECTE_TEST_DB_URL est défini.
const fs = require('fs');
const path = require('path');
const RACINE_BACK = process.env.COLLECTE_BACK_ROOT || path.join(__dirname, '..', '..', 'backend');
const chemin = (...p) => path.join(RACINE_BACK, ...p);

describe('AUD-182 : vendeurRefOffre', () => {
  const v = () => require(chemin('lib', 'vendeurRef.js'));

  test('place de marché : la clé est l\'adresse de l\'annonce, sans paramètres ni fragment ni barre finale', () => {
    expect(v().vendeurRefOffre('CoinAfrique', {}, 'https://sn.coinafrique.com/annonce/iphone-12-123/')).toBe('ad:sn.coinafrique.com/annonce/iphone-12-123');
    expect(v().vendeurRefOffre('Jiji', {}, 'https://jiji.sn/dakar/mobile-phones/iphone-12-ab12.html?page=2')).toBe('ad:jiji.sn/dakar/mobile-phones/iphone-12-ab12.html');
    expect(v().vendeurRefOffre('Expat-Dakar', {}, 'https://www.expat-dakar.com/a/1')).toBe('ad:www.expat-dakar.com/a/1');
  });

  test('marchand classique : clé vide, une seule offre par produit comme avant', () => {
    expect(v().vendeurRefOffre('Jumia', {}, 'https://www.jumia.sn/p-1.html')).toBe('');
    expect(v().vendeurRefOffre('Decathlon', {}, 'https://www.decathlon.sn/x')).toBe('');
  });

  test('un vendeur fourni par le scraper prime, normalisé', () => {
    expect(v().vendeurRefOffre('Jumia', { vendeur_ref: '  Boutique  ABC ' }, 'https://x.sn/a')).toBe('boutique abc');
  });
});

describe('AUD-182 : migration', () => {
  test('colonne vendeur_ref et unicité (produit, marchand, vendeur) ; l\'ancienne unicité est supprimée', () => {
    const m = fs.readFileSync(chemin('migrate-inline.js'), 'utf8');
    expect(m).toMatch(/ADD COLUMN IF NOT EXISTS vendeur_ref TEXT NOT NULL DEFAULT ''/);
    expect(m).toMatch(/idx_offres_produit_marchand_vendeur ON offres\(produit_id, marchand_id, vendeur_ref\)/);
    expect(m).toMatch(/DROP INDEX IF EXISTS idx_offres_produit_marchand;/);
    expect(m).toMatch(/DROP CONSTRAINT IF EXISTS offres_produit_id_marchand_id_key/);
  });
});

const urlTest = process.env.COLLECTE_TEST_DB_URL;
(urlTest ? describe : describe.skip)('AUD-182 : sauvegarderProduits sur base PostgreSQL jetable', () => {
  let pool; let sc;
  const tag = 'zz' + Date.now().toString(36).replace(/\d/g, (c) => 'abcdefghij'[c]);
  const titre = `Smartphone Zorglub ${tag} 128Go`;
  const offresDe = async (nom) => (await pool.query(
    `SELECT o.prix, o.vendeur_ref, o.url_achat FROM offres o JOIN marchands m ON m.id = o.marchand_id WHERE m.nom = $1 AND o.titre_marchand LIKE $2 ORDER BY o.prix`, [nom, `%${tag}%`])).rows;

  beforeAll(() => {
    if (/render\.com|onrender/.test(urlTest)) throw new Error('REFUS : base de production');
    jest.resetModules();
    jest.dontMock(chemin('models', 'db'));
    jest.doMock('axios', () => ({ get: jest.fn(), post: jest.fn() }));
    process.env.DATABASE_URL = urlTest;
    pool = require(chemin('models', 'db')).pool;
    sc = require(chemin('services', 'scraper.js'));
  });
  afterAll(async () => {
    await pool.query('DELETE FROM produits WHERE id IN (SELECT produit_id FROM offres WHERE titre_marchand LIKE $1)', [`%${tag}%`]);
    await pool.end();
  });

  test('place de marché : deux vendeurs du même modèle gardent chacun leur offre et leur prix', async () => {
    await sc.sauvegarderProduits([
      { titre, prix: 100000, url: `https://sn.coinafrique.com/annonce/zorglub-${tag}-1` },
      { titre, prix: 110000, url: `https://sn.coinafrique.com/annonce/zorglub-${tag}-2` },
    ], 'CoinAfrique', 'https://sn.coinafrique.com');
    const o = await offresDe('CoinAfrique');
    expect(o.map((x) => Number(x.prix))).toEqual([100000, 110000]);
    expect(new Set(o.map((x) => x.vendeur_ref)).size).toBe(2);
  });

  test('re-scrape du même vendeur : mise à jour, pas de nouvelle ligne', async () => {
    await sc.sauvegarderProduits([{ titre, prix: 95000, url: `https://sn.coinafrique.com/annonce/zorglub-${tag}-1?utm_source=x` }], 'CoinAfrique', 'https://sn.coinafrique.com');
    const o = await offresDe('CoinAfrique');
    expect(o.map((x) => Number(x.prix))).toEqual([95000, 110000]);
  });

  test('marchand classique : toujours une seule offre par produit', async () => {
    const t2 = `Casque Zorglub ${tag} Pro`;
    await sc.sauvegarderProduits([
      { titre: t2, prix: 20000, url: `https://boutique-test.sn/p/${tag}-a` },
      { titre: t2, prix: 21000, url: `https://boutique-test.sn/p/${tag}-b` },
    ], `Boutique test ${tag}`, 'https://boutique-test.sn');
    const o = (await pool.query('SELECT vendeur_ref FROM offres WHERE titre_marchand = $1', [t2])).rows;
    expect(o).toHaveLength(1);
  });
});
