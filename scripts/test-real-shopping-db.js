require('dotenv').config();
const { pool } = require('../backend/models/db');

async function test() {
  const sqlBoutiques = `
    SELECT b.id, b.nom, b.slug, b.description, b.categorie,
           b.logo_url as logo, b.cover_url as couverture, b.ville,
           COALESCE(NULLIF(TRIM(b.whatsapp), ''), b.telephone) as telephone,
           COALESCE((SELECT COUNT(*) FROM boutique_produits bp WHERE bp.boutique_id = b.id AND bp.en_stock = true), 0) as total_produits,
           (b.statut_verification = 'verifie' OR b.verifie_le IS NOT NULL OR b.plan_actif IN ('pro', 'business') OR b.actif = true) as certifie
    FROM boutiques b
    WHERE b.actif = true
    ORDER BY total_produits DESC, b.created_at DESC
    LIMIT 200
  `;
  const resB = await pool.query(sqlBoutiques);
  console.log('✅ Boutiques réelles récupérées :', resB.rows.length);
  console.log('Top 5 boutiques :', resB.rows.slice(0, 5).map(b => ({
    nom: b.nom,
    slug: b.slug,
    total_produits: b.total_produits,
    ville: b.ville,
    telephone: b.telephone
  })));

  const sqlProduits = `
    SELECT bp.id, bp.nom, bp.prix::numeric, bp.images, bp.description, bp.categorie,
           bp.boutique_id, b.nom as boutique_nom, b.slug as boutique_slug,
           COALESCE(NULLIF(TRIM(b.whatsapp), ''), b.telephone) as boutique_tel
    FROM boutique_produits bp
    JOIN boutiques b ON b.id = bp.boutique_id
    WHERE b.actif = true AND bp.en_stock = true
      AND (bp.statut_moderation IS NULL OR bp.statut_moderation = 'actif')
    ORDER BY bp.created_at DESC
    LIMIT 200
  `;
  const resP = await pool.query(sqlProduits);
  console.log('✅ Produits réels récupérés :', resP.rows.length);
  console.log('Top 5 produits :', resP.rows.slice(0, 5).map(p => ({
    nom: p.nom,
    prix: p.prix,
    boutique: p.boutique_nom,
    slug: p.boutique_slug
  })));

  await pool.end();
}

test().catch(err => {
  console.error('Erreur :', err);
  process.exit(1);
});
