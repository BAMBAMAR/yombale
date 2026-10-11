// scripts/audit/scraping/cols-scraping-runs.js
require('dotenv').config();
const path = require('path');
const { pool } = require(path.join(__dirname, '../../../backend/models/db'));

(async () => {
  const { rows } = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'scraping_runs' 
    ORDER BY ordinal_position
  `);
  console.table(rows);
  await pool.end();
})();
