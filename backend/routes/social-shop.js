// backend/routes/social-shop.js
// API Social Shop & Social Commerce Nopalou (Vitrine publique + Dashboard Marchand)

const express = require('express');
const router = express.Router({ mergeParams: true });
const { pool } = require('../models/db');
const { verifierToken } = require('../middlewares/auth');
const { limiterGeneral } = require('../middlewares/rateLimit');
const {
  detectPlatform,
  extractExternalPostId,
  fetchOEmbedMetadata,
  matchProductsWithCaption,
  cleanUsername,
  parseBatchUrls,
  exploreProfile,
} = require('../services/social-parser');

// ── Helper de Résolution Boutique (UUID ou Slug) ─────────────────────────────
async function resolveBoutiqueId(idOrSlug) {
  if (!idOrSlug) return null;
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
  if (isUUID) {
    const r = await pool.query('SELECT id, nom, slug, whatsapp, telephone, actif FROM boutiques WHERE id = $1', [idOrSlug]);
    return r.rows[0] || null;
  }
  const r = await pool.query('SELECT id, nom, slug, whatsapp, telephone, actif FROM boutiques WHERE slug = $1', [idOrSlug]);
  return r.rows[0] || null;
}

// ── Helper de Sécurité & Isolation Multi-Tenant Marchand ─────────────────────
async function verifierAccesBoutique(boutiqueId, userId) {
  const query = `
    SELECT b.id, b.nom
    FROM boutiques b
    LEFT JOIN boutique_utilisateurs bu ON b.id = bu.boutique_id AND bu.utilisateur_id = $2
    WHERE b.id = $1 AND (b.utilisateur_id = $2 OR bu.utilisateur_id = $2)
    LIMIT 1
  `;
  const { rows } = await pool.query(query, [boutiqueId, userId]);
  return rows[0] || null;
}

// ============================================================================
// 🌐 1. ROUTES PUBLIQUES (VITRINE SOCIAL SHOP ACHETEUR)
// ============================================================================

/**
 * GET /api/boutiques/:id/social/posts
 * Récupère le feed social public de la boutique avec les produits associés
 */
router.get(['/boutiques/:id/social/posts', '/:id/posts'], limiterGeneral, async (req, res) => {
  try {
    const boutique = await resolveBoutiqueId(req.params.id);
    if (!boutique || boutique.actif === false) {
      return res.status(404).json({ error: 'Boutique introuvable ou inactive' });
    }

    const { plateforme, featured, limit = 40 } = req.query;
    const params = [boutique.id];
    let whereClause = `sp.boutique_id = $1 AND sp.visible = TRUE`;

    if (plateforme && ['instagram', 'tiktok', 'facebook', 'youtube'].includes(plateforme.toLowerCase())) {
      params.push(plateforme.toLowerCase());
      whereClause += ` AND sp.plateforme = $${params.length}`;
    }

    if (featured === 'true' || featured === '1') {
      whereClause += ` AND sp.is_featured = TRUE`;
    }

    params.push(Math.min(100, Math.max(1, parseInt(limit, 10) || 40)));

    const sql = `
      SELECT
        sp.id,
        sp.boutique_id,
        sp.plateforme,
        sp.external_post_id,
        sp.post_url,
        sp.media_type,
        sp.media_url,
        sp.thumbnail_url,
        sp.embed_html,
        sp.caption,
        sp.auteur,
        sp.is_featured,
        sp.ordre,
        sp.published_at,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', bp.id,
                'nom', bp.nom,
                'prix', bp.prix,
                'prix_barre', bp.prix_barre,
                'images', bp.images,
                'en_stock', bp.en_stock,
                'categorie', bp.categorie,
                'confidence_score', spp.confidence_score
              ) ORDER BY spp.ordre ASC, spp.created_at ASC
            )
            FROM social_post_produits spp
            JOIN boutique_produits bp ON bp.id = spp.produit_id
            WHERE spp.social_post_id = sp.id AND bp.en_stock = TRUE
          ),
          '[]'::json
        ) AS produits_associes
      FROM social_posts sp
      WHERE ${whereClause}
      ORDER BY sp.is_featured DESC, sp.ordre ASC, sp.published_at DESC, sp.created_at DESC
      LIMIT $${params.length}
    `;

    const { rows } = await pool.query(sql, params);

    // Récupérer également les profils officiels connectés (pour les badges d'en-tête)
    const accountsRes = await pool.query(
      `SELECT plateforme, nom_compte, profil_url FROM social_accounts WHERE boutique_id = $1 AND statut = 'actif'`,
      [boutique.id]
    );

    res.json({
      boutique: {
        id: boutique.id,
        nom: boutique.nom,
        slug: boutique.slug,
        whatsapp: boutique.whatsapp,
        telephone: boutique.telephone,
      },
      comptes_sociaux: accountsRes.rows,
      posts: rows,
      total: rows.length,
    });
  } catch (err) {
    console.error('[SOCIAL_SHOP_GET_POSTS_ERR]', err);
    res.status(500).json({ error: 'Erreur lors du chargement du Social Shop' });
  }
});

