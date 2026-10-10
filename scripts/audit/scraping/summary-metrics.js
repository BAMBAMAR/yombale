const { Client } = require('pg');

const dbName = process.env.AUDIT_DATA_DB || 'nopalou_audit_data';
const url = process.env.DATABASE_URL.replace(/\/[^/]+$/, '/' + dbName);

(async () => {
  const client = new Client({ connectionString: url });
  await client.connect();
  await client.query("SET default_transaction_read_only = on");

  const o = await client.query(`
    SELECT
      count(*) as total,
      count(*) FILTER (WHERE stock = true) as stock_true,
      count(*) FILTER (WHERE stock = false) as stock_false,
      count(*) FILTER (WHERE quarantinee = true) as quar_true,
      count(*) FILTER (WHERE stock = true AND (quarantinee = false OR quarantinee IS NULL)) as visibles
    FROM offres
  `);
  console.log('OFFRES GLOBALES:', o.rows[0]);

  const p = await client.query(`
    SELECT
      count(*) as total_fiches,
      count(DISTINCT p.id) FILTER (WHERE o.id IS NOT NULL) as fiches_avec_offres,
      count(DISTINCT p.id) FILTER (WHERE o.id IS NULL) as fiches_orphelines
    FROM produits p
    LEFT JOIN offres o ON o.produit_id = p.id
  `);
  console.log('PRODUITS GLOBAUX:', p.rows[0]);

  const multi = await client.query(`
    WITH m AS (
      SELECT produit_id, count(DISTINCT marchand_id) as nb_m
      FROM offres
      GROUP BY produit_id
    )
    SELECT nb_m, count(*) as nb_produits
    FROM m
    GROUP BY nb_m
    ORDER BY nb_m
  `);
  console.log('MULTI-MARCHANDS:', multi.rows);

  const marchandsStats = await client.query(`
    SELECT
      m.nom,
      m.actif,
      m.derniere_sync,
      count(o.id) as nb_offres,
      count(o.id) FILTER (WHERE o.stock = true AND (o.quarantinee = false OR o.quarantinee IS NULL)) as nb_visibles,
      count(o.id) FILTER (WHERE o.quarantinee = true) as nb_quarantaine,
      min(o.scraped_at) as min_scraped,
      max(o.scraped_at) as max_scraped
    FROM marchands m
    LEFT JOIN offres o ON o.marchand_id = m.id
    GROUP BY m.id, m.nom, m.actif, m.derniere_sync
    ORDER BY count(o.id) DESC
  `);
  console.log('\n=== MARCHANDS DETAIL ===');
  for (const r of marchandsStats.rows) {
    console.log(`${r.nom.padEnd(26)} | offres: ${String(r.nb_offres).padStart(5)} | visibles: ${String(r.nb_visibles).padStart(5)} | quar: ${String(r.nb_quarantaine).padStart(3)} | sync: ${r.derniere_sync ? new Date(r.derniere_sync).toISOString().slice(0, 10) : 'jamais    '} | max_scraped: ${r.max_scraped ? new Date(r.max_scraped).toISOString().slice(0, 10) : 'jamais'}`);
  }

  await client.end();
})();
