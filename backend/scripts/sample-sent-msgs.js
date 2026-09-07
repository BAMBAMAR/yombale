const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { pool } = require('../models/db');

async function checkSampleMsgs() {
  try {
    const res = await pool.query(`
      SELECT l.destinataire, l.statut, l.created_at, l.message_envoye, p.nom_boutique, p.categorie, p.quartier
      FROM prospection_messages_log l
      LEFT JOIN prospection_leads p ON l.lead_id = p.id
      WHERE l.canal = 'whatsapp' AND l.statut = 'envoye'
      ORDER BY l.created_at DESC
      LIMIT 6
    `);

    for (const r of res.rows) {
      console.log('==============================================');
      console.log(`DESTINATAIRE: ${r.destinataire} | DATE: ${r.created_at}`);
      console.log(`LEAD: "${r.nom_boutique}" | CAT: ${r.categorie} | QUARTIER: ${r.quartier}`);
      console.log('MESSAGE ENVOYÉ:');
      console.log(r.message_envoye);
    }

  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

checkSampleMsgs();
