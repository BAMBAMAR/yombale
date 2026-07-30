const COULEURS = {
  marine: '#1C2B4A',
  orange: '#C75B00',
  gris: '#64748B',
  grisClair: '#94A3B8',
  bordure: '#E2E8F0',
  fondClair: '#F8FAFC',
  vert: '#16a34a',
  whatsapp: '#25D366',
}

const TOTAL_PAGES = 13

async function getSettings() {
  const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
  let prixPro = 15000
  let prixBusiness = 35000
  let commissionBusiness = 2
  let tauxApporteur = 20
  try {
    const r = await fetch(`${BACKEND}/api/settings/public`, { cache: 'no-store' })
    if (r.ok) {
      const s = await r.json()
      prixPro = Number(s.plan_pro_prix) || 15000
      prixBusiness = Number(s.plan_business_prix) || 35000
      commissionBusiness = Number(s.commission_business) || 2
      tauxApporteur = Number(s.apporteur_taux_commission) || 20
    }
  } catch {
    // valeurs de repli
  }
  return { prixPro, prixBusiness, commissionBusiness, tauxApporteur }
}

function fcfa(n: number) {
  return `${n.toLocaleString('fr-FR')} FCFA`
}

const VERTICALES = [
  { emoji: '🖥️', titre: 'Caisse POS Magasin', detail: 'Caisse tactile magasin, 3 scanners (Caméra, Cloud Sync <100ms, Douchette USB), stickers codes-barres GS1 Modulo 10 et carnet de dettes client.' },
  { emoji: '📱', titre: 'Produits', detail: 'Comparez les prix de milliers de produits chez tous les marchands en ligne au Sénégal — téléphones, TV, électro, mode.' },
  { emoji: '🏠', titre: 'Immobilier', detail: 'Location et vente d\'appartements, villas, terrains — annonces vérifiées avec photos et prix.' },
  { emoji: '📶', titre: 'Télécom', detail: 'Comparez les forfaits Orange, Yas, Expresso, Promobile en un coup d\'œil.' },
  { emoji: '🛍️', titre: 'Boutiques & WhatsApp', detail: 'Les commerçants créent leur boutique et reçoivent leurs commandes directement sur WhatsApp.' },
]

const ETAPES_COMPTE = [
  { titre: 'Allez sur nopalou.com/inscription', detail: 'Depuis un téléphone ou un ordinateur, ouvrez la page d\'inscription du site.' },
  { titre: 'Remplissez le formulaire', detail: 'Nom complet, adresse email, mot de passe (8 caractères minimum, un indicateur de force s\'affiche), puis confirmez le mot de passe.' },
  { titre: 'Cliquez sur "Créer mon compte gratuitement"', detail: 'Le compte est créé instantanément — aucune carte bancaire, aucun frais.' },
  { titre: 'Vérifiez votre email', detail: 'Un lien de confirmation est envoyé automatiquement. Cliquer dessus débloque la publication d\'annonces (pas obligatoire pour créer une boutique).' },
]

const ETAPES_BOUTIQUE = [
  { titre: 'Depuis le compte, allez sur "Ma boutique"', detail: 'Rubrique accessible depuis le menu du compte, ou directement nopalou.com/boutique.' },
  { titre: 'Renseignez les informations de base', detail: 'Nom de la boutique, catégorie d\'activité, description, adresse et ville (Dakar par défaut).' },
  { titre: 'Ajoutez le code apporteur (si recommandé)', detail: 'Un champ "Code apporteur" est proposé à la création — il est pré-rempli automatiquement si le commerçant est passé par votre lien.' },
  { titre: 'Renseignez les coordonnées de contact', detail: 'Téléphone, WhatsApp, site web et réseaux sociaux (Facebook, Instagram) si disponibles.' },
  { titre: 'Ajoutez logo et bannière', detail: 'Deux images optionnelles mais recommandées pour donner confiance aux acheteurs.' },
  { titre: 'Activer la Caisse POS & Tester la Démo (nopalou.com/demo)', detail: 'Accès instantané à la caisse tactile, aux 3 scanners (Caméra, Cloud, USB) et au carnet de dettes.' },
]