/**
 * GET /api/boutiques/:id/social/posts/:postId
 * Récupère le détail d'une publication spécifique (Deep Link / Modal)
 */
router.get(['/boutiques/:id/social/posts/:postId', '/:id/posts/:postId'], limiterGeneral, async (req, res) => {
  try {
    const boutique = await resolveBoutiqueId(req.params.id);
    if (!boutique) return res.status(404).json({ error: 'Boutique introuvable' });

    const sql = `
      SELECT
        sp.id,
        sp.boutique_id,
        sp.plateforme,
        sp.external_post_id,
        sp.post_url,
        sp.media_type,
        sp.media_url,
        sp.thumbnail_url,
        sp.embed_html,
        sp.caption,
        sp.auteur,
        sp.is_featured,
        sp.published_at,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', bp.id,
                'nom', bp.nom,
                'description', bp.description,
                'prix', bp.prix,
                'prix_barre', bp.prix_barre,
                'images', bp.images,
                'en_stock', bp.en_stock,
                'categorie', bp.categorie,
                'caracteristiques', bp.caracteristiques
              ) ORDER BY spp.ordre ASC, spp.created_at ASC
            )
            FROM social_post_produits spp
            JOIN boutique_produits bp ON bp.id = spp.produit_id
            WHERE spp.social_post_id = sp.id
          ),
          '[]'::json
        ) AS produits_associes
      FROM social_posts sp
      WHERE sp.id = $1 AND sp.boutique_id = $2
      LIMIT 1
    `;

    const { rows } = await pool.query(sql, [req.params.postId, boutique.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Publication introuvable' });

    res.json({ post: rows[0] });
  } catch (err) {
    console.error('[SOCIAL_SHOP_GET_POST_DETAIL_ERR]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/boutiques/:id/social/events
 * Enregistrement des événements Social Commerce (Attribution)
 */
router.post(['/boutiques/:id/social/events', '/:id/events'], limiterGeneral, async (req, res) => {
  try {
    const boutique = await resolveBoutiqueId(req.params.id);
    if (!boutique) return res.status(404).json({ error: 'Boutique introuvable' });

    const { event_type, social_post_id, produit_id, session_id } = req.body;
    const TYPES_VALIDES = [
      'social_content_view',
      'social_content_click',
      'social_product_click',
      'social_add_to_cart',
      'social_whatsapp_click',
    ];

    if (!TYPES_VALIDES.includes(event_type)) {
      return res.status(400).json({ error: 'Type d\'événement invalide' });
    }

    await pool.query(
      `INSERT INTO social_analytics_events (boutique_id, social_post_id, produit_id, event_type, session_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [boutique.id, social_post_id || null, produit_id || null, event_type, session_id || null]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error('[SOCIAL_EVENT_ERR]', err.message);
    res.status(500).json({ error: 'Erreur enregistrement événement' });
  }
});

// ============================================================================
// 🔒 2. ROUTES MARCHAND (GESTION DU SOCIAL SHOP & CURATION)
// ============================================================================

/**
 * GET /api/boutiques/:id/social/admin/overview
 * Tableau de bord Social Shop pour le marchand
 */
router.get(['/boutiques/:id/social/admin/overview', '/:id/admin/overview'], verifierToken, async (req, res) => {
  try {
    const boutique = await resolveBoutiqueId(req.params.id);
    if (!boutique) return res.status(404).json({ error: 'Boutique introuvable' });

    const hasAccess = await verifierAccesBoutique(boutique.id, req.user.userId);
    if (!hasAccess) return res.status(403).json({ error: 'Accès non autorisé' });

    // Comptes sociaux connectés
    const accountsRes = await pool.query(
      `SELECT id, plateforme, nom_compte, profil_url, statut, derniere_sync_at, auto_sync, created_at
       FROM social_accounts
       WHERE boutique_id = $1
       ORDER BY created_at ASC`,
      [boutique.id]
    );

    // Statistiques des publications
    const statsRes = await pool.query(
      `SELECT
         COUNT(*)::int AS total_posts,
         COUNT(*) FILTER (WHERE visible = TRUE)::int AS posts_affiches,
         COUNT(*) FILTER (WHERE visible = FALSE)::int AS posts_masques,
         COUNT(*) FILTER (WHERE is_featured = TRUE)::int AS posts_a_la_une,
         (
           SELECT COUNT(DISTINCT sp.id)::int
           FROM social_posts sp
           LEFT JOIN social_post_produits spp ON spp.social_post_id = sp.id
           WHERE sp.boutique_id = $1 AND spp.id IS NULL
         ) AS posts_sans_produits
       FROM social_posts
       WHERE boutique_id = $1`,
      [boutique.id]
    );

    // Statistiques d'analytics (30 derniers jours)
    const analyticsRes = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE event_type = 'social_content_view')::int AS vues_sociales,
         COUNT(*) FILTER (WHERE event_type = 'social_content_click')::int AS clics_contenu,
         COUNT(*) FILTER (WHERE event_type = 'social_product_click')::int AS clics_produit,
         COUNT(*) FILTER (WHERE event_type = 'social_add_to_cart')::int AS ajouts_panier,
         COUNT(*) FILTER (WHERE event_type = 'social_whatsapp_click')::int AS clics_whatsapp
       FROM social_analytics_events
       WHERE boutique_id = $1 AND created_at >= NOW() - INTERVAL '30 days'`,
      [boutique.id]
    );

    res.json({
      comptes: accountsRes.rows,
      stats: statsRes.rows[0] || {},
      analytics_30j: analyticsRes.rows[0] || {},
    });
  } catch (err) {
    console.error('[SOCIAL_ADMIN_OVERVIEW_ERR]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/boutiques/:id/social/admin/posts
 * Liste complète des publications pour la table de curation du marchand
 */
router.get(['/boutiques/:id/social/admin/posts', '/:id/admin/posts'], verifierToken, async (req, res) => {
  try {
    const boutique = await resolveBoutiqueId(req.params.id);
    if (!boutique) return res.status(404).json({ error: 'Boutique introuvable' });

    const hasAccess = await verifierAccesBoutique(boutique.id, req.user.userId);
    if (!hasAccess) return res.status(403).json({ error: 'Accès non autorisé' });

    const sql = `
      SELECT
        sp.*,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', bp.id,
                'nom', bp.nom,
                'prix', bp.prix,
                'images', bp.images,
                'en_stock', bp.en_stock,
                'confidence_score', spp.confidence_score
              ) ORDER BY spp.ordre ASC
            )
            FROM social_post_produits spp
            JOIN boutique_produits bp ON bp.id = spp.produit_id
            WHERE spp.social_post_id = sp.id
          ),
          '[]'::json
        ) AS produits
      FROM social_posts sp
      WHERE sp.boutique_id = $1
      ORDER BY sp.is_featured DESC, sp.ordre ASC, sp.created_at DESC
    `;

    const { rows } = await pool.query(sql, [boutique.id]);
    res.json({ posts: rows });
  } catch (err) {
    console.error('[SOCIAL_ADMIN_GET_POSTS_ERR]', err);
    res.status(500).json({ error: 'Erreur chargement des publications' });
  }
});

/**
 * POST /api/boutiques/:id/social/admin/import-url
 * Importe une publication par URL publique (TikTok, Instagram, Facebook, YouTube)
 * Récupère les métadonnées officielles via oEmbed et suggère des produits correspondants (Smart Matching)
 */
router.post(['/boutiques/:id/social/admin/import-url', '/:id/admin/import-url'], verifierToken, async (req, res) => {
  try {
    const boutique = await resolveBoutiqueId(req.params.id);
    if (!boutique) return res.status(404).json({ error: 'Boutique introuvable' });

    const hasAccess = await verifierAccesBoutique(boutique.id, req.user.userId);
    if (!hasAccess) return res.status(403).json({ error: 'Accès non autorisé' });

    const { url, auto_link_best_match } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL de publication requise' });
    }

    const platform = detectPlatform(url);
    if (!platform) {
      return res.status(400).json({
        error: 'Plateforme non reconnue. Veuillez fournir un lien TikTok, Instagram, Facebook ou YouTube.',
      });
    }

    // Récupération des métadonnées officielles via oEmbed
    const meta = await fetchOEmbedMetadata(url, platform);

    // Insertion idempotente (si déjà importée, mise à jour des métadonnées)
    const insertSql = `
      INSERT INTO social_posts (
        boutique_id, plateforme, external_post_id, post_url, media_type,
        thumbnail_url, embed_html, caption, auteur, derniere_sync_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      ON CONFLICT (boutique_id, post_url) DO UPDATE SET
        thumbnail_url = EXCLUDED.thumbnail_url,
        embed_html = EXCLUDED.embed_html,
        caption = COALESCE(NULLIF(EXCLUDED.caption, ''), social_posts.caption),
        derniere_sync_at = NOW(),
        updated_at = NOW()
      RETURNING *
    `;

    const insertRes = await pool.query(insertSql, [
      boutique.id,
      platform,
      meta.externalPostId,
      url.trim(),
      meta.mediaType,
      meta.thumbnailUrl,
      meta.embedHtml,
      meta.caption || meta.title || '',
      meta.author || '',
    ]);

    const post = insertRes.rows[0];

    // Récupérer les produits de la boutique pour le Smart Matching
    const prodsRes = await pool.query(
      `SELECT id, nom, description, prix, prix_barre, images, en_stock, categorie
       FROM boutique_produits
       WHERE boutique_id = $1
       ORDER BY ordre ASC, created_at DESC`,
      [boutique.id]
    );

    const produitsDisponibles = prodsRes.rows;
    const suggestions = matchProductsWithCaption(post.caption, produitsDisponibles);

    // Si le marchand a activé auto_link_best_match et qu'une suggestion est très haute (score >= 0.85)
    let autoLinkedProduct = null;
    if (auto_link_best_match && suggestions.length > 0 && suggestions[0].confidence_score >= 0.85) {
      const topMatch = suggestions[0];
      await pool.query(
        `INSERT INTO social_post_produits (social_post_id, produit_id, confidence_score, valide_par_marchand)
         VALUES ($1, $2, $3, TRUE)
         ON CONFLICT (social_post_id, produit_id) DO NOTHING`,
        [post.id, topMatch.produit.id, topMatch.confidence_score]
      );
      autoLinkedProduct = topMatch.produit;
    }

    res.json({
      success: true,
      post,
      suggestions: suggestions.slice(0, 5),
      auto_linked_product: autoLinkedProduct,
    });
  } catch (err) {
    console.error('[SOCIAL_IMPORT_URL_ERR]', err);
    res.status(500).json({ error: 'Erreur lors de l\'importation de la publication : ' + err.message });
  }
});

/**
 * PATCH /api/boutiques/:id/social/admin/posts/:postId
 * Met à jour le statut d'affichage, mise à la une ou ordre d'une publication
 */
router.patch(['/boutiques/:id/social/admin/posts/:postId', '/:id/admin/posts/:postId'], verifierToken, async (req, res) => {
  try {
    const boutique = await resolveBoutiqueId(req.params.id);
    if (!boutique) return res.status(404).json({ error: 'Boutique introuvable' });

    const hasAccess = await verifierAccesBoutique(boutique.id, req.user.userId);
    if (!hasAccess) return res.status(403).json({ error: 'Accès non autorisé' });

    const { visible, is_featured, ordre, caption } = req.body;

    const fields = [];
    const values = [req.params.postId, boutique.id];

    if (visible !== undefined) {
      values.push(Boolean(visible));
      fields.push(`visible = $${values.length}`);
    }
    if (is_featured !== undefined) {
      values.push(Boolean(is_featured));
      fields.push(`is_featured = $${values.length}`);
    }
    if (ordre !== undefined) {
      values.push(parseInt(ordre, 10) || 0);
      fields.push(`ordre = $${values.length}`);
    }
    if (caption !== undefined) {
      values.push(String(caption));
      fields.push(`caption = $${values.length}`);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'Aucun champ à modifier' });
    }

    fields.push(`updated_at = NOW()`);

    const sql = `
      UPDATE social_posts
      SET ${fields.join(', ')}
      WHERE id = $1 AND boutique_id = $2
      RETURNING *
    `;

    const { rows } = await pool.query(sql, values);
    if (!rows[0]) return res.status(404).json({ error: 'Publication introuvable' });

    res.json({ success: true, post: rows[0] });
  } catch (err) {
    console.error('[SOCIAL_UPDATE_POST_ERR]', err);
    res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }
});

/**
 * DELETE /api/boutiques/:id/social/admin/posts/:postId
 * Supprime une publication du Social Shop
 */
router.delete(['/boutiques/:id/social/admin/posts/:postId', '/:id/admin/posts/:postId'], verifierToken, async (req, res) => {
  try {
    const boutique = await resolveBoutiqueId(req.params.id);
    if (!boutique) return res.status(404).json({ error: 'Boutique introuvable' });

    const hasAccess = await verifierAccesBoutique(boutique.id, req.user.userId);
    if (!hasAccess) return res.status(403).json({ error: 'Accès non autorisé' });

    await pool.query(
      `DELETE FROM social_posts WHERE id = $1 AND boutique_id = $2`,
      [req.params.postId, boutique.id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('[SOCIAL_DELETE_POST_ERR]', err);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

/**
 * POST /api/boutiques/:id/social/admin/posts/:postId/produits
 * Associe un produit de la boutique à une publication
 */
router.post(['/boutiques/:id/social/admin/posts/:postId/produits', '/:id/admin/posts/:postId/produits'], verifierToken, async (req, res) => {
  try {
    const boutique = await resolveBoutiqueId(req.params.id);
    if (!boutique) return res.status(404).json({ error: 'Boutique introuvable' });

    const hasAccess = await verifierAccesBoutique(boutique.id, req.user.userId);
    if (!hasAccess) return res.status(403).json({ error: 'Accès non autorisé' });

    const { produit_id, confidence_score = 1.0 } = req.body;
    if (!produit_id) return res.status(400).json({ error: 'produit_id requis' });

    // Vérifier que le produit appartient bien à la même boutique (sécurité multi-tenant)
    const pCheck = await pool.query(
      `SELECT id FROM boutique_produits WHERE id = $1 AND boutique_id = $2`,
      [produit_id, boutique.id]
    );
    if (!pCheck.rows[0]) {
      return res.status(400).json({ error: 'Le produit sélectionné n\'appartient pas à votre boutique' });
    }

    // Vérifier que la publication appartient à la boutique
    const postCheck = await pool.query(
      `SELECT id FROM social_posts WHERE id = $1 AND boutique_id = $2`,
      [req.params.postId, boutique.id]
    );
    if (!postCheck.rows[0]) {
      return res.status(404).json({ error: 'Publication introuvable' });
    }

    await pool.query(
      `INSERT INTO social_post_produits (social_post_id, produit_id, confidence_score, valide_par_marchand)
       VALUES ($1, $2, $3, TRUE)
       ON CONFLICT (social_post_id, produit_id) DO UPDATE SET
         confidence_score = EXCLUDED.confidence_score,
         valide_par_marchand = TRUE`,
      [req.params.postId, produit_id, parseFloat(confidence_score) || 1.0]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('[SOCIAL_LINK_PRODUCT_ERR]', err);
    res.status(500).json({ error: 'Erreur lors de l\'association du produit' });
  }
});

/**
 * DELETE /api/boutiques/:id/social/admin/posts/:postId/produits/:produitId
 * Dissocie un produit d'une publication
 */
router.delete(['/boutiques/:id/social/admin/posts/:postId/produits/:produitId', '/:id/admin/posts/:postId/produits/:produitId'], verifierToken, async (req, res) => {
  try {
    const boutique = await resolveBoutiqueId(req.params.id);
    if (!boutique) return res.status(404).json({ error: 'Boutique introuvable' });

    const hasAccess = await verifierAccesBoutique(boutique.id, req.user.userId);
    if (!hasAccess) return res.status(403).json({ error: 'Accès non autorisé' });

    await pool.query(
      `DELETE FROM social_post_produits WHERE social_post_id = $1 AND produit_id = $2`,
      [req.params.postId, req.params.produitId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('[SOCIAL_UNLINK_PRODUCT_ERR]', err);
    res.status(500).json({ error: 'Erreur dissociation produit' });
  }
});

/**
 * POST /api/boutiques/:id/social/admin/accounts
 * Enregistre ou met à jour le profil/compte officiel du marchand (Instagram, TikTok, Facebook)
 */
router.post(['/boutiques/:id/social/admin/accounts', '/:id/admin/accounts'], verifierToken, async (req, res) => {
  try {
    const boutique = await resolveBoutiqueId(req.params.id);
    if (!boutique) return res.status(404).json({ error: 'Boutique introuvable' });

    const hasAccess = await verifierAccesBoutique(boutique.id, req.user.userId);
    if (!hasAccess) return res.status(403).json({ error: 'Accès non autorisé' });

    const { plateforme, nom_compte, profil_url } = req.body;
    if (!plateforme || !nom_compte) {
      return res.status(400).json({ error: 'Plateforme et nom de compte requis' });
    }

    const plat = plateforme.toLowerCase();
    if (!['instagram', 'tiktok', 'facebook', 'youtube'].includes(plat)) {
      return res.status(400).json({ error: 'Plateforme invalide' });
    }

    // Normalisation de l'URL du profil si manquant
    let finalProfilUrl = profil_url || null;
    const cleanHandle = nom_compte.replace(/^@/, '').trim();
    if (!finalProfilUrl) {
      if (plat === 'instagram') finalProfilUrl = `https://instagram.com/${cleanHandle}`;
      else if (plat === 'tiktok') finalProfilUrl = `https://tiktok.com/@${cleanHandle}`;
      else if (plat === 'facebook') finalProfilUrl = `https://facebook.com/${cleanHandle}`;
    }

    const { rows } = await pool.query(
      `INSERT INTO social_accounts (boutique_id, plateforme, nom_compte, profil_url, statut, updated_at)
       VALUES ($1, $2, $3, $4, 'actif', NOW())
       ON CONFLICT (boutique_id, plateforme) DO UPDATE SET
         nom_compte = EXCLUDED.nom_compte,
         profil_url = EXCLUDED.profil_url,
         statut = 'actif',
         updated_at = NOW()
       RETURNING *`,
      [boutique.id, plat, nom_compte.trim(), finalProfilUrl]
    );

    // Mettre à jour en miroir la table `boutiques` pour la rétro-compatibilité
    if (plat === 'instagram') {
      await pool.query('UPDATE boutiques SET instagram = $1 WHERE id = $2', [finalProfilUrl, boutique.id]);
    } else if (plat === 'facebook') {
      await pool.query('UPDATE boutiques SET facebook = $1 WHERE id = $2', [finalProfilUrl, boutique.id]);
    }

    res.json({ success: true, account: rows[0] });
  } catch (err) {
    console.error('[SOCIAL_SAVE_ACCOUNT_ERR]', err);
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement du compte' });
  }
});

/**
 * DELETE /api/boutiques/:id/social/admin/accounts/:plateforme
 * Déconnecte un compte social de la boutique
 */
router.delete(['/boutiques/:id/social/admin/accounts/:plateforme', '/:id/admin/accounts/:plateforme'], verifierToken, async (req, res) => {
  try {
    const boutique = await resolveBoutiqueId(req.params.id);
    if (!boutique) return res.status(404).json({ error: 'Boutique introuvable' });

    const hasAccess = await verifierAccesBoutique(boutique.id, req.user.userId);
    if (!hasAccess) return res.status(403).json({ error: 'Accès non autorisé' });

    const plat = req.params.plateforme.toLowerCase();
    await pool.query(
      `DELETE FROM social_accounts WHERE boutique_id = $1 AND plateforme = $2`,
      [boutique.id, plat]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('[SOCIAL_DELETE_ACCOUNT_ERR]', err);
    res.status(500).json({ error: 'Erreur lors de la déconnexion' });
  }
});

/**
 * POST /api/boutiques/:id/social/admin/smart-match/:postId
 * Relance l'analyse de Smart Matching pour une publication donnée
 */
router.post(['/boutiques/:id/social/admin/smart-match/:postId', '/:id/admin/smart-match/:postId'], verifierToken, async (req, res) => {
  try {
    const boutique = await resolveBoutiqueId(req.params.id);
    if (!boutique) return res.status(404).json({ error: 'Boutique introuvable' });

    const hasAccess = await verifierAccesBoutique(boutique.id, req.user.userId);
    if (!hasAccess) return res.status(403).json({ error: 'Accès non autorisé' });

    const postRes = await pool.query(
      `SELECT id, caption FROM social_posts WHERE id = $1 AND boutique_id = $2`,
      [req.params.postId, boutique.id]
    );
    if (!postRes.rows[0]) return res.status(404).json({ error: 'Publication introuvable' });

    const prodsRes = await pool.query(
      `SELECT id, nom, description, prix, prix_barre, images, en_stock, categorie
       FROM boutique_produits
       WHERE boutique_id = $1
       ORDER BY ordre ASC, created_at DESC`,
      [boutique.id]
    );

    const suggestions = matchProductsWithCaption(postRes.rows[0].caption, prodsRes.rows);
    res.json({ suggestions: suggestions.slice(0, 8) });
  } catch (err) {
    console.error('[SMART_MATCH_ERR]', err);
    res.status(500).json({ error: 'Erreur lors de l\'analyse' });
  }
});

/**
 * POST /api/boutiques/:id/social/admin/import-batch
 * Importe une liste d'URLs en lot (Batch Import multi-liens)
 */
router.post(['/boutiques/:id/social/admin/import-batch', '/:id/admin/import-batch'], verifierToken, async (req, res) => {
  try {
    const boutique = await resolveBoutiqueId(req.params.id);
    if (!boutique) return res.status(404).json({ error: 'Boutique introuvable' });

    const hasAccess = await verifierAccesBoutique(boutique.id, req.user.userId);
    if (!hasAccess) return res.status(403).json({ error: 'Accès non autorisé' });

    const { raw_urls, auto_link_best_match } = req.body;
    const parsedPosts = parseBatchUrls(raw_urls);

    if (!parsedPosts || parsedPosts.length === 0) {
      return res.status(400).json({ error: 'Aucune URL valide détectée (TikTok, Instagram, Facebook ou YouTube).' });
    }

    // Récupération des produits pour le Smart Matching
    const prodsRes = await pool.query(
      `SELECT id, nom, description, prix, prix_barre, images, en_stock, categorie
       FROM boutique_produits
       WHERE boutique_id = $1
       ORDER BY ordre ASC, created_at DESC`,
      [boutique.id]
    );
    const produits = prodsRes.rows;

    const results = [];
    let importedCount = 0;
    let autoLinkedCount = 0;

    for (const item of parsedPosts) {
      try {
        const meta = await fetchOEmbedMetadata(item.url, item.platform);
        const insertSql = `
          INSERT INTO social_posts (
            boutique_id, plateforme, external_post_id, post_url, media_type,
            thumbnail_url, embed_html, caption, auteur, derniere_sync_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
          ON CONFLICT (boutique_id, post_url) DO UPDATE SET
            thumbnail_url = EXCLUDED.thumbnail_url,
            embed_html = EXCLUDED.embed_html,
            caption = COALESCE(NULLIF(EXCLUDED.caption, ''), social_posts.caption),
            derniere_sync_at = NOW(),
            updated_at = NOW()
          RETURNING *
        `;
        const postRes = await pool.query(insertSql, [
          boutique.id,
          item.platform,
          meta.externalPostId,
          item.url,
          meta.mediaType,
          meta.thumbnailUrl,
          meta.embedHtml,
          meta.caption || meta.title || '',
          meta.author || '',
        ]);
        const post = postRes.rows[0];
        importedCount++;

        // Smart Matching
        const suggestions = matchProductsWithCaption(post.caption, produits);
        let autoLinked = false;
        if (auto_link_best_match && suggestions.length > 0 && suggestions[0].confidence_score >= 0.85) {
          const topMatch = suggestions[0];
          await pool.query(
            `INSERT INTO social_post_produits (social_post_id, produit_id, confidence_score, valide_par_marchand)
             VALUES ($1, $2, $3, TRUE)
             ON CONFLICT (social_post_id, produit_id) DO NOTHING`,
            [post.id, topMatch.produit.id, topMatch.confidence_score]
          );
          autoLinked = true;
          autoLinkedCount++;
        }

        results.push({
          url: item.url,
          platform: item.platform,
          postId: post.id,
          success: true,
          auto_linked: autoLinked,
        });
      } catch (postErr) {
        results.push({
          url: item.url,
          platform: item.platform,
          success: false,
          error: postErr.message,
        });
      }
    }

    res.json({
      success: true,
      total_detected: parsedPosts.length,
      imported_count: importedCount,
      auto_linked_count: autoLinkedCount,
      results,
    });
  } catch (err) {
    console.error('[SOCIAL_IMPORT_BATCH_ERR]', err);
    res.status(500).json({ error: 'Erreur lors de l\'importation en lot : ' + err.message });
  }
});

/**
 * POST /api/boutiques/:id/social/admin/explore-profile
 * Aspire et découvre les publications publiques d'un profil (@pseudo)
 */
router.post(['/boutiques/:id/social/admin/explore-profile', '/:id/admin/explore-profile'], verifierToken, async (req, res) => {
  try {
    const boutique = await resolveBoutiqueId(req.params.id);
    if (!boutique) return res.status(404).json({ error: 'Boutique introuvable' });

    const hasAccess = await verifierAccesBoutique(boutique.id, req.user.userId);
    if (!hasAccess) return res.status(403).json({ error: 'Accès non autorisé' });

    const { plateforme, username } = req.body;
    if (!plateforme || !username) {
      return res.status(400).json({ error: 'Plateforme et nom d\'utilisateur requis' });
    }

    const cleanUser = cleanUsername(username);
    const exploration = await exploreProfile(plateforme.toLowerCase(), cleanUser);

    if (!exploration.success && (!exploration.posts || exploration.posts.length === 0)) {
      return res.status(400).json({ error: exploration.error || 'Impossible d\'explorer ce profil' });
    }

    // Vérifier les posts déjà importés pour cette boutique
    const existingRes = await pool.query(
      `SELECT post_url, external_post_id FROM social_posts WHERE boutique_id = $1`,
      [boutique.id]
    );
    const existingUrls = new Set(existingRes.rows.map(r => r.post_url));
    const existingExtIds = new Set(existingRes.rows.map(r => r.external_post_id).filter(Boolean));

    const postsWithStatus = (exploration.posts || []).map(p => ({
      ...p,
      is_already_imported: existingUrls.has(p.url) || (p.externalPostId ? existingExtIds.has(p.externalPostId) : false),
    }));

    res.json({
      success: true,
      plateforme: exploration.platform,
      username: exploration.username,
      source: exploration.source,
      posts: postsWithStatus,
    });
  } catch (err) {
    console.error('[SOCIAL_EXPLORE_PROFILE_ERR]', err);
    res.status(500).json({ error: 'Erreur exploration profil : ' + err.message });
  }
});

/**
 * POST /api/boutiques/:id/social/admin/sync-account/:accountId
 * Synchronise les dernières publications d'un compte social connecté
 */
router.post(['/boutiques/:id/social/admin/sync-account/:accountId', '/:id/admin/sync-account/:accountId'], verifierToken, async (req, res) => {
  try {
    const boutique = await resolveBoutiqueId(req.params.id);
    if (!boutique) return res.status(404).json({ error: 'Boutique introuvable' });

    const hasAccess = await verifierAccesBoutique(boutique.id, req.user.userId);
    if (!hasAccess) return res.status(403).json({ error: 'Accès non autorisé' });

    const accRes = await pool.query(
      `SELECT * FROM social_accounts WHERE id = $1 AND boutique_id = $2`,
      [req.params.accountId, boutique.id]
    );
    if (!accRes.rows[0]) return res.status(404).json({ error: 'Compte social introuvable' });

    const account = accRes.rows[0];
    const exploration = await exploreProfile(account.plateforme, account.nom_compte);

    let newlyImported = 0;
    if (exploration.success && Array.isArray(exploration.posts)) {
      const prodsRes = await pool.query(
        `SELECT id, nom, description, prix, en_stock, categorie FROM boutique_produits WHERE boutique_id = $1`,
        [boutique.id]
      );
      const produits = prodsRes.rows;

      for (const item of exploration.posts) {
        try {
          const meta = await fetchOEmbedMetadata(item.url, account.plateforme);
          const insertRes = await pool.query(
            `INSERT INTO social_posts (
               boutique_id, social_account_id, plateforme, external_post_id, post_url,
               media_type, thumbnail_url, embed_html, caption, auteur, derniere_sync_at
             )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
             ON CONFLICT (boutique_id, post_url) DO UPDATE SET
               thumbnail_url = COALESCE(EXCLUDED.thumbnail_url, social_posts.thumbnail_url),
               derniere_sync_at = NOW()
             RETURNING id, (xmax = 0) AS is_new`,
            [
              boutique.id,
              account.id,
              account.plateforme,
              item.externalPostId || meta.externalPostId,
              item.url,
              meta.mediaType,
              item.thumbnailUrl || meta.thumbnailUrl,
              meta.embedHtml,
              item.caption || meta.caption || '',
              account.nom_compte,
            ]
          );

          if (insertRes.rows[0] && insertRes.rows[0].is_new) {
            newlyImported++;
            const suggestions = matchProductsWithCaption(item.caption || meta.caption, produits);
            if (suggestions.length > 0 && suggestions[0].confidence_score >= 0.85) {
              await pool.query(
                `INSERT INTO social_post_produits (social_post_id, produit_id, confidence_score, valide_par_marchand)
                 VALUES ($1, $2, $3, TRUE)
                 ON CONFLICT (social_post_id, produit_id) DO NOTHING`,
                [insertRes.rows[0].id, suggestions[0].produit.id, suggestions[0].confidence_score]
              );
            }
          }
        } catch (postErr) {
          console.warn('[SYNC_POST_ITEM_WARN]', postErr.message);
        }
      }
    }

    // Mettre à jour derniere_sync_at
    await pool.query(
      `UPDATE social_accounts SET derniere_sync_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [account.id]
    );

    res.json({
      success: true,
      nom_compte: account.nom_compte,
      plateforme: account.plateforme,
      new_posts_imported: newlyImported,
      synced_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[SOCIAL_SYNC_ACCOUNT_ERR]', err);
    res.status(500).json({ error: 'Erreur synchronisation du compte : ' + err.message });
  }
});

/**
 * PATCH /api/boutiques/:id/social/admin/accounts/:accountId/toggle-sync
 * Active ou désactive l'Auto-Sync d'un compte
 */
router.patch(['/boutiques/:id/social/admin/accounts/:accountId/toggle-sync', '/:id/admin/accounts/:accountId/toggle-sync'], verifierToken, async (req, res) => {
  try {
    const boutique = await resolveBoutiqueId(req.params.id);
    if (!boutique) return res.status(404).json({ error: 'Boutique introuvable' });

    const hasAccess = await verifierAccesBoutique(boutique.id, req.user.userId);
    if (!hasAccess) return res.status(403).json({ error: 'Accès non autorisé' });

    const accRes = await pool.query(
      `UPDATE social_accounts
       SET auto_sync = NOT COALESCE(auto_sync, FALSE), updated_at = NOW()
       WHERE id = $1 AND boutique_id = $2
       RETURNING id, plateforme, nom_compte, auto_sync`,
      [req.params.accountId, boutique.id]
    );

    if (!accRes.rows[0]) return res.status(404).json({ error: 'Compte social introuvable' });

    res.json({ success: true, account: accRes.rows[0] });
  } catch (err) {
    console.error('[TOGGLE_AUTO_SYNC_ERR]', err);
    res.status(500).json({ error: 'Erreur modification Auto-Sync' });
  }
});

module.exports = router;
