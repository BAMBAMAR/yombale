// backend/services/collecte/SourcesRegistry.js
// ══════════════════════════════════════════════════════════════════════════════
// ARCHITECTURE DE COLLECTE V2 — REGISTRE CENTRAL DES SOURCES
// Déclaration unifiée, typologie, cadence, adaptateur et paramètres d'accès
// ══════════════════════════════════════════════════════════════════════════════

const JsonStoreCollector = require('./JsonStoreCollector');
const DecathlonCollector = require('./DecathlonCollector');
const KeurImmoCollector = require('./KeurImmoCollector');

const REGISTRE_SOURCES = [
  // ── 1. É-COMMERCE & PGC : NIVEAU 1 (APIs STORE WC JSON) ──
  {
    id: 'soumari',
    nom: 'Soumari',
    domaine: 'soumari.com',
    baseUrl: 'https://soumari.com',
    systeme: 'produits',
    type_methode: 'store_api_json',
    categories: ['informatique', 'bureautique', 'electromenager'],
    cadence: '0 6,18 * * *', // 2x / jour
    actif: true,
    delaiMs: 1500,
    creerCollecteur: (opts = {}) => new JsonStoreCollector({
      sourceId: 'soumari',
      nom: 'Soumari',
      baseUrl: 'https://soumari.com',
      delaiMs: 1200,
      maxPagesMax: 100, // Permet de couvrir les 8 185 produits (82 pages de 100)
      ...opts,
    }),
  },
  {
    id: 'promosn',
    nom: 'Promo.sn',
    domaine: 'promo.sn',
    baseUrl: 'https://promo.sn',
    systeme: 'produits',
    type_methode: 'store_api_json',
    categories: ['electromenager', 'tv', 'cuisine', 'maison'],
    cadence: '0 6,18 * * *',
    actif: true,
    delaiMs: 1500,
    creerCollecteur: (opts = {}) => new JsonStoreCollector({
      sourceId: 'promosn',
      nom: 'Promo.sn',
      baseUrl: 'https://promo.sn',
      delaiMs: 1200,
      maxPagesMax: 60, // Permet de couvrir les 4 610 produits (47 pages)
      ...opts,
    }),
  },
  {
    id: 'universcosmetix',
    nom: 'Univers Cosmetix',
    domaine: 'universcosmetix.com',
    baseUrl: 'https://universcosmetix.com',
    systeme: 'produits',
    type_methode: 'store_api_json',
    categories: ['beaute', 'cosmetiques', 'parfumerie'],
    cadence: '0 8 * * *', // 1x / jour
    actif: true,
    delaiMs: 1500,
    creerCollecteur: (opts = {}) => new JsonStoreCollector({
      sourceId: 'universcosmetix',
      nom: 'Univers Cosmetix',
      baseUrl: 'https://universcosmetix.com',
      delaiMs: 1500,
      maxPagesMax: 50,
      ...opts,
    }),
  },
  {
    id: 'masterofficedeco',
    nom: 'Master Office Déco',
    domaine: 'masterofficedeco.sn',
    baseUrl: 'https://masterofficedeco.sn',
    systeme: 'produits',
    type_methode: 'store_api_json',
    categories: ['mobilier', 'bureau', 'decoration'],
    cadence: '0 10 * * *',
    actif: true,
    delaiMs: 1500,
    creerCollecteur: (opts = {}) => new JsonStoreCollector({
      sourceId: 'masterofficedeco',
      nom: 'Master Office Déco',
      baseUrl: 'https://masterofficedeco.sn',
      delaiMs: 1500,
      maxPagesMax: 40,
      ...opts,
    }),
  },
  {
    id: 'electroniccorp',
    nom: 'Electronic Corp SN',
    domaine: 'electroniccorp.sn',
    baseUrl: 'https://electroniccorp.sn',
    systeme: 'produits',
    type_methode: 'store_api_json',
    categories: ['tv', 'smartphones', 'climatisation'],
    cadence: '0 12 * * *',
    actif: true,
    delaiMs: 1500,
    creerCollecteur: (opts = {}) => new JsonStoreCollector({
      sourceId: 'electroniccorp',
      nom: 'Electronic Corp SN',
      baseUrl: 'https://electroniccorp.sn',
      delaiMs: 1500,
      maxPagesMax: 15,
      ...opts,
    }),
  },
  {
    id: 'electroluxdakar',
    nom: 'Electrolux Dakar',
    domaine: 'electroluxdakar.com',
    baseUrl: 'https://electroluxdakar.com',
    systeme: 'produits',
    type_methode: 'store_api_json',
    categories: ['gros electromenager', 'cuisine', 'lavage'],
    cadence: '0 14 * * *',
    actif: true,
    delaiMs: 1500,
    creerCollecteur: (opts = {}) => new JsonStoreCollector({
      sourceId: 'electroluxdakar',
      nom: 'Electrolux Dakar',
      baseUrl: 'https://electroluxdakar.com',
      delaiMs: 1500,
      maxPagesMax: 15,
      ...opts,
    }),
  },
  {
    id: 'dakarmondialtelephone',
    nom: 'Dakar Mondial Téléphone',
    domaine: 'dakarmondialtelephone.com',
    baseUrl: 'https://dakarmondialtelephone.com',
    systeme: 'produits',
    type_methode: 'store_api_json',
    categories: ['smartphones', 'accessoires'],
    cadence: '0 16 * * *',
    actif: true,
    delaiMs: 1500,
    creerCollecteur: (opts = {}) => new JsonStoreCollector({
      sourceId: 'dakarmondialtelephone',
      nom: 'Dakar Mondial Téléphone',
      baseUrl: 'https://dakarmondialtelephone.com',
      delaiMs: 1500,
      maxPagesMax: 10,
      ...opts,
    }),
  },
  {
    id: 'fabellashop',
    nom: 'Fabellashop',
    domaine: 'fabellashop.com',
    baseUrl: 'https://fabellashop.com',
    systeme: 'produits',
    type_methode: 'store_api_json',
    categories: ['beaute', 'soins', 'cheveux', 'maquillage'],
    cadence: '0 8 * * *',
    actif: true,
    delaiMs: 1500,
    creerCollecteur: (opts = {}) => new JsonStoreCollector({
      sourceId: 'fabellashop',
      nom: 'Fabellashop',
      baseUrl: 'https://fabellashop.com',
      delaiMs: 1200,
      maxPagesMax: 20, // 1 243 articles (13 pages de 100)
      ...opts,
    }),
  },
  {
    id: 'kabirex',
    nom: 'Kabirex',
    domaine: 'kabirex.com',
    baseUrl: 'https://kabirex.com',
    systeme: 'produits',
    type_methode: 'store_api_json',
    categories: ['gaming', 'informatique', 'electromenager'],
    cadence: '0 9 * * *',
    actif: true,
    delaiMs: 1500,
    creerCollecteur: (opts = {}) => new JsonStoreCollector({
      sourceId: 'kabirex',
      nom: 'Kabirex',
      baseUrl: 'https://kabirex.com',
      delaiMs: 1200,
      maxPagesMax: 25, // 1 656 articles (17 pages de 100)
      ...opts,
    }),
  },
  {
    id: 'digitalstores',
    nom: 'Digital Stores',
    domaine: 'digitalstores.sn',
    baseUrl: 'https://digitalstores.sn',
    systeme: 'produits',
    type_methode: 'store_api_json',
    categories: ['ordinateurs', 'smartphones', 'tablettes'],
    cadence: '0 11 * * *',
    actif: true,
    delaiMs: 1500,
    creerCollecteur: (opts = {}) => new JsonStoreCollector({
      sourceId: 'digitalstores',
      nom: 'Digital Stores',
      baseUrl: 'https://digitalstores.sn',
      delaiMs: 1200,
      maxPagesMax: 10, // 520 articles (6 pages de 100)
      ...opts,
    }),
  },
  {
    id: 'terangatechstore',
    nom: 'Teranga Tech Store',
    domaine: 'terangatechstore.com',
    baseUrl: 'https://terangatechstore.com',
    systeme: 'produits',
    type_methode: 'store_api_json',
    categories: ['electromenager', 'high-tech', 'smartphones'],
    cadence: '0 13 * * *',
    actif: true,
    delaiMs: 1500,
    creerCollecteur: (opts = {}) => new JsonStoreCollector({
      sourceId: 'terangatechstore',
      nom: 'Teranga Tech Store',
      baseUrl: 'https://terangatechstore.com',
      delaiMs: 1200,
      maxPagesMax: 10, // 345 articles (4 pages de 100)
      ...opts,
    }),
  },
  {
    id: 'etounature',
    nom: 'Etounature',
    domaine: 'etounature.com',
    baseUrl: 'https://etounature.com',
    systeme: 'produits',
    type_methode: 'store_api_json',
    categories: ['bio', 'naturel', 'bien-etre', 'alimentation'],
    cadence: '0 15 * * *',
    actif: true,
    delaiMs: 1500,
    creerCollecteur: (opts = {}) => new JsonStoreCollector({
      sourceId: 'etounature',
      nom: 'Etounature',
      baseUrl: 'https://etounature.com',
      delaiMs: 1200,
      maxPagesMax: 5, // 191 articles (2 pages de 100)
      ...opts,
    }),
  },
  {
    id: 'passcourses',
    nom: 'Passcourses',
    domaine: 'passcourses.com',
    baseUrl: 'https://passcourses.com',
    systeme: 'produits',
    type_methode: 'store_api_json',
    categories: ['marche', 'epicerie', 'frais'],
    cadence: '0 7 * * *',
    actif: false, // Domaine actuellement redirigé / inactif
    delaiMs: 1500,
    creerCollecteur: (opts = {}) => new JsonStoreCollector({
      sourceId: 'passcourses',
      nom: 'Passcourses',
      baseUrl: 'https://passcourses.com',
      delaiMs: 1200,
      maxPagesMax: 10,
      ...opts,
    }),
  },

  // ── 2. SPORT & SPÉCIALISTES : NIVEAU 3 (HTML ADAPTATIF RÉEL) ──
  {
    id: 'decathlon',
    nom: 'Decathlon',
    domaine: 'decathlon.sn',
    baseUrl: 'https://www.decathlon.sn',
    systeme: 'produits',
    type_methode: 'html_adaptatif_bem',
    categories: ['fitness', 'running', 'football', 'natation', 'randonnee', 'sports collectifs'],
    cadence: '0 4 * * *', // 1x / jour
    actif: true,
    delaiMs: 2500,
    creerCollecteur: (opts = {}) => new DecathlonCollector({
      delaiMs: 2000,
      maxPagesParCategorie: 8,
      ...opts,
    }),
  },

  // ── 3. IMMOBILIER PROFESSIONNEL : NIVEAU 3 (PORTAIL CERTIFIÉ) ──
  {
    id: 'keur_immo',
    nom: 'Keur-Immo',
    domaine: 'keur-immo.com',
    baseUrl: 'https://keur-immo.com',
    systeme: 'immo',
    type_methode: 'portail_immo_pro',
    categories: ['ventes', 'locations', 'neuf'],
    cadence: '0 2 */2 * *', // Tous les 2 jours
    actif: true,
    delaiMs: 2000,
    creerCollecteur: (opts = {}) => new KeurImmoCollector({
      delaiMs: 1500,
      maxPagesParSection: 6,
      enrichirDetails: true,
      ...opts,
    }),
  },
];

function obtenirSource(id) {
  return REGISTRE_SOURCES.find(s => s.id === id) || null;
}

function listerSourcesActives(systeme = null) {
  return REGISTRE_SOURCES.filter(s => s.actif && (!systeme || s.systeme === systeme));
}

module.exports = {
  REGISTRE_SOURCES,
  obtenirSource,
  listerSourcesActives,
};
