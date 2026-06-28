// backend/routes/facebook-posts.js — Gestion des publications Facebook (brouillons)
const express = require('express');
const router  = express.Router();
const { pool } = require('../models/db');
const { adminSecretOnly } = require('../middlewares/auth');
const https = require('https');

// Toutes les routes nécessitent le secret admin
router.use(adminSecretOnly);

// GET /api/facebook-posts — liste tous les posts
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM facebook_posts ORDER BY created_at DESC LIMIT 100`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/facebook-posts — créer un brouillon
router.post('/', async (req, res) => {
  const { message, lien, date_publication } = req.body;
  if (!message) return res.status(400).json({ error: 'message requis' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO facebook_posts (message, lien, date_publication)
       VALUES ($1, $2, $3) RETURNING *`,
      [message, lien || null, date_publication || null]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/facebook-posts/:id — modifier ou changer le statut
router.patch('/:id', async (req, res) => {
  const { message, lien, date_publication, statut } = req.body;
  const { id } = req.params;

  const allowed = ['brouillon', 'approuve'];
  if (statut && !allowed.includes(statut)) {
    return res.status(400).json({ error: 'statut invalide' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE facebook_posts
       SET message          = COALESCE($1, message),
           lien             = COALESCE($2, lien),
           date_publication = COALESCE($3, date_publication),
           statut           = COALESCE($4, statut),
           updated_at       = NOW()
       WHERE id = $5 AND statut NOT IN ('publie')
       RETURNING *`,
      [message || null, lien || null, date_publication || null, statut || null, id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Post introuvable ou déjà publié' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/facebook-posts/:id — supprimer un brouillon
router.delete('/:id', async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM facebook_posts WHERE id = $1 AND statut != 'publie'`,
      [req.params.id]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/facebook-posts/:id/publier — publier immédiatement
router.post('/:id/publier', async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT * FROM facebook_posts WHERE id = $1`, [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Post introuvable' });
    const post = rows[0];
    if (post.statut === 'publie') return res.status(400).json({ error: 'Déjà publié' });

    const result = await publierSurFacebook(post.message);
    if (result.error) {
      await pool.query(
        `UPDATE facebook_posts SET statut='erreur', erreur=$1, updated_at=NOW() WHERE id=$2`,
        [result.error.message, id]
      );
      return res.status(502).json({ error: result.error.message });
    }

    await pool.query(
      `UPDATE facebook_posts SET statut='publie', post_fb_id=$1, date_publie=NOW(), updated_at=NOW() WHERE id=$2`,
      [result.id, id]
    );
    res.json({ ok: true, post_fb_id: result.id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

function publierSurFacebook(message) {
  return new Promise((resolve) => {
    const qs = require('querystring');
    const pageId = process.env.FB_PAGE_ID;
    const token  = process.env.FB_PAGE_ACCESS_TOKEN;
    if (!pageId || !token) return resolve({ error: { message: 'FB_PAGE_ID / FB_PAGE_ACCESS_TOKEN non configurés' } });

    const body = Buffer.from(qs.stringify({ message, access_token: token }), 'utf8');
    const opts = {
      hostname: 'graph.facebook.com',
      path: `/v19.0/${pageId}/feed`,
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': body.length },
    };
    const req = https.request(opts, (r) => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => resolve(JSON.parse(d)));
    });
    req.on('error', e => resolve({ error: { message: e.message } }));
    req.write(body);
    req.end();
  });
}

module.exports = router;
module.exports.publierSurFacebook = publierSurFacebook;
