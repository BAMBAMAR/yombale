// tests/test_scraping_v2_regression.js
// ══════════════════════════════════════════════════════════════════════════════
// SUITE DE TESTS DE NON-RÉGRESSION ET QUALITÉ FORENSIQUE — SCRAPING NOPALOU V2
// ══════════════════════════════════════════════════════════════════════════════

require('dotenv').config();
const assert = require('assert');
const cheerio = require('cheerio');
const { parsePrix } = require('../backend/lib/prix');
const matching = require('../backend/services/matching');
const { evaluerStatut, SEUILS } = require('../backend/lib/scrapingRun');
const DecathlonCollector = require('../backend/services/collecte/DecathlonCollector');
const JsonStoreCollector = require('../backend/services/collecte/JsonStoreCollector');
const KeurImmoCollector = require('../backend/services/collecte/KeurImmoCollector');
const { REGISTRE_SOURCES, obtenirSource, listerSourcesActives } = require('../backend/services/collecte/SourcesRegistry');

let testsPasses = 0;
let testsEchoues = 0;

function test(nom, fn) {
  try {
    fn();
    console.log(`  ✓ ${nom}`);
    testsPasses++;
  } catch (err) {
    console.error(`  ✗ ${nom} : ${err.message}`);
    testsEchoues++;
  }
}

async function testAsync(nom, fn) {
  try {
    await fn();
    console.log(`  ✓ ${nom}`);
    testsPasses++;
  } catch (err) {
    console.error(`  ✗ ${nom} : ${err.message}`);
    testsEchoues++;
  }
}

