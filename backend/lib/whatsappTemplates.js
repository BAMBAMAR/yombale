// backend/lib/whatsappTemplates.js
// Gestionnaire centralisé des templates WhatsApp avec variables dynamiques

const cfg = require('./settingsCache');

const TEMPLATE_DEFINITIONS = [
  {
    key: 'whatsapp_tpl_onboarding_j1',
    label: 'Onboarding J+1 (Partage Vitrine WhatsApp)',
    categorie: 'onboarding',
    description: 'Envoyé 24h après la création d\'une boutique pour inciter au partage en statut WhatsApp.',
    variables: ['prenom', 'boutique_nom', 'slug', 'lien_boutique'],
    defaultText: `Salam {boutique_nom} ! 🎉 Félicitations pour votre 1er jour sur Nopalou.\n\n💡 *Astuce N°1 pour faire votre première vente aujourd'hui :*\nPartagez le lien de votre vitrine dans votre statut WhatsApp :\n👉 {lien_boutique}\n\nVos clients pourront voir l'ensemble de vos articles et commander directement en 1 clic.\n\n_Pour ne plus recevoir de rappel, répondez simplement STOP._`,
  },
  {
    key: 'whatsapp_tpl_onboarding_j7',
    label: 'Onboarding J+7 (Encaissement Wave & Commandes)',
    categorie: 'onboarding',
    description: 'Envoyé à J+7 pour présenter l\'encaissement Wave et les commandes directes.',
    variables: ['prenom', 'boutique_nom', 'lien_boutique'],
    defaultText: `Salam {boutique_nom} ! 🚀 Déjà 1 semaine sur Nopalou.\n\nSaviez-vous que vos clients peuvent payer directement par Wave ou Orange Money sur votre vitrine ?\n\n👉 Accédez à votre boutique : {lien_boutique}\n\nBesoin d'aide pour ajouter vos articles ? Répondez directement à ce message !`,
  },
  {
    key: 'whatsapp_tpl_onboarding_j25',
    label: 'Onboarding J+25 (Rappel Fin de Période d\'Essai)',
    categorie: 'onboarding',
    description: 'Envoyé à J+25 pour rappeler la fin du mois offert et inviter au renouvellement.',
    variables: ['prenom', 'boutique_nom', 'lien_abonnement'],
    defaultText: `Salam {boutique_nom} ! 🎁 Votre premier mois offert sur Nopalou se termine dans 5 jours.\n\nPour continuer à recevoir vos commandes sans interruption et conserver votre badge vérifié :\n👉 {lien_abonnement}\n\nMerci de votre confiance ! 🇸🇳`,
  },
  {
    key: 'whatsapp_tpl_relance_carnet',
    label: 'Relance Carnet de Dettes Client (Échéance Dépassée)',
    categorie: 'dettes',
    description: 'Envoyé aux clients ayant une dette échue enregistrée dans le carnet.',
    variables: ['client_nom', 'boutique_nom', 'montant', 'date_echeance', 'boutique_tel'],
    defaultText: `Bonjour {client_nom},\n\nSauf erreur de notre part, votre solde de {montant} FCFA auprès de la boutique *{boutique_nom}* est arrivé à échéance le {date_echeance}.\n\nMerci de vous rapprocher de la boutique ({boutique_tel}) pour régulariser votre compte.\n\nCordialement,\n*{boutique_nom}*`,
  },
  {
    key: 'whatsapp_tpl_relance_catalogue',
    label: 'Relance Boutique 0 Produit',
    categorie: 'catalogue',
    description: 'Envoyé aux gérants de boutiques n\'ayant pas encore ajouté de produit.',
    variables: ['boutique_nom', 'lien_ajout_produit'],
    defaultText: `Salam {boutique_nom} ! 🛍️ Votre boutique est en ligne mais elle ne contient aucun article.\n\nAjoutez votre premier produit en 30 secondes pour commencer à vendre :\n👉 {lien_ajout_produit}\n\nL'équipe Nopalou est là pour vous aider !`,
  },
  {
    key: 'whatsapp_tpl_commande_nouvelle',
    label: 'Notification Nouvelle Commande au Marchand',
    categorie: 'commandes',
    description: 'Envoyé au commerçant dès qu\'un client passe une commande sur sa boutique.',
    variables: ['boutique_nom', 'nom_produit', 'quantite', 'montant', 'client_nom', 'client_telephone', 'client_adresse'],
    defaultText: `🎉 *Nouvelle Commande Nopalou !*\n\nBoutique : {boutique_nom}\nArticle : {nom_produit} (x{quantite})\nTotal : {montant} FCFA\n\n👤 *Client :*\nNom : {client_nom}\nTél : {client_telephone}\nAdresse : {client_adresse}\n\nContactez votre client sans attendre pour convenir de la livraison !`,
  },
];

async function getTemplateText(key) {
  const custom = await cfg.get(key);
  if (custom && custom.trim()) return custom;
  const def = TEMPLATE_DEFINITIONS.find(t => t.key === key);
  return def ? def.defaultText : '';
}

async function renderTemplate(key, vars = {}) {
  let text = await getTemplateText(key);
  for (const [k, v] of Object.entries(vars)) {
    const reg = new RegExp(`\\{${k}\\}`, 'g');
    text = text.replace(reg, String(v ?? ''));
  }
  return text;
}

module.exports = {
  TEMPLATE_DEFINITIONS,
  getTemplateText,
  renderTemplate,
};
