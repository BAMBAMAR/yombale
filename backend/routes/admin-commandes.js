// backend/routes/admin-commandes.js
// Gestion centralisée de toutes les commandes boutiques dans l'administration

const router = require('express').Router();
const { pool } = require('../models/db');
const { adminSecretOnly } = require('../middlewares/auth');
const { enregistrerAdminLog } = require('../lib/adminAuditLogger');

// ── GET /api/admin/commandes — Liste paginée avec filtres
router.get('/', adminSecretOnly, async (req, res) => {
  try {
    const { statut, q, page = 1 } = req.query;
    const limit = 40;
    const offset = (Math.max(1, parseInt(page)) - 1) * limit;

    const conditions = [];
    const values = [];
    let i = 1;

    if (statut && statut !== 'tous') {
      conditions.push(`c.statut = $${i++}`);
      values.push(statut);
    }

    if (q && q.trim()) {
      conditions.push(`(c.reference ILIKE $${i} OR c.nom_produit ILIKE $${i} OR c.client_nom ILIKE $${i} OR c.client_telephone ILIKE $${i} OR b.nom ILIKE $${i})`);
      values.push(`%${q.trim()}%`);
      i++;
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await pool.query(`
      SELECT COUNT(*)
      FROM commandes_boutique c
      LEFT JOIN boutiques b ON b.id = c.boutique_id
      ${whereClause}
    `, values);
    const total = parseInt(countRes.rows[0].count);

    const { rows: commandes } = await pool.query(`
      SELECT c.*,
             b.nom AS boutique_nom, b.slug AS boutique_slug, b.telephone AS boutique_tel
      FROM commandes_boutique c
      LEFT JOIN boutiques b ON b.id = c.boutique_id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT $${i} OFFSET $${i + 1}
    `, [...values, limit, offset]);

    // Stats globales
    const { rows: statsRows } = await pool.query(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE statut = 'en_attente') AS en_attente,
        COUNT(*) FILTER (WHERE statut = 'confirmee') AS confirmee,
        COUNT(*) FILTER (WHERE statut = 'expediee') AS expediee,
        COUNT(*) FILTER (WHERE statut = 'livree') AS livree,
        COUNT(*) FILTER (WHERE statut = 'annulee') AS annulee,
        COALESCE(SUM(montant_total), 0) AS volume_total
      FROM commandes_boutique
    `);

    res.json({
      commandes,
      total,
      page: parseInt(page),
      limit,
      stats: statsRows[0],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/admin/commandes/:id/statut — Mise à jour du statut d'une commande
router.put('/:id/statut', adminSecretOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;
    const valid = ['en_attente', 'confirmee', 'expediee', 'livree', 'annulee'];
    if (!valid.includes(statut)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }

    const cur = await pool.query('SELECT * FROM commandes_boutique WHERE id = $1', [id]);
    if (!cur.rows[0]) return res.status(404).json({ error: 'Commande introuvable' });

    const { rows } = await pool.query(
      'UPDATE commandes_boutique SET statut = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [statut, id]
    );

    await enregistrerAdminLog({
      action: 'commande_statut_update',
      cibleType: 'commande',
      cibleId: id,
      description: `Commande ${cur.rows[0].reference} passée de "${cur.rows[0].statut}" à "${statut}"`,
      ancienneValeur: { statut: cur.rows[0].statut },
      nouvelleValeur: { statut },
      req,
    });

    res.json({ success: true, commande: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
