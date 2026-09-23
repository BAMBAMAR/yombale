// backend/routes/flux-catalogue-meta.js
// Flux Catalogue Produit Meta Commerce Manager (Facebook / Instagram Shopping) & Google Merchant (Audit 94+/100)

const express = require('express');
const router = express.Router();
const { pool } = require('../models/db');

const SITE = process.env.FRONTEND_URL || 'https://nopalou.com';

function echapperXML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ── GET /api/flux-catalogue/:slug/meta.xml — Flux XML RSS 2.0 Google / Meta
router.get(['/:slug/meta.xml', '/:slug/catalog.xml', '/:slug/google.xml'], async (req, res) => {
  try {
    const { slug } = req.params;
    let bq = { id: 'global', nom: 'Nopalou Sénégal', slug: 'global', description: 'Catalogue général Nopalou' };
    let produits = [];

    if (slug === 'global') {
      const prodRes = await pool.query(
        `SELECT bp.id, bp.nom, bp.description, bp.prix, bp.prix_barre, bp.images, bp.en_stock, bp.stock_quantite, bp.categorie, bp.created_at,
                b.nom AS boutique_nom, b.slug AS boutique_slug, b.id AS boutique_id
         FROM boutique_produits bp
         JOIN boutiques b ON b.id = bp.boutique_id
         WHERE b.actif = TRUE AND bp.en_stock IS NOT FALSE
         ORDER BY bp.created_at DESC LIMIT 5000`
      );
      produits = prodRes.rows;
    } else {
      const isUUID = /^[0-9a-f-]{36}$/i.test(slug);
      const bqRes = await pool.query(
        `SELECT id, nom, slug, description FROM boutiques WHERE ${isUUID ? 'id=$1' : 'slug=$1'}`,
        [slug]
      );

      if (!bqRes.rows.length) {
        return res.status(404).send('Boutique introuvable');
      }

      bq = bqRes.rows[0];

      const prodRes = await pool.query(
        `SELECT bp.id, bp.nom, bp.description, bp.prix, bp.prix_barre, bp.images, bp.en_stock, bp.stock_quantite, bp.categorie, bp.created_at,
                $1 AS boutique_nom, $2 AS boutique_slug, $3 AS boutique_id
         FROM boutique_produits bp
         WHERE bp.boutique_id = $3
         ORDER BY bp.created_at DESC`,
        [bq.nom, bq.slug, bq.id]
      );

      produits = prodRes.rows;
    }

    let itemsXML = '';
    for (const p of produits) {
      const imagesArr = Array.isArray(p.images) ? p.images : [];
      const mainImage = imagesArr[0] || `${SITE}/logo-placeholder.png`;
      const additionalImages = imagesArr.slice(1, 6);
      const enStock = p.en_stock !== false && (p.stock_quantite === null || Number(p.stock_quantite) > 0);
      const dispo = enStock ? 'in stock' : 'out of stock';
      const prixXOF = `${Math.round(Number(p.prix || 0))} XOF`;
      const boutiquePath = p.boutique_slug || p.boutique_id || bq.slug || bq.id;
      const lienProduit = `${SITE}/boutiques/${boutiquePath}/produits/${p.id}`;
      const brandNom = p.boutique_nom || bq.nom;

      let addImgsTag = '';
      for (const img of additionalImages) {
        if (img) addImgsTag += `\n        <g:additional_image_link>${echapperXML(img)}</g:additional_image_link>`;
      }

      itemsXML += `
    <item>
      <g:id>${echapperXML(p.id)}</g:id>
      <g:title>${echapperXML(p.nom)}</g:title>
      <g:description>${echapperXML(p.description || p.nom)}</g:description>
      <g:link>${echapperXML(lienProduit)}</g:link>
      <g:image_link>${echapperXML(mainImage)}</g:image_link>${addImgsTag}
      <g:brand>${echapperXML(brandNom)}</g:brand>
      <g:condition>new</g:condition>
      <g:availability>${dispo}</g:availability>
      <g:price>${prixXOF}</g:price>
      <g:product_type>${echapperXML(p.categorie || 'Divers')}</g:product_type>
    </item>`;
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${echapperXML(bq.nom)} — Catalogue Nopalou</title>
    <link>${SITE}/boutiques/${echapperXML(bq.slug || bq.id)}</link>
    <description>Catalogue officiel de produits en vente chez ${echapperXML(bq.nom)}</description>
${itemsXML}
  </channel>
</rss>`;

    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.send(xml);

  } catch (err) {
    console.error('[FLUX CATALOGUE META ERR]:', err);
    res.status(500).send('Erreur génération flux XML');
  }
});

// ── GET /api/flux-catalogue/:slug/catalogue.csv — Format CSV Meta Commerce Manager
router.get('/:slug/catalogue.csv', async (req, res) => {
  try {
    const { slug } = req.params;
    const isUUID = /^[0-9a-f-]{36}$/i.test(slug);

    const bqRes = await pool.query(
      `SELECT id, nom, slug FROM boutiques WHERE ${isUUID ? 'id=$1' : 'slug=$1'}`,
      [slug]
    );

    if (!bqRes.rows.length) {
      return res.status(404).send('Boutique introuvable');
    }

    const bq = bqRes.rows[0];

    const prodRes = await pool.query(
      `SELECT id, nom, description, prix, images, en_stock, stock_quantite, categorie
       FROM boutique_produits
       WHERE boutique_id = $1
       ORDER BY created_at DESC`,
      [bq.id]
    );

    const escapeCsv = (val) => `"${String(val || '').replace(/"/g, '""')}"`;

    let csv = 'id,title,description,availability,condition,price,link,image_link,brand\n';

    for (const p of prodRes.rows) {
      const imagesArr = Array.isArray(p.images) ? p.images : [];
      const mainImage = imagesArr[0] || `${SITE}/logo-placeholder.png`;
      const enStock = p.en_stock !== false && (p.stock_quantite === null || Number(p.stock_quantite) > 0);
      const dispo = enStock ? 'in stock' : 'out of stock';
      const prix = `${Math.round(Number(p.prix || 0))} XOF`;
      const lien = `${SITE}/boutiques/${bq.slug || bq.id}/produits/${p.id}`;

      csv += [
        escapeCsv(p.id),
        escapeCsv(p.nom),
        escapeCsv(p.description || p.nom),
        escapeCsv(dispo),
        escapeCsv('new'),
        escapeCsv(prix),
        escapeCsv(lien),
        escapeCsv(mainImage),
        escapeCsv(bq.nom)
      ].join(',') + '\n';
    }

    res.set('Content-Type', 'text/csv; charset=utf-8');
    res.set('Content-Disposition', `attachment; filename="catalogue-${bq.slug || bq.id}.csv"`);
    res.send(csv);

  } catch (err) {
    console.error('[FLUX CATALOGUE CSV ERR]:', err);
    res.status(500).send('Erreur génération flux CSV');
  }
});

module.exports = router;
