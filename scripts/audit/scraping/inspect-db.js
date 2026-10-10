const { Client } = require('pg');

const dbName = process.env.AUDIT_DATA_DB || 'nopalou_audit_data';
const url = process.env.DATABASE_URL.replace(/\/[^/]+$/, '/' + dbName);

(async () => {
  const client = new Client({ connectionString: url });
  await client.connect();
  await client.query("SET default_transaction_read_only = on");

  // Inspecter les colonnes de annonces_classifiees
  const colsClassif = await client.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'annonces_classifiees'
    ORDER BY ordinal_position
  `);
  console.log('Colonnes de annonces_classifiees :', colsClassif.rows.map(c => c.column_name).join(', '));

  // Inspecter les colonnes de produits
  const colsProd = await client.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'produits'
    ORDER BY ordinal_position
  `);
  console.log('Colonnes de produits :', colsProd.rows.map(c => c.column_name).join(', '));

  // Catégories avec table categories si elle existe
  try {
    const cats = await client.query(`
      SELECT c.nom, c.slug, count(p.id) as total_produits, count(o.id) as total_offres
      FROM categories c
      LEFT JOIN produits p ON p.categorie_id = c.id
      LEFT JOIN offres o ON o.produit_id = p.id
      GROUP BY c.id, c.nom, c.slug
      ORDER BY count(o.id) DESC
    `);
    console.log('\n=== CATEGORIES VIA TABLE CATEGORIES ===');
    console.table(cats.rows);
  } catch (e) {
    console.log('Table categories err:', e.message);
  }

  // Annonces classifiées réelles
  console.log('\n=== ANNONCES CLASSIFIEES ===');
  const classif = await client.query(`
    SELECT source,
           count(*) as total,
           count(*) FILTER (WHERE actif = true) as actives,
           min(created_at) as min_created,
           max(created_at) as max_created
    FROM annonces_classifiees
    GROUP BY source
    ORDER BY count(*) DESC
  `);
  console.table(classif.rows);

  await client.end();
})();