const PALIERS = [
  {
    nom: 'Gratuit',
    prixLabel: '0 FCFA',
    couleur: COULEURS.gris,
    items: [
      'Page boutique visible sur /boutiques',
      'Coordonnées et lien WhatsApp affichés',
      'Jusqu\'à 2 annonces classées incluses',
    ],
  },
  {
    nom: 'Pro',
    prixLabel: null, // rempli dynamiquement
    couleur: COULEURS.orange,
    items: [
      'Placement prioritaire dans /boutiques',
      'Badge "Vendeur Pro" sur toutes vos annonces',
      'Caisse Enregistreuse POS Tactile (3 Scanners: Caméra, Cloud <100ms, USB)',
      'Carnet Dettes Client & Relance WhatsApp 1-Clic',
      'Impression Stickers Codes-Barres EAN-13 GS1 Modulo 10',
      'Catalogue produits avec photos et prix',
      '5 annonces classées incluses par mois',
      'Tableau de bord analytics & statistiques concurrents',
    ],
  },
  {
    nom: 'Business',
    prixLabel: null,
    couleur: COULEURS.marine,
    items: [
      'Tout ce qui est inclus dans Pro',
      'Caisse POS multi-caissiers & clôtures de caisse Z (sécurité PIN)',
      'URL dédiée nopalou.com/boutiques/votre-nom',
      '15 annonces classées incluses par mois',
      'Bannière mise en avant dans une page catégorie',
      'Support prioritaire par WhatsApp',
    ],
  },
]

const CHATBOT_FONCTIONS = [
  {
    groupe: '🔍 Recherche & comparaison',
    items: [
      { titre: 'Recherche unifiée', detail: 'Texte libre (ex: "iPhone 14") → renvoie en une seule requête les prix comparés du marketplace, les boutiques marchandes Nopalou, les annonces classifiées ou les biens immo correspondants, avec lien direct.' },
      { titre: 'Annonces immo', detail: 'Dernières annonces immobilières actives (appartements, villas, terrains), envoyées avec photo, prix et lien.' },
      { titre: 'Offres télécom', detail: 'Derniers forfaits Orange, Yas, Expresso, Promobile.' },
      { titre: 'Pagination des résultats', detail: 'Le client peut dire "plus" ou "encore" pour voir d\'autres résultats sans reformuler sa recherche.' },
    ],
  },
  {
    groupe: '🛍️ Boutiques & achat',
    items: [
      { titre: 'Parcourir une boutique', detail: 'Le client accède à une boutique précise via un lien direct partagé par le commerçant, ou parcourt par secteur/catégorie.' },
      { titre: 'Commander dans le chat', detail: 'Le client choisit ses produits, indique ses coordonnées et son mode de livraison/paiement, sans quitter WhatsApp — la commande arrive directement chez le commerçant.' },
      { titre: 'Panier multi-produits', detail: 'Depuis le catalogue WhatsApp d\'une boutique, le client compose un panier avec plusieurs articles et l\'envoie en une seule fois.' },
    ],
  },
  {
    groupe: '🔔 Alertes & suivi',
    items: [
      { titre: 'Alerte de prix', detail: 'L\'utilisateur indique un produit et un prix cible — notifié par WhatsApp dès que le seuil est atteint, sans compte requis.' },
      { titre: 'Suivi de commande', detail: 'Référence de commande (ex: PAY-12345) → statut et montant.' },
    ],
  },
  {
    groupe: '❓ FAQ & support',
    items: [
      { titre: 'Questions fréquentes automatiques', detail: 'Le bot répond seul aux questions courantes : gratuit/payant, publier une annonce/un bien immo, créer une boutique, comparer les prix, favoris, programme apporteur, forfaits télécom, guide général.' },
      { titre: 'Support', detail: 'Coordonnées de l\'équipe Nopalou en un message si aucune réponse automatique ne correspond.' },
    ],
  },
]

