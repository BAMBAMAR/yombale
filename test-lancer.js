const { pool } = require('./backend/models/db');
const { lancerCampagne } = require('./backend/services/prospection');

async function test() {
  try {
    const res = await pool.query('SELECT id FROM prospection_leads LIMIT 1');
    if (res.rows.length === 0) {
      console.log('No leads');
      process.exit(0);
    }
    const leadId = res.rows[0].id;
    
    console.log('Launching with lead:', leadId);
    
    const resultat = await lancerCampagne({
      campagneId: null,
      leadIds: [leadId],
      canal: 'email',
      templateMessage: 'Bonjour {nom_boutique}',
      simulation: true
    });
    console.log('Success:', resultat);
  } catch(e) {
    console.error('Error:', e);
  } finally {
    process.exit(0);
  }
}
test();
