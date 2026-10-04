const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function testWave() {
  const bq = await pool.query('SELECT id FROM boutiques LIMIT 1');
  const boutiqueId = bq.rows[0].id;
  const prod = await pool.query('SELECT id, nom, prix, stock_quantite FROM boutique_produits WHERE boutique_id = $1 LIMIT 1', [boutiqueId]);
  const p = prod.rows[0];

  const stockInitial = Number(p.stock_quantite);

  const resWave = await fetch('http://localhost:4100/api/comptabilite/' + boutiqueId + '/commandes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_nom: 'Test Wave Client Full',
      client_telephone: '772345678',
      methode_paiement: 'wave',
      items: [{ produit_id: p.id, quantite: 1, nom: p.nom, prix: Number(p.prix) }]
    })
  });
  const dataWave = await resWave.json();
  console.log('Wave Status:', resWave.status);
  console.log('Wave Response Data:', JSON.stringify(dataWave, null, 2));

  // Check DB
  const cmdRef = dataWave.commande?.reference;
  const dbCmd = await pool.query('SELECT id, reference, statut, montant_total FROM commandes_boutique WHERE reference = $1', [cmdRef]);
  console.log('DB Commande row:', dbCmd.rows[0]);

  const prodApres = await pool.query('SELECT stock_quantite FROM boutique_produits WHERE id = $1', [p.id]);
  console.log('Stock initial:', stockInitial, 'Stock apres:', Number(prodApres.rows[0].stock_quantite));

  await pool.end();
}

testWave().catch(e => { console.error(e); process.exit(1); });
