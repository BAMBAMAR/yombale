// tests/unit/collecte-dedup.test.js : AUD-181 (déduplication des produits)
// Partie 1 : fonctions pures et base simulée. Partie 2 : vraie base PostgreSQL JETABLE, seulement si COLLECTE_TEST_DB_URL
// est défini (jamais la production), voir tests/unit/collecte-immo.test.js pour la commande.
// Racine surchargeable (COLLECTE_BACK_ROOT) pour le contrôle par mutation sur l'ancien code.
process.env.NODE_ENV = 'test';
const path = require('path');
const RACINE_BACK = process.env.COLLECTE_BACK_ROOT || path.join(__dirname, '..', '..', 'backend');
const chemin = (...p) => path.join(RACINE_BACK, ...p);

describe('AUD-181 : entités HTML décodées', () => {
  const m = () => require(chemin('services', 'matching.js'));
  test.each([
    ['98&#8221; SMART', '98" SMART'], ['80&#215;60', '80×60'], ['D&rsquo;eau', "D'eau"], ['T&eacute;l&eacute;', 'Télé'],
    ['A &#8211; B', 'A - B'], ['Tom &amp; Jerry', 'Tom & Jerry'], ['&#x27;x&#x27;', "'x'"], ['&inconnue;', '&inconnue;'], ['sans entité', 'sans entité'],
  ])('%j → %j', (entree, attendu) => {
    expect(m().decoderHtmlEntities(entree)).toBe(attendu);
  });

  test('un titre avec entité et le même titre propre se normalisent pareil', () => {
    expect(m().normaliserTitre('TELEVISEUR SONY 98&#8221; SMART GOOGLE TVK82501')).toBe(m().normaliserTitre('TELEVISEUR SONY 98" SMART GOOGLE TVK82501'));
  });
});

describe('AUD-181 : sontMemeProduit', () => {
  const m = () => require(chemin('services', 'matching.js'));
  test('deux titres normalisés identiques sont le même article, même avec un écart de prix aberrant (avant : refusé)', () => {
    const r = m().sontMemeProduit({ titre: 'TELEVISEUR SONY 98" SMART GOOGLE TVK82501', prix: 2000000 }, { titre: 'Téléviseur Sony 98" Smart Google TVK82501', prix: 190000 });
    expect(r).toMatchObject({ match: true, methode: 'titre_exact' });
  });

  test('deux titres différents avec un écart de prix excessif restent refusés', () => {
    const r = m().sontMemeProduit({ titre: 'Téléviseur Hisense 55 Smart 4K UHD', prix: 400000 }, { titre: 'Téléviseur Hisense 100 Smart 4K QLED 100Q7Q', prix: 4000000 });
    expect(r.match).toBe(false);
  });

  test('un accessoire n\'est jamais fusionné avec l\'appareil, même à titre proche', () => {
    expect(m().sontMemeProduit({ titre: 'Samsung Galaxy A15 128Go', prix: 100000 }, { titre: 'Coque Samsung Galaxy A15 128Go', prix: 3000 }).match).toBe(false);
  });
});

describe('AUD-181 : l\'étape « titre exact » compare des valeurs comparables', () => {
  test('la requête utilise nom_normalise avec le titre normalisé par la même fonction que le JavaScript', async () => {
    const matching = require(chemin('services', 'matching.js'));
    const requetes = [];
    const pool = { query: jest.fn(async (sql, params) => { requetes.push({ sql, params }); return { rows: [] }; }) };
    await matching.trouverProduitCorrespondant(pool, { titre: 'Cuisinière Tecnolux 5 Feux 80&#215;60 Gris TEC85 neuf' });
    const exact = requetes.find((r) => /nom_normalise = \$1/.test(r.sql));
    expect(exact).toBeDefined();
    expect(exact.params[0]).toBe(matching.normaliserTitre('Cuisinière Tecnolux 5 Feux 80&#215;60 Gris TEC85 neuf'));
  });
});

describe('AUD-181 : titreEstSpecifique', () => {
  test.each([
    ['samsung galaxy a15 128go', true], ['refrigerateur astech fss 562fd sh side by side', true], ['cuisiniere 60 60', true],
    ['vetements femme', false], ['chaussures homme', false], ['robe bazin brodee', false], ['iphone 12', false], ['', false],
  ])('%j → %j', (titre, attendu) => {
    expect(require(chemin('lib', 'fusionProduits.js')).titreEstSpecifique(titre)).toBe(attendu);
  });
});

