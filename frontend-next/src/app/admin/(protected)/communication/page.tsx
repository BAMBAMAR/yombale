import { cookies } from 'next/headers'
import KitComClient from './KitComClient'

export const metadata = { title: 'Kit communication — Admin Nopalou' }

const VISUELS = [
  {
    titre: '⭐ Poster Écosystème Global (Tout-en-Un)',
    desc: '1200 × 1600 px HD — Visuel maître regroupant TOUTES les fonctionnalités (Acheteur, Caisse POS 3 Scanners, EAN-13, Dettes Client, Chatbot Meta, Commission 20%)',
    url: '/assets/poster-ecosysteme',
    usage: 'Master Marketing · Présentation Globale',
  },
  {
    titre: '🛒 Visuel Dédié Pilier 1 : Acheteur & Consommateur',
    desc: '1080 × 1350 px HD — Super-Comparateur Multi-Marchands, Chatbot WhatsApp Meta 24/7, Alertes Prix & Immo, Comparatif Côte-à-Côte',
    url: '/assets/pilier-acheteur',
    usage: 'Acheteurs · Comparateur',
  },
  {
    titre: '🏪 Visuel Dédié Pilier 2 : Marchand & Caisse POS Magasin',
    desc: '1080 × 1350 px HD — Caisse Enregistreuse POS Tactile, 3 Scanners (Caméra, Cloud <100ms, USB), Stickers EAN-13, Carnet Dettes WhatsApp 1-Clic, Multi-Caissiers PIN',
    url: '/assets/pilier-marchand',
    usage: 'Marchands · Solution POS Magasin',
  },
  {
    titre: '💼 Visuel Dédié Pilier 3 : Apporteur d\'Affaires & Parrainage 20%',
    desc: '1080 × 1350 px HD — Commissions Récurrentes 20% mensuelles à vie (Wave/OM), Brochure PDF 13 Pages, 0 FCFA d\'investissement',
    url: '/assets/pilier-apporteur',
    usage: 'Recrutement Apporteurs 20%',
  },
  {
    titre: '💬 Visuel Dédié Écosystème WhatsApp Meta 24/7 (Tout-en-Un)',
    desc: '1080 × 1350 px HD — 4 Fonctions WhatsApp : Assistant IA Acheteur, Panier & Commande 1-Clic, Carnet Dettes POS Client WA, Notifications Ventes Marchands',
    url: '/assets/chatbot-whatsapp',
    usage: 'WhatsApp Meta · Acheteurs & Marchands',
  },
  {
    titre: 'Photo de couverture Facebook',
    desc: '1640 × 624 px — À uploader sur votre Page Facebook',
    url: '/assets/cover-facebook',
    usage: 'Facebook',
  },
  {
    titre: 'Post Instagram (carré)',
    desc: '1080 × 1080 px — Post de lancement pour Instagram',
    url: '/assets/post-instagram',
    usage: 'Instagram',
  },
  {
    titre: 'Story Instagram / TikTok',
    desc: '1080 × 1920 px — Format vertical stories et TikTok',
    url: '/assets/story-instagram',
    usage: 'Instagram · TikTok',
  },
  {
    titre: 'Logo fond blanc',
    desc: '800 × 800 px — Pour documents, présentations, presse',
    url: '/assets/logo-blanc',
    usage: 'Universel',
  },
  {
    titre: 'Logo fond sombre',
    desc: '800 × 800 px — Pour réseaux sociaux, fonds sombres',
    url: '/assets/logo-sombre',
    usage: 'Réseaux sociaux',
  },
  {
    titre: 'Bannière hero (desktop)',
    desc: '1920 × 600 px — Bannière page d\'accueil du site',
    url: '/assets/banniere-hero',
    usage: 'Site web',
  },
  {
    titre: 'Bannière hero (mobile)',
    desc: '750 × 1000 px — Version mobile de la bannière d\'accueil',
    url: '/assets/banniere-hero-mobile',
    usage: 'Site web mobile',
  },
  {
    titre: 'Flyer démarchage terrain A5',
    desc: '1240 × 1748 px (A5, 150 dpi) — À imprimer et laisser chez les commerçants démarchés',
    url: '/assets/flyer-demarchage',
    usage: 'Démarchage terrain',
  },
  {
    titre: 'Visuel programme apporteur d\'affaires',
    desc: '1080 × 1080 px — Post pour recruter des apporteurs dans votre réseau',
    url: '/assets/apporteur-affaires',
    usage: 'Recrutement apporteurs',
  },
  {
    titre: 'Carte de visite numérique',
    desc: '1050 × 600 px — À partager par WhatsApp lors du démarchage',
    url: '/assets/carte-visite',
    usage: 'WhatsApp',
  },
]

