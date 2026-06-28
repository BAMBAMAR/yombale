// backend/routes/boutiques.js — Boutiques utilisateurs
const router = require('express').Router();
const { body, param, validationResult } = require('express-validator');
const { pool } = require('../models/db');
const { verifierToken, adminSecretOnly } = require('../middlewares/auth');
const { limiterPublication } = require('../middlewares/rateLimit');
const { uploadBuffer } = require('../services/cloudinary');
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    cb(new Error('Seules les images sont acceptées'));
  },
});

const CATS = ['smartphones','informatique','tv-electro','mode','maison','auto-moto','jeux','services','alimentation','beaute','autre'];
const MAX_BOUTIQUES = 3;

// ── GET /api/boutiques/admin/toutes — toutes les boutiques (admin)
router.get('/admin/toutes', adminSecretOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT b.id, b.nom, b.description, b.categorie, b.telephone, b.adresse, b.ville,
              b.logo_url, b.actif, b.created_at,
              u.nom AS proprietaire_nom, u.email AS proprietaire_email
       FROM boutiques b
       LEFT JOIN utilisateurs u ON u.id = b.utilisateur_id
       ORDER BY b.created_at DESC LIMIT 200`
    );
    res.json({ boutiques: rows });
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

// ── PUT /api/boutiques/admin/:id — activer/désactiver/sponsoriser (admin)
router.put('/admin/:id', adminSecretOnly, param('id').isUUID(), async (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(400).json({ error: 'ID invalide' });
  try {
    const { actif, sponsorise, sponsor_jusqu_au } = req.body;
    // Build dynamic SET clause
    const sets = ['updated_at=NOW()'];
    const vals = [];
    if (actif !== undefined) { vals.push(Boolean(actif)); sets.push(`actif=$${vals.length}`); }
    if (sponsorise !== undefined) { vals.push(Boolean(sponsorise)); sets.push(`sponsorise=$${vals.length}`); }
    if (sponsor_jusqu_au !== undefined) { vals.push(sponsor_jusqu_au); sets.push(`sponsor_jusqu_au=$${vals.length}`); }
    vals.push(req.params.id);
    const { rows } = await pool.query(
      `UPDATE boutiques SET ${sets.join(', ')} WHERE id=$${vals.length} RETURNING id`,
      vals
    );
    if (!rows.length) return res.status(404).json({ error: 'Boutique introuvable' });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

// ── GET /api/boutiques — liste publique paginée
router.get('/', async (req, res) => {
  try {
    const { ville, q, limit = 20, page = 1 } = req.query;
    const offset = (Math.max(1, parseInt(page)) - 1) * Math.min(50, parseInt(limit));
    const lim = Math.min(50, parseInt(limit));
    const conds = ['actif=true'];
    const vals = [];

    if (ville) { vals.push(ville); conds.push(`ville ILIKE $${vals.length}`); }
    if (q) { vals.push(`%${q}%`); conds.push(`(nom ILIKE $${vals.length} OR description ILIKE $${vals.length})`); }

    const where = 'WHERE ' + conds.join(' AND ');
    const [rows, cnt] = await Promise.all([
      pool.query(
        `SELECT b.id, b.nom, b.description, b.categorie, b.telephone, b.adresse, b.ville,
                b.logo_url, b.sponsorise, b.sponsor_jusqu_au, b.created_at,
                a.plan AS plan_actif
         FROM boutiques b
         LEFT JOIN LATERAL (
           SELECT plan FROM abonnements
           WHERE utilisateur_id = b.utilisateur_id AND statut='actif' AND fin > NOW()
           ORDER BY fin DESC LIMIT 1
         ) a ON true
         ${where}
         ORDER BY
           CASE a.plan WHEN 'business' THEN 0 WHEN 'pro' THEN 1 ELSE 2 END ASC,
           (b.sponsorise = true AND (b.sponsor_jusqu_au IS NULL OR b.sponsor_jusqu_au > NOW())) DESC,
           b.created_at DESC
         LIMIT $${vals.length+1} OFFSET $${vals.length+2}`,
        [...vals, lim, offset]
      ),
      pool.query(`SELECT COUNT(*) FROM boutiques ${where}`, vals),
    ]);
    res.json({ boutiques: rows.rows, total: parseInt(cnt.rows[0].count), page: parseInt(page) });
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

// ── GET /api/boutiques/mine — mes boutiques (auth) — DOIT être avant /:id
router.get('/mine', verifierToken, async (req, res) => {
  try {
    const rows = await pool.query(
      `SELECT id, nom, description, categorie, telephone, adresse, ville, logo_url, actif, created_at
       FROM boutiques WHERE utilisateur_id=$1 ORDER BY created_at DESC`,
      [req.user.userId]
    );
    res.json({ boutiques: rows.rows });
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

// ── GET /api/boutiques/:id — fiche publique d'une boutique (APRÈS /mine)
router.get('/:id', param('id').isUUID(), async (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(400).json({ error: 'ID invalide' });
  try {
    const r = await pool.query(
      `SELECT b.id, b.nom, b.description, b.categorie, b.telephone, b.adresse, b.ville,
              b.logo_url, b.utilisateur_id, b.created_at,
              a.plan AS plan_actif
       FROM boutiques b
       LEFT JOIN LATERAL (
         SELECT plan FROM abonnements
         WHERE utilisateur_id = b.utilisateur_id AND statut='actif' AND fin > NOW()
         ORDER BY fin DESC LIMIT 1
       ) a ON true
       WHERE b.id=$1 AND b.actif=true`,
      [req.params.id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Boutique introuvable' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

// ── POST /api/boutiques — créer boutique (auth)
router.post('/', limiterPublication, verifierToken, upload.single('logo'), [
  body('nom').trim().notEmpty().withMessage('Nom de boutique requis').isLength({ max: 200 }),
  body('telephone').optional({ checkFalsy: true }).isString(),
  body('ville').optional({ checkFalsy: true }).isString(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const userId = req.user.userId;

    // Quota
    const cnt = await pool.query('SELECT COUNT(*) FROM boutiques WHERE utilisateur_id=$1', [userId]);
    if (parseInt(cnt.rows[0].count) >= MAX_BOUTIQUES) {
      return res.status(400).json({ error: `Limite de ${MAX_BOUTIQUES} boutiques par compte atteinte.` });
    }

    const { nom, description, categorie, telephone, adresse, ville } = req.body;

    let logo_url = null;
    if (req.file) {
      try { logo_url = await uploadBuffer(req.file.buffer, 'boutiques'); } catch {}
    }

    const r = await pool.query(
      `INSERT INTO boutiques (utilisateur_id, nom, description, categorie, telephone, adresse, ville, logo_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
      [userId, nom.trim(), description||null, categorie||null, telephone||null,
       adresse||null, ville||'Dakar', logo_url]
    );
    res.status(201).json({ success: true, id: r.rows[0].id });
  } catch (err) {
    console.error('[BOUTIQUES POST]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── PUT /api/boutiques/:id — modifier la sienne
router.put('/:id', verifierToken, param('id').isUUID(), upload.single('logo'), async (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(400).json({ error: 'ID invalide' });
  try {
    const existing = await pool.query(
      'SELECT * FROM boutiques WHERE id=$1 AND utilisateur_id=$2',
      [req.params.id, req.user.userId]
    );
    if (!existing.rows[0]) return res.status(404).json({ error: 'Boutique introuvable' });

    const { nom, description, categorie, telephone, adresse, ville } = req.body;
    let logo_url = existing.rows[0].logo_url;
    if (req.file) {
      try { logo_url = await uploadBuffer(req.file.buffer, 'boutiques'); } catch {}
    }

    await pool.query(
      `UPDATE boutiques SET nom=$1, description=$2, categorie=$3, telephone=$4, adresse=$5,
       ville=$6, logo_url=$7, updated_at=NOW() WHERE id=$8 AND utilisateur_id=$9`,
      [nom||existing.rows[0].nom, description||null, categorie||null,
       telephone||null, adresse||null, ville||'Dakar', logo_url,
       req.params.id, req.user.userId]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

// ── DELETE /api/boutiques/:id — supprimer la sienne
router.delete('/:id', verifierToken, param('id').isUUID(), async (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(400).json({ error: 'ID invalide' });
  try {
    const r = await pool.query(
      'DELETE FROM boutiques WHERE id=$1 AND utilisateur_id=$2 RETURNING id',
      [req.params.id, req.user.userId]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Boutique introuvable' });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

module.exports = router;
