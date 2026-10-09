// scripts/audit/data/audit-schemas-et-donnees.js
// Analyse détaillée des schémas et des données réelles de toutes les tables Surga
require('dotenv').config();
const { pool } = require('../../../backend/models/db');

async function main() {
  console.log('=== AUDIT DES SCHÉMAS ET DONNÉES SURGA ===\n');

  const tables = [
    'surga_concours',
    'surga_suivi_concours',
    'surga_demarches',
    'surga_demarches_suivis',
    'surga_sources',
    'surga_briefing_items',
    'surga_sport_events',
    'surga_trafic_axes',
    'surga_trafic_signalements',
    'surga_unes_presse',
    'surga_places',
    'surga_favoris_places',
    'surga_profil_pro',
    'surga_documents_emploi',
    'surga_alertes_immo',
    'surga_video_items',
    'surga_video_sources'
  ];

  for (const table of tables) {
    try {
      const colRes = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position;
      `, [table]);

      const countRes = await pool.query(`SELECT COUNT(*) as count FROM ${table};`);
      const count = countRes.rows[0].count;

      console.log(`\n======================================================`);
      console.log(`TABLE: ${table} (${count} enregistrements)`);
      console.log(`------------------------------------------------------`);
      colRes.rows.forEach(c => {
        console.log(`  - ${c.column_name.padEnd(25)} ${c.data_type.padEnd(18)} Nullable:${c.is_nullable}`);
      });

      // Échantillon de données (jusqu'à 3 lignes)
      const dataRes = await pool.query(`SELECT * FROM ${table} LIMIT 3;`);
      if (dataRes.rows.length > 0) {
        console.log(`  Exemple de ligne 1 :`, JSON.stringify(dataRes.rows[0], null, 2));
      }
    } catch (err) {
      console.log(`TABLE ${table} : ERREUR ${err.message}`);
    }
  }

  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
