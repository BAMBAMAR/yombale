// backend/lib/faq.js — Base de connaissances FAQ unifiée (WhatsApp & Web)
const cfg = require('./settingsCache');
// AUD-111 : durée d'essai lue dans le réglage admin, jamais écrite en dur.
const essaiJours = () => Math.round(Number(cfg.getSync('abonnement_essai_jours'))) || 30;
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
      reponse: `🛍️ *Créer votre boutique*\n\nVendez directement sur Nopalou : catalogue produits, statistiques, encaissements Wave & Orange Money 1-Clic. ${essaiJours()} jours 100% OFFERTS sur tous nos forfaits !\n👉 ${site}/creer-boutique`,
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
// Une entrée = un sujet. Champs :
//  - motsCles       : sous-chaîne du message (sans accents ni ponctuation) ; 3 lettres ou moins = mot entier (« om », « pos »).
//  - motsClesCourts : ne comptent que si le message n'est que ce mot (« voir les annonces », pas « annonce villa Almadies »).
//  - reponse        : propriété calculée à chaque question, pour que les réglages admin (durée d'essai, quota, liens
//                     sociaux) ne soient jamais figés au démarrage du serveur.
//  - actions        : boutons proposés (actionLabel/actionUrl = ancien format, un seul bouton).
// Plusieurs sujets peuvent correspondre : le mot-clé le plus long l'emporte (« publier une annonce » > « publier »).
const WA_SUPPORT_URL = 'https://wa.me/221708717942';
const SUPPORT_TEL = '+221 70 871 79 42';
const fcfa = (n) => `${Math.round(Number(n)).toLocaleString('fr-FR').replace(/[  ]/g, ' ')} FCFA`;
const reglageNum = (cle, defaut) => Number(cfg.getSync(cle)) || defaut;

function liensSociaux() {
  const defaut = [
    ['TikTok', 'https://www.tiktok.com/@nopalou.com'],
    ['Canal WhatsApp', 'https://whatsapp.com/channel/0029Vb8fc4bBadmW40AFKx33'],
    ['Facebook', 'https://www.facebook.com/profile.php?id=61591675701726'],
    ['Instagram', 'https://www.instagram.com/nopalousn/'],
    ['X (Twitter)', 'https://x.com/nopalou_sn'],
  ];
  let liste = defaut;
  try {
    const brut = cfg.getSync('nopalou_social_links');
    const parse = typeof brut === 'string' ? JSON.parse(brut) : brut;
    const actifs = Array.isArray(parse)
      ? parse.filter((l) => l && l.url && l.actif !== false && !/wa\.me/.test(l.url)).map((l) => [l.name || l.id, l.url])
      : [];
    if (actifs.length) liste = actifs;
  } catch { /* réglage illisible : liens officiels par défaut */ }
  return liste;
}

