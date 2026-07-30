// backend/routes/boutiques.js — Boutiques utilisateurs
const router = require('express').Router();
const { body, param, validationResult } = require('express-validator');
const { pool } = require('../models/db');
const { verifierToken, tokenOptional, adminSecretOnly, requireEmailVerifie } = require('../middlewares/auth');
const { checkAbonnement, requireAbonnement } = require('../middlewares/checkAbonnement');
const { limiterPublication } = require('../middlewares/rateLimit');
const { uploadBuffer } = require('../services/cloudinary');
const multer = require('multer');
const { syncProduit, deleteProduit } = require('../services/whatsapp-catalog');
const cfg = require('../lib/settingsCache');

async function checkBoutiqueAccess(boutiqueIdOrSlug, userId) {
  const isUUID = /^[0-9a-f-]{36}$/i.test(boutiqueIdOrSlug);
  const { rows } = await pool.query(
    `SELECT b.* 
     FROM boutiques b
     LEFT JOIN boutique_utilisateurs bu ON b.id = bu.boutique_id
     WHERE ${isUUID ? 'b.id = $1' : 'b.slug = $1'} AND (b.utilisateur_id = $2 OR bu.utilisateur_id = $2)`,
    [boutiqueIdOrSlug, userId]
  );
  return rows[0];
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 2 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    cb(null, false); // ignorer silencieusement les fichiers non-image (inputs vides, octet-stream…)
  },
});

const uploadProduitPhotos = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    cb(null, false);
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


