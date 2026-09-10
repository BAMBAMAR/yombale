require('../node_modules/dotenv').config({ path: __dirname + '/../.env' });
const { pool } = require('../backend/models/db');

async function migrate() {
  console.log('Running database alterations for boutique customization...');
  await pool.query(`
    ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS slogan VARCHAR(255);
    ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS theme_style VARCHAR(50) DEFAULT 'moderne';
    ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS couleur_secondaire VARCHAR(50) DEFAULT '#F8F5F0';
    ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS forme_boutons VARCHAR(30) DEFAULT 'squircle';
    ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS bandeau_promo TEXT;
    ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS bandeau_promo_actif BOOLEAN DEFAULT FALSE;
    ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS message_accueil TEXT;
    ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS disposition_catalogue VARCHAR(30) DEFAULT 'grille';
  `);
  console.log('Migration succeeded!');
  const check = await pool.query(`
    SELECT column_name, data_type, column_default 
    FROM information_schema.columns 
    WHERE table_name = 'boutiques' 
      AND column_name IN ('slogan', 'theme_style', 'couleur_secondaire', 'forme_boutons', 'bandeau_promo', 'bandeau_promo_actif', 'message_accueil', 'disposition_catalogue')
  `);
  console.table(check.rows);
  process.exit(0);
}

migrate().catch(e => {
  console.error('Migration error:', e);
  process.exit(1);
});
