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
    label: 'Comparateur de prix multi-marchands',
    description: 'Comparez les prix de milliers de produits chez plusieurs marchands sénégalais en un seul endroit pour dénicher la meilleure offre.',
  },
  {
    id: 'saisie_express',
    emoji: '⚡',
    label: 'Vente & Saisie Express (1-Clic)',
    description: 'Encaissez vos ventes et enregistrez vos dépenses instantanément avec scanner de code-barres et reconnaissance OCR automatique.',
  },
  {
    id: 'dettes',
    emoji: '📒',
    label: 'Carnet de dettes client & Relances',
    description: 'Suivez précisément les créances clients, achats fournisseurs et envoyez des relances WhatsApp personnalisées en 1 clic.',
  },
  {
    id: 'pos',
    emoji: '🖥️',
    label: 'Caisse enregistreuse POS tactile',
    description: 'Point de vente magasin tout-en-un avec gestion multi-caissiers, impression de tickets, codes PIN et clôtures journalières Z.',
  },
  {
    id: 'immo',
    emoji: '🏠',
    label: 'Portail Immobilier Nopalou',
    description: 'Trouvez ou publiez des annonces vérifiées de location et vente : appartements, villas, studios meublés et terrains au Sénégal.',
  },
  {
    id: 'telecom',
    emoji: '📱',
    label: 'Comparateur forfaits télécom & Pass',
    description: 'Comparez en temps réel les forfaits internet, voix et data Orange, Yas, Expresso et Promobile pour faire des économies.',
  },
  {
    id: 'whatsapp',
    emoji: '🤖',
    label: 'Assistant & Commerce WhatsApp',
    description: 'Catalogue connecté WhatsApp, réception de commandes directes, paniers d’achat et notifications automatiques sans application.',
  },
  {
    id: 'documents',
    emoji: '📄',
    label: 'Facturation & Devis PDF OHADA',
    description: 'Générez des factures professionnelles, devis et reçus conformes aux normes fiscales sénégalaises et exportables en PDF.',
  },
  {
    id: 'alertes',
    emoji: '🔔',
    label: 'Alertes de baisse de prix',
    description: 'Soyez notifié immédiatement par notification push ou WhatsApp dès qu\'un produit suivi bénéficie d\'une promotion.',
  },
  {
    id: 'apporteur',
    emoji: '💼',
    label: 'Programme Apporteur d\'Affaires',
    description: 'Recommandez Nopalou à des commerçants de votre entourage et touchez des commissions récurrentes versées directement sur Wave.',
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
      'Jusqu\'à 10 produits au catalogue',
      '0% de commission sur vos ventes',
    ],
  },
  {
    id: 'decouverte',
    label: 'Boutique Taf Taf',
    couleur: '#10b981',
    avantages: [
      'Catalogue de produits avec commandes & panier WhatsApp',
      'Carnet de dettes client & suivi des impayés (Bor)',
      'Import multi-plateformes (Shopify, AliExpress, Shein, Excel)',
      'QR code boutique à imprimer ou partager',
      'Assistant WhatsApp commercial (+221 70 871 79 42)',
      '0% de commission sur vos ventes',
      '1er mois 100% OFFERT',
    ],
  },
  {
    id: 'pro',
    label: 'Boutique Pro',
    couleur: '#f59e0b',
    avantages: [
      'Tout le contenu du forfait Taf Taf',
      'Caisse POS tactile 100% hors-ligne & scan caméra EAN-13',
      'Impression de tickets et stickers thermiques (58/80mm)',
      'Relances WhatsApp 1-clic avec lien direct Wave',
      'Facturation & devis PDF aux normes OHADA',
      'Dispatch et suivi livreur Tiak-Tiak avec lien GPS',
      'Badge Vendeur Pro Certifié & visibilité prioritaire',
      '1er mois 100% OFFERT',
    ],
  },
  {
    id: 'business',
    label: 'Boutique Business VIP',
    couleur: '#6366f1',
    avantages: [
      'Tout le contenu du forfait Boutique Pro',
      'Caisse POS multi-caissiers avec codes PIN & rapports Z',
      'Multi-magasins et dépôts avec transferts inter-boutiques',
      'Relances automatiques WhatsApp (impayés & paniers abandonnés)',
      'Portail Développeur Clés API REST & Webhooks temps réel',
      'Comptabilité fournisseurs & calcul des marges nettes',
      'Bannière publicitaire sponsorisée en tête de catégorie',
      'Account Manager VIP dédié 7j/7',
      '1er mois 100% OFFERT',
    ],
  },
]
