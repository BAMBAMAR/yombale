// backend/routes/admin-signalements.js
// Centre de traitement des signalements d'abus, arnaques et faux contenus

const router = require('express').Router();
const { pool } = require('../models/db');
const { requireAdminAuth, requireAdminRole } = require('../middlewares/admin-rbac');
const { enregistrerAdminLog } = require('../lib/adminAuditLogger');

router.use(requireAdminAuth);
router.use(requireAdminRole('super_admin', 'moderateur', 'admin_operationnel'));

// ── GET /api/admin/signalements — Liste des signalements
router.get('/', async (req, res) => {
  try {
    const { statut, type_cible, page = 1, limit: qLimit = 30 } = req.query;
    const limit = Math.min(100, Math.max(1, parseInt(qLimit) || 30));
    const offset = (Math.max(1, parseInt(page) || 1) - 1) * limit;

    const conds = [];
    const vals = [];
    let i = 1;

    if (statut) { conds.push(`s.statut = $${i}`); vals.push(statut); i++; }
    if (type_cible) { conds.push(`s.type_cible = $${i}`); vals.push(type_cible); i++; }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS total FROM signalements s ${where}`,
      vals
    );

    const { rows } = await pool.query(
      `SELECT s.*,
              u.nom AS signale_par_nom, u.email AS signale_par_email,
              adm.nom AS traite_par_nom
       FROM signalements s
       LEFT JOIN utilisateurs u ON u.id = s.signale_par
       LEFT JOIN admin_utilisateurs adm ON adm.id = s.traite_par
       ${where}
       ORDER BY 
         CASE s.statut WHEN 'en_attente' THEN 1 ELSE 2 END,
         s.created_at DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      [...vals, limit, offset]
    );

    res.json({
      signalements: rows,
      total: countRes.rows[0]?.total || 0,
      page: parseInt(page) || 1,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/admin/signalements/:id/traiter — Statuer sur un signalement
router.put('/:id/traiter', async (req, res) => {
  try {
    const { decision, statut } = req.body;
    if (!['traite', 'rejete'].includes(statut)) {
      return res.status(400).json({ error: 'Statut de traitement invalide (traite ou rejete)' });
    }

    const { rows } = await pool.query(
      `UPDATE signalements
       SET statut = $1,
           decision = $2,
           traite_par = $3,
           traite_le = NOW(),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [statut, decision || '', req.adminUser?.id || null, req.params.id]
    );

    if (!rows[0]) return res.status(404).json({ error: 'Signalement introuvable' });

    await enregistrerAdminLog({
      action: 'signalement_traite',
      cibleType: 'signalement',
      cibleId: req.params.id,
      description: `Traitement du signalement ${req.params.id} (${rows[0].type_cible}) : statut ${statut}`,
      req,
    });

    res.json({ success: true, signalement: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