const TEXTES = [
  {
    reseau: 'Facebook Page Officielle',
    emoji: '📘',
    nom: 'Nopalou — Comparateur de prix Sénégal',
    categorie: 'Site web · Technologie',
    bio: 'Comparez les prix de milliers de produits chez tous les marchands en ligne au Sénégal. Téléphones, TV, électro, mode, immobilier et plus — toujours le meilleur prix à Dakar.',
    site: 'https://www.facebook.com/profile.php?id=61591675701726',
    hashtags: '#Nopalou #Sénégal #Dakar #PrixMoinsCher #Shopping #Comparateur',
  },
  {
    reseau: 'Instagram Officiel',
    emoji: '📸',
    nom: '@nopalousn',
    categorie: 'Compte professionnel · Shopping & Retail',
    bio: '🛒 Comparateur de prix N°1 au Sénégal\n📱 Téléphones · TV · Électro · Immo\n💰 Économisez jusqu\'à 40% à Dakar\n👇 Comparez sur nopalou.com',
    site: 'https://www.instagram.com/nopalousn/',
    hashtags: '#Nopalou #Dakar #Sénégal #BonPlan #PrixMoinsCher #Shopping #Tech',
  },
  {
    reseau: 'TikTok Officiel',
    emoji: '🎵',
    nom: '@nopalou.com',
    categorie: 'Compte professionnel · Créateur de contenu',
    bio: '🛒 Comparateur de prix N°1 au Sénégal 🇸🇳\n💰 Trouvez le prix le moins cher à Dakar en 1-clic !\n📲 nopalou.com',
    site: 'https://www.tiktok.com/@nopalou.com?_r=1&_t=ZS-98f75NgDJNS',
    hashtags: '#Nopalou #Dakar #Sénégal #BonPlan #PrixMoinsCher #shopping #fyp #senegal',
  },
  {
    reseau: 'Canal WhatsApp Officiel',
    emoji: '📢',
    nom: 'Nopalou — Bons plans du jour',
    categorie: 'Canal de diffusion officiel',
    bio: 'Les meilleurs prix et baisses du jour au Sénégal 🇸🇳\nMis à jour chaque matin.\nComparez sur nopalou.com',
    site: 'https://whatsapp.com/channel/0029Vb8fc4bBadmW40AFKx33',
    hashtags: '',
  },
  {
    reseau: 'Twitter / X Officiel',
    emoji: '𝕏',
    nom: '@nopalou_sn',
    categorie: 'Compte officiel',
    bio: '⚡ Comparateur de prix N°1 au Sénégal. Produits, Immobilier, Télécom. Économisez sur vos achats à Dakar !',
    site: 'https://twitter.com/nopalou_sn',
    hashtags: '#Nopalou #Sénégal #Dakar',
  },
]

