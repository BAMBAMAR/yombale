import type { Metadata } from 'next'
import Link from 'next/link'
import SearchBar from './SearchBar'

export const dynamic = 'force-dynamic'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
const SSR_SECRET = process.env.SSR_SECRET || ''
const SSR_HEADERS: Record<string, string> = SSR_SECRET ? { 'X-SSR-Token': SSR_SECRET } : {}
import ProduitsListe from './ProduitsListe'
import RecentlyViewed from './RecentlyViewed'

export const metadata: Metadata = {
  title: 'Comparateur de prix au Sénégal · Dakar',
  description:
    'Nopalou est le comparateur de prix N°1 au Sénégal. Trouvez le prix le moins cher pour vos achats à Dakar : téléphones, TV, électroménager, informatique. Gratuit et mis à jour toutes les 6h.',
  keywords: [
    'comparateur de prix Sénégal', 'comparateur prix Dakar', 'prix moins cher Sénégal',
    'meilleur prix Dakar', 'comparer prix Sénégal', 'achat pas cher Dakar',
    'prix téléphone Sénégal', 'prix TV Dakar', 'Nopalou',
  ],
}

const CATEGORIES = [
  { slug: 'smartphones',  label: 'Téléphones',        emoji: '📱' },
  { slug: 'informatique', label: 'Informatique',       emoji: '💻' },
  { slug: 'tv-electro',   label: 'TV & Électro',       emoji: '📺' },
  { slug: 'mode',         label: 'Mode',               emoji: '👗' },
  { slug: 'maison',       label: 'Maison',             emoji: '🏠' },
  { slug: 'auto-moto',    label: 'Auto & Moto',        emoji: '🚗' },
  { slug: 'jeux',         label: 'Jeux',               emoji: '🎮' },
  { slug: 'telecom',      label: 'Télécom & Forfaits', emoji: '📡' },
]

const BUDGETS = [
  { label: '< 5 000',    prixMax: '5000'   },
  { label: '5k – 15k',   prixMax: '15000'  },
  { label: '15k – 50k',  prixMax: '50000'  },
  { label: '50k – 100k', prixMax: '100000' },
  { label: '+ 100 000',  prixMax: ''       },
]

const TRIS = [
  { val: '',          label: 'Pertinence' },
  { val: 'prix_asc',  label: 'Prix ↑' },
  { val: 'prix_desc', label: 'Prix ↓' },
  { val: 'nom_asc',   label: 'Nom A-Z' },
]

interface Produit {
  id: number
  nom: string
  marque: string | null
  categorie: string | null
  prix_min: number | null
  prix_max: number | null
  nb_offres: number | null
  image_url: string | null
}

