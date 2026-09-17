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
    id: 'agence_starter',
    nom: 'Agence Starter',
    tag: 'Démarrage Bailleurs',
    description: 'Pour les propriétaires indépendants et agents gérant leurs premiers mandats à Dakar.',
    prixMensuelBase: 0,
    populaire: true,
    features: [
      'Gestion et publication jusqu\'à 5 biens avec photos HD',
      'Fiches immobilières géolocalisées avec commodités',
      'Contact direct WhatsApp avec les acquéreurs et locataires',
      'Gestion des mandats simples et exclusifs',
      'Assistance WhatsApp 7j/7',
      '100% GRATUIT sans engagement de durée',
    ],
    ctaText: 'Créer mon agence gratuite',
    ctaHref: '/inscription?role=agence&redirect=/agence',
  },
  {
    id: 'agence_pro',
    nom: 'Agence Pro & Gestion Locative',
    tag: 'Solution Métier Complète',
    description: 'Pour les agences et gestionnaires locatifs : baux numériques, quittances PDF et loyers Wave.',
    prixMensuelBase: 10000,
    recommande: true,
    features: [
      'Tout le contenu de la formule Agence Starter',
      'Biens et mandats illimités (Photos HD, Vidéos YouTube/TikTok, Visites 3D)',
      'Gestion locative complète : Baux conformes & calendrier d\'échéances',
      'Émission de Quittances de Loyer certifiées PDFKit avec QR Code',
      'Collecte des loyers 1-clic par Wave & Orange Money (/payer-loyer)',
      'CRM Prospects avec Matching automatique par WhatsApp (score ≥ 65%)',
      'Espace Locataire dédié dans Mon Compte',
      '1er mois 100% OFFERT',
    ],
    ctaText: 'Activer la Gestion Locative (1 mois offert)',
    ctaHref: '/inscription?role=agence&redirect=/agence',
  },
  {
    id: 'agence_vip',
    nom: 'Agence Premium Sponsoring',
    tag: 'Visibilité N°1 Sénégal',
    description: 'Pour les agences de référence souhaitant maximiser leur notoriété et leurs mandats exclusifs.',
    prixMensuelBase: 25000,
    features: [
      'Tout le contenu de la formule Agence Pro & Gestion Locative',
      'Mise en avant sponsorisée prioritaire en tête de l\'annuaire (/agences)',
      'Bannière publicitaire en tête des recherches immobilières à Dakar',
      'Badge Officiel Agence Vérifiée & Tiers de Confiance Nopalou',
      'Gestion Multi-Négociateurs & calcul des commissions',
      'Accompagnement juridique baux et états des lieux numériques',
      'Account Manager dédié 7j/7',
      '1er mois 100% OFFERT',
    ],
    ctaText: 'Devenir Agence Partenaire VIP (1 mois offert)',
    ctaHref: '/inscription?role=agence&redirect=/agence',
  },
]