const ETAPES_WHATSAPP = [
  { titre: 'Enregistrez le numéro', detail: '+221 70 871 79 42 — ou cliquez directement sur wa.me/221708717942 depuis un téléphone.' },
  { titre: 'Envoyez "menu"', detail: 'Le bot répond immédiatement avec les options disponibles.' },
  { titre: 'Choisissez une option ou posez votre question', detail: 'Recherche produit, immo, télécom, alerte de prix, suivi de commande — ou tapez directement votre question en langage naturel.' },
]

const ETAPES_APPORTEUR = [
  { titre: 'Activez votre statut', detail: 'Rendez-vous sur nopalou.com/compte/apporteur et activez votre statut d\'apporteur en un clic.' },
  { titre: 'Récupérez votre lien', detail: 'Un code et un lien unique vous sont attribués automatiquement — aucune configuration nécessaire.' },
  { titre: 'Partagez-le', detail: 'Envoyez votre lien par WhatsApp, en personne ou sur les réseaux à un commerçant, une agence ou un vendeur de votre réseau.' },
  { titre: 'Suivez vos commissions', detail: 'Dès que votre contact passe en abonnement Pro ou Business payant, vous touchez une commission chaque mois, visible depuis votre espace apporteur.' },
]

function PagePiedString(page: number) {
  return `<div style="position:absolute; bottom:24px; left:0; right:0; display:flex; justify-content:space-between; padding:0 48px; font-size:11px; color:${COULEURS.grisClair};"><span>nopalou.com</span><span>${page} / ${TOTAL_PAGES}</span></div>`
}

function Titre(texte: string, sousTitre?: string) {
  return `
  <h1 style="font-size:26px; font-weight:900; color:${COULEURS.marine}; margin:0 0 6px;">${texte}</h1>
  ${sousTitre ? `<p style="font-size:13px; color:${COULEURS.gris}; margin:0 0 28px;">${sousTitre}</p>` : '<div style="margin-bottom:20px;"></div>'}
  `
}

function ListeEtapesNumerotees(etapes: { titre: string; detail: string }[], compact = false) {
  return `
  <div style="display:flex; flex-direction:column; gap:${compact ? 10 : 16}px;">
    ${etapes.map((e, i) => `
    <div style="display:flex; gap:16px; align-items:flex-start; border:1px solid ${COULEURS.bordure}; border-radius:10px; padding:${compact ? '12px 16px' : '16px 20px'}; background:${COULEURS.fondClair};">
      <span style="font-size:14px; font-weight:900; color:#fff; background:${COULEURS.orange}; border-radius:50%; width:${compact ? 26 : 30}px; height:${compact ? 26 : 30}px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">${i + 1}</span>
      <div>
        <p style="font-size:${compact ? 13 : 14}px; font-weight:700; color:${COULEURS.marine}; margin:0 0 3px;">${e.titre}</p>
        <p style="font-size:${compact ? 12 : 13}px; color:${COULEURS.gris}; margin:0; line-height:1.5;">${e.detail}</p>
      </div>
    </div>`).join('')}
  </div>
  `
}

