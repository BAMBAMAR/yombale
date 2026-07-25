require('dotenv').config();
const { pool } = require('./backend/models/db');
pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'boutique_produits'")
  .then(res => { console.log(res.rows.map(r => r.column_name)); pool.end(); })
  .catch(console.error);
