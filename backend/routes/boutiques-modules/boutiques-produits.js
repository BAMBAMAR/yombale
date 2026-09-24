// backend/routes/boutiques-modules/boutiques-produits.js
const router = require('express').Router();
const { body, param, query, validationResult } = require('express-validator');
const { pool } = require('../../models/db');
const { verifierToken, tokenOptional, adminSecretOnly, requireEmailVerifie } = require('../../middlewares/auth');
const { checkAbonnement, requireAbonnement, requireBusiness } = require('../../middlewares/checkAbonnement');
const { limiterPublication, limiterImport } = require('../../middlewares/rateLimit');
const { uploadBuffer } = require('../../services/cloudinary');
const { scrapeProductFromUrl } = require('../../services/magic-import');
const { syncProduit, deleteProduit } = require('../../services/whatsapp-catalog');
const cfg = require('../../lib/settingsCache');
const { enregistrerAuditLog } = require('../../lib/auditLogger');
const { normalizeSocialUrl } = require('../../services/social-parser');
const {
  checkBoutiqueAccess,
  checkBoutiqueQuotas,
  upload,
  uploadProduitPhotos,
  CATS,
  MAX_BOUTIQUES,
  QUOTA_PRODUITS,
  slugify,
  uniqueSlug,
} = require('./helpers');
const { cacheGet, cacheSet, cacheInvalidatePattern } = require('../../services/redis-cache');
const plansCache = require('../../lib/plansCache');

