require('dotenv').config();
const { pool } = require('./models/db');

(async () => {
  try {
    const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'offres'");
    console.log("Columns in offres:", res.rows.map(r => r.column_name));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
