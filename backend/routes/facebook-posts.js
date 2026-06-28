// backend/routes/facebook-posts.js — Gestion des publications Facebook + Instagram
const express = require('express');
const router  = express.Router();
const { pool } = require('../models/db');
const { adminSecretOnly } = require('../middlewares/auth');
const https = require('https');
const qs    = require('querystring');

router.use(adminSecretOnly);

// GET /api/facebook-posts
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM facebook_posts ORDER BY created_at DESC LIMIT 100`);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/facebook-posts — créer un brouillon
router.post('/', async (req, res) => {
  const { message, lien, image_url, publier_instagram, date_publication } = req.body;
  if (!message) return res.status(400).json({ error: 'message requis' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO facebook_posts (message, lien, image_url, publier_instagram, date_publication)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [message, lien || null, image_url || null, !!publier_instagram, date_publication || null]
    );
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/facebook-posts/:id — modifier
router.patch('/:id', async (req, res) => {
  const { message, lien, image_url, publier_instagram, date_publication, statut } = req.body;
  const allowed = ['brouillon', 'approuve'];
  if (statut && !allowed.includes(statut)) return res.status(400).json({ error: 'statut invalide' });
  try {
    const { rows } = await pool.query(
      `UPDATE facebook_posts
       SET message           = COALESCE($1, message),
           lien              = COALESCE($2, lien),
           image_url         = COALESCE($3, image_url),
           publier_instagram  = CASE WHEN $4::boolean IS NOT NULL THEN $4::boolean ELSE publier_instagram END,
           date_publication  = COALESCE($5, date_publication),
           statut            = COALESCE($6, statut),
           updated_at        = NOW()
       WHERE id = $7 AND statut NOT IN ('publie')
       RETURNING *`,
      [message || null, lien || null, image_url || null,
       publier_instagram !== undefined ? publier_instagram : null,
       date_publication || null, statut || null, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Post introuvable ou déjà publié' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/facebook-posts/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query(`DELETE FROM facebook_posts WHERE id = $1 AND statut != 'publie'`, [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/facebook-posts/:id/publier — publication immédiate
router.post('/:id/publier', async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(`SELECT * FROM facebook_posts WHERE id = $1`, [id]);
    if (!rows.length) return res.status(404).json({ error: 'Post introuvable' });
    const post = rows[0];
    if (post.statut === 'publie') return res.status(400).json({ error: 'Déjà publié' });

    const results = await publierPost(post);

    await pool.query(
      `UPDATE facebook_posts
       SET statut='publie', post_fb_id=$1, post_ig_id=$2, date_publie=NOW(),
           erreur=$3, updated_at=NOW()
       WHERE id=$4`,
      [results.fb_id || null, results.ig_id || null, results.erreur || null, id]
    );

    if (results.erreur && !results.fb_id) return res.status(502).json({ error: results.erreur });
    res.json({ ok: true, fb_id: results.fb_id, ig_id: results.ig_id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Fonctions de publication ──────────────────────────────────────────────────

async function publierPost(post) {
  const results = { fb_id: null, ig_id: null, erreur: null };

  // Publication Facebook
  const fbRes = await publierFacebook(post);
  if (fbRes.id) {
    results.fb_id = fbRes.id;
  } else {
    results.erreur = `FB: ${fbRes.error?.message || 'Erreur inconnue'}`;
  }

  // Publication Instagram (si demandé et FB réussi)
  if (post.publier_instagram && process.env.IG_USER_ID) {
    const igRes = await publierInstagram(post);
    if (igRes.id) {
      results.ig_id = igRes.id;
    } else {
      const igErr = `IG: ${igRes.error?.message || 'Erreur inconnue'}`;
      results.erreur = results.erreur ? `${results.erreur} | ${igErr}` : igErr;
    }
  }

  return results;
}

function publierFacebook(post) {
  return new Promise((resolve) => {
    const pageId = process.env.FB_PAGE_ID;
    const token  = process.env.FB_PAGE_ACCESS_TOKEN;
    if (!pageId || !token) return resolve({ error: { message: 'FB_PAGE_ID / FB_PAGE_ACCESS_TOKEN non configurés' } });

    // Post avec photo → /photos, sinon → /feed
    const endpoint = post.image_url ? 'photos' : 'feed';
    const params = { access_token: token };
    if (post.image_url) {
      params.url     = post.image_url;
      params.caption = post.message;
    } else {
      params.message = post.message;
      if (post.lien) params.link = post.lien;
    }

    const body = Buffer.from(qs.stringify(params), 'utf8');
    const opts = {
      hostname: 'graph.facebook.com',
      path: `/v19.0/${pageId}/${endpoint}`,
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

async function publierInstagram(post) {
  const igId = process.env.IG_USER_ID;
  const token = process.env.FB_PAGE_ACCESS_TOKEN;
  if (!igId || !token) return { error: { message: 'IG_USER_ID non configuré' } };
  if (!post.image_url) return { error: { message: 'Une image est requise pour Instagram' } };

  // Étape 1 : créer le container média
  const container = await igApiCall('POST', `/${igId}/media`, {
    image_url: post.image_url,
    caption: post.message,
    access_token: token,
  });
  if (!container.id) return container;

  // Étape 2 : publier le container
  return igApiCall('POST', `/${igId}/media_publish`, {
    creation_id: container.id,
    access_token: token,
  });
}

function igApiCall(method, path, params) {
  return new Promise((resolve) => {
    const body = Buffer.from(qs.stringify(params), 'utf8');
    const opts = {
      hostname: 'graph.facebook.com',
      path: `/v19.0${path}`,
      method,
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
module.exports.publierPost = publierPost;
