// scripts/audit/data/inspecter-donnees-surga.js
// Audit technique de fiabilité des données Surga : extraction des données réelles en DB et en mémoire
require('dotenv').config();
const { pool } = require('../../../backend/models/db');

async function inspecter() {
  console.log('=== INSPECTION DES DONNÉES SURGA ===\n');

  // 1. Tables présentes
  const tablesRes = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND (table_name LIKE 'surga_%' OR table_name LIKE '%immo%' OR table_name LIKE '%boutique%')
    ORDER BY table_name;
  `);
  console.log('--- TABLES SURGA / NOPALOU TROUVÉES ---');
  tablesRes.rows.forEach(r => console.log(' - ' + r.table_name));

  // 2. Table surga_concours
  try {
    const concoursRes = await pool.query(`
      SELECT id, sigle, titre, statut, date_cloture, date_epreuves, age_max, frais_dossier_xof, lien_officiel, updated_at
      FROM surga_concours
      ORDER BY id;
    `);
    console.log(`\n--- SURGA_CONCOURS (${concoursRes.rows.length} lignes en DB) ---`);
    for (const c of concoursRes.rows) {
      console.log(`[${c.sigle || c.id}] ${c.titre} | Statut: ${c.statut} | Clôture: ${c.date_cloture?.toISOString?.() || c.date_cloture} | Epreuves: ${c.date_epreuves?.toISOString?.() || c.date_epreuves} | Âge: ${c.age_max} | Frais: ${c.frais_dossier_xof} FCFA | Lien: ${c.lien_officiel}`);
    }
  } catch (e) {
    console.log('Erreur surga_concours:', e.message);
  }

  // 3. Table surga_sources & actualites
  try {
    const sourcesRes = await pool.query(`SELECT id, nom, rss_url, active, derniere_synchro FROM surga_sources ORDER BY id;`);
    console.log(`\n--- SURGA_SOURCES (${sourcesRes.rows.length} sources) ---`);
    for (const s of sourcesRes.rows) {
      console.log(`- ${s.nom} | URL: ${s.rss_url} | Active: ${s.active} | Synchro: ${s.derniere_synchro}`);
    }

    const actusRes = await pool.query(`SELECT COUNT(*) as cnt, MAX(date_publication) as max_date, MIN(date_publication) as min_date FROM surga_actualites;`);
    console.log(`\n--- SURGA_ACTUALITES ---`);
    console.log(`Total: ${actusRes.rows[0].cnt} articles | Plus récent: ${actusRes.rows[0].max_date} | Plus ancien: ${actusRes.rows[0].min_date}`);
  } catch (e) {
    console.log('Erreur surga_sources/actualites:', e.message);
  }

  // 4. Table surga_demarches
  try {
    const demRes = await pool.query(`SELECT id, titre, statut, cout_xof, source_officielle, date_verification FROM surga_demarches ORDER BY id;`);
    console.log(`\n--- SURGA_DEMARCHES (${demRes.rows.length} fiches) ---`);
    for (const d of demRes.rows) {
      console.log(`- [${d.id}] ${d.titre} | Statut: ${d.statut} | Coût: ${d.cout_xof} | Source: ${d.source_officielle} | Vérifié: ${d.date_verification}`);
    }
  } catch (e) {
    console.log('Erreur surga_demarches:', e.message);
  }

  // 5. Table surga_unes
  try {
    const unesRes = await pool.query(`SELECT id, nom_journal, date_parution, source FROM surga_unes ORDER BY date_parution DESC LIMIT 10;`);
    console.log(`\n--- SURGA_UNES (${unesRes.rows.length} entrées récentes) ---`);
    for (const u of unesRes.rows) {
      console.log(`- ${u.nom_journal} | Date: ${u.date_parution} | Source: ${u.source}`);
    }
  } catch (e) {
    console.log('Erreur surga_unes:', e.message);
  }

  // 6. Table surga_places
  try {
    const placesRes = await pool.query(`SELECT id, nom, categorie, quartier, prix_moyen_fcfa FROM surga_places ORDER BY id LIMIT 10;`);
    console.log(`\n--- SURGA_PLACES (${placesRes.rows.length} adresses) ---`);
    for (const p of placesRes.rows) {
      console.log(`- [${p.id}] ${p.nom} (${p.categorie}) à ${p.quartier} ~ ${p.prix_moyen_fcfa} FCFA`);
    }
  } catch (e) {
    console.log('Erreur surga_places:', e.message);
  }

  process.exit(0);
}

inspecter().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
