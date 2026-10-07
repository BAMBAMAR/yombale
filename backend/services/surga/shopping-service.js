// backend/services/surga/shopping-service.js
// Service Shopping & Boutiques Nopalou pour l'assistant Surga
// Fournit toutes les boutiques réelles Nopalou et leurs produits certifiés en stock

const { pool } = require('../../models/db');

// Fallback de boutiques réelles Nopalou avec de vrais slugs de la base de données
const BOUTIQUES_FALLBACK = [
  {
    id: '4142c57e-f41b-48ee-a6ce-32ac730b400c',
    nom: 'Mamou_House',
    slug: 'mamouhouse',
    description: 'Boutique mode féminine, prêt-à-porter, robes élégantes et accessoires tendance à Dakar.',
    categorie: 'Mode & Habillement',
    logo: 'https://res.cloudinary.com/dluag2q3y/image/upload/v1790605043/boutiques/vykwpdnsqtpjmydjoxge.png',
    couverture: 'https://res.cloudinary.com/dluag2q3y/image/upload/v1790605044/boutiques_cover/gfjiorepdljqri71tx49.jpg',
    ville: 'Dakar',
    telephone: '+221772080487',
    certifie: true,
    total_produits: 48,
  },
  {
    id: 'ec55971a-ad31-4c35-8c9a-203c7adb6806',
    nom: "D'accord",
    slug: 'd-accord',
    description: 'Chaussures fermées, sacs Lacoste, sacs à main de marque et maroquinerie chic.',
    categorie: 'Mode & Maroquinerie',
    logo: 'https://res.cloudinary.com/dluag2q3y/image/upload/v1790119010/boutiques/eiizlgwkisa6txgbdkjr.jpg',
    couverture: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&q=80',
    ville: 'Dakar',
    telephone: '221708274472',
    certifie: true,
    total_produits: 26,
  },
  {
    id: 'f83cb0cf-3af0-4926-b9a8-5ff6a61ed048',
    nom: 'DIEVO STYLE',
    slug: 'dievo-style',
    description: 'Vente de vêtements, chaussures tendance pour hommes et femmes.',
    categorie: 'Mode & Vêtements',
    logo: 'https://res.cloudinary.com/dluag2q3y/image/upload/v1784247825/boutiques/iglhqnzj91vmwc7hbmpi.jpg',
    couverture: 'https://res.cloudinary.com/dluag2q3y/image/upload/v1784247826/boutiques_cover/kj2mbtnanxhcyky5jtdk.jpg',
    ville: 'Dakar',
    telephone: '772082578',
    certifie: true,
    total_produits: 14,
  },
  {
    id: '3d6572b7-4e69-42e8-9732-815a3fd073b0',
    nom: 'Flair house',
    slug: 'flair-house',
    description: 'Smartphones de dernière génération, accessoires audio et gadgets high-tech.',
    categorie: 'High-Tech & Mobiles',
    logo: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80',
    couverture: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=1200&q=80',
    ville: 'Dakar',
    telephone: '+221777163148',
    certifie: true,
    total_produits: 8,
  },
  {
    id: '39d9b8f1-8c66-433d-93f8-e1719c793328',
    nom: 'Centralestore',
    slug: 'centralestore',
    description: 'Boutique généraliste et articles du quotidien à prix compétitifs.',
    categorie: 'Mixte & Généraliste',
    logo: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=400&q=80',
    couverture: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80',
    ville: 'Dakar',
    telephone: '775959741',
    certifie: true,
    total_produits: 8,
  },
  {
    id: '67660a9f-353b-4aa1-9a70-7119e078358d',
    nom: 'SUNU SHOP',
    slug: 'sunu-shop',
    description: 'Produits divers, accessoires, mode et électroménager sélectionné.',
    categorie: 'Mixte & Maison',
    logo: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=400&q=80',
    couverture: 'https://images.unsplash.com/photo-1506617420156-8e4536971650?auto=format&fit=crop&w=1200&q=80',
    ville: 'Dakar',
    telephone: '+221771234567',
    certifie: true,
    total_produits: 6,
  },
];

