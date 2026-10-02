// backend/routes/qualite.js
// Qualité données API — quarantines, anomalies
// Endpoints : GET /api/qualite/quarantines, POST /api/qualite/quarantines/:offre_id/validate

const express = require('express');
const { pool } = require('../models/db');
const { adminSecretOnly } = require('../middlewares/auth');

const { adminAccess } = require('../middlewares/admin-rbac');
const router = express.Router();
const { erreurPublique } = require('../lib/safeError'); // AUD-145
const { relacherOffres } = require('../lib/quarantaine'); // AUD-180

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
router.get('/quarantines', ...adminAccess('produits', {'edit':'produits:moderate'}), async (req, res) => {
  try {
    await ensureQuarantinesTable();
    // AUD-180 : liste blanche + requête paramétrée (le statut était concaténé dans le SQL)
    const status = req.query.status || 'quarantined';
    if (!['quarantined', 'validated', 'rejected', 'released_auto', 'all'].includes(status)) {
      return res.status(400).json({ error: 'Statut inconnu' });
    }
    const filter = status === 'all' ? '' : 'AND ql.status = $1';
    const parametres = status === 'all' ? [] : [status];

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
    `, parametres);

    res.json(result.rows);
  } catch (err) {
    console.error('[qualite/quarantines]', err.message);
    res.status(500).json({ error: erreurPublique(err, req) });
  }
});

// POST /api/qualite/quarantines/:offre_id/validate — valider une offre quarantinée
router.post('/quarantines/:offre_id/validate', ...adminAccess('produits', {'edit':'produits:moderate'}), async (req, res) => {
  try {
    const { offre_id } = req.params;
    const { admin_name } = req.body;

    // AUD-180 : l'ancienne requête (UPDATE ... ORDER BY ... LIMIT 1) est une erreur de syntaxe PostgreSQL : la route répondait
    // toujours 500 et aucune quarantaine n'a jamais pu être validée à la main. Journal, offre et agrégats du produit en un appel.
    const { relachees } = await relacherOffres(pool, [offre_id], { par: admin_name || 'admin', statut: 'validated' });
    if (!relachees) return res.status(404).json({ error: 'Offre introuvable' });

    res.json({ success: true, message: 'Offre validée et restaurée' });
  } catch (err) {
    console.error('[qualite/validate]', err.message);
    res.status(500).json({ error: erreurPublique(err, req) });
  }
});

// POST /api/qualite/quarantines/:offre_id/reject — rejeter une offre quarantinée (garder en quarantine)
router.post('/quarantines/:offre_id/reject', ...adminAccess('produits', {'edit':'produits:moderate'}), async (req, res) => {
  try {
    const { offre_id } = req.params;
    const { admin_name } = req.body;

    // AUD-180 : même défaut de syntaxe que la validation (UPDATE ... ORDER BY ... LIMIT 1) ; l'offre reste en quarantaine,
    // la décision est journalisée
    await relacherOffres(pool, [offre_id], { par: admin_name || 'admin', statut: 'rejected' });

    res.json({ success: true, message: 'Offre rejetée et maintenue en quarantine' });
  } catch (err) {
    console.error('[qualite/reject]', err.message);
    res.status(500).json({ error: erreurPublique(err, req) });
  }
});

module.exports = router;
