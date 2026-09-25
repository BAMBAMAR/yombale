require('dotenv').config();
const { pool } = require('../backend/models/db');
async function migrate() {
  await pool.query(`
    ALTER TABLE baux_immo ADD COLUMN IF NOT EXISTS pieces_jointes JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE contacts_immo ADD COLUMN IF NOT EXISTS pieces_jointes JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE baux_immo ADD COLUMN IF NOT EXISTS signature_locataire TEXT;
    ALTER TABLE baux_immo ADD COLUMN IF NOT EXISTS date_signature_locataire TIMESTAMPTZ;
    ALTER TABLE baux_immo ADD COLUMN IF NOT EXISTS nom_signataire_locataire VARCHAR(255);
    ALTER TABLE baux_immo ADD COLUMN IF NOT EXISTS signature_bailleur TEXT;
    ALTER TABLE baux_immo ADD COLUMN IF NOT EXISTS date_signature_bailleur TIMESTAMPTZ;
    ALTER TABLE baux_immo ADD COLUMN IF NOT EXISTS nom_signataire_bailleur VARCHAR(255);
    ALTER TABLE baux_immo ADD COLUMN IF NOT EXISTS statut_signature VARCHAR(30) DEFAULT 'en_attente';
  `);
  console.log('✅ Nouvelles colonnes créées avec succès dans PostgreSQL !');
  process.exit(0);
}
migrate().catch(e => { console.error(e); process.exit(1); });
