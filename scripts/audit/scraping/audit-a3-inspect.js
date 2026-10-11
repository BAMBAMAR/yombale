// scripts/audit/scraping/audit-a3-inspect.js
// Agent 3/3 — Vérification indépendante et métriques réelles de la base
require('dotenv').config();
const path = require('path');
const { pool } = require(path.join(__dirname, '../../../backend/models/db'));

async function inspecter() {
  console.log('=== AUDIT INDÉPENDANT AGENT 3/3 : INSPECTION BDD ===');
  
  // 1. Tables pertinentes
  const { rows: tables } = await pool.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
  );
  const tableNames = tables.map(r => r.table_name);
  console.log('\n1. TABLES DISPONIBLES :');
  console.log(tableNames.filter(t => /offre|produit|marchand|scrap|immo|annonce|prix/i.test(t)).join(', '));

  // 2. Comptages globaux
  console.log('\n2. COMPTAGES GLOBAUX :');
  const counts = {};
  for (const t of ['produits', 'offres', 'marchands', 'scraping_runs', 'annonces_immo', 'annonces_classifiees', 'historique_prix']) {
    if (tableNames.includes(t)) {
      const c = await pool.query(`SELECT count(*) FROM ${t}`);
      counts[t] = parseInt(c.rows[0].count, 10);
      console.log(`  - ${t} : ${counts[t]}`);
    } else {
      console.log(`  - ${t} : [TABLE NON TROUVÉE]`);
    }
  }

  // 3. Détail des offres par marchand
  console.log('\n3. DÉTAIL DES MARCHANDS ET OFFRES :');
  if (tableNames.includes('marchands') && tableNames.includes('offres')) {
    const { rows: marchands } = await pool.query(`
      SELECT 
        m.id,
        m.nom,
        m.site_url,
        m.methode,
        m.actif,
        m.derniere_sync,
        COUNT(o.id) AS total_offres,
        COUNT(o.id) FILTER (WHERE o.stock = true) AS offres_stock,
        COUNT(o.id) FILTER (WHERE o.stock = false) AS offres_hors_stock,
        COUNT(o.id) FILTER (WHERE o.quarantinee = true) AS offres_quarantaine,
        COUNT(o.id) FILTER (WHERE o.stock = true AND (o.quarantinee = false OR o.quarantinee IS NULL)) AS offres_visibles,
        MIN(o.scraped_at) AS min_scraped,
        MAX(o.scraped_at) AS max_scraped,
        MIN(o.prix) AS prix_min,
        MAX(o.prix) AS prix_max
      FROM marchands m
      LEFT JOIN offres o ON o.marchand_id = m.id
      GROUP BY m.id, m.nom, m.site_url, m.methode, m.actif, m.derniere_sync
      ORDER BY total_offres DESC
    `);
    console.table(marchands.map(m => ({
      nom: m.nom,
      methode: m.methode,
      actif: m.actif,
      total: m.total_offres,
      visibles: m.offres_visibles,
      stock: m.offres_stock,
      hors_stock: m.offres_hors_stock,
      quar: m.offres_quarantaine,
      derniere_sync: m.derniere_sync ? new Date(m.derniere_sync).toISOString().slice(0, 16) : 'jamais',
      max_scraped: m.max_scraped ? new Date(m.max_scraped).toISOString().slice(0, 16) : 'jamais',
      prix_min: m.prix_min,
      prix_max: m.prix_max,
    })));
  }

  // 4. Analyse des doublons et multi-vendeurs sur produits
  console.log('\n4. MULTI-MARCHANDS PAR PRODUIT :');
  if (tableNames.includes('offres') && tableNames.includes('produits')) {
    const { rows: multi } = await pool.query(`
      WITH m AS (
        SELECT produit_id, COUNT(DISTINCT marchand_id) as nb_m, COUNT(id) as nb_offres
        FROM offres
        WHERE stock = true AND (quarantinee = false OR quarantinee IS NULL)
        GROUP BY produit_id
      )
      SELECT 
        nb_m,
        COUNT(*) as nb_produits,
        SUM(nb_offres) as cumul_offres
      FROM m
      GROUP BY nb_m
      ORDER BY nb_m
    `);
    console.table(multi);
  }

  // 5. Historique de scraping_runs
  console.log('\n5. DERNIERS SCRAPING_RUNS :');
  if (tableNames.includes('scraping_runs')) {
    const { rows: runs } = await pool.query(`
      SELECT 
        id,
        source,
        systeme,
        statut,
        started_at,
        ended_at,
        items_extraits,
        items_inseres,
        items_maj,
        items_doublons,
        duree_ms,
        erreur_msg
      FROM scraping_runs
      ORDER BY started_at DESC
      LIMIT 15
    `);
    console.table(runs.map(r => ({
      id: r.id,
      source: r.source,
      sys: r.systeme,
      statut: r.statut,
      started: r.started_at ? new Date(r.started_at).toISOString().slice(0, 16) : null,
      extraits: r.items_extraits,
      inseres: r.items_inseres,
      maj: r.items_maj,
      doublons: r.items_doublons,
      duree_s: r.duree_ms ? Math.round(r.duree_ms / 1000) : null,
      erreur: (r.erreur_msg || '').slice(0, 30),
    })));
  }

  // 6. Analyse des annonces_immo par source
  console.log('\n6. ANNONCES IMMOBILIÈRES PAR SOURCE :');
  if (tableNames.includes('annonces_immo')) {
    const { rows: immo } = await pool.query(`
      SELECT 
        source,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE actif = true) as actifs,
        COUNT(*) FILTER (WHERE contact_tel IS NOT NULL AND LENGTH(contact_tel) >= 7) as avec_tel,
        MIN(created_at) as min_created,
        MAX(created_at) as max_created
      FROM annonces_immo
      GROUP BY source
      ORDER BY total DESC
    `);
    console.table(immo);
  }

  await pool.end();
}

inspecter().catch(e => {
  console.error('Erreur inspection:', e);
  process.exit(1);
});
