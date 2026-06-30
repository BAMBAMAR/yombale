// backend/routes/boutiques.js — Boutiques utilisateurs
const router = require('express').Router();
const { body, param, validationResult } = require('express-validator');
const { pool } = require('../models/db');
const { verifierToken, adminSecretOnly } = require('../middlewares/auth');
const { checkAbonnement, requireAbonnement } = require('../middlewares/checkAbonnement');
const { limiterPublication } = require('../middlewares/rateLimit');
const { uploadBuffer } = require('../services/cloudinary');
const multer = require('multer');
const { syncProduit, deleteProduit } = require('../services/whatsapp-catalog');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 2 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    cb(null, false); // ignorer silencieusement les fichiers non-image (inputs vides, octet-stream…)
  },
});

const CATS = ['smartphones','informatique','tv-electro','mode','maison','auto-moto','jeux','services','alimentation','beaute','autre'];
const MAX_BOUTIQUES = 3;
const QUOTA_PRODUITS = { pro: 50, business: Infinity };

// ── Slug helpers ──────────────────────────────────────────────────────────────
function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // enlever accents
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

async function uniqueSlug(base, excludeId = null) {
  let slug = base;
  let n = 2;
  while (true) {
    const cond = excludeId
      ? 'SELECT id FROM boutiques WHERE slug=$1 AND id!=$2'
      : 'SELECT id FROM boutiques WHERE slug=$1';
    const params = excludeId ? [slug, excludeId] : [slug];
    const r = await pool.query(cond, params);
    if (!r.rows[0]) return slug;
    slug = `${base}-${n++}`;
  }
}

