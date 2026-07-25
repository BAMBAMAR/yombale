require('dotenv').config();
const { pool } = require('./backend/models/db');
pool.query("SELECT id, nom FROM marchands WHERE nom ILIKE '%nopalou%' OR nom ILIKE '%yombale%' OR nom ILIKE '%kaynoo%'")
  .then(res => { console.table(res.rows); pool.end(); })
  .catch(console.error);
