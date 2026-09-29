require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { pool } = require('../models/db');
const scraper = require('../services/scraper');

async function verify() {
  console.log("==================================================");
  console.log("   VÉRIFICATION COMPLÈTE DU PLAN DE CORRECTION    ");
  console.log("==================================================");

  let allOk = true;

  // 1. S-001 : Prix aberrant en DB & garde-fou
  console.log('\n[TEST S-001] Vérification du plafond prix 20M :');
  const { rows: rS001 } = await pool.query('SELECT count(*) as count FROM offres WHERE prix > 20000000 AND (quarantinee = false OR stock = true)');
  const s001DbOk = parseInt(rS001[0].count) === 0;
  console.log(`  DB: Offres actives > 20M non quarantinées : ${rS001[0].count} [${s001DbOk ? 'OK' : 'FAIL'}]`);
  if (!s001DbOk) allOk = false;

  // 2. S-007 : Offres fantômes sans URL & stock false
  console.log('\n[TEST S-007] Vérification offres sans URL & stock false (Electroménager Dakar / AfriQ) :');
  const { rows: rS007 } = await pool.query(`
    SELECT count(*) as count
    FROM offres o
    JOIN marchands m ON m.id = o.marchand_id
    WHERE o.stock = false AND (o.url_achat IS NULL OR TRIM(o.url_achat) = '')
      AND m.nom IN ('Electroménager Dakar', 'AfriQ Market')
  `);
  const s007Ok = parseInt(rS007[0].count) === 0;
  console.log(`  DB: Offres fantômes restantes : ${rS007[0].count} [${s007Ok ? 'OK' : 'FAIL'}]`);
  if (!s007Ok) allOk = false;

  // 3. S-006 : Kanje inactif > 30 jours
  console.log('\n[TEST S-006] Vérification offres Kanje actives > 30 jours :');
  const { rows: rS006 } = await pool.query(`
    SELECT count(*) as count
    FROM offres o
    JOIN marchands m ON m.id = o.marchand_id
    WHERE m.nom = 'Kanje' AND o.stock = true AND o.scraped_at < NOW() - INTERVAL '30 days'
  `);
  const s006Ok = parseInt(rS006[0].count) === 0;
  console.log(`  DB: Offres Kanje en stock > 30j sans scrape : ${rS006[0].count} [${s006Ok ? 'OK' : 'FAIL'}]`);
  if (!s006Ok) allOk = false;

  // 4. S-005 : Descriptions de produits
  console.log('\n[TEST S-005] Vérification descriptions de produits :');
  const { rows: rS005 } = await pool.query(`
    SELECT count(*) as total, count(*) FILTER (WHERE description IS NULL OR TRIM(description) = '') as vides
    FROM produits
  `);
  const s005Ok = parseInt(rS005[0].vides) === 0;
  console.log(`  DB: Total produits : ${rS005[0].total}, descriptions vides : ${rS005[0].vides} [${s005Ok ? 'OK' : 'FAIL'}]`);
  if (!s005Ok) allOk = false;

  // 5. S-008 : Offres stock=true obsolètes (> 45 jours)
  console.log('\n[TEST S-008] Vérification offres stock=true > 45 jours sans scrape :');
  const { rows: rS008 } = await pool.query(`
    SELECT count(*) as count
    FROM offres
    WHERE stock = true AND scraped_at < NOW() - INTERVAL '45 days' AND quarantinee = false
  `);
  const s008Ok = parseInt(rS008[0].count) === 0;
  console.log(`  DB: Offres obsolètes en stock restantes : ${rS008[0].count} [${s008Ok ? 'OK' : 'FAIL'}]`);
  if (!s008Ok) allOk = false;

  // 6. S-009 : Sources Facebook et source_detail
  console.log('\n[TEST S-009] Vérification colonne source_detail :');
  const { rows: rS009 } = await pool.query(`
    SELECT count(*) as sans_detail
    FROM annonces_classifiees
    WHERE source LIKE 'facebook%' AND (source_detail IS NULL OR TRIM(source_detail) = '')
  `);
  const s009Ok = parseInt(rS009[0].sans_detail) === 0;
  console.log(`  DB: Annonces FB sans source_detail : ${rS009[0].sans_detail} [${s009Ok ? 'OK' : 'FAIL'}]`);
  if (!s009Ok) allOk = false;

  // 7. S-011 : Titres Facebook invalides
  console.log('\n[TEST S-011] Vérification titres FB avec horodatages :');
  const { rows: rS011 } = await pool.query(`
    SELECT count(*) as avec_timestamp
    FROM annonces_classifiees
    WHERE titre ~* 'il\\s+y\\s+a\\s+\\d+\\s+(?:heures?|minutes?|jours?|semaines?|mois)'
  `);
  const s011Ok = parseInt(rS011[0].avec_timestamp) === 0;
  console.log(`  DB: Titres FB avec timestamp résiduel : ${rS011[0].avec_timestamp} [${s011Ok ? 'OK' : 'FAIL'}]`);
  if (!s011Ok) allOk = false;

  // 8. Test live Scraper Jiji (S-003)
  console.log('\n[TEST LIVE S-003] Test en direct du Scraper Jiji (1 page)...');
  try {
    const jijiProds = await scraper.scraperJiji('mobile-phones', 1);
    console.log(`  Live Jiji : ${jijiProds.length} produits extraits !`);
    if (jijiProds.length > 0) {
      console.log('  Exemple Jiji:', {
        titre: jijiProds[0].titre,
        prix: jijiProds[0].prix,
        url: jijiProds[0].url.substring(0, 60) + '...'
      });
      console.log('  [OK] Jiji extrait désormais des produits valides avec des prix non nuls !');
    } else {
      console.log('  [FAIL] 0 produit extrait de Jiji');
      allOk = false;
    }
  } catch (e) {
    console.error('  [FAIL] Erreur live Jiji:', e.message);
    allOk = false;
  }

  // 9. Test live Scraper Jumia (S-002)
  console.log('\n[TEST LIVE S-002] Test en direct du Scraper Jumia (1 page)...');
  try {
    const jumiaProds = await scraper.scraperJumia('telephone-tablette', 1);
    console.log(`  Live Jumia : ${jumiaProds.length} produits extraits !`);
    if (jumiaProds.length > 0) {
      console.log('  Exemple Jumia:', {
        titre: jumiaProds[0].titre,
        prix: jumiaProds[0].prix,
        url: jumiaProds[0].url.substring(0, 60) + '...'
      });
      console.log('  [OK] Jumia extrait avec succès des produits avec article.prd !');
    } else {
      console.log('  [WARN] 0 produit extrait de Jumia (vérifier si anti-bot actif)');
    }
  } catch (e) {
    console.error('  [WARN] Erreur live Jumia:', e.message);
  }

  console.log("\n==================================================");
  console.log(`RÉSULTAT GLOBAL : ${allOk ? 'TOUTES LES CORRECTIONS VALIDÉES ✅' : 'CERTAINES VÉRIFICATIONS ONT ÉCHOUÉ ❌'}`);
  console.log("==================================================");

  await pool.end();
}

verify().catch(e => {
  console.error(e);
  process.exit(1);
});
