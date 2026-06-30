// backend/services/whatsapp-catalog.js — Sync vers Meta Commerce Catalog
const axios = require('axios');

const TOKEN            = process.env.WHATSAPP_API_TOKEN;
const CATALOG_ID_GLOBAL = process.env.WHATSAPP_CATALOG_ID;
const SITE             = process.env.FRONTEND_URL || 'https://nopalou.com';

function resolveCatalog(produit) {
  // Priorité : catalog_id propre à la boutique, sinon catalog global Nopalou
  return produit.whatsapp_catalog_id || CATALOG_ID_GLOBAL;
}

function guard(catalogId) {
  if (!TOKEN || !catalogId) {
    console.log('[CATALOG] Credentials manquants — sync ignorée');
    return false;
  }
  return true;
}

// Crée ou met à jour un produit dans le catalogue Meta Commerce
async function syncProduit(produit) {
  const catalogId = resolveCatalog(produit);
  if (!guard(catalogId)) return;
  const retailerId = `nopalou-produit-${produit.id}`;
  try {
    await axios.post(
      `https://graph.facebook.com/v18.0/${catalogId}/products`,
      {
        retailer_id:  retailerId,
        name:         produit.nom,
        description:  produit.description || produit.nom,
        price:        Math.round((produit.prix || 0) * 100), // en centimes
        currency:     'XOF',
        availability: produit.en_stock !== false ? 'in stock' : 'out of stock',
        url:          `${SITE}/boutiques/${produit.boutique_slug}/produits/${produit.id}`,
        image_url:    produit.images?.[0] || '',
      },
      { headers: { Authorization: `Bearer ${TOKEN}` } }
    );
    console.log(`[CATALOG] Sync produit ${retailerId} ✓`);
  } catch (err) {
    console.error('[CATALOG] Erreur sync:', err.response?.data?.error?.message || err.message);
  }
}

// Retire un produit du catalogue Meta Commerce
async function deleteProduit(produitId, whatsappCatalogId = null) {
  const catalogId = whatsappCatalogId || CATALOG_ID_GLOBAL;
  if (!guard(catalogId)) return;
  const retailerId = `nopalou-produit-${produitId}`;
  try {
    await axios.delete(
      `https://graph.facebook.com/v18.0/${catalogId}/products`,
      {
        headers: { Authorization: `Bearer ${TOKEN}` },
        data: { retailer_id: retailerId },
      }
    );
    console.log(`[CATALOG] Suppression ${retailerId} ✓`);
  } catch (err) {
    console.error('[CATALOG] Erreur suppression:', err.response?.data?.error?.message || err.message);
  }
}

module.exports = { syncProduit, deleteProduit };
