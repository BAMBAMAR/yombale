// scripts/audit/scraping/migrate-scraping-runs-cols.js
require('dotenv').config();
const path = require('path');
const { pool } = require(path.join(__dirname, '../../../backend/models/db'));

(async () => {
  console.log('Ajout des colonnes manquantes dans scraping_runs...');
  await pool.query(`
    ALTER TABLE scraping_runs ADD COLUMN IF NOT EXISTS http_codes JSONB DEFAULT '{}'::jsonb;
    ALTER TABLE scraping_runs ADD COLUMN IF NOT EXISTS items_rejetes JSONB DEFAULT '{}'::jsonb;
    ALTER TABLE scraping_runs ADD COLUMN IF NOT EXISTS couverture NUMERIC(5,2);
  `);
  console.log('✅ Colonnes ajoutées avec succès dans scraping_runs');
  await pool.end();
})();