// ── GET /api/boutiques/catalogues-standards — Modèles de produits prédéfinis
router.get('/catalogues-standards', async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const rawData = fs.readFileSync(path.join(__dirname, '../data/catalogues-standards.json'));
    const catalogues = JSON.parse(rawData);
    res.json({ success: true, catalogues });
  } catch (err) {
    console.error('Erreur lecture catalogue:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

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
    const { ville, q, tri, limit = 20, page = 1 } = req.query;
    const offset = (Math.max(1, parseInt(page)) - 1) * Math.min(50, parseInt(limit));
    const lim = Math.min(50, parseInt(limit));
    const conds = ['actif=true'];
    const vals = [];

    if (ville) { vals.push(ville); conds.push(`ville ILIKE $${vals.length}`); }
    if (q) { vals.push(`%${q}%`); conds.push(`(nom ILIKE $${vals.length} OR description ILIKE $${vals.length})`); }

    const orderBy = tri === 'recent'  ? 'b.created_at DESC'
                  : tri === 'nom_asc' ? 'b.nom ASC'
                  : `CASE a.plan WHEN 'business' THEN 0 WHEN 'pro' THEN 1 ELSE 2 END ASC,
                     (b.sponsorise = true AND (b.sponsor_jusqu_au IS NULL OR b.sponsor_jusqu_au > NOW())) DESC,
                     b.created_at DESC`;

    const where = 'WHERE ' + conds.join(' AND ');
    const [rows, cnt, villesRes, catsRes] = await Promise.all([
      pool.query(
        `SELECT b.id, b.slug, b.nom, b.description, b.categorie, b.telephone, b.whatsapp, b.adresse, b.ville,
                b.logo_url, b.cover_url, b.horaires, b.sponsorise, b.sponsor_jusqu_au, b.created_at,
                a.plan AS plan_actif,
                COALESCE(ROUND(av.note_avg::numeric, 1), 5.0) AS note_moyenne,
                COALESCE(av.total_cnt, 0) AS total_avis
         FROM boutiques b
         LEFT JOIN LATERAL (
           SELECT plan FROM abonnements
           WHERE utilisateur_id = b.utilisateur_id AND statut='actif' AND fin > NOW()
           ORDER BY fin DESC LIMIT 1
         ) a ON true
         LEFT JOIN LATERAL (
           SELECT AVG(note) as note_avg, COUNT(*) as total_cnt FROM boutique_avis WHERE boutique_id = b.id
         ) av ON true
         ${where}
         ORDER BY ${orderBy}
         LIMIT $${vals.length+1} OFFSET $${vals.length+2}`,
        [...vals, lim, offset]
      ),
      pool.query(`SELECT COUNT(*) FROM boutiques ${where}`, vals),
      pool.query(`SELECT DISTINCT ville FROM boutiques WHERE actif=true AND ville IS NOT NULL AND ville != '' ORDER BY ville ASC`),
      pool.query(`SELECT DISTINCT categorie FROM boutiques WHERE actif=true AND categorie IS NOT NULL AND categorie != '' ORDER BY categorie ASC`),
    ]);

    const villes = villesRes.rows.map(r => r.ville).filter(Boolean);
    const categories = catsRes.rows.map(r => r.categorie).filter(Boolean);

    res.json({
      boutiques: rows.rows,
      total: parseInt(cnt.rows[0].count),
      page: parseInt(page),
      villes,
      categories,
    });
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

// ── GET /api/boutiques/mine — mes boutiques (auth) — DOIT être avant /:id
router.get('/mine', verifierToken, async (req, res) => {
  try {
    const rows = await pool.query(
      `SELECT b.id, b.nom, b.description, b.categorie, b.telephone, b.whatsapp, b.adresse, b.ville,
              b.logo_url, b.cover_url, b.site_web, b.facebook, b.instagram, b.slug,
              b.actif, b.sponsorise, b.sponsor_jusqu_au, b.whatsapp_catalog_id, b.created_at,
              (b.utilisateur_id = $1) AS is_owner
       FROM boutiques b
       LEFT JOIN boutique_utilisateurs bu ON b.id = bu.boutique_id
       WHERE b.utilisateur_id = $1 OR bu.utilisateur_id = $1
       GROUP BY b.id, is_owner
       ORDER BY b.created_at DESC`,
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

// ── Gestion des Administrateurs Web ───────────────────────────────────────────
router.get('/:id/admins', verifierToken, param('id').isUUID(), async (req, res) => {
  const errs = validationResult(req);
  if (!errs.isEmpty()) return res.status(400).json({ errors: errs.array() });
  try {
    const bq = await checkBoutiqueAccess(req.params.id, req.user.userId);
    if (!bq) return res.status(403).json({ error: 'Accès refusé' });
    
    // Renvoyer le propriétaire et les admins
    const { rows } = await pool.query(
      `SELECT u.id, u.nom, u.email, 'propriétaire' as role, b.created_at
       FROM boutiques b JOIN utilisateurs u ON b.utilisateur_id = u.id
       WHERE b.id = $1
       UNION
       SELECT u.id, u.nom, u.email, bu.role, bu.created_at
       FROM boutique_utilisateurs bu JOIN utilisateurs u ON bu.utilisateur_id = u.id
       WHERE bu.boutique_id = $1
       ORDER BY created_at ASC`,
      [bq.id]
    );
    res.json({ admins: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/:id/admins', verifierToken, param('id').isUUID(), body('email').isEmail(), async (req, res) => {
  const errs = validationResult(req);
  if (!errs.isEmpty()) return res.status(400).json({ errors: errs.array() });
  try {
    // Seul le propriétaire ou un admin peut ajouter
    const bq = await checkBoutiqueAccess(req.params.id, req.user.userId);
    if (!bq) return res.status(403).json({ error: 'Accès refusé' });

    const { email } = req.body;
    const userRes = await pool.query('SELECT id FROM utilisateurs WHERE email = $1', [email]);
    if (!userRes.rows.length) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    const targetUserId = userRes.rows[0].id;
    
    if (bq.utilisateur_id === targetUserId) return res.status(400).json({ error: 'Déjà propriétaire' });

    await pool.query(
      'INSERT INTO boutique_utilisateurs (boutique_id, utilisateur_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.params.id, targetUserId]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/:id/admins/:userId', verifierToken, param('id').isUUID(), param('userId').isUUID(), async (req, res) => {
  const errs = validationResult(req);
  if (!errs.isEmpty()) return res.status(400).json({ errors: errs.array() });
  try {
    const bq = await checkBoutiqueAccess(req.params.id, req.user.userId);
    if (!bq) return res.status(403).json({ error: 'Accès refusé' });

    // On ne peut pas supprimer le propriétaire (utilisateur_id de la boutique)
    if (bq.utilisateur_id === req.params.userId) return res.status(400).json({ error: 'Impossible de supprimer le propriétaire' });

    await pool.query(
      'DELETE FROM boutique_utilisateurs WHERE boutique_id = $1 AND utilisateur_id = $2',
      [req.params.id, req.params.userId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── GET /api/boutiques/:id/avis — Avis & notes certifiés de la boutique
router.get('/:id/avis', async (req, res) => {
  try {
    const param = req.params.id;
    const isUUID = /^[0-9a-f-]{36}$/i.test(param);
    const condition = isUUID ? 'a.boutique_id=$1' : 'b.slug=$1';
    
    const { rows } = await pool.query(
      `SELECT a.id, a.nom_client, a.note, a.commentaire, a.verifie, a.created_at, p.nom as produit_nom
       FROM boutique_avis a
       JOIN boutiques b ON b.id = a.boutique_id
       LEFT JOIN boutique_produits p ON p.id = a.produit_id
       WHERE ${condition}
       ORDER BY a.created_at DESC`,
      [param]
    );

    const stats = await pool.query(
      `SELECT COALESCE(AVG(a.note), 5.0) as note_moyenne, COUNT(a.id) as total_avis
       FROM boutique_avis a
       JOIN boutiques b ON b.id = a.boutique_id
       WHERE ${condition}`,
      [param]
    );

    res.json({
      success: true,
      note_moyenne: parseFloat(stats.rows[0]?.note_moyenne || 5.0).toFixed(1),
      total_avis: parseInt(stats.rows[0]?.total_avis || 0),
      avis: rows,
    });
  } catch (err) {
    console.error('[BOUTIQUE AVIS GET]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── POST /api/boutiques/:id/avis — Soumettre un avis client
router.post('/:id/avis', async (req, res) => {
  try {
    const { id } = req.params;
    const { nom_client, note, commentaire, produit_id } = req.body;
    if (!nom_client?.trim() || !note || note < 1 || note > 5) {
      return res.status(400).json({ error: 'Nom et note entre 1 et 5 requis' });
    }

    const isUUID = /^[0-9a-f-]{36}$/i.test(id);
    const bqCond = isUUID ? 'id=$1' : 'slug=$1';
    const b = await pool.query(`SELECT id FROM boutiques WHERE ${bqCond}`, [id]);
    if (!b.rows[0]) return res.status(404).json({ error: 'Boutique introuvable' });

    const r = await pool.query(
      `INSERT INTO boutique_avis (boutique_id, produit_id, nom_client, note, commentaire, verifie)
       VALUES ($1, $2, $3, $4, $5, true) RETURNING *`,
      [b.rows[0].id, produit_id || null, nom_client.trim(), Math.min(5, Math.max(1, Number(note))), commentaire || null]
    );

    res.status(201).json({ success: true, avis: r.rows[0] });
  } catch (err) {
    console.error('[BOUTIQUE AVIS POST]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── GET /api/boutiques/:id/produits/:prodId/recommandations — Recommandations "Souvent achetés ensemble"
router.get('/:id/produits/:prodId/recommandations', async (req, res) => {
  try {
    const { id, prodId } = req.params;
    const isUUID = /^[0-9a-f-]{36}$/i.test(id);
    const bqCondition = isUUID ? 'b.id=$1' : 'b.slug=$1';

    const isProdUUID = /^[0-9a-f-]{36}$/i.test(prodId);
    let cat = '';
    if (isProdUUID) {
      const target = await pool.query('SELECT categorie FROM boutique_produits WHERE id=$1', [prodId]);
      cat = target.rows[0]?.categorie || '';
    }

    const params = isProdUUID ? [id, prodId, cat] : [id, cat];
    const condProd = isProdUUID ? 'AND p.id != $2' : '';
    const catParam = isProdUUID ? '$3' : '$2';

    const { rows } = await pool.query(
      `SELECT p.id, p.nom, p.prix, p.prix_barre, p.images, p.categorie
       FROM boutique_produits p
       JOIN boutiques b ON b.id = p.boutique_id
       WHERE ${bqCondition} ${condProd} AND p.en_stock = true
       ORDER BY (p.categorie = ${catParam}) DESC, p.created_at DESC LIMIT 3`,
      params
    );

    res.json({ success: true, recommandations: rows });
  } catch (err) {
    console.error('[CROSS-SELLING ERR]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── POST /api/boutiques/:id/paniers-abandonnes — Enregistrer un panier non finalisé
router.post('/:id/paniers-abandonnes', async (req, res) => {
  try {
    const { id } = req.params;
    const { client_nom, client_tel, articles, total } = req.body;
    if (!client_tel?.trim() || !Array.isArray(articles) || articles.length === 0) {
      return res.status(400).json({ error: 'Numéro de téléphone et articles requis' });
    }

    const isUUID = /^[0-9a-f-]{36}$/i.test(id);
    const bqCond = isUUID ? 'id=$1' : 'slug=$1';
    const b = await pool.query(`SELECT id FROM boutiques WHERE ${bqCond}`, [id]);
    if (!b.rows[0]) return res.status(404).json({ error: 'Boutique introuvable' });

    const r = await pool.query(
      `INSERT INTO paniers_abandonnes (boutique_id, client_nom, client_tel, articles, total)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [b.rows[0].id, client_nom || null, client_tel.trim(), JSON.stringify(articles), Number(total || 0)]
    );

    res.status(201).json({ success: true, panier: r.rows[0] });
  } catch (err) {
    console.error('[PANIERS ABANDONNES POST]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── GET /api/boutiques/:id/paniers-abandonnes — Liste pour le marchand
router.get('/:id/paniers-abandonnes', verifierToken, async (req, res) => {
  try {
    const { id } = req.params;
    const own = await pool.query('SELECT id FROM boutiques WHERE id=$1 AND utilisateur_id=$2', [id, req.user.userId]);
    if (!own.rows[0]) return res.status(403).json({ error: 'Accès refusé' });

    const { rows } = await pool.query(
      `SELECT * FROM paniers_abandonnes WHERE boutique_id=$1 ORDER BY created_at DESC LIMIT 50`,
      [id]
    );

    res.json({ success: true, paniers: rows });
  } catch (err) {
    console.error('[PANIERS ABANDONNES GET]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── POST /api/boutiques/:id/paniers-abandonnes/:cartId/relancer — Relancer par WhatsApp
router.post('/:id/paniers-abandonnes/:cartId/relancer', verifierToken, async (req, res) => {
  try {
    const { id, cartId } = req.params;
    const own = await pool.query('SELECT b.nom, b.whatsapp FROM boutiques b WHERE b.id=$1 AND b.utilisateur_id=$2', [id, req.user.userId]);
    if (!own.rows[0]) return res.status(403).json({ error: 'Accès refusé' });

    const cartRes = await pool.query('SELECT * FROM paniers_abandonnes WHERE id=$1 AND boutique_id=$2', [cartId, id]);
    if (!cartRes.rows[0]) return res.status(404).json({ error: 'Panier introuvable' });

    const cart = cartRes.rows[0];
    await pool.query('UPDATE paniers_abandonnes SET relance_envoyee=true WHERE id=$1', [cartId]);

    const nomBoutique = own.rows[0].nom;
    const itemsText = (cart.articles || []).map((i) => `• ${i.quantite}x ${i.nom}`).join('\n');
    const messageRelance = `Bonjour ${cart.client_nom ? cart.client_nom : ''} ! Nous avons remarqué que vous avez laissé des articles dans votre panier chez ${nomBoutique} :\n\n${itemsText}\n\nProfitez de -5% de réduction si vous finalisez votre commande aujourd'hui ! Lien direct : https://nopalou.com/boutiques/${id}`;

    const digits = cart.client_tel.replace(/\D/g, '');
    const cleanTel = digits.length === 9 ? '221' + digits : digits;
    const lienWhatsappRelance = `https://wa.me/${cleanTel}?text=${encodeURIComponent(messageRelance)}`;

    res.json({ success: true, lienWhatsapp: lienWhatsappRelance, message: messageRelance });
  } catch (err) {
    console.error('[PANIERS ABANDONNES RELANCER]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── GET /api/boutiques/:id/credits-clients — Liste des clients avec carnet de dettes/avances
router.get('/:id/credits-clients', async (req, res) => {
  try {
    const { id } = req.params;
    const isUUID = /^[0-9a-f-]{36}$/i.test(id);
    const bqCond = isUUID ? 'id=$1' : 'slug=$1';
    const b = await pool.query(`SELECT id FROM boutiques WHERE ${bqCond}`, [id]);
    if (!b.rows[0]) return res.status(404).json({ error: 'Boutique introuvable' });

    const { rows } = await pool.query(
      `SELECT * FROM caisse_clients_credits WHERE boutique_id=$1 ORDER BY nom ASC`,
      [b.rows[0].id]
    );

    res.json({ success: true, clients: rows });
  } catch (err) {
    console.error('[CREDITS CLIENTS GET]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── GET /api/boutiques/:id/credits-clients/:clientId/historique — Historique détaillé d'un client
router.get('/:id/credits-clients/:clientId/historique', async (req, res) => {
  try {
    const { id, clientId } = req.params;
    const isUUID = /^[0-9a-f-]{36}$/i.test(id);
    const bqCond = isUUID ? 'id=$1' : 'slug=$1';
    const b = await pool.query(`SELECT id FROM boutiques WHERE ${bqCond}`, [id]);
    if (!b.rows[0]) return res.status(404).json({ error: 'Boutique introuvable' });

    const { rows } = await pool.query(
      `SELECT * FROM caisse_credit_historique WHERE client_id=$1 AND boutique_id=$2 ORDER BY created_at DESC`,
      [clientId, b.rows[0].id]
    );

    res.json({ success: true, historique: rows });
  } catch (err) {
    console.error('[CREDITS HISTORIQUE GET]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── POST /api/boutiques/:id/credits-clients — Créer un nouveau profil client carnet
router.post('/:id/credits-clients', async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, telephone, adresse, plafond_max, note_client } = req.body;
    if (!nom?.trim() || !telephone?.trim()) {
      return res.status(400).json({ error: 'Nom et téléphone du client requis' });
    }

    const isUUID = /^[0-9a-f-]{36}$/i.test(id);
    const bqCond = isUUID ? 'id=$1' : 'slug=$1';
    const b = await pool.query(`SELECT id FROM boutiques WHERE ${bqCond}`, [id]);
    if (!b.rows[0]) return res.status(404).json({ error: 'Boutique introuvable' });

    const r = await pool.query(
      `INSERT INTO caisse_clients_credits (boutique_id, nom, telephone, adresse, plafond_max, note_client, solde)
       VALUES ($1, $2, $3, $4, $5, $6, 0) RETURNING *`,
      [b.rows[0].id, nom.trim(), telephone.trim(), adresse?.trim() || null, Number(plafond_max || 200000), note_client?.trim() || null]
    );

    res.status(201).json({ success: true, client: r.rows[0] });
  } catch (err) {
    console.error('[CREDITS CLIENTS POST]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── POST /api/boutiques/:id/credits-clients/:clientId/transaction — Vente à crédit / Remboursement / Dépôt d'avance
router.post('/:id/credits-clients/:clientId/transaction', async (req, res) => {
  try {
    const { id, clientId } = req.params;
    const { type, montant, mode_paiement, note, produits, date_echeance } = req.body; // 'vente_credit', 'remboursement', 'depot_avance'
    const numMontant = Number(montant);
    if (!type || !numMontant || numMontant <= 0) {
      return res.status(400).json({ error: 'Type de transaction et montant valide (> 0) requis' });
    }

    const isUUID = /^[0-9a-f-]{36}$/i.test(id);
    const bqCond = isUUID ? 'id=$1' : 'slug=$1';
    const bqRes = await pool.query(`SELECT id FROM boutiques WHERE ${bqCond}`, [id]);
    if (!bqRes.rows[0]) return res.status(404).json({ error: 'Boutique introuvable' });
    const bqId = bqRes.rows[0].id;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Récupérer le solde actuel
      const c = await client.query('SELECT * FROM caisse_clients_credits WHERE id=$1 AND boutique_id=$2 FOR UPDATE', [clientId, bqId]);
      if (!c.rows[0]) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Client introuvable' });
      }

      let deltaSolde = 0;
      if (type === 'vente_credit') {
        deltaSolde = numMontant; // Augmente la dette du client
      } else if (type === 'remboursement' || type === 'depot_avance') {
        deltaSolde = -numMontant; // Réduit la dette ou augmente l'avance
      }

      const nouveauSolde = Number(c.rows[0].solde) + deltaSolde;

      // Vérification du plafond pour les ventes à crédit
      if (type === 'vente_credit' && nouveauSolde > Number(c.rows[0].plafond_max)) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Plafond de crédit dépassé (${c.rows[0].plafond_max} FCFA max)` });
      }

      // Mettre à jour le solde
      await client.query('UPDATE caisse_clients_credits SET solde=$1 WHERE id=$2', [nouveauSolde, clientId]);

      // Enregistrer l'historique détaillé avec produits et date d'échéance
      const hist = await client.query(
        `INSERT INTO caisse_credit_historique (client_id, boutique_id, type, montant, mode_paiement, note, produits, date_echeance)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [clientId, bqId, type, numMontant, mode_paiement || 'especes', note || null, JSON.stringify(produits || []), date_echeance || null]
      );

      await client.query('COMMIT');
      res.json({ success: true, nouveauSolde, transaction: hist.rows[0] });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[CREDITS CLIENTS TRANSACTION]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── GET /api/boutiques/:id/produits — catalogue public ou privé marchand
router.get('/:id/produits', tokenOptional, async (req, res) => {
  try {
    const param = req.params.id;
    const isUUID = /^[0-9a-f-]{36}$/i.test(param);
    const condition = isUUID ? 'p.boutique_id=$1' : 'b.slug=$1';
    const userId = req.user?.userId || null;
    const { rows } = await pool.query(
      `SELECT p.id, p.nom, p.description, p.prix, p.prix_barre, p.images, p.en_stock, p.ordre, p.categorie, p.caracteristiques, p.stock_quantite, p.variantes,
              p.whatsapp_sync_statut, p.whatsapp_sync_erreur, p.partage_le
       FROM boutique_produits p
       JOIN boutiques b ON b.id = p.boutique_id
       LEFT JOIN boutique_utilisateurs bu ON b.id = bu.boutique_id
       WHERE ${condition} AND (b.actif=true OR b.utilisateur_id=$2 OR bu.utilisateur_id=$2)
       ORDER BY p.ordre ASC, p.created_at DESC`,
      [param, userId]
    );
    res.json({ produits: rows });
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

// ── GET /api/boutiques/:id/produits/:prodId — fiche produit publique ou privée marchand
router.get('/:id/produits/:prodId', tokenOptional, param('prodId').isUUID(), async (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(400).json({ error: 'ID invalide' });
  try {
    const idParam = req.params.id;
    const isUUID = /^[0-9a-f-]{36}$/i.test(idParam);
    const boutiqueCondition = isUUID ? 'b.id=$2' : 'b.slug=$2';
    const userId = req.user?.userId || null;
    const { rows } = await pool.query(
      `SELECT p.id, p.nom, p.description, p.prix, p.prix_barre, p.images, p.en_stock,
              p.categorie, p.caracteristiques, p.variantes, p.ordre, p.created_at,
              b.nom AS boutique_nom, b.telephone AS boutique_telephone,
              b.whatsapp AS boutique_whatsapp, b.ville AS boutique_ville,
              b.logo_url AS boutique_logo, b.actif AS boutique_actif
       FROM boutique_produits p
       JOIN boutiques b ON b.id = p.boutique_id
       LEFT JOIN boutique_utilisateurs bu ON b.id = bu.boutique_id
       WHERE p.id=$1 AND ${boutiqueCondition} AND (b.actif=true OR b.utilisateur_id=$3 OR bu.utilisateur_id=$3)`,
      [req.params.prodId, idParam, userId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Produit introuvable' });
    res.json({ produit: rows[0] });
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

// ── POST /api/boutiques/:id/produits — ajouter produit (Pro/Business)
router.post('/:id/produits', verifierToken, param('id').isUUID(), checkAbonnement, requireAbonnement, uploadProduitPhotos.array('photos', 5), async (req, res) => {
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

    const { nom, description, prix, prix_barre, en_stock, categorie, caracteristiques, variantes, code_barre } = req.body;
    if (!nom?.trim()) return res.status(400).json({ error: 'Nom requis' });

    let images = [];
    if (req.files && req.files.length) {
      for (const f of req.files) {
        try { images.push(await uploadBuffer(f.buffer, 'boutique_produits')); } catch {}
      }
    }

    let caracJson = {};
    if (caracteristiques) {
      try { caracJson = typeof caracteristiques === 'string' ? JSON.parse(caracteristiques) : caracteristiques; } catch {}
    }

    let variantesJson = [];
    if (variantes) {
      try {
        const parsed = typeof variantes === 'string' ? JSON.parse(variantes) : variantes;
        if (Array.isArray(parsed)) variantesJson = parsed;
      } catch {}
    }

    const rawCodeBarrePost = Array.isArray(code_barre) ? code_barre[0] : code_barre;
    const codeBarrePostVal = rawCodeBarrePost && typeof rawCodeBarrePost === 'string' && rawCodeBarrePost.trim() ? rawCodeBarrePost.trim() : null;

    const r = await pool.query(
      `INSERT INTO boutique_produits (boutique_id, nom, description, prix, prix_barre, images, en_stock, categorie, caracteristiques, variantes, code_barre)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [id, nom.trim(), description||null, prix||null, prix_barre||null,
       images, en_stock !== 'false', categorie||null, caracJson, JSON.stringify(variantesJson), codeBarrePostVal]
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
router.put('/:id/produits/:prodId', verifierToken, param('id').isUUID(), param('prodId').isUUID(), uploadProduitPhotos.array('photos', 5), async (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(400).json({ error: 'ID invalide' });
  try {
    const { id, prodId } = req.params;
    const own = await pool.query('SELECT id FROM boutiques WHERE id=$1 AND utilisateur_id=$2', [id, req.user.userId]);
    if (!own.rows[0]) return res.status(403).json({ error: 'Accès refusé' });

    const existing = await pool.query('SELECT * FROM boutique_produits WHERE id=$1 AND boutique_id=$2', [prodId, id]);
    if (!existing.rows[0]) return res.status(404).json({ error: 'Produit introuvable' });

    const { nom, description, prix, prix_barre, en_stock, categorie, caracteristiques, variantes, code_barre } = req.body;
    let images = existing.rows[0].images;
    if (req.files && req.files.length) {
      images = [];
      for (const f of req.files) {
        try { images.push(await uploadBuffer(f.buffer, 'boutique_produits')); } catch {}
      }
    }

    let caracJson = existing.rows[0].caracteristiques ?? {};
    if (caracteristiques) {
      try { caracJson = typeof caracteristiques === 'string' ? JSON.parse(caracteristiques) : caracteristiques; } catch {}
    }

    let variantesJson = existing.rows[0].variantes ?? [];
    if (variantes) {
      try {
        const parsed = typeof variantes === 'string' ? JSON.parse(variantes) : variantes;
        if (Array.isArray(parsed)) variantesJson = parsed;
      } catch {}
    }

    const rawCodeBarre = Array.isArray(code_barre) ? code_barre[0] : code_barre;
    const codeBarreVal = rawCodeBarre !== undefined ? (rawCodeBarre && typeof rawCodeBarre === 'string' && rawCodeBarre.trim() ? rawCodeBarre.trim() : null) : existing.rows[0].code_barre;

    const r = await pool.query(
      `UPDATE boutique_produits SET nom=$1, description=$2, prix=$3, prix_barre=$4,
       images=$5, en_stock=$6, categorie=$7, caracteristiques=$8, variantes=$9, code_barre=$10, updated_at=NOW()
       WHERE id=$11 AND boutique_id=$12 RETURNING *`,
      [nom||existing.rows[0].nom, description||null, prix||null, prix_barre||null,
       images, en_stock !== 'false', categorie||existing.rows[0].categorie||null,
       caracJson, JSON.stringify(variantesJson), codeBarreVal, prodId, id]
    );
    res.json({ success: true, produit: r.rows[0] });
    const produitMaj = r.rows[0];
    setImmediate(async () => {
      try {
        const b = await pool.query('SELECT slug, whatsapp_catalog_id FROM boutiques WHERE id=$1', [id]);
        await syncProduit({ ...produitMaj, boutique_slug: b.rows[0]?.slug, whatsapp_catalog_id: b.rows[0]?.whatsapp_catalog_id });
      } catch {}
    });
  } catch (err) {
    console.error('[BOUTIQUES PRODUIT PUT ERREUR]', err);
    res.status(500).json({ error: 'Erreur serveur lors de la modification' });
  }
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

// ── POST /api/boutiques/:id/produits/:prodId/dupliquer — dupliquer produit
router.post('/:id/produits/:prodId/dupliquer', verifierToken, param('id').isUUID(), param('prodId').isUUID(), async (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(400).json({ error: 'ID invalide' });
  try {
    const { id, prodId } = req.params;
    const { nom, prix, stock_quantite } = req.body;
    const own = await pool.query('SELECT id FROM boutiques WHERE id=$1 AND utilisateur_id=$2', [id, req.user.userId]);
    if (!own.rows[0]) return res.status(403).json({ error: 'Accès refusé' });

    const orig = await pool.query('SELECT * FROM boutique_produits WHERE id=$1 AND boutique_id=$2', [prodId, id]);
    if (!orig.rows[0]) return res.status(404).json({ error: 'Produit introuvable' });
    const p = orig.rows[0];

    const finalNom = nom ? nom.trim() : `${p.nom} (Copie)`;
    const finalPrix = prix !== undefined && prix !== '' ? Number(prix) : p.prix;
    const finalStock = stock_quantite !== undefined && stock_quantite !== '' ? Number(stock_quantite) : p.stock_quantite;

    // S'assurer de sérialiser proprement les colonnes JSON/JSONB
    const finalCarac = typeof p.caracteristiques === 'string' ? p.caracteristiques : JSON.stringify(p.caracteristiques || {});
    const finalVar = typeof p.variantes === 'string' ? p.variantes : JSON.stringify(p.variantes || []);

    const r = await pool.query(
      `INSERT INTO boutique_produits (boutique_id, nom, description, prix, prix_barre, images, en_stock, stock_quantite, categorie, caracteristiques, variantes, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
       RETURNING *`,
      [
        id,
        finalNom,
        p.description,
        finalPrix,
        p.prix_barre,
        p.images,
        p.en_stock,
        finalStock,
        p.categorie,
        finalCarac,
        finalVar
      ]
    );

    res.status(201).json({ success: true, produit: r.rows[0] });

    // Déclencher la synchronisation WhatsApp pour le produit dupliqué
    const produitDuplique = r.rows[0];
    setImmediate(async () => {
      try {
        const b = await pool.query('SELECT slug, whatsapp_catalog_id FROM boutiques WHERE id=$1', [id]);
        await syncProduit({ ...produitDuplique, boutique_slug: b.rows[0]?.slug, whatsapp_catalog_id: b.rows[0]?.whatsapp_catalog_id });
      } catch {}
    });
  } catch (err) {
    console.error('[DUPLIQUER PRODUIT ERR]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── POST /api/boutiques/:id/produits/:prodId/publier-annonce — Publier un produit en annonce classifiée
router.post('/:id/produits/:prodId/publier-annonce', verifierToken, param('id').isUUID(), param('prodId').isUUID(), async (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(400).json({ error: 'ID invalide' });
  try {
    const { id, prodId } = req.params;
    const userId = req.user.userId;

    // Vérifier permissions (proprio ou admin/caissier)
    const bReq = await pool.query(`
      SELECT b.id, b.telephone, b.utilisateur_id, u.telephone as user_tel
      FROM boutiques b
      LEFT JOIN utilisateurs u ON u.id = b.utilisateur_id
      LEFT JOIN boutique_utilisateurs bu ON bu.boutique_id = b.id AND bu.utilisateur_id = $2
      WHERE b.id = $1 AND (b.utilisateur_id = $2 OR bu.id IS NOT NULL)
    `, [id, userId]);
    if (!bReq.rows[0]) return res.status(403).json({ error: 'Accès refusé' });
    const boutique = bReq.rows[0];
    
    const annonceUserId = boutique.utilisateur_id;

    const pReq = await pool.query('SELECT nom, description, prix, images, categorie FROM boutique_produits WHERE id=$1 AND boutique_id=$2', [prodId, id]);
    if (!pReq.rows[0]) return res.status(404).json({ error: 'Produit introuvable' });
    const produit = pReq.rows[0];

    const userReq    = await pool.query('SELECT quota_annonces FROM utilisateurs WHERE id=$1', [annonceUserId]);
    const customQuota = userReq.rows[0]?.quota_annonces;
    const quotaGratuit = (customQuota !== null && customQuota !== undefined)
      ? customQuota
      : await cfg.getNum('quota_annonces_gratuit');
    const prixAnnonce  = await cfg.getNum('prix_annonce') || 1500;
    const qReq = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM annonces_immo WHERE utilisateur_id=$1 AND supprimee=FALSE) +
        (SELECT COUNT(*) FROM annonces_classifiees WHERE utilisateur_id=$1 AND supprimee=FALSE) AS total
    `, [annonceUserId]);
    const total = parseInt(qReq.rows[0].total || 0, 10);
    const estGratuit = total < quotaGratuit;

    const telContact = boutique.telephone || boutique.user_tel || '';
    const categorie = produit.categorie || 'mixte';
    
    const r = await pool.query(`
      INSERT INTO annonces_classifiees
        (utilisateur_id, categorie_slug, titre, description, prix,
         contact_tel, photos, payee, actif)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false)
      RETURNING id
    `, [
      annonceUserId, categorie, produit.nom, produit.description || '', produit.prix || 0,
      telContact, JSON.stringify(produit.images || []), estGratuit
    ]);
    const newId = r.rows[0].id;

    if (estGratuit) {
      await pool.query('UPDATE annonces_classifiees SET actif=true WHERE id=$1', [newId]);
      return res.status(201).json({
        success: true, id: newId, besoin_paiement: false,
        message: 'Annonce publiée et visible immédiatement !'
      });
    }

    res.status(201).json({
      success: true, id: newId, besoin_paiement: true, montant: prixAnnonce,
      message: `Quota gratuit atteint (${quotaGratuit} annonces). Paiement de ${prixAnnonce} FCFA requis.`
    });
  } catch (err) {
    console.error('[PUBLIER ANNONCE]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── PATCH /api/boutiques/:id/produits/:prodId/partage — marquer un produit comme partagé
router.patch('/:id/produits/:prodId/partage', verifierToken, param('id').isUUID(), param('prodId').isUUID(), async (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(400).json({ error: 'ID invalide' });
  try {
    const { id, prodId } = req.params;
    const own = await pool.query('SELECT id FROM boutiques WHERE id=$1 AND utilisateur_id=$2', [id, req.user.userId]);
    if (!own.rows[0]) return res.status(403).json({ error: 'Accès refusé' });

    const r = await pool.query(
      'UPDATE boutique_produits SET partage_le=NOW() WHERE id=$1 AND boutique_id=$2 RETURNING partage_le',
      [prodId, id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Produit introuvable' });
    res.json({ success: true, partage_le: r.rows[0].partage_le });
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

// ── POST /api/boutiques — créer boutique (auth)
router.post('/', limiterPublication, verifierToken, requireEmailVerifie, upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), [
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

    // Résoudre le code apporteur (optionnel) en apporteur_id
    let apporteurId = null;
    const codeApporteur = req.body.code_apporteur?.trim().toUpperCase();
    if (codeApporteur) {
      const apporteurRow = await pool.query(
        'SELECT id FROM utilisateurs WHERE code_apporteur=$1 AND est_apporteur=true',
        [codeApporteur]
      );
      if (apporteurRow.rows[0]) apporteurId = apporteurRow.rows[0].id;
    }

    // INSERT avec colonnes de base (toujours présentes)
    const r = await pool.query(
      `INSERT INTO boutiques (utilisateur_id, nom, description, categorie, telephone, adresse, ville, logo_url, apporteur_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [userId, nom.trim(), description||null, categorie||null, telephone||null,
       adresse||null, ville||'Dakar', logo_url, apporteurId]
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

    res.status(201).json({ success: true, id: newId, boutique: { id: newId, slug } });
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
    const boutique = await checkBoutiqueAccess(req.params.id, req.user.userId);
    if (!boutique) return res.status(404).json({ error: 'Boutique introuvable ou accès refusé' });
    const existingRows = [boutique];
    const existing = { rows: existingRows };

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
    if (!r.rows[0]) return res.status(404).json({ error: 'Boutique introuvable ou non autorisée' });
    res.json({ success: true, message: 'Boutique supprimée' });
  } catch (err) {
    console.error('[BOUTIQUE DELETE]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── GET /api/boutiques/catalogues-standards — Modèles de produits prédéfinis


// ── POST /api/boutiques/:id/produits/batch — Créer plusieurs produits en 1 seul appel (Quick Intake)
router.post('/:id/produits/batch', verifierToken, param('id').isUUID(), async (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(400).json({ error: 'ID invalide' });
  try {
    const { id } = req.params;
    const own = await pool.query('SELECT id FROM boutiques WHERE id=$1 AND utilisateur_id=$2', [id, req.user.userId]);
    if (!own.rows[0]) return res.status(403).json({ error: 'Accès refusé' });

    const { produits } = req.body;
    if (!Array.isArray(produits) || produits.length === 0) {
      return res.status(400).json({ error: 'La liste des produits à ajouter est vide' });
    }
    if (produits.length > 50) {
      return res.status(400).json({ error: 'La limite est de 50 produits par importation pour préserver la stabilité du système.' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const insere = [];
      for (const p of produits) {
        if (!p.nom?.trim() || !p.prix) continue;
        const images = p.images || (p.photo_defaut ? [p.photo_defaut] : []);
        const r = await client.query(
          `INSERT INTO boutique_produits (boutique_id, nom, description, prix, images, en_stock, stock_quantite, categorie, whatsapp_sync_statut)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'synchronise') RETURNING *`,
          [
            id,
            p.nom.trim(),
            p.description || null,
            Number(p.prix),
            images,
            p.en_stock !== false,
            p.quantite_stock ? Number(p.quantite_stock) : (p.stock_quantite ? Number(p.stock_quantite) : 1),
            p.categorie || null,
          ]
        );
        insere.push(r.rows[0]);
      }
      await client.query('COMMIT');
      res.status(201).json({ success: true, count: insere.length, produits: insere });
      
      // Sync WhatsApp en arrière-plan
      setImmediate(async () => {
        try {
          const b = await pool.query('SELECT slug, whatsapp_catalog_id FROM boutiques WHERE id=$1', [id]);
          const boutiqueData = b.rows[0];
          if (boutiqueData) {
            for (const prod of insere) {
              try {
                await syncProduit({ ...prod, boutique_slug: boutiqueData.slug, whatsapp_catalog_id: boutiqueData.whatsapp_catalog_id });
              } catch (errSync) {
                console.error('[BATCH WHATSAPP SYNC ERR]', prod.id, errSync);
              }
            }
          }
        } catch (e) {}
      });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[BOUTIQUES BATCH PRODUITS]', err);
    res.status(500).json({ error: 'Erreur lors de l’importation par lot' });
  }
});

// ── Douchette Scanner Distante (Smartphone -> PC Caisse) ───────────────────
const remoteScannerQueue = new Map();

router.post('/:id/scanner-remote', async (req, res) => {
  const { sessionId, code } = req.body;
  if (!sessionId || !code) return res.status(400).json({ error: 'sessionId et code requis' });
  
  if (!remoteScannerQueue.has(sessionId)) {
    remoteScannerQueue.set(sessionId, []);
  }
  remoteScannerQueue.get(sessionId).push(code);

  setTimeout(() => {
    remoteScannerQueue.delete(sessionId);
  }, 300000);

  res.json({ success: true, message: 'Code-barres transmis à la caisse du PC' });
});

router.get('/:id/scanner-remote', async (req, res) => {
  const { sessionId } = req.query;
  if (!sessionId) return res.status(400).json({ error: 'sessionId requis' });

  const codes = remoteScannerQueue.get(sessionId) || [];
  if (codes.length > 0) {
    remoteScannerQueue.set(sessionId, []);
  }
  res.json({ codes });
});

// ── POST /api/boutiques/:id/pos-vente — Enregistrer vente POS & déduire le stock + alimenter la Comptabilité PostgreSQL
router.post('/:id/pos-vente', tokenOptional, async (req, res) => {
  try {
    const idParam = req.params.id;
    const { items, caissier, modePaiement } = req.body;

    const isUUID = /^[0-9a-f-]{36}$/i.test(idParam);
    const bRes = await pool.query(
      `SELECT id FROM boutiques WHERE ${isUUID ? 'id=$1' : 'slug=$1'}`,
      [idParam]
    );
    if (!bRes.rows[0]) return res.status(404).json({ error: 'Boutique introuvable' });
    const boutiqueId = bRes.rows[0].id;

    if (Array.isArray(items) && items.length > 0) {
      const refVente = `POS-${Date.now().toString().slice(-6)}`;
      let totalTicket = 0;

      for (const item of items) {
        if ((item.id || item.nom) && item.quantite) {
          const qte = Number(item.quantite);

          // 1. Décrémenter le stock dans la base PostgreSQL (Tenter par ID d'abord, puis par Nom)
          let pRes = null;
          if (item.id && /^[0-9a-f-]{36}$/i.test(item.id)) {
            pRes = await pool.query(
              `UPDATE boutique_produits
               SET stock_quantite = GREATEST(0, COALESCE(stock_quantite, 10) - $1),
                   en_stock = (GREATEST(0, COALESCE(stock_quantite, 10) - $1) > 0)
               WHERE id = $2 AND boutique_id = $3
               RETURNING id, nom, prix, stock_quantite`,
              [qte, item.id, boutiqueId]
            );
          }

          if (!pRes?.rows[0] && item.nom) {
            pRes = await pool.query(
              `UPDATE boutique_produits
               SET stock_quantite = GREATEST(0, COALESCE(stock_quantite, 10) - $1),
                   en_stock = (GREATEST(0, COALESCE(stock_quantite, 10) - $1) > 0)
               WHERE LOWER(nom) = LOWER($2) AND boutique_id = $3
               RETURNING id, nom, prix, stock_quantite`,
              [qte, item.nom.trim(), boutiqueId]
            );
          }

          const nomProduit = item.nom || pRes?.rows[0]?.nom || 'Article POS';
          const prixUnitaire = Number(item.prix || pRes?.rows[0]?.prix || 0);
          const totalLigne = prixUnitaire * qte;
          totalTicket += totalLigne;
          const prodIdReal = pRes?.rows[0]?.id || (item.id && /^[0-9a-f-]{36}$/i.test(item.id) ? item.id : null);

          // 2. Insérer dans la table des ventes pour la Comptabilité & Analytics
          try {
            await pool.query(
              `INSERT INTO ventes (reference, boutique_id, produit_id, nom_produit, quantite, prix_unitaire, frais_livraison, montant_total, client_nom, methode_paiement, created_at)
               VALUES ($1, $2, $3, $4, $5, $6, 0, $7, $8, $9, NOW())`,
              [
                refVente,
                boutiqueId,
                prodIdReal,
                nomProduit,
                qte,
                prixUnitaire,
                totalLigne,
                caissier ? `Caisse POS (${caissier})` : 'Caisse POS',
                modePaiement || 'cash'
              ]
            );
          } catch (eCompta) {
            console.error('[POS VENTE COMPTA ERR]', eCompta.message);
          }

          // 3. Insérer dans le journal des commandes_boutique (pour le suivi global)
          try {
            await pool.query(
              `INSERT INTO commandes_boutique (reference, boutique_id, client_nom, statut, nom_produit, quantite, montant_total, mode_paiement, created_at)
               VALUES ($1, $2, $3, 'livree', $4, $5, $6, $7, NOW())`,
              [
                refVente,
                boutiqueId,
                caissier ? `Caisse POS (${caissier})` : 'Caisse POS',
                nomProduit,
                qte,
                totalLigne,
                modePaiement || 'cash'
              ]
            );
          } catch (eCmd) {}
        }
      }

      // Mettre à jour la session active de caisse de la boutique si elle existe
      try {
        const activeSessionRes = await pool.query(
          `SELECT id FROM boutique_pos_sessions WHERE boutique_id = $1 AND statut = 'ouverte' ORDER BY date_ouverture DESC LIMIT 1`,
          [boutiqueId]
        );
        if (activeSessionRes.rows[0]) {
          const activeSessionId = activeSessionRes.rows[0].id;
          const mode = (modePaiement || 'cash').toLowerCase();
          
          await pool.query(
            `UPDATE boutique_pos_sessions
             SET ventes_total = COALESCE(ventes_total, 0) + $1,
                 ventes_especes = COALESCE(ventes_especes, 0) + $2,
                 ventes_wave = COALESCE(ventes_wave, 0) + $3,
                 ventes_orange_money = COALESCE(ventes_orange_money, 0) + $4,
                 ventes_carte = COALESCE(ventes_carte, 0) + $5,
                 nb_ventes = COALESCE(nb_ventes, 0) + 1
             WHERE id = $6`,
            [
              totalTicket,
              mode === 'cash' || mode === 'especes' || mode === 'espece' ? totalTicket : 0,
              mode === 'wave' ? totalTicket : 0,
              mode === 'orange_money' || mode === 'orange' ? totalTicket : 0,
              mode === 'carte' ? totalTicket : 0,
              activeSessionId
            ]
          );
        }
      } catch (eSessionUpdate) {
        console.error('[POS VENTE SESSION UPDATE ERR]', eSessionUpdate.message);
      }
    }

    res.status(201).json({ success: true, message: 'Stock, Comptabilité et Commandes PostgreSQL mis à jour en direct' });
  } catch (err) {
    console.error('[BOUTIQUE POS VENTE]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── POST /api/boutiques/:id/pos-incident — Annuler ou rembourser une vente POS
router.post('/:id/pos-incident', tokenOptional, async (req, res) => {
  try {
    const idParam = req.params.id;
    const { ticketId, type, items } = req.body;

    if (!ticketId) return res.status(400).json({ error: 'ID ticket manquant' });

    const isUUID = /^[0-9a-f-]{36}$/i.test(idParam);
    const bRes = await pool.query(
      `SELECT id FROM boutiques WHERE ${isUUID ? 'id=$1' : 'slug=$1'}`,
      [idParam]
    );
    if (!bRes.rows[0]) return res.status(404).json({ error: 'Boutique introuvable' });
    const boutiqueId = bRes.rows[0].id;

    // 1. Archiver l'écriture comptable dans ventes pour réajuster le CA
    await pool.query('UPDATE ventes SET archivee = true WHERE reference = $1 AND boutique_id = $2', [ticketId, boutiqueId]);

    // 2. Marquer la commande comme annulée dans commandes_boutique
    await pool.query("UPDATE commandes_boutique SET statut = 'annulee' WHERE reference = $1 AND boutique_id = $2", [ticketId, boutiqueId]);

    // 3. Ré-incrémenter le stock physique si articles renseignés
    if (Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        const prodId = item.id || item.produit?.id;
        const prodNom = item.nom || item.produit?.nom;
        const qte = Number(item.quantite || 1);

        if (prodId && /^[0-9a-f-]{36}$/i.test(prodId)) {
          await pool.query(
            `UPDATE boutique_produits
             SET stock_quantite = COALESCE(stock_quantite, 0) + $1,
                 en_stock = true
             WHERE id = $2 AND boutique_id = $3`,
            [qte, prodId, boutiqueId]
          );
        } else if (prodNom) {
          await pool.query(
            `UPDATE boutique_produits
             SET stock_quantite = COALESCE(stock_quantite, 0) + $1,
                 en_stock = true
             WHERE LOWER(nom) = LOWER($2) AND boutique_id = $3`,
            [qte, prodNom.trim(), boutiqueId]
          );
        }
      }
    }

    res.json({ success: true, message: `Incident POS (${type || 'annulation'}) enregistré avec succès.` });
  } catch (err) {
    console.error('[POS INCIDENT ERR]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── GET /api/boutiques/:id/pos-historique — Récupérer l'historique des ventes POS
router.get('/:id/pos-historique', tokenOptional, param('id').isUUID(), async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `SELECT reference AS id,
              TO_CHAR(created_at, 'DD/MM/YYYY') AS date,
              TO_CHAR(created_at, 'HH24:MI') AS heure,
              COALESCE(client_nom, 'Caisse POS') AS caissier,
              COALESCE(methode_paiement, 'cash') AS "modePaiement",
              montant_total AS total,
              'validee' AS statut,
              nom_produit AS "nomProduit",
              quantite,
              prix_unitaire AS "prixUnitaire"
       FROM ventes
       WHERE boutique_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [id]
    );

    const mapTickets = new Map();
    for (const r of rows) {
      if (!mapTickets.has(r.id)) {
        mapTickets.set(r.id, {
          id: r.id,
          date: r.date,
          heure: r.heure,
          caissier: r.caissier,
          modePaiement: r.modePaiement,
          total: Number(r.total),
          statut: 'validee',
          ticket: [],
        });
      }
      const t = mapTickets.get(r.id);
      t.ticket.push({
        produit: { id: r.id, nom: r.nomProduit, prix: Number(r.prixUnitaire), stock: 99, categorie: null },
        quantite: Number(r.quantite),
        prixUnitaire: Number(r.prixUnitaire),
      });
    }

    res.json(Array.from(mapTickets.values()));
  } catch (err) {
    console.error('[BOUTIQUE POS HISTORIQUE ERR]', err);
    res.json([]);
  }
});

// ── 👥 GESTION DES CAISSIERS ET SESSIONS DE CAISSE POS ─────────────────────────

// GET /api/boutiques/:id/caissiers
router.get('/:id/caissiers', tokenOptional, async (req, res) => {
  try {
    const idParam = req.params.id;
    const isUUID = /^[0-9a-f-]{36}$/i.test(idParam);
    const bRes = await pool.query(`SELECT id FROM boutiques WHERE ${isUUID ? 'id=$1' : 'slug=$1'}`, [idParam]);
    if (!bRes.rows[0]) return res.status(404).json({ error: 'Boutique introuvable' });
    const boutiqueId = bRes.rows[0].id;

    const r = await pool.query(
      `SELECT id, nom, prenom, code_pin, role, actif, created_at
       FROM boutique_caissiers
       WHERE boutique_id = $1
       ORDER BY created_at DESC`,
      [boutiqueId]
    );

    // Caissiers par défaut si la table est vide
    if (r.rows.length === 0) {
      const def1 = await pool.query(
        `INSERT INTO boutique_caissiers (boutique_id, nom, prenom, code_pin, role)
         VALUES ($1, 'Bamba', 'Caissier 1', '1234', 'caissier'),
                ($1, 'Superviseur', 'Gérant', '9999', 'superviseur')
         RETURNING id, nom, prenom, code_pin, role, actif, created_at`,
        [boutiqueId]
      );
      return res.json({ caissiers: def1.rows });
    }

    res.json({ caissiers: r.rows });
  } catch (err) {
    console.error('[GET CAISSIERS ERR]', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des caissiers' });
  }
});

// POST /api/boutiques/:id/caissiers
router.post('/:id/caissiers', verifierToken, async (req, res) => {
  try {
    const idParam = req.params.id;
    const { nom, prenom, code_pin, role } = req.body;
    if (!nom || !code_pin) return res.status(400).json({ error: 'Nom et Code PIN requis' });

    const bq = await checkBoutiqueAccess(idParam, req.user.userId);
    if (!bq) return res.status(403).json({ error: 'Accès refusé ou Boutique introuvable' });

    const r = await pool.query(
      `INSERT INTO boutique_caissiers (boutique_id, nom, prenom, code_pin, role)
       VALUES ($1, $2, $3, $4, COALESCE($5, 'caissier'))
       RETURNING id, nom, prenom, code_pin, role, actif, created_at`,
      [bq.id, nom.trim(), prenom ? prenom.trim() : null, code_pin.trim(), role]
    );

    res.status(201).json({ success: true, caissier: r.rows[0] });
  } catch (err) {
    console.error('[POST CAISSIER ERR]', err);
    res.status(500).json({ error: 'Erreur lors de la création du caissier' });
  }
});

// PUT /api/boutiques/:id/caissiers/:caissierId
router.put('/:id/caissiers/:caissierId', verifierToken, async (req, res) => {
  try {
    const { code_pin, actif } = req.body;
    const bq = await checkBoutiqueAccess(req.params.id, req.user.userId);
    if (!bq) return res.status(403).json({ error: 'Accès refusé' });

    let queryParts = [];
    let values = [req.params.caissierId, bq.id];
    let vIndex = 3;

    if (code_pin !== undefined) {
      queryParts.push(`code_pin = $${vIndex++}`);
      values.push(code_pin);
    }
    if (actif !== undefined) {
      queryParts.push(`actif = $${vIndex++}`);
      values.push(actif);
    }

    if (queryParts.length === 0) return res.json({ success: true });

    const q = `UPDATE boutique_caissiers SET ${queryParts.join(', ')} WHERE id = $1 AND boutique_id = $2 RETURNING *`;
    const r = await pool.query(q, values);
    if (!r.rows[0]) return res.status(404).json({ error: 'Caissier introuvable' });

    res.json({ success: true, caissier: r.rows[0] });
  } catch (err) {
    console.error('[PUT CAISSIER ERR]', err);
    res.status(500).json({ error: 'Erreur lors de la modification' });
  }
});

// DELETE /api/boutiques/:id/caissiers/:caissierId
router.delete('/:id/caissiers/:caissierId', verifierToken, async (req, res) => {
  try {
    const bq = await checkBoutiqueAccess(req.params.id, req.user.userId);
    if (!bq) return res.status(403).json({ error: 'Accès refusé' });

    const r = await pool.query(
      'DELETE FROM boutique_caissiers WHERE id = $1 AND boutique_id = $2 RETURNING id',
      [req.params.caissierId, bq.id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Caissier introuvable' });

    res.json({ success: true });
  } catch (err) {
    console.error('[DELETE CAISSIER ERR]', err);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

// POST /api/boutiques/:id/caissiers/verifier-pin
router.post('/:id/caissiers/verifier-pin', tokenOptional, async (req, res) => {
  try {
    const idParam = req.params.id;
    const { code_pin } = req.body;
    if (!code_pin) return res.status(400).json({ error: 'Code PIN requis' });

    const isUUID = /^[0-9a-f-]{36}$/i.test(idParam);
    const bRes = await pool.query(`SELECT id FROM boutiques WHERE ${isUUID ? 'id=$1' : 'slug=$1'}`, [idParam]);
    if (!bRes.rows[0]) return res.status(404).json({ error: 'Boutique introuvable' });
    const boutiqueId = bRes.rows[0].id;

    const r = await pool.query(
      `SELECT id, nom, prenom, code_pin, role
       FROM boutique_caissiers
       WHERE boutique_id = $1 AND code_pin = $2 AND actif = TRUE`,
      [boutiqueId, code_pin.trim()]
    );

    if (r.rows[0]) {
      return res.json({ valide: true, caissier: r.rows[0] });
    }

    res.json({ valide: false, message: 'Code PIN incorrect' });
  } catch (err) {
    console.error('[VERIFIER PIN ERR]', err);
    res.status(500).json({ error: 'Erreur de vérification PIN' });
  }
});

// GET /api/boutiques/:id/pos-sessions/active
router.get('/:id/pos-sessions/active', tokenOptional, async (req, res) => {
  try {
    const idParam = req.params.id;
    const isUUID = /^[0-9a-f-]{36}$/i.test(idParam);
    const bRes = await pool.query(`SELECT id FROM boutiques WHERE ${isUUID ? 'id=$1' : 'slug=$1'}`, [idParam]);
    if (!bRes.rows[0]) return res.status(404).json({ error: 'Boutique introuvable' });
    const boutiqueId = bRes.rows[0].id;

    // Récupérer la session ouverte pour cette boutique
    const r = await pool.query(
      `SELECT * FROM boutique_pos_sessions 
       WHERE boutique_id = $1 AND statut = 'ouverte'
       ORDER BY date_ouverture DESC LIMIT 1`,
      [boutiqueId]
    );

    res.json({ session: r.rows[0] || null });
  } catch (err) {
    console.error('[GET ACTIVE SESSION ERR]', err);
    res.status(500).json({ error: 'Erreur de récupération de la session active' });
  }
});

// Helper pour vérifier si la boutique a un abonnement Pro/Business actif
async function verifierAbonnementCaisse(boutiqueId) {
  const { rows } = await pool.query(
    `SELECT a.plan
     FROM abonnements a
     JOIN boutiques b ON b.utilisateur_id = a.utilisateur_id
     WHERE b.id = $1 AND a.statut = 'actif' AND a.fin > NOW()
     LIMIT 1`,
    [boutiqueId]
  );
  return rows[0]?.plan || null;
}

// POST /api/boutiques/:id/pos-sessions/ouvrir
router.post('/:id/pos-sessions/ouvrir', tokenOptional, async (req, res) => {
  try {
    const idParam = req.params.id;
    const { caissierNom, fondDeCaisse, caissierId } = req.body;
    const isUUID = /^[0-9a-f-]{36}$/i.test(idParam);
    const bRes = await pool.query(`SELECT id FROM boutiques WHERE ${isUUID ? 'id=$1' : 'slug=$1'}`, [idParam]);
    if (!bRes.rows[0]) return res.status(404).json({ error: 'Boutique introuvable' });
    const boutiqueId = bRes.rows[0].id;

    const plan = await verifierAbonnementCaisse(boutiqueId);
    if (!plan) {
      return res.status(403).json({ error: 'Un abonnement Pro ou Business actif est requis pour ouvrir la caisse POS.' });
    }

    const r = await pool.query(
      `INSERT INTO boutique_pos_sessions (boutique_id, caissier_id, caissier_nom, fond_caisse_initial, date_ouverture, statut)
       VALUES ($1, $2, $3, $4, NOW(), 'ouverte')
       RETURNING *`,
      [boutiqueId, caissierId || null, caissierNom || 'Caissier', Number(fondDeCaisse || 0)]
    );

    res.status(201).json({ success: true, session: r.rows[0] });
  } catch (err) {
    console.error('[POST POS SESSION OUVRIR ERR]', err);
    res.status(500).json({ error: 'Erreur lors de l’ouverture de session' });
  }
});

// POST /api/boutiques/:id/pos-sessions/cloturer
router.post('/:id/pos-sessions/cloturer', tokenOptional, async (req, res) => {
  try {
    const idParam = req.params.id;
    const { sessionId, especesComptees, ventesEspeces, ventesWave, ventesOrangeMoney, ventesCarte, ventesTotal, nbVentes } = req.body;
    const isUUID = /^[0-9a-f-]{36}$/i.test(idParam);
    const bRes = await pool.query(`SELECT id FROM boutiques WHERE ${isUUID ? 'id=$1' : 'slug=$1'}`, [idParam]);
    if (!bRes.rows[0]) return res.status(404).json({ error: 'Boutique introuvable' });

    if (sessionId && /^[0-9a-f-]{36}$/i.test(sessionId)) {
      await pool.query(
        `UPDATE boutique_pos_sessions
         SET date_cloture = NOW(),
             statut = 'cloturee',
             especes_comptees = $1,
             ventes_especes = $2,
             ventes_wave = $3,
             ventes_orange_money = $4,
             ventes_carte = $5,
             ventes_total = $6,
             nb_ventes = $7,
             ecart_caisse = ($1 - (fond_caisse_initial + $2))
         WHERE id = $8`,
        [
          Number(especesComptees || 0),
          Number(ventesEspeces || 0),
          Number(ventesWave || 0),
          Number(ventesOrangeMoney || 0),
          Number(ventesCarte || 0),
          Number(ventesTotal || 0),
          Number(nbVentes || 0),
          sessionId
        ]
      );
    }

    res.json({ success: true, message: 'Session clôturée avec succès' });
  } catch (err) {
    console.error('[POST POS SESSION CLOTURER ERR]', err);
    res.status(500).json({ error: 'Erreur lors de la clôture de session' });
  }
});

module.exports = router;