const urlTest = process.env.COLLECTE_TEST_DB_URL;
(urlTest ? describe : describe.skip)('AUD-181 : fusion des fiches en double (base PostgreSQL jetable)', () => {
  let pool; let lib; let matching; const tag = 'zz' + Date.now().toString(36).replace(/\d/g, (c) => 'abcdefghij'[c]); // lettres seulement : un chiffre dans le tag rendrait le titre générique « spécifique »
  const ids = {};
  const q = (s, p) => pool.query(s, p);
  const compte = async (sql, p) => Number((await q(sql, p)).rows[0].n);

  async function fiche(cle, nom) {
    const { rows } = await q('INSERT INTO produits (nom, nom_normalise) VALUES ($1, $2) RETURNING id', [nom, matching.normaliserTitre(nom)]);
    ids[cle] = rows[0].id;
  }
  async function offre(cleFiche, cleMarchand, prix) {
    await q(`INSERT INTO offres (produit_id, marchand_id, prix, url_achat, titre_marchand, stock, scraped_at)
             VALUES ($1, $2, $3, $4, 'x', true, NOW())`, [ids[cleFiche], ids[cleMarchand], prix, `https://m.test/${tag}/${cleFiche}-${cleMarchand}`]);
  }

  beforeAll(async () => {
    if (/render\.com|onrender/.test(urlTest)) throw new Error('REFUS : base de production');
    jest.resetModules();
    process.env.DATABASE_URL = urlTest;
    pool = require(chemin('models', 'db')).pool;
    matching = require(chemin('services', 'matching.js'));
    lib = require(chemin('lib', 'fusionProduits.js'));
    for (const k of ['M1', 'M2']) {
      const { rows } = await q('INSERT INTO marchands (nom, site_url, methode) VALUES ($1, $2, $3) RETURNING id', [`Marchand ${k} ${tag}`, 'https://m.test', 'scraper']);
      ids[k] = rows[0].id;
    }
    // a) doublon réel : même titre spécifique, marchands différents
    await fiche('A', `Samsung Galaxy A15 128Go ${tag}a`); await fiche('B', `SAMSUNG GALAXY A15 128GO ${tag}a`);
    await offre('A', 'M1', 100000); await offre('B', 'M2', 95000);
    await q('INSERT INTO clics_affiliation (produit_id, url_cible) VALUES ($1, $2)', [ids.B, 'https://m.test/clic']);
    // b) même marché : deux annonces du même marchand au même titre → jamais fusionnées
    await fiche('C', `Iphone 12 128Go bleu ${tag}b`); await fiche('D', `Iphone 12 128Go bleu ${tag}b`);
    await offre('C', 'M1', 250000); await offre('D', 'M1', 240000);
    // d) titre générique (sans chiffre) chez deux marchands → jamais fusionné
    await fiche('G1', `Vetements femme ${tag}`); await fiche('G2', `Vetements femme ${tag}`);
    await offre('G1', 'M1', 5000); await offre('G2', 'M2', 7000);
  });
  afterAll(async () => {
    await q('DELETE FROM clics_affiliation WHERE url_cible = $1', ['https://m.test/clic']);
    await q('DELETE FROM produits WHERE nom_normalise LIKE $1 OR nom ILIKE $2', [`%${tag}%`, `%${tag}%`]);
    await q('DELETE FROM produits_alias WHERE ancien_nom ILIKE $1', [`%${tag}%`]);
    await q('DELETE FROM marchands WHERE nom LIKE $1', [`%${tag}`]);
    await pool.end();
  });

  test('lecture seule : le plan annonce la fusion A/B mais rien n\'est écrit', async () => {
    const avant = await compte('SELECT count(*) n FROM produits WHERE nom ILIKE $1', [`%${tag}%`]);
    const b = await lib.fusionnerDoublons(pool, { execute: false });
    expect(b.groupes).toBe(1);
    expect(b.fichesEnSurplus).toBe(1);
    expect(await compte('SELECT count(*) n FROM produits WHERE nom ILIKE $1', [`%${tag}%`])).toBe(avant);
    expect(await compte('SELECT count(*) n FROM produits_alias WHERE ancien_nom ILIKE $1', [`%${tag}%`])).toBe(0);
  });

  test('exécution : A et B fusionnées, offre et clic déplacés, alias créé ; C/D (même marché) et G1/G2 (générique) intactes', async () => {
    const b = await lib.fusionnerDoublons(pool, { execute: true });
    expect(b.supprimees).toBe(1);
    // B a disparu, A porte maintenant les deux offres (deux marchands) et le prix minimum recalculé
    expect(await compte('SELECT count(*) n FROM produits WHERE id = $1', [ids.B])).toBe(0);
    expect(await compte('SELECT count(*) n FROM offres WHERE produit_id = $1', [ids.A])).toBe(2);
    const { rows: [a] } = await q('SELECT prix_min, nb_offres FROM produits WHERE id = $1', [ids.A]);
    expect(Number(a.prix_min)).toBe(95000);
    expect(Number(a.nb_offres)).toBe(2);
    expect(await compte('SELECT count(*) n FROM clics_affiliation WHERE produit_id = $1 AND url_cible = $2', [ids.A, 'https://m.test/clic'])).toBe(1);
    expect(await compte('SELECT count(*) n FROM produits_alias WHERE ancien_id = $1 AND canonique_id = $2', [ids.B, ids.A])).toBe(1);
    // intactes
    for (const k of ['C', 'D', 'G1', 'G2']) expect(await compte('SELECT count(*) n FROM produits WHERE id = $1', [ids[k]])).toBe(1);
    expect(await compte('SELECT count(*) n FROM offres WHERE produit_id IN ($1, $2)', [ids.C, ids.D])).toBe(2);
  });

  test('seconde exécution : rien à faire (idempotent)', async () => {
    const b = await lib.fusionnerDoublons(pool, { execute: true });
    expect(b.groupes).toBe(0);
    expect(b.supprimees).toBe(0);
  });

  test('annulation : la fiche B est recréée avec son identifiant et son offre', async () => {
    const r = await lib.annulerFusion(pool, ids.B);
    expect(r).toMatchObject({ annulee: true, offresRendues: 1 });
    expect(await compte('SELECT count(*) n FROM produits WHERE id = $1', [ids.B])).toBe(1);
    expect(await compte('SELECT count(*) n FROM offres WHERE produit_id = $1', [ids.B])).toBe(1);
    expect(await compte('SELECT count(*) n FROM offres WHERE produit_id = $1', [ids.A])).toBe(1);
    expect(await compte('SELECT count(*) n FROM produits_alias WHERE ancien_id = $1', [ids.B])).toBe(0);
  });
});
