import { cookies } from 'next/headers'
import { PALIERS_BOUTIQUE } from '@/lib/fonctionnalites-data'

export const metadata = { title: 'Kit communication — Admin Nopalou' }

const VISUELS = [
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
    titre: 'Flyer démarchage terrain',
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
    titre: 'Visuel assistant WhatsApp',
    desc: '1080 × 1080 px — Post pour annoncer le chatbot WhatsApp',
    url: '/assets/chatbot-whatsapp',
    usage: 'Lancement chatbot',
  },
  {
    titre: 'Carte de visite numérique',
    desc: '1050 × 600 px — À partager par WhatsApp lors du démarchage (QR code à ajouter manuellement)',
    url: '/assets/carte-visite',
    usage: 'WhatsApp',
  },
]

const TEXTES = [
  {
    reseau: 'Facebook',
    emoji: '📘',
    nom: 'Nopalou — Comparateur de prix Sénégal',
    categorie: 'Site web · Technologie',
    bio: 'Comparez les prix de milliers de produits chez tous les marchands en ligne au Sénégal. Téléphones, TV, électro, mode, immobilier et plus — toujours le meilleur prix à Dakar.',
    site: 'https://nopalou.com',
    hashtags: '#Nopalou #Sénégal #Dakar #PrixMoinsCher #Shopping #Comparateur',
  },
  {
    reseau: 'Instagram',
    emoji: '📸',
    nom: '@nopalou',
    categorie: 'Compte professionnel · Shopping & Retail',
    bio: '🛒 Comparateur de prix N°1 au Sénégal\n📱 Téléphones · TV · Électro · Immo\n💰 Économisez jusqu\'à 40% à Dakar\n👇 Comparez sur nopalou.com',
    site: 'https://nopalou.com',
    hashtags: '#Nopalou #Dakar #Sénégal #BonPlan #PrixMoinsCher #Shopping #Tech',
  },
  {
    reseau: 'TikTok',
    emoji: '🎵',
    nom: '@nopalou',
    categorie: 'Compte professionnel',
    bio: '🛒 Comparateur prix Sénégal\n💰 Meilleurs prix à Dakar\n📲 nopalou.com',
    site: 'https://nopalou.com',
    hashtags: '#Nopalou #Dakar #Sénégal #BonPlan #PrixMoinsCher #shopping #fyp #senegal',
  },
  {
    reseau: 'WhatsApp Channel',
    emoji: '💬',
    nom: 'Nopalou — Bons plans',
    categorie: 'Canal de diffusion',
    bio: 'Les meilleurs prix du jour au Sénégal 🇸🇳\nMis à jour chaque matin\nComparez sur nopalou.com',
    site: 'https://nopalou.com',
    hashtags: '',
  },
]