// ── GET /api/boutiques/:id/produits — catalogue public ou privé marchand (Cache < 10ms)
router.get('/:id/produits', tokenOptional, async (req, res) => {
  try {
    const param = req.params.id;
    const cacheKey = `cat:${param}`;
    const cachedData = await cacheGet(cacheKey);
    if (cachedData) {
      return res.json({ produits: cachedData, cached: true });
    }

    const { rows } = await pool.query(
      `SELECT p.id, p.nom, p.description, p.prix, p.prix_barre, p.images,
              COALESCE(CASE WHEN p.stock_quantite IS NOT NULL THEN (p.stock_quantite > 0) ELSE p.en_stock END, true) AS en_stock,
              p.ordre, p.categorie, p.caracteristiques, p.stock_quantite, p.variantes, p.code_barre,
              p.unite_vente, p.has_variants, p.date_expiration,
              p.whatsapp_sync_statut, p.whatsapp_sync_erreur, p.partage_le,
              p.meta_title, p.meta_description, p.slug,
              COALESCE(
                (SELECT json_agg(json_build_object(
                  'id', v.id, 'sku', v.sku, 'code_barre', v.code_barre, 'attributs', v.attributs,
                  'prix', v.prix, 'prix_barre', v.prix_barre, 'stock_quantite', v.stock_quantite, 'image_url', v.image_url
                ) ORDER BY v.ordre ASC, v.prix ASC)
                FROM boutique_produit_variantes v
                WHERE v.produit_id = p.id AND v.actif = true),
                '[]'::json
              ) AS variantes_skus
       FROM boutique_produits p
       JOIN boutiques b ON b.id = p.boutique_id
       WHERE (b.id::text = $1 OR b.slug = $1)
       ORDER BY p.ordre ASC, p.created_at DESC`,
      [param]
    );

    await cacheSet(cacheKey, rows, 120); // Cache 2 minutes
    res.json({ produits: rows });
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});


// ── GET /api/boutiques/:id/produits/:prodId — fiche produit publique ou privée marchand
router.get('/:id/produits/:prodId', tokenOptional, param('prodId').isUUID(), async (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(400).json({ error: 'ID invalide' });
  try {
    const idParam = req.params.id;
    const isUUID = /^[0-9a-f-]{36}$/i.test(idParam);
    const boutiqueCondition = isUUID ? 'b.id=$2' : 'LOWER(b.slug)=LOWER($2)';
    const { rows } = await pool.query(
      `SELECT p.id, p.nom, p.description, p.prix, p.prix_barre, p.images,
              COALESCE(CASE WHEN p.stock_quantite IS NOT NULL THEN (p.stock_quantite > 0) ELSE p.en_stock END, true) AS en_stock,
              p.stock_quantite, p.code_barre,
              p.unite_vente, p.has_variants, p.date_expiration,
              p.categorie, p.caracteristiques, p.variantes, p.ordre, p.created_at,
              b.nom AS boutique_nom, b.telephone AS boutique_telephone,
              b.whatsapp AS boutique_whatsapp, b.ville AS boutique_ville,
              b.logo_url AS boutique_logo, b.actif AS boutique_actif,
              b.meta_pixel_id, b.tiktok_pixel_id, b.ga4_id,
              COALESCE(
                (SELECT json_agg(json_build_object(
                  'id', v.id, 'sku', v.sku, 'code_barre', v.code_barre, 'attributs', v.attributs,
                  'prix', v.prix, 'prix_barre', v.prix_barre, 'stock_quantite', v.stock_quantite, 'image_url', v.image_url
                ) ORDER BY v.ordre ASC, v.prix ASC)
                FROM boutique_produit_variantes v
                WHERE v.produit_id = p.id AND v.actif = true),
                '[]'::json
              ) AS variantes_skus
       FROM boutique_produits p
       JOIN boutiques b ON b.id = p.boutique_id
       LEFT JOIN boutique_utilisateurs bu ON b.id = bu.boutique_id
       WHERE p.id=$1 AND ${boutiqueCondition}`,
      [req.params.prodId, idParam]
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
    const own = await checkBoutiqueAccess(id, req.user.userId);
    if (!own) return res.status(403).json({ error: 'Accès refusé' });

    // Quota dynamique depuis plansCache avec fallback sur QUOTA_PRODUITS
    const plan = req.abonnement.plan;
    const planConfig = await plansCache.getPlan(plan);
    const planMax = planConfig?.limites?.max_produits;
    const quota = (planMax !== undefined && planMax !== null)
      ? (planMax === -1 ? Infinity : Number(planMax))
      : (QUOTA_PRODUITS[plan] ?? 50);
    if (quota !== Infinity) {
      const cnt = await pool.query('SELECT COUNT(*) FROM boutique_produits WHERE boutique_id=$1', [id]);
      if (parseInt(cnt.rows[0].count) >= quota) {
        return res.status(400).json({ error: `Quota atteint (${quota} produits max pour le plan ${plan})` });
      }
    }

    const { nom, description, prix, prix_barre, prix_achat, en_stock, stock_quantite, quantite_stock, categorie, caracteristiques, variantes, code_barre, unite_vente, date_expiration, variantes_skus } = req.body;
    if (!nom?.trim()) return res.status(400).json({ error: 'Nom requis' });

    const safePrix = (prix !== undefined && prix !== null && String(prix).trim() !== '' && !isNaN(Number(prix))) ? Number(prix) : null;
    if (safePrix !== null && safePrix < 0) {
      return res.status(400).json({ error: 'Le prix du produit ne peut pas être négatif' });
    }
    const safePrixBarre = (prix_barre !== undefined && prix_barre !== null && String(prix_barre).trim() !== '' && !isNaN(Number(prix_barre))) ? Number(prix_barre) : null;
    if (safePrixBarre !== null && safePrixBarre < 0) {
      return res.status(400).json({ error: 'Le prix barré ne peut pas être négatif' });
    }
    const safePrixAchat = (prix_achat !== undefined && prix_achat !== null && String(prix_achat).trim() !== '' && !isNaN(Number(prix_achat))) ? Number(prix_achat) : null;
    if (safePrixAchat !== null && safePrixAchat < 0) {
      return res.status(400).json({ error: 'Le prix d’achat ne peut pas être négatif' });
    }
    const rawStock = stock_quantite !== undefined ? stock_quantite : quantite_stock;
    const safeStock = (rawStock !== undefined && rawStock !== null && String(rawStock).trim() !== '' && !isNaN(Number(rawStock))) ? Number(rawStock) : null;
    if (safeStock !== null && safeStock < 0) {
      return res.status(400).json({ error: 'La quantité en stock ne peut pas être négative' });
    }
    const finalEnStock = safeStock !== null ? (safeStock > 0) : (en_stock !== 'false');

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

    let skusArray = [];
    if (variantes_skus) {
      try {
        const parsed = typeof variantes_skus === 'string' ? JSON.parse(variantes_skus) : variantes_skus;
        if (Array.isArray(parsed)) skusArray = parsed;
      } catch {}
    }

    const hasVariants = skusArray.length > 0 || (variantesJson.length > 0 && variantesJson.some(v => v.valeurs && v.valeurs.length > 0));
    const rawCodeBarrePost = Array.isArray(code_barre) ? code_barre[0] : code_barre;
    const codeBarrePostVal = rawCodeBarrePost && typeof rawCodeBarrePost === 'string' && rawCodeBarrePost.trim() ? rawCodeBarrePost.trim() : null;

    const r = await pool.query(
      `INSERT INTO boutique_produits (boutique_id, nom, description, prix, prix_barre, prix_achat, images, en_stock, stock_quantite, categorie, caracteristiques, variantes, code_barre, unite_vente, has_variants, date_expiration)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
      [id, nom.trim(), description||null, safePrix, safePrixBarre, safePrixAchat,
       images, finalEnStock, safeStock, categorie||null, caracJson, JSON.stringify(variantesJson), codeBarrePostVal,
       unite_vente || 'piece', hasVariants, date_expiration || null]
    );
    const newProduit = r.rows[0];

    // Insertion des variantes SKUs si présentes
    if (skusArray.length > 0) {
      for (let idx = 0; idx < skusArray.length; idx++) {
        const v = skusArray[idx];
        const vPrix = Number(v.prix) || safePrix || 0;
        const vPrixBarre = v.prix_barre ? Number(v.prix_barre) : null;
        const vPrixAchat = v.prix_achat ? Number(v.prix_achat) : null;
        const vStock = v.stock_quantite !== undefined ? Number(v.stock_quantite) : 0;
        await pool.query(
          `INSERT INTO boutique_produit_variantes (boutique_id, produit_id, sku, code_barre, attributs, prix, prix_barre, prix_achat, stock_quantite, image_url, actif, ordre)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true,$11)`,
          [id, newProduit.id, v.sku || null, v.code_barre || null, JSON.stringify(v.attributs || {}), vPrix, vPrixBarre, vPrixAchat, vStock, v.image_url || null, idx]
        ).catch(() => {});
      }
    }

    res.status(201).json({ success: true, produit: newProduit });
    // Audit Log Creation
    enregistrerAuditLog(id, req.user.userId, req.user.nom || 'Marchand', 'produit_cree', `Création du produit "${r.rows[0].nom}"`, { produit_id: r.rows[0].id, prix: r.rows[0].prix, stock_quantite: r.rows[0].stock_quantite }, req);

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
    const own = await checkBoutiqueAccess(id, req.user.userId);
    if (!own) return res.status(403).json({ error: 'Accès refusé' });

    const existing = await pool.query('SELECT * FROM boutique_produits WHERE id=$1 AND boutique_id=$2', [prodId, id]);
    if (!existing.rows[0]) return res.status(404).json({ error: 'Produit introuvable' });

    const { nom, description, prix, prix_barre, prix_achat, en_stock, stock_quantite, quantite_stock, categorie, caracteristiques, variantes, code_barre, unite_vente, date_expiration, variantes_skus } = req.body;
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

    let skusArray = null;
    if (variantes_skus) {
      try {
        const parsed = typeof variantes_skus === 'string' ? JSON.parse(variantes_skus) : variantes_skus;
        if (Array.isArray(parsed)) skusArray = parsed;
      } catch {}
    }

    const rawCodeBarre = Array.isArray(code_barre) ? code_barre[0] : code_barre;
    const codeBarreVal = rawCodeBarre !== undefined ? (rawCodeBarre && typeof rawCodeBarre === 'string' && rawCodeBarre.trim() ? rawCodeBarre.trim() : null) : existing.rows[0].code_barre;

    const safePrix = (prix !== undefined && prix !== null && String(prix).trim() !== '' && !isNaN(Number(prix))) ? Number(prix) : (prix === '' ? null : existing.rows[0].prix);
    if (safePrix !== null && safePrix !== undefined && Number(safePrix) < 0) {
      return res.status(400).json({ error: 'Le prix du produit ne peut pas être négatif' });
    }
    const safePrixBarre = (prix_barre !== undefined && prix_barre !== null && String(prix_barre).trim() !== '' && !isNaN(Number(prix_barre))) ? Number(prix_barre) : (prix_barre === '' ? null : existing.rows[0].prix_barre);
    if (safePrixBarre !== null && safePrixBarre !== undefined && Number(safePrixBarre) < 0) {
      return res.status(400).json({ error: 'Le prix barré ne peut pas être négatif' });
    }
    const safePrixAchat = (prix_achat !== undefined && prix_achat !== null && String(prix_achat).trim() !== '' && !isNaN(Number(prix_achat))) ? Number(prix_achat) : (prix_achat === '' ? null : existing.rows[0].prix_achat);
    if (safePrixAchat !== null && safePrixAchat !== undefined && Number(safePrixAchat) < 0) {
      return res.status(400).json({ error: 'Le prix d’achat ne peut pas être négatif' });
    }

    const rawStock = stock_quantite !== undefined ? stock_quantite : quantite_stock;
    const safeStock = (rawStock !== undefined && rawStock !== null && String(rawStock).trim() !== '' && !isNaN(Number(rawStock)))
      ? Number(rawStock)
      : (rawStock === '' ? null : existing.rows[0].stock_quantite);
    if (safeStock !== null && safeStock !== undefined && Number(safeStock) < 0) {
      return res.status(400).json({ error: 'La quantité en stock ne peut pas être négative' });
    }
    const finalEnStock = safeStock !== null ? (safeStock > 0) : (en_stock !== 'false');

    const hasVariants = (skusArray && skusArray.length > 0) || (variantesJson.length > 0 && variantesJson.some(v => v.valeurs && v.valeurs.length > 0));

    const r = await pool.query(
      `UPDATE boutique_produits SET nom=$1, description=$2, prix=$3, prix_barre=$4, prix_achat=$5,
       images=$6, en_stock=$7, stock_quantite=$8, categorie=$9, caracteristiques=$10, variantes=$11, code_barre=$12,
       unite_vente=$13, has_variants=$14, date_expiration=$15, updated_at=NOW()
       WHERE id=$16 AND boutique_id=$17 RETURNING *`,
      [nom||existing.rows[0].nom, description||null, safePrix, safePrixBarre, safePrixAchat,
       images, finalEnStock, safeStock, categorie||existing.rows[0].categorie||null,
       caracJson, JSON.stringify(variantesJson), codeBarreVal,
       unite_vente || existing.rows[0].unite_vente || 'piece', hasVariants, date_expiration || existing.rows[0].date_expiration || null, prodId, id]
    );

    // Mise à jour des variantes SKUs si transmises
    if (skusArray && Array.isArray(skusArray)) {
      await pool.query('DELETE FROM boutique_produit_variantes WHERE produit_id=$1 AND boutique_id=$2', [prodId, id]);
      for (let idx = 0; idx < skusArray.length; idx++) {
        const v = skusArray[idx];
        const vPrix = Number(v.prix) || safePrix || 0;
        const vPrixBarre = v.prix_barre ? Number(v.prix_barre) : null;
        const vPrixAchat = v.prix_achat ? Number(v.prix_achat) : null;
        const vStock = v.stock_quantite !== undefined ? Number(v.stock_quantite) : 0;
        await pool.query(
          `INSERT INTO boutique_produit_variantes (boutique_id, produit_id, sku, code_barre, attributs, prix, prix_barre, prix_achat, stock_quantite, image_url, actif, ordre)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true,$11)`,
          [id, prodId, v.sku || null, v.code_barre || null, JSON.stringify(v.attributs || {}), vPrix, vPrixBarre, vPrixAchat, vStock, v.image_url || null, idx]
        ).catch(() => {});
      }
    }

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
    const own = await checkBoutiqueAccess(id, req.user.userId);
    if (!own) return res.status(403).json({ error: 'Accès refusé' });

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
    const own = await checkBoutiqueAccess(id, req.user.userId);
    if (!own) return res.status(403).json({ error: 'Accès refusé' });

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
    const own = await checkBoutiqueAccess(id, req.user.userId);
    if (!own) return res.status(403).json({ error: 'Accès refusé' });

    const r = await pool.query(
      'UPDATE boutique_produits SET partage_le=NOW() WHERE id=$1 AND boutique_id=$2 RETURNING partage_le',
      [prodId, id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Produit introuvable' });
    res.json({ success: true, partage_le: r.rows[0].partage_le });
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

// ── POST /api/boutiques — créer boutique (auth)
router.post('/:id/produits/batch', verifierToken, param('id').isUUID(), async (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(400).json({ error: 'ID invalide' });
  try {
    const { id } = req.params;
    const own = await checkBoutiqueAccess(id, req.user.userId);
    if (!own) return res.status(403).json({ error: 'Accès refusé' });

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
        if (!p.nom?.trim()) continue;
        const images = p.images || (p.photo_defaut ? [p.photo_defaut] : []);
        const stockQty = p.quantite_stock !== undefined && p.quantite_stock !== null
          ? Number(p.quantite_stock)
          : (p.stock_quantite !== undefined && p.stock_quantite !== null ? Number(p.stock_quantite) : 1);
        const prixNum = (p.prix !== undefined && p.prix !== null && String(p.prix).trim() !== '' && !isNaN(Number(p.prix))) ? Number(p.prix) : null;

        const r = await client.query(
          `INSERT INTO boutique_produits (boutique_id, nom, description, prix, images, en_stock, stock_quantite, categorie, code_barre, whatsapp_sync_statut)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'synchronise') RETURNING *`,
          [
            id,
            p.nom.trim(),
            p.description || null,
            prixNum,
            images,
            p.en_stock !== false,
            stockQty,
            p.categorie || null,
            p.code_barre?.trim() || null,
          ]
        );
        insere.push(r.rows[0]);
      }
      if (insere.length === 0 && produits.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Aucun produit valide à importer. Les produits doivent avoir un nom non-vide.', count: 0 });
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
    const { client_nom, nom_client, nom, note, commentaire, commande_ref } = req.body;
    const authorName = (client_nom || nom_client || nom || '').trim();

    if (!authorName) {
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
      `INSERT INTO boutique_avis (boutique_id, produit_id, client_nom, nom_client, note, commentaire, commande_ref)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [targetBoutiqueId, prodId, authorName, authorName, Number(note), commentaire.trim(), commande_ref || null]
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
// ── SPRINT 4 (POINT 10) : BUNDLES / PACKS & TARIFS PAR QUANTITÉ B2B ─────────────────

// GET /api/boutiques/:id/produits/:prodId/composants — composant du pack
router.get('/:id/produits/:prodId/composants', async (req, res) => {
  try {
    const { prodId } = req.params;
    const { rows } = await pool.query(
      `SELECT pc.id, pc.enfant_id, pc.quantite, p.nom, p.prix, p.images, p.stock_quantite
       FROM produit_composants pc
       JOIN boutique_produits p ON p.id = pc.enfant_id
       WHERE pc.parent_id = $1`,
      [prodId]
    );
    res.json({ composants: rows });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors du chargement des composants du pack' });
  }
});

// POST /api/boutiques/:id/produits/:prodId/composants — Définir le contenu d'un pack (Anti-IDOR)
router.post('/:id/produits/:prodId/composants', verifierToken, async (req, res) => {
  try {
    const { id, prodId } = req.params;
    const { composants } = req.body; // Array of { enfant_id, quantite }
    const access = await checkBoutiqueAccess(req.user.id, id);
    if (!access.allowed) return res.status(403).json({ error: access.reason });

    await pool.query('DELETE FROM produit_composants WHERE parent_id = $1', [prodId]);

    if (Array.isArray(composants) && composants.length > 0) {
      for (const comp of composants) {
        if (comp.enfant_id && comp.quantite > 0) {
          await pool.query(
            `INSERT INTO produit_composants (parent_id, enfant_id, quantite)
             VALUES ($1, $2, $3) ON CONFLICT (parent_id, enfant_id) DO UPDATE SET quantite = EXCLUDED.quantite`,
            [prodId, comp.enfant_id, comp.quantite]
          );
        }
      }
    }

    cacheInvalidatePattern(`cat:${id}`);
    res.json({ success: true, message: 'Pack mis à jour avec succès' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour des composants' });
  }
});

// GET /api/boutiques/:id/produits/:prodId/tarifs-quantite — Grille B2B
router.get('/:id/produits/:prodId/tarifs-quantite', async (req, res) => {
  try {
    const { prodId } = req.params;
    const { rows } = await pool.query(
      `SELECT id, quantite_min, prix_unitaire_fcfa
       FROM produit_tarifs_quantite
       WHERE produit_id = $1
       ORDER BY quantite_min ASC`,
      [prodId]
    );
    res.json({ tarifs: rows });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors du chargement de la grille tarifaire' });
  }
});

// POST /api/boutiques/:id/produits/:prodId/tarifs-quantite — Définir les seuils B2B (Anti-IDOR)
router.post('/:id/produits/:prodId/tarifs-quantite', verifierToken, async (req, res) => {
  try {
    const { id, prodId } = req.params;
    const { tarifs } = req.body; // Array of { quantite_min, prix_unitaire_fcfa }
    const access = await checkBoutiqueAccess(req.user.id, id);
    if (!access.allowed) return res.status(403).json({ error: access.reason });

    await pool.query('DELETE FROM produit_tarifs_quantite WHERE produit_id = $1', [prodId]);

    if (Array.isArray(tarifs) && tarifs.length > 0) {
      for (const t of tarifs) {
        if (t.quantite_min > 1 && t.prix_unitaire_fcfa > 0) {
          await pool.query(
            `INSERT INTO produit_tarifs_quantite (produit_id, quantite_min, prix_unitaire_fcfa)
             VALUES ($1, $2, $3) ON CONFLICT (produit_id, quantite_min) DO UPDATE SET prix_unitaire_fcfa = EXCLUDED.prix_unitaire_fcfa`,
            [prodId, Number(t.quantite_min), Number(t.prix_unitaire_fcfa)]
          );
        }
      }
    }

    cacheInvalidatePattern(`cat:${id}`);
    res.json({ success: true, message: 'Grille tarifaire B2B enregistrée' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement de la grille' });
  }
});

module.exports = router;
