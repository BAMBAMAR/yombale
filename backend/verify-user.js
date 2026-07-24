require('dotenv').config();
const { pool } = require('./models/db');
const id = process.argv[2];
pool.query('UPDATE utilisateurs SET email_verifie=true WHERE id=$1', [id])
  .then(() => {
    console.log('User verified');
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
