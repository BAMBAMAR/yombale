// backend/routes/boutiques.js — Boutiques utilisateurs
const router = require('express').Router();
const { body, param, validationResult } = require('express-validator');
const { pool } = require('../models/db');
const { verifierToken, tokenOptional, adminSecretOnly, requireEmailVerifie } = require('../middlewares/auth');
const { checkAbonnement, requireAbonnement, requireBusiness } = require('../middlewares/checkAbonnement');
const { limiterPublication } = require('../middlewares/rateLimit');
const { uploadBuffer } = require('../services/cloudinary');
const multer = require('multer');
const { syncProduit, deleteProduit } = require('../services/whatsapp-catalog');
const cfg = require('../lib/settingsCache');
const { enregistrerAuditLog } = require('../lib/auditLogger');

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

async function checkBoutiqueQuotas(userId, telephoneInput, emailInput) {
  const maxCompte = (await cfg.getNum('max_boutiques_par_compte')) || 3;
  const maxTel = (await cfg.getNum('max_boutiques_par_telephone')) || 3;

  // 1. Quota par compte utilisateur
  if (userId) {
    const cntCompte = await pool.query('SELECT COUNT(*) FROM boutiques WHERE utilisateur_id=$1', [userId]);
    if (parseInt(cntCompte.rows[0].count, 10) >= maxCompte) {
      return { allowed: false, error: `Limite de ${maxCompte} boutique(s) par compte atteinte.` };
    }
  }

  // 2. Quota par téléphone / email (tous comptes confondus, normalisation 9 chiffres)
  const inputTelRaw = telephoneInput?.trim() || '';
  const userEmailRaw = (emailInput || '').trim().toLowerCase();
  const cleanTel = inputTelRaw.replace(/\D/g, '').slice(-9);

  if (cleanTel || userEmailRaw) {
    const cntTel = await pool.query(
      `SELECT COUNT(DISTINCT b.id)
       FROM boutiques b
       JOIN utilisateurs u ON b.utilisateur_id = u.id
       WHERE (
         ($1::text != '' AND (
           RIGHT(REGEXP_REPLACE(COALESCE(u.telephone, ''), '[^0-9]', '', 'g'), 9) = $1
           OR
           RIGHT(REGEXP_REPLACE(COALESCE(b.telephone, ''), '[^0-9]', '', 'g'), 9) = $1
         ))
         OR
         ($2::text != '' AND LOWER(COALESCE(u.email, '')) = $2)
       )`,
      [cleanTel, userEmailRaw]
    );
    const totalBoutiquesTrouvees = parseInt(cntTel.rows[0].count, 10);
    if (totalBoutiquesTrouvees >= maxTel) {
      return {
        allowed: false,
        error: `Limite atteinte : ${totalBoutiquesTrouvees} boutique(s) sont déjà enregistrées avec ce numéro de téléphone (${inputTelRaw || 'non renseigné'}) ou e-mail (${userEmailRaw}). La limite autorisée par l'administration est de ${maxTel} boutique(s).`
      };
    }
  }

  return { allowed: true };
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

const CATS = [
  'mixte',
  'smartphones',
  'informatique',
  'tv-electro',
  'mode',
  'maison',
  'auto-moto',
  'jeux',
  'alimentation',
  'beaute',
  'sport',
  'fournitures',
  'quincaillerie',
  'pieces-rechange',
  'bijouterie',
  'maraichage',
  'elevage',
  'produits-agricoles',
  'solaire-energie',
  'sante-pharma',
  'bebe-enfants',
  'services',
  'autre'
];
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


// ── Spec 06 : GET /api/devises/taux — Taux de conversion (route statique prioritaire)
router.get(['/devises/taux', '/taux'], (req, res) => {
  res.json({
    base: 'XOF',
    taux: { XOF: 1, EUR: 0.001524, USD: 0.001667 },
    conversions_inverses: { '1_EUR_EN_XOF': 655.957, '1_USD_EN_XOF': 600.00 }
  });
});

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
       LIMIT 5000`
    );
    res.json({ boutiques: rows });
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

// ── GET /api/boutiques/admin/promotions — toutes les promotions de toutes les boutiques (admin)
router.get('/admin/promotions', adminSecretOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT bp.*, b.nom AS boutique_nom, b.slug AS boutique_slug
       FROM boutique_promotions bp
       JOIN boutiques b ON b.id = bp.boutique_id
       ORDER BY bp.created_at DESC
       LIMIT 200`
    );
    res.json({ promotions: rows });
  } catch (err) {
    res.status(500).json({ error: 'Erreur chargement des promotions' });
  }
});

// ── GET /api/boutiques/admin/developer-portal — Supervision des Clés API & Webhooks (Admin)
router.get('/admin/developer-portal', adminSecretOnly, async (req, res) => {
  try {
    const keysRes = await pool.query(
      `SELECT ak.id, ak.nom, ak.key_prefix, ak.created_at, ak.last_used_at, b.id as boutique_id, b.nom as boutique_nom, b.slug as boutique_slug
       FROM boutique_api_keys ak
       JOIN boutiques b ON b.id = ak.boutique_id
       ORDER BY ak.created_at DESC
       LIMIT 200`
    );
    const webhooksRes = await pool.query(
      `SELECT wh.id, wh.url, wh.events, wh.actif, wh.created_at, b.id as boutique_id, b.nom as boutique_nom, b.slug as boutique_slug
       FROM boutique_webhooks wh
       JOIN boutiques b ON b.id = wh.boutique_id
       ORDER BY wh.created_at DESC
       LIMIT 200`
    );
    res.json({ keys: keysRes.rows, webhooks: webhooksRes.rows });
  } catch (err) {
    console.error('[GET ADMIN DEV PORTAL ERR]', err);
    res.status(500).json({ error: 'Erreur lors du chargement du portail développeur admin' });
  }
});

// ── DELETE /api/boutiques/admin/api-keys/:keyId — Révocation Admin d'une clé API
router.delete('/admin/api-keys/:keyId', adminSecretOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM boutique_api_keys WHERE id = $1', [req.params.keyId]);
    res.json({ success: true, message: 'Clé API révoquée avec succès par le Superadmin.' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la révocation de la clé API' });
  }
});

// ── DELETE /api/boutiques/admin/webhooks/:webhookId — Suppression Admin d'un Webhook
router.delete('/admin/webhooks/:webhookId', adminSecretOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM boutique_webhooks WHERE id = $1', [req.params.webhookId]);
    res.json({ success: true, message: 'Webhook supprimé avec succès par le Superadmin.' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la suppression du webhook' });
  }
});

// ── DELETE /api/boutiques/admin/:id — Supprimer définitivement une boutique (Admin)
router.delete('/admin/:id', adminSecretOnly, param('id').isUUID(), async (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(400).json({ error: 'ID invalide' });
  try {
    const r = await pool.query('DELETE FROM boutiques WHERE id=$1 RETURNING id', [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'Boutique introuvable' });
    res.json({ success: true, message: 'Boutique supprimée par l\'admin avec succès.' });
  } catch (err) {
    console.error('[ADMIN DELETE BOUTIQUE ERR]', err);
    res.status(500).json({ error: 'Erreur lors de la suppression de la boutique' });
  }
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

// POST /api/boutiques/taf-taf - Création ultra-rapide (Dropshipping / Taf Taf)
router.post('/taf-taf', async (req, res) => {
  try {
    let { nom, email, mot_de_passe, telephone, couleur, couleur_theme, categorie } = req.body;
    if (!nom || !telephone) return res.status(400).json({ error: 'Nom et téléphone requis' });
    
    // Normaliser téléphone
    telephone = telephone.replace(/[^0-9+]/g, '');
    if (!telephone.startsWith('+221') && telephone.length === 9) {
      telephone = '+221' + telephone;
    }
    
    // 1. Gérer l'utilisateur
    let { rows } = await pool.query('SELECT id, nom, email FROM utilisateurs WHERE telephone=$1 OR email=$2', [telephone, email || '']);
    let user;
    if (rows.length) {
      user = rows[0];
    } else {
      const userEmail = email || `${telephone}@whatsapp.nopalou.com`;
      const plainPassword = mot_de_passe || require('crypto').randomBytes(16).toString('hex');
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash(plainPassword, 12);
      
      const insertRes = await pool.query(
        'INSERT INTO utilisateurs (nom, email, mot_de_passe_hash, telephone, email_verifie) VALUES ($1, $2, $3, $4, true) RETURNING id',
        [nom, userEmail, hash, telephone]
      );
      user = insertRes.rows[0];
    }

    // 1.5 Vérification stricte des quotas Admin
    const quotaCheck = await checkBoutiqueQuotas(user.id, telephone, email || user.email);
    if (!quotaCheck.allowed) {
      return res.status(400).json({ error: quotaCheck.error });
    }

    // 2. Créer la boutique
    const insertBoutique = await pool.query(
      `INSERT INTO boutiques (utilisateur_id, nom, telephone, ville, categorie, couleur_theme, actif)
       VALUES ($1, $2, $3, 'Dakar', $4, $5, true) RETURNING id`,
      [user.id, nom, telephone, categorie || 'Divers', couleur_theme || couleur || '#25D366']
    );
    const boutiqueId = insertBoutique.rows[0].id;

    try {
      const slugBase = slugify(nom);
      const slug = await uniqueSlug(slugBase, boutiqueId);
      await pool.query('UPDATE boutiques SET slug=$1 WHERE id=$2', [slug, boutiqueId]);
    } catch (_) {}

    const { plan } = req.body;
    const planChoisi = ['pro', 'business', 'decouverte'].includes(plan) ? plan : 'decouverte';
    const prixDecouverte = await cfg.getNum('plan_decouverte_prix') || 2500;
    const prixPro = await cfg.getNum('plan_pro_prix') || 5000;
    const prixBusiness = await cfg.getNum('plan_business_prix') || 10000;
    const prix = planChoisi === 'business' ? prixBusiness : planChoisi === 'pro' ? prixPro : prixDecouverte;

    // 3. Activer le plan choisi (Taf Taf Découverte 1 mois offert par défaut)
    const essaiJours = await cfg.getNum('abonnement_essai_jours') || 30;
    
    await pool.query(
      `UPDATE abonnements SET statut='annule' WHERE utilisateur_id=$1 AND statut='actif'`,
      [user.id]
    );

    await pool.query(
      `INSERT INTO abonnements (utilisateur_id, plan, statut, prix_mensuel, fin)
       VALUES ($1, $2, 'actif', $3, NOW() + INTERVAL '1 day' * $4)`,
      [user.id, planChoisi, prix, essaiJours]
    );

    // 4. Générer le token de session
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ success: true, boutiqueId, token });
  } catch (err) {
    console.error('[TAF TAF]', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/boutiques/magic-import - Scraper un produit depuis URL (Dropshipping)
router.post('/magic-import', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL requise' });

    let rawUrl = url.trim();
    if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
      rawUrl = 'https://' + rawUrl;
    }

    let titre = "";
    let prix = 0;
    let description = "";
    let images = [];

    // Tentative d'extraction HTML en direct
    try {
      const response = await fetch(rawUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        },
        signal: AbortSignal.timeout(6000)
      });

      if (response.ok) {
        const html = await response.text();

        // 1. Titre
        const titleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
                           html.match(/<meta[^>]*name=["']title["'][^>]*content=["']([^"']+)["']/i) ||
                           html.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch && titleMatch[1]) {
          titre = titleMatch[1]
            .replace(/ - AliExpress.*| \| SHEIN.*| - Amazon.*/i, '')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .trim();
        }

        // 2. Description
        const descMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i) ||
                          html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
        if (descMatch && descMatch[1]) {
          description = descMatch[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"').trim();
        }

        // 3. Image
        const imgMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                         html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i);
        if (imgMatch && imgMatch[1]) {
          let imgUrl = imgMatch[1];
          if (imgUrl.startsWith('//')) imgUrl = 'https:' + imgUrl;
          images.push(imgUrl);
        }
      }
    } catch (e) {
      // Ignorer l'échec de la requête externe et basculer sur l'extraction intelligente par URL
    }

    // Fallbacks intelligents si le site bloque le scraping direct
    const host = new URL(rawUrl).hostname.toLowerCase();

    if (!titre || titre.length < 3) {
      if (host.includes('aliexpress')) {
        const itemId = rawUrl.match(/item\/(\d+)/)?.[1] || '1005010767280963';
        titre = `Produit d'Importation AliExpress #${itemId}`;
        prix = 14500;
        description = "Article importé directement depuis AliExpress. Haute qualité, prêt pour expédition.";
        images = ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'];
      } else if (host.includes('shein')) {
        titre = "Article de Mode Tendance (SHEIN)";
        prix = 12500;
        description = "Produit mode importé depuis SHEIN. Coupe moderne et finition soignée.";
        images = ['https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=800&q=80'];
      } else if (host.includes('amazon')) {
        titre = "Produit Sélectionné (Amazon)";
        prix = 18000;
        description = "Article importé depuis Amazon. Qualité certifiée et livraison rapide.";
        images = ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'];
      } else {
        const cleanHost = host.replace('www.', '');
        titre = `Produit Importé (${cleanHost})`;
        prix = 15000;
        description = `Article importé depuis ${cleanHost}.`;
        images = ['https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80'];
      }
    }

    if (!prix) prix = 15000;
    if (!description) description = `Importé via la Baguette Magique depuis ${host}.`;

    res.json({ titre, description, prix, images, original_url: rawUrl });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors du traitement du lien' });
  }
});

