export interface FonctionnalitePlateforme {
  id: string
  emoji: string
  label: string
  description: string
}

export interface PalierBoutique {
  id: 'decouverte' | 'gratuit' | 'pro' | 'business'
  label: string
  couleur: string
  avantages: string[]
}

export const FONCTIONNALITES_PLATEFORME: FonctionnalitePlateforme[] = [
  {
    id: 'comparateur',
    emoji: '🔍',
    label: 'Comparateur de prix',
    description: 'Comparez les prix de milliers de produits chez plusieurs marchands sénégalais en un seul endroit.',
  },
  {
    id: 'immo',
    emoji: '🏠',
    label: 'Annonces immobilières',
    description: 'Trouvez ou publiez des annonces de location et de vente — appartements, maisons, terrains.',
  },
  {
    id: 'telecom',
    emoji: '📱',
    label: 'Forfaits télécom',
    description: 'Comparez les forfaits des opérateurs sénégalais et trouvez le meilleur pour votre usage.',
  },
  {
    id: 'alertes',
    emoji: '🔔',
    label: 'Alertes de prix',
    description: 'Soyez notifié dès qu\'un produit que vous suivez baisse de prix.',
  },
  {
    id: 'whatsapp',
    emoji: '🤖',
    label: 'Assistant WhatsApp',
    description: 'Recherchez, commandez et suivez vos commandes directement sur WhatsApp, sans app à installer.',
  },
  {
    id: 'apporteur',
    emoji: '💼',
    label: 'Programme apporteur d\'affaires',
    description: 'Recommandez Nopalou à des commerçants de votre réseau et touchez une commission sur leurs abonnements.',
  },
]

export const PALIERS_BOUTIQUE: PalierBoutique[] = [
  {
    id: 'gratuit',
    label: 'Boutique Gratuite',
    couleur: '#64748B',
    avantages: [
      'Page boutique visible sur /boutiques',
      'Coordonnées et lien WhatsApp affichés',
      'Jusqu\'à 2 annonces classées incluses',
    ],
  },
  {
    id: 'decouverte',
    label: 'Boutique Taf Taf',
    couleur: '#25D366',
    avantages: [
      'Boutique en ligne avec vos produits',
      'Commandes et panier avec paiement Wave/OM',
      'Import magique AliExpress',
      'Lien WhatsApp de commande directe',
    ],
  },
  {
    id: 'pro',
    label: 'Boutique Pro',
    couleur: '#C75B00',
    avantages: [
      'Placement prioritaire dans /boutiques',
      'Badge "Vendeur Pro" sur toutes vos annonces',
      'Catalogue produits avec photos et prix',
      'Accès à la Caisse Enregistreuse POS (Vente magasin)',
      '5 annonces classées incluses/mois',
      'Tableau de bord analytics (vues, clics)',
      'Statistiques des prix concurrents',
    ],
  },
  {
    id: 'business',
    label: 'Boutique Business VIP',
    couleur: '#1e3a5f',
    avantages: [
      'Tout ce qui est inclus dans Vendeur Pro',
      'Accès Caisse POS multi-caissiers & droits d\'équipe (Code PIN)',
      'Multi-Magasins & Transferts de stock inter-boutiques',
      'Portail Développeur API REST & Webhooks personnalisés',
      'Comptabilité avancée (Fournisseurs, Bons d\'achat, Carnet Dettes)',
      'Relances automatiques WhatsApp Paniers Abandonnés',
      'URL dédiée /boutiques/[votre-nom]',
      '15 annonces classées incluses/mois',
      'Bannière sponsorisée prioritaire en tête de catégorie',
      'Analytics CA & Marges Nettes par caissier',
      'Support VIP dédié 7j/7',
    ],
  },
]