const POST_TEMPLATES = [
  {
    titre: 'Post de lancement',
    texte: `🎉 Nopalou est arrivé au Sénégal !

Vous en avez assez de payer trop cher ? Nopalou compare les prix de milliers de produits chez tous les marchands en ligne au Sénégal.

📱 Téléphones, 💻 Informatique, 📺 TV & Électro, 👗 Mode, 🏠 Immobilier

✅ 3 000+ produits indexés
✅ 9 sites partenaires (Jumia, Expat-Dakar, CoinAfrique...)
✅ Mis à jour toutes les 6 heures
✅ 100% gratuit

👉 Comparez maintenant sur nopalou.com

#Nopalou #Sénégal #Dakar #PrixMoinsCher #Shopping #BonPlan`,
  },
  {
    titre: 'Template Vente Flash & Relance WhatsApp (Marchand)',
    texte: `⚡ Vente Flash 24h sur notre boutique Nopalou !

Profitez de nos offres exclusives directement sur WhatsApp sans vous déplacer.

🛒 Commandez vos articles en 1 clic : vos articles et détails de livraison sont envoyés directement à notre service client.

👉 Enregistrez notre numéro et envoyez "MENU" ou cliquez sur le lien de notre boutique Nopalou pour passer commande instantanément.

#VenteFlash #Dakar #WhatsAppShopping #NopalouBoutique`,
  },
  {
    titre: 'Post "Bon plan" (template quotidien)',
    texte: `🔥 BON PLAN DU JOUR

📱 [Nom produit] — [Prix] FCFA chez [Marchand]
Comparez tous les prix → nopalou.com/produit/[id]

Économisez jusqu'à [X] FCFA en comparant avant d'acheter !

#Nopalou #BonPlan #Dakar #Sénégal #PrixMoinsCher`,
  },
  {
    titre: 'Post "Baisse de prix"',
    texte: `📉 ALERTE BAISSE DE PRIX !

[Nom produit] vient de baisser de [X]%

Avant : [ancien prix] FCFA
Maintenant : [nouveau prix] FCFA
Économie : [différence] FCFA 💰

👉 Voir l'offre sur nopalou.com

#Nopalou #BaisseDeprix #BonPlan #Dakar #Sénégal`,
  },
  {
    titre: 'Post de lancement — Assistant WhatsApp',
    texte: `💬 Nopalou débarque sur WhatsApp !

Plus besoin d'ouvrir une app : comparez les prix, consultez les annonces immo, les offres télécom et créez des alertes de prix directement dans votre chat WhatsApp.

🔍 Recherche produit en un message
🏠 Dernières annonces immo
📱 Offres télécom à jour
🔔 Alertes de prix personnalisées
📦 Suivi de commande

100% gratuit, disponible 24h/24, aucune inscription.

👉 Envoyez "menu" au +221 70 871 79 42 ou cliquez : wa.me/221708717942

#Nopalou #WhatsApp #Dakar #Sénégal #BonPlan #Innovation`,
  },
]

const ARGUMENTAIRE_B2B = [
  {
    titre: 'Visibilité gratuite immédiate',
    detail: '30 jours d\'abonnement Pro offerts aux commerçants recrutés en phase de lancement — aucun engagement, on teste avant de payer.',
  },
  {
    titre: 'Pas de commission cachée',
    detail: 'Formule Business : 2% de commission seulement, clairement affiché — contre 5 à 15% chez Jumia selon catégorie. Coinafrique/Expat-Dakar n\'ont pas de commission mais pas de vitrine boutique non plus.',
  },
  {
    titre: 'WhatsApp intégré',
    detail: 'Les commandes arrivent directement là où le commerçant travaille déjà — pas un nouvel outil à apprendre, pas de app à installer.',
  },
  {
    titre: 'Analytics inclus',
    detail: 'Vues, contacts, performance de la boutique visibles depuis /boutique/analytics — gratuit, pas d\'option payante séparée.',
  },
  {
    titre: 'Aucun développement requis',
    detail: 'Création de boutique en ligne en quelques minutes, sans compétence technique.',
  },
]

function getObjections(prixPro: number, commissionBusiness: number) {
  return [
    {
      objection: '"C\'est encore un truc à payer, j\'ai déjà Facebook"',
      reponse: 'Facebook ne compare pas les prix pour vos clients, ni ne trie vos produits par catégorie. Nopalou vous amène des acheteurs qui cherchent déjà à comparer — vous captez une demande que Facebook ne vous donne pas. Et le premier mois est gratuit, sans risque.',
    },
    {
      objection: '"Je ne veux pas payer de commission"',
      reponse: `La formule Pro (${prixPro.toLocaleString('fr-FR')} FCFA/mois) n'a aucune commission — seule la formule Business (pour plus de volume) prend ${commissionBusiness}%, très en dessous de Jumia. Vous choisissez la formule adaptée à votre activité.`,
    },
    {
      objection: '"Je n\'ai pas le temps de gérer un site en plus"',
      reponse: 'Tout passe par WhatsApp, l\'outil que vous utilisez déjà toute la journée. Pas de nouveau tableau de bord à apprendre pour recevoir les commandes.',
    },
    {
      objection: '"Comment je sais que ça marche avant de payer ?"',
      reponse: '30 jours d\'essai Pro gratuits, sans carte bancaire. Vous voyez les vues et contacts réels sur votre boutique avant de décider.',
    },
  ]
}

