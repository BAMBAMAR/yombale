// backend/services/social-extractor.js — Service Métier Social Commerce & Extraction Posts
const { pool } = require('../models/db');

/**
 * Résolution robuste d'une boutique par UUID ou par Slug
 */
async function resolveBoutiqueId(idOrSlug) {
  if (!idOrSlug) return null;
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
  if (isUUID) {
    const r = await pool.query(
      'SELECT id, nom, slug, whatsapp, telephone, actif FROM boutiques WHERE id = $1',
      [idOrSlug]
    );
    return r.rows[0] || null;
  }
  const r = await pool.query(
    'SELECT id, nom, slug, whatsapp, telephone, actif FROM boutiques WHERE slug = $1',
    [idOrSlug]
  );
  return r.rows[0] || null;
}

/**
 * Vérifie les droits d'accès et d'administration d'un marchand sur une boutique
 */
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

/**
 * Charge les publications du Social Shop avec leurs produits rattachés
 */
async function getSocialPostsForBoutique(boutiqueId, { platform, featured, sort, limit = 40 } = {}) {
  let whereClause = `sp.boutique_id = $1 AND sp.actif = TRUE`;
  const params = [boutiqueId];

  if (platform && platform !== 'all') {
    params.push(platform.toLowerCase());
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
      sp.ocr_text,
      COALESCE(sp.engagement_score, 0) AS engagement_score,
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
    ORDER BY ${
      sort === 'popular' || sort === 'engagement'
        ? 'sp.is_featured DESC, COALESCE(sp.engagement_score, 0) DESC, sp.ordre ASC, sp.created_at DESC'
        : 'sp.is_featured DESC, sp.ordre ASC, sp.published_at DESC, sp.created_at DESC'
    }
    LIMIT $${params.length}
  `;

  const { rows } = await pool.query(sql, params);
  return rows;
}

module.exports = {
  resolveBoutiqueId,
  verifierAccesBoutique,
  getSocialPostsForBoutique,
};