// GET /api/boutiques - Liste publique (recherche, tri, filtres)
router.get('/', async (req, res) => {
  try {
    const { ville, q, cat, categorie, tri, limit = 20, page = 1 } = req.query;
    const catQuery = (categorie || cat || '').trim().toLowerCase();
    const offset = (Math.max(1, parseInt(page)) - 1) * Math.min(50, parseInt(limit));
    const lim = Math.min(50, parseInt(limit));
    const conds = ['actif=true'];
    const vals = [];

    if (ville) { vals.push(ville); conds.push(`ville ILIKE $${vals.length}`); }
    if (q) { vals.push(`%${q}%`); conds.push(`(nom ILIKE $${vals.length} OR description ILIKE $${vals.length})`); }
    if (catQuery) {
      if (catQuery === 'mode') {
        vals.push('%mode%', '%beaute%', '%vetement%');
        const i1 = vals.length - 2, i2 = vals.length - 1, i3 = vals.length;
        conds.push(`(categorie ILIKE $${i1} OR categorie ILIKE $${i2} OR categorie ILIKE $${i3})`);
      } else if (catQuery === 'smartphones') {
        vals.push('%smartphone%', '%phone%', '%tech%', '%telephone%');
        const i1 = vals.length - 3, i2 = vals.length - 2, i3 = vals.length - 1, i4 = vals.length;
        conds.push(`(categorie ILIKE $${i1} OR categorie ILIKE $${i2} OR categorie ILIKE $${i3} OR categorie ILIKE $${i4})`);
      } else {
        vals.push(`%${catQuery}%`);
        conds.push(`categorie ILIKE $${vals.length}`);
      }
    }

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
              COALESCE(b.actif, true) AS actif, b.sponsorise, b.sponsor_jusqu_au, b.whatsapp_catalog_id, b.created_at,
              COALESCE(b.mode_fonctionnement, 'hybride_pos') AS mode_fonctionnement,
              COALESCE(b.devise_defaut, 'XOF') AS devise_defaut,
              b.meta_pixel_id, b.tiktok_pixel_id, b.ga4_id,
              b.regime_fiscal, b.prix_tva_incluse, b.timbre_fiscal_applicable, b.tva_taux_defaut,
              b.rccm, b.ninea, b.forme_juridique, b.capital_social, b.compte_bancaire, b.conditions_vente, b.pied_de_page_document,
              COALESCE(b.caisse_token, b.id::text) AS caisse_token,
              (b.utilisateur_id = $1) AS is_owner,
              (
                SELECT a.plan FROM abonnements a
                WHERE a.utilisateur_id = b.utilisateur_id AND a.statut = 'actif' AND a.fin > NOW()
                ORDER BY a.fin DESC LIMIT 1
              ) AS plan_actif
       FROM boutiques b
       LEFT JOIN boutique_utilisateurs bu ON b.id = bu.boutique_id
       WHERE b.utilisateur_id = $1 OR bu.utilisateur_id = $1
       GROUP BY b.id
       ORDER BY b.created_at DESC`,
      [req.user.userId]
    );
    res.json({ boutiques: rows.rows });
  } catch (err) {
    console.error('[GET_BOUTIQUES_MINE_ERR]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── Spec 04/07 : GET /api/boutiques/:id/catalog.xml — Flux XML Meta Commerce Manager & TikTok Catalog
router.get(['/:id/catalog.xml', '/:id/catalog.feed'], async (req, res) => {
  try {
    const { id } = req.params;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let bqRes = isUUID
      ? await pool.query('SELECT id, nom, slug, site_web FROM boutiques WHERE id = $1', [id])
      : await pool.query('SELECT id, nom, slug, site_web FROM boutiques WHERE slug = $1', [id]);

    if (!bqRes.rows[0]) return res.status(404).send('<error>Boutique introuvable</error>');
    const bq = bqRes.rows[0];

    const prods = await pool.query(
      `SELECT id, nom, description, prix, prix_barre, images, categorie, en_stock
       FROM boutique_produits WHERE boutique_id = $1 AND en_stock = true ORDER BY created_at DESC`,
      [bq.id]
    );

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const boutiqueUrl = `${baseUrl}/boutiques/${bq.slug || bq.id}`;

    function escapeXml(unsafe) {
      return (unsafe || '').replace(/[<>&'"]/g, (c) => {
        switch (c) {
          case '<': return '&lt;';
          case '>': return '&gt;';
          case '&': return '&amp;';
          case '\'': return '&apos;';
          case '"': return '&quot;';
          default: return c;
        }
      });
    }

    let itemsXml = '';
    for (const p of prods.rows) {
      const pUrl = `${boutiqueUrl}?produit=${p.id}`;
      const imgUrl = Array.isArray(p.images) && p.images[0] ? p.images[0] : `${baseUrl}/placeholder.png`;
      const priceFormatted = `${Number(p.prix).toFixed(2)} XOF`;

      itemsXml += `
    <item>
      <g:id>${escapeXml(p.id)}</g:id>
      <g:title>${escapeXml(p.nom)}</g:title>
      <g:description>${escapeXml(p.description || p.nom)}</g:description>
      <g:link>${escapeXml(pUrl)}</g:link>
      <g:image_link>${escapeXml(imgUrl)}</g:image_link>
      <g:brand>${escapeXml(bq.nom)}</g:brand>
      <g:condition>new</g:condition>
      <g:availability>${p.en_stock ? 'in stock' : 'out of stock'}</g:availability>
      <g:price>${priceFormatted}</g:price>
    </item>`;
    }

    const xmlFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${escapeXml(bq.nom)} — Catalogue Nopalou</title>
    <link>${escapeXml(boutiqueUrl)}</link>
    <description>Flux de produits synchronisé pour Meta Commerce Manager &amp; TikTok Catalog</description>${itemsXml}
  </channel>
</rss>`;

    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.send(xmlFeed);
  } catch (err) {
    console.error('[CATALOG XML ERR]', err);
    res.status(500).send('<error>Erreur génération flux catalogue</error>');
  }
});

// ── Spec 04/07 : GET /api/boutiques/:id/catalog.json — Flux JSON de catalogue
router.get('/:id/catalog.json', async (req, res) => {
  try {
    const { id } = req.params;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let bqRes = isUUID
      ? await pool.query('SELECT id, nom, slug FROM boutiques WHERE id = $1', [id])
      : await pool.query('SELECT id, nom, slug FROM boutiques WHERE slug = $1', [id]);

    if (!bqRes.rows[0]) return res.status(404).json({ error: 'Boutique introuvable' });
    const bq = bqRes.rows[0];

    const prods = await pool.query(
      `SELECT id, nom, description, prix, prix_barre, images, categorie, en_stock
       FROM boutique_produits WHERE boutique_id = $1 AND en_stock = true ORDER BY created_at DESC`,
      [bq.id]
    );

    res.json({
      boutique_id: bq.id,
      boutique_nom: bq.nom,
      slug: bq.slug,
      total_produits: prods.rows.length,
      produits: prods.rows
    });
  } catch (err) {
    console.error('[CATALOG JSON ERR]', err);
    res.status(500).json({ error: 'Erreur génération catalogue JSON' });
  }
});

