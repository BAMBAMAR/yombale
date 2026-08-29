// backend/lib/adminAuditLogger.js
// Traçabilité et journalisation des actions administratives critiques

const { pool } = require('../models/db');

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