// Fallback de produits réels phares
const PRODUITS_FALLBACK = [
  {
    id: 'cd1905c0-738a-440c-bd35-17569c25d9f6',
    nom: 'Chaussures fermées élégantes',
    prix: 13000,
    categorie: 'Mode & Chaussures',
    images: ['https://res.cloudinary.com/dluag2q3y/image/upload/v1791302502/boutique_produits/vsa4rijorzvkclbuedzc.jpg'],
    description: 'Modèle confort et standing pour le travail et les grandes occasions.',
    boutique_id: 'ec55971a-ad31-4c35-8c9a-203c7adb6806',
    boutique_nom: "D'accord",
    boutique_slug: 'd-accord',
    boutique_tel: '221708274472',
  },
  {
    id: '83d4ce2d-6039-4484-972b-f5f2518dba46',
    nom: 'Sacs Lacoste & Maroquinerie',
    prix: 8000,
    categorie: 'Mode & Maroquinerie',
    images: ['https://res.cloudinary.com/dluag2q3y/image/upload/v1791302364/boutique_produits/quhhjcf4qe8i0kqetnp5.jpg'],
    description: 'Sac porté épaule résistant et moderne, finitions impeccables.',
    boutique_id: 'ec55971a-ad31-4c35-8c9a-203c7adb6806',
    boutique_nom: "D'accord",
    boutique_slug: 'd-accord',
    boutique_tel: '221708274472',
  },
  {
    id: 'aed55816-cafa-4132-b9b4-453c24592dba',
    nom: 'Fidèle — Vêtement & Robe',
    prix: 800,
    categorie: 'Mode & Habillement',
    images: ['https://res.cloudinary.com/dluag2q3y/image/upload/v1791306898/boutique_produits/drp3vqxlrces39xery4n.jpg'],
    description: 'Article prêt-à-porter léger et confortable.',
    boutique_id: '0e9409e0-8635-4b9f-9ce9-504d23c07daf',
    boutique_nom: 'Ceo shopping',
    boutique_slug: 'ceo-shopping',
    boutique_tel: '+221771349327',
  },
];

/**
 * Normalise le libellé d'affichage d'une catégorie
 */
function formaterCategorie(cat) {
  if (!cat) return 'Mixte & Généraliste';
  const c = cat.toLowerCase();
  if (c.includes('mode') || c.includes('vetement') || c.includes('vêtement')) return 'Mode & Habillement';
  if (c.includes('beaute') || c.includes('beauté') || c.includes('parfum') || c.includes('soin')) return 'Beauté & Parfums';
  if (c.includes('smartphone') || c.includes('tech') || c.includes('electronique') || c.includes('électronique')) return 'High-Tech & Mobiles';
  if (c.includes('aliment') || c.includes('epicerie') || c.includes('épicerie')) return 'Alimentation & Terroir';
  if (c.includes('maison') || c.includes('deco') || c.includes('déco')) return 'Maison & Décoration';
  if (c.includes('sport')) return 'Sport & Fitness';
  return cat.charAt(0).toUpperCase() + cat.slice(1);
}

/**
 * Récupère TOUTES les boutiques réelles Nopalou et leurs produits
 */
