import type { Metadata } from 'next'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import { fcfa } from '@/lib/format'
import SearchBar from './SearchBar'
import CardActions from './CardActions'

export const metadata: Metadata = {
  title: 'Nopalou — Comparateur de prix Sénégal',
  description:
    'Comparez les prix de milliers de produits au Sénégal. Économisez en trouvant les meilleures offres du marché sénégalais.',
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

    const data = await apiFetch<ApiResponse | Produit[]>(`/produits?${params}`)
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
        <h1>Meilleur prix au <span>Sénégal</span></h1>
        <p className="hero-sub">
          Comparez instantanément les prix chez les meilleurs marchands du Sénégal
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
                href={`/?categorie=${c.slug}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
                className={`categ-pill${categorie === c.slug ? ' active' : ''}`}
              >
                {c.emoji} {c.label}
              </Link>
            )
          })}
          <Link href="/immo"           className="categ-pill">🏘 Immobilier</Link>
          <Link href="/annonces.html"  className="categ-pill">📢 Annonces</Link>
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

      {/* ── Grille produits ──────────────────────────────────────── */}
      {erreur ? (
        <div className="erreur-page">
          <h2>Impossible de charger les produits</h2>
          <p>{erreur}</p>
        </div>
      ) : (
        <>
          {total > 0 && (
            <p className="resultats-count">
              {total.toLocaleString('fr-SN')} résultat{total > 1 ? 's' : ''}
            </p>
          )}
          <div className="grid-produits">
            {produits.map((p) => (
              <Link key={p.id} href={`/produit/${p.id}`} style={{ display: 'contents' }}>
                <article className="card-produit">
                  <div className="card-img">
                    {p.prix_min && p.prix_max && p.prix_max > p.prix_min * 1.1 && (
                      <span className="badge-promo">
                        -{Math.round((1 - p.prix_min / p.prix_max) * 100)}%
                      </span>
                    )}
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image_url} alt={p.nom} loading="lazy" />
                    ) : (
                      <span className="card-img-placeholder">📦</span>
                    )}
                  </div>
                  {p.marque && <p className="marque">{p.marque}</p>}
                  <p className="nom">{p.nom}</p>
                  <p className="prix">{fcfa(p.prix_min)}</p>
                  {p.nb_offres != null && p.nb_offres > 0 && (
                    <p style={{ fontSize: '12px', color: 'var(--text3)' }}>
                      {p.nb_offres} offre{p.nb_offres > 1 ? 's' : ''}
                    </p>
                  )}
                  <CardActions id={p.id} nom={p.nom} />
                </article>
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  )
}
