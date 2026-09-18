export interface DureeOption {
  mois: number
  label: string
  sousTitre: string
  remise: number
  badge: string | null
}

export const DUREES_INITIALES: DureeOption[] = [
  { mois: 1, label: '1 mois', sousTitre: 'Tarif mensuel', remise: 0, badge: null },
  { mois: 3, label: '3 mois', sousTitre: 'Trimestriel', remise: 0.10, badge: '-10%' },
  { mois: 6, label: '6 mois', sousTitre: 'Semestriel', remise: 0.15, badge: '-15%' },
  { mois: 12, label: '12 mois (1 an)', sousTitre: 'Annuel', remise: 0.25, badge: '-25% (3 mois offerts)' },
]

export interface PlanConfig {
  id: string
  nom: string
  tag: string
  badgeSection?: string
  badgeCouleur?: string
  description: string
  prixMensuelBase: number
  populaire?: boolean
  recommande?: boolean
  features: string[]
  ctaText: string
  ctaHref: string
}

export const PLANS_BOUTIQUES_CONFIG: PlanConfig[] = [
  {
    id: 'taf_taf',
    nom: 'Boutique Taf Taf',
    tag: 'Formule Populaire',
    description: 'Idéal pour débuter son commerce, gérer ses ventes sur WhatsApp et tenir son carnet de dettes.',
    prixMensuelBase: 2500,
    populaire: true,
    features: [
      'Vitrine e-commerce personnalisée + Catalogue produits illimités',
      'Panier web & Commandes directes sur WhatsApp',
      'Carnet de dettes client ("Bor") & historique des paiements',
      'Import Intelligent Multi-Plateformes (Shopify, WooCommerce, Excel, AliExpress, SHEIN)',
      'Assistant Marchand WhatsApp & Alertes de stock',
      'Lien court dédié & QR Code boutique pour flyers et réseaux',
      'Encaissement direct Wave & Orange Money (0% commission)',
      '1er mois 100% OFFERT',
    ],
    ctaText: 'Choisir cette formule (1 mois offert)',
    ctaHref: '/creer-boutique?plan=decouverte',
  },
  {
    id: 'pro',
    nom: 'Boutique Pro',
    tag: 'Booster de Ventes & POS',
    description: 'Pour les commerces établis voulant la caisse enregistreuse POS, les factures pro et un référencement prioritaire.',
    prixMensuelBase: 5000,
    recommande: true,
    features: [
      'Tout le contenu de la formule Taf Taf',
      'Caisse enregistreuse POS tactile magasin (Mode 100% Hors-Ligne)',
      'Scan des codes-barres par caméra smartphone & Impression tickets',
      'Relances WhatsApp 1-Clic personnalisées avec lien Wave prérempli',
      'Factures & Devis PDF professionnels (Normes OHADA)',
      'Gestion des commandes & Dispatch livreur Tiak-Tiak sur WhatsApp',
      'Import par lot du carnet clients & dettes (CSV / Excel)',
      'Référencement prioritaire comparateur & Badge Vendeur Pro vérifié',
      'Export intégral de votre boutique en 1 clic (.JSON / .CSV)',
      '1er mois 100% OFFERT',
    ],
    ctaText: 'Devenir Vendeur Pro (1 mois offert)',
    ctaHref: '/creer-boutique?plan=pro',
  },
  {
    id: 'business',
    nom: 'Boutique Business VIP',
    tag: 'Solution Globale & Multi-Sites',
    description: 'Pour les grandes enseignes, chaînes de magasins, grossistes et marques d\'importation.',
    prixMensuelBase: 10000,
    features: [
      'Tout le contenu de la formule Boutique Pro',
      'Caisse POS Multi-Caissiers (Codes PIN individuels & Clôtures Z)',
      'Multi-Magasins, dépôts physiques & transferts de stock',
      'Relances WhatsApp automatiques selon l\'échéance du carnet',
      'Automation WhatsApp Relance automatique des paniers abandonnés',
      'Comptabilité avancée (Fournisseurs, bons de commande & marges nettes)',
      'Portail Développeur Clés API REST & Webhooks temps réel',
      'Bannière publicitaire sponsorisée prioritaire en tête de catégorie',
      'Account Manager VIP dédié 7j/7 avec support prioritaire',
      '1er mois 100% OFFERT',
    ],
    ctaText: 'Rejoindre le Business VIP (1 mois offert)',
    ctaHref: '/creer-boutique?plan=business',
  },
]

export const PLANS_AGENCES_CONFIG: PlanConfig[] = [
  {
    id: 'immo_essentiel',
    nom: 'Plan Agence Essentiel',
    tag: 'Démarrage & Bailleurs',
    description: 'Pour les propriétaires indépendants, administrateurs de biens et agents gérant leurs premiers mandats à Dakar.',
    prixMensuelBase: 0,
    populaire: true,
    features: [
      'Jusqu\'à 5 agents négociateurs inclus',
      'Mandats & biens géolocalisés illimités avec photos HD',
      'Génération de baux de location conformes normes OHADA',
      'Émission de Quittances de Loyer certifiées avec QR Code',
      'Contact direct WhatsApp avec acquéreurs & locataires',
      'Vitrine web agence publique sur Nopalou',
      '100% GRATUIT sans engagement de durée',
    ],
    ctaText: 'Créer mon agence gratuite',
    ctaHref: '/inscription?role=agence&plan=immo_essentiel&redirect=/agence',
  },
  {
    id: 'immo_pro',
    nom: 'Plan Agence Pro & Croissance',
    tag: 'Gestion Locative & Quittances Automatiques',
    description: 'Pour les cabinets immobiliers et gestionnaires locatifs : baux OHADA, quittances PDF, relances impayés et loyers Wave.',
    prixMensuelBase: 10000,
    recommande: true,
    features: [
      'Tout le contenu du Plan Agence Essentiel',
      'Jusqu\'à 20 agents négociateurs & gestionnaires',
      'Collecte des loyers 1-clic par Wave & Orange Money (/payer-loyer)',
      'Relances automatiques WhatsApp des impayés de loyer',
      'Reddition des comptes bailleurs & exports comptables',
      'CRM Prospects avec Matching automatique WhatsApp',
      'Espace Locataire dédié dans Mon Compte',
      '1er mois 100% OFFERT',
    ],
    ctaText: 'Activer le Plan Pro (1 mois offert)',
    ctaHref: '/inscription?role=agence&plan=immo_pro&redirect=/agence',
  },
  {
    id: 'immo_multi_agence',
    nom: 'Option Réseau Multi-Agences',
    tag: 'Réseau & Multi-Succursales',
    description: 'Pour les grands réseaux d\'agences, franchises et groupes immobiliers avec succursales multiples.',
    prixMensuelBase: 15000,
    features: [
      'Tout le contenu du Plan Agence Pro',
      'Agents négociateurs illimités sur l\'ensemble du réseau',
      'Gestion multi-succursales, filiales et agences secondaires',
      'Tableaux de bord consolidés groupe & suivi des royalties',
      'Déploiement multi-villes (Dakar, Saly, Thiès, Saint-Louis)',
      'Accompagnement juridique baux et conformité légale',
      'Account Manager VIP dédié 7j/7',
      '1er mois 100% OFFERT',
    ],
    ctaText: 'Déployer mon Réseau (1 mois offert)',
    ctaHref: '/inscription?role=agence&plan=immo_multi_agence&redirect=/agence',
  },
]

