const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const {
  sontMemeProduit,
  trouverProduitCorrespondant,
  sontIdentiques,
  estAccessoire,
  extraireMarque,
  normaliserTitre
} = require('../../../backend/services/matching');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function saveProof(filename, data) {
  const dir04 = path.join(__dirname, '../../../audit/04_RESULTATS/PREUVES');
  const dir03 = path.join(__dirname, '../../../audit/03_PREUVES');
  fs.mkdirSync(dir04, { recursive: true });
  fs.mkdirSync(dir03, { recursive: true });
  fs.writeFileSync(path.join(dir04, filename), JSON.stringify(data, null, 2));
  fs.writeFileSync(path.join(dir03, filename.replace('TEST-', 'PREUVE-TEST-')), JSON.stringify(data, null, 2));
}

async function run() {
  console.log('=== DÉBUT EXÉCUTION SECTION 8 (TEST-015) ===');

  const offre1 = {
    titre: 'Samsung Galaxy S23 128Go',
    nom: 'Samsung Galaxy S23 128Go',
    prix: 450000,
    url: 'http://test-source.local/offre1',
    marchand_nom: 'Marchand Expat'
  };

  const offre2 = {
    titre: 'Samsung Galaxy S23 128 Go',
    nom: 'Samsung Galaxy S23 128 Go',
    prix: 440000,
    url: 'http://test-source.local/offre2',
    marchand_nom: 'Marchand CoinAfrique'
  };

  const offre3 = {
    titre: 'Coque silicone Samsung Galaxy S23',
    nom: 'Coque silicone Samsung Galaxy S23',
    prix: 5000,
    url: 'http://test-source.local/offre3',
    marchand_nom: 'Marchand Accessoires'
  };

  // 1. Évaluation algorithmique directe
  const match1_2 = sontMemeProduit(offre1, offre2);
  const match1_3 = sontMemeProduit(offre1, offre3);
  const match2_3 = sontMemeProduit(offre2, offre3);

  console.log('Match(Offre 1, Offre 2):', match1_2);
  console.log('Match(Offre 1, Offre 3):', match1_3);
  console.log('Match(Offre 2, Offre 3):', match2_3);

  // 2. Test d'ingestion et rattachement réel en base (reproduction pipeline scraper.js)
  let mId = null;
  const mRes = await pool.query('SELECT id FROM marchands LIMIT 1');
  if (mRes.rows[0]) {
    mId = mRes.rows[0].id;
  } else {
    const insM = await pool.query("INSERT INTO marchands (nom, url) VALUES ('Marchand Test Scraping', 'http://test.local') RETURNING id");
    mId = insM.rows[0].id;
  }

  // Nettoyage préalable d'anciennes offres et produits de test
  await pool.query("DELETE FROM offres WHERE url_achat LIKE 'http://test-source.local/%'");
  await pool.query("DELETE FROM produits WHERE description = 'audit-test-t15'");

  async function ingererItem(item) {
    const correspondant = await trouverProduitCorrespondant(pool, item);
    let produitId;
    let created = false;
    if (correspondant) {
      produitId = correspondant.id;
    } else {
      const marque = extraireMarque(item.titre);
      const { rows } = await pool.query(
        `INSERT INTO produits (nom, marque, description, nom_normalise)
         VALUES ($1, $2, 'audit-test-t15', $3)
         RETURNING id`,
        [item.titre, marque, normaliserTitre(item.titre)]
      );
      produitId = rows[0].id;
      created = true;
    }

    // Ingestion de l'offre
    await pool.query(
      `INSERT INTO offres (produit_id, marchand_id, prix, url_achat, titre_marchand, scraped_at, stock)
       VALUES ($1, $2, $3, $4, $5, NOW(), true)
       ON CONFLICT DO NOTHING`,
      [produitId, mId, item.prix, item.url, item.titre]
    );

    return { produitId, created };
  }

  const r1 = await ingererItem(offre1);
  const r2 = await ingererItem(offre2);
  const r3 = await ingererItem(offre3);

  // Requête SQL pour vérifier l'état en base
  const produitsDb = await pool.query(
    `SELECT p.id, p.nom, p.marque, p.nom_normalise,
            (SELECT json_agg(json_build_object('id', o.id, 'titre', o.titre_marchand, 'prix', o.prix))
             FROM offres o WHERE o.produit_id = p.id) AS offres
     FROM produits p
     WHERE p.id IN ($1, $2, $3)`,
    [r1.produitId, r2.produitId, r3.produitId]
  );

  console.log('Produits créés en base:', JSON.stringify(produitsDb.rows, null, 2));

  const t15Pass =
    match1_2.match === true &&
    match1_3.match === false &&
    match1_3.raison === 'accessoire_vs_appareil' &&
    match2_3.match === false &&
    match2_3.raison === 'accessoire_vs_appareil' &&
    r1.produitId === r2.produitId && // Offres 1 et 2 sur le même smartphone
    r3.produitId !== r1.produitId && // Coque sur un produit distinct
    produitsDb.rows.length === 2;     // Exactement 2 produits maîtres créés

  const result = {
    status: t15Pass ? 'PASS' : 'FAIL',
    observed: {
      algorithmic_evaluation: {
        smartphone1_vs_smartphone2: match1_2,
        smartphone1_vs_coque: match1_3,
        smartphone2_vs_coque: match2_3
      },
      db_attachments: {
        offre1_produit_id: r1.produitId,
        offre2_produit_id: r2.produitId,
        offre3_coque_produit_id: r3.produitId,
        same_product_for_smartphones: r1.produitId === r2.produitId,
        distinct_product_for_coque: r3.produitId !== r1.produitId,
        total_master_products_created: produitsDb.rows.length
      },
      db_records: produitsDb.rows
    }
  };

  saveProof('TEST-015_preuve-01.json', result);
  console.log(`\nTEST-015 Statut : ${result.status}`);

  await pool.end();
}

run().catch(err => {
  console.error('Erreur section 8:', err);
  process.exit(1);
});