const SCRIPT_ORAL = `[Accroche — 15 sec]
Bonjour, je m'appelle [Prénom], je représente Nopalou, une plateforme sénégalaise qui compare les prix produits, immobilier et forfaits télécom pour aider les gens à mieux acheter à Dakar.

[Problème — 20 sec]
Aujourd'hui vos clients comparent déjà les prix entre boutiques avant d'acheter — sur Facebook, au bouche-à-oreille, ou en passant physiquement. Nopalou centralise cette comparaison, et vous, en tant que commerçant, vous pouvez y être visible gratuitement.

[Solution — 40 sec]
Concrètement : vous créez votre boutique en ligne en quelques minutes, vos produits apparaissent dans les résultats de comparaison, et les clients intéressés vous contactent directement sur WhatsApp — l'outil que vous utilisez déjà. Pas de nouvelle appli à apprendre, pas de site à gérer.

[Offre — 20 sec]
En ce moment, on lance la plateforme avec 30 jours d'abonnement Pro offerts, sans engagement. Vous testez, vous voyez le nombre de vues et de contacts que ça vous apporte, et vous décidez ensuite si vous continuez.

[Clôture — 15 sec]
Est-ce que je peux prendre 5 minutes avec vous pour créer votre boutique maintenant ? J'ai juste besoin de vos infos de base et quelques photos de vos produits.

[Si hésitation → relance]
Pas de souci si vous n'avez pas le temps là — je peux repasser demain, ou vous laisser ma carte avec un lien direct pour créer la boutique vous-même en 5 minutes, à votre rythme.`

const PLAN_DEMARCHAGE = [
  {
    semaine: 'Semaine 1',
    zone: 'Marché Sandaga + Plateau (Dakar centre)',
    cible: '10-15 commerçants (électronique, téléphonie, mode) — forte densité, clientèle habituée à comparer les prix',
    objectif: '5 boutiques créées et actives',
  },
  {
    semaine: 'Semaine 2',
    zone: 'Marché HLM + Colobane',
    cible: '10-15 commerçants (mode, textile, accessoires)',
    objectif: '5 boutiques supplémentaires (10 cumulées)',
  },
  {
    semaine: 'Semaine 3',
    zone: 'Agences immobilières — Almadies, Mermoz, Sacré-Cœur',
    cible: '5-8 agences immobilières indépendantes',
    objectif: '3-5 agences avec annonces immo actives',
  },
  {
    semaine: 'Semaine 4',
    zone: 'Parcelles Assainies + Grand Yoff',
    cible: '10-15 commerçants (électroménager, informatique)',
    objectif: '5 boutiques supplémentaires (15+ cumulées)',
  },
  {
    semaine: '5-6',
    zone: 'Consolidation — retour sur les 3 premières zones',
    cible: 'Recueillir témoignages des early adopters, relancer ceux non convertis',
    objectif: 'Convertir 30-50% des essais gratuits en abonnements payants',
  },
]

function getApporteurTexte(tauxApporteur: number) {
  return `💼 Devenez apporteur d'affaires Nopalou

Vous connaissez des commerçants, agences immobilières ou vendeurs à Dakar ? Présentez-leur Nopalou et touchez ${tauxApporteur}% de commission récurrente sur chaque abonnement Pro ou Business que vous recrutez — chaque mois, tant que la boutique reste abonnée.

Comment ça marche :
1. Vous présentez Nopalou à votre contact (script fourni)
2. Le commerçant crée sa boutique avec votre code apporteur
3. Dès qu'il passe en Pro ou Business payant, vous touchez ${tauxApporteur}% chaque mois

Aucun investissement, aucun engagement de votre part. Paiement mensuel par Wave ou Orange Money.

📲 Contact : [votre numéro WhatsApp]`
}

