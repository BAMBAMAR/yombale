require('dotenv').config();
const { pool } = require('./backend/models/db');
pool.query("SELECT images FROM boutique_produits LIMIT 1")
  .then(res => { console.log(res.rows[0]); process.exit(0); })
  .catch(console.error);
