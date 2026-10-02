// tests/unit/collecte-immo2.test.js : AUD-188 (miroir Facebook -> immobilier) et AUD-189 (Expat immo ne réactive pas un rejet)
// Partie 1 : fonctions pures. Partie 2 : vraie base PostgreSQL JETABLE, seulement si COLLECTE_TEST_DB_URL est défini
// (jamais la production), voir tests/unit/collecte-immo.test.js pour la commande.
// Racine surchargeable (COLLECTE_BACK_ROOT) pour le contrôle par mutation sur l'ancien code.
process.env.NODE_ENV = 'test';
const path = require('path');
const RACINE_BACK = process.env.COLLECTE_BACK_ROOT || path.join(__dirname, '..', '..', 'backend');
const chemin = (...p) => path.join(RACINE_BACK, ...p);

describe('AUD-188 : transaction et type de bien déduits du texte', () => {
  const t = () => require(chemin('lib', 'immoTexte.js'));
  test.each([
    ['Terrain à vendre 300m2 Keur Massar', '', 'vente'],
    ['Villa a vendre Almadies', '', 'vente'],
    ['Vente appartement Ngor', '', 'vente'],
    ['Je vends ma maison à Thiès', '', 'vente'],
    ['Appartement à louer Mermoz', '', 'location'],
    ['F3 en location aux Parcelles', '', 'location'],
    ['Studio meublé', 'à louer 150 000 FCFA par mois', 'location'],
    ['Appartement F4 Ngor', 'Vente urgente, prix négociable', 'vente'],
    ['Villa à louer ou à vendre', '', 'location'],        // signaux contradictoires : rien n'est deviné
    ['Bel appartement', '', 'location'],                  // aucun signal : valeur par défaut historique
  ])('transaction de « %s » / « %s » → %s', (titre, description, attendu) => {
    expect(t().deduireTransaction(titre, description)).toBe(attendu);
  });

  test.each([
    ['Terrain à vendre 300m2', 'terrain'], ['Villa 5 chambres à Almadies', 'villa'], ['Appartement 3 chambres Mermoz', 'appartement'],
    ['Studio meublé Ngor', 'studio'], ['Chambre à louer Yoff', 'chambre'], ['Local commercial 40 m2', 'bureau'],
    ['Maison à Thiès', 'maison'], ['F3 aux Mamelles', 'appartement'], ['Bien exceptionnel', 'appartement'],
  ])('type de « %s » → %s', (titre, attendu) => {
    expect(t().deduireTypeBien(titre, '')).toBe(attendu);
  });
});

const urlTest = process.env.COLLECTE_TEST_DB_URL;
(urlTest ? describe : describe.skip)('AUD-188 / AUD-189 : base PostgreSQL jetable', () => {
  let pool; let fb; let expat; const tag = 'zz' + Date.now().toString(36).replace(/\d/g, (c) => 'abcdefghij'[c]);
  const un = async (s, p) => (await pool.query(s, p)).rows[0];

  beforeAll(() => {
    if (/render\.com|onrender/.test(urlTest)) throw new Error('REFUS : base de production');
    jest.resetModules();
    process.env.DATABASE_URL = urlTest;
    jest.doMock(chemin('services', 'prospection.js'), () => ({ detecterQuartier: (txt) => (/mermoz/i.test(txt) ? 'Mermoz' : null) }));
    pool = require(chemin('models', 'db')).pool;
    fb = require(chemin('services', 'scraper-immo-facebook.js'));
    expat = require(chemin('services', 'scraper-immo-expat.js'));
  });
  afterAll(async () => {
    await pool.query('DELETE FROM annonces_immo WHERE ref_externe LIKE $1', [`%${tag}%`]);
    await pool.query('DELETE FROM annonces_classifiees WHERE ref_externe LIKE $1', [`%${tag}%`]);
    await pool.end();
  });

  const annonceFb = (n, titre, description, extra = {}) => ({
    categorie_slug: 'immo', titre: `${titre} ${tag}${n}`, description, prix: 12000000, ville: 'Dakar', contact_tel: `7712345${60 + n}`, contact_nom: 'Test',
    photos: [], caracteristiques: {}, source: 'facebook-group-test', ref_externe: `fb-test-${tag}${n}`, url_source: `https://www.facebook.com/groups/test/posts/${tag}${n}`, ...extra,
  });
  const miroir = (n) => un('SELECT transaction, type_bien, quartier, url_source FROM annonces_immo WHERE ref_externe = $1', [`fb-test-${tag}${n}`]);

  test('miroir Facebook : « à vendre » donne une vente, le type et le quartier viennent du texte, l\'URL source est conservée', async () => {
    await fb.upsertAnnonceClassifiee(annonceFb(1, 'Terrain à vendre 300m2 Keur Massar', 'Titre foncier, 12 000 000 FCFA'));
    await fb.upsertAnnonceClassifiee(annonceFb(2, 'Villa a vendre Mermoz', 'Villa 5 chambres'));
    await fb.upsertAnnonceClassifiee(annonceFb(3, 'Appartement à louer Mermoz', 'F3 à louer'));
    expect(await miroir(1)).toMatchObject({ transaction: 'vente', type_bien: 'terrain', quartier: null });
    expect(await miroir(2)).toMatchObject({ transaction: 'vente', type_bien: 'villa', quartier: 'Mermoz' });
    expect(await miroir(3)).toMatchObject({ transaction: 'location', type_bien: 'appartement', quartier: 'Mermoz' });
    expect((await miroir(1)).url_source).toBe(`https://www.facebook.com/groups/test/posts/${tag}1`);
  });

  const expatAnnonce = (n) => ({ titre: `Appartement F3 ${tag}${n}`, type_bien: 'appartement', transaction: 'location', prix: 150000, ville: 'Dakar', quartier: 'Mermoz', photos: [], url_source: `https://www.expat-dakar.com/annonce/${tag}${n}`, source: 'expat-dakar', ref_externe: `expat-${tag}${n}`, meuble: false });
  const etat = (n) => un('SELECT actif, rejete, motif_rejet FROM annonces_immo WHERE ref_externe = $1', [`expat-${tag}${n}`]);

  test('Expat immo : une annonce rejetée par la modération n\'est pas réactivée par un re-scrape (avant : actif et rejete à la fois)', async () => {
    await expat.upsertAnnonce(expatAnnonce(1));
    await pool.query(`UPDATE annonces_immo SET actif = false, rejete = true, motif_rejet = 'Faux immo (modération)' WHERE ref_externe = $1`, [`expat-${tag}1`]);
    await expat.upsertAnnonce(expatAnnonce(1));
    expect(await etat(1)).toMatchObject({ actif: false, rejete: true, motif_rejet: 'Faux immo (modération)' });
  });

  test('Expat immo : une annonce publiée le reste ; une annonce désactivée sans rejet (lien mort puis revenu) est réactivée', async () => {
    await expat.upsertAnnonce(expatAnnonce(2));
    await expat.upsertAnnonce(expatAnnonce(2));
    expect(await etat(2)).toMatchObject({ actif: true });
    await pool.query(`UPDATE annonces_immo SET actif = false WHERE ref_externe = $1`, [`expat-${tag}2`]);
    await expat.upsertAnnonce(expatAnnonce(2));
    expect(await etat(2)).toMatchObject({ actif: true, rejete: false });
  });
});