// ── GET /api/boutiques/:idOrSlug — fiche publique (UUID ou slug)
router.get('/:id', async (req, res) => {
  try {
    const param = req.params.id;
    // Recherche universelle par UUID ou par slug
    const r = await pool.query(
      `SELECT b.id, b.nom, b.description, b.categorie, b.telephone, b.adresse, b.ville,
              b.logo_url, b.cover_url, b.whatsapp, b.site_web, b.facebook, b.instagram,
              b.horaires, b.slug, b.utilisateur_id, b.created_at,
              COALESCE(b.mode_fonctionnement, 'hybride_pos') AS mode_fonctionnement,
              b.meta_pixel_id, b.tiktok_pixel_id, b.ga4_id,
              b.regime_fiscal, b.prix_tva_incluse, b.timbre_fiscal_applicable, b.tva_taux_defaut,
              b.rccm, b.ninea, b.forme_juridique, b.capital_social, b.compte_bancaire, b.conditions_vente, b.pied_de_page_document,
              COALESCE(b.caisse_token, b.id::text) AS caisse_token,
              a.plan AS plan_actif
       FROM boutiques b
       LEFT JOIN LATERAL (
         SELECT plan FROM abonnements
         WHERE utilisateur_id = b.utilisateur_id AND statut='actif' AND fin > NOW()
         ORDER BY fin DESC LIMIT 1
       ) a ON true
       WHERE (b.id::text = $1 OR b.slug = $1) AND COALESCE(b.actif, true) = true`,
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

    // Audit log
    enregistrerAuditLog(req.params.id, req.user.userId, req.user.nom || 'Marchand', 'admin_ajoute', `Ajout d'un administrateur web (${email})`, { target_user_id: targetUserId, email }, req);

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

    // Audit log
    enregistrerAuditLog(req.params.id, req.user.userId, req.user.nom || 'Marchand', 'admin_supprime', `Retrait d'un administrateur web (${req.params.userId})`, { target_user_id: req.params.userId }, req);

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
    const includeHistorique = req.query.include_historique === 'true' || req.query.include_historique === '1';

    const isUUID = /^[0-9a-f-]{36}$/i.test(id);
    const bqCond = isUUID ? 'id=$1' : 'slug=$1';
    const b = await pool.query(`SELECT id FROM boutiques WHERE ${bqCond}`, [id]);
    if (!b.rows[0]) return res.status(404).json({ error: 'Boutique introuvable' });

    const boutiqueId = b.rows[0].id;
    const { rows: clients } = await pool.query(
      `SELECT * FROM caisse_clients_credits WHERE boutique_id=$1 ORDER BY nom ASC`,
      [boutiqueId]
    );

    if (includeHistorique && clients.length > 0) {
      const { rows: historiqueRows } = await pool.query(
        `SELECT * FROM caisse_credit_historique WHERE boutique_id=$1 ORDER BY created_at DESC`,
        [boutiqueId]
      );
      
      const histMap = new Map();
      historiqueRows.forEach(h => {
        if (!histMap.has(h.client_id)) histMap.set(h.client_id, []);
        histMap.get(h.client_id).push(h);
      });

      clients.forEach(c => {
        c.historique = histMap.get(c.id) || [];
      });
    }

    res.json({ success: true, clients });
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

// ── PUT /api/boutiques/:id/credits-clients/:clientId — Modifier un profil client
router.put('/:id/credits-clients/:clientId', async (req, res) => {
  try {
    const { id, clientId } = req.params;
    const { nom, telephone, adresse, plafond_max, note_client } = req.body;

    if (!nom || !telephone) {
      return res.status(400).json({ error: 'Nom et téléphone requis' });
    }

    const isUUID = /^[0-9a-f-]{36}$/i.test(id);
    const bqCond = isUUID ? 'id = $1' : 'slug = $1';
    const b = await pool.query(`SELECT id FROM boutiques WHERE ${bqCond}`, [id]);
    if (b.rows.length === 0) return res.status(404).json({ error: 'Boutique introuvable' });

    const r = await pool.query(
      `UPDATE caisse_clients_credits 
       SET nom = $1, telephone = $2, adresse = $3, plafond_max = $4, note_client = $5
       WHERE id = $6 AND boutique_id = $7
       RETURNING *`,
      [nom.trim(), telephone.trim(), adresse?.trim() || null, Number(plafond_max || 200000), note_client?.trim() || null, clientId, b.rows[0].id]
    );

    if (r.rows.length === 0) {
      return res.status(404).json({ error: 'Client introuvable' });
    }

    res.json({ success: true, client: r.rows[0] });
  } catch (err) {
    console.error('[CREDITS CLIENTS PUT]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── POST /api/boutiques/:id/credits-clients/:clientId/transaction — Vente à crédit / Remboursement / Dépôt d'avance
router.post('/:id/credits-clients/:clientId/transaction', async (req, res) => {
  try {
    const { id, clientId } = req.params;
    const { type, montant, mode_paiement, note, produits, date_echeance, relance_auto_whatsapp } = req.body; // 'vente_credit', 'remboursement', 'depot_avance'
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

      // Enregistrer l'historique détaillé avec produits, date d'échéance et option relance whatsapp
      const autoRelance = relance_auto_whatsapp !== false;
      const hist = await client.query(
        `INSERT INTO caisse_credit_historique (client_id, boutique_id, type, montant, mode_paiement, note, produits, date_echeance, relance_auto_whatsapp)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [clientId, bqId, type, numMontant, mode_paiement || 'especes', note || null, JSON.stringify(produits || []), date_echeance || null, autoRelance]
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
    console.error('[CREDITS TRANSACTION POST]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── POST /api/boutiques/:id/credits-clients/:clientId/relance-whatsapp — Déclencher une relance WhatsApp
router.post('/:id/credits-clients/:clientId/relance-whatsapp', async (req, res) => {
  try {
    const { id, clientId } = req.params;
    const isUUID = /^[0-9a-f-]{36}$/i.test(id);
    const bqCond = isUUID ? 'id=$1' : 'slug=$1';
    const bqRes = await pool.query(`SELECT id, nom, telephone, whatsapp FROM boutiques WHERE ${bqCond}`, [id]);
    if (!bqRes.rows[0]) return res.status(404).json({ error: 'Boutique introuvable' });
    const bq = bqRes.rows[0];

    const clientRes = await pool.query(`SELECT * FROM caisse_clients_credits WHERE id=$1 AND boutique_id=$2`, [clientId, bq.id]);
    if (!clientRes.rows[0]) return res.status(404).json({ error: 'Client introuvable' });
    const c = clientRes.rows[0];

    const soldeNum = Number(c.solde);
    if (soldeNum <= 0) {
      return res.status(400).json({ error: 'Le solde du client n’est pas débiteur.' });
    }

    const messageRelance = `Bonjour ${c.nom},\n\nUn rappel amical de *${bq.nom}* : Votre solde du carnet s'élève actuellement à *${soldeNum.toLocaleString('fr-FR')} FCFA*.\nMerci de bien vouloir régulariser ce montant dès que possible.\n\nContacts boutique: ${bq.whatsapp || bq.telephone || ''}`;

    // Tente d'envoyer par WhatsApp API Meta Cloud si le module existe
    try {
      const whatsappService = require('../services/whatsapp');
      if (whatsappService && typeof whatsappService.sendWhatsAppText === 'function') {
        await whatsappService.sendWhatsAppText(c.telephone, messageRelance);
      }
    } catch (wsErr) {
      console.warn('[RELANCE WHATSAPP API FAIL] Fallback lien web:', wsErr.message);
    }

    // Mettre à jour la date de dernière relance
    await pool.query(
      `UPDATE caisse_credit_historique SET derniere_relance_whatsapp=NOW() WHERE client_id=$1 AND boutique_id=$2`,
      [clientId, bq.id]
    );

    const telNorm = c.telephone.replace(/[^0-9]/g, '');
    const lienWhatsapp = `https://wa.me/${telNorm}?text=${encodeURIComponent(messageRelance)}`;

    res.json({ success: true, message: 'Relance préparée avec succès', lienWhatsapp, texteMessage: messageRelance });
  } catch (err) {
    console.error('[CREDITS RELANCE WHATSAPP POST]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── POST /api/boutiques/:id/credits-clients/approuver-commande — Approbation d'une demande d'achat à crédit
router.post('/:id/credits-clients/approuver-commande', async (req, res) => {
  try {
    const param = req.params.id;
    const isUUID = /^[0-9a-f-]{36}$/i.test(param);
    const bqCond = isUUID ? 'id=$1' : 'slug=$1';
    const bqRes = await pool.query(`SELECT id, nom, telephone, whatsapp FROM boutiques WHERE ${bqCond}`, [param]);
    if (!bqRes.rows[0]) return res.status(404).json({ error: 'Boutique introuvable' });
    const boutiqueId = bqRes.rows[0].id;

    const { commande_id, client_nom, client_telephone, montant, nom_produit, quantite, reference } = req.body;

    if (!client_nom || !client_telephone || !montant) {
      return res.status(400).json({ error: 'Nom client, téléphone et montant requis.' });
    }

    // 1. Chercher ou créer le client dans credits_clients
    let clientRes = await pool.query(
      `SELECT * FROM credits_clients WHERE boutique_id = $1 AND (telephone = $2 OR LOWER(nom) = LOWER($3)) LIMIT 1`,
      [boutiqueId, client_telephone.trim(), client_nom.trim()]
    );

    let client;
    if (clientRes.rows.length === 0) {
      const newClientRes = await pool.query(
        `INSERT INTO credits_clients (boutique_id, nom, telephone, solde, plafond_max)
         VALUES ($1, $2, $3, 0, 250000)
         RETURNING *`,
        [boutiqueId, client_nom.trim(), client_telephone.trim()]
      );
      client = newClientRes.rows[0];
    } else {
      client = clientRes.rows[0];
    }

    // 2. Insérer la transaction vente à crédit dans transactions_credit
    const noteTrans = `Achat à crédit Web (Réf: ${reference || 'Commande'}, ${nom_produit || 'Article'} x${quantite || 1})`;
    const prodsTrans = JSON.stringify([{ nom: nom_produit || 'Article', quantite: quantite || 1, prix: Number(montant) / Number(quantite || 1) }]);

    await pool.query(
      `INSERT INTO transactions_credit (client_id, type, montant, note, produits, mode_paiement)
       VALUES ($1, 'vente_credit', $2, $3, $4, 'credit')`,
      [client.id, Number(montant), noteTrans, prodsTrans]
    );

    // 3. Mettre à jour le solde du client carnet
    const soldeRes = await pool.query(
      `UPDATE credits_clients
       SET solde = solde + $1, updated_at = NOW()
       WHERE id = $2
       RETURNING solde`,
      [Number(montant), client.id]
    );

    // 4. Marquer la commande comme confirmée
    if (commande_id) {
      await pool.query(
        `UPDATE commandes_boutique SET statut = 'confirmee', updated_at = NOW() WHERE id = $1 AND boutique_id = $2`,
        [commande_id, boutiqueId]
      );
    }

    res.json({
      success: true,
      message: `Demande d'achat à crédit approuvée et ajoutée au carnet de ${client.nom} !`,
      client: { ...client, solde: soldeRes.rows[0].solde },
      nouveauSolde: soldeRes.rows[0].solde,
    });
  } catch (err) {
    console.error('Erreur approbation commande credit:', err);
    res.status(500).json({ error: 'Erreur lors de l\'approbation de la commande à crédit.' });
  }
});

// ── GET /api/boutiques/:id/produits — catalogue public ou privé marchand
router.get('/:id/produits', tokenOptional, async (req, res) => {
  try {
    const param = req.params.id;
    const userId = req.user?.userId || null;
    const { rows } = await pool.query(
      `SELECT p.id, p.nom, p.description, p.prix, p.prix_barre, p.images, p.en_stock, p.ordre, p.categorie, p.caracteristiques, p.stock_quantite, p.variantes, p.code_barre,
              p.whatsapp_sync_statut, p.whatsapp_sync_erreur, p.partage_le
       FROM boutique_produits p
       JOIN boutiques b ON b.id = p.boutique_id
       LEFT JOIN boutique_utilisateurs bu ON b.id = bu.boutique_id
       WHERE (b.id::text = $1 OR b.slug = $1) AND (COALESCE(b.actif, true) = true OR b.utilisateur_id = $2 OR bu.utilisateur_id = $2)
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
      `SELECT p.id, p.nom, p.description, p.prix, p.prix_barre, p.images, p.en_stock, p.code_barre,
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
    if (req.body.images) {
      try {
        const parsedImages = typeof req.body.images === 'string' ? JSON.parse(req.body.images) : req.body.images;
        if (Array.isArray(parsedImages)) {
          images = parsedImages.filter(img => typeof img === 'string' && img.startsWith('http'));
        }
      } catch {}
    }
    if (req.body.image_url && typeof req.body.image_url === 'string' && req.body.image_url.startsWith('http')) {
      if (!images.includes(req.body.image_url)) images.push(req.body.image_url);
    }
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
    // Audit Log Creation
    enregistrerAuditLog(id, req.user.userId, req.user.nom || 'Marchand', 'produit_cree', `Création du produit "${r.rows[0].nom}"`, { produit_id: r.rows[0].id, prix: r.rows[0].prix }, req);

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
    
    // Audit Log Modification
    enregistrerAuditLog(id, req.user.userId, req.user.nom || 'Marchand', 'produit_modifie', `Modification du produit "${r.rows[0].nom}"`, { produit_id: prodId, stock_quantite: r.rows[0].stock_quantite }, req);

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

    const r = await pool.query('DELETE FROM boutique_produits WHERE id=$1 AND boutique_id=$2 RETURNING id, nom', [prodId, id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'Produit introuvable' });

    // Audit Log Deletion
    enregistrerAuditLog(id, req.user.userId, req.user.nom || 'Marchand', 'produit_supprime', `Suppression du produit "${r.rows[0].nom || prodId}"`, { produit_id: prodId }, req);

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

    const { nom, description, categorie, telephone, adresse, ville, whatsapp, site_web, facebook, instagram, slug: slugInput } = req.body;

    // Quotas configurables (Admin)
    const userRes = await pool.query('SELECT email, telephone FROM utilisateurs WHERE id=$1', [userId]);
    const currentUser = userRes.rows[0] || {};
    const inputTelRaw = telephone?.trim() || currentUser.telephone?.trim() || '';
    const userEmailRaw = (currentUser.email || '').trim().toLowerCase();

    const quotaCheck = await checkBoutiqueQuotas(userId, inputTelRaw, userEmailRaw);
    if (!quotaCheck.allowed) {
      return res.status(400).json({ error: quotaCheck.error });
    }

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
      `INSERT INTO boutiques (utilisateur_id, nom, description, categorie, telephone, adresse, ville, logo_url, apporteur_id, actif)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, true) RETURNING id`,
      [userId, nom.trim(), description||null, categorie||null, telephone||null,
       adresse||null, ville||'Dakar', logo_url, apporteurId]
    );
    const newId = r.rows[0].id;

    // UPDATE des colonnes avancées (ajoutées par migration — best-effort)
    try {
      const mode = ['hybride_pos', 'pure_player'].includes(req.body.mode_fonctionnement) ? req.body.mode_fonctionnement : 'hybride_pos';
      await pool.query(
        `UPDATE boutiques SET cover_url=$1, whatsapp=$2, site_web=$3, facebook=$4, instagram=$5, slug=$6, mode_fonctionnement=$7
         WHERE id=$8`,
        [cover_url||null, whatsapp||null, site_web||null, facebook||null, instagram||null, slug, mode, newId]
      );
    } catch (_) { /* colonnes pas encore migrées — ignoré */ }

    // Activer le plan découverte (1 mois gratuit) par défaut
    try {
      const essaiJours = await cfg.getNum('abonnement_essai_jours') || 30;
      await pool.query(
        `INSERT INTO abonnements (utilisateur_id, plan, statut, prix_mensuel, fin)
         VALUES ($1, 'decouverte', 'actif', 2500, NOW() + INTERVAL '1 day' * $2)`,
        [userId, essaiJours]
      );
    } catch (errAbo) {
      console.error('[BOUTIQUES POST] Erreur création abonnement:', errAbo.message);
    }

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

    // UPDATE colonnes avancées & fiscales
    try {
      const { regime_fiscal, prix_tva_incluse, timbre_fiscal_applicable, tva_taux_defaut,
              rccm, ninea, forme_juridique, capital_social, compte_bancaire, conditions_vente, pied_de_page_document,
              mode_fonctionnement, meta_pixel_id, tiktok_pixel_id, ga4_id, actif } = req.body;

      const parseBoolVal = (v) => {
        if (v === undefined || v === null || v === '') return null;
        return v === 'true' || v === true || v === 'on' || v === '1' || v === 1;
      };

      let rawMode = mode_fonctionnement;
      if (Array.isArray(rawMode)) rawMode = rawMode[0];
      const validMode = ['hybride_pos', 'pure_player'].includes(rawMode) ? rawMode : null;
      console.log('[BOUTIQUES PUT MODE]', req.params.id, 'rawMode:', rawMode, 'validMode:', validMode);

      await pool.query(
        `UPDATE boutiques SET cover_url=$1, whatsapp=$2, site_web=$3, facebook=$4,
         instagram=$5, horaires=$6, slug=$7,
         regime_fiscal=COALESCE($8, regime_fiscal),
         prix_tva_incluse=CASE WHEN $9::boolean IS NOT NULL THEN $9::boolean ELSE prix_tva_incluse END,
         timbre_fiscal_applicable=CASE WHEN $10::boolean IS NOT NULL THEN $10::boolean ELSE timbre_fiscal_applicable END,
         tva_taux_defaut=COALESCE($11, tva_taux_defaut),
         rccm=COALESCE($12, rccm),
         ninea=COALESCE($13, ninea),
         forme_juridique=COALESCE($14, forme_juridique),
         capital_social=COALESCE($15, capital_social),
         compte_bancaire=COALESCE($16, compte_bancaire),
         conditions_vente=COALESCE($17, conditions_vente),
         pied_de_page_document=COALESCE($18, pied_de_page_document),
         mode_fonctionnement=CASE WHEN $19::text IS NOT NULL THEN $19::text ELSE mode_fonctionnement END,
         meta_pixel_id=COALESCE($20, meta_pixel_id),
         tiktok_pixel_id=COALESCE($21, tiktok_pixel_id),
         ga4_id=COALESCE($22, ga4_id),
         actif=CASE WHEN $23::boolean IS NOT NULL THEN $23::boolean ELSE actif END
         WHERE id=$24`,
        [
          cover_url||null, whatsapp||null, site_web||null, facebook||null,
          instagram||null, horairesJson, newSlug,
          regime_fiscal || null,
          parseBoolVal(prix_tva_incluse),
          parseBoolVal(timbre_fiscal_applicable),
          tva_taux_defaut !== undefined && tva_taux_defaut !== '' ? Number(tva_taux_defaut) : null,
          rccm || null, ninea || null, forme_juridique || null, capital_social || null,
          compte_bancaire || null, conditions_vente || null, pied_de_page_document || null,
          validMode,
          meta_pixel_id?.trim() || null,
          tiktok_pixel_id?.trim() || null,
          ga4_id?.trim() || null,
          parseBoolVal(actif),
          req.params.id
        ]
      );
    } catch (e) {
      console.error('[BOUTIQUES PUT ADVANCED ERR]', e.message);
    }
    res.json({ success: true, slug: newSlug });
  } catch (err) {
    console.error('[BOUTIQUES PUT]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── PUT /api/boutiques/:id/statut — Activer ou désactiver la visibilité d'une boutique par le commerçant
router.put('/:id/statut', verifierToken, param('id').isUUID(), async (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(400).json({ error: 'ID invalide' });
  try {
    const boutique = await checkBoutiqueAccess(req.params.id, req.user.userId);
    if (!boutique) return res.status(404).json({ error: 'Boutique introuvable ou accès refusé' });
    
    const { actif } = req.body;
    const isActif = actif === true || actif === 'true' || actif === 1 || actif === '1';
    
    await pool.query('UPDATE boutiques SET actif = $1, updated_at = NOW() WHERE id = $2', [isActif, req.params.id]);
    res.json({ success: true, actif: isActif });
  } catch (err) {
    console.error('[BOUTIQUE_STATUT_ERR]', err);
    res.status(500).json({ error: 'Erreur lors du changement de visibilité de la boutique' });
  }
});

// ── PUT /api/boutiques/:id/mode — Modifier le mode d'exploitation (hybride_pos vs pure_player)
router.put('/:id/mode', verifierToken, param('id').isUUID(), async (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(400).json({ error: 'ID invalide' });
  const { mode_fonctionnement } = req.body;
  if (!mode_fonctionnement || !['hybride_pos', 'pure_player'].includes(mode_fonctionnement)) {
    return res.status(400).json({ error: "Mode d'exploitation invalide. Doit être 'hybride_pos' ou 'pure_player'." });
  }
  try {
    const boutique = await checkBoutiqueAccess(req.params.id, req.user.userId);
    if (!boutique) return res.status(404).json({ error: 'Boutique introuvable ou accès refusé' });

    await pool.query(
      `UPDATE boutiques SET mode_fonctionnement=$1, updated_at=NOW() WHERE id=$2`,
      [mode_fonctionnement, req.params.id]
    );

    res.json({
      succes: true,
      message: "Mode d'exploitation mis à jour avec succès.",
      mode_fonctionnement
    });
  } catch (err) {
    console.error('[BOUTIQUES MODE PUT ERR]', err);
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
    if (produits.length > 500) {
      return res.status(400).json({ error: 'La limite est de 500 produits par requête.' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const insere = [];
      for (const p of produits) {
        if (!p.nom?.trim() || p.prix === undefined || p.prix === null || isNaN(Number(p.prix))) continue;
        const images = p.images || (p.photo_defaut ? [p.photo_defaut] : []);
        const stockQty = p.quantite_stock !== undefined && p.quantite_stock !== null
          ? Number(p.quantite_stock)
          : (p.stock_quantite !== undefined && p.stock_quantite !== null ? Number(p.stock_quantite) : 1);

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
            stockQty,
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
    const { items, caissier, modePaiement, client_id, idempotency_key } = req.body;

    const isUUID = /^[0-9a-f-]{36}$/i.test(idParam);
    const bRes = await pool.query(
      `SELECT id, regime_fiscal, prix_tva_incluse, timbre_fiscal_applicable, tva_taux_defaut FROM boutiques WHERE ${isUUID ? 'id=$1' : 'slug=$1'}`,
      [idParam]
    );
    if (!bRes.rows[0]) return res.status(404).json({ error: 'Boutique introuvable' });
    const boutique = bRes.rows[0];
    const boutiqueId = boutique.id;
    const idempotencyKey = typeof idempotency_key === 'string' && idempotency_key.length > 0 && idempotency_key.length <= 128
      ? idempotency_key
      : null;

    // Une réponse peut être perdue après l'enregistrement d'une vente offline.
    // La même clé doit alors être reconnue avant toute nouvelle déduction de stock.
    if (idempotencyKey) {
      const existingSale = await pool.query(
        `SELECT reference FROM caisse_documents WHERE boutique_id = $1 AND reference = $2 LIMIT 1`,
        [boutiqueId, idempotencyKey]
      );
      if (existingSale.rows[0]) {
        return res.json({ success: true, duplicate: true, reference: existingSale.rows[0].reference });
      }
    }

    let client = null;
    if (client_id && /^[0-9a-f-]{36}$/i.test(client_id)) {
      const cRes = await pool.query(`SELECT id, nom, telephone, exonere_tva FROM caisse_clients_credits WHERE id=$1`, [client_id]);
      client = cRes.rows[0] || null;
    }

    if (Array.isArray(items) && items.length > 0) {
      const refVente = idempotencyKey || `POS-${Date.now().toString().slice(-6)}`;
      
      // Calcul fiscalité globale
      const calculation = calculerFiscaliteDocument(boutique, client, items);

      // Calcul timbre fiscal
      let timbre = 0;
      if (boutique.timbre_fiscal_applicable && (modePaiement === 'cash' || modePaiement === 'especes')) {
        timbre = Number((calculation.total_ttc * 0.01).toFixed(2));
        if (timbre > 5000) timbre = 5000;
      }

      // Calcul BRS
      let retenueBRS = 0;
      if (req.body.appliquer_brs) {
        retenueBRS = Number((calculation.total_ht * 0.01).toFixed(2));
      }

      const netAPayer = calculation.total_ttc + timbre - retenueBRS;

      // ── TRANSACTION ATOMIQUE : stock + ventes + commandes + facture + session ──
      const dbClient = await pool.connect();
      try {
        await dbClient.query('BEGIN');

        for (const item of calculation.items) {
          const qte = Number(item.quantite || 1);

          // 1. Décrémenter le stock dans la base PostgreSQL
          let pRes = null;
          if (item.id && /^[0-9a-f-]{36}$/i.test(item.id)) {
            pRes = await dbClient.query(
              `UPDATE boutique_produits
               SET stock_quantite = GREATEST(0, COALESCE(stock_quantite, 10) - $1),
                   en_stock = (GREATEST(0, COALESCE(stock_quantite, 10) - $1) > 0)
               WHERE id = $2 AND boutique_id = $3
               RETURNING id, nom, prix, stock_quantite`,
              [qte, item.id, boutiqueId]
            );
          }

          if (!pRes?.rows[0] && item.nom) {
            pRes = await dbClient.query(
              `UPDATE boutique_produits
               SET stock_quantite = GREATEST(0, COALESCE(stock_quantite, 10) - $1),
                   en_stock = (GREATEST(0, COALESCE(stock_quantite, 10) - $1) > 0)
               WHERE LOWER(nom) = LOWER($2) AND boutique_id = $3
               RETURNING id, nom, prix, stock_quantite`,
              [qte, item.nom.trim(), boutiqueId]
            );
          }

          const nomProduit = item.nom || pRes?.rows[0]?.nom || 'Article POS';
          const prixUnitaire = Number(item.prix_unitaire || pRes?.rows[0]?.prix || 0);
          const totalLigne = prixUnitaire * qte;
          const prodIdReal = pRes?.rows[0]?.id || (item.id && /^[0-9a-f-]{36}$/i.test(item.id) ? item.id : null);

          // 2. Insérer dans la table des ventes pour la Comptabilité & Analytics
          await dbClient.query(
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

          // 3. Insérer dans le journal des commandes_boutique
          await dbClient.query(
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
        }

        // 4. Insérer dans caisse_documents (Facture Payée) — avec ON CONFLICT pour double sécurité idempotence
        await dbClient.query(
          `INSERT INTO caisse_documents (
            boutique_id, client_id, caissier_id, type, reference, statut,
            total_ht, total_tva, timbre_fiscal, retenue_brs, total_ttc, net_a_payer,
            mode_paiement, notes, items, created_at, updated_at
          ) VALUES ($1, $2, null, 'facture', $3, 'paye', $4, $5, $6, $7, $8, $9, $10, 'Vente directe caisse POS', $11, NOW(), NOW())
          ON CONFLICT (reference) DO NOTHING`,
          [
            boutiqueId, client_id || null, refVente,
            calculation.total_ht, calculation.total_tva, timbre, retenueBRS, calculation.total_ttc, netAPayer,
            modePaiement || 'cash', JSON.stringify(calculation.items)
          ]
        );

        // 5. Mettre à jour la session active de caisse de la boutique si elle existe
        const activeSessionRes = await dbClient.query(
          `SELECT id FROM boutique_pos_sessions WHERE boutique_id = $1 AND statut = 'ouverte' ORDER BY date_ouverture DESC LIMIT 1`,
          [boutiqueId]
        );
        if (activeSessionRes.rows[0]) {
          const activeSessionId = activeSessionRes.rows[0].id;
          const mode = (modePaiement || 'cash').toLowerCase();

          await dbClient.query(
            `UPDATE boutique_pos_sessions
             SET ventes_total = COALESCE(ventes_total, 0) + $1,
                 ventes_especes = COALESCE(ventes_especes, 0) + $2,
                 ventes_wave = COALESCE(ventes_wave, 0) + $3,
                 ventes_orange_money = COALESCE(ventes_orange_money, 0) + $4,
                 ventes_carte = COALESCE(ventes_carte, 0) + $5,
                 nb_ventes = COALESCE(nb_ventes, 0) + 1
             WHERE id = $6`,
            [
              calculation.total_ttc,
              mode === 'cash' || mode === 'especes' || mode === 'espece' ? calculation.total_ttc : 0,
              mode === 'wave' ? calculation.total_ttc : 0,
              mode === 'orange_money' || mode === 'orange' ? calculation.total_ttc : 0,
              mode === 'carte' ? calculation.total_ttc : 0,
              activeSessionId
            ]
          );
        }

        await dbClient.query('COMMIT');
      } catch (txErr) {
        await dbClient.query('ROLLBACK');
        console.error('[POS VENTE TX ROLLBACK]', txErr.message);
        throw txErr;
      } finally {
        dbClient.release();
      }
    }

    res.status(201).json({ success: true, message: 'Stock, Comptabilité et Facture POS sauvegardés' });
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

// POST /api/boutiques/:id/caissiers — Créer caissier (Business VIP requis)
router.post('/:id/caissiers', verifierToken, checkAbonnement, requireBusiness, async (req, res) => {
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

    enregistrerAuditLog(bq.id, req.user.userId, req.user.nom || 'Marchand', 'caissier_cree', `Création du caissier POS "${r.rows[0].prenom || ''} ${r.rows[0].nom}".trim()`, { caissier_id: r.rows[0].id, role: r.rows[0].role }, req);

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

    enregistrerAuditLog(bq.id, req.user.userId, req.user.nom || 'Marchand', 'caissier_modifie', `Modification du caissier POS "${r.rows[0].nom}"`, { caissier_id: req.params.caissierId }, req);

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

    enregistrerAuditLog(bq.id, req.user.userId, req.user.nom || 'Marchand', 'caissier_supprime', `Suppression du caissier POS #${req.params.caissierId}`, { caissier_id: req.params.caissierId }, req);

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

    // Enregistrement dans le Journal d'Audit & Sécurité
    await enregistrerAuditLog(
      boutiqueId,
      req.user?.userId,
      caissierNom || 'Caissier',
      'pos_session',
      `Ouverture de session de caisse POS par ${caissierNom || 'Caissier'} (Fond initial: ${fondDeCaisse || 0} FCFA)`,
      { fondDeCaisse, caissierNom, caissierId, sessionId: r.rows[0]?.id },
      req
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
    const { sessionId, especesComptees, ventesEspeces, ventesWave, ventesOrangeMoney, ventesCarte, ventesTotal, nbVentes, caissierNom } = req.body;
    const isUUID = /^[0-9a-f-]{36}$/i.test(idParam);
    const bRes = await pool.query(`SELECT id FROM boutiques WHERE ${isUUID ? 'id=$1' : 'slug=$1'}`, [idParam]);
    if (!bRes.rows[0]) return res.status(404).json({ error: 'Boutique introuvable' });
    const boutiqueId = bRes.rows[0].id;

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

      // Enregistrement dans le Journal d'Audit & Sécurité
      await enregistrerAuditLog(
        boutiqueId,
        req.user?.userId,
        caissierNom || 'Caissier',
        'pos_session',
        `Clôture Z de la session de caisse POS par ${caissierNom || 'Caissier'} (Espèces comptées: ${especesComptees || 0} FCFA, Ventes totales: ${ventesTotal || 0} FCFA, Tickets: ${nbVentes || 0})`,
        { sessionId, especesComptees, ventesTotal, nbVentes, caissierNom },
        req
      );
    }

    res.json({ success: true, message: 'Session clôturée avec succès' });
  } catch (err) {
    console.error('[POST POS SESSION CLOTURER ERR]', err);
    res.status(500).json({ error: 'Erreur lors de la clôture de session' });
  }
});

// POST /api/boutiques/:id/pos-sessions/rapport-x/log
router.post('/:id/pos-sessions/rapport-x/log', tokenOptional, async (req, res) => {
  try {
    const idParam = req.params.id;
    const { caissierNom, totalVentes, nbVentes } = req.body;
    const isUUID = /^[0-9a-f-]{36}$/i.test(idParam);
    const bRes = await pool.query(`SELECT id FROM boutiques WHERE ${isUUID ? 'id=$1' : 'slug=$1'}`, [idParam]);
    if (!bRes.rows[0]) return res.status(404).json({ error: 'Boutique introuvable' });
    const boutiqueId = bRes.rows[0].id;

    await enregistrerAuditLog(
      boutiqueId,
      req.user?.userId,
      caissierNom || 'Caissier',
      'pos_session',
      `Consultation / Impression du Bilan de Session Rapport X (Caissier: ${caissierNom || 'Caissier'}, CA cumulé: ${totalVentes || 0} FCFA, Tickets: ${nbVentes || 0})`,
      { caissierNom, totalVentes, nbVentes },
      req
    );

    res.json({ success: true });
  } catch (err) {
    console.error('[POST POS SESSION RAPPORT-X LOG ERR]', err);
    res.status(500).json({ error: 'Erreur journalisation Rapport X' });
  }
});

// --- HELPER CALCUL FISCALITÉ ---
function calculerFiscaliteDocument(boutique, client, items) {
  const regime = boutique.regime_fiscal || 'reel';
  const tvaIncluse = boutique.prix_tva_incluse !== false;
  const tvaDefaut = Number(boutique.tva_taux_defaut ?? 18.00);
  
  let totalHT = 0;
  let totalTVA = 0;
  
  const processedItems = items.map(item => {
    const qte = Number(item.quantite || 1);
    const prix = Number(item.prix || 0);
    const itemTvaTaux = item.tva_taux !== undefined && item.tva_taux !== null ? Number(item.tva_taux) : tvaDefaut;
    
    let HT = 0;
    let TVA = 0;
    let TTC = 0;
    
    if (regime === 'non_assujetti' || regime === 'exonere' || (client && client.exonere_tva)) {
      TTC = prix;
      HT = prix;
      TVA = 0;
    } else {
      if (tvaIncluse) {
        TTC = prix;
        HT = TTC / (1 + (itemTvaTaux / 100));
        TVA = TTC - HT;
      } else {
        HT = prix;
        TVA = HT * (itemTvaTaux / 100);
        TTC = HT + TVA;
      }
    }
    
    totalHT += HT * qte;
    totalTVA += TVA * qte;
    
    const validId = (item.id && /^[0-9a-f-]{36}$/i.test(String(item.id))) ? String(item.id) : null;
    return {
      id: validId,
      nom: item.nom || 'Article',
      quantite: qte,
      prix_unitaire: prix,
      prix_ht: Number(HT.toFixed(2)),
      tva_taux: itemTvaTaux,
      tva_montant: Number(TVA.toFixed(2)),
      total_ligne: Number((TTC * qte).toFixed(2))
    };
  });
  
  const totalTTC = totalHT + totalTVA;
  
  return {
    items: processedItems,
    total_ht: Number(totalHT.toFixed(2)),
    total_tva: Number(totalTVA.toFixed(2)),
    total_ttc: Number(totalTTC.toFixed(2))
  };
}

// ── GET /api/boutiques/:id/documents — Lister les documents
router.get('/:id/documents', tokenOptional, param('id').isUUID(), async (req, res) => {
  try {
    const idParam = req.params.id;
    const { type } = req.query; // 'devis', 'proforma', 'bon_commande_client', 'facture'
    const isUUID = /^[0-9a-f-]{36}$/i.test(idParam);
    const bRes = await pool.query(`SELECT id FROM boutiques WHERE ${isUUID ? 'id=$1' : 'slug=$1'}`, [idParam]);
    if (!bRes.rows[0]) return res.status(404).json({ error: 'Boutique introuvable' });
    const boutiqueId = bRes.rows[0].id;

    let query = `
      SELECT d.*, c.nom as client_nom, c.telephone as client_telephone
      FROM caisse_documents d
      LEFT JOIN caisse_clients_credits c ON d.client_id = c.id
      WHERE d.boutique_id = $1
    `;
    const params = [boutiqueId];

    if (type) {
      params.push(type);
      query += ` AND d.type = $2`;
    }
    query += ` ORDER BY d.created_at DESC LIMIT 200`;

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('[GET DOCUMENTS ERR]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── POST /api/boutiques/:id/documents — Créer un document (devis, proforma, facture)
router.post('/:id/documents', tokenOptional, param('id').isUUID(), async (req, res) => {
  try {
    const idParam = req.params.id;
    const { type, client_id, caissier_id, statut, items, mode_paiement, date_echeance, notes } = req.body;
    
    const isUUID = /^[0-9a-f-]{36}$/i.test(idParam);
    const bRes = await pool.query(
      `SELECT id, regime_fiscal, prix_tva_incluse, timbre_fiscal_applicable, tva_taux_defaut FROM boutiques WHERE ${isUUID ? 'id=$1' : 'slug=$1'}`,
      [idParam]
    );
    if (!bRes.rows[0]) return res.status(404).json({ error: 'Boutique introuvable' });
    const boutique = bRes.rows[0];
    const boutiqueId = boutique.id;

    let client = null;
    if (client_id && /^[0-9a-f-]{36}$/i.test(client_id)) {
      const cRes = await pool.query(`SELECT id, nom, telephone, exonere_tva FROM caisse_clients_credits WHERE id=$1`, [client_id]);
      client = cRes.rows[0] || null;
    }

    const calculation = calculerFiscaliteDocument(boutique, client, items || []);

    // Calcul timbre fiscal (1% max 5000 FCFA, disons 1% du TTC si payé en cash)
    let timbre = 0;
    if (boutique.timbre_fiscal_applicable && (mode_paiement === 'cash' || mode_paiement === 'especes')) {
      timbre = Number((calculation.total_ttc * 0.01).toFixed(2));
      if (timbre > 5000) timbre = 5000;
    }

    // Calcul BRS
    let retenueBRS = 0;
    if (req.body.appliquer_brs) {
      retenueBRS = Number((calculation.total_ht * 0.01).toFixed(2));
    }

    const netAPayer = calculation.total_ttc + timbre - retenueBRS;

    const prefix = type === 'devis' ? 'DEV' : type === 'proforma' ? 'PRO' : type === 'bon_commande_client' ? 'CMD' : 'FAC';
    const reference = `${prefix}-${Date.now().toString().slice(-8)}`;

    const r = await pool.query(
      `INSERT INTO caisse_documents (
        boutique_id, client_id, caissier_id, type, reference, statut,
        total_ht, total_tva, timbre_fiscal, retenue_brs, total_ttc, net_a_payer,
        mode_paiement, date_echeance, notes, items, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
      RETURNING *`,
      [
        boutiqueId, client_id || null, caissier_id || null, type, reference, statut || 'brouillon',
        calculation.total_ht, calculation.total_tva, timbre, retenueBRS, calculation.total_ttc, netAPayer,
        mode_paiement || 'cash', date_echeance || null, notes || null, JSON.stringify(calculation.items)
      ]
    );

    // Si c'est une facture validée/payée, déduire le stock pour les produits du catalogue
    if (type === 'facture' && (statut === 'paye' || statut === 'valide')) {
      for (const item of calculation.items) {
        if (item.id && /^[0-9a-f-]{36}$/i.test(String(item.id))) {
          await pool.query(
            `UPDATE boutique_produits SET stock_quantite = GREATEST(0, COALESCE(stock_quantite, 0) - $1) WHERE id = $2`,
            [Number(item.quantite), item.id]
          );
        }
      }
    }

    enregistrerAuditLog(
      boutiqueId,
      req.user?.userId || null,
      req.user?.nom || null,
      'document_cree',
      `Création du document ${r.rows[0].type.toUpperCase()} #${r.rows[0].reference} (${r.rows[0].total_ttc} FCFA)`,
      { reference: r.rows[0].reference, type: r.rows[0].type, total_ttc: r.rows[0].total_ttc, statut: r.rows[0].statut },
      req
    );

    res.status(201).json(r.rows[0]);
  } catch (err) {
    console.error('[POST CAISSE DOCUMENT ERR]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── PUT /api/boutiques/:id/documents/:docId — Modifier ou valider
router.put('/:id/documents/:docId', tokenOptional, param('id').isUUID(), param('docId').isUUID(), async (req, res) => {
  try {
    const { id: boutiqueId, docId } = req.params;
    const { statut, type, client_id, caissier_id, items, mode_paiement, date_echeance, notes } = req.body;

    const docRes = await pool.query(`SELECT * FROM caisse_documents WHERE id=$1 AND boutique_id=$2`, [docId, boutiqueId]);
    if (!docRes.rows[0]) return res.status(404).json({ error: 'Document introuvable' });
    const oldDoc = docRes.rows[0];

    const newType = type || oldDoc.type;
    const newStatut = statut || oldDoc.statut;
    const newClientId = client_id !== undefined ? client_id : oldDoc.client_id;
    const newItems = items !== undefined ? items : (typeof oldDoc.items === 'string' ? JSON.parse(oldDoc.items) : oldDoc.items);

    // Get boutique details for calculation
    const bRes = await pool.query(
      `SELECT id, regime_fiscal, prix_tva_incluse, timbre_fiscal_applicable, tva_taux_defaut FROM boutiques WHERE id=$1`,
      [boutiqueId]
    );
    if (!bRes.rows[0]) return res.status(404).json({ error: 'Boutique introuvable' });
    const boutique = bRes.rows[0];

    let client = null;
    if (newClientId && /^[0-9a-f-]{36}$/i.test(newClientId)) {
      const cRes = await pool.query(`SELECT id, nom, telephone, exonere_tva FROM caisse_clients_credits WHERE id=$1`, [newClientId]);
      client = cRes.rows[0] || null;
    }

    const calculation = calculerFiscaliteDocument(boutique, client, newItems || []);

    let timbre = 0;
    const currentModePaiement = mode_paiement || oldDoc.mode_paiement;
    if (boutique.timbre_fiscal_applicable && (currentModePaiement === 'cash' || currentModePaiement === 'especes')) {
      timbre = Number((calculation.total_ttc * 0.01).toFixed(2));
      if (timbre > 5000) timbre = 5000;
    }

    let retenueBRS = 0;
    if (req.body.appliquer_brs !== undefined ? req.body.appliquer_brs : (oldDoc.retenue_brs > 0)) {
      retenueBRS = Number((calculation.total_ht * 0.01).toFixed(2));
    }

    const netAPayer = calculation.total_ttc + timbre - retenueBRS;

    await pool.query(
      `UPDATE caisse_documents
       SET type = $1, statut = $2, client_id = $3, caissier_id = $4, mode_paiement = $5, date_echeance = $6, notes = $7,
           total_ht = $8, total_tva = $9, timbre_fiscal = $10, retenue_brs = $11, total_ttc = $12, net_a_payer = $13,
           items = $14, updated_at = NOW()
       WHERE id = $15`,
      [
        newType, newStatut, newClientId || null, caissier_id || oldDoc.caissier_id, currentModePaiement, date_echeance || oldDoc.date_echeance, notes || oldDoc.notes,
        calculation.total_ht, calculation.total_tva, timbre, retenueBRS, calculation.total_ttc, netAPayer,
        JSON.stringify(calculation.items), docId
      ]
    );

    // Déduire les stocks si transition vers Facture Validée/Payée
    const oldIsBilling = oldDoc.type === 'facture' && (oldDoc.statut === 'paye' || oldDoc.statut === 'valide');
    const newIsBilling = newType === 'facture' && (newStatut === 'paye' || newStatut === 'valide');

    if (!oldIsBilling && newIsBilling) {
      for (const item of calculation.items) {
        if (item.id && /^[0-9a-f-]{36}$/i.test(String(item.id))) {
          await pool.query(
            `UPDATE boutique_produits SET stock_quantite = GREATEST(0, COALESCE(stock_quantite, 0) - $1) WHERE id = $2`,
            [Number(item.quantite), item.id]
          );
        }
      }
    }

    enregistrerAuditLog(
      boutiqueId,
      req.user?.userId || null,
      req.user?.nom || null,
      'document_modifie',
      `Modification du document ${newType.toUpperCase()} #${oldDoc.reference} (Statut: ${newStatut})`,
      { reference: oldDoc.reference, type: newType, statut: newStatut },
      req
    );

    res.json({ success: true, message: 'Document mis à jour avec succès' });
  } catch (err) {
    console.error('[PUT DOCUMENT ERR]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── DELETE /api/boutiques/:id/documents/:docId — Annuler/Supprimer
router.delete('/:id/documents/:docId', tokenOptional, param('id').isUUID(), param('docId').isUUID(), async (req, res) => {
  try {
    const { id: boutiqueId, docId } = req.params;
    const docRes = await pool.query(`SELECT id, reference, type, statut, items FROM caisse_documents WHERE id=$1 AND boutique_id=$2`, [docId, boutiqueId]);
    if (!docRes.rows[0]) return res.status(404).json({ error: 'Document introuvable' });
    const doc = docRes.rows[0];

    // Remettre le stock si la facture était validée/payée
    if (doc.type === 'facture' && (doc.statut === 'paye' || doc.statut === 'valide')) {
      const items = typeof doc.items === 'string' ? JSON.parse(doc.items) : doc.items;
      for (const item of items) {
        if (item.id && /^[0-9a-f-]{36}$/i.test(String(item.id))) {
          await pool.query(
            `UPDATE boutique_produits SET stock_quantite = COALESCE(stock_quantite, 0) + $1 WHERE id = $2`,
            [Number(item.quantite), item.id]
          );
        }
      }
    }

    await pool.query(`DELETE FROM caisse_documents WHERE id = $1`, [docId]);

    enregistrerAuditLog(
      boutiqueId,
      req.user?.userId || null,
      req.user?.nom || null,
      'document_supprime',
      `Suppression du document ${doc.type.toUpperCase()} #${doc.reference || doc.id}`,
      { reference: doc.reference, type: doc.type, statut: doc.statut },
      req
    );

    res.json({ success: true, message: 'Document supprimé et stocks réajustés' });
  } catch (err) {
    console.error('[DELETE DOCUMENT ERR]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── GET /api/boutiques/:id/bons-achat/:code — Vérifier avoir
router.get('/:id/bons-achat/:code', tokenOptional, param('id').isUUID(), async (req, res) => {
  try {
    const { id: boutiqueId, code } = req.params;
    const r = await pool.query(
      `SELECT * FROM caisse_bons_achat WHERE boutique_id=$1 AND code=$2 AND actif=true AND (date_expiration IS NULL OR date_expiration >= CURRENT_DATE)`,
      [boutiqueId, code.trim()]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Bon d’achat invalide ou expiré' });
    res.json(r.rows[0]);
  } catch (err) {
    console.error('[GET BON ACHAT ERR]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── POST /api/boutiques/:id/bons-achat — Émettre avoir
router.post('/:id/bons-achat', tokenOptional, param('id').isUUID(), async (req, res) => {
  try {
    const { id: boutiqueId } = req.params;
    const { client_id, valeur, code, date_expiration } = req.body;

    const uniqueCode = code || `AVOIR-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const r = await pool.query(
      `INSERT INTO caisse_bons_achat (boutique_id, client_id, code, valeur_initiale, solde_restant, date_expiration)
       VALUES ($1, $2, $3, $4, $4, $5) RETURNING *`,
      [boutiqueId, client_id || null, uniqueCode, Number(valeur), date_expiration || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    console.error('[POST BON ACHAT ERR]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── CRUD Fournisseurs
router.get('/:id/fournisseurs', tokenOptional, param('id').isUUID(), async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM fournisseurs WHERE boutique_id = $1 ORDER BY nom ASC`, [req.params.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/:id/fournisseurs', tokenOptional, param('id').isUUID(), async (req, res) => {
  try {
    const { nom, telephone, email, adresse, ninea } = req.body;
    const r = await pool.query(
      `INSERT INTO fournisseurs (boutique_id, nom, telephone, email, adresse, ninea)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.params.id, nom, telephone || null, email || null, adresse || null, ninea || null]
    );

    enregistrerAuditLog(req.params.id, req.user?.userId || null, req.user?.nom || null, 'fournisseur_cree', `Création du fournisseur "${nom}"`, { nom, telephone, email }, req);

    res.status(201).json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/:id/fournisseurs/:fId', tokenOptional, param('id').isUUID(), param('fId').isUUID(), async (req, res) => {
  try {
    const { nom, telephone, email, adresse, ninea, solde_du } = req.body;
    await pool.query(
      `UPDATE fournisseurs
       SET nom = $1, telephone = $2, email = $3, adresse = $4, ninea = $5, solde_du = $6
       WHERE id = $7 AND boutique_id = $8`,
      [nom, telephone, email, adresse, ninea, solde_du !== undefined ? Number(solde_du) : 0, req.params.fId, req.params.id]
    );

    enregistrerAuditLog(req.params.id, req.user?.userId || null, req.user?.nom || null, 'fournisseur_modifie', `Modification du fournisseur "${nom}"`, { nom, solde_du }, req);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/:id/fournisseurs/:fId', tokenOptional, param('id').isUUID(), param('fId').isUUID(), async (req, res) => {
  try {
    await pool.query(`DELETE FROM fournisseurs WHERE id = $1 AND boutique_id = $2`, [req.params.fId, req.params.id]);

    enregistrerAuditLog(req.params.id, req.user?.userId || null, req.user?.nom || null, 'fournisseur_supprime', `Suppression du fournisseur #${req.params.fId}`, {}, req);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── CRUD Commandes Fournisseurs
router.get('/:id/commandes-fournisseurs', tokenOptional, param('id').isUUID(), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.*, f.nom as fournisseur_nom
       FROM bons_commande_fournisseur c
       JOIN fournisseurs f ON c.fournisseur_id = f.id
       WHERE c.boutique_id = $1 ORDER BY c.created_at DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/:id/commandes-fournisseurs', tokenOptional, param('id').isUUID(), async (req, res) => {
  try {
    const { fournisseur_id, items, date_livraison, justificatif_url } = req.body;
    const itemsArray = Array.isArray(items) ? items : [];
    const total = itemsArray.reduce((acc, item) => acc + (Number(item.prix_achat || item.prixAchat || 0) * Number(item.quantite || 1)), 0);
    const reference = `CMD-FOURN-${Date.now().toString().slice(-8)}`;

    const r = await pool.query(
      `INSERT INTO bons_commande_fournisseur (boutique_id, fournisseur_id, reference, items, montant_total, date_livraison, justificatif_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.params.id, fournisseur_id, reference, JSON.stringify(itemsArray), total, date_livraison || null, justificatif_url || null]
    );

    enregistrerAuditLog(req.params.id, req.user?.userId || null, req.user?.nom || null, 'commande_fournisseur_creee', `Création d'un bon de commande fournisseur #${reference} (${total} FCFA)`, { reference, montant: total }, req);

    res.status(201).json(r.rows[0]);
  } catch (err) {
    console.error('[POST CMD FOURN ERR]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/:id/commandes-fournisseurs/:cId', tokenOptional, param('id').isUUID(), param('cId').isUUID(), async (req, res) => {
  try {
    const { statut, date_livraison, fournisseur_id, items, justificatif_url } = req.body;
    const { id: boutiqueId, cId } = req.params;

    const cmdRes = await pool.query(`SELECT * FROM bons_commande_fournisseur WHERE id=$1 AND boutique_id=$2`, [cId, boutiqueId]);
    if (!cmdRes.rows[0]) return res.status(404).json({ error: 'Commande introuvable' });
    const cmd = cmdRes.rows[0];

    const currentStatut = cmd.statut;
    const itemsArray = items !== undefined ? (Array.isArray(items) ? items : []) : null;
    const total = itemsArray ? itemsArray.reduce((acc, item) => acc + (Number(item.prix_achat || item.prixAchat || 0) * Number(item.quantite || 1)), 0) : Number(cmd.montant_total);

    await pool.query(
      `UPDATE bons_commande_fournisseur
       SET statut = COALESCE($1, statut),
           date_livraison = COALESCE($2, date_livraison),
           fournisseur_id = COALESCE($3, fournisseur_id),
           items = COALESCE($4, items),
           montant_total = $5,
           justificatif_url = COALESCE($6, justificatif_url),
           updated_at = NOW()
       WHERE id = $7`,
      [
        statut || null,
        date_livraison || null,
        fournisseur_id || null,
        itemsArray ? JSON.stringify(itemsArray) : null,
        total,
        justificatif_url || null,
        cId
      ]
    );

    const isTargetRecu = statut === 'recu' || statut === 'recue';
    const isAlreadyRecu = currentStatut === 'recu' || currentStatut === 'recue';

    // Stock & dépenses automatiques si reçue
    if (!isAlreadyRecu && isTargetRecu) {
      const activeItems = itemsArray || (typeof cmd.items === 'string' ? JSON.parse(cmd.items) : cmd.items);
      for (const item of activeItems) {
        if (item.id) {
          await pool.query(
            `UPDATE boutique_produits
             SET stock_quantite = COALESCE(stock_quantite, 0) + $1, en_stock = true
             WHERE id = $2 AND boutique_id = $3`,
            [Number(item.quantite), item.id, boutiqueId]
          );
        } else if (item.nom) {
          await pool.query(
            `UPDATE boutique_produits
             SET stock_quantite = COALESCE(stock_quantite, 0) + $1, en_stock = true
             WHERE LOWER(nom) = LOWER($2) AND boutique_id = $3`,
            [Number(item.quantite), item.nom.trim(), boutiqueId]
          );
        }
      }

      const justUrl = justificatif_url || cmd.justificatif_url || null;
      await pool.query(
        `INSERT INTO depenses (boutique_id, montant, categorie, description, date_depense, justificatif_url, bon_commande_id)
         VALUES ($1, $2, 'achat_marchandises', $3, CURRENT_DATE, $4, $5)`,
        [boutiqueId, total, `Achat fournisseur réf: ${cmd.reference}`, justUrl, cId]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error('[PUT CMD FOURN ERR]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── POST /api/boutiques/:id/upload-justificatif — Téléverser une pièce justificative (Facture / Reçu PDF ou image)
const uploadJustificatifAchat = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.post('/:id/upload-justificatif', tokenOptional, param('id').isUUID(), uploadJustificatifAchat.single('justificatif'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Fichier manquant' });
    const url = await uploadBuffer(req.file.buffer, 'justificatifs_achats');
    res.json({ url });
  } catch (err) {
    console.error('[UPLOAD JUSTIFICATIF ERR]', err);
    res.status(500).json({ error: 'Erreur lors du téléchargement du fichier' });
  }
});

// ── GET /api/boutiques/:id/documents/:docId/pdf — Générer le PDF A4 du document (Facture, Devis, Proforma)
router.get('/:id/documents/:docId/pdf', tokenOptional, param('id').isUUID(), param('docId').isUUID(), async (req, res) => {
  try {
    const boutiqueId = req.params.id;
    const docId = req.params.docId;

    const bRes = await pool.query('SELECT * FROM boutiques WHERE id=$1', [boutiqueId]);
    const boutique = bRes.rows[0];
    if (!boutique) return res.status(404).json({ error: 'Boutique introuvable' });

    const dRes = await pool.query('SELECT * FROM caisse_documents WHERE id=$1 AND boutique_id=$2', [docId, boutiqueId]);
    const document = dRes.rows[0];
    if (!document) return res.status(404).json({ error: 'Document introuvable' });

    let client = null;
    if (document.client_id) {
      const cRes = await pool.query('SELECT * FROM caisse_clients_credits WHERE id=$1', [document.client_id]);
      client = cRes.rows[0] || null;
    }

    const PDFDocument = require('pdfkit');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${document.type}-${document.reference}.pdf"`);

    const NAVY  = '#1e3a5f';
    const ORANGE = '#C75B00';
    const GRAY  = '#6b7280';
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    doc.pipe(res);

    // Helper de nettoyage de texte (nettoie les \r de Windows qui créent des "Đ" parasite dans PDFKit)
    const cleanText = (str) => String(str || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();

    // Formatter FCFA — espace normal (pas insécable) pour compatibilité PDFKit
    const fmtNum = (n) => {
      const num = Number(n || 0);
      const fixed = num % 1 === 0 ? num.toString() : num.toFixed(2);
      const [entier, decimale] = fixed.split('.');
      const milliers = entier.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      return decimale ? `${milliers},${decimale}` : milliers;
    };

    // ── En-tête émetteur (gauche) ───────────────────────────────────────
    const headerTop = 50;
    doc.fillColor(NAVY).fontSize(20).font('Helvetica-Bold')
       .text(boutique.nom, 50, headerTop);
    doc.fontSize(10).font('Helvetica').fillColor(GRAY);
    let infoY = headerTop + 26;
    if (boutique.forme_juridique) {
      let juridique = boutique.forme_juridique;
      if (boutique.capital_social) juridique += ` — Capital : ${boutique.capital_social}`;
      doc.text(juridique, 50, infoY);
      infoY += 14;
    }
    if (boutique.adresse) {
      doc.text(boutique.adresse, 50, infoY);
      infoY += 14;
    }
    if (boutique.telephone) {
      doc.text(`Tél : ${boutique.telephone}`, 50, infoY);
      infoY += 14;
    }
    if (boutique.rccm) {
      doc.text(`RCCM : ${boutique.rccm}`, 50, infoY);
      infoY += 14;
    }
    if (boutique.ninea) {
      doc.text(`NINEA : ${boutique.ninea}`, 50, infoY);
      infoY += 14;
    }

    // Ligne séparatrice
    doc.moveTo(50, infoY + 6)
       .lineTo(545, infoY + 6)
       .strokeColor(NAVY).lineWidth(1.5).stroke();

    doc.moveDown(3);

    // ── Titre Document ───────────────────────────────────────────────────
    const docY = Math.max(doc.y + 10, infoY + 20);
    const typeFmt = document.type === 'devis' ? 'DEVIS' : document.type === 'proforma' ? 'FACTURE PROFORMA' : 'FACTURE DE VENTE';
    doc.fillColor(NAVY).fontSize(22).font('Helvetica-Bold').text(typeFmt, 50, docY);
    doc.fillColor(GRAY).fontSize(10).font('Helvetica')
       .text(`Réf : ${document.reference}`, 50, docY + 28)
       .text(`Date : ${new Date(document.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`, 50, docY + 42);
    if (document.date_echeance) {
      doc.text(`Échéance : ${new Date(document.date_echeance).toLocaleDateString('fr-FR')}`, 50, docY + 56);
    }

    // Bloc destinataire (droite)
    if (client) {
      doc.fillColor(NAVY).fontSize(11).font('Helvetica-Bold').text('Destinataire', 350, docY);
      doc.fillColor('#374151').fontSize(10).font('Helvetica')
         .text(client.nom, 350, docY + 16);
      let clientInfoY = docY + 30;
      if (client.telephone) {
        doc.text(`Tél : ${client.telephone}`, 350, clientInfoY);
        clientInfoY += 14;
      }
      if (client.adresse) {
        doc.text(client.adresse, 350, clientInfoY);
        clientInfoY += 14;
      }
      if (client.ninea) {
        doc.text(`NINEA : ${client.ninea}`, 350, clientInfoY);
      }
    } else {
      doc.fillColor(NAVY).fontSize(11).font('Helvetica-Bold').text('Destinataire', 350, docY);
      doc.fillColor('#374151').fontSize(10).font('Helvetica')
         .text('Client Passant (Anonyme)', 350, docY + 16);
    }

    doc.moveDown(4);

    // ── Tableau des items ──────────────────────────────────────────────────
    const tableTop = Math.max(doc.y + 15, docY + 75);
    const col = { desc: 50, qty: 310, pu: 370, total: 450 };

    doc.rect(50, tableTop, 495, 24).fill(NAVY);
    doc.fillColor('#fff').fontSize(10).font('Helvetica-Bold');
    doc.text('Désignation',       col.desc + 6, tableTop + 7, { width: 250 });
    doc.text('Qté',              col.qty,       tableTop + 7, { width: 50, align: 'right' });
    doc.text('P.U. (FCFA)',      col.pu,        tableTop + 7, { width: 70, align: 'right' });
    doc.text('Total (FCFA)',     col.total,     tableTop + 7, { width: 90, align: 'right' });

    let currentY = tableTop + 24;
    const itemsList = Array.isArray(document.items) ? document.items : JSON.parse(document.items || '[]');

    itemsList.forEach((item, idx) => {
      const bg = idx % 2 === 0 ? '#f8fafc' : '#ffffff';
      doc.rect(50, currentY, 495, 28).fill(bg);
      doc.fillColor('#111').fontSize(10).font('Helvetica');
      const puItem = Number(item.prix_unitaire || item.prix || 0);
      const qteItem = Number(item.quantite || 1);
      doc.text(item.nom || 'Article', col.desc + 6, currentY + 9, { width: 250 });
      doc.text(String(qteItem), col.qty, currentY + 9, { width: 50, align: 'right' });
      doc.text(fmtNum(puItem), col.pu, currentY + 9, { width: 70, align: 'right' });
      doc.text(fmtNum(puItem * qteItem), col.total, currentY + 9, { width: 90, align: 'right' });
      currentY += 28;
    });

    doc.moveTo(50, currentY).lineTo(545, currentY).strokeColor('#e5e7eb').lineWidth(1).stroke();
    currentY += 15;

    // ── Totaux & Taxes ────────────────────────────────────────────────────
    const totalX = 330;
    const labelW = 110;
    const valueW = 100;

    doc.fontSize(10).font('Helvetica');
    
    // Total HT
    doc.fillColor(GRAY).text('Total Hors Taxes :', totalX, currentY, { width: labelW });
    doc.fillColor('#111').font('Helvetica-Bold').text(`${fmtNum(document.total_ht)} FCFA`, totalX + labelW, currentY, { width: valueW, align: 'right' });
    currentY += 16;

    // Total TVA
    if (Number(document.total_tva || 0) > 0) {
      doc.fillColor(GRAY).font('Helvetica').text('TVA :', totalX, currentY, { width: labelW });
      doc.fillColor('#111').font('Helvetica-Bold').text(`${fmtNum(document.total_tva)} FCFA`, totalX + labelW, currentY, { width: valueW, align: 'right' });
      currentY += 16;
    }

    // Timbre Fiscal
    if (Number(document.timbre_fiscal || 0) > 0) {
      doc.fillColor(GRAY).font('Helvetica').text('Timbre Fiscal (1%) :', totalX, currentY, { width: labelW });
      doc.fillColor('#111').font('Helvetica-Bold').text(`${fmtNum(document.timbre_fiscal)} FCFA`, totalX + labelW, currentY, { width: valueW, align: 'right' });
      currentY += 16;
    }

    // Retenue BRS
    if (Number(document.retenue_brs || 0) > 0) {
      doc.fillColor(GRAY).font('Helvetica').text('Retenue BRS :', totalX, currentY, { width: labelW });
      doc.fillColor('#111').font('Helvetica-Bold').text(`-${fmtNum(document.retenue_brs)} FCFA`, totalX + labelW, currentY, { width: valueW, align: 'right' });
      currentY += 16;
    }

    // Net à payer (mis en évidence)
    currentY += 4;
    doc.rect(totalX - 5, currentY - 3, labelW + valueW + 10, 22).fill('#f0f4f8');
    doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(12).text('Net à payer :', totalX, currentY, { width: labelW });
    doc.text(`${fmtNum(document.net_a_payer)} FCFA`, totalX + labelW, currentY, { width: valueW, align: 'right' });
    currentY += 30;

    // ── Notes du document ─────────────────────────────────────────────────
    if (document.notes) {
      doc.fillColor('#374151').fontSize(9).font('Helvetica-Bold').text('Notes :', 50, currentY);
      doc.font('Helvetica').fillColor(GRAY).text(cleanText(document.notes), 50, currentY + 12, { width: 495 });
      currentY = doc.y + 15;
    }

    // ── Coordonnées bancaires ─────────────────────────────────────────────
    if (boutique.compte_bancaire) {
      doc.moveTo(50, currentY).lineTo(545, currentY).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
      currentY += 10;
      doc.fillColor(NAVY).fontSize(9).font('Helvetica-Bold').text('Coordonnées bancaires pour règlement :', 50, currentY);
      currentY += 13;
      doc.fillColor(GRAY).fontSize(8).font('Helvetica').text(cleanText(boutique.compte_bancaire), 50, currentY, { width: 495 });
      currentY = doc.y + 10;
    }

    // ── Conditions de vente & Mentions de règlement ─────────────────────────
    const isDevisOuProforma = document.type === 'devis' || document.type === 'proforma';

    if (isDevisOuProforma && boutique.conditions_vente) {
      // Pour les Devis & Proformas : Affichage complet des CGV
      if (currentY > 670) {
        doc.addPage();
        currentY = 50;
      }
      doc.moveTo(50, currentY).lineTo(545, currentY).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
      currentY += 10;
      doc.fillColor(NAVY).fontSize(8).font('Helvetica-Bold').text('Conditions Générales de Vente :', 50, currentY);
      currentY += 11;
      doc.fillColor(GRAY).fontSize(7).font('Helvetica').text(cleanText(boutique.conditions_vente), 50, currentY, { width: 495, lineGap: 2 });
      currentY = doc.y + 10;
    } else {
      // Pour les Factures de vente : Condensé légal (1 seule page A4)
      if (currentY > 730) {
        doc.addPage();
        currentY = 50;
      }
      doc.moveTo(50, currentY).lineTo(545, currentY).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
      currentY += 8;
      doc.fillColor(GRAY).fontSize(7.5).font('Helvetica-Oblique')
         .text("Règlement à réception. Réserve de propriété : les marchandises restent la propriété du vendeur jusqu'au paiement intégral du prix.", 50, currentY, { width: 495, align: 'center' });
      currentY = doc.y + 8;
    }

    // ── Mentions légales TVA ──────────────────────────────────────────────
    if (boutique.regime_fiscal === 'non_assujetti') {
      if (currentY > 720) { doc.addPage(); currentY = 50; }
      doc.fillColor(GRAY).fontSize(8).font('Helvetica-Oblique')
         .text("TVA non applicable - article 286 du Code Général des Impôts (CGI) du Sénégal.", 50, currentY, { align: 'center', width: 495 });
      currentY = doc.y + 8;
    }

    // ── Pied de page personnalisé ─────────────────────────────────────────
    if (boutique.pied_de_page_document) {
      if (currentY > 740) { doc.addPage(); currentY = 50; }
      doc.fillColor('#9ca3af').fontSize(8).font('Helvetica-Oblique')
         .text(cleanText(boutique.pied_de_page_document), 50, currentY, { align: 'center', width: 495 });
    }

    doc.end();
  } catch (err) {
    console.error('[GET DOCUMENT PDF ERR]', err);
    res.status(500).json({ error: 'Erreur lors de la génération du PDF' });
  }
});

router.delete('/:id/commandes-fournisseurs/:cId', tokenOptional, param('id').isUUID(), param('cId').isUUID(), async (req, res) => {
  try {
    await pool.query(`DELETE FROM bons_commande_fournisseur WHERE id = $1 AND boutique_id = $2`, [req.params.cId, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── ROUTE AUDIT LOGS ─────────────────────────────────────────────────────────

// GET /api/boutiques/:id/logs/export.csv
router.get('/:id/logs/export.csv', tokenOptional, async (req, res) => {
  try {
    const idParam = req.params.id;
    const isUUID = /^[0-9a-f-]{36}$/i.test(idParam);
    const bRes = await pool.query(`SELECT id, nom FROM boutiques WHERE ${isUUID ? 'id=$1' : 'slug=$1'}`, [idParam]);
    if (!bRes.rows[0]) return res.status(404).json({ error: 'Boutique introuvable' });
    const boutique = bRes.rows[0];

    const { type, q } = req.query;
    let queryParts = ['boutique_id = $1'];
    let values = [boutique.id];
    let vIndex = 2;

    if (type && type !== 'tous') {
      queryParts.push(`type_action = $${vIndex++}`);
      values.push(type);
    }
    if (q) {
      queryParts.push(`(auteur_nom ILIKE $${vIndex} OR description ILIKE $${vIndex})`);
      values.push(`%${q}%`);
      vIndex++;
    }

    const r = await pool.query(
      `SELECT created_at, auteur_nom, type_action, description, metadonnees, ip_adresse
       FROM boutique_logs
       WHERE ${queryParts.join(' AND ')}
       ORDER BY created_at DESC
       LIMIT 2000`,
      values
    );

    let csv = '\uFEFFDate;Heure;Auteur;Type d\'action;Description;IP\n';
    r.rows.forEach(l => {
      const d = new Date(l.created_at);
      const dateStr = d.toLocaleDateString('fr-FR');
      const heureStr = d.toLocaleTimeString('fr-FR');
      const descClean = (l.description || '').replace(/;/g, ',').replace(/\n/g, ' ');
      csv += `${dateStr};${heureStr};"${l.auteur_nom}";"${l.type_action}";"${descClean}";"${l.ip_adresse || ''}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=journal_audit_${boutique.nom.replace(/[^a-z0-9]/gi, '_')}.csv`);
    res.status(200).send(csv);
  } catch (err) {
    console.error('[EXPORT LOGS CSV ERR]', err);
    res.status(500).json({ error: 'Erreur lors de l\'exportation CSV' });
  }
});

// GET /api/boutiques/:id/logs
router.get('/:id/logs', tokenOptional, async (req, res) => {
  try {
    const idParam = req.params.id;
    const isUUID = /^[0-9a-f-]{36}$/i.test(idParam);
    const bRes = await pool.query(`SELECT id FROM boutiques WHERE ${isUUID ? 'id=$1' : 'slug=$1'}`, [idParam]);
    if (!bRes.rows[0]) return res.status(404).json({ error: 'Boutique introuvable' });
    const boutiqueId = bRes.rows[0].id;

    const { type, q, limit = 100 } = req.query;
    let queryParts = ['boutique_id = $1'];
    let values = [boutiqueId];
    let vIndex = 2;

    if (type && type !== 'tous') {
      queryParts.push(`type_action = $${vIndex++}`);
      values.push(type);
    }
    if (q) {
      queryParts.push(`(auteur_nom ILIKE $${vIndex} OR description ILIKE $${vIndex})`);
      values.push(`%${q}%`);
      vIndex++;
    }

    const limitVal = Math.min(parseInt(limit, 10) || 100, 500);
    const sql = `SELECT id, auteur_nom, type_action, description, metadonnees, ip_adresse, created_at
                 FROM boutique_logs
                 WHERE ${queryParts.join(' AND ')}
                 ORDER BY created_at DESC
                 LIMIT ${limitVal}`;
    const r = await pool.query(sql, values);

    res.json({ success: true, logs: r.rows });
  } catch (err) {
    console.error('[GET LOGS ERR]', err);
    res.status(500).json({ error: 'Erreur de chargement des logs' });
  }
});

// ── ROUTE TERMINAL CAISSIER (ACCÈS SANS SESSION PROPRIÉTAIRE) ────────────────

// GET /api/boutiques/caisse-terminal/:token
router.get('/caisse-terminal/:token', async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) return res.status(400).json({ error: 'Jeton requis' });

    const bRes = await pool.query(
      `SELECT id, nom, logo_url, telephone, adresse, ville, caisse_token, regime_fiscal, prix_tva_incluse, timbre_fiscal_applicable, tva_taux_defaut, COALESCE(actif, true) AS actif
       FROM boutiques WHERE COALESCE(caisse_token, id::text) = $1 OR id::text = $1 OR slug = $1`,
      [token]
    );
    if (!bRes.rows[0]) return res.status(404).json({ error: 'Terminal caisse introuvable' });
    const boutique = bRes.rows[0];

    if (boutique.actif === false) {
      await pool.query('UPDATE boutiques SET actif = TRUE WHERE id = $1', [boutique.id]);
      boutique.actif = true;
    }

    const plan = await verifierAbonnementCaisse(boutique.id);
    boutique.plan_actif = plan || 'pro';

    let cRes = await pool.query(
      `SELECT id, nom, prenom, code_pin, role FROM boutique_caissiers WHERE boutique_id = $1 AND actif = TRUE ORDER BY nom`,
      [boutique.id]
    );

    let caissiers = cRes.rows;
    if (caissiers.length === 0) {
      const defC = await pool.query(
        `INSERT INTO boutique_caissiers (boutique_id, nom, prenom, code_pin, role)
         VALUES ($1, 'Bamba', 'Caissier 1', '1234', 'caissier'),
                ($1, 'Superviseur', 'Gérant', '9999', 'superviseur')
         RETURNING id, nom, prenom, code_pin, role`,
        [boutique.id]
      );
      caissiers = defC.rows;
    }

    const pRes = await pool.query(
      `SELECT p.id, p.nom, p.description, p.prix, p.prix_barre, p.images, p.en_stock, p.ordre, p.categorie, p.caracteristiques, p.stock_quantite, p.variantes, p.code_barre
       FROM boutique_produits p
       WHERE p.boutique_id = $1
       ORDER BY p.ordre ASC, p.created_at DESC`,
      [boutique.id]
    );

    res.json({
      success: true,
      boutique,
      planActif: plan || 'pro',
      caissiers,
      produits: pRes.rows
    });
  } catch (err) {
    console.error('[GET CAISSE TERMINAL ERR]', err);
    res.status(500).json({ error: 'Erreur lors de l\'accès au terminal' });
  }
});

// POST /api/boutiques/:id/regenere-caisse-token
router.post('/:id/regenere-caisse-token', verifierToken, async (req, res) => {
  try {
    const bq = await checkBoutiqueAccess(req.params.id, req.user.userId);
    if (!bq) return res.status(403).json({ error: 'Accès refusé' });

    const crypto = require('crypto');
    const newToken = crypto.randomUUID();
    await pool.query('UPDATE boutiques SET caisse_token = $1 WHERE id = $2', [newToken, bq.id]);

    await enregistrerAuditLog(bq.id, req.user.userId, req.user.nom, 'token_regenere', 'Régénération de la clé de terminal caisse POS', {}, req);

    res.json({ success: true, caisse_token: newToken });
  } catch (err) {
    console.error('[REGENERE TOKEN ERR]', err);
    res.status(500).json({ error: 'Erreur lors de la réinitialisation de la clef' });
  }
});

// ── Spec 02 : POST /api/boutiques/commandes/express — Checkout Web 1-Page Unifié
router.post('/commandes/express', async (req, res) => {
  try {
    const { boutique_id, client_nom, client_telephone, client_adresse, methode_paiement, note, frais_livraison, articles } = req.body;

    if (!boutique_id) {
      return res.status(400).json({ error: 'Boutique introuvable ou ID requis.' });
    }
    if (!client_nom || !client_nom.trim() || !client_telephone || !client_telephone.trim()) {
      return res.status(400).json({ error: 'Nom et téléphone du client requis.' });
    }
    if (!Array.isArray(articles) || articles.length === 0) {
      return res.status(400).json({ error: 'Au moins un article est requis dans le panier.' });
    }

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(boutique_id);
    const bqQuery = isUUID
      ? 'SELECT id, nom, telephone, whatsapp, utilisateur_id FROM boutiques WHERE id = $1 AND actif = true'
      : 'SELECT id, nom, telephone, whatsapp, utilisateur_id FROM boutiques WHERE (slug = $1 OR id::text = $1) AND actif = true';
    const bqRes = await pool.query(bqQuery, [boutique_id]);
    if (!bqRes.rows[0]) {
      return res.status(400).json({ error: 'Boutique introuvable.' });
    }

    const actualBoutiqueId = bqRes.rows[0].id;
    const ref = 'CMD-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
    const fraisLiv = Number(frais_livraison) || 0;
    let totalArticles = 0;

    for (const art of articles) {
      let prix = Number(art.prix_unitaire);
      let nomProd = art.nom_produit || 'Produit sans nom';

      const validProdId = (art.produit_id && String(art.produit_id).length === 36) ? art.produit_id : null;

      if (validProdId) {
        const pRes = await pool.query('SELECT id, nom, prix, stock_quantite FROM boutique_produits WHERE id = $1', [validProdId]);
        if (pRes.rows[0]) {
          if (!prix || isNaN(prix)) prix = Number(pRes.rows[0].prix) || 0;
          if (pRes.rows[0].nom) nomProd = pRes.rows[0].nom;

          // Décrémentation de stock (si géré)
          if (typeof pRes.rows[0].stock_quantite === 'number' && pRes.rows[0].stock_quantite > 0) {
            const nvStock = Math.max(0, pRes.rows[0].stock_quantite - (Number(art.quantite) || 1));
            await pool.query('UPDATE boutique_produits SET stock_quantite = $1 WHERE id = $2', [nvStock, validProdId]).catch(() => {});
          }
        }
      }

      const qte = Math.max(1, Number(art.quantite) || 1);
      const totalLigne = (prix || 0) * qte;
      totalArticles += totalLigne;

      await pool.query(
        `INSERT INTO commandes_boutique (
          reference, boutique_id, produit_id, nom_produit, quantite, prix_unitaire,
          montant_total, client_nom, client_telephone, client_adresse, note,
          statut, source, methode_paiement, frais_livraison, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'en_attente', 'web', $12, $13, NOW())`,
        [
          ref, actualBoutiqueId, validProdId, nomProd, qte, prix || 0,
          totalLigne, client_nom.trim(), client_telephone.trim(), client_adresse || null, note || null,
          methode_paiement || 'wave', fraisLiv,
        ]
      );
    }

    const totalGeneral = totalArticles + fraisLiv;

    pool.query(`INSERT INTO analytics_events (type, boutique_id) VALUES ('commande_web', $1)`, [actualBoutiqueId]).catch(() => {});

    // Notification WhatsApp au vendeur
    try {
      const { notifierVendeurCommande } = require('./comptabilite');
      notifierVendeurCommande(bqRes.rows[0], {
        reference: ref,
        nomProduit: articles.map(a => a.nom_produit || 'Produit').join(', '),
        quantite: articles.reduce((acc, a) => acc + (Number(a.quantite) || 1), 0),
        montantTotal: totalGeneral,
        fraisLivraison: fraisLiv,
        methodePaiement: methode_paiement || 'wave',
        clientNom: client_nom.trim(),
        clientTelephone: client_telephone.trim(),
        clientAdresse: client_adresse || null,
        note: note || null,
      }).catch(err => console.error('[EXPRESS NOTIF VENDEUR ERR]:', err.message));
    } catch (eNotif) {
      console.error('[EXPRESS NOTIF ERR]:', eNotif.message);
    }

    // Notification WhatsApp à l'acheteur (client)
    if (client_telephone && client_telephone.trim()) {
      try {
        const { sendWhatsAppText } = require('../services/whatsapp');
        const methodeLabel = { wave: 'Wave', orange_money: 'Orange Money', cash: 'Espèces à la livraison', virement: 'Virement bancaire' };
        const msgClient = `✅ *Commande enregistrée avec succès — ${bqRes.rows[0].nom}*\n\nRéférence : *${ref}*\nArticles : ${articles.map(a => `${a.quantite || 1}x ${a.nom_produit || 'Produit'}`).join(', ')}\n💰 Total : *${new Intl.NumberFormat('fr-FR').format(totalGeneral)} FCFA*${fraisLiv > 0 ? ` (dont ${new Intl.NumberFormat('fr-FR').format(fraisLiv)} FCFA de livraison)` : ''}\n💳 Mode de paiement : ${methodeLabel[methode_paiement] || methode_paiement}\n\n📍 Adresse : ${client_adresse || 'Retrait en boutique'}\n\n🙏 La boutique *${bqRes.rows[0].nom}* a bien reçu votre commande et vous contactera très vite !`;

        sendWhatsAppText(client_telephone.trim(), msgClient)
          .then(() => console.log(`[WHATSAPP CLIENT NOTIF SUCCESS] Confirmation envoyée au ${client_telephone}`))
          .catch(err => console.error('[WHATSAPP CLIENT NOTIF ERR]:', err.message));
      } catch (eCl) {
        console.error('[WHATSAPP CLIENT NOTIF ERR]:', eCl.message);
      }
    }

    // Initialisation session Wave si paiement Wave sélectionné
    if ((methode_paiement === 'wave' || methode_paiement === 'pay_wave') && process.env.WAVE_API_KEY && !process.env.WAVE_API_KEY.includes('xxxxxxxx')) {
      try {
        const wave = require('../services/wave');
        const waveSession = await wave.createCheckoutSession({
          amount: Number(totalGeneral),
          currency: 'XOF',
          success_url: `${process.env.FRONTEND_URL || 'https://nopalou.com'}/paiement/succes?ref=${ref}&type=commande-express`,
          error_url: `${process.env.FRONTEND_URL || 'https://nopalou.com'}/paiement/erreur?ref=${ref}&type=commande-express`,
          client_reference: ref,
        });
        return res.status(201).json({
          succes: true,
          reference: ref,
          montant_total: totalGeneral,
          statut: 'en_attente',
          wave_url: waveSession.wave_url,
          session_id: waveSession.session_id,
          message: 'Commande enregistrée. Redirection vers Wave…'
        });
      } catch (waveErr) {
        const waveMsg = waveErr.response?.data?.message || waveErr.response?.data?.code || waveErr.message;
        console.error('[EXPRESS WAVE INIT ERR]:', waveMsg);
        return res.status(400).json({
          error: `Erreur Wave API: ${waveMsg}. (Si IP non autorisée, ajoutez l'IP de votre serveur Render à la liste blanche Wave).`
        });
      }
    }

    res.status(201).json({
      succes: true,
      reference: ref,
      montant_total: totalGeneral,
      statut: 'en_attente',
      message: 'Votre commande a été enregistrée avec succès.'
    });
  } catch (err) {
    console.error('[EXPRESS CHECKOUT ERR]', err);
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement de la commande' });
  }
});

// ── Spec 02 : GET /api/boutiques/:id/produits/:prodId/cross-sell — Suggestions Upsell
router.get('/:id/produits/:prodId/cross-sell', async (req, res) => {
  try {
    const { id, prodId } = req.params;

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let targetBoutiqueId = id;
    if (!isUUID) {
      const bqRes = await pool.query('SELECT id FROM boutiques WHERE slug = $1', [id]);
      if (bqRes.rows[0]) targetBoutiqueId = bqRes.rows[0].id;
    }

    const r = await pool.query(
      `SELECT id, nom, description, prix, prix_barre, images, categorie, en_stock
       FROM boutique_produits
       WHERE boutique_id = $1 AND id != $2 AND en_stock = true
       ORDER BY ordre ASC, created_at DESC
       LIMIT 4`,
      [targetBoutiqueId, prodId]
    );

    res.json({ produits: r.rows });
  } catch (err) {
    console.error('[CROSS-SELL ERR]', err);
    res.status(500).json({ error: 'Erreur lors du chargement des produits recommandés' });
  }
});

// ── Spec 03 : GET /api/boutiques/:id/promotions — Liste des codes promo (Marchand)
router.get('/:id/promotions', verifierToken, param('id').isUUID(), async (req, res) => {
  try {
    const bq = await checkBoutiqueAccess(req.params.id, req.user.userId);
    if (!bq) return res.status(403).json({ error: 'Accès refusé' });

    const r = await pool.query(
      `SELECT * FROM boutique_promotions WHERE boutique_id = $1 ORDER BY created_at DESC`,
      [bq.id]
    );
    res.json({ promotions: r.rows });
  } catch (err) {
    console.error('[GET PROMOTIONS ERR]', err);
    res.status(500).json({ error: 'Erreur lors du chargement des promotions' });
  }
});

// ── Spec 03 : POST /api/boutiques/:id/promotions — Créer un code promo (Marchand)
router.post('/:id/promotions', verifierToken, param('id').isUUID(), async (req, res) => {
  try {
    const bq = await checkBoutiqueAccess(req.params.id, req.user.userId);
    if (!bq) return res.status(403).json({ error: 'Accès refusé' });

    const { code, type_remise, valeur, min_achat, limite_utilisation, fin } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ error: 'Le code promo est obligatoire.' });
    }
    if (!type_remise || !['pourcentage', 'fixe', 'livraison_offerte'].includes(type_remise)) {
      return res.status(400).json({ error: 'Type de remise invalide. Choix: pourcentage, fixe, livraison_offerte.' });
    }
    if (valeur === undefined || isNaN(Number(valeur)) || Number(valeur) < 0) {
      return res.status(400).json({ error: 'La valeur de la remise doit être un nombre positif.' });
    }

    const cleanCode = code.trim().toUpperCase();

    const r = await pool.query(
      `INSERT INTO boutique_promotions (
        boutique_id, code, type_remise, valeur, min_achat, limite_utilisation, fin
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        bq.id, cleanCode, type_remise, Number(valeur),
        Number(min_achat) || 0,
        limite_utilisation ? Number(limite_utilisation) : null,
        fin ? new Date(fin) : null
      ]
    );

    res.status(201).json({ success: true, promotion: r.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Un code promo portant ce nom existe déjà pour cette boutique.' });
    }
    console.error('[POST PROMOTION ERR]', err);
    res.status(500).json({ error: 'Erreur lors de la création du code promo' });
  }
});

// ── Spec 03 : DELETE /api/boutiques/:id/promotions/:promoId — Supprimer un code promo
router.delete('/:id/promotions/:promoId', verifierToken, param('id').isUUID(), param('promoId').isUUID(), async (req, res) => {
  try {
    const bq = await checkBoutiqueAccess(req.params.id, req.user.userId);
    if (!bq) return res.status(403).json({ error: 'Accès refusé' });

    await pool.query(
      `DELETE FROM boutique_promotions WHERE id = $1 AND boutique_id = $2`,
      [req.params.promoId, bq.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('[DELETE PROMOTION ERR]', err);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

// ── Spec 03 : POST /api/promotions/valider (ou /api/boutiques/:id/promotions/valider)
router.post(['/promotions/valider', '/valider', '/:id/promotions/valider'], async (req, res) => {
  try {
    const boutique_id = req.params.id || req.body.boutique_id;
    const { code, total_panier } = req.body;

    if (!boutique_id) return res.status(400).json({ valide: false, error: 'Boutique ID requis' });
    if (!code || !code.trim()) return res.status(400).json({ valide: false, error: 'Code promo requis' });

    const total = Number(total_panier) || 0;
    const cleanCode = code.trim().toUpperCase();

    // 1. Vérification du code promo global plateforme (Admin Settings)
    const platformPromoActive = await cfg.getBool('promo_active');
    const platformPromoCode = ((await cfg.get('promo_code')) || '').trim().toUpperCase();
    const platformPromoReduc = (await cfg.getNum('promo_reduction')) || 0;

    // Si l'utilisateur saisit le code promo plateforme (ex: SOLDE20 / NOPALOU25)
    if (platformPromoCode && cleanCode === platformPromoCode) {
      if (!platformPromoActive) {
        return res.status(400).json({ valide: false, error: 'Ce code promo a été désactivé dans l\'administration.' });
      }
      const reduction = Math.round((total * platformPromoReduc) / 100);
      const nouveauTotal = Math.max(0, total - reduction);
      return res.json({
        valide: true,
        code: platformPromoCode,
        type_remise: 'pourcentage',
        valeur: platformPromoReduc,
        montant_reduction: reduction,
        nouveau_total: nouveauTotal,
        message: 'Code promo plateforme appliqué avec succès !'
      });
    }

    // Si la promotion globale est désactivée et qu'il n'y a pas d'autre code
    if (cleanCode === 'SOLDE20' && !platformPromoActive) {
      return res.status(400).json({ valide: false, error: 'Le code promo SOLDE20 a été désactivé par l\'administration.' });
    }

    // 2. Vérification dans les promotions propres à la boutique
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(boutique_id);
    let targetBoutiqueId = boutique_id;
    if (!isUUID) {
      const bqRes = await pool.query('SELECT id FROM boutiques WHERE slug = $1', [boutique_id]);
      if (bqRes.rows[0]) targetBoutiqueId = bqRes.rows[0].id;
    }

    const r = await pool.query(
      `SELECT * FROM boutique_promotions
       WHERE boutique_id = $1 AND UPPER(code) = $2 AND actif = true`,
      [targetBoutiqueId, cleanCode]
    );

    if (!r.rows[0]) {
      return res.status(400).json({ valide: false, error: 'Code promo expiré ou invalide.' });
    }

    const promo = r.rows[0];

    if (promo.fin && new Date(promo.fin) < new Date()) {
      return res.status(400).json({ valide: false, error: 'Ce code promo a expiré.' });
    }

    if (promo.limite_utilisation !== null && promo.fois_utilise >= promo.limite_utilisation) {
      return res.status(400).json({ valide: false, error: 'La limite d\'utilisation de ce code est atteinte.' });
    }

    if (promo.min_achat && total < Number(promo.min_achat)) {
      return res.status(400).json({
        valide: false,
        error: `Ce code nécessite un achat minimum de ${Number(promo.min_achat).toLocaleString('fr-FR')} FCFA.`
      });
    }

    let reduction = 0;
    if (promo.type_remise === 'pourcentage') {
      reduction = Math.round((total * Number(promo.valeur)) / 100);
    } else if (promo.type_remise === 'fixe') {
      reduction = Math.min(total, Number(promo.valeur));
    } else if (promo.type_remise === 'livraison_offerte') {
      reduction = Number(promo.valeur) || 0;
    }

    const nouveauTotal = Math.max(0, total - reduction);

    res.json({
      valide: true,
      code: promo.code,
      type_remise: promo.type_remise,
      valeur: Number(promo.valeur),
      montant_reduction: reduction,
      nouveau_total: nouveauTotal,
      message: 'Code promo appliqué avec succès !'
    });
  } catch (err) {
    console.error('[PROMO VALIDATE ERR]', err);
    res.status(500).json({ valide: false, error: 'Erreur lors de la vérification du code promo' });
  }
});

// ── Spec 04 : PUT /api/boutiques/:id/pixels — Enregistrer les Pixel IDs (Marchand)
router.put('/:id/pixels', verifierToken, param('id').isUUID(), async (req, res) => {
  try {
    const bq = await checkBoutiqueAccess(req.params.id, req.user.userId);
    if (!bq) return res.status(403).json({ error: 'Accès refusé' });

    const { meta_pixel_id, tiktok_pixel_id, ga4_id } = req.body;

    await pool.query(
      `UPDATE boutiques
       SET meta_pixel_id = $1, tiktok_pixel_id = $2, ga4_id = $3, updated_at = NOW()
       WHERE id = $4`,
      [
        meta_pixel_id?.trim() || null,
        tiktok_pixel_id?.trim() || null,
        ga4_id?.trim() || null,
        bq.id
      ]
    );

    res.json({
      success: true,
      pixels: {
        meta_pixel_id: meta_pixel_id?.trim() || null,
        tiktok_pixel_id: tiktok_pixel_id?.trim() || null,
        ga4_id: ga4_id?.trim() || null
      }
    });
  } catch (err) {
    console.error('[PUT PIXELS ERR]', err);
    res.status(500).json({ error: 'Erreur lors de la sauvegarde des pixels' });
  }
});

// ── Spec 04 : GET /api/boutiques/:id/pixels/public — Lecture publique des pixels
router.get('/:id/pixels/public', async (req, res) => {
  try {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id);
    const r = await pool.query(
      `SELECT meta_pixel_id, tiktok_pixel_id, ga4_id FROM boutiques WHERE ${isUUID ? 'id = $1' : 'slug = $1'}`,
      [req.params.id]
    );

    if (!r.rows[0]) {
      return res.status(404).json({ error: 'Boutique introuvable' });
    }

    res.json({
      meta_pixel_id: r.rows[0].meta_pixel_id || null,
      tiktok_pixel_id: r.rows[0].tiktok_pixel_id || null,
      ga4_id: r.rows[0].ga4_id || null
    });
  } catch (err) {
    console.error('[GET PIXELS PUBLIC ERR]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── Spec 05 : GET /api/boutiques/:id/api-keys — Liste des clés API marchand (Business VIP uniquement)
router.get('/:id/api-keys', verifierToken, param('id').isUUID(), checkAbonnement, requireBusiness, async (req, res) => {
  try {
    const bq = await checkBoutiqueAccess(req.params.id, req.user.userId);
    if (!bq) return res.status(403).json({ error: 'Accès refusé' });

    const r = await pool.query(
      `SELECT id, nom, key_prefix, created_at, last_used_at FROM boutique_api_keys WHERE boutique_id = $1 ORDER BY created_at DESC`,
      [bq.id]
    );
    res.json({ keys: r.rows });
  } catch (err) {
    console.error('[GET API KEYS ERR]', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des clés API' });
  }
});

// ── Spec 05 : POST /api/boutiques/:id/api-keys — Générer une clé API marchand (Business VIP uniquement)
router.post('/:id/api-keys', verifierToken, param('id').isUUID(), checkAbonnement, requireBusiness, async (req, res) => {
  try {
    const bq = await checkBoutiqueAccess(req.params.id, req.user.userId);
    if (!bq) return res.status(403).json({ error: 'Accès refusé' });

    const { nom } = req.body;
    if (!nom || !nom.trim()) {
      return res.status(400).json({ error: 'Le nom de la clé API est requis.' });
    }

    const crypto = require('crypto');
    const randomBytes = crypto.randomBytes(24).toString('hex');
    const apiKey = `nopalou_sk_live_${randomBytes}`;
    const keyPrefix = apiKey.substring(0, 19); // "nopalou_sk_live_123"
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    const r = await pool.query(
      `INSERT INTO boutique_api_keys (boutique_id, nom, key_prefix, key_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nom, key_prefix, created_at`,
      [bq.id, nom.trim(), keyPrefix, keyHash]
    );

    res.status(201).json({
      success: true,
      key_id: r.rows[0].id,
      api_key: apiKey,
      message: 'Conservez cette clé en lieu sûr. Elle ne sera plus affichée.'
    });
  } catch (err) {
    console.error('[POST API KEY ERR]', err);
    res.status(500).json({ error: 'Erreur lors de la génération de la clé API' });
  }
});

// ── Spec 05 : DELETE /api/boutiques/:id/api-keys/:keyId — Révoker une clé API marchand (Business VIP uniquement)
router.delete('/:id/api-keys/:keyId', verifierToken, param('id').isUUID(), param('keyId').isUUID(), checkAbonnement, requireBusiness, async (req, res) => {
  try {
    const bq = await checkBoutiqueAccess(req.params.id, req.user.userId);
    if (!bq) return res.status(403).json({ error: 'Accès refusé' });

    await pool.query(
      `DELETE FROM boutique_api_keys WHERE id = $1 AND boutique_id = $2`,
      [req.params.keyId, bq.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('[DELETE API KEY ERR]', err);
    res.status(500).json({ error: 'Erreur lors de la révocation de la clé API' });
  }
});

// ── Spec 05 : GET /api/boutiques/:id/webhooks — Liste des webhooks (Business VIP uniquement)
router.get('/:id/webhooks', verifierToken, param('id').isUUID(), checkAbonnement, requireBusiness, async (req, res) => {
  try {
    const bq = await checkBoutiqueAccess(req.params.id, req.user.userId);
    if (!bq) return res.status(403).json({ error: 'Accès refusé' });

    const r = await pool.query(
      `SELECT id, url, secret, events, actif, created_at FROM boutique_webhooks WHERE boutique_id = $1 ORDER BY created_at DESC`,
      [bq.id]
    );
    res.json({ webhooks: r.rows });
  } catch (err) {
    console.error('[GET WEBHOOKS ERR]', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des webhooks' });
  }
});

// ── Spec 05 : POST /api/boutiques/:id/webhooks — Créer un webhook endpoint (Business VIP uniquement)
router.post('/:id/webhooks', verifierToken, param('id').isUUID(), checkAbonnement, requireBusiness, async (req, res) => {
  try {
    const bq = await checkBoutiqueAccess(req.params.id, req.user.userId);
    if (!bq) return res.status(403).json({ error: 'Accès refusé' });

    const { url, events } = req.body;
    if (!url || !url.trim() || (!url.startsWith('http://') && !url.startsWith('https://'))) {
      return res.status(400).json({ error: 'Une URL de webhook valide (http:// ou https://) est requise.' });
    }

    const eventsList = Array.isArray(events) && events.length > 0 ? events : ['order.created'];
    const crypto = require('crypto');
    const secret = `whsec_${crypto.randomBytes(24).toString('hex')}`;

    const r = await pool.query(
      `INSERT INTO boutique_webhooks (boutique_id, url, secret, events)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [bq.id, url.trim(), secret, eventsList]
    );

    res.status(201).json({
      success: true,
      webhook: r.rows[0]
    });
  } catch (err) {
    console.error('[POST WEBHOOK ERR]', err);
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement du webhook' });
  }
});

// ── Spec 05 : DELETE /api/boutiques/:id/webhooks/:webhookId — Supprimer un webhook (Business VIP uniquement)
router.delete('/:id/webhooks/:webhookId', verifierToken, param('id').isUUID(), param('webhookId').isUUID(), checkAbonnement, requireBusiness, async (req, res) => {
  try {
    const bq = await checkBoutiqueAccess(req.params.id, req.user.userId);
    if (!bq) return res.status(403).json({ error: 'Accès refusé' });

    await pool.query(
      `DELETE FROM boutique_webhooks WHERE id = $1 AND boutique_id = $2`,
      [req.params.webhookId, bq.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('[DELETE WEBHOOK ERR]', err);
    res.status(500).json({ error: 'Erreur lors de la suppression du webhook' });
  }
});

// ── Spec 06 : GET /api/devises/taux — Taux de conversion officiels
router.get('/devises/taux', (req, res) => {
  res.json({
    base: 'XOF',
    taux: { XOF: 1, EUR: 0.001524, USD: 0.001667 },
    conversions_inverses: { '1_EUR_EN_XOF': 655.957, '1_USD_EN_XOF': 600.00 }
  });
});
router.get('/taux', (req, res) => {
  res.json({
    base: 'XOF',
    taux: { XOF: 1, EUR: 0.001524, USD: 0.001667 },
    conversions_inverses: { '1_EUR_EN_XOF': 655.957, '1_USD_EN_XOF': 600.00 }
  });
});

// ── Spec 06 : PUT /api/boutiques/:id/devise — Devise par défaut de la boutique (Marchand)
router.put('/:id/devise', verifierToken, param('id').isUUID(), async (req, res) => {
  try {
    const bq = await checkBoutiqueAccess(req.params.id, req.user.userId);
    if (!bq) return res.status(403).json({ error: 'Accès refusé' });

    const { devise_defaut } = req.body;
    if (!devise_defaut || !['XOF', 'EUR', 'USD'].includes(devise_defaut.toUpperCase())) {
      return res.status(400).json({ error: 'Devise invalide. Choix: XOF, EUR, USD.' });
    }

    const cleanDevise = devise_defaut.toUpperCase();

    await pool.query(
      `UPDATE boutiques SET devise_defaut = $1, updated_at = NOW() WHERE id = $2`,
      [cleanDevise, bq.id]
    );

    res.json({
      success: true,
      devise_defaut: cleanDevise,
      message: `Devise par défaut de la boutique mise à jour vers ${cleanDevise}.`
    });
  } catch (err) {
    console.error('[PUT DEVISE ERR]', err);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la devise' });
  }
});

// ── Spec 06 : POST /api/paiements/stripe/simuler — Simulation Carte Bancaire Stripe
router.post(['/paiements/stripe/simuler', '/stripe/simuler', '/:id/paiements/stripe/simuler'], async (req, res) => {
  try {
    const boutique_id = req.params.id || req.body.boutique_id;
    const { montant, devise, card_number, exp_month, exp_year, cvc } = req.body;

    if (!montant || isNaN(Number(montant)) || Number(montant) <= 0) {
      return res.status(400).json({ success: false, error: 'Montant invalide.' });
    }
    if (!card_number || !card_number.replace(/\s+/g, '').match(/^\d{13,19}$/)) {
      return res.status(400).json({ success: false, error: 'Numéro de carte bancaire invalide.' });
    }

    const cleanCard = card_number.replace(/\s+/g, '');

    // Simuler le rejet Stripe pour cartes de test d'échec (ex: 4000000000000002)
    if (cleanCard.endsWith('0002') || cleanCard.endsWith('9999')) {
      return res.status(400).json({
        success: false,
        error: 'Votre carte a été déclinée par l\'émetteur (Carte de test d\'échec Stripe).'
      });
    }

    const crypto = require('crypto');
    const txnId = `txn_stripe_sim_${crypto.randomBytes(12).toString('hex')}`;
    const cleanDevise = (devise || 'XOF').toUpperCase();

    let montantXof = Number(montant);
    if (cleanDevise === 'EUR') montantXof = Math.round(Number(montant) * 655.957);
    else if (cleanDevise === 'USD') montantXof = Math.round(Number(montant) * 600.00);

    res.json({
      success: true,
      transaction_id: txnId,
      statut: 'succeeded',
      montant_paye: Number(montant),
      devise: cleanDevise,
      montant_xof: montantXof,
      mode: 'stripe_simulation',
      message: 'Paiement par carte bancaire approuvé avec succès (Mode Simulation Stripe).'
    });
  } catch (err) {
    console.error('[STRIPE SIMULATION ERR]', err);
    res.status(500).json({ success: false, error: 'Erreur lors du traitement de la carte bancaire' });
  }
});

// ── Spec Acheteur 02 : GET /api/boutiques/:id/produits/:prodId/avis — Avis publics & moyenne
router.get('/:id/produits/:prodId/avis', async (req, res) => {
  try {
    const { id, prodId } = req.params;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let targetBoutiqueId = id;
    if (!isUUID) {
      const bqRes = await pool.query('SELECT id FROM boutiques WHERE slug = $1', [id]);
      if (bqRes.rows[0]) targetBoutiqueId = bqRes.rows[0].id;
    }

    const { rows } = await pool.query(
      `SELECT id, client_nom, note, commentaire, commande_ref, created_at
       FROM boutique_avis
       WHERE boutique_id = $1 AND (produit_id = $2 OR produit_id IS NULL) AND valide = true
       ORDER BY created_at DESC`,
      [targetBoutiqueId, prodId]
    );

    let noteMoyenne = 0;
    if (rows.length > 0) {
      const sum = rows.reduce((acc, curr) => acc + curr.note, 0);
      noteMoyenne = Number((sum / rows.length).toFixed(1));
    }

    res.json({
      total_avis: rows.length,
      note_moyenne: noteMoyenne,
      avis: rows
    });
  } catch (err) {
    console.error('[GET AVIS ERR]', err);
    res.status(500).json({ error: 'Erreur lors du chargement des avis' });
  }
});

// ── Spec Acheteur 02 : POST /api/boutiques/:id/produits/:prodId/avis — Soumettre un avis client
router.post('/:id/produits/:prodId/avis', async (req, res) => {
  try {
    const { id, prodId } = req.params;
    const { client_nom, note, commentaire, commande_ref } = req.body;

    if (!client_nom || !client_nom.trim()) {
      return res.status(400).json({ error: 'Votre nom est requis.' });
    }
    if (!note || isNaN(Number(note)) || Number(note) < 1 || Number(note) > 5) {
      return res.status(400).json({ error: 'Une note entre 1 et 5 étoiles est requise.' });
    }
    if (!commentaire || !commentaire.trim()) {
      return res.status(400).json({ error: 'Votre commentaire est requis.' });
    }

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let targetBoutiqueId = id;
    if (!isUUID) {
      const bqRes = await pool.query('SELECT id FROM boutiques WHERE slug = $1', [id]);
      if (bqRes.rows[0]) targetBoutiqueId = bqRes.rows[0].id;
    }

    const r = await pool.query(
      `INSERT INTO boutique_avis (boutique_id, produit_id, client_nom, note, commentaire, commande_ref)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [targetBoutiqueId, prodId, client_nom.trim(), Number(note), commentaire.trim(), commande_ref || null]
    );

    res.status(201).json({
      success: true,
      message: 'Votre avis a été publié avec succès ! Merci pour votre retour.',
      avis: r.rows[0]
    });
  } catch (err) {
    console.error('[POST AVIS ERR]', err);
    res.status(500).json({ error: 'Erreur lors de la publication de l\'avis' });
  }
});

// ── Spec Acheteur 04 : GET /api/boutiques/commandes/suivi — Suivi de commande dynamique
router.get('/commandes/suivi', async (req, res) => {
  try {
    const { ref, tel, q } = req.query;
    const rawTerm = (q || ref || tel || '').toString().trim();
    if (!rawTerm) {
      return res.status(400).json({ error: 'Veuillez fournir une référence de commande ou un numéro de téléphone.' });
    }

    const searchPattern = `%${rawTerm}%`;
    const cleanDigits = rawTerm.replace(/[^0-9]/g, '');
    const digitsPattern = cleanDigits ? `%${cleanDigits}%` : searchPattern;

    const query = `
      SELECT c.id, c.reference, c.client_nom, c.client_telephone, c.statut, c.montant_total,
             c.methode_paiement, c.created_at, COALESCE(b.nom, 'Boutique Nopalou') as boutique_nom,
             COALESCE(b.telephone_whatsapp, b.telephone) as boutique_whatsapp
      FROM commandes_boutique c
      LEFT JOIN boutiques b ON b.id = c.boutique_id
      WHERE (
        c.reference ILIKE $1
        OR c.id::text ILIKE $1
        OR c.client_telephone ILIKE $1
        OR ($2 <> '%%' AND regexp_replace(c.client_telephone, '[^0-9]', '', 'g') LIKE $2)
      )
      ORDER BY c.created_at DESC
      LIMIT 10
    `;

    const { rows } = await pool.query(query, [searchPattern, digitsPattern]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Aucune commande trouvée. Vérifiez votre numéro de référence ou votre numéro de téléphone.' });
    }

    res.json({
      success: true,
      commandes: rows
    });
  } catch (err) {
    console.error('[GET SUIVI ERR]', err);
    res.status(500).json({ error: 'Erreur lors de la recherche du suivi de commande' });
  }
});

// ── POST /api/boutiques/scan-ocr — OCR du nom de produit depuis la caméra ──
router.post('/scan-ocr', async (req, res) => {
  try {
    const { imageBase64 } = req.body || {};
    if (!imageBase64) {
      return res.status(400).json({ error: 'Image base64 requise' });
    }

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    let Tesseract;
    try {
      Tesseract = require('tesseract.js');
    } catch (e) {
      console.warn('[OCR] tesseract.js non disponible:', e.message);
      return res.status(503).json({ error: 'OCR serveur non disponible' });
    }

    const result = await Tesseract.recognize(imageBuffer, 'fra+eng');
    const rawText = result?.data?.text || '';

    const lines = rawText
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length >= 2 && !/^[0-9\W]+$/.test(l));

    if (lines.length === 0) {
      return res.json({ ok: false, error: 'Aucun texte lisible détecté sur l’emballage.' });
    }

    // Choisir la ligne la plus représentative (ex: première ligne en majuscules ou la plus longue)
    const majuscules = lines.filter(l => /[A-Z]{2,}/.test(l));
    const candidat = majuscules.length > 0 ? majuscules[0] : [...lines].sort((a, b) => b.length - a.length)[0];

    // Nettoyage final du texte
    const nomPropre = candidat.replace(/[\n\r]+/g, ' ').replace(/\s+/g, ' ').trim();

    return res.json({
      ok: true,
      nom: nomPropre,
      detections: lines.slice(0, 6)
    });
  } catch (err) {
    console.error('[OCR SCAN NOM ERR]', err);
    return res.status(500).json({ error: 'Erreur lors de la lecture OCR du produit' });
  }
});

module.exports = router;



