// backend/routes/boutiques-modules/boutiques-articles.js
const router = require('express').Router();
const { pool } = require('../../models/db');
const { verifierToken } = require('../../middlewares/auth');
const { checkBoutiqueAccess } = require('./helpers');

function slugify(text) {
  return (text || '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ── GET /api/boutiques/:id/articles (Public ou Marchand)
router.get('/:id/articles', async (req, res) => {
  try {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id);
    const bqRes = await pool.query(
      `SELECT id, nom, slug, logo FROM boutiques WHERE ${isUUID ? 'id = $1' : 'slug = $1'}`,
      [req.params.id]
    );
    if (!bqRes.rows[0]) return res.status(404).json({ error: 'Boutique introuvable' });
    const boutique = bqRes.rows[0];

    const { tag, search, limit = 20, offset = 0, tous } = req.query;
    let query = `SELECT * FROM boutique_articles WHERE boutique_id = $1`;
    const params = [boutique.id];

    if (tous !== 'true') {
      query += ` AND est_publie = TRUE`;
    }

    if (tag) {
      params.push(tag);
      query += ` AND $${params.length} = ANY(tags)`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (titre ILIKE $${params.length} OR extrait ILIKE $${params.length})`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const r = await pool.query(query, params);
    const countRes = await pool.query(
      `SELECT COUNT(*) FROM boutique_articles WHERE boutique_id = $1 ${tous !== 'true' ? 'AND est_publie = TRUE' : ''}`,
      [boutique.id]
    );

    res.json({
      success: true,
      boutique,
      articles: r.rows,
      total: parseInt(countRes.rows[0]?.count || '0', 10)
    });
  } catch (err) {
    console.error('[GET ARTICLES ERR]', err);
    res.status(500).json({ error: 'Erreur lors du chargement des articles' });
  }
});

// ── GET /api/boutiques/:id/articles/detail/:slug (Public)
router.get('/:id/articles/detail/:slug', async (req, res) => {
  try {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id);
    const bqRes = await pool.query(
      `SELECT id, nom, slug, logo, description FROM boutiques WHERE ${isUUID ? 'id = $1' : 'slug = $1'}`,
      [req.params.id]
    );
    if (!bqRes.rows[0]) return res.status(404).json({ error: 'Boutique introuvable' });
    const boutique = bqRes.rows[0];

    const r = await pool.query(
      `SELECT * FROM boutique_articles WHERE boutique_id = $1 AND slug = $2`,
      [boutique.id, req.params.slug]
    );

    if (!r.rows[0]) return res.status(404).json({ error: 'Article introuvable' });

    // Incrémenter discrètement les vues
    pool.query(`UPDATE boutique_articles SET vues_count = vues_count + 1 WHERE id = $1`, [r.rows[0].id]).catch(() => {});

    res.json({
      success: true,
      boutique,
      article: r.rows[0]
    });
  } catch (err) {
    console.error('[GET ARTICLE DETAIL ERR]', err);
    res.status(500).json({ error: 'Erreur lors du chargement de l\'article' });
  }
});

// ── POST /api/boutiques/:id/articles (Marchand Authentifié)
router.post('/:id/articles', verifierToken, async (req, res) => {
  try {
    const bq = await checkBoutiqueAccess(req.params.id, req.user.userId);
    if (!bq) return res.status(403).json({ error: 'Accès refusé' });

    const { titre, contenu, extrait, image_url, est_publie = true, tags = [] } = req.body;
    if (!titre || !contenu) {
      return res.status(400).json({ error: 'Le titre et le contenu sont obligatoires' });
    }

    let baseSlug = slugify(titre) || 'article';
    let finalSlug = baseSlug;
    let counter = 1;

    // Vérifier l'unicité du slug pour la boutique
    while (true) {
      const exist = await pool.query(
        `SELECT id FROM boutique_articles WHERE boutique_id = $1 AND slug = $2`,
        [bq.id, finalSlug]
      );
      if (!exist.rows[0]) break;
      finalSlug = `${baseSlug}-${counter++}`;
    }

    const autoExtrait = extrait || contenu.replace(/<[^>]*>?/gm, '').slice(0, 160) + '...';

    const insertRes = await pool.query(
      `INSERT INTO boutique_articles (boutique_id, titre, slug, contenu, extrait, image_url, est_publie, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [bq.id, titre.trim(), finalSlug, contenu, autoExtrait, image_url || null, !!est_publie, Array.isArray(tags) ? tags : []]
    );

    res.status(201).json({
      success: true,
      article: insertRes.rows[0]
    });
  } catch (err) {
    console.error('[POST ARTICLE ERR]', err);
    res.status(500).json({ error: 'Erreur lors de la création de l\'article' });
  }
});

// ── PUT /api/boutiques/:id/articles/:artId (Marchand Authentifié)
router.put('/:id/articles/:artId', verifierToken, async (req, res) => {
  try {
    const bq = await checkBoutiqueAccess(req.params.id, req.user.userId);
    if (!bq) return res.status(403).json({ error: 'Accès refusé' });

    const { titre, contenu, extrait, image_url, est_publie, tags } = req.body;

    const r = await pool.query(
      `UPDATE boutique_articles
       SET titre = COALESCE($1, titre),
           contenu = COALESCE($2, contenu),
           extrait = COALESCE($3, extrait),
           image_url = COALESCE($4, image_url),
           est_publie = COALESCE($5, est_publie),
           tags = COALESCE($6, tags),
           updated_at = NOW()
       WHERE id = $7 AND boutique_id = $8
       RETURNING *`,
      [
        titre?.trim(),
        contenu,
        extrait,
        image_url,
        est_publie !== undefined ? !!est_publie : null,
        Array.isArray(tags) ? tags : null,
        req.params.artId,
        bq.id
      ]
    );

    if (!r.rows[0]) return res.status(404).json({ error: 'Article introuvable' });

    res.json({
      success: true,
      article: r.rows[0]
    });
  } catch (err) {
    console.error('[PUT ARTICLE ERR]', err);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'article' });
  }
});

// ── DELETE /api/boutiques/:id/articles/:artId (Marchand Authentifié)
router.delete('/:id/articles/:artId', verifierToken, async (req, res) => {
  try {
    const bq = await checkBoutiqueAccess(req.params.id, req.user.userId);
    if (!bq) return res.status(403).json({ error: 'Accès refusé' });

    const r = await pool.query(
      `DELETE FROM boutique_articles WHERE id = $1 AND boutique_id = $2 RETURNING id`,
      [req.params.artId, bq.id]
    );

    if (!r.rows[0]) return res.status(404).json({ error: 'Article introuvable' });

    res.json({ success: true, message: 'Article supprimé avec succès' });
  } catch (err) {
    console.error('[DELETE ARTICLE ERR]', err);
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'article' });
  }
});

module.exports = router;