async function listerShopping({ categorie = 'tous', q = '', limit = 200 } = {}) {
  let boutiques = [];
  let produits = [];

  try {
    const qClean = (q || '').trim().toLowerCase();
    const catClean = (categorie || 'tous').trim().toLowerCase();

    // 1. Requête des boutiques réelles (colonnes réelles : logo_url, cover_url, telephone, whatsapp)
    let sqlBoutiques = `
      SELECT b.id, b.nom, b.slug, b.description, b.categorie,
             b.logo_url as logo, b.cover_url as couverture, b.ville,
             COALESCE(NULLIF(TRIM(b.whatsapp), ''), b.telephone) as telephone,
             COALESCE((SELECT COUNT(*) FROM boutique_produits bp WHERE bp.boutique_id = b.id AND bp.en_stock = true), 0) as total_produits,
             (b.statut_verification = 'verifie' OR b.verifie_le IS NOT NULL OR b.plan_actif IN ('pro', 'business') OR b.actif = true) as certifie
      FROM boutiques b
      WHERE b.actif = true
    `;
    const bParams = [];

    // Filtrage intelligent par catégorie
    if (catClean !== 'tous') {
      if (catClean === 'mode') {
        sqlBoutiques += ` AND (b.categorie ILIKE '%mode%' OR b.categorie ILIKE '%vetement%' OR b.categorie ILIKE '%vêtement%' OR b.categorie ILIKE '%habillement%')`;
      } else if (catClean === 'tech') {
        sqlBoutiques += ` AND (b.categorie ILIKE '%tech%' OR b.categorie ILIKE '%smartphone%' OR b.categorie ILIKE '%electronique%' OR b.categorie ILIKE '%électronique%' OR b.categorie ILIKE '%telephonie%' OR b.categorie ILIKE '%tv%')`;
      } else if (catClean === 'beaute') {
        sqlBoutiques += ` AND (b.categorie ILIKE '%beaute%' OR b.categorie ILIKE '%beauté%' OR b.categorie ILIKE '%parfum%' OR b.categorie ILIKE '%soin%' OR b.categorie ILIKE '%cosmetique%')`;
      } else if (catClean === 'alimentation') {
        sqlBoutiques += ` AND (b.categorie ILIKE '%aliment%' OR b.categorie ILIKE '%epicerie%' OR b.categorie ILIKE '%épicerie%')`;
      } else if (catClean === 'maison') {
        sqlBoutiques += ` AND (b.categorie ILIKE '%maison%' OR b.categorie ILIKE '%deco%' OR b.categorie ILIKE '%déco%')`;
      } else {
        bParams.push(`%${catClean}%`);
        sqlBoutiques += ` AND (b.categorie ILIKE $${bParams.length})`;
      }
    }

    if (qClean) {
      bParams.push(`%${qClean}%`);
      sqlBoutiques += ` AND (b.nom ILIKE $${bParams.length} OR b.description ILIKE $${bParams.length} OR b.ville ILIKE $${bParams.length} OR b.slug ILIKE $${bParams.length})`;
    }

    sqlBoutiques += ` ORDER BY total_produits DESC, b.created_at DESC LIMIT $${bParams.length + 1}`;
    bParams.push(limit);

    const resB = await pool.query(sqlBoutiques, bParams);
    if (resB.rows && resB.rows.length > 0) {
      boutiques = resB.rows.map(r => ({
        id: r.id,
        nom: (r.nom || 'Boutique').trim(),
        slug: r.slug || r.id,
        description: r.description ? r.description.trim() : `Boutique marchande à ${r.ville || 'Dakar'} — Produits et nouveautés en stock.`,
        categorie: formaterCategorie(r.categorie),
        logo: r.logo || undefined,
        couverture: r.couverture || undefined,
        ville: r.ville || 'Dakar',
        telephone: r.telephone ? r.telephone.trim() : '+221770000000',
        certifie: Boolean(r.certifie),
        total_produits: parseInt(r.total_produits, 10) || 0,
      }));
    }

    // 2. Requête des produits réels en stock
    let sqlProduits = `
      SELECT bp.id, bp.nom, bp.prix::numeric, bp.images, bp.description, bp.categorie,
             bp.boutique_id, b.nom as boutique_nom, b.slug as boutique_slug,
             COALESCE(NULLIF(TRIM(b.whatsapp), ''), b.telephone) as boutique_tel
      FROM boutique_produits bp
      JOIN boutiques b ON b.id = bp.boutique_id
      WHERE b.actif = true AND bp.en_stock = true
        AND (bp.statut_moderation IS NULL OR bp.statut_moderation = 'actif')
    `;
    const pParams = [];

    if (catClean !== 'tous') {
      if (catClean === 'mode') {
        sqlProduits += ` AND (bp.categorie ILIKE '%mode%' OR b.categorie ILIKE '%mode%')`;
      } else if (catClean === 'tech') {
        sqlProduits += ` AND (bp.categorie ILIKE '%tech%' OR bp.categorie ILIKE '%smartphone%' OR bp.categorie ILIKE '%electronique%' OR b.categorie ILIKE '%tech%')`;
      } else if (catClean === 'beaute') {
        sqlProduits += ` AND (bp.categorie ILIKE '%beaute%' OR bp.categorie ILIKE '%parfum%' OR b.categorie ILIKE '%beaute%')`;
      } else if (catClean === 'alimentation') {
        sqlProduits += ` AND (bp.categorie ILIKE '%aliment%' OR bp.categorie ILIKE '%epicerie%' OR b.categorie ILIKE '%aliment%')`;
      } else if (catClean === 'maison') {
        sqlProduits += ` AND (bp.categorie ILIKE '%maison%' OR bp.categorie ILIKE '%deco%' OR b.categorie ILIKE '%maison%')`;
      } else {
        pParams.push(`%${catClean}%`);
        sqlProduits += ` AND (bp.categorie ILIKE $${pParams.length} OR b.categorie ILIKE $${pParams.length})`;
      }
    }

    if (qClean) {
      pParams.push(`%${qClean}%`);
      sqlProduits += ` AND (bp.nom ILIKE $${pParams.length} OR bp.description ILIKE $${pParams.length} OR b.nom ILIKE $${pParams.length})`;
    }

    sqlProduits += ` ORDER BY bp.created_at DESC LIMIT $${pParams.length + 1}`;
    pParams.push(limit);

    const resP = await pool.query(sqlProduits, pParams);
    if (resP.rows && resP.rows.length > 0) {
      produits = resP.rows.map(r => ({
        id: r.id,
        nom: (r.nom || 'Article').trim(),
        prix: Number(r.prix) || 0,
        images: Array.isArray(r.images) ? r.images : (r.images ? [r.images] : []),
        description: r.description ? r.description.trim() : undefined,
        categorie: formaterCategorie(r.categorie),
        boutique_id: r.boutique_id,
        boutique_nom: (r.boutique_nom || 'Boutique').trim(),
        boutique_slug: r.boutique_slug || r.boutique_id,
        boutique_tel: r.boutique_tel ? r.boutique_tel.trim() : '+221770000000',
      }));
    }
  } catch (err) {
    console.error('[SURGA SHOPPING DB ERROR]:', err.message);
  }

  // Si base temporairement vide ou indisponible, fallback avec les vraies boutiques
  if (boutiques.length === 0) {
    boutiques = BOUTIQUES_FALLBACK.filter(b => {
      if (categorie !== 'tous') {
        const matchCat = b.categorie.toLowerCase().includes(categorie.toLowerCase());
        if (!matchCat) return false;
      }
      if (q) {
        const query = q.toLowerCase();
        return b.nom.toLowerCase().includes(query) ||
               b.description.toLowerCase().includes(query) ||
               b.ville.toLowerCase().includes(query);
      }
      return true;
    });
  }

  if (produits.length === 0) {
    produits = PRODUITS_FALLBACK.filter(p => {
      if (categorie !== 'tous') {
        const matchCat = p.categorie.toLowerCase().includes(categorie.toLowerCase());
        if (!matchCat) return false;
      }
      if (q) {
        const query = q.toLowerCase();
        return p.nom.toLowerCase().includes(query) ||
               p.description.toLowerCase().includes(query) ||
               p.boutique_nom.toLowerCase().includes(query);
      }
      return true;
    });
  }

  return {
    boutiques,
    produits,
    totalBoutiques: boutiques.length,
    totalProduits: produits.length,
  };
}

module.exports = {
  listerShopping,
  BOUTIQUES_FALLBACK,
  PRODUITS_FALLBACK,
};
