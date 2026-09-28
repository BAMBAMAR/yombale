const path = require('path');
const fs = require('fs');
const { pool } = require('../models/db');

function slugify(text) {
  if (!text) return 'article';
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

let starterCatalogues = null;
try {
  const filePath = path.join(__dirname, '../data/starter-catalogues.json');
  starterCatalogues = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
} catch (e) {
  console.warn('[STARTER CATALOGUES] Impossible de charger starter-catalogues.json:', e.message);
  starterCatalogues = {};
}

/**
 * Normalise la catégorie pour faire correspondre aux clés du JSON
 */
function normaliserCleCategorie(cat) {
  if (!cat) return 'divers';
  const c = String(cat).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (c.includes('aliment') || c.includes('epic') || c.includes('superm') || c.includes('resto') || c.includes('fast')) {
    return 'alimentation';
  }
  if (c.includes('mod') || c.includes('vetem') || c.includes('habit') || c.includes('chauss')) {
    return 'mode';
  }
  if (c.includes('cosmet') || c.includes('beaut') || c.includes('parfum') || c.includes('soin')) {
    return 'cosmetique';
  }
  if (c.includes('electr') || c.includes('teleph') || c.includes('inform') || c.includes('high')) {
    return 'electronique';
  }
  return 'divers';
}

/**
 * Injecte un jeu d'articles de démarrage pour une boutique si elle n'a aucun produit.
 * @param {string} boutiqueId 
 * @param {string} categorie 
 * @param {boolean} forcer - Si true, injecte même s'il y a déjà des articles
 * @returns {Promise<{ succes: boolean, nbAjoutes: number, message: string }>}
 */
async function injecterStarterPack(boutiqueId, categorie, forcer = false) {
  if (!boutiqueId) {
    return { succes: false, nbAjoutes: 0, message: 'Boutique ID requis' };
  }

  try {
    if (!forcer) {
      const checkExist = await pool.query(
        'SELECT COUNT(*) FROM boutique_produits WHERE boutique_id = $1',
        [boutiqueId]
      );
      if (parseInt(checkExist.rows[0].count, 10) > 0) {
        return { succes: true, nbAjoutes: 0, message: 'La boutique contient déjà des produits' };
      }
    }

    const cle = normaliserCleCategorie(categorie);
    const items = starterCatalogues[cle] || starterCatalogues['divers'] || [];

    if (!items || items.length === 0) {
      return { succes: true, nbAjoutes: 0, message: 'Aucun pack disponible pour cette catégorie' };
    }

    let nbAjoutes = 0;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const prodSlug = `${slugify(it.nom)}-${Date.now().toString(36)}-${i}`;

      await pool.query(
        `INSERT INTO boutique_produits (
          boutique_id, nom, description, prix, en_stock, stock_quantite, unite_vente, categorie, slug, ordre
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          boutiqueId,
          it.nom,
          it.description || null,
          it.prix,
          it.en_stock !== false,
          it.stock_quantite || 10,
          it.unite_vente || 'pièce',
          it.categorie || 'Divers',
          prodSlug,
          i + 1
        ]
      );
      nbAjoutes++;
    }

    console.log(`[STARTER PACK] ✅ ${nbAjoutes} articles de démarrage injectés pour la boutique ${boutiqueId} (catégorie: ${cle}).`);
    return { succes: true, nbAjoutes, message: `${nbAjoutes} articles prêts à l'emploi ont été configurés.` };
  } catch (err) {
    console.error('[STARTER PACK ERR]:', err.message);
    return { succes: false, nbAjoutes: 0, message: err.message };
  }
}

module.exports = {
  injecterStarterPack,
  normaliserCleCategorie
};