export async function GET() {
  const { prixPro, prixBusiness, commissionBusiness, tauxApporteur } = await getSettings()

  const commissionPro = Math.round(prixPro * tauxApporteur / 100)
  const commissionBiz = Math.round(prixBusiness * tauxApporteur / 100)

  PALIERS[1].prixLabel = `${fcfa(prixPro)}/mois`
  PALIERS[2].prixLabel = `${fcfa(prixBusiness)}/mois`
  PALIERS[2].items = [
    'Tout ce qui est inclus dans Pro',
    `Seulement ${commissionBusiness}% de commission sur les ventes`,
    'URL dédiée nopalou.com/boutiques/votre-nom',
    '15 annonces classées incluses par mois',
    'Bannière mise en avant dans une page catégorie',
    'Support prioritaire par WhatsApp',
  ]

  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>Brochure apporteur d'affaires — Nopalou</title>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; font-family: system-ui, sans-serif; }
  .page {
    display: block;
    width: 210mm;
    height: 297mm;
    min-height: 297mm;
    max-height: 297mm;
    position: relative;
    overflow: hidden;
    page-break-after: always;
    page-break-before: always;
    page-break-inside: avoid;
    break-after: page;
    break-before: page;
    break-inside: avoid;
  }
  .page:first-of-type { page-break-before: auto; break-before: auto; }
  .page:last-of-type { page-break-after: auto; break-after: auto; }
</style>
</head>
<body>

<!-- PAGE 1 — Couverture -->
<div class="page" style="background: linear-gradient(160deg, ${COULEURS.marine} 0%, #0f1d35 60%, #1a1a2e 100%); display:flex; flex-direction:column; justify-content:center; align-items:center; color:#fff; padding: 60px;">
  <div style="position:absolute; right:-80px; top:-80px; width:360px; height:360px; border-radius:50%; background: radial-gradient(circle, rgba(199,91,0,0.3) 0%, transparent 70%);"></div>
  <div style="position:absolute; left:-60px; bottom:-60px; width:300px; height:300px; border-radius:50%; background: radial-gradient(circle, rgba(199,91,0,0.2) 0%, transparent 70%);"></div>
  <div style="display:flex; align-items:center; gap:16px; margin-bottom:56px;">
    <div style="width:64px; height:64px; border-radius:14px; background:${COULEURS.orange}; display:flex; align-items:center; justify-content:center; font-size:36px; font-weight:900; color:#fff;">N</div>
    <span style="font-size:40px; font-weight:900;">Nopa<span style="color:${COULEURS.orange};">lou</span></span>
  </div>
  <p style="font-size:44px; font-weight:900; text-align:center; margin:0 0 20px; max-width:600px; line-height:1.2;">Le guide complet pour présenter et utiliser Nopalou</p>
  <p style="font-size:20px; color:#CBD5E1; text-align:center; margin:0; max-width:520px; line-height:1.6;">Comparateur de prix, boutiques en ligne, assistant WhatsApp — et le programme apporteur d'affaires pour en vivre une commission.</p>
  <div style="margin-top:56px; background:${COULEURS.orange}; border-radius:16px; padding:16px 40px; font-size:20px; font-weight:800;">nopalou.com</div>
</div>

<!-- PAGE 2 — C'est quoi Nopalou -->
<div class="page" style="background:#fff; padding:56px 48px;">
  ${Titre('C\'est quoi Nopalou ?')}
  <p style="font-size:14px; color:${COULEURS.gris}; line-height:1.7; margin:0 0 28px; max-width:660px;">
    Nopalou est la plateforme sénégalaise qui compare les prix de milliers de produits, annonces immobilières et forfaits télécom au Sénégal — 100% gratuite pour les acheteurs, avec des boutiques en ligne pour les commerçants. L'objectif : aider chacun à mieux acheter, et aider chaque marchand à être visible auprès de clients déjà en recherche active.
  </p>
  <div style="display:flex; flex-direction:column; gap:12px;">
    ${VERTICALES.map(v => `
    <div style="display:flex; gap:16px; align-items:flex-start; border:1px solid ${COULEURS.bordure}; border-radius:10px; padding:14px 20px; background:${COULEURS.fondClair};">
      <span style="font-size:24px;">${v.emoji}</span>
      <div>
        <p style="font-size:14px; font-weight:700; color:${COULEURS.marine}; margin:0 0 3px;">${v.titre}</p>
        <p style="font-size:12px; color:${COULEURS.gris}; margin:0; line-height:1.5;">${v.detail}</p>
      </div>
    </div>`).join('')}
  </div>
  ${PagePiedString(2)}
</div>

<!-- PAGE 3 — Le comparateur intelligent -->
<div class="page" style="background:#fff; padding:56px 48px;">
  ${Titre('Le comparateur intelligent', 'Comment un visiteur trouve le meilleur prix en quelques clics')}
  <div style="display:flex; flex-direction:column; gap:14px; margin-bottom:24px;">
    <div style="border:1px solid ${COULEURS.bordure}; border-radius:10px; padding:16px 20px; background:${COULEURS.fondClair};">
      <p style="font-size:14px; font-weight:700; color:${COULEURS.marine}; margin:0 0 4px;">1. Recherche</p>
      <p style="font-size:13px; color:${COULEURS.gris}; margin:0; line-height:1.6;">Le visiteur tape ce qu'il cherche (ex: "iPhone 14") sur nopalou.com — il obtient la liste des produits correspondants, tous marchands confondus.</p>
    </div>
    <div style="border:1px solid ${COULEURS.bordure}; border-radius:10px; padding:16px 20px; background:${COULEURS.fondClair};">
      <p style="font-size:14px; font-weight:700; color:${COULEURS.marine}; margin:0 0 4px;">2. Fiche produit</p>
      <p style="font-size:13px; color:${COULEURS.gris}; margin:0; line-height:1.6;">Chaque fiche liste toutes les offres disponibles pour ce produit chez différents marchands, avec le prix de chacun affiché côte à côte.</p>
    </div>
    <div style="border:1px solid ${COULEURS.bordure}; border-radius:10px; padding:16px 20px; background:${COULEURS.fondClair};">
      <p style="font-size:14px; font-weight:700; color:${COULEURS.marine}; margin:0 0 4px;">3. Comparaison côte à côte</p>
      <p style="font-size:13px; color:${COULEURS.gris}; margin:0; line-height:1.6;">Le visiteur peut sélectionner jusqu'à 3 produits et ouvrir un tableau comparatif : badge "Meilleur prix", nombre de vendeurs, caractéristiques (stockage, couleur, état neuf/occasion), disponibilité en stock, top offres par marchand.</p>
    </div>
  </div>
  <h2 style="font-size:14px; font-weight:700; color:${COULEURS.marine}; margin:0 0 12px;">Pourquoi c'est un avantage pour un commerçant</h2>
  <p style="font-size:13px; color:${COULEURS.gris}; line-height:1.7; margin:0;">
    Un acheteur qui arrive sur Nopalou a déjà l'intention de comparer avant d'acheter — c'est une demande active, pas de la publicité froide. Un commerçant avec une boutique Nopalou apparaît directement dans ces résultats de comparaison, aux côtés des plus grands marchands du pays.
  </p>
  ${PagePiedString(3)}
</div>

<!-- PAGE 4 — Créer un compte -->
<div class="page" style="background:#fff; padding:56px 48px;">
  ${Titre('Créer un compte', 'Gratuit, en moins de 2 minutes — première étape avant de créer une boutique')}
  ${ListeEtapesNumerotees(ETAPES_COMPTE)}
  <div style="margin-top:20px; border:1px solid ${COULEURS.bordure}; border-radius:10px; padding:14px 20px; background:#FFF7ED;">
    <p style="font-size:12px; color:${COULEURS.marine}; margin:0; line-height:1.6;">
      💡 La vérification email n'est nécessaire que pour publier des <strong>annonces</strong> — créer une boutique ne l'exige pas.
    </p>
  </div>
  ${PagePiedString(4)}
</div>

<!-- PAGE 5 — Créer une boutique -->
<div class="page" style="background:#fff; padding:56px 48px;">
  ${Titre('Créer une boutique', 'Étape par étape, depuis un compte déjà créé')}
  ${ListeEtapesNumerotees(ETAPES_BOUTIQUE, true)}
  ${PagePiedString(5)}
</div>

<!-- PAGE 6 — Fonctionnalités par palier -->
<div class="page" style="background:#fff; padding:48px 44px;">
  ${Titre('Fonctionnalités boutique', 'Trois paliers, du gratuit au Business')}
  <div style="display:flex; flex-direction:column; gap:14px;">
    ${PALIERS.map(p => `
    <div style="border:1.5px solid ${p.couleur}; border-radius:10px; overflow:hidden;">
      <div style="background:${p.couleur}; padding:10px 18px; display:flex; justify-content:space-between; align-items:center;">
        <span style="font-size:14px; font-weight:800; color:#fff;">Boutique ${p.nom}</span>
        <span style="font-size:13px; font-weight:700; color:#fff;">${p.prixLabel}</span>
      </div>
      <div style="padding:14px 18px; display:flex; flex-direction:column; gap:6px;">
        ${p.items.map(it => `
        <div style="display:flex; gap:8px; align-items:flex-start;">
          <span style="color:${COULEURS.vert}; font-weight:900; font-size:12px;">✓</span>
          <span style="font-size:12px; color:${COULEURS.marine}; line-height:1.5;">${it}</span>
        </div>`).join('')}
      </div>
    </div>`).join('')}
  </div>
  ${PagePiedString(6)}
</div>

<!-- PAGE 7 — Assistant WhatsApp : comment l'utiliser -->
<div class="page" style="background:#fff; padding:56px 48px;">
  ${Titre('L\'assistant WhatsApp', 'Comparer, commander, suivre — sans quitter WhatsApp')}
  <div style="display:inline-flex; align-items:center; gap:8px; background:#f0fdf4; border:1.5px solid ${COULEURS.whatsapp}; border-radius:30px; padding:8px 18px; font-size:13px; color:${COULEURS.whatsapp}; font-weight:700; margin-bottom:24px;">
    💬 100% gratuit · Disponible 24h/24 · Aucune app à installer
  </div>
  <h2 style="font-size:14px; font-weight:700; color:${COULEURS.marine}; margin:0 0 12px;">Comment s'en servir</h2>
  ${ListeEtapesNumerotees(ETAPES_WHATSAPP, true)}
  <div style="margin-top:20px; background:${COULEURS.whatsapp}; border-radius:12px; padding:16px 24px; text-align:center;">
    <p style="font-size:16px; font-weight:800; color:#fff; margin:0;">📲 wa.me/221708717942</p>
    <p style="font-size:12px; color:#dcfce7; margin:4px 0 0;">+221 70 871 79 42</p>
  </div>
  ${PagePiedString(7)}
</div>

<!-- PAGE 8 — Assistant WhatsApp : fonctionnalités -->
<div class="page" style="background:#fff; padding:44px 44px;">
  ${Titre('Tout ce que le chatbot sait faire')}
  <div style="display:flex; flex-direction:column; gap:16px;">
    ${CHATBOT_FONCTIONS.map(groupe => `
    <div>
      <h3 style="font-size:13px; font-weight:800; color:${COULEURS.whatsapp}; margin:0 0 8px;">${groupe.groupe}</h3>
      <div style="display:flex; flex-direction:column; gap:6px;">
        ${groupe.items.map(f => `
        <div style="border:1px solid ${COULEURS.bordure}; border-radius:8px; padding:8px 14px; background:${COULEURS.fondClair};">
          <p style="font-size:11.5px; font-weight:700; color:${COULEURS.marine}; margin:0 0 2px;">${f.titre}</p>
          <p style="font-size:11px; color:${COULEURS.gris}; margin:0; line-height:1.4;">${f.detail}</p>
        </div>`).join('')}
      </div>
    </div>`).join('')}
  </div>
  ${PagePiedString(8)}
</div>

<!-- PAGE 9 — Immobilier et annonces -->
<div class="page" style="background:#fff; padding:56px 48px;">
  ${Titre('Immobilier & annonces classifiées')}
  <div style="display:flex; flex-direction:column; gap:14px;">
    <div style="display:flex; gap:16px; align-items:flex-start; border:1px solid ${COULEURS.bordure}; border-radius:10px; padding:18px 22px; background:${COULEURS.fondClair};">
      <span style="font-size:26px;">🏠</span>
      <div>
        <p style="font-size:15px; font-weight:700; color:${COULEURS.marine}; margin:0 0 6px;">Immobilier</p>
        <p style="font-size:13px; color:${COULEURS.gris}; margin:0; line-height:1.6;">Location et vente d'appartements, villas, studios, terrains à Dakar et ailleurs au Sénégal. Chaque annonce affiche photos, prix, superficie et coordonnées du propriétaire ou de l'agence. Une agence immobilière peut publier via son compte, avec la même visibilité que sur les grands sites immo du pays.</p>
      </div>
    </div>
    <div style="display:flex; gap:16px; align-items:flex-start; border:1px solid ${COULEURS.bordure}; border-radius:10px; padding:18px 22px; background:${COULEURS.fondClair};">
      <span style="font-size:26px;">📋</span>
      <div>
        <p style="font-size:15px; font-weight:700; color:${COULEURS.marine}; margin:0 0 6px;">Annonces classifiées</p>
        <p style="font-size:13px; color:${COULEURS.gris}; margin:0; line-height:1.6;">Vente entre particuliers ou petits commerçants — véhicules, meubles, équipements électroniques. Publication rapide depuis le compte, avec vérification email obligatoire pour éviter les faux profils.</p>
      </div>
    </div>
    <div style="display:flex; gap:16px; align-items:flex-start; border:1px solid ${COULEURS.bordure}; border-radius:10px; padding:18px 22px; background:${COULEURS.fondClair};">
      <span style="font-size:26px;">📶</span>
      <div>
        <p style="font-size:15px; font-weight:700; color:${COULEURS.marine}; margin:0 0 6px;">Forfaits télécom</p>
        <p style="font-size:13px; color:${COULEURS.gris}; margin:0; line-height:1.6;">Comparaison des forfaits Orange, Yas, Expresso et ProMobile — utile pour un visiteur qui veut changer d'offre sans faire le tour de chaque opérateur.</p>
      </div>
    </div>
  </div>
  ${PagePiedString(9)}
</div>

<!-- PAGE 10 — Le programme apporteur -->
<div class="page" style="background:#fff; padding:56px 48px;">
  ${Titre('Le programme apporteur d\'affaires')}
  <div style="display:inline-block; background:#FFF7ED; border:1.5px solid ${COULEURS.orange}; border-radius:30px; padding:8px 20px; font-size:14px; color:${COULEURS.orange}; font-weight:700; margin-bottom:24px;">
    ${tauxApporteur}% de commission récurrente
  </div>
  <table style="width:100%; border-collapse:collapse; font-size:13px; margin-bottom:24px;">
    <thead>
      <tr style="background:${COULEURS.fondClair}; border-bottom:2px solid ${COULEURS.bordure};">
        <th style="padding:10px 14px; text-align:left; color:${COULEURS.gris}; font-weight:700;">Formule recrutée</th>
        <th style="padding:10px 14px; text-align:left; color:${COULEURS.gris}; font-weight:700;">Prix</th>
        <th style="padding:10px 14px; text-align:left; color:${COULEURS.gris}; font-weight:700;">Votre commission</th>
      </tr>
    </thead>
    <tbody>
      <tr style="border-bottom:1px solid #F1F5F9;">
        <td style="padding:12px 14px; font-weight:700; color:${COULEURS.marine};">Boutique Pro</td>
        <td style="padding:12px 14px; color:${COULEURS.gris};">${fcfa(prixPro)}/mois</td>
        <td style="padding:12px 14px; color:${COULEURS.orange}; font-weight:700;">${fcfa(commissionPro)}/mois</td>
      </tr>
      <tr style="border-bottom:1px solid #F1F5F9;">
        <td style="padding:12px 14px; font-weight:700; color:${COULEURS.marine};">Boutique Business</td>
        <td style="padding:12px 14px; color:${COULEURS.gris};">${fcfa(prixBusiness)}/mois</td>
        <td style="padding:12px 14px; color:${COULEURS.orange}; font-weight:700;">${fcfa(commissionBiz)}/mois</td>
      </tr>
    </tbody>
  </table>
  <h2 style="font-size:14px; font-weight:700; color:${COULEURS.marine}; margin:0 0 10px;">Quoi dire à un commerçant</h2>
  <div style="border:1px solid ${COULEURS.bordure}; border-radius:10px; padding:16px 20px; background:${COULEURS.fondClair};">
    <p style="font-size:13px; color:${COULEURS.marine}; margin:0; line-height:1.7;">
      « Je te recommande Nopalou — ça te donne une Caisse Tactile POS complète pour ton magasin (avec 3 scanners, carnet de dettes et relance WhatsApp 1-clic) ainsi qu'une boutique en ligne pour recevoir tes commandes directement sur WhatsApp. Le premier mois est gratuit ! Tu peux aussi tester la démo en 1 clic sur nopalou.com/demo. »
    </p>
  </div>
  ${PagePiedString(10)}
</div>

<!-- PAGE 11 — Comment fonctionne le programme -->
<div class="page" style="background:#fff; padding:56px 48px;">
  ${Titre('Comment fonctionne votre commission')}
  <div style="display:flex; flex-direction:column; gap:16px;">
    <div style="border:1px solid ${COULEURS.bordure}; border-radius:10px; padding:18px 22px; background:${COULEURS.fondClair};">
      <p style="font-size:14px; font-weight:700; color:${COULEURS.marine}; margin:0 0 6px;">Récurrente, pas ponctuelle</p>
      <p style="font-size:13px; color:${COULEURS.gris}; margin:0; line-height:1.6;">Votre commission n'est pas versée une seule fois — elle est due chaque mois tant que le commerçant que vous avez recruté reste abonné à un plan Pro ou Business. Un seul recrutement peut donc générer un revenu sur la durée.</p>
    </div>
    <div style="border:1px solid ${COULEURS.bordure}; border-radius:10px; padding:18px 22px; background:${COULEURS.fondClair};">
      <p style="font-size:14px; font-weight:700; color:${COULEURS.marine}; margin:0 0 6px;">Attribution automatique</p>
      <p style="font-size:13px; color:${COULEURS.gris}; margin:0; line-height:1.6;">Dès que votre contact crée sa boutique via votre lien (ou saisit votre code apporteur), la boutique est liée à votre compte — vous n'avez rien à faire de plus pour que la commission soit calculée automatiquement à chaque paiement.</p>
    </div>
    <div style="border:1px solid ${COULEURS.bordure}; border-radius:10px; padding:18px 22px; background:${COULEURS.fondClair};">
      <p style="font-size:14px; font-weight:700; color:${COULEURS.marine}; margin:0 0 6px;">Paiement</p>
      <p style="font-size:13px; color:${COULEURS.gris}; margin:0; line-height:1.6;">Réglé par Wave ou Orange Money une fois le montant cumulé atteint le seuil minimum, visible à tout moment depuis votre espace apporteur (nopalou.com/compte/apporteur).</p>
    </div>
    <div style="border:1px solid ${COULEURS.bordure}; border-radius:10px; padding:18px 22px; background:${COULEURS.fondClair};">
      <p style="font-size:14px; font-weight:700; color:${COULEURS.marine}; margin:0 0 6px;">Sans limite</p>
      <p style="font-size:13px; color:${COULEURS.gris}; margin:0; line-height:1.6;">Aucun plafond sur le nombre de commerçants que vous pouvez recruter — plus vous en recrutez, plus vos commissions mensuelles cumulées augmentent.</p>
    </div>
  </div>
  ${PagePiedString(11)}
</div>

<!-- PAGE 12 — Guide pratique de démarrage -->
<div class="page" style="background:#fff; padding:56px 48px;">
  ${Titre('Démarrez en 4 étapes', 'Ce guide est pour vous, l\'apporteur')}
  ${ListeEtapesNumerotees(ETAPES_APPORTEUR)}
  ${PagePiedString(12)}
</div>

<!-- PAGE 13 — Contact -->
<div class="page" style="background: linear-gradient(160deg, ${COULEURS.marine} 0%, #0f1d35 60%, #1a1a2e 100%); display:flex; flex-direction:column; justify-content:center; align-items:center; color:#fff; padding:60px;">
  <p style="font-size:32px; font-weight:900; text-align:center; margin:0 0 20px;">Prêt à commencer ?</p>
  <p style="font-size:16px; color:#CBD5E1; text-align:center; margin:0 0 40px; max-width:480px; line-height:1.7;">
    Aucun investissement · Paiement mensuel · Sans limite de recrutement
  </p>
  <div style="background:${COULEURS.orange}; border-radius:16px; padding:18px 44px; font-size:22px; font-weight:800; margin-bottom:20px;">
    nopalou.com/compte/apporteur
  </div>
  <p style="font-size:14px; color:${COULEURS.grisClair}; margin:0 0 8px;">💬 Assistant WhatsApp officiel Nopalou</p>
  <p style="font-size:14px; color:#fff; margin:0;">wa.me/221708717942</p>
  ${PagePiedString(13)}
</div>

</body>
</html>`

  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
