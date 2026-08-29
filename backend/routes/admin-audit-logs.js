// backend/routes/admin-audit-logs.js
// Consultation et filtrage des logs d'audit administratifs

const router = require('express').Router();
const { pool } = require('../models/db');
const { adminSecretOnly } = require('../middlewares/auth');

router.get('/', adminSecretOnly, async (req, res) => {
  try {
    const { action, cible_type, q, page = 1 } = req.query;
    const limit = 50;
    const offset = (Math.max(1, parseInt(page)) - 1) * limit;

    const conditions = [];
    const values = [];
    let i = 1;

    if (action) {
      conditions.push(`action = $${i++}`);
      values.push(action);
    }
    if (cible_type) {
      conditions.push(`cible_type = $${i++}`);
      values.push(cible_type);
    }
    if (q && q.trim()) {
      conditions.push(`(description ILIKE $${i} OR admin_nom ILIKE $${i} OR cible_id ILIKE $${i})`);
      values.push(`%${q.trim()}%`);
      i++;
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM admin_audit_logs ${whereClause}`,
      values
    );
    const total = parseInt(countRes.rows[0].count);

    const listRes = await pool.query(
      `SELECT id, admin_nom, admin_role, action, cible_type, cible_id, description, ancienne_valeur, nouvelle_valeur, ip_adresse, created_at
       FROM admin_audit_logs
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      [...values, limit, offset]
    );

    res.json({
      logs: listRes.rows,
      total,
      page: parseInt(page),
      limit,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
