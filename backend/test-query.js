const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.query(`
  SELECT u.id, u.nom, u.email, 'propriétaire' as role, b.created_at
  FROM boutiques b JOIN utilisateurs u ON b.utilisateur_id = u.id
  WHERE b.id = 'dfd632c5-bc8d-49ec-9554-53ea76238ad1'
  UNION
  SELECT u.id, u.nom, u.email, bu.role, bu.created_at
  FROM boutique_utilisateurs bu JOIN utilisateurs u ON bu.utilisateur_id = u.id
  WHERE bu.boutique_id = 'dfd632c5-bc8d-49ec-9554-53ea76238ad1'
  ORDER BY created_at ASC
`)
.then(res => console.log('QUERY SUCCESS:', res.rows))
.catch(err => console.error('QUERY ERROR:', err))
.finally(() => pool.end());