const POST_TEMPLATES = [
  {
    titre: '⚡ Post Création de Boutique 100% WhatsApp en 30s (Zéro PC)',
    texte: `🚀 Ouvrez votre boutique en ligne sur WhatsApp en 30 secondes chrono ! 🇸🇳

Pas besoin d'ordinateur ni de compétences techniques. Sur Nopalou, tout se fait par message :

1️⃣ Envoyez « creer boutique » sur notre WhatsApp officiel (+221 70 871 79 42)
2️⃣ Donnez le nom de votre commerce, votre catégorie et votre ville
3️⃣ Ajoutez vos articles en envoyant simplement la photo et le prix !

✅ Paiements directs Wave & Orange Money (0% commission)
✅ Demandez votre bilan du jour par message : tapez « Bilan » et recevez vos ventes en direct !
🎁 1er mois 100% OFFERT sans aucun engagement !

👉 Lancez-vous gratuitement sur nopalou.com/creer-boutique ou écrivez-nous sur WhatsApp !

#Nopalou #CommerceSenegal #WhatsAppCommerce #Dakar #VendreEnLigne #Wave`,
  },
  {
    titre: '📦 Post Migration 1-Clic depuis Shopify, WooCommerce & Excel',
    texte: `⚡ Quittez Shopify et les frais en dollars sans perdre vos produits !

Commerçants à Dakar : importez l'intégralité de votre catalogue sur Nopalou en 1 seul clic :

🛍️ Compatible avec les exports Shopify, WooCommerce, PrestaShop et fichiers Excel/CSV
✨ Reconnaissance automatique de vos titres, prix, stocks et photos
📒 Import direct de vos clients et carnet de dettes
🌊 Encaissements locaux en FCFA via Wave & Orange Money sans frais de passerelle

👉 Testez l'import gratuit sur nopalou.com/tarifs-boutique (1 mois offert)

#Nopalou #AlternativeShopify #EcommerceDakar #MigrationBoutique #Senegal`,
  },
  {
    titre: '🎉 Post de Lancement Global Nopalou',
    texte: `🎉 Nopalou est arrivé au Sénégal !

Vous en avez assez de payer trop cher ? Nopalou compare les prix de milliers de produits chez tous les marchands en ligne et boutiques de Dakar.

📱 Téléphones, 💻 Informatique, 📺 TV & Électro, 👗 Mode, 🏠 Immobilier

✅ 3 000+ produits indexés avec mises à jour toutes les 6 heures
✅ Caisse POS Enregistreuse Tactile pour Marchands (3 Scanners & Dettes Client)
✅ Assistant Chatbot WhatsApp Meta 24h/24 (+221 70 871 79 42)
✅ 100% gratuit pour les acheteurs

👉 Comparez maintenant sur nopalou.com
👉 Suivez notre Canal WhatsApp : https://whatsapp.com/channel/0029Vb8fc4bBadmW40AFKx33
👉 Suivez-nous sur TikTok : https://www.tiktok.com/@nopalou.com?_r=1&_t=ZS-98f75NgDJNS

#Nopalou #Sénégal #Dakar #PrixMoinsCher #Shopping #BonPlan #fyp`,
  },
  {
    titre: '🏪 Post Caisse Enregistreuse POS Tactile (Pour Marchands)',
    texte: `⚡ Digitalisez votre magasin avec la Caisse POS Nopalou !

Vous gérez une boutique à Dakar ? Nopalou vous offre la Caisse Enregistreuse Tactile avec :

🖥️ 3 Scanners inclus (Caméra Smartphone, Cloud Sync <100ms, Douchette USB)
📓 Carnet de Dettes Client & Relance WhatsApp 1-Clic avec solde exact
👥 Multi-Caissiers sécurisés par code PIN & Clôtures de Caisse Z
🏷️ Stickers & Codes-Barres EAN-13 GS1 Modulo 10

👉 30 jours d'essai gratuit sans engagement !
👉 Démo et création sur nopalou.com/boutique

#NopalouPOS #MarchandDakar #CaisseEnregistreuse #CommerceSenegal #Dakar`,
  },
  {
    titre: '💬 Post Connexion WhatsApp 1-Clic (Certifiée Meta)',
    texte: `⚡ Connectez-vous à Nopalou en 1 clic via WhatsApp !

Plus besoin de retenir un mot de passe ! Nopalou intègre la connexion certifiée par Meta :

🔐 Saisissez votre numéro WhatsApp
📲 Recevez votre code sécurisé avec bouton natif "Copier le code"
✅ Vous êtes connecté en 3 secondes !

Simple, ultra-sécurisé et instantané.

👉 Essayez maintenant sur nopalou.com/connexion

#Nopalou #WhatsAppAuth #Meta #Innovation #Dakar #Sénégal #Sécurité`,
  },
  {
    titre: '🧾 Post Facturation & Devis OHADA (Pour PME & Marchands)',
    texte: `⚡ Émettez vos Factures & Devis aux normes OHADA en 1 clic !

Commerçants, prestataires et PME à Dakar : simplifiez votre gestion avec Nopalou :

📄 Factures Proforma, Devis & Factures Définitives en PDF professionnel
⚖️ Mentions légales sénégalaises conformes (NINEA, RCCM, TVA & Timbre fiscal)
🔄 Conversion immédiate de Devis en Facture après encaissement
📱 Envoi instantané du PDF par WhatsApp ou E-mail au client

👉 1er mois d'essai 100% gratuit sans engagement !
👉 Créez votre compte sur nopalou.com/boutique

#Nopalou #FacturationOHADA #PMEsenegal #Comptabilite #Dakar #Entreprendre`,
  },
  {
    titre: '📶 Post Comparatif Forfaits Télécom (Orange, Yas, Expresso, Promobile)',
    texte: `📡 Quel est le Pass Internet le moins cher du Sénégal ?

Ne payez plus vos données au hasard ! Nopalou compare en direct tous les forfaits et pass internet à Dakar :

🍊 Orange (Pass Illimix, Max, Fiber)
🟡 Yas ex-Free (Pass 4G+, Voix & Roaming)
🔴 Expresso (Pass Chrono & Data)
🟢 Promobile (Forfaits hybrides)

💡 Utilisez notre Guide de scoring interactif pour trouver le meilleur Pass au Go le moins cher !

👉 Comparez maintenant sur nopalou.com/telecom ou nopalou.com/guide-forfait

#Nopalou #ForfaitInternet #PassOrange #YasSenegal #Expresso #Dakar #BonPlan`,
  },
  {
    titre: '📶 Post Caisse POS Mode PWA Hors-Ligne (Zéro Coupure)',
    texte: `⚡ Coupure d'Internet à Dakar ? Votre Caisse POS continue d'encaisser !

Avec la Caisse Tactile Nopalou (PWA Offline First) :
🛒 Vos ventes comptoir et scans de codes-barres fonctionnent sans Internet
💾 Toutes les données restent sauvegardées en sécurité sur votre appareil
🔄 Synchronisation automatique dès que la 4G ou le Wi-Fi revient

👉 Idéal pour les boutiques, magasins et superettes à Dakar et en région.
👉 Testez la démo sur nopalou.com/demo

#NopalouPOS #CaisseEnregistreuse #PWA #CommerceSenegal #Dakar`,
  },
  {
    titre: '🔥 Post Bon Plan Produit & Vente Flash (Template)',
    texte: `🔥 BON PLAN DU JOUR À DAKAR

📱 [Nom du Produit] — [Prix] FCFA chez [Nom Boutique]
(Ancien prix : [Prix Barré] FCFA — Économie : [Différence] FCFA 💰)

🛒 Commandez directement sur WhatsApp ou comparez tous les prix sur nopalou.com !

👉 Voir l'offre sur nopalou.com
👉 Suivez notre Canal WhatsApp pour ne rater aucun bon plan : https://whatsapp.com/channel/0029Vb8fc4bBadmW40AFKx33

#Nopalou #BonPlan #Dakar #Sénégal #PrixMoinsCher #VenteFlash`,
  },
]

export default async function CommunicationPage() {
  const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
  const jar    = await cookies()
  const secret = jar.get('nopalou_admin')?.value ?? ''

  let prixDecouverte = 2500
  let prixPro = 5000
  let prixBusiness = 10000
  let commissionBusiness = 2
  let tauxApporteur = 20

  try {
    const r = await fetch(`${BACKEND}/api/settings`, { headers: { 'X-Admin-Secret': secret }, cache: 'no-store' })
    if (r.ok) {
      const s = await r.json()
      prixDecouverte = Number(s.plan_decouverte_prix) || 2500
      prixPro = Number(s.plan_pro_prix) || 5000
      prixBusiness = Number(s.plan_business_prix) || 10000
      commissionBusiness = Number(s.commission_business) || 2
      tauxApporteur = Number(s.apporteur_taux_commission) || 20
    }
  } catch {
    // fallback aux valeurs par défaut
  }

  return (
    <KitComClient
      visuels={VISUELS}
      textes={TEXTES}
      postTemplates={POST_TEMPLATES}
      prixDecouverte={prixDecouverte}
      prixPro={prixPro}
      prixBusiness={prixBusiness}
      commissionBusiness={commissionBusiness}
      tauxApporteur={tauxApporteur}
    />
  )
}
