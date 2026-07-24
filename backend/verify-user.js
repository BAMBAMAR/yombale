require('dotenv').config();
const { pool } = require('./models/db');
const id = process.argv[2];
pool.query('UPDATE utilisateurs SET email_verifie=true WHERE id=$1', [id])
  .then(async () => {
    console.log('User verified');
    await pool.end();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error(e);
    await pool.end();
    process.exit(1);
  });
