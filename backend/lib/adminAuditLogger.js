// backend/lib/adminAuditLogger.js
// Traçabilité et journalisation des actions administratives critiques

const { pool } = require('../models/db');

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
    `);
    auditTableEnsured = true;
  } catch (e) {}
}

async function enregistrerAdminLog({
  adminNom = 'Admin',
  adminRole = 'super_admin',
  action,
  cibleType,
  cibleId = null,
  description,
  ancienneValeur = null,
  nouvelleValeur = null,
  req = null,
}) {
  try {
    await ensureAuditLogsTable();
    const ip = req ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim() : null;

    await pool.query(
      `INSERT INTO admin_audit_logs (
        admin_nom, admin_role, action, cible_type, cible_id, description, ancienne_valeur, nouvelle_valeur, ip_adresse, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
      [
        adminNom,
        adminRole,
        action,
        cibleType,
        cibleId ? String(cibleId) : null,
        description,
        ancienneValeur ? JSON.stringify(ancienneValeur) : null,
        nouvelleValeur ? JSON.stringify(nouvelleValeur) : null,
        ip,
      ]
    );
  } catch (err) {
    console.error('[ADMIN_AUDIT_LOG_ERR]', err.message);
  }
}

module.exports = { enregistrerAdminLog };