interface ApiResponse {
  produits?: Produit[]
  data?: Produit[]
  total?: number
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: { q?: string; categorie?: string; prixMax?: string; page?: string; tri?: string }
}) {
  const q         = searchParams.q         ?? ''
  const categorie = searchParams.categorie ?? ''
  const prixMax   = searchParams.prixMax   ?? ''
  const page      = searchParams.page      ?? '1'
  const tri       = searchParams.tri       ?? ''

  let produits: Produit[] = []
  let total               = 0
  let erreur: string | null = null

  try {
    const params = new URLSearchParams({ limit: '24', page })
    if (q)         params.set('q',         q)
    if (categorie) params.set('categorie', categorie)
    if (prixMax)   params.set('prixMax',   prixMax)
    if (tri)       params.set('tri',       tri)

    const r = await fetch(`${BACKEND}/api/produits?${params}`, { cache: 'no-store', headers: SSR_HEADERS })
    if (!r.ok) throw new Error(`API produits → ${r.status}`)
    const data: ApiResponse | Produit[] = await r.json()
    if (Array.isArray(data)) {
      produits = data
      total    = data.length
    } else {
      produits = data.produits ?? data.data ?? []
      total    = data.total ?? produits.length
    }
  } catch (e) {
    erreur = e instanceof Error ? e.message : 'Erreur inconnue'
  }

  const hasFiltre = q || categorie || prixMax

  let settings: Record<string, string> = {}
  try {
    const r = await fetch(`${BACKEND}/api/settings/public`, { cache: 'no-store', headers: SSR_HEADERS })
    if (r.ok) settings = await r.json()
  } catch {
    // valeurs par défaut ci-dessous
  }
  const prixPro      = Number(settings.plan_pro_prix) || 15000
  const prixBusiness = Number(settings.plan_business_prix) || 35000
  const waveActif    = settings.paiement_wave !== 'false'
  const manuelActif  = settings.paiement_manuel_actif !== 'false'
  const modePaiementLabel = waveActif && manuelActif
    ? 'Paiement via Wave ou manuel'
    : waveActif
    ? 'Paiement via Wave'
    : 'Paiement manuel disponible'

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="hero-home">
        <h1>Comparateur de prix au <span>Sénégal</span></h1>
        <p className="hero-sub">
          Trouvez le prix le moins cher à Dakar et dans tout le Sénégal — téléphones, TV, électroménager et plus
        </p>
        <SearchBar defaultValue={q} />
        <div className="hero-categs">
          {CATEGORIES.map((c) => {
            if (c.slug === 'telecom') {
              return (
                <Link key={c.slug} href="/telecom" className={`categ-pill${categorie === c.slug ? ' active' : ''}`}>
                  {c.emoji} {c.label}
                </Link>
              )
            }
            return (
              <Link
                key={c.slug}
                href={categorie === c.slug ? '/' : `/?categorie=${c.slug}`}
                className={`categ-pill${categorie === c.slug ? ' active' : ''}`}
              >
                {c.emoji} {c.label}
              </Link>
            )
          })}
          <Link href="/immo"      className="categ-pill">🏘 Immobilier</Link>
          <Link href="/annonces"  className="categ-pill">📢 Annonces</Link>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────────── */}
      <div className="stats-strip">
        <div className="stat-item">
          <span className="stat-num">9+</span>
          <span className="stat-lbl">Sites partenaires</span>
        </div>
        <div className="stat-item">
          <span className="stat-num">3 000+</span>
          <span className="stat-lbl">Produits indexés</span>
        </div>
        <div className="stat-item">
          <span className="stat-num">100%</span>
          <span className="stat-lbl">Gratuit</span>
        </div>
        <div className="stat-item">
          <span className="stat-num">Dakar</span>
          <span className="stat-lbl">&amp; partout au Sénégal</span>
        </div>
      </div>

      {/* ── Budget + reset ───────────────────────────────────────── */}
      <div className="filtres-bar">
        <span className="filtres-label">Budget :</span>
        {BUDGETS.map((b) => {
          const ps = new URLSearchParams()
          if (q)         ps.set('q',         q)
          if (categorie) ps.set('categorie', categorie)
          if (b.prixMax) ps.set('prixMax',   b.prixMax)
          return (
            <Link
              key={b.label}
              href={`/?${ps}`}
              className={`budget-pill${prixMax === b.prixMax && b.prixMax ? ' active' : ''}`}
            >
              {b.label}
            </Link>
          )
        })}
        {hasFiltre && (
          <Link href="/" className="budget-pill budget-pill--reset">✕ Tout effacer</Link>
        )}
      </div>

      {/* ── Tri ──────────────────────────────────────────────────── */}
      <div className="filtres-bar">
        <span className="filtres-label">Trier :</span>
        {TRIS.map((t) => {
          const ps = new URLSearchParams()
          if (q)         ps.set('q',         q)
          if (categorie) ps.set('categorie', categorie)
          if (prixMax)   ps.set('prixMax',   prixMax)
          if (t.val)     ps.set('tri',       t.val)
          return (
            <Link
              key={t.val || 'defaut'}
              href={`/?${ps}`}
              className={`budget-pill${tri === t.val ? ' active' : ''}`}
            >
              {t.label}
            </Link>
          )
        })}
      </div>

      {/* ── Récemment consultés ──────────────────────────────────── */}
      <RecentlyViewed />

      {/* ── Grille produits ──────────────────────────────────────── */}
      {erreur ? (
        <div className="erreur-page">
          <h2>Impossible de charger les produits</h2>
          <p>{erreur}</p>
        </div>
      ) : (
        <ProduitsListe
          key={`${q}-${categorie}-${prixMax}-${tri}`}
          initialProduits={produits}
          total={total}
          q={q}
          categorie={categorie}
          prixMax={prixMax}
          tri={tri}
        />
      )}

      {/* ── Comment ça marche ───────────────────────────────────── */}
      {!hasFiltre && (
        <section className="home-how">
          <h2 className="home-section-titre">Comment ça marche ?</h2>
          <div className="home-how-grid">
            <div className="home-how-step">
              <div className="home-how-icon">🔍</div>
              <div className="home-how-body">
                <h3>Cherchez votre produit</h3>
                <p>Tapez le nom d&apos;un produit, d&apos;une marque ou d&apos;une catégorie dans la barre de recherche.</p>
              </div>
            </div>
            <div className="home-how-step">
              <div className="home-how-icon">📊</div>
              <div className="home-how-body">
                <h3>Comparez les prix</h3>
                <p>Nopalou compare automatiquement les prix chez Jumia, Expat-Dakar, CoinAfrique et plus.</p>
              </div>
            </div>
            <div className="home-how-step">
              <div className="home-how-icon">💰</div>
              <div className="home-how-body">
                <h3>Économisez</h3>
                <p>Choisissez le marchand le moins cher et économisez jusqu&apos;à 40% sur vos achats.</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Social proof ────────────────────────────────────────── */}
      {!hasFiltre && (
        <section className="home-proof">
          <div className="home-proof-grid">
            <div className="home-proof-item">
              <span className="home-proof-num">50 000+</span>
              <span className="home-proof-lbl">Comparaisons effectuées</span>
            </div>
            <div className="home-proof-sep" />
            <div className="home-proof-item">
              <span className="home-proof-num">40%</span>
              <span className="home-proof-lbl">D&apos;économies en moyenne</span>
            </div>
            <div className="home-proof-sep" />
            <div className="home-proof-item">
              <span className="home-proof-num">6h</span>
              <span className="home-proof-lbl">Mise à jour des prix</span>
            </div>
            <div className="home-proof-sep" />
            <div className="home-proof-item">
              <span className="home-proof-num">Dakar</span>
              <span className="home-proof-lbl">& tout le Sénégal</span>
            </div>
          </div>
        </section>
      )}

      {/* ── CTA Annonce ─────────────────────────────────────────── */}
      {!hasFiltre && (
        <section className="home-cta-annonce">
          <div className="home-cta-annonce-inner">
            <div className="home-cta-annonce-text">
              <h2>Vendez vos articles facilement</h2>
              <p>Publiez une annonce gratuitement et touchez des milliers d&apos;acheteurs au Sénégal.</p>
            </div>
            <div className="home-cta-annonce-btns">
              <Link href="/deposer-annonce" className="home-cta-btn home-cta-btn--primary">
                + Publier une annonce
              </Link>
              <Link href="/deposer-immo" className="home-cta-btn home-cta-btn--secondary">
                🏠 Publier un bien immo
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── CTA Assistant WhatsApp ──────────────────────────────── */}
      {!hasFiltre && (
        <section className="home-cta-annonce">
          <div className="home-cta-annonce-inner" style={{ background: 'linear-gradient(135deg, #f0fdf4, #fff)', borderColor: '#25D366' }}>
            <div className="home-cta-annonce-text">
              <h2>💬 Comparez les prix sur WhatsApp</h2>
              <p>Recherchez un produit, suivez une annonce immo ou créez une alerte de prix, directement dans votre chat — sans app à installer.</p>
            </div>
            <div className="home-cta-annonce-btns">
              <a
                href="https://wa.me/221708717942?text=menu"
                target="_blank"
                rel="noopener noreferrer"
                className="home-cta-btn"
                style={{ background: '#25D366', color: '#fff' }}
              >
                Discuter sur WhatsApp
              </a>
              <Link href="/assistant-whatsapp" className="home-cta-btn home-cta-btn--secondary">
                Voir ce qu&apos;il sait faire
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Tarifs Boutique Pro / Business ──────────────────────── */}
      {!hasFiltre && (
        <section style={{ maxWidth: 1200, margin: '32px auto 0', padding: '0 20px' }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)', margin: '0 0 8px' }}>
              Ouvrez votre boutique en ligne
            </h2>
            <p style={{ color: '#64748b', fontSize: 15, margin: 0 }}>
              Vendez directement sur Nopalou — catalogue produits, analytics, placement prioritaire.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            {/* Plan Pro */}
            <div style={{
              border: '2px solid #C75B00', borderRadius: 12, padding: '22px 20px',
              background: '#fff', position: 'relative',
            }}>
              <span style={{
                position: 'absolute', top: -12, left: 20,
                background: '#C75B00', color: '#fff',
                fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 20, letterSpacing: '.04em',
              }}>BOUTIQUE PRO</span>
              <p style={{ fontSize: 30, fontWeight: 800, margin: '8px 0 2px', color: '#C75B00' }}>
                {prixPro.toLocaleString('fr-FR')} <span style={{ fontSize: 14, fontWeight: 400, color: '#64748b' }}>FCFA/mois</span>
              </p>
              <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 20 }}>{modePaiementLabel}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 9 }}>
                {[
                  'Catalogue produits avec photos',
                  'Placement prioritaire dans /boutiques',
                  'Badge "Vendeur Pro" sur vos annonces',
                  '5 annonces classées incluses/mois',
                  'Analytics : vues & clics',
                ].map(a => (
                  <li key={a} style={{ fontSize: 13, display: 'flex', gap: 8 }}>
                    <span style={{ color: '#C75B00', fontWeight: 700 }}>✓</span>{a}
                  </li>
                ))}
              </ul>
              <Link href="/boutique/abonnement" style={{
                display: 'block', textAlign: 'center',
                background: '#C75B00', color: '#fff',
                padding: '11px 0', borderRadius: 10,
                fontWeight: 700, fontSize: 14, textDecoration: 'none',
              }}>
                Démarrer en Pro
              </Link>
            </div>

            {/* Plan Business */}
            <div style={{
              border: '2px solid #1e3a5f', borderRadius: 12, padding: '22px 20px',
              background: '#f8fafc', position: 'relative',
            }}>
              <span style={{
                position: 'absolute', top: -12, left: 20,
                background: '#1e3a5f', color: '#fff',
                fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 20, letterSpacing: '.04em',
              }}>BOUTIQUE BUSINESS</span>
              <p style={{ fontSize: 30, fontWeight: 800, margin: '8px 0 2px', color: '#1e3a5f' }}>
                {prixBusiness.toLocaleString('fr-FR')} <span style={{ fontSize: 14, fontWeight: 400, color: '#64748b' }}>FCFA/mois</span>
              </p>
              <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 20 }}>{modePaiementLabel}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 9 }}>
                {[
                  'Tout ce qui est inclus dans Pro',
                  'URL dédiée /boutiques/[votre-nom]',
                  '15 annonces classées incluses/mois',
                  'Bannière dans 1 page catégorie',
                  'Support prioritaire WhatsApp',
                ].map(a => (
                  <li key={a} style={{ fontSize: 13, display: 'flex', gap: 8 }}>
                    <span style={{ color: '#1e3a5f', fontWeight: 700 }}>✓</span>{a}
                  </li>
                ))}
              </ul>
              <Link href="/boutique/abonnement" style={{
                display: 'block', textAlign: 'center',
                background: '#1e3a5f', color: '#fff',
                padding: '11px 0', borderRadius: 10,
                fontWeight: 700, fontSize: 14, textDecoration: 'none',
              }}>
                Démarrer en Business
              </Link>
            </div>
          </div>

          <p style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', marginTop: 16 }}>
            Pas de débit automatique · Renouvellement manuel · {modePaiementLabel}
          </p>
        </section>
      )}

      {/* ── Bloc SEO ─────────────────────────────────────────────── */}
      {!hasFiltre && (
        <section style={{ maxWidth: 1200, margin: '24px auto 24px', padding: '0 20px' }}>
          <div style={{
            padding: '24px 28px',
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 12,
          }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--navy)', marginBottom: 12 }}>
            Le comparateur de prix N°1 au Sénégal
          </h2>
          <div className="home-seo-cols">
            <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.8, margin: 0 }}>
              <strong>Nopalou</strong> est le premier comparateur de prix dédié au marché sénégalais.
              Vous cherchez le <strong>prix le moins cher</strong> pour un téléphone, une télévision, un réfrigérateur ou un ordinateur ?
              Nopalou compare en temps réel les prix de milliers de produits chez tous les grands marchands en ligne au Sénégal.
            </p>
            <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.8, margin: 0 }}>
              Que vous soyez à <strong>Dakar</strong>, Thiès, Saint-Louis, Ziguinchor ou Kaolack — trouvez le meilleur prix avant d&apos;acheter.
              Nos prix sont mis à jour automatiquement toutes les 6 heures depuis Jumia, Expat-Dakar, CoinAfrique et d&apos;autres marchands.
              Comparer les prix au Sénégal n&apos;a jamais été aussi simple : recherchez votre produit, voyez toutes les offres côte à côte, et choisissez le vendeur le moins cher. <strong>Gratuit, sans inscription, sans pub intrusive.</strong>
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
            {CATEGORIES.filter(c => c.slug !== 'telecom').map(c => (
              <Link key={c.slug} href={`/categorie/${c.slug}`} style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'underline' }}>
                {c.label} au Sénégal
              </Link>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
            {[
              { href: '/categorie/tv-electro/climatiseurs', label: 'Climatiseur prix Dakar' },
              { href: '/categorie/smartphones/iphone', label: 'iPhone prix Dakar' },
              { href: '/categorie/smartphones/samsung', label: 'Samsung Galaxy prix Dakar' },
              { href: '/categorie/tv-electro/televiseurs', label: 'TV prix Dakar' },
              { href: '/categorie/tv-electro/refrigerateurs', label: 'Frigo prix Dakar' },
              { href: '/categorie/informatique/ordinateurs', label: 'Ordinateur portable prix Dakar' },
              { href: '/immo/location-appartement-dakar', label: 'Location appartement Dakar' },
              { href: '/immo/location-chambre-dakar', label: 'Chambre à louer Dakar' },
            ].map(l => (
              <Link key={l.href} href={l.href} style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'underline' }}>
                {l.label}
              </Link>
            ))}
          </div>
          </div>
        </section>
      )}
    </>
  )
}
