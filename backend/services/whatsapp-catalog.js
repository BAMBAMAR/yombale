// backend/services/whatsapp-catalog.js — Sync vers Meta Commerce Catalog
const axios = require('axios');
const { pool } = require('../models/db');

const SITE = process.env.FRONTEND_URL || 'https://nopalou.com';

// Lus à l'appel (pas au chargement du module) pour rester réactifs si les
// variables d'environnement changent après le require (tests, reload à chaud).
function getToken() {
  // Token séparé requis : le catalog_management n'est pas couvert par le
  // token système whatsapp_business_messaging (WHATSAPP_API_TOKEN).
  return process.env.WHATSAPP_CATALOG_TOKEN || process.env.WHATSAPP_API_TOKEN;
}

function getCatalogIdGlobal() {
  return process.env.WHATSAPP_CATALOG_ID;
}

function resolveCatalog(produit) {
  // Priorité : catalog_id propre à la boutique, sinon catalog global Nopalou
  return produit.whatsapp_catalog_id || getCatalogIdGlobal();
}

function guard(catalogId) {
  if (!getToken() || !catalogId) {
    console.log('[CATALOG] Credentials manquants — sync ignorée');
    return false;
  }
  return true;
}

// Mappe la valeur "état" du formulaire Nopalou vers la valeur "condition" attendue par Meta.
// Valeurs Nopalou possibles (CaracteristiquesFields, BoutiqueClient.tsx) : Neuf / Bon état / Occasion / Pour pièces.
function mapEtatToCondition(etat) {
  if (etat === 'Neuf') return 'new';
  if (etat === 'Pour pièces') return 'refurbished';
  return 'used'; // "Bon état", "Occasion", ou valeur absente/inconnue
}

async function marquerStatutSync(produitId, statut, erreur = null) {
  try {
    await pool.query(
      'UPDATE boutique_produits SET whatsapp_sync_statut=$1, whatsapp_sync_erreur=$2 WHERE id=$3',
      [statut, erreur, produitId]
    );
  } catch (e) {
    console.error('[CATALOG] Impossible d’enregistrer le statut de sync:', e.message);
  }
}

// Crée ou met à jour un produit dans le catalogue Meta Commerce
async function syncProduit(produit) {
  const catalogId = resolveCatalog(produit);
  if (!guard(catalogId)) {
    // Sans ID de catalogue Meta explicite, les produits sont servis par le bot natif Nopalou via PostgreSQL.
    // Marquer comme 'synchronise' pour refléter que le produit est actif sur WhatsApp sans faux échec.
    await marquerStatutSync(produit.id, 'synchronise', null);
    return;
  }
  const retailerId = `nopalou-produit-${produit.id}`;
  const caracteristiques = produit.caracteristiques || {};
  const payload = {
    retailer_id:  retailerId,
    name:         produit.nom,
    description:  produit.description || produit.nom,
    price:        Math.round((produit.prix || 0) * 100), // en centimes
    currency:     'XOF',
    availability: produit.en_stock !== false ? 'in stock' : 'out of stock',
    url:          `${SITE}/boutiques/${produit.boutique_slug}/produits/${produit.id}`,
    image_url:    produit.images?.[0] || '',
    condition:    mapEtatToCondition(caracteristiques.etat),
  };
  if (caracteristiques.marque) payload.brand = caracteristiques.marque;
  if (produit.categorie) payload.category = produit.categorie;
  if (produit.prix_barre && produit.prix_barre > (produit.prix || 0)) {
    payload.sale_price = Math.round(produit.prix * 100);
    payload.sale_price_effective_date = `${new Date().toISOString().slice(0, 10)}/2099-12-31`;
    payload.price = Math.round(produit.prix_barre * 100); // prix "normal" affiché barré côté Meta
  }

  try {
    await axios.post(
      `https://graph.facebook.com/v18.0/${catalogId}/products`,
      payload,
      { headers: { Authorization: `Bearer ${getToken()}` } }
    );
    console.log(`[CATALOG] Sync produit ${retailerId} ✓`);
    await marquerStatutSync(produit.id, 'synchronise', null);
  } catch (err) {
    const message = err.response?.data?.error?.message || err.message;
    console.error('[CATALOG] Erreur sync:', message);
    await marquerStatutSync(produit.id, 'echec', message);
  }
}

// Retire un produit du catalogue Meta Commerce
async function deleteProduit(produitId, whatsappCatalogId = null) {
  const catalogId = whatsappCatalogId || getCatalogIdGlobal();
  if (!guard(catalogId)) return;
  const retailerId = `nopalou-produit-${produitId}`;
  try {
    await axios.delete(
      `https://graph.facebook.com/v18.0/${catalogId}/products`,
      {
        headers: { Authorization: `Bearer ${getToken()}` },
        data: { retailer_id: retailerId },
      }
    );
    console.log(`[CATALOG] Suppression ${retailerId} ✓`);
  } catch (err) {
    console.error('[CATALOG] Erreur suppression:', err.response?.data?.error?.message || err.message);
  }
}

module.exports = { syncProduit, deleteProduit, mapEtatToCondition };
