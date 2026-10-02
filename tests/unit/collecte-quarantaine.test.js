// tests/unit/collecte-quarantaine.test.js : AUD-180 (quarantaine des offres réversible)
// Partie 1 : fonction pure. Partie 2 : vraie base PostgreSQL JETABLE (routes, réintégration, détecteur), seulement si
// COLLECTE_TEST_DB_URL est défini (jamais la production), voir tests/unit/collecte-immo.test.js pour la commande.
// Racine surchargeable (COLLECTE_BACK_ROOT) pour le contrôle par mutation sur l'ancien code.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'secret-de-test';
const path = require('path');
const RACINE_BACK = process.env.COLLECTE_BACK_ROOT || path.join(__dirname, '..', '..', 'backend');
const chemin = (...p) => path.join(RACINE_BACK, ...p);

describe('AUD-180 : raisonVariation (une baisse plausible n\'est plus une anomalie)', () => {
  const rv = () => require(chemin('lib', 'quarantaine.js')).raisonVariation;
  test('hausse de 80 % : suspecte', () => {
    expect(rv()({ prix: 180000, prixMoyen30j: 100000 })).toBe('variation_hausse_80pct');
  });
  test('baisse de 60 % sur une offre seule, sans plancher : promotion plausible, pas de quarantaine', () => {
    expect(rv()({ prix: 40000, prixMoyen30j: 100000, nbAutres: 0 })).toBeNull();
  });
  test('baisse de 60 % mais cohérente avec les autres offres du produit (≥ 35 % de leur médiane) : pas de quarantaine', () => {
    expect(rv()({ prix: 40000, prixMoyen30j: 100000, medianeAutres: 90000, nbAutres: 2 })).toBeNull();
  });
  test('baisse sous 35 % de la médiane des autres offres : suspecte', () => {
    expect(rv()({ prix: 20000, prixMoyen30j: 100000, medianeAutres: 90000, nbAutres: 2 })).toMatch(/^baisse_sous_mediane_autres_80pct$/);
  });
  test('baisse sous le plancher de la catégorie : suspecte', () => {
    expect(rv()({ prix: 9000, prixMoyen30j: 100000, nbAutres: 0, plancher: 30000 })).toMatch(/^baisse_sous_plancher_91pct$/);
  });
  test('variation de 50 % ou moins, ou données absentes : rien', () => {
    expect(rv()({ prix: 150000, prixMoyen30j: 100000 })).toBeNull();
    expect(rv()({ prix: 50000, prixMoyen30j: 100000 })).toBeNull();
    expect(rv()({ prix: 0, prixMoyen30j: 100000 })).toBeNull();
    expect(rv()({ prix: 1000, prixMoyen30j: null })).toBeNull();
  });
});

