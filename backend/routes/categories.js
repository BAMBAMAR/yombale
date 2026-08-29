// backend/routes/categories.js
// CRUD complet et administration des catégories de la plateforme Nopalou

const router = require('express').Router();
const { pool } = require('../models/db');
const { adminSecretOnly } = require('../middlewares/auth');

// Helper slugify
function slugify(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ── GET /api/categories — Liste publique des catégories actives
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.id, c.nom, c.slug, c.icone, c.description, c.ordre, c.parent_id,
             (SELECT COUNT(*)::int FROM produits WHERE categorie_id = c.id) AS nb_produits,
             (SELECT COUNT(*)::int FROM annonces_classifiees WHERE categorie_slug = c.slug AND actif = TRUE AND supprimee = FALSE) AS nb_annonces
      FROM categories c
      WHERE COALESCE(c.actif, TRUE) = TRUE
      ORDER BY COALESCE(c.ordre, 0) ASC, c.nom ASC
    `);
    res.json({ categories: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/categories/admin/toutes — Liste complète pour la console d'administration
router.get('/admin/toutes', adminSecretOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.id, c.nom, c.slug, c.icone, c.description, c.ordre, c.actif, c.parent_id, c.created_at,
             (SELECT COUNT(*)::int FROM produits WHERE categorie_id = c.id) AS nb_produits,
             (SELECT COUNT(*)::int FROM annonces_classifiees WHERE categorie_slug = c.slug) AS nb_annonces
      FROM categories c
      ORDER BY COALESCE(c.ordre, 0) ASC, c.created_at ASC
    `);
    res.json({ categories: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/categories/admin — Création d'une catégorie (admin)
router.post('/admin', adminSecretOnly, async (req, res) => {
  try {
    const { nom, slug: customSlug, icone, description, actif = true, ordre = 0, parent_id } = req.body;
    if (!nom || !nom.trim()) {
      return res.status(400).json({ error: 'Le nom de la catégorie est obligatoire' });
    }

    const finalSlug = customSlug && customSlug.trim() ? slugify(customSlug) : slugify(nom);
    const finalIcone = icone ? icone.trim() : '📦';
    const finalParentId = parent_id || null;

    const { rows } = await pool.query(
      `INSERT INTO categories (nom, slug, icone, description, actif, ordre, parent_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [nom.trim(), finalSlug, finalIcone, description ? description.trim() : null, Boolean(actif), parseInt(ordre) || 0, finalParentId]
    );

    res.json({ success: true, categorie: rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Une catégorie avec cet identifiant (slug) existe déjà.' });
    }
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/categories/admin/reordonner — Réordonner les catégories (admin)
router.put('/admin/reordonner', adminSecretOnly, async (req, res) => {
  try {
    const { items } = req.body; // array of { id, ordre }
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Format invalide (liste d\'éléments requise)' });
    }

    for (const item of items) {
      if (item.id && item.ordre !== undefined) {
        await pool.query('UPDATE categories SET ordre = $1 WHERE id = $2', [parseInt(item.ordre) || 0, item.id]);
      }
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/categories/admin/:id — Mise à jour d'une catégorie (admin)
router.put('/admin/:id', adminSecretOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, slug: customSlug, icone, description, actif, ordre, parent_id } = req.body;

    const current = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
    if (!current.rows[0]) {
      return res.status(404).json({ error: 'Catégorie introuvable' });
    }

    const cur = current.rows[0];
    const newNom = nom !== undefined ? nom.trim() : cur.nom;
    const newSlug = customSlug !== undefined ? slugify(customSlug) : cur.slug;
    const newIcone = icone !== undefined ? icone.trim() : cur.icone;
    const newDesc = description !== undefined ? description : cur.description;
    const newActif = actif !== undefined ? Boolean(actif) : cur.actif;
    const newOrdre = ordre !== undefined ? parseInt(ordre) : cur.ordre;
    const newParent = parent_id !== undefined ? (parent_id || null) : cur.parent_id;

    const { rows } = await pool.query(
      `UPDATE categories
       SET nom = $1, slug = $2, icone = $3, description = $4, actif = $5, ordre = $6, parent_id = $7
       WHERE id = $8
       RETURNING *`,
      [newNom, newSlug, newIcone, newDesc, newActif, newOrdre, newParent, id]
    );

    res.json({ success: true, categorie: rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Ce slug de catégorie est déjà utilisé par une autre catégorie.' });
    }
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/categories/admin/:id — Suppression d'une catégorie (admin)
router.delete('/admin/:id', adminSecretOnly, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier si des produits ou annonces y sont rattachés
    const check = await pool.query(`
      SELECT 
        (SELECT COUNT(*)::int FROM produits WHERE categorie_id = $1) AS nb_produits,
        (SELECT COUNT(*)::int FROM annonces_classifiees WHERE categorie_slug = (SELECT slug FROM categories WHERE id = $1)) AS nb_annonces
    `, [id]);

    const nbP = check.rows[0]?.nb_produits || 0;
    const nbA = check.rows[0]?.nb_annonces || 0;

    if (nbP > 0 || nbA > 0) {
      // Désactiver plutôt que supprimer pour ne pas casser l'intégrité
      await pool.query('UPDATE categories SET actif = FALSE WHERE id = $1', [id]);
      return res.json({
        success: true,
        desactivee: true,
        message: `La catégorie a été désactivée (et masquée) car ${nbP} produit(s) et ${nbA} annonce(s) y sont rattachés.`,
      });
    }

    await pool.query('DELETE FROM categories WHERE id = $1', [id]);
    res.json({ success: true, deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