function getApporteurExemples(prixPro: number, prixBusiness: number, tauxApporteur: number) {
  return [
    { formule: 'Boutique Pro', prix: `${prixPro.toLocaleString('fr-FR')} FCFA/mois`, commission: `${Math.round(prixPro * tauxApporteur / 100).toLocaleString('fr-FR')} FCFA/mois par boutique` },
    { formule: 'Boutique Business', prix: `${prixBusiness.toLocaleString('fr-FR')} FCFA/mois`, commission: `${Math.round(prixBusiness * tauxApporteur / 100).toLocaleString('fr-FR')} FCFA/mois par boutique` },
  ]
}

const CHATBOT_FONCTIONS = [
  {
    groupe: '🔍 Recherche & comparaison',
    items: [
      { titre: 'Recherche unifiée', detail: 'Texte libre (ex: "iPhone 14") → renvoie en une seule requête les prix comparés du marketplace (3000+ produits scrapés, tous marchands), les boutiques marchandes Nopalou, les annonces classifiées ou les biens immo correspondants, avec lien direct.' },
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
      { titre: 'Panier multi-produits (Meta Commerce)', detail: 'Depuis le catalogue WhatsApp d\'une boutique, le client compose un panier avec plusieurs articles et l\'envoie en une seule fois — pas besoin de chercher chaque produit un par un.' },
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

const CHATBOT_TEXTE = `💬 Nopalou est maintenant sur WhatsApp !

Comparez les prix (produits, boutiques, immo, télécom), commandez directement dans une boutique — même avec plusieurs produits en un seul panier — créez des alertes de prix et posez vos questions, sans quitter votre conversation WhatsApp. Pas d'app à installer, pas d'inscription.

Comment l'utiliser :
1. Enregistrez le +221 70 871 79 42 (ou cliquez wa.me/221708717942)
2. Envoyez "menu"
3. Choisissez une option : recherche, boutiques, immo, télécom, alerte prix, suivi commande, ou posez directement votre question

100% gratuit, disponible 24h/24.

📲 wa.me/221708717942`

export default async function CommunicationPage() {
  const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
  const jar    = await cookies()
  const secret = jar.get('nopalou_admin')?.value ?? ''

  let prixPro = 15000
  let prixBusiness = 35000
  let commissionBusiness = 2
  let tauxApporteur = 10
  try {
    const r = await fetch(`${BACKEND}/api/settings`, { headers: { 'X-Admin-Secret': secret }, cache: 'no-store' })
    if (r.ok) {
      const s = await r.json()
      prixPro = Number(s.plan_pro_prix) || 15000
      prixBusiness = Number(s.plan_business_prix) || 35000
      commissionBusiness = Number(s.commission_business) || 2
      tauxApporteur = Number(s.apporteur_taux_commission) || 10
    }
  } catch {
    // fallback aux valeurs par défaut
  }
  const objections = getObjections(prixPro, commissionBusiness)
  const apporteurTexte = getApporteurTexte(tauxApporteur)
  const apporteurExemples = getApporteurExemples(prixPro, prixBusiness, tauxApporteur)

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1C2B4A', marginBottom: 6 }}>
        🎨 Kit de communication
      </h1>
      <p style={{ color: '#64748B', marginBottom: 40, fontSize: 14 }}>
        Visuels et textes pour vos pages réseaux sociaux.
        Clic droit sur un visuel → <strong>Enregistrer l&apos;image</strong> pour le télécharger.
      </p>

      {/* Visuels */}
      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1C2B4A', marginBottom: 20 }}>
          🖼 Visuels à télécharger
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {VISUELS.map(v => (
            <div key={v.url} style={{
              border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden',
              background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.05)',
            }}>
              <a href={v.url} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={v.url} alt={v.titre} style={{ width: '100%', display: 'block', aspectRatio: '4/3', objectFit: 'cover' }} />
              </a>
              <div style={{ padding: '14px' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#1C2B4A', margin: '0 0 3px' }}>{v.titre}</p>
                <p style={{ fontSize: 11, color: '#94A3B8', margin: '0 0 10px' }}>{v.desc}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    fontSize: 10, background: '#FFF7ED', color: '#C75B00',
                    padding: '3px 8px', borderRadius: 6, fontWeight: 700,
                  }}>{v.usage}</span>
                  <a href={v.url} target="_blank" rel="noopener noreferrer" style={{
                    fontSize: 12, color: '#C75B00', fontWeight: 700, textDecoration: 'none',
                  }}>
                    Ouvrir →
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Textes bio */}
      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1C2B4A', marginBottom: 20 }}>
          ✍️ Textes à copier-coller
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {TEXTES.map(t => (
            <div key={t.reseau} style={{
              border: '1px solid #E2E8F0', borderRadius: 10, padding: '20px',
              background: '#fff',
            }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1C2B4A', margin: '0 0 14px' }}>
                {t.emoji} {t.reseau}
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <tbody>
                  {([
                    ['Nom / pseudo', t.nom],
                    ['Catégorie', t.categorie],
                    ['Bio / Description', t.bio],
                    ['Site web', t.site],
                    ...(t.hashtags ? [['Hashtags', t.hashtags]] : []),
                  ] as [string, string][]).map(([label, val]) => (
                    <tr key={label} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '9px 0', color: '#64748B', fontWeight: 600, width: 130, verticalAlign: 'top' }}>
                        {label}
                      </td>
                      <td style={{ padding: '9px 0 9px 16px', color: '#1C2B4A', whiteSpace: 'pre-line' }}>
                        {val}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </section>

      {/* Templates posts */}
      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1C2B4A', marginBottom: 20 }}>
          📝 Templates de posts
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {POST_TEMPLATES.map(p => (
            <div key={p.titre} style={{
              border: '1px solid #E2E8F0', borderRadius: 10, padding: '20px',
              background: '#fff',
            }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#C75B00', margin: '0 0 10px' }}>
                {p.titre}
              </h3>
              <pre style={{
                fontSize: 13, color: '#1C2B4A', whiteSpace: 'pre-wrap',
                background: '#F8FAFC', border: '1px solid #E2E8F0',
                borderRadius: 8, padding: '14px', margin: 0, lineHeight: 1.7,
                fontFamily: 'system-ui, sans-serif',
              }}>
                {p.texte}
              </pre>
            </div>
          ))}
        </div>
      </section>

      <hr style={{ border: 'none', borderTop: '2px solid #E2E8F0', margin: '48px 0' }} />

      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1C2B4A', marginBottom: 6 }}>
        🤝 Kit démarchage partenaires (B2B)
      </h1>
      <p style={{ color: '#64748B', marginBottom: 32, fontSize: 14 }}>
        Argumentaire, script et plan de terrain pour recruter des boutiques et agences partenaires.
      </p>

      {/* Argumentaire B2B */}
      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1C2B4A', marginBottom: 20 }}>
          💼 Argumentaire commercial
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {ARGUMENTAIRE_B2B.map((a, i) => (
            <div key={a.titre} style={{
              border: '1px solid #E2E8F0', borderRadius: 10, padding: '16px 20px',
              background: '#fff', display: 'flex', gap: 14,
            }}>
              <span style={{
                fontSize: 13, fontWeight: 800, color: '#C75B00', background: '#FFF7ED',
                borderRadius: '50%', width: 26, height: 26, display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>{i + 1}</span>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#1C2B4A', margin: '0 0 4px' }}>{a.titre}</p>
                <p style={{ fontSize: 13, color: '#64748B', margin: 0, lineHeight: 1.6 }}>{a.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Objections */}
      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1C2B4A', marginBottom: 20 }}>
          🛡️ Réponses aux objections courantes
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {objections.map(o => (
            <div key={o.objection} style={{
              border: '1px solid #E2E8F0', borderRadius: 10, padding: '18px 20px', background: '#fff',
            }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#B91C1C', margin: '0 0 8px' }}>
                {o.objection}
              </p>
              <p style={{ fontSize: 13, color: '#1C2B4A', margin: 0, lineHeight: 1.6 }}>
                → {o.reponse}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Script oral */}
      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1C2B4A', marginBottom: 20 }}>
          🎙️ Script de présentation orale (2-3 min)
        </h2>
        <pre style={{
          fontSize: 13, color: '#1C2B4A', whiteSpace: 'pre-wrap',
          background: '#F8FAFC', border: '1px solid #E2E8F0',
          borderRadius: 8, padding: '20px', margin: 0, lineHeight: 1.8,
          fontFamily: 'system-ui, sans-serif',
        }}>
          {SCRIPT_ORAL}
        </pre>
      </section>

      {/* Plan de démarchage */}
      <section>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1C2B4A', marginBottom: 20 }}>
          🗺️ Plan de démarchage terrain (6 semaines — Dakar)
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10 }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                {['Période', 'Zone', 'Cible', 'Objectif'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#64748B', fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PLAN_DEMARCHAGE.map(p => (
                <tr key={p.semaine} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: '#C75B00', whiteSpace: 'nowrap' }}>{p.semaine}</td>
                  <td style={{ padding: '12px 14px', color: '#1C2B4A' }}>{p.zone}</td>
                  <td style={{ padding: '12px 14px', color: '#1C2B4A' }}>{p.cible}</td>
                  <td style={{ padding: '12px 14px', color: '#1C2B4A' }}>{p.objectif}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <hr style={{ border: 'none', borderTop: '2px solid #E2E8F0', margin: '48px 0' }} />

      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1C2B4A', marginBottom: 6 }}>
        💼 Programme apporteur d&apos;affaires
      </h1>
      <p style={{ color: '#64748B', marginBottom: 32, fontSize: 14 }}>
        Recrutez des apporteurs dans votre réseau pour vulgariser Nopalou moyennant commission.
        ⚠️ Le suivi (code apporteur, calcul et paiement de la commission) n&apos;est pas encore développé — ceci est le kit de présentation, pas un système automatisé.
      </p>

      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1C2B4A', marginBottom: 20 }}>
          💰 Grille de commission — 10% récurrent
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10 }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                {['Formule recrutée', 'Prix', 'Commission apporteur (10%)'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#64748B', fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {apporteurExemples.map(e => (
                <tr key={e.formule} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: '#1C2B4A' }}>{e.formule}</td>
                  <td style={{ padding: '12px 14px', color: '#64748B' }}>{e.prix}</td>
                  <td style={{ padding: '12px 14px', color: '#C75B00', fontWeight: 700 }}>{e.commission}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 12 }}>
          Commission versée chaque mois tant que l&apos;abonnement recruté reste actif. Paiement par Wave ou Orange Money.
        </p>
      </section>

      <section>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1C2B4A', marginBottom: 20 }}>
          📢 Texte de recrutement (à partager par WhatsApp/réseaux)
        </h2>
        <p style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>
          Brochure complète à remettre à un apporteur pour qu&apos;il puisse démarcher directement :{' '}
          <a href="/brochure-apporteur.pdf" target="_blank" rel="noopener noreferrer" style={{ color: '#C75B00', fontWeight: 700 }}>
            /brochure-apporteur.pdf
          </a>
        </p>
        <pre style={{
          fontSize: 13, color: '#1C2B4A', whiteSpace: 'pre-wrap',
          background: '#F8FAFC', border: '1px solid #E2E8F0',
          borderRadius: 8, padding: '20px', margin: 0, lineHeight: 1.8,
          fontFamily: 'system-ui, sans-serif',
        }}>
          {apporteurTexte}
        </pre>
      </section>

      <hr style={{ border: 'none', borderTop: '2px solid #E2E8F0', margin: '48px 0' }} />

      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1C2B4A', marginBottom: 6 }}>
        💬 Kit assistant WhatsApp
      </h1>
      <p style={{ color: '#64748B', marginBottom: 32, fontSize: 14 }}>
        Visuel, texte et argumentaire pour annoncer le chatbot WhatsApp sur les réseaux et auprès des utilisateurs.
        Page publique de présentation : <a href="/assistant-whatsapp" target="_blank" rel="noopener noreferrer" style={{ color: '#25D366', fontWeight: 700 }}>nopalou.com/assistant-whatsapp</a>
      </p>

      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1C2B4A', marginBottom: 20 }}>
          ⚙️ Ce que le chatbot sait faire
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {CHATBOT_FONCTIONS.map(groupe => (
            <div key={groupe.groupe}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#25D366', margin: '0 0 12px' }}>
                {groupe.groupe}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {groupe.items.map((f, i) => (
                  <div key={f.titre} style={{
                    border: '1px solid #E2E8F0', borderRadius: 10, padding: '16px 20px',
                    background: '#fff', display: 'flex', gap: 14,
                  }}>
                    <span style={{
                      fontSize: 13, fontWeight: 800, color: '#25D366', background: '#f0fdf4',
                      borderRadius: '50%', width: 26, height: 26, display: 'flex',
                      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>{i + 1}</span>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#1C2B4A', margin: '0 0 4px' }}>{f.titre}</p>
                      <p style={{ fontSize: 13, color: '#64748B', margin: 0, lineHeight: 1.6 }}>{f.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1C2B4A', marginBottom: 20 }}>
          📢 Texte d&apos;annonce (à partager par WhatsApp/réseaux)
        </h2>
        <pre style={{
          fontSize: 13, color: '#1C2B4A', whiteSpace: 'pre-wrap',
          background: '#F8FAFC', border: '1px solid #E2E8F0',
          borderRadius: 8, padding: '20px', margin: 0, lineHeight: 1.8,
          fontFamily: 'system-ui, sans-serif',
        }}>
          {CHATBOT_TEXTE}
        </pre>
      </section>

      <hr style={{ border: 'none', borderTop: '2px solid #E2E8F0', margin: '48px 0' }} />

      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1C2B4A', marginBottom: 6 }}>
        🎯 Kit fonctionnalités & abonnements
      </h1>
      <p style={{ color: '#64748B', marginBottom: 32, fontSize: 14 }}>
        Visuels par palier d&apos;abonnement boutique, pour démarcher un marchand ou l&apos;aider à comparer les paliers.
        Page de référence pour les utilisateurs connectés : <code>/compte/fonctionnalites</code>
      </p>

      <section>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1C2B4A', marginBottom: 20 }}>
          🖼 Visuels par palier
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {PALIERS_BOUTIQUE.map(palier => (
            <div key={palier.id} style={{
              border: '1px solid #E2E8F0', borderRadius: 10, padding: '20px', background: '#fff',
            }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: palier.couleur, margin: '0 0 14px' }}>
                {palier.label}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
                  <a href={`/assets/palier/${palier.id}/carre`} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/assets/palier/${palier.id}/carre`} alt={`${palier.label} — carré`} style={{ width: '100%', display: 'block', aspectRatio: '1/1', objectFit: 'cover' }} />
                  </a>
                  <p style={{ fontSize: 12, color: '#64748B', margin: '8px 12px 12px' }}>Format carré (1080×1080)</p>
                </div>
                <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
                  <a href={`/assets/palier/${palier.id}/story`} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/assets/palier/${palier.id}/story`} alt={`${palier.label} — story`} style={{ width: '100%', display: 'block', aspectRatio: '9/16', objectFit: 'cover' }} />
                  </a>
                  <p style={{ fontSize: 12, color: '#64748B', margin: '8px 12px 12px' }}>Format story (1080×1920)</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
