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

export default function CommunicationPage() {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1C2B4A', marginBottom: 6 }}>
        🎨 Kit de communication
      </h1>
      <p style={{ color: '#64748B', marginBottom: 40, fontSize: 14 }}>
        Visuels et textes pour vos pages réseaux sociaux.
        Clic droit sur un visuel → <strong>Enregistrer l'image</strong> pour le télécharger.
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
      <section>
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
    </div>
  )
}