const urlTest = process.env.COLLECTE_TEST_DB_URL;
(urlTest ? describe : describe.skip)('AUD-180 : quarantaine réversible (base PostgreSQL jetable)', () => {
  let pool; let app; let lib; let detecter; const tag = 'zz' + Date.now().toString(36).replace(/\d/g, (c) => 'abcdefghij'[c]);
  const ids = {};
  const q = (s, p) => pool.query(s, p);
  const un = async (s, p) => (await q(s, p)).rows[0];

  async function produit(cle, nom) { ids[cle] = (await un('INSERT INTO produits (nom, nom_normalise) VALUES ($1, $2) RETURNING id', [`${nom} ${tag}`, `${nom} ${tag}`])).id; }
  async function offre(cle, cleProduit, cleMarchand, prix, { quarantinee = false, scrapedAt = 'NOW()' } = {}) {
    ids[cle] = (await un(`INSERT INTO offres (produit_id, marchand_id, prix, url_achat, titre_marchand, stock, quarantinee, scraped_at)
                          VALUES ($1, $2, $3, $4, 'x', true, $5, ${scrapedAt}) RETURNING id`,
    [ids[cleProduit], ids[cleMarchand], prix, `https://m.test/${tag}/${cle}`, quarantinee])).id;
  }
  const journal = (cle, prix, joursAvant = 3) => q(
    `INSERT INTO quarantines_log (offre_id, raison, prix, status, created_at) VALUES ($1, 'test', $2, 'quarantined', NOW() - ($3 || ' days')::interval)`,
    [ids[cle], prix, String(joursAvant)]);
  const historique = (cle, prix) => q('INSERT INTO historique_prix (offre_id, prix, date) VALUES ($1, $2, NOW() - INTERVAL \'2 days\')', [ids[cle], prix]);
  const quar = async (cle) => (await un('SELECT quarantinee FROM offres WHERE id = $1', [ids[cle]])).quarantinee;

  beforeAll(async () => {
    if (/render\.com|onrender/.test(urlTest)) throw new Error('REFUS : base de production');
    jest.resetModules();
    process.env.DATABASE_URL = urlTest;
    jest.doMock(chemin('middlewares', 'admin-rbac'), () => ({ adminAccess: () => [(req, res, next) => next()] }));
    pool = require(chemin('models', 'db')).pool;
    lib = require(chemin('lib', 'quarantaine.js'));
    detecter = require(chemin('services', 'anomaly-detector.js')).detecterAnomalies;
    const express = require('express');
    app = express(); app.use(express.json()); app.use('/api/qualite', require(chemin('routes', 'qualite.js')));
    for (const k of ['M1', 'M2']) ids[k] = (await un('INSERT INTO marchands (nom, site_url, methode) VALUES ($1, $2, $3) RETURNING id', [`Marchand ${k} ${tag}`, 'https://m.test', 'scraper'])).id;
  });
  afterAll(async () => {
    await q('DELETE FROM quarantines_log WHERE offre_id = ANY($1::uuid[])', [Object.values(ids)]);
    await q('DELETE FROM historique_prix WHERE offre_id = ANY($1::uuid[])', [Object.values(ids)]);
    await q('DELETE FROM produits WHERE nom LIKE $1', [`%${tag}`]);
    await q('DELETE FROM marchands WHERE nom LIKE $1', [`%${tag}`]);
    await pool.end();
  });

  const supertest = () => require('supertest')(app);

  test('la route de validation fonctionne (avant : toujours 500, erreur de syntaxe SQL) : offre relâchée, journal, prix_min du produit recalculé', async () => {
    await produit('P1', 'Produit validation');
    await offre('O1', 'P1', 'M1', 50000, { quarantinee: true });
    await journal('O1', 50000);
    const r = await supertest().post(`/api/qualite/quarantines/${ids.O1}/validate`).send({ admin_name: 'testeur' });
    expect(r.status).toBe(200);
    expect(await quar('O1')).toBe(false);
    const log = await un('SELECT status, validated_by FROM quarantines_log WHERE offre_id = $1', [ids.O1]);
    expect(log).toMatchObject({ status: 'validated', validated_by: 'testeur' });
    const p = await un('SELECT prix_min, nb_offres FROM produits WHERE id = $1', [ids.P1]);
    expect(Number(p.prix_min)).toBe(50000);
    expect(Number(p.nb_offres)).toBe(1);
  });

  test('la route de rejet fonctionne : l\'offre reste en quarantaine, la décision est journalisée', async () => {
    await produit('P2', 'Produit rejet');
    await offre('O2', 'P2', 'M1', 50000, { quarantinee: true });
    await journal('O2', 50000);
    const r = await supertest().post(`/api/qualite/quarantines/${ids.O2}/reject`).send({ admin_name: 'testeur' });
    expect(r.status).toBe(200);
    expect(await quar('O2')).toBe(true);
    expect((await un('SELECT status FROM quarantines_log WHERE offre_id = $1', [ids.O2])).status).toBe('rejected');
  });

  test('validation d\'une offre inconnue : 404 ; statut inconnu ou injection dans la liste : 400, jamais exécuté', async () => {
    expect((await supertest().post('/api/qualite/quarantines/00000000-0000-0000-0000-000000000000/validate').send({})).status).toBe(404);
    expect((await supertest().get('/api/qualite/quarantines').query({ status: "x' OR '1'='1" })).status).toBe(400);
    const ok = await supertest().get('/api/qualite/quarantines').query({ status: 'rejected' });
    expect(ok.status).toBe(200);
    expect(ok.body.some((l) => l.offre_id === ids.O2)).toBe(true);
  });

  test('réintégration automatique : relâchée seulement si le prix est confirmé et la raison ne tient plus', async () => {
    await produit('P3', 'Produit reevaluation');
    await offre('CONFIRMEE', 'P3', 'M1', 70000, { quarantinee: true });      // prix inchangé, re-scrapée 3 jours après
    await journal('CONFIRMEE', 70000);
    await produit('P4', 'Produit prix change');
    await offre('CHANGEE', 'P4', 'M1', 80000, { quarantinee: true });        // prix différent de celui mis en quarantaine
    await journal('CHANGEE', 60000);
    await produit('P5', 'Produit recent');
    await offre('RECENTE', 'P5', 'M1', 90000, { quarantinee: true });        // quarantaine d'il y a moins d'un jour
    await journal('RECENTE', 90000, 0);
    await produit('P6', 'Produit hausse');
    await offre('HAUSSE', 'P6', 'M1', 300000, { quarantinee: true });        // vraie hausse de 200 % : reste suspecte
    await journal('HAUSSE', 300000);
    await historique('HAUSSE', 100000);
    const r = await lib.reevaluerQuarantaines(pool, { plancherDe: () => null });
    expect(r.relachees).toBeGreaterThanOrEqual(1);
    expect(await quar('CONFIRMEE')).toBe(false);
    expect((await un('SELECT status FROM quarantines_log WHERE offre_id = $1', [ids.CONFIRMEE])).status).toBe('released_auto');
    expect(await quar('CHANGEE')).toBe(true);
    expect(await quar('RECENTE')).toBe(true);
    expect(await quar('HAUSSE')).toBe(true);
    expect(Number((await un('SELECT prix_min FROM produits WHERE id = $1', [ids.P3])).prix_min)).toBe(70000);
  });

  test('détecteur : une promotion de 60 % sur une offre seule n\'est plus mise en quarantaine ; une hausse de 200 % l\'est', async () => {
    await produit('P7', 'Produit promotion');
    await offre('PROMO', 'P7', 'M1', 40000);
    await historique('PROMO', 100000);
    await produit('P8', 'Produit hausse detecteur');
    await offre('FLAMBEE', 'P8', 'M1', 300000);
    await historique('FLAMBEE', 100000);
    await detecter();
    expect(await quar('PROMO')).toBe(false);
    expect(await quar('FLAMBEE')).toBe(true);
  });
});
