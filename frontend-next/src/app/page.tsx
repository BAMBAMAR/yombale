import type { Metadata } from 'next'
import Link from 'next/link'
import SearchBar from './SearchBar'

export const dynamic = 'force-dynamic'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
import ProduitsListe from './ProduitsListe'
import RecentlyViewed from './RecentlyViewed'

export const metadata: Metadata = {
  title: 'Nopalou — Comparateur de prix au Sénégal · Dakar',
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
  searchParams: { q?: string; categorie?: string; prixMax?: string; page?: string }
}) {
  const q         = searchParams.q         ?? ''
  const categorie = searchParams.categorie ?? ''
  const prixMax   = searchParams.prixMax   ?? ''
  const page      = searchParams.page      ?? '1'

  let produits: Produit[] = []
  let total               = 0
  let erreur: string | null = null

  try {
    const params = new URLSearchParams({ limit: '24', page })
    if (q)         params.set('q',         q)
    if (categorie) params.set('categorie', categorie)
    if (prixMax)   params.set('prixMax',   prixMax)

    const r = await fetch(`${BACKEND}/api/produits?${params}`, { cache: 'no-store' })
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
                href={`/categorie/${c.slug}`}
                className={`categ-pill${categorie === c.slug ? ' active' : ''}`}
              >
                {c.emoji} {c.label}
              </Link>
            )
          })}
          <Link href="/immo"           className="categ-pill">🏘 Immobilier</Link>
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
          initialProduits={produits}
          total={total}
          q={q}
          categorie={categorie}
          prixMax={prixMax}
        />
      )}

      {/* ── Bloc SEO ─────────────────────────────────────────────── */}
      {!hasFiltre && (
        <section style={{
          maxWidth: 820, margin: '48px auto 24px',
          padding: '28px 32px',
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 12,
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--navy)', marginBottom: 12 }}>
            Le comparateur de prix N°1 au Sénégal
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.8, marginBottom: 12 }}>
            <strong>Nopalou</strong> est le premier comparateur de prix dédié au marché sénégalais.
            Vous cherchez le <strong>prix le moins cher</strong> pour un téléphone, une télévision, un réfrigérateur ou un ordinateur ?
            Nopalou compare en temps réel les prix de milliers de produits chez tous les grands marchands en ligne au Sénégal.
          </p>
          <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.8, marginBottom: 12 }}>
            Que vous soyez à <strong>Dakar</strong>, Thiès, Saint-Louis, Ziguinchor ou Kaolack — trouvez le meilleur prix avant d&apos;acheter.
            Nos prix sont mis à jour automatiquement toutes les 6 heures depuis Jumia, Expat-Dakar, CoinAfrique et d&apos;autres marchands.
          </p>
          <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.8 }}>
            Comparer les prix au Sénégal n&apos;a jamais été aussi simple : recherchez votre produit, voyez toutes les offres côte à côte, et choisissez le vendeur le moins cher. <strong>Gratuit, sans inscription, sans pub intrusive.</strong>
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
            {CATEGORIES.filter(c => c.slug !== 'telecom').map(c => (
              <Link key={c.slug} href={`/categorie/${c.slug}`} style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'underline' }}>
                {c.label} au Sénégal
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  )
}