const FAQ_WEB = [
  // ── Acheter ───────────────────────────────────────────────────────────────────
  {
    motsCles: ['livraison', 'delai', 'frais de livraison', 'livrez vous', 'expedition', 'retrait en boutique'],
    titre: 'Livraison & Expéditions',
    reponse: 'Nopalou livre partout à Dakar sous 2 à 4 heures via ses boutiques partenaires et leurs livreurs tiak-tiak dédiés, et dans les régions du Sénégal sous 24 à 48 heures. Les frais sont calculés lors de la commande. Chaque boutique fixe ses zones et ses tarifs : le retrait en boutique est toujours gratuit, et si les frais ne sont pas encore fixés, le vendeur les convient avec vous sur WhatsApp.',
    actionLabel: 'Explorer les boutiques',
    actionUrl: '/boutiques',
  },
  {
    motsCles: ['paiement', 'wave', 'orange money', 'om', 'payer', 'carte bancaire', 'cash', 'especes', 'a la livraison'],
    titre: 'Moyens de Paiement Sécurisés',
    reponse: 'Vous pouvez régler directement par Wave, Orange Money ou en espèces à la livraison, selon les moyens proposés par la boutique. Les paiements sont sécurisés sans frais cachés.',
    actionLabel: 'En savoir plus',
    actionUrl: '/aide',
  },
  {
    motsCles: ['comment commander', 'comment acheter', 'comment passer commande', 'passer commande', 'passer une commande', 'comment faire une commande', 'comment ca se passe pour commander'],
    titre: 'Comment commander',
    reponse: 'Ouvrez la fiche d’un produit de boutique puis « Ajouter au panier » ou « Commander en direct ». Choisissez le retrait gratuit en boutique ou la livraison, puis réglez par Wave, Orange Money ou en espèces selon la boutique. Vous recevez une référence de commande pour la suivre. Les produits « Marketplace » du comparateur sont vendus chez le marchand d’origine : le bouton « Voir le produit » vous y conduit.',
    actions: [
      { label: 'Explorer les boutiques', url: '/boutiques' },
      { label: 'Suivre ma commande', url: '/suivi-commande' },
      { label: 'Guide d’achat', url: '/guide-achat' },
    ],
  },
  {
    motsCles: ['suivi commande', 'suivre ma commande', 'suivi de commande', 'suivi', 'colis', 'mon colis', 'ou est ma commande', 'etat commande', 'statut commande', 'livreur'],
    titre: 'Suivi de Commande en Direct',
    reponse: 'Pour suivre votre commande en direct, munissez-vous de votre référence de commande ou numéro de téléphone sur notre page dédiée au suivi.',
    actionLabel: 'Suivre ma commande',
    actionUrl: '/suivi-commande',
  },
  {
    motsCles: ['annuler ma commande', 'annuler une commande', 'annulation de commande', 'retour produit', 'retourner', 'rembourse', 'commande non recue', 'pas recu ma commande', 'produit defectueux', 'produit non conforme', 'mauvais produit'],
    titre: 'Annulation, retour & remboursement',
    reponse: 'Chaque boutique fixe ses conditions d’annulation et de retour. Contactez d’abord le vendeur (WhatsApp depuis sa boutique ou depuis la page de suivi de commande). Sans réponse ou en cas de litige, ouvrez un ticket depuis la page Aide en indiquant la référence de commande : l’équipe Nopalou intervient.',
    actions: [
      { label: 'Suivre ma commande', url: '/suivi-commande' },
      { label: 'Ouvrir un ticket', url: '/aide' },
      { label: 'Écrire au support WhatsApp', url: WA_SUPPORT_URL },
    ],
  },
  {
    motsCles: ['comment comparer', 'comparer les prix', 'comparateur de prix', 'comment fonctionne le comparateur'],
    titre: 'Comparer les prix',
    reponse: 'Tapez le nom d’un produit dans la barre de recherche ou ici : Nopalou rassemble les offres des marchands en ligne et des boutiques locales, classées par prix, avec l’écart entre la moins chère et la plus chère. Les prix sont relevés régulièrement : vérifiez toujours le prix final sur la fiche du marchand.',
    actions: [
      { label: 'Ouvrir le comparateur', url: '/recherche' },
      { label: 'Guide d’achat', url: '/guide-achat' },
    ],
  },
  {
    motsCles: ['favoris', 'favori', 'sauvegarder un produit', 'alerte de prix', 'alertes de prix', 'alerte prix', 'baisse de prix', 'me prevenir'],
    titre: 'Favoris & alertes de prix',
    reponse: 'Cliquez sur le cœur d’un produit ou d’une annonce pour le garder dans vos Favoris (sans inscription). Pour être prévenu quand un prix baisse, créez une alerte depuis la fiche du produit : il faut un compte, et vos alertes se gèrent ensuite dans votre espace.',
    actions: [
      { label: 'Mes favoris', url: '/favoris' },
      { label: 'Mon compte', url: '/compte' },
    ],
  },
  {
    motsCles: ['bon plan', 'bons plans', 'offres du moment', 'code promo', 'page promo', 'promotions en cours'],
    motsClesCourts: ['promo', 'promotion', 'promotions', 'soldes'],
    titre: 'Promotions & bons plans',
    reponse: 'Les promotions en cours des boutiques et marchands sont réunies sur la page Promo. Le canal WhatsApp Nopalou diffuse aussi les bons plans.',
    actions: [{ label: 'Voir les promos', url: '/promo' }],
  },
  {
    motsCles: ['forfait mobile', 'forfaits mobile', 'forfait internet', 'forfaits internet', 'forfait data', 'forfaits data', 'forfait orange', 'forfait yas', 'forfait free', 'forfait expresso', 'forfaits telecom', 'telecom', 'data mobile', 'pass internet'],
    titre: 'Forfaits télécom',
    reponse: 'Comparez les forfaits mobiles Orange, Yas, Free et Expresso : data, appels, SMS, durée et prix, pour choisir le moins cher selon votre usage.',
    actions: [
      { label: 'Comparer les forfaits', url: '/telecom' },
      { label: 'Guide forfaits', url: '/guide-forfait' },
    ],
  },

  // ── Annonces & immobilier ─────────────────────────────────────────────────────
  {
    motsClesCourts: ['annonce', 'annonces', 'petite annonce', 'petites annonces'],
    motsCles: [
      'deposer une annonce', 'deposer annonce', 'publier une annonce', 'publier annonce', 'poster une annonce', 'passer une annonce',
      'creer une annonce', 'mettre une annonce', 'mes annonces', 'mon annonce', 'modifier mon annonce', 'supprimer mon annonce',
      'supprimer une annonce', 'annonce gratuite', 'vendre ma voiture', 'vendre une voiture', 'vendre mon telephone', 'vendre ma moto',
      'vendre mon ordinateur', 'vendre mes affaires', 'mettre en vente',
    ],
    titre: 'Petites annonces',
    get reponse() {
      const quota = reglageNum('quota_annonces_gratuit', 2);
      const prix = reglageNum('prix_annonce', 1500);
      return `Les annonces servent à vendre ou proposer ponctuellement : voiture, téléphone, électroménager, services… Pour publier : créez un compte et vérifiez votre e-mail, cliquez sur « Déposer », choisissez la catégorie, ajoutez jusqu’à 5 photos, le prix et votre contact. Vos ${quota} premières annonces sont gratuites, ensuite ${fcfa(prix)} par annonce (plus de places gratuites avec une boutique Pro ou Business). Elle apparaît après validation. Vous pouvez la modifier, la supprimer ou la mettre en avant depuis votre compte.`;
    },
    actions: [
      { label: 'Voir les annonces', url: '/annonces' },
      { label: 'Déposer une annonce', url: '/deposer-annonce' },
    ],
  },
  {
    motsCles: [
      'publier un bien', 'deposer un bien', 'deposer immo', 'annonce immo', 'annonce immobiliere', 'proposer un logement',
      'mettre mon appartement en location', 'mettre ma maison en location', 'louer mon appartement', 'louer ma maison', 'louer mon', 'vendre mon appartement',
      'vendre ma maison', 'vendre ma villa', 'vendre mon terrain', 'je suis proprietaire',
      'publier mon appartement', 'publier ma maison', 'publier mon bien', 'publier un appartement', 'publier une villa', 'deposer un appartement', 'mettre en location', 'proposer mon appartement',
    ],
    titre: 'Publier un bien immobilier',
    reponse: 'Propriétaire : cliquez sur « Déposer » puis « Publier un bien immo », ajoutez photos, prix, quartier et description ; l’annonce est visible après validation. Si vous gérez plusieurs biens, l’espace Agence offre mandats, baux et gestion locative.',
    actions: [
      { label: 'Publier un bien', url: '/deposer-immo' },
      { label: 'Espace Agence', url: '/agence' },
      { label: 'Biens immobiliers', url: '/immo' },
    ],
  },
  {
    motsCles: ['plan agence', 'abonnement agence', 'tarif agence', 'tarifs agence', 'inscrire mon agence', 'inscrire agence', 'espace agence', 'agence pro', 'negociateur', 'mandat', 'je suis une agence', 'agent immobilier', 'devenir agence partenaire'],
    titre: 'Espace Agence immobilière',
    reponse: 'Les agences ont deux formules : Agence Essentiel, gratuite sans limite de durée (jusqu’à 5 négociateurs, mandats, baux conformes OHADA), et Agence Pro & Croissance à 10 000 FCFA/mois pour aller plus loin. Les locataires règlent leur loyer par Wave ou Orange Money.',
    actions: [
      { label: 'Espace Agence', url: '/agence' },
      { label: 'Voir les tarifs', url: '/tarifs-boutique?secteur=immo' },
    ],
  },
  {
    motsCles: ['crm', 'gestion locative', 'locataire', 'bail', 'quittance', 'impaye', 'loyer'],
    titre: 'Gestion Locative & CRM Immobilier',
    reponse: 'Nopalou propose aux agences et gestionnaires un module de gestion locative complet : suivi des baux, édition de quittances, relances des impayés et CRM prospects.',
    actionLabel: 'Découvrir les agences',
    actionUrl: '/agences',
  },
  {
    motsCles: ['payer mon loyer', 'payer loyer', 'payer le loyer', 'paiement du loyer', 'recu de loyer', 'payer ma location'],
    titre: 'Payer son loyer en ligne',
    reponse: 'Si votre agence ou bailleur utilise Nopalou, payez votre loyer depuis la page « Payer mon loyer » par Wave ou Orange Money et recevez votre quittance. Sinon, demandez à votre agence de s’inscrire.',
    actions: [{ label: 'Payer mon loyer', url: '/payer-loyer' }],
  },
  {
    motsCles: ['annuaire agence', 'agences partenaires', 'trouver une agence', 'liste des agences'],
    titre: 'Annuaire des Agences Immobilières',
    reponse: 'Retrouvez toutes les agences immobilières partenaires sur Nopalou : consultez leurs biens exclusifs, leurs équipes et contactez-les directement.',
    actionLabel: 'Voir les agences',
    actionUrl: '/agences',
  },

  // ── Vendre : boutique & caisse ────────────────────────────────────────────────
  {
    motsCles: ['vendre', 'je veux vendre', 'comment vendre', 'vendre mes produits', 'vendre en ligne'],
    titre: 'Vendre sur Nopalou',
    get reponse() {
      return `Deux façons de vendre : une boutique pour vendre régulièrement (catalogue en ligne, caisse tactile, commandes WhatsApp, paiements Wave/Orange Money, ${essaiJours()} jours d’essai offerts), ou une annonce pour une vente ponctuelle (voiture, téléphone, meuble…).`;
    },
    actions: [
      { label: 'Créer ma boutique', url: '/creer-boutique' },
      { label: 'Déposer une annonce', url: '/deposer-annonce' },
    ],
  },
  {
    motsCles: ['creer boutique', 'creer une boutique', 'creer ma boutique', 'creer mon shop', 'ouvrir une boutique', 'ouvrir ma boutique', 'ouvrir un shop', 'boutique en ligne', 'devenir vendeur', 'devenir commercant', 'marchand', 'ouvrir magasin', 'inscrire ma boutique', 'lancer mon commerce'],
    titre: 'Ouvrir votre Boutique Nopalou',
    get reponse() {
      return `Créer votre boutique sur Nopalou est rapide et gratuit pendant ${essaiJours()} jours : catalogue en ligne, caisse tactile et synchronisation WhatsApp automatique. Vous pouvez l’ouvrir en 30 secondes par WhatsApp ou avec le formulaire du site.`;
    },
    actions: [
      { label: 'Créer ma boutique', url: '/creer-boutique' },
      { label: 'Voir les tarifs', url: '/tarifs-boutique' },
      { label: 'Guide : créer sa boutique', url: '/guide-creer-boutique' },
    ],
  },
  {
    motsCles: ['tarif', 'tarifs', 'prix abonnement', 'prix de l abonnement', 'abonnement', 'forfait boutique', 'formule', 'taf taf', 'boutique pro', 'boutique business', 'combien coute nopalou', 'combien coute la boutique', 'combien coute une boutique', 'combien coute l abonnement', 'prix boutique', 'commission sur', 'prenez vous une commission'],
    titre: 'Tarifs & formules',
    get reponse() {
      return `Boutique : Taf Taf dès 2 500 FCFA/mois, Pro 5 000 FCFA/mois (caisse tactile, documents, fournisseurs), Business 10 000 FCFA/mois (équipe, multi-entrepôts), avec ${essaiJours()} jours d’essai offerts. Abonnement mensuel fixe, 0 % de commission sur vos ventes (détails sur la page Tarifs). Agence immobilière : Essentiel gratuit, Pro 10 000 FCFA/mois. Paiement par Wave ou Orange Money. Pour l’acheteur, Nopalou est gratuit.`;
    },
    actions: [
      { label: 'Voir les tarifs', url: '/tarifs-boutique' },
      { label: 'Créer ma boutique', url: '/creer-boutique' },
    ],
  },
  {
    motsCles: ['est ce gratuit', 'est ce payant', 'c est gratuit', 'c est payant', 'gratuit ou payant', 'nopalou est gratuit', 'nopalou gratuit', 'frais pour acheter', 'frais acheteur'],
    motsClesCourts: ['gratuit', 'payant'],
    titre: 'Nopalou est-il gratuit ?',
    reponse: 'Oui pour les acheteurs : comparer les prix, chercher une annonce ou un bien immobilier, utiliser le chat et les favoris est gratuit. Seuls les services optionnels sont payants : publier des annonces au-delà du quota gratuit, mettre en avant une annonce ou une boutique, et les abonnements boutique ou agence.',
    actions: [
      { label: 'Voir les tarifs', url: '/tarifs-boutique' },
      { label: 'Déposer une annonce', url: '/deposer-annonce' },
    ],
  },
  {
    motsCles: [
      'ajouter produit', 'ajouter un produit', 'ajouter des produits', 'ajouter un article', 'ajouter article', 'publier un produit',
      'enregistrer un produit', 'creer un produit', 'nouveau produit', 'modifier un produit', 'modifier mon produit', 'supprimer un produit',
      'mon catalogue', 'mes produits', 'gerer mon stock', 'gerer le stock', 'gestion de stock', 'gestion du stock', 'mettre a jour le stock', 'mon stock', 'inventaire',
    ],
    titre: 'Ajouter et gérer ses produits',
    reponse: 'Depuis votre espace boutique, ouvrez « Catalogue » puis « Ajouter un produit » : nom, prix, photos, stock et variantes. Autres moyens : envoyer la photo et le prix au bot WhatsApp Nopalou, ou importer tout votre catalogue d’un coup depuis Excel, Shopify ou WooCommerce. Il faut d’abord avoir une boutique ; vos produits sont visibles dès l’enregistrement et le stock se met à jour à chaque vente.',
    actions: [
      { label: 'Mon catalogue', url: '/boutique/catalogue' },
      { label: 'Importer mon catalogue', url: '/migration' },
      { label: 'Créer ma boutique', url: '/creer-boutique' },
    ],
  },
  {
    motsCles: ['importer', 'import shopify', 'shopify', 'woocommerce', 'excel', 'migrer', 'migration'],
    titre: 'Importer son catalogue',
    reponse: 'Vous venez d’une autre plateforme ? Importez vos produits en un clic depuis Shopify, WooCommerce ou un fichier Excel, au lieu de les ressaisir.',
    actions: [
      { label: 'Importer mon catalogue', url: '/migration' },
      { label: 'Alternative à Shopify', url: '/alternative-shopify-senegal' },
    ],
  },
  {
    motsCles: ['caisse', 'pos', 'terminal', 'encaissement', 'code barre', 'scanner', 'point de vente', 'hors ligne', 'sans internet', 'imprimante', 'ticket de caisse'],
    titre: 'Caisse Tactile & Point de Vente (POS)',
    reponse: 'Nopalou intègre une caisse tactile complète pour les commerçants : gestion des stocks en temps réel, tickets de caisse, carnet de crédit client et encaissement multi-moyens (Wave, Orange Money, Espèces). Elle est incluse à partir de la formule Pro (et pendant l’essai gratuit) et continue d’encaisser sans connexion : les ventes se synchronisent au retour du réseau.',
    actions: [
      { label: 'Accéder à la caisse', url: '/boutique/caisse' },
      { label: 'Logiciel de caisse', url: '/logiciel-caisse-senegal' },
    ],
  },
  {
    motsCles: ['carnet de credit', 'credit client', 'dette client', 'dettes clients', 'dettes de mes clients', 'relancer un client', 'relance dette', 'suivre les dettes', 'carnet client'],
    titre: 'Carnet de crédit des clients',
    reponse: 'Dans l’espace boutique, le Carnet enregistre ce que vos clients vous doivent. Nopalou relance le client par WhatsApp avec un lien pour payer en ligne par Wave ou Orange Money, et le solde se met à jour dès le paiement.',
    actions: [
      { label: 'Mon carnet', url: '/boutique/carnet' },
      { label: 'En savoir plus', url: '/gestion-stock-carnet-dettes' },
    ],
  },
  {
    motsCles: ['gerer mes commandes', 'traiter une commande', 'commandes recues', 'valider une commande', 'assigner un livreur', 'dispatch livreur'],
    titre: 'Gérer les commandes (vendeur)',
    reponse: 'Vous êtes alerté par WhatsApp à chaque commande. Dans l’espace boutique, « Commandes » montre pour chacune la prochaine étape (confirmer, préparer, expédier, livrée), l’appel ou le WhatsApp du client en un clic et la facture PDF. Si les frais de livraison sont « à convenir », fixez le tarif avec le client puis saisissez-le sur la commande.',
    actions: [{ label: 'Mes commandes', url: '/boutique/commandes' }],
  },
  {
    motsCles: ['faire une facture', 'creer une facture', 'generer une facture', 'facture pdf', 'facture ohada', 'devis', 'bon de commande'],
    titre: 'Factures & devis',
    reponse: 'Les formules Pro et Business permettent d’éditer factures et devis conformes OHADA depuis l’espace boutique, rubrique « Documents », et de les envoyer à vos clients en PDF.',
    actions: [
      { label: 'Mes documents', url: '/boutique/documents' },
      { label: 'Voir les tarifs', url: '/tarifs-boutique' },
    ],
  },
  {
    motsCles: ['vendre sur whatsapp', 'boutique whatsapp', 'assistant whatsapp', 'bot whatsapp', 'chatbot whatsapp', 'commander sur whatsapp'],
    titre: 'Nopalou sur WhatsApp',
    reponse: `Écrivez au ${SUPPORT_TEL} : le bot cherche et compare les produits, aide à commander et suivre une commande. Les commerçants y créent leur boutique, ajoutent un article avec une photo et un prix, consultent leurs commandes et leur bilan du jour. Tapez « menu » pour les options, ou STOP pour ne plus recevoir de messages.`,
    actions: [
      { label: 'Ouvrir WhatsApp', url: WA_SUPPORT_URL },
      { label: 'Vendre sur WhatsApp', url: '/vendre-sur-whatsapp' },
    ],
  },
  {
    motsCles: ['booster', 'boost', 'booster mon annonce', 'booster ma boutique', 'booster une annonce', 'mettre en avant mon', 'mettre en avant une', 'sponsoriser', 'sponsoring', 'mise en avant', 'mettre en avant', 'promouvoir'],
    titre: 'Mettre en avant une annonce ou une boutique',
    reponse: 'Vous pouvez booster une annonce, un bien immobilier, un produit ou votre boutique pour apparaître en tête : le bouton se trouve dans votre espace, à côté de l’élément concerné. Le tarif et la durée s’affichent avant le paiement par Wave ou Orange Money.',
    actions: [
      { label: 'Mon compte', url: '/compte' },
      { label: 'Mon espace boutique', url: '/boutique' },
    ],
  },

  // ── Compte, aide & confiance ──────────────────────────────────────────────────
  {
    motsCles: ['creer un compte', 'creer mon compte', 'creer compte', 'inscription', 'inscrire', 'connexion', 'se connecter', 'me connecter', 'mot de passe', 'mdp', 'verifier mon email', 'mon compte', 'espace client', 'modifier mon profil', 'changer mon email', 'changer mon numero'],
    titre: 'Compte & connexion',
    reponse: 'Créez votre compte avec votre e-mail ou votre numéro WhatsApp, puis confirmez votre e-mail (nécessaire pour publier une annonce). Mot de passe oublié : un lien de réinitialisation vous est envoyé par e-mail. Votre compte réunit vos commandes, favoris, alertes de prix, annonces et Sama Xaalis.',
    actions: [
      { label: 'Créer un compte', url: '/inscription' },
      { label: 'Se connecter', url: '/connexion' },
      { label: 'Mot de passe oublié', url: '/mot-de-passe-oublie' },
    ],
  },
  {
    motsCles: ['supprimer mon compte', 'supprimer le compte', 'fermer mon compte', 'effacer mon compte', 'supprimer mes donnees', 'droit a l oubli', 'rgpd', 'se desinscrire', 'desinscrire'],
    titre: 'Supprimer mon compte',
    reponse: 'Dans votre compte, section Profil, choisissez « Supprimer mon compte » : confirmez avec votre mot de passe et en tapant SUPPRIMER. Vous avez ensuite 30 jours pour changer d’avis : il suffit de vous reconnecter et d’annuler la suppression. Passé ce délai, vos données personnelles sont effacées.',
    actions: [
      { label: 'Mon compte', url: '/compte' },
      { label: 'Confidentialité', url: '/confidentialite' },
    ],
  },
  {
    motsCles: ['confidentialite', 'vie privee', 'cgu', 'conditions generales', 'conditions d utilisation', 'mentions legales', 'cookies', 'donnees personnelles'],
    titre: 'Informations légales',
    reponse: 'Retrouvez nos conditions d’utilisation, notre politique de confidentialité (données personnelles, cookies de mesure d’audience) et nos mentions légales (éditeur, hébergeurs, contacts).',
    actions: [
      { label: 'Conditions d’utilisation', url: '/cgu' },
      { label: 'Confidentialité', url: '/confidentialite' },
      { label: 'Mentions légales', url: '/mentions-legales' },
    ],
  },
  {
    motsCles: [
      'declarer un probleme', 'signaler un probleme', 'un probleme', 'mon probleme', 'probleme avec', 'reclamation', 'litige', 'plainte',
      'creer un ticket', 'ouvrir un ticket', 'suivre mon ticket', 'mon ticket', 'numero de ticket', 'assistance', 'support nopalou', 'support client',
      'contacter le support', 'contacter nopalou', 'contact nopalou', 'nous contacter', 'vous contacter', 'comment vous joindre', 'service client',
      'parler a un humain', 'parler a quelqu', 'numero nopalou', 'telephone nopalou', 'email nopalou', 'adresse nopalou', 'horaires', 'bug',
    ],
    titre: 'Support & signalement',
    reponse: `Pour déclarer un problème (commande, paiement, vendeur, bug) : ouvrez un ticket depuis la page Aide. Vous recevez un numéro (de la forme TCK-2026-XXXX) pour suivre la réponse de l’équipe, sans créer de compte. Vous pouvez aussi écrire sur WhatsApp au ${SUPPORT_TEL} ou à contact@nopalou.com. Service client : lundi au samedi, 8h-20h.`,
    actions: [
      { label: 'Ouvrir un ticket', url: '/aide' },
      { label: 'Écrire sur WhatsApp', url: WA_SUPPORT_URL },
    ],
  },
  {
    motsCles: ['arnaque', 'arnaqueur', 'escroc', 'escroquerie', 'fraude', 'frauduleux', 'contrefacon', 'signaler une boutique', 'signaler une annonce', 'signaler un vendeur', 'vendeur suspect', 'boutique suspecte'],
    titre: 'Signaler un abus',
    reponse: 'Merci de nous prévenir. Ouvrez un ticket depuis la page Aide en décrivant le cas et en joignant le lien de la boutique, du produit ou de l’annonce : l’équipe vérifie et peut suspendre le contenu. N’envoyez jamais d’argent hors de la plateforme à quelqu’un que vous ne connaissez pas.',
    actions: [
      { label: 'Signaler via un ticket', url: '/aide' },
      { label: 'Écrire sur WhatsApp', url: WA_SUPPORT_URL },
    ],
  },
  {
    motsCles: ['est ce fiable', 'nopalou est fiable', 'nopalou est il fiable', 'est ce securise', 'site securise', 'nopalou est securise', 'faire confiance', 'puis je faire confiance'],
    titre: 'Fiabilité & sécurité',
    reponse: 'Nopalou compare les offres et vous met en relation avec les boutiques. Les paiements en ligne passent par Wave ou Orange Money. Pour acheter sereinement : consultez les avis et la fiche de la boutique, commandez via Nopalou pour garder une référence de suivi, et méfiez-vous de toute demande de paiement hors plateforme. Un doute ou un abus : signalez-le par ticket.',
    actions: [
      { label: 'Signaler un problème', url: '/aide' },
      { label: 'Pourquoi Nopalou', url: '/pourquoi-nopalou' },
    ],
  },
  {
    motsCles: ['laisser un avis', 'donner un avis', 'poster un avis', 'noter une boutique', 'noter un vendeur', 'avis client'],
    titre: 'Donner un avis',
    reponse: 'Sur la fiche d’une boutique ou d’un produit, la section « Avis » permet de laisser une note de 1 à 5 étoiles et un commentaire. Une boutique sans avis est affichée comme « Nouveau commerçant ».',
    actions: [{ label: 'Explorer les boutiques', url: '/boutiques' }],
  },
  {
    motsCles: ['application mobile', 'telecharger l application', 'telecharger application', 'installer nopalou', 'installer l application', 'app mobile', 'play store', 'app store', 'application android', 'application iphone', 'ecran d accueil'],
    titre: 'Installer Nopalou sur son téléphone',
    reponse: 'Nopalou est une application web installable. Sur Android (Chrome) : menu ⋮ puis « Installer l’application » ou « Ajouter à l’écran d’accueil ». Sur iPhone (Safari) : bouton Partager puis « Sur l’écran d’accueil ». L’icône Nopalou apparaît alors comme une application.',
    actions: [{ label: 'Guide d’utilisation', url: '/guide-utilisation' }],
  },
  {
    motsCles: ['apporteur', 'apporteur d affaires', 'parrainage', 'parrainer', 'gagner de l argent', 'devenir partenaire', 'programme partenaire', 'programme apporteur', 'recommander nopalou'],
    titre: 'Programme Apporteur d’affaires',
    reponse: 'Recommandez Nopalou aux commerçants et agences : vous touchez 20 % de commission récurrente chaque mois sur l’abonnement de chaque boutique recrutée, tant qu’elle reste active. Sans investissement.',
    actions: [{ label: 'Devenir apporteur', url: '/partenaires' }],
  },
  {
    motsCles: ['sama xaalis', 'sama kalpe', 'xaalis', 'mes depenses', 'suivre mes depenses', 'carnet de dettes', 'gerer mon budget', 'epargne'],
    titre: 'Sama Xaalis — mon argent',
    reponse: 'Sama Xaalis est votre carnet d’argent personnel : dépenses, entrées, dettes et épargne, avec saisie à la voix. Il se trouve dans votre compte.',
    actionLabel: 'Découvrir Sama Xaalis',
    actionUrl: '/sama-xaalis',
  },
  {
    motsCles: ['reseaux sociaux', 'facebook', 'instagram', 'tiktok', 'twitter', 'canal whatsapp', 'chaine whatsapp', 'suivre nopalou'],
    titre: 'Réseaux sociaux Nopalou',
    get reponse() {
      return `Suivez Nopalou pour les bons plans et les astuces commerçants : ${liensSociaux().map(([nom, url]) => `${nom} (${url})`).join(', ')}.`;
    },
    actions: [{ label: 'Canal WhatsApp', url: 'https://whatsapp.com/channel/0029Vb8fc4bBadmW40AFKx33' }],
  },
  {
    motsCles: ['c est quoi nopalou', 'qu est ce que nopalou', 'quest ce que nopalou', 'que fait nopalou', 'a quoi sert nopalou', 'qui etes vous', 'qui est nopalou', 'a propos', 'presentation de nopalou', 'pourquoi nopalou', 'comment ca marche', 'comment utiliser', 'mode d emploi', 'tutoriel', 'guide d utilisation', 'utiliser nopalou', 'comment fonctionne nopalou'],
    titre: 'Qu’est-ce que Nopalou ?',
    reponse: `Nopalou est une plateforme sénégalaise tout-en-un : comparateur de prix (marchands en ligne et boutiques locales), boutiques en ligne avec caisse tactile et paiements Wave / Orange Money, immobilier (annonces et agences), petites annonces, forfaits télécom, et Sama Xaalis, un carnet d’argent personnel. Service client : ${SUPPORT_TEL}.`,
    actions: [
      { label: 'Guide d’utilisation', url: '/guide-utilisation' },
      { label: 'Pourquoi Nopalou', url: '/pourquoi-nopalou' },
    ],
  },
];

