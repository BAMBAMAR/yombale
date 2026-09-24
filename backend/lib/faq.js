// backend/lib/faq.js — Base de connaissances FAQ unifiée (WhatsApp & Web)
const SITE_DEFAULT = process.env.FRONTEND_URL || 'https://nopalou.com';

function normaliserTexte(s) {
  if (!s || typeof s !== 'string') return '';
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function getFAQWhatsApp(site = SITE_DEFAULT) {
  return [
    {
      motsCles: ['gratuit', 'payant', 'coute', 'couter', 'prix nopalou', 'naata la'],
      reponse: `✅ *Nopalou est 100% gratuit* pour comparer les prix, chercher une annonce ou un bien immo.\n\nSeuls certains services optionnels sont payants : publier une annonce (à partir de 100 FCFA), booster une annonce, ou créer une boutique en ligne (abonnement Pro/Business).`,
    },
    {
      motsCles: ['publier', 'deposer', 'vendre', 'poster annonce'],
      reponse: `📢 *Publier une annonce*\n\nSur le site, cliquez "+ Déposer" puis "Publier une annonce". Ajoutez photos, prix et description — votre annonce est visible après validation par notre équipe.\n👉 ${site}/deposer-annonce`,
    },
    {
      motsCles: ['louer mon', 'vendre mon appartement', 'vendre ma maison', 'annonce immo', 'bien immo'],
      reponse: `🏠 *Publier un bien immobilier*\n\nSur le site, cliquez "+ Déposer" puis "Publier un bien immo". Ajoutez photos, prix, ville et description — visible après validation.\n👉 ${site}/deposer-immo`,
    },
    {
      motsCles: ['agences', 'agence', 'agence immo', 'agences immo', 'agences partenaires', 'courtier', 'cabinets immo', 'annuaire agence'],
      reponse: `🏢 *Agences Immobilières Partenaires*\n\nDécouvrez nos agences immobilières certifiées au Sénégal : mandats exclusifs, villas, appartements et gestion locative.\n\n👉 Annuaire des agences : ${site}/agences\n👉 Espace Agence Pro : ${site}/agence`,
    },
    {
      motsCles: ['boutique', 'vendre en ligne', 'creer shop', 'ouvrir shop'],
      reponse: `🛍️ *Créer votre boutique*\n\nVendez directement sur Nopalou : catalogue produits, statistiques, encaissements Wave & Orange Money 1-Clic. 1er mois 100% OFFERT sur tous nos forfaits !\n👉 ${site}/creer-boutique`,
    },
    {
      motsCles: ['comparer', 'meilleur prix', 'moins cher'],
      reponse: `📊 *Comparer les prix*\n\nSur le site, tapez le nom d'un produit dans la barre de recherche — Nopalou compare automatiquement les prix chez tous les marchands partenaires (Jumia, Expat-Dakar, CoinAfrique...) et affiche le moins cher.\n👉 ${site}`,
    },
    {
      motsCles: ['favoris', 'sauvegarder'],
      reponse: `❤️ *Favoris*\n\nSur le site, cliquez le cœur ❤ sur un produit ou une annonce pour le sauvegarder. Retrouvez tous vos favoris dans la page Favoris, sans inscription requise.\n👉 ${site}/favoris`,
    },
    {
      motsCles: ['apporteur', 'parrainage', 'commission'],
      reponse: `💼 *Programme apporteur d'affaires*\n\nPrésentez Nopalou aux commerçants de votre réseau et touchez une commission chaque mois sur les abonnements des boutiques que vous recrutez — sans investissement.\n👉 ${site}/compte/apporteur`,
    },
    {
      motsCles: ['forfait', 'internet', 'telecom', 'orange', 'free', 'yas', 'expresso', 'promobile'],
      reponse: `📱 *Comparer les forfaits télécom*\n\nSur le site, comparez tous les forfaits mobiles Orange, Yas, Expresso et Promobile : data, appels, SMS, prix.\n👉 ${site}/telecom`,
    },
    {
      motsCles: ['livraison', 'livrer', 'frais livraison', 'zone livraison', 'livraison dakar', 'livrez vous'],
      reponse: `🚚 *Livraison sur Nopalou*\n\n• Pour les produits en boutique : chaque commerçant assure la livraison rapide (Dakar Intra-Muros, Banlieue, Régions).\n• Le tarif et le mode de livraison (Wave ou Cash) sont précisés lors de la commande.\n• Vous pouvez aussi convenir directement de la livraison avec le vendeur par WhatsApp.`,
    },
    {
      motsCles: ['payer', 'paiement', 'moyen de paiement', 'wave', 'orange money'],
      reponse: `💳 *Moyens de paiement acceptés*\n\n🌊 Wave (Paiement 1-Clic sécurisé)\n🟠 Orange Money\n💵 Espèces / Cash à la livraison\n🏦 Virement bancaire\n\nVos paiements sont 100% sécurisés.`,
    },
    {
      motsCles: ['support', 'contact', 'contacter', 'parler', 'humain', 'conseiller', 'service client', 'telephone nopalou', 'appeler nopalou', 'joindre', 'reclamation'],
      reponse: `💬 *Service Client & Support Nopalou*\n\n📞 Téléphone / WhatsApp : +221 70 871 79 42\n📧 Email : contact@nopalou.com\n🌐 Site : nopalou.com\n\n👉 Vous pouvez aussi taper *rappel* pour demander qu'un conseiller vous rappelle directement !`,
    },
    {
      motsCles: ['comment ça marche', 'comment ca marche', 'comment utiliser', 'aide site', 'utiliser nopalou', 'utiliser le site'],
      reponse: `📖 *Comment utiliser Nopalou*\n\n🔍 Comparez les prix produits\n🏆 Guide d'achat personnalisé\n🏡 Trouvez un logement\n📶 Comparez les forfaits télécom\n⚖️ Comparez côte à côte\n❤️ Sauvegardez vos favoris\n🔔 Créez des alertes de prix\n📢 Publiez une annonce\n\nGuide complet : ${site}/guide-utilisation`,
    },
    {
      motsCles: ['supprimer', 'retirer', 'effacer', 'desinscrire', 'stop', 'droit a l oubli', 'supprimer numero', 'retirer annonce'],
      reponse: `🗑️ *Suppression d'annonce ou désinscription*\n\n• Pour supprimer immédiatement vos annonces et votre numéro : tapez *supprimer*\n• Pour ne plus recevoir AUCUN message WhatsApp : tapez *STOP*\n• Vous pouvez aussi écrire à ✉️ contact@nopalou.com`,
    },
  ];
}

function detecterFAQWhatsApp(texte, site = SITE_DEFAULT) {
  if (!texte || typeof texte !== 'string') return null;
  const normalise = normaliserTexte(texte);
  const faqList = getFAQWhatsApp(site);
  return faqList.find(f => f.motsCles.some(mot => normalise.includes(normaliserTexte(mot)))) || null;
}

// ── Base FAQ Web (pour routes/chat.js) ─────────────────────────────────────────
const FAQ_WEB = [
  {
    motsCles: ['livraison', 'delai', 'frais de livraison', 'livrez-vous', 'expedition'],
    titre: 'Livraison & Expéditions',
    reponse: 'Nopalou livre partout à Dakar sous 2 à 4 heures via ses boutiques partenaires et leurs livreurs tiak-tiak dédiés, et dans les régions du Sénégal sous 24 à 48 heures. Les frais sont calculés lors de la commande.',
    actionLabel: 'Explorer les boutiques',
    actionUrl: '/boutiques',
  },
  {
    motsCles: ['paiement', 'wave', 'orange money', 'om', 'payer', 'carte bancaire'],
    titre: 'Moyens de Paiement Sécurisés',
    reponse: 'Vous pouvez régler directement par Wave, Orange Money ou en espèces à la livraison. Les paiements sont sécurisés sans frais cachés.',
    actionLabel: 'En savoir plus',
    actionUrl: '/aide',
  },
  {
    motsCles: ['vendre', 'creer boutique', 'devenir vendeur', 'marchand', 'ouvrir magasin'],
    titre: 'Ouvrir votre Boutique Nopalou',
    reponse: 'Créer votre boutique sur Nopalou est rapide et gratuit le 1er mois : catalogue en ligne, caisse tactile et synchronisation WhatsApp automatique.',
    actionLabel: 'Créer ma boutique',
    actionUrl: '/creer-boutique',
  },
  {
    motsCles: ['caisse', 'pos', 'terminal', 'encaissement', 'code barre', 'scanner', 'point de vente'],
    titre: 'Caisse Tactile & Point de Vente (POS)',
    reponse: 'Nopalou intègre une caisse tactile complète pour les commerçants : gestion des stocks en temps réel, tickets de caisse, carnet de crédit client et encaissement multi-moyens (Wave, Orange Money, Espèces).',
    actionLabel: 'Accéder à la caisse',
    actionUrl: '/boutique/caisse',
  },
  {
    motsCles: ['crm', 'gestion locative', 'locataire', 'bail', 'quittance', 'impaye', 'loyer'],
    titre: 'Gestion Locative & CRM Immobilier',
    reponse: 'Nopalou propose aux agences et gestionnaires un module de gestion locative complet : suivi des baux, édition de quittances, relances des impayés et CRM prospects.',
    actionLabel: 'Découvrir les agences',
    actionUrl: '/agences',
  },
  {
    motsCles: ['commande', 'suivi', 'colis', 'ou est ma commande', 'etat commande', 'statut commande', 'livreur'],
    titre: 'Suivi de Commande en Direct',
    reponse: 'Pour suivre votre commande en direct, munissez-vous de votre référence de commande ou numéro de téléphone sur notre page dédiée au suivi.',
    actionLabel: 'Suivre ma commande',
    actionUrl: '/suivi-commande',
  },
  {
    motsCles: ['annuaire agence', 'agences partenaires', 'trouver une agence', 'liste des agences'],
    titre: 'Annuaire des Agences Immobilières',
    reponse: 'Retrouvez toutes les agences immobilières partenaires sur Nopalou : consultez leurs biens exclusifs, leurs équipes et contactez-les directement.',
    actionLabel: 'Voir les agences',
    actionUrl: '/agences',
  },
];

function rechercherFAQWeb(texte) {
  if (!texte || typeof texte !== 'string') return null;
  const normalise = normaliserTexte(texte);
  return FAQ_WEB.find(f => f.motsCles.some(mot => normalise.includes(normaliserTexte(mot)))) || null;
}

module.exports = {
  normaliserTexte,
  getFAQWhatsApp,
  detecterFAQWhatsApp,
  FAQ_WEB,
  rechercherFAQWeb,
};
