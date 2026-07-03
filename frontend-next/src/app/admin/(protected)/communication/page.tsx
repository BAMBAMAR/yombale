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

const OBJECTIONS = [
  {
    objection: '"C\'est encore un truc à payer, j\'ai déjà Facebook"',
    reponse: 'Facebook ne compare pas les prix pour vos clients, ni ne trie vos produits par catégorie. Nopalou vous amène des acheteurs qui cherchent déjà à comparer — vous captez une demande que Facebook ne vous donne pas. Et le premier mois est gratuit, sans risque.',
  },
  {
    objection: '"Je ne veux pas payer de commission"',
    reponse: 'La formule Pro (15 000 FCFA/mois) n\'a aucune commission — seule la formule Business (pour plus de volume) prend 2%, très en dessous de Jumia. Vous choisissez la formule adaptée à votre activité.',
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

export default function CommunicationPage() {
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
          {OBJECTIONS.map(o => (
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
    </div>
  )
}