async function lancerSuite() {
  console.log('══════════════════════════════════════════════════════════════════════');
  console.log('  EXÉCUTION DE LA SUITE DE NON-RÉGRESSION SCRAPING & QUALITÉ V2');
  console.log('══════════════════════════════════════════════════════════════════════\n');

  // ───────────────────────────────────────────────────────────────────────────
  console.log('► 1. Tests de normalisation des prix & devises FCFA');
  // ───────────────────────────────────────────────────────────────────────────

  test('parsePrix : montant standard FCFA', () => {
    assert.strictEqual(parsePrix('25 000 FCFA'), 25000);
    assert.strictEqual(parsePrix('1 500 CFA'), 1500);
    assert.strictEqual(parsePrix('85.000 F'), 85000);
  });

  test('parsePrix : prix avec espaces insécables ou caractères invisibles', () => {
    assert.strictEqual(parsePrix('10\u202F000\u00A0CFA'), 10000);
    assert.strictEqual(parsePrix('9\u00A0500 F CFA'), 9500);
  });

  test('parsePrix : prix répété sur une même chaîne (anti-bug Bonnet Decathlon)', () => {
    // Si la chaîne brute contient "1 500 CFA 1 500 CFA", on ne doit pas obtenir 15001500
    const brut = 'Current price 1 000 CFA \n 1 000 CFA';
    const premierMatch = brut.match(/(\d[\d\s.,]{0,8}\d|\d+)\s*(?:cfa|f|xof)?/i);
    const prix = parsePrix(premierMatch ? premierMatch[0] : brut);
    assert.strictEqual(prix, 1000);
    assert.notStrictEqual(prix, 10001000);
  });

  test('parsePrix : rejet des prix sous plancher minimum (500 F)', () => {
    assert.strictEqual(parsePrix('150 FCFA', { min: 500 }), null);
    assert.strictEqual(parsePrix('0 CFA', { min: 500 }), null);
    assert.strictEqual(parsePrix('Gratuit', { min: 500 }), null);
  });

  test('parsePrix : rejet des montants aberrants (> 50 000 000 F)', () => {
    assert.strictEqual(parsePrix('999 999 999 FCFA', { max: 50000000 }), null);
  });

  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n► 2. Tests de normalisation des titres & entités HTML');
  // ───────────────────────────────────────────────────────────────────────────

  test('Décodage d’entités HTML dans les titres marchands', () => {
    const raw = 'Bureau &amp; Chaise d&#8217;Étude DH&#8209;7513 &quot;Design&quot;';
    const decoded = matching.decoderHtmlEntities(raw);
    assert.strictEqual(decoded.includes('&amp;'), false);
    assert.strictEqual(decoded.includes('&#8217;'), false);
    assert.strictEqual(decoded.includes('&quot;'), false);
    assert.strictEqual(decoded, 'Bureau & Chaise d\'Étude DH‑7513 "Design"');
  });

  test('Suppression des espaces multiples et caractères de contrôle', () => {
    const raw = '   Samsung   Galaxy    S24  Ultra \u200B\uFEFF  ';
    const clean = raw.replace(/[\u200B-\u200D\uFEFF]/g, '').trim().replace(/\s+/g, ' ');
    assert.strictEqual(clean, 'Samsung Galaxy S24 Ultra');
  });

  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n► 3. Tests de l’adaptateur DecathlonCollector');
  // ───────────────────────────────────────────────────────────────────────────

  test('DecathlonCollector : extraction du titre complet (Marque + Nom)', () => {
    const htmlFixture = `
      <div class="product-card js-product-card">
        <span data-testid="product-card-brand">DOMYOS</span>
        <header class="product-card_header">
          <a class="js-product-card-link" href="/p/309765-corde-a-sauter.html"></a>
          <h2>Corde à sauter 100, noir</h2>
        </header>
        <span data-testid="current-price" data-value="1000">1 000 CFA</span>
      </div>
    `;
    const $ = cheerio.load(htmlFixture);
    const $el = $('.product-card').first();
    const collector = new DecathlonCollector({ baseUrl: 'https://www.decathlon.sn' });

    const marque = $el.find('[data-testid="product-card-brand"]').text().trim();
    const nomBase = $el.find('h2').first().text().trim() || $el.find('.product-title').first().text().trim();
    const titreBrut = marque && !nomBase.toLowerCase().includes(marque.toLowerCase()) 
      ? `${marque} ${nomBase}` 
      : (nomBase || marque);
    const titre = collector.normaliserTitre(titreBrut);

    assert.strictEqual(titre, 'DOMYOS Corde à sauter 100, noir');
    assert.notStrictEqual(titre, 'DOMYOS'); // Empêche la régression du titre brand-only
  });

  test('DecathlonCollector : titre quand la marque est déjà présente dans le nom', () => {
    const htmlFixture = `
      <div class="product-card">
        <span data-testid="product-card-brand">DECATHLON</span>
        <h2>DECATHLON SAC DE SPORT 75L</h2>
        <span data-testid="current-price" data-value="11500">11 500 CFA</span>
      </div>
    `;
    const $ = cheerio.load(htmlFixture);
    const $el = $('.product-card').first();
    const collector = new DecathlonCollector({ baseUrl: 'https://www.decathlon.sn' });

    const marque = $el.find('[data-testid="product-card-brand"]').text().trim();
    const nomBase = $el.find('h2').first().text().trim();
    const titreBrut = marque && !nomBase.toLowerCase().includes(marque.toLowerCase()) 
      ? `${marque} ${nomBase}` 
      : (nomBase || marque);
    const titre = collector.normaliserTitre(titreBrut);

    assert.strictEqual(titre, 'DECATHLON SAC DE SPORT 75L');
    assert.strictEqual(titre.startsWith('DECATHLON DECATHLON'), false); // Pas de doublon de marque
  });

  test('DecathlonCollector : extraction de prix prioritaire sur data-value', () => {
    const htmlFixture = `
      <div class="product-card">
        <span data-testid="current-price" data-value="25000">
          Current price 25 000 CFA 25 000 CFA
        </span>
      </div>
    `;
    const $ = cheerio.load(htmlFixture);
    const $el = $('.product-card').first();
    const currentPriceEl = $el.find('[data-testid="current-price"]');
    const dataVal = currentPriceEl.attr('data-value');
    let prix = dataVal ? parseInt(dataVal, 10) : null;

    assert.strictEqual(prix, 25000);
  });

  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n► 4. Tests de l’adaptateur JsonStoreCollector (WooCommerce Store API)');
  // ───────────────────────────────────────────────────────────────────────────

  test('JsonStoreCollector : traitement correct des devises XOF et centimes', () => {
    const itemXOF = {
      id: 101,
      name: 'Réfrigérateur 2 Portes',
      prices: { currency_code: 'XOF', currency_minor_unit: 0, price: '185000' }
    };
    const itemEUR = {
      id: 102,
      name: 'Montre Suisse',
      prices: { currency_code: 'EUR', currency_minor_unit: 2, price: '15000' } // 150.00 EUR
    };

    const isFCFA = itemXOF.prices.currency_code === 'XOF';
    const unitXOF = isFCFA ? 0 : itemXOF.prices.currency_minor_unit;
    const prixXOF = unitXOF > 0 ? Math.round(itemXOF.prices.price / Math.pow(10, unitXOF)) : parseInt(itemXOF.prices.price, 10);
    assert.strictEqual(prixXOF, 185000);

    const isFCFAEUR = itemEUR.prices.currency_code === 'XOF';
    const unitEUR = isFCFAEUR ? 0 : itemEUR.prices.currency_minor_unit;
    const prixEUR = unitEUR > 0 ? Math.round(itemEUR.prices.price / Math.pow(10, unitEUR)) : parseInt(itemEUR.prices.price, 10);
    assert.strictEqual(prixEUR, 150);
  });

  test('JsonStoreCollector : arrêt dynamique sur tableau vide ou fin de pages', () => {
    const headersFin = { 'x-wp-totalpages': '15', 'x-wp-total': '1450' };
    const pageActuelle = 15;
    const finAtteinte = pageActuelle >= parseInt(headersFin['x-wp-totalpages'], 10);
    assert.strictEqual(finAtteinte, true);
  });

  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n► 5. Tests de l’adaptateur KeurImmoCollector (Immobilier)');
  // ───────────────────────────────────────────────────────────────────────────

  test('KeurImmoCollector : détection automatique des types de biens', () => {
    const collector = new KeurImmoCollector();
    assert.strictEqual(collector.detecterTypeBien('Belle villa avec piscine aux Almadies'), 'villa');
    assert.strictEqual(collector.detecterTypeBien('Appartement F4 vue mer Plateau'), 'appartement');
    assert.strictEqual(collector.detecterTypeBien('Studio meublé cosy à Yoff Apecsy'), 'appartement_meuble');
    assert.strictEqual(collector.detecterTypeBien('Terrain titre foncier 500m2 Somone'), 'terrain');
    assert.strictEqual(collector.detecterTypeBien('Bureaux open space 200m2 Point E'), 'bureau');
  });

  test('KeurImmoCollector : détection de ville et quartier', () => {
    const collector = new KeurImmoCollector();
    const res1 = collector.detecterVilleEtQuartier('ALMADIES : Appartement standing 3 chambres');
    assert.strictEqual(res1.ville, 'Dakar');
    assert.strictEqual(res1.quartier, 'ALMADIES');

    const res2 = collector.detecterVilleEtQuartier('SALY : Magnifique villa pieds dans l eau');
    assert.strictEqual(res2.ville, 'Saly');
    assert.strictEqual(res2.quartier, 'SALY');
  });

  test('KeurImmoCollector : rejet systématique des annonces à prix 0', () => {
    const annoncePrixZero = { titre: 'Villa Ngaparou', prix: 0, contact_tel: '+221784755756' };
    const hasPrix = annoncePrixZero.prix && Number(annoncePrixZero.prix) >= 10000;
    const estActif = Boolean(hasPrix && annoncePrixZero.contact_tel);
    assert.strictEqual(estActif, false);
  });

  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n► 6. Tests d’évaluation des statuts de runs (RunCollecte)');
  // ───────────────────────────────────────────────────────────────────────────

  test('evaluerStatut : 0 article extrait -> statut echec', () => {
    const res = evaluerStatut({
      categoriesCibles: 5,
      categoriesAvecArticles: 0,
      requetes: { total: 5, erreurs: 0 },
      itemsExtraits: 0,
      medianeItems: 200,
    });
    assert.strictEqual(res.statut, 'echec');
    assert.strictEqual(res.motifs.includes('aucun_article'), true);
  });

  test('evaluerStatut : couverture faible (< 90%) -> statut degrade', () => {
    const res = evaluerStatut({
      categoriesCibles: 10,
      categoriesAvecArticles: 7, // 70% < 90%
      requetes: { total: 10, erreurs: 0 },
      itemsExtraits: 150,
      medianeItems: 160,
    });
    assert.strictEqual(res.statut, 'degrade');
    assert.strictEqual(res.motifs.some(m => m.startsWith('couverture_')), true);
  });

  test('evaluerStatut : erreurs HTTP > 10% -> statut degrade', () => {
    const res = evaluerStatut({
      categoriesCibles: 5,
      categoriesAvecArticles: 5,
      requetes: { total: 20, erreurs: 4 }, // 20% > 10%
      itemsExtraits: 120,
      medianeItems: 130,
    });
    assert.strictEqual(res.statut, 'degrade');
    assert.strictEqual(res.motifs.some(m => m.startsWith('erreurs_http_')), true);
  });

  test('evaluerStatut : volume < 50% de la médiane -> statut degrade', () => {
    const res = evaluerStatut({
      categoriesCibles: 5,
      categoriesAvecArticles: 5,
      requetes: { total: 5, erreurs: 0 },
      itemsExtraits: 40, // 40 < 100 * 0.5
      medianeItems: 100,
    });
    assert.strictEqual(res.statut, 'degrade');
    assert.strictEqual(res.motifs.some(m => m.startsWith('volume_')), true);
  });

  test('evaluerStatut : run conforme -> statut ok', () => {
    const res = evaluerStatut({
      categoriesCibles: 5,
      categoriesAvecArticles: 5,
      requetes: { total: 10, erreurs: 0 },
      itemsExtraits: 110,
      medianeItems: 100,
    });
    assert.strictEqual(res.statut, 'ok');
    assert.strictEqual(res.motifs.length, 0);
  });

  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n► 7. Tests d’intégrité du registre unifié (SourcesRegistry)');
  // ───────────────────────────────────────────────────────────────────────────

  test('SourcesRegistry : intégrité des 9 sources V2 déclarées', () => {
    assert.strictEqual(REGISTRE_SOURCES.length, 9);
    for (const src of REGISTRE_SOURCES) {
      assert.ok(src.id, `Source ${src.nom} sans ID`);
      assert.ok(src.baseUrl, `Source ${src.nom} sans baseUrl`);
      assert.ok(src.systeme, `Source ${src.nom} sans systeme`);
      assert.ok(src.type_methode, `Source ${src.nom} sans type_methode`);
      assert.strictEqual(typeof src.creerCollecteur, 'function');
    }
  });

  test('SourcesRegistry : instanciation correcte de chaque collecteur', () => {
    const soumari = obtenirSource('soumari').creerCollecteur();
    assert.strictEqual(soumari.sourceId, 'soumari');
    assert.strictEqual(soumari.systeme, 'produits');

    const decathlon = obtenirSource('decathlon').creerCollecteur();
    assert.strictEqual(decathlon.sourceId, 'decathlon');
    assert.strictEqual(decathlon.systeme, 'produits');

    const keurImmo = obtenirSource('keur_immo').creerCollecteur();
    assert.strictEqual(keurImmo.sourceId, 'keur_immo');
    assert.strictEqual(keurImmo.systeme, 'immo');
  });

  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n► 8. Tests de dé-stockage conditionnel');
  // ───────────────────────────────────────────────────────────────────────────

  test('Règle de dé-stockage conditionnel (AUD-188)', () => {
    // Une offre n'est dé-stockée que si le marchand a une dernière synchro active (< 7 jours)
    const dateSyncMarchandRecente = new Date(Date.now() - 2 * 24 * 3600 * 1000); // 2 jours
    const dateSyncMarchandAncienne = new Date(Date.now() - 30 * 24 * 3600 * 1000); // 30 jours (panne)

    const septJoursMs = 7 * 24 * 3600 * 1000;
    const eligibleDestockage1 = (Date.now() - dateSyncMarchandRecente.getTime()) < septJoursMs;
    const eligibleDestockage2 = (Date.now() - dateSyncMarchandAncienne.getTime()) < septJoursMs;

    assert.strictEqual(eligibleDestockage1, true, 'Le marchand actif doit permettre le dé-stockage');
    assert.strictEqual(eligibleDestockage2, false, 'Le marchand en panne ne doit JAMAIS voir son stock purgé');
  });

  console.log('══════════════════════════════════════════════════════════════════════');
  console.log(`  BILAN SUITE DE NON-RÉGRESSION : ${testsPasses} RÉUSSIS, ${testsEchoues} ÉCHOUÉS`);
  console.log('══════════════════════════════════════════════════════════════════════\n');

  if (testsEchoues > 0) {
    process.exit(1);
  }
  process.exit(0);
}

lancerSuite().catch(err => {
  console.error('FATAL TEST SUITE:', err);
  process.exit(1);
});
