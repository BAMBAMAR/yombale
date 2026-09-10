require('dotenv').config();
const { pool } = require('./models/db');

(async () => {
  try {
    const camps = await pool.query("SELECT id, created_at, statut, nb_total, nb_envoyes FROM prospection_campagnes ORDER BY created_at DESC LIMIT 5");
    for (const c of camps.rows) {
      const logs = await pool.query("SELECT count(*) as cnt FROM prospection_messages_log WHERE campagne_id = $1", [c.id]);
      console.log(
        'Campagne', c.id.substring(0,8),
        '| créé:', c.created_at,
        '| statut:', c.statut,
        '| nb_total:', c.nb_total,
        '| nb_envoyes:', c.nb_envoyes,
        '| logs_count:', logs.rows[0].cnt
      );
    }
    process.exit(0);
  } catch(e) { console.error(e); process.exit(1); }
})();
