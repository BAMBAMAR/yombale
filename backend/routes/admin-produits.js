// backend/routes/admin-produits.js
// Centre de modération et supervision globale du catalogue marchands et des stocks

const router = require('express').Router();
const { pool } = require('../models/db');
const { requireAdminAuth } = require('../middlewares/admin-rbac');
const { enregistrerAdminLog } = require('../lib/adminAuditLogger');

router.use(requireAdminAuth);

// ── GET /api/admin/produits — Liste paginée avec recherche et filtres multi-critères
router.get('/', async (req, res) => {
  try {
    const { q, boutique_id, categorie, en_stock, page = 1, limit = 30 } = req.query;
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

    const conditions = [];
    const values = [];
    let i = 1;

    if (q && q.trim()) {
      conditions.push(`(p.nom ILIKE $${i} OR p.description ILIKE $${i} OR b.nom ILIKE $${i})`);
      values.push(`%${q.trim()}%`);
      i++;
    }
    if (boutique_id) {
      conditions.push(`p.boutique_id = $${i++}`);
      values.push(boutique_id);
    }
    if (categorie && categorie !== 'tous') {
      conditions.push(`p.categorie = $${i++}`);
      values.push(categorie);
    }
    if (en_stock === 'true') {
      conditions.push(`p.en_stock = TRUE`);
    } else if (en_stock === 'false') {
      conditions.push(`(p.en_stock = FALSE OR p.stock_quantite <= 0)`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM boutique_produits p JOIN boutiques b ON b.id = p.boutique_id ${whereClause}`,
      values
    );
    const total = parseInt(countRes.rows[0]?.count || 0, 10);

    const { rows: produits } = await pool.query(
      `SELECT p.id, p.nom, p.description, p.prix, p.prix_barre, p.prix_achat,
              p.images, p.en_stock, p.stock_quantite, p.categorie, p.has_variants, p.created_at,
              b.id AS boutique_id, b.nom AS boutique_nom, b.slug AS boutique_slug,
              (SELECT COUNT(*)::int FROM boutique_produit_variantes WHERE produit_id = p.id) AS nb_variantes
       FROM boutique_produits p
       JOIN boutiques b ON b.id = p.boutique_id
       ${whereClause}
       ORDER BY p.created_at DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      [...values, parseInt(limit, 10), offset]
    );

    // Statistiques rapides catalogue marchands
    const { rows: statsRows } = await pool.query(`
      SELECT
        COUNT(*) AS total_produits,
        COUNT(*) FILTER (WHERE en_stock = TRUE) AS en_stock,
        COUNT(*) FILTER (WHERE en_stock = FALSE OR stock_quantite <= 0) AS en_rupture,
        COUNT(*) FILTER (WHERE has_variants = TRUE) AS avec_variantes
      FROM boutique_produits
    `);

    res.json({
      success: true,
      produits,
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      stats: statsRows[0],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/admin/produits/:id — Fiche détaillée produit marchand
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const prodRes = await pool.query(
      `SELECT p.*, b.nom AS boutique_nom, b.slug AS boutique_slug, b.telephone AS boutique_tel,
              u.nom AS proprietaire_nom, u.email AS proprietaire_email
       FROM boutique_produits p
       JOIN boutiques b ON b.id = p.boutique_id
       LEFT JOIN utilisateurs u ON u.id = b.utilisateur_id
       WHERE p.id = $1`,
      [id]
    );
    if (!prodRes.rows[0]) return res.status(404).json({ error: 'Produit introuvable' });

    const [variantesRes, stocksEntrepotsRes, avisRes] = await Promise.all([
      pool.query('SELECT * FROM boutique_produit_variantes WHERE produit_id = $1 ORDER BY ordre ASC', [id]),
      pool.query(`
        SELECT se.*, e.nom AS entrepot_nom
        FROM boutique_produit_stocks_entrepots se
        JOIN boutique_entrepots e ON e.id = se.entrepot_id
        WHERE se.produit_id = $1
      `, [id]),
      pool.query('SELECT * FROM boutique_avis WHERE produit_id = $1 ORDER BY created_at DESC LIMIT 10', [id]),
    ]);

    res.json({
      success: true,
      produit: prodRes.rows[0],
      variantes: variantesRes.rows,
      stocksEntrepots: stocksEntrepotsRes.rows,
      avis: avisRes.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/admin/produits/:id/moderation — Action de modération admin
router.put('/:id/moderation', async (req, res) => {
  try {
    const { id } = req.params;
    const { en_stock, stock_quantite, prix, nom } = req.body;

    const cur = await pool.query('SELECT * FROM boutique_produits WHERE id = $1', [id]);
    if (!cur.rows[0]) return res.status(404).json({ error: 'Produit introuvable' });

    const updates = [];
    const values = [];
    let i = 1;

    if (en_stock !== undefined) { updates.push(`en_stock = $${i++}`); values.push(Boolean(en_stock)); }
    if (stock_quantite !== undefined) { updates.push(`stock_quantite = $${i++}`); values.push(parseInt(stock_quantite, 10)); }
    if (prix !== undefined) { updates.push(`prix = $${i++}`); values.push(Number(prix)); }
    if (nom) { updates.push(`nom = $${i++}`); values.push(nom.trim()); }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const { rows } = await pool.query(
      `UPDATE boutique_produits SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    );

    await enregistrerAdminLog({
      action: 'produit_marchand_modere',
      cibleType: 'boutique_produit',
      cibleId: id,
      description: `Modération administrative du produit "${rows[0].nom}"`,
      ancienneValeur: { en_stock: cur.rows[0].en_stock, stock: cur.rows[0].stock_quantite, prix: cur.rows[0].prix },
      nouvelleValeur: { en_stock: rows[0].en_stock, stock: rows[0].stock_quantite, prix: rows[0].prix },
      req,
    });

    res.json({ success: true, produit: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