// Minuscules, sans accents ni ponctuation, entourées d'espaces : « l'abonnement » devient « l abonnement ».
function nettoyerPourFAQ(s) {
  return ` ${normaliserTexte(s).replace(/[^a-z0-9]+/g, ' ').trim()} `;
}

const MOTS_VIDES = new Set(['le', 'la', 'les', 'l', 'un', 'une', 'des', 'du', 'de', 'd', 'mes', 'vos', 'nos', 'voir', 'sur', 'nopalou', 'svp', 'stp', 'merci', 'bonjour', 'salam']);

function scoreMotCle(texte, mot) {
  const m = nettoyerPourFAQ(mot).trim();
  if (!m) return 0;
  const present = m.length <= 3 ? texte.includes(` ${m} `) : texte.includes(m);
  return present ? m.length : 0;
}

/** Sujet de la FAQ qui correspond le mieux au message : le mot-clé trouvé le plus long l'emporte. */
function trouverFAQWeb(texte) {
  if (!texte || typeof texte !== 'string') return null;
  const t = nettoyerPourFAQ(texte);
  // Sans les petits mots (« voir les annonces » = « annonces ») : un mot-clé court doit être tout le message
  const resume = t.trim().split(' ').filter((m) => m && !MOTS_VIDES.has(m)).join(' ');
  let meilleure = null;
  let meilleurScore = 0;
  for (const f of FAQ_WEB) {
    let score = 0;
    for (const mot of f.motsCles || []) score = Math.max(score, scoreMotCle(t, mot));
    for (const mot of f.motsClesCourts || []) {
      if (nettoyerPourFAQ(mot).trim() === resume) score = Math.max(score, resume.length);
    }
    if (score > meilleurScore) { meilleure = f; meilleurScore = score; }
  }
  return meilleure;
}

function rechercherFAQWeb(texte) {
  return trouverFAQWeb(texte);
}

/** Boutons proposés par un sujet (nouveau format `actions`, ou ancien actionLabel/actionUrl). */
function actionsFAQ(f) {
  if (!f) return [];
  if (Array.isArray(f.actions)) return f.actions;
  return f.actionLabel && f.actionUrl ? [{ label: f.actionLabel, url: f.actionUrl }] : [];
}

module.exports = {
  normaliserTexte,
  getFAQWhatsApp,
  detecterFAQWhatsApp,
  FAQ_WEB,
  rechercherFAQWeb,
  trouverFAQWeb,
  actionsFAQ,
};
