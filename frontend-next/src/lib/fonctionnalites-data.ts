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
      'Page boutique vitrine visible sur Nopalou',
      'Coordonnées et bouton contact WhatsApp direct',
      'Jusqu\'à 2 annonces classées incluses',
    ],
  },
  {
    id: 'decouverte',
    label: 'Boutique Taf Taf',
    couleur: '#10b981',
    avantages: [
      '📒 Carnet de dettes client & crédits inclus (Tous forfaits)',
      '🛍️ Catalogue de produits avec commandes & panier WhatsApp',
      '🌊 Encaissement direct Wave & Orange Money',
      '✨ Import magique de produits depuis AliExpress / 1688',
      '0% de commission sur vos ventes',
      '🎁 1er mois 100% OFFERT',
    ],
  },
  {
    id: 'pro',
    label: 'Boutique Pro',
    couleur: '#f59e0b',
    avantages: [
      '⭐️ Tout le contenu de la formule Taf Taf',
      '📒 Carnet de dettes avec relance WhatsApp 1-Clic',
      '⚡ Saisie Express (Ventes & Dépenses ultra-rapides)',
      '🖥️ Caisse enregistreuse POS magasin tactile (scanners & tickets)',
      '🥇 Référencement prioritaire & Badge Vendeur Pro Certifié',
      '5 annonces classées incluses / mois',
      '📊 Analytics avancés (vues, clics, ventes)',
      '🎁 1er mois 100% OFFERT',
    ],
  },
  {
    id: 'business',
    label: 'Boutique Business VIP',
    couleur: '#6366f1',
    avantages: [
      '👑 Tout le contenu de la formule Vendeur Pro',
      '🔔 Relances WhatsApp automatiques selon l\'échéance du Carnet',
      '🤖 Relances automatiques WhatsApp des Paniers Abandonnés',
      '👥 Caisse POS multi-caissiers avec codes PIN & rapports Z',
      '🏪 Multi-magasins & transferts de stock inter-boutiques',
      '🔌 Portail Développeur API REST & Webhooks',
      '🧾 Comptabilité avancée (Achats fournisseurs, Bons de commande)',
      '📣 Bannière publicitaire sponsorisée prioritaire en tête de catégorie',
      '15 annonces classées incluses / mois',
      '📊 Analytics CA & Marges Nettes par caissier',
      '⚡ Account Manager VIP dédié 7j/7',
      '🎁 1er mois 100% OFFERT',
    ],
  },
]
