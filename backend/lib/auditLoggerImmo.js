const { pool } = require('../models/db');

let tableVerified = false;

async function ensureAgenceLogsTable() {
  if (tableVerified) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS agence_logs (
        id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        agence_id      UUID NOT NULL REFERENCES agences_immo(id) ON DELETE CASCADE,
        utilisateur_id UUID REFERENCES utilisateurs(id) ON DELETE SET NULL,
        auteur_nom     VARCHAR(100),
        type_action    VARCHAR(50),
        description    TEXT,
        metadonnees    JSONB,
        ip_adresse     VARCHAR(45),
        created_at     TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_agence_logs_agence ON agence_logs(agence_id);
      CREATE INDEX IF NOT EXISTS idx_agence_logs_date   ON agence_logs(created_at DESC);
    `);
    tableVerified = true;
  } catch (e) {
    // Si la table existe déjà ou concurrence
    tableVerified = true;
  }
}

const { extraireIp, resoudreAuteur } = require('./auditHelper');

async function enregistrerAgenceAuditLog(agenceId, utilisateurId, auteurNom, typeAction, description, metadonnees = {}, req = null) {
  if (!agenceId) return;
  try {
    await ensureAgenceLogsTable();

    const { uid, nom } = await resoudreAuteur(utilisateurId, auteurNom, req, 'Agent Agence');
    const ip = extraireIp(req);

    await pool.query(
      `INSERT INTO agence_logs (agence_id, utilisateur_id, auteur_nom, type_action, description, metadonnees, ip_adresse)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [agenceId, uid, nom, typeAction, description, JSON.stringify(metadonnees), ip]
    );
  } catch (err) {
    console.error('[AUDIT IMMO LOG ERR]', err);
  }
}

module.exports = { enregistrerAgenceAuditLog };
