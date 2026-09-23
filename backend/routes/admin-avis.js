// backend/routes/admin-avis.js
// Centre de modération des avis et commentaires sur les boutiques marchandes

const router = require('express').Router();
const { pool } = require('../models/db');
const { requireAdminAuth, requireAdminRole } = require('../middlewares/admin-rbac');
const { enregistrerAdminLog } = require('../lib/adminAuditLogger');

router.use(requireAdminAuth);
router.use(requireAdminRole('super_admin', 'moderateur', 'admin_operationnel'));

// ── GET /api/admin/avis — Liste des avis paginée avec filtres
router.get('/', async (req, res) => {
  try {
    const { boutique_id, note, q, page = 1, limit: qLimit = 30 } = req.query;
    const limit = Math.min(100, Math.max(1, parseInt(qLimit) || 30));
    const offset = (Math.max(1, parseInt(page) || 1) - 1) * limit;

    const conds = [];
    const vals = [];
    let i = 1;

    if (boutique_id) { conds.push(`ba.boutique_id = $${i}`); vals.push(boutique_id); i++; }
    if (note) { conds.push(`ba.note = $${i}`); vals.push(parseInt(note)); i++; }
    if (q && q.trim()) {
      conds.push(`(ba.commentaire ILIKE $${i} OR ba.nom_client ILIKE $${i} OR ba.client_nom ILIKE $${i} OR b.nom ILIKE $${i})`);
      vals.push(`%${q.trim()}%`);
      i++;
    }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM boutique_avis ba
       JOIN boutiques b ON b.id = ba.boutique_id
       ${where}`,
      vals
    );

    const { rows } = await pool.query(
      `SELECT ba.id, ba.note, ba.commentaire, 
              COALESCE(ba.nom_client, ba.client_nom, 'Client') AS nom_client,
              ba.commande_ref, ba.verifie, ba.created_at,
              b.id AS boutique_id, b.nom AS boutique_nom, b.slug AS boutique_slug
       FROM boutique_avis ba
       JOIN boutiques b ON b.id = ba.boutique_id
       ${where}
       ORDER BY ba.created_at DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      [...vals, limit, offset]
    );

    res.json({
      avis: rows,
      total: countRes.rows[0]?.total || 0,
      page: parseInt(page) || 1,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/admin/avis/:id — Supprimer un avis litigieux / diffamatoire
router.delete('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `DELETE FROM boutique_avis WHERE id = $1 RETURNING id, boutique_id, note, commentaire, nom_client`,
      [req.params.id]
    );

    if (!rows[0]) return res.status(404).json({ error: 'Avis introuvable' });

    await enregistrerAdminLog({
      action: 'avis_supprime',
      cibleType: 'boutique_avis',
      cibleId: req.params.id,
      description: `Suppression administrative de l'avis de "${rows[0].nom_client}" (Note: ${rows[0].note}/5) : "${(rows[0].commentaire || '').slice(0, 80)}"`,
      req,
    });

    res.json({ success: true, message: 'Avis supprimé avec succès' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
