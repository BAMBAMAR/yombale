const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { pool } = require('../models/db');

async function inspect() {
  try {
    const q = `
      SELECT 
        b.id as b_id, b.nom as boutique_nom, b.telephone as b_tel, b.created_at as b_created,
        p.id as p_id, p.nom_boutique as lead_nom, p.telephone as p_tel, p.statut as p_statut,
        p.source as p_source, p.created_at as p_created, p.derniere_action_at as p_action
      FROM boutiques b 
      JOIN prospection_leads p ON (
        REGEXP_REPLACE(b.telephone, '[^0-9]', '', 'g') = REGEXP_REPLACE(p.telephone, '[^0-9]', '', 'g') 
        OR REGEXP_REPLACE(b.telephone, '[^0-9]', '', 'g') LIKE '%' || REGEXP_REPLACE(p.telephone, '[^0-9]', '', 'g')
      )
    `;
    const res = await pool.query(q);
    console.log('--- MATCHES BOUTIQUES / LEADS ---');
    console.table(res.rows);

    // Vérifier les messages WhatsApp entrants pour voir s'il y a des réponses !
    console.log('\n--- VÉRIFICATION TABLES WHATSAPP ---');
    const tables = await pool.query(`
      SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%whatsapp%' OR table_name LIKE '%message%'
    `);
    console.table(tables.rows);

    for (const t of tables.rows) {
      const cnt = await pool.query(`SELECT COUNT(*) FROM ${t.table_name}`);
      console.log(`Table ${t.table_name}: ${cnt.rows[0].count} lignes`);
    }

  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
inspect();
