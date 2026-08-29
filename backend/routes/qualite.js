// backend/routes/qualite.js
// Qualité données API — quarantines, anomalies
// Endpoints : GET /api/qualite/quarantines, POST /api/qualite/quarantines/:offre_id/validate

const express = require('express');
const { pool } = require('../models/db');
const { adminSecretOnly } = require('../middlewares/auth');

const router = express.Router();

let quarantinesTableEnsured = false;
async function ensureQuarantinesTable() {
  if (quarantinesTableEnsured) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS quarantines_log (
        id              SERIAL PRIMARY KEY,
        offre_id        INT NOT NULL,
        raison          VARCHAR(255) NOT NULL,
        prix            NUMERIC(12,2),
        prix_moyen_30j  NUMERIC(12,2),
        status          VARCHAR(50) DEFAULT 'quarantined',
        validated_by    VARCHAR(100),
        validated_at    TIMESTAMPTZ,
        created_at      TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_quarantines_status ON quarantines_log(status);
    `);
    quarantinesTableEnsured = true;
  } catch (e) {
    console.warn('[QUARANTINES_ENSURE_TABLE]', e.message);
  }
}

// GET /api/qualite/quarantines — liste des quarantines (admin)
router.get('/quarantines', adminSecretOnly, async (req, res) => {
  try {
    await ensureQuarantinesTable();
    const status = req.query.status || 'quarantined';
    const filter = status === 'all' ? '' : `AND status = '${status}'`;

    const result = await pool.query(`
      SELECT
        ql.id,
        ql.offre_id,
        p.nom as produit_nom,
        ql.raison,
        ql.prix,
        ql.prix_moyen_30j,
        ql.status,
        ql.created_at as quarantined_at
      FROM quarantines_log ql
      JOIN offres o ON o.id = ql.offre_id
      JOIN produits p ON p.id = o.produit_id
      WHERE 1=1 ${filter}
      ORDER BY ql.created_at DESC
      LIMIT 500
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('[qualite/quarantines]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/qualite/quarantines/:offre_id/validate — valider une offre quarantinée
router.post('/quarantines/:offre_id/validate', adminSecretOnly, async (req, res) => {
  try {
    const { offre_id } = req.params;
    const { admin_name } = req.body;

    // Mettre à jour quarantine log
    await pool.query(`
      UPDATE quarantines_log
      SET status = 'validated', validated_by = $1, validated_at = NOW()
      WHERE offre_id = $2 AND status = 'quarantined'
      ORDER BY created_at DESC LIMIT 1
    `, [admin_name || 'admin', offre_id]);

    // Retirer de quarantine l'offre
    await pool.query(
      'UPDATE offres SET quarantinee = false WHERE id = $1',
      [offre_id]
    );

    res.json({ success: true, message: 'Offre validée et restaurée' });
  } catch (err) {
    console.error('[qualite/validate]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/qualite/quarantines/:offre_id/reject — rejeter une offre quarantinée (garder en quarantine)
router.post('/quarantines/:offre_id/reject', adminSecretOnly, async (req, res) => {
  try {
    const { offre_id } = req.params;
    const { admin_name } = req.body;

    // Mettre à jour quarantine log
    await pool.query(`
      UPDATE quarantines_log
      SET status = 'rejected', validated_by = $1, validated_at = NOW()
      WHERE offre_id = $2 AND status = 'quarantined'
      ORDER BY created_at DESC LIMIT 1
    `, [admin_name || 'admin', offre_id]);

    // Garder l'offre en quarantine
    // (pas de UPDATE offres, elle reste quarantinee = true)

    res.json({ success: true, message: 'Offre rejetée et maintenue en quarantine' });
  } catch (err) {
    console.error('[qualite/reject]', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
