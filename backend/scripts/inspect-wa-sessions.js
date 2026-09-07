const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { pool } = require('../models/db');

async function inspectWa() {
  try {
    const sess = await pool.query(`
      SELECT *
      FROM whatsapp_sessions
      ORDER BY updated_at DESC
      LIMIT 10
    `);
    console.log('--- WHATSAPP SESSIONS (TOP 10 RECENT) ---');
    console.table(sess.rows);

    const msgs = await pool.query(`
      SELECT *
      FROM whatsapp_processed_messages
      ORDER BY created_at DESC
      LIMIT 10
    `);
    console.log('\n--- WHATSAPP PROCESSED MESSAGES ---');
    console.table(msgs.rows);

    // Cross-reference sessions with prospection_leads
    const matchSessions = await pool.query(`
      SELECT 
        s.phone, s.etape, s.nom_boutique as session_boutique, s.created_at as session_date,
        p.id as lead_id, p.nom_boutique as lead_nom, p.statut as lead_statut
      FROM whatsapp_sessions s
      JOIN prospection_leads p ON (
        REGEXP_REPLACE(s.phone, '[^0-9]', '', 'g') = REGEXP_REPLACE(p.telephone, '[^0-9]', '', 'g')
        OR REGEXP_REPLACE(s.phone, '[^0-9]', '', 'g') LIKE '%' || REGEXP_REPLACE(p.telephone, '[^0-9]', '', 'g')
      )
    `);
    console.log('\n--- MATCHES WHATSAPP SESSIONS / PROSPECTION LEADS ---');
    console.table(matchSessions.rows);

  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
inspectWa();