// ── GET /api/boutiques/admin/toutes — toutes les boutiques (admin)
router.get('/admin/toutes', adminSecretOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT b.id, b.nom, b.description, b.categorie, b.telephone, b.adresse, b.ville,
              b.logo_url, b.actif, b.sponsorise, b.sponsor_jusqu_au, b.created_at,
              u.nom AS proprietaire_nom, u.email AS proprietaire_email,
              a.plan AS plan_actif, a.fin AS plan_fin
       FROM boutiques b
       LEFT JOIN utilisateurs u ON u.id = b.utilisateur_id
       LEFT JOIN LATERAL (
         SELECT plan, fin FROM abonnements
         WHERE utilisateur_id = b.utilisateur_id AND statut='actif' AND fin > NOW()
         ORDER BY fin DESC LIMIT 1
       ) a ON true
       ORDER BY
         CASE a.plan WHEN 'business' THEN 0 WHEN 'pro' THEN 1 ELSE 2 END ASC,
         b.created_at DESC
       LIMIT 200`
    );
    res.json({ boutiques: rows });
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

// ── POST /api/boutiques/admin/sync-catalog — sync initiale tous les produits → Meta Commerce
router.post('/admin/sync-catalog', adminSecretOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT bp.*, b.slug AS boutique_slug
       FROM boutique_produits bp
       JOIN boutiques b ON b.id = bp.boutique_id
       WHERE b.actif = true`
    );
    res.json({ message: `Sync lancée pour ${rows.length} produit(s)`, total: rows.length });
    // Après la réponse, on sync sans bloquer le client
    setImmediate(async () => {
      let ok = 0, ko = 0;
      for (const p of rows) {
        try { await syncProduit(p); ok++; }
        catch { ko++; }
      }
      console.log(`[CATALOG] Sync initiale terminée — ${ok} OK, ${ko} erreurs`);
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── PUT /api/boutiques/admin/:id — activer/désactiver/sponsoriser (admin)
router.put('/admin/:id', adminSecretOnly, param('id').isUUID(), async (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(400).json({ error: 'ID invalide' });
  try {
    const { actif, sponsorise, sponsor_jusqu_au, whatsapp_catalog_id } = req.body;
    // Build dynamic SET clause
    const sets = ['updated_at=NOW()'];
    const vals = [];
    if (actif !== undefined) { vals.push(Boolean(actif)); sets.push(`actif=$${vals.length}`); }
    if (sponsorise !== undefined) { vals.push(Boolean(sponsorise)); sets.push(`sponsorise=$${vals.length}`); }
    if (sponsor_jusqu_au !== undefined) { vals.push(sponsor_jusqu_au); sets.push(`sponsor_jusqu_au=$${vals.length}`); }
    if (whatsapp_catalog_id !== undefined) { vals.push(whatsapp_catalog_id || null); sets.push(`whatsapp_catalog_id=$${vals.length}`); }
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
      `SELECT id, nom, description, categorie, telephone, whatsapp, adresse, ville,
              logo_url, cover_url, site_web, facebook, instagram, slug,
              actif, sponsorise, sponsor_jusqu_au, whatsapp_catalog_id, created_at
       FROM boutiques WHERE utilisateur_id=$1 ORDER BY created_at DESC`,
      [req.user.userId]
    );
    res.json({ boutiques: rows.rows });
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

// ── GET /api/boutiques/:idOrSlug — fiche publique (UUID ou slug)
router.get('/:id', async (req, res) => {
  try {
    const param = req.params.id;
    // Cherche par UUID d'abord, puis par slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(param);
    const condition = isUUID ? 'b.id=$1' : 'b.slug=$1';

    const r = await pool.query(
      `SELECT b.id, b.nom, b.description, b.categorie, b.telephone, b.adresse, b.ville,
              b.logo_url, b.cover_url, b.whatsapp, b.site_web, b.facebook, b.instagram,
              b.horaires, b.slug, b.utilisateur_id, b.created_at,
              a.plan AS plan_actif
       FROM boutiques b
       LEFT JOIN LATERAL (
         SELECT plan FROM abonnements
         WHERE utilisateur_id = b.utilisateur_id AND statut='actif' AND fin > NOW()
         ORDER BY fin DESC LIMIT 1
       ) a ON true
       WHERE ${condition} AND b.actif=true`,
      [param]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Boutique introuvable' });

    pool.query(
      `INSERT INTO analytics_events (type, boutique_id) VALUES ('vue_boutique',$1)`,
      [r.rows[0].id]
    ).catch(() => {});

    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

// ── GET /api/boutiques/:id/produits — catalogue public (UUID ou slug)
router.get('/:id/produits', async (req, res) => {
  try {
    const param = req.params.id;
    const isUUID = /^[0-9a-f-]{36}$/i.test(param);
    const condition = isUUID ? 'p.boutique_id=$1' : 'b.slug=$1';
    const { rows } = await pool.query(
      `SELECT p.id, p.nom, p.description, p.prix, p.prix_barre, p.images, p.en_stock, p.ordre, p.categorie, p.caracteristiques, p.stock_quantite
       FROM boutique_produits p
       JOIN boutiques b ON b.id = p.boutique_id
       WHERE ${condition} AND b.actif=true
       ORDER BY p.ordre ASC, p.created_at DESC`,
      [param]
    );
    res.json({ produits: rows });
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

// ── GET /api/boutiques/:id/produits/:prodId — fiche produit publique (UUID ou slug)
router.get('/:id/produits/:prodId', param('prodId').isUUID(), async (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(400).json({ error: 'ID invalide' });
  try {
    const idParam = req.params.id;
    const isUUID = /^[0-9a-f-]{36}$/i.test(idParam);
    const boutiqueCondition = isUUID ? 'b.id=$2' : 'b.slug=$2';
    const { rows } = await pool.query(
      `SELECT p.id, p.nom, p.description, p.prix, p.prix_barre, p.images, p.en_stock,
              p.categorie, p.caracteristiques, p.ordre, p.created_at,
              b.nom AS boutique_nom, b.telephone AS boutique_telephone,
              b.whatsapp AS boutique_whatsapp, b.ville AS boutique_ville,
              b.logo_url AS boutique_logo, b.actif AS boutique_actif
       FROM boutique_produits p
       JOIN boutiques b ON b.id = p.boutique_id
       WHERE p.id=$1 AND ${boutiqueCondition} AND b.actif=true`,
      [req.params.prodId, idParam]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Produit introuvable' });
    res.json({ produit: rows[0] });
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

// ── POST /api/boutiques/:id/produits — ajouter produit (Pro/Business)
router.post('/:id/produits', verifierToken, param('id').isUUID(), checkAbonnement, requireAbonnement, upload.single('image'), async (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(400).json({ error: 'ID invalide' });
  try {
    const { id } = req.params;
    // Vérifier la propriété
    const own = await pool.query('SELECT id FROM boutiques WHERE id=$1 AND utilisateur_id=$2', [id, req.user.userId]);
    if (!own.rows[0]) return res.status(403).json({ error: 'Accès refusé' });

    // Quota
    const plan = req.abonnement.plan;
    const quota = QUOTA_PRODUITS[plan] ?? 50;
    if (quota !== Infinity) {
      const cnt = await pool.query('SELECT COUNT(*) FROM boutique_produits WHERE boutique_id=$1', [id]);
      if (parseInt(cnt.rows[0].count) >= quota) {
        return res.status(400).json({ error: `Quota atteint (${quota} produits max pour le plan ${plan})` });
      }
    }

    const { nom, description, prix, prix_barre, en_stock, categorie, caracteristiques } = req.body;
    if (!nom?.trim()) return res.status(400).json({ error: 'Nom requis' });

    let images = [];
    if (req.file) {
      try { images = [await uploadBuffer(req.file.buffer, 'boutique_produits')]; } catch {}
    }

    let caracJson = {};
    if (caracteristiques) {
      try { caracJson = typeof caracteristiques === 'string' ? JSON.parse(caracteristiques) : caracteristiques; } catch {}
    }

    const r = await pool.query(
      `INSERT INTO boutique_produits (boutique_id, nom, description, prix, prix_barre, images, en_stock, categorie, caracteristiques)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [id, nom.trim(), description||null, prix||null, prix_barre||null,
       images, en_stock !== 'false', categorie||null, caracJson]
    );
    res.status(201).json({ success: true, produit: r.rows[0] });
    // Sync catalogue Meta — hors du try/catch pour éviter double-réponse
    const produitCree = r.rows[0];
    setImmediate(async () => {
      try {
        const b = await pool.query('SELECT slug, whatsapp_catalog_id FROM boutiques WHERE id=$1', [id]);
        await syncProduit({ ...produitCree, boutique_slug: b.rows[0]?.slug, whatsapp_catalog_id: b.rows[0]?.whatsapp_catalog_id });
      } catch {}
    });
  } catch (err) {
    console.error('[BOUTIQUES PRODUIT POST]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── PUT /api/boutiques/:id/produits/:prodId — modifier produit
router.put('/:id/produits/:prodId', verifierToken, param('id').isUUID(), param('prodId').isUUID(), upload.single('image'), async (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(400).json({ error: 'ID invalide' });
  try {
    const { id, prodId } = req.params;
    const own = await pool.query('SELECT id FROM boutiques WHERE id=$1 AND utilisateur_id=$2', [id, req.user.userId]);
    if (!own.rows[0]) return res.status(403).json({ error: 'Accès refusé' });

    const existing = await pool.query('SELECT * FROM boutique_produits WHERE id=$1 AND boutique_id=$2', [prodId, id]);
    if (!existing.rows[0]) return res.status(404).json({ error: 'Produit introuvable' });

    const { nom, description, prix, prix_barre, en_stock, categorie, caracteristiques } = req.body;
    let images = existing.rows[0].images;
    if (req.file) {
      try { images = [await uploadBuffer(req.file.buffer, 'boutique_produits')]; } catch {}
    }

    let caracJson = existing.rows[0].caracteristiques ?? {};
    if (caracteristiques) {
      try { caracJson = typeof caracteristiques === 'string' ? JSON.parse(caracteristiques) : caracteristiques; } catch {}
    }

    const r = await pool.query(
      `UPDATE boutique_produits SET nom=$1, description=$2, prix=$3, prix_barre=$4,
       images=$5, en_stock=$6, categorie=$7, caracteristiques=$8, updated_at=NOW()
       WHERE id=$9 AND boutique_id=$10 RETURNING *`,
      [nom||existing.rows[0].nom, description||null, prix||null, prix_barre||null,
       images, en_stock !== 'false', categorie||existing.rows[0].categorie||null,
       caracJson, prodId, id]
    );
    res.json({ success: true, produit: r.rows[0] });
    const produitMaj = r.rows[0];
    setImmediate(async () => {
      try {
        const b = await pool.query('SELECT slug, whatsapp_catalog_id FROM boutiques WHERE id=$1', [id]);
        await syncProduit({ ...produitMaj, boutique_slug: b.rows[0]?.slug, whatsapp_catalog_id: b.rows[0]?.whatsapp_catalog_id });
      } catch {}
    });
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

// ── DELETE /api/boutiques/:id/produits/:prodId — supprimer produit
router.delete('/:id/produits/:prodId', verifierToken, param('id').isUUID(), param('prodId').isUUID(), async (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(400).json({ error: 'ID invalide' });
  try {
    const { id, prodId } = req.params;
    const own = await pool.query('SELECT id FROM boutiques WHERE id=$1 AND utilisateur_id=$2', [id, req.user.userId]);
    if (!own.rows[0]) return res.status(403).json({ error: 'Accès refusé' });

    const r = await pool.query('DELETE FROM boutique_produits WHERE id=$1 AND boutique_id=$2 RETURNING id', [prodId, id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'Produit introuvable' });
    pool.query('SELECT whatsapp_catalog_id FROM boutiques WHERE id=$1', [id])
      .then(b => deleteProduit(prodId, b.rows[0]?.whatsapp_catalog_id))
      .catch(() => {});
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

// ── POST /api/boutiques — créer boutique (auth)
router.post('/', limiterPublication, verifierToken, upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), [
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

    const { nom, description, categorie, telephone, adresse, ville, whatsapp, site_web, facebook, instagram, slug: slugInput } = req.body;

    let logo_url = null;
    if (req.files?.logo?.[0]) {
      try { logo_url = await uploadBuffer(req.files.logo[0].buffer, 'boutiques'); } catch {}
    }
    let cover_url = null;
    if (req.files?.cover?.[0]) {
      try { cover_url = await uploadBuffer(req.files.cover[0].buffer, 'boutiques_cover'); } catch {}
    }

    // Générer le slug
    const slugBase = slugInput?.trim() ? slugify(slugInput.trim()) : slugify(nom.trim());
    const slug = await uniqueSlug(slugBase);

    // INSERT avec colonnes de base (toujours présentes)
    const r = await pool.query(
      `INSERT INTO boutiques (utilisateur_id, nom, description, categorie, telephone, adresse, ville, logo_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
      [userId, nom.trim(), description||null, categorie||null, telephone||null,
       adresse||null, ville||'Dakar', logo_url]
    );
    const newId = r.rows[0].id;

    // UPDATE des colonnes avancées (ajoutées par migration — best-effort)
    try {
      await pool.query(
        `UPDATE boutiques SET cover_url=$1, whatsapp=$2, site_web=$3, facebook=$4, instagram=$5, slug=$6
         WHERE id=$7`,
        [cover_url||null, whatsapp||null, site_web||null, facebook||null, instagram||null, slug, newId]
      );
    } catch (_) { /* colonnes pas encore migrées — ignoré */ }

    res.status(201).json({ success: true, id: newId });
  } catch (err) {
    console.error('[BOUTIQUES POST]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── PUT /api/boutiques/:id — modifier la sienne
function multerBoutiqueFields(req, res, next) {
  upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'cover', maxCount: 1 }])(req, res, (err) => {
    if (err) {
      console.error('[BOUTIQUES PUT MULTER]', err.code, err.message);
      return res.status(400).json({ error: err.message || 'Erreur upload' });
    }
    next();
  });
}

router.put('/:id', verifierToken, param('id').isUUID(), multerBoutiqueFields, async (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(400).json({ error: 'ID invalide' });
  console.log('[BOUTIQUES PUT] body keys:', Object.keys(req.body || {}), '| files:', Object.keys(req.files || {}));
  try {
    const existing = await pool.query(
      'SELECT * FROM boutiques WHERE id=$1 AND utilisateur_id=$2',
      [req.params.id, req.user.userId]
    );
    if (!existing.rows[0]) return res.status(404).json({ error: 'Boutique introuvable' });

    const { nom, description, categorie, telephone, adresse, ville, whatsapp, site_web, facebook, instagram, horaires, slug: slugInput } = req.body;

    let logo_url = existing.rows[0].logo_url;
    if (req.files?.logo?.[0]) {
      try { logo_url = await uploadBuffer(req.files.logo[0].buffer, 'boutiques'); } catch {}
    }
    let cover_url = existing.rows[0].cover_url;
    if (req.files?.cover?.[0]) {
      try { cover_url = await uploadBuffer(req.files.cover[0].buffer, 'boutiques_cover'); } catch {}
    }

    let horairesJson = existing.rows[0].horaires;
    if (horaires) {
      try { horairesJson = typeof horaires === 'string' ? JSON.parse(horaires) : horaires; } catch {}
    }

    // UPDATE colonnes de base (toujours présentes)
    await pool.query(
      `UPDATE boutiques SET nom=$1, description=$2, categorie=$3, telephone=$4, adresse=$5,
       ville=$6, logo_url=$7, updated_at=NOW()
       WHERE id=$8 AND utilisateur_id=$9`,
      [nom||existing.rows[0].nom, description||null, categorie||null,
       telephone||null, adresse||null, ville||'Dakar', logo_url,
       req.params.id, req.user.userId]
    );
    // Slug : garder l'existant si aucun input, sinon re-générer
    let newSlug = existing.rows[0].slug;
    if (slugInput?.trim()) {
      const slugBase = slugify(slugInput.trim());
      newSlug = await uniqueSlug(slugBase, req.params.id);
    }

    // UPDATE colonnes avancées (best-effort après migration)
    try {
      await pool.query(
        `UPDATE boutiques SET cover_url=$1, whatsapp=$2, site_web=$3, facebook=$4,
         instagram=$5, horaires=$6, slug=$7 WHERE id=$8`,
        [cover_url||null, whatsapp||null, site_web||null, facebook||null,
         instagram||null, horairesJson, newSlug, req.params.id]
      );
    } catch (_) { /* colonnes pas encore migrées — ignoré */ }
    res.json({ success: true, slug: newSlug });
  } catch (err) {
    console.error('[BOUTIQUES PUT]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
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
