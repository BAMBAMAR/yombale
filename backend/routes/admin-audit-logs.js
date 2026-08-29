// backend/routes/admin-audit-logs.js
// Consultation et filtrage des logs d'audit administratifs

const router = require('express').Router();
const { pool } = require('../models/db');
const { adminSecretOnly } = require('../middlewares/auth');

let auditTableEnsured = false;
async function ensureAuditLogsTable() {
  if (auditTableEnsured) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_audit_logs (
        id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        admin_nom       VARCHAR(150) NOT NULL DEFAULT 'Admin',
        admin_role      VARCHAR(50) NOT NULL DEFAULT 'super_admin',
        action          VARCHAR(100) NOT NULL,
        cible_type      VARCHAR(100) NOT NULL,
        cible_id        VARCHAR(100),
        description     TEXT NOT NULL,
        ancienne_valeur JSONB,
        nouvelle_valeur JSONB,
        ip_adresse      VARCHAR(50),
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON admin_audit_logs(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON admin_audit_logs(action);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_cible ON admin_audit_logs(cible_type, cible_id);
    `);
    auditTableEnsured = true;
  } catch (e) {
    console.warn('[AUDIT_LOGS_ENSURE_TABLE]', e.message);
  }
}

router.get('/', adminSecretOnly, async (req, res) => {
  try {
    await ensureAuditLogsTable();
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
