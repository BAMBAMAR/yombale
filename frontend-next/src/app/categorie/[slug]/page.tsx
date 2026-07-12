import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { fcfa } from '@/lib/format'
import CardActions from '@/app/CardActions'
import ExternalImg from '@/components/ExternalImg'
import { CATEGORIES } from '../categories-data'

export const dynamic = 'force-dynamic'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'

interface Produit {
  id: string
  nom: string
  marque: string | null
  prix_min: number | null
  nb_offres: number | null
  image_url: string | null
  categorie_nom: string | null
}

interface ApiResponse {
  produits?: Produit[]
  data?: Produit[]
  total?: number
}

// ── generateMetadata ─────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const cat = CATEGORIES[params.slug]
  if (!cat) return { title: 'Catégorie introuvable' }

  return {
    title: `${cat.label} au Sénégal — Comparer les prix`,
    description: cat.description,
    keywords: cat.keywords,
    openGraph: {
      title: `${cat.label} au Sénégal — Nopalou`,
      description: cat.description,
      type: 'website',
      url: `${BASE}/categorie/${params.slug}`,
    },
    alternates: {
      canonical: `${BASE}/categorie/${params.slug}`,
    },
  }
}

// ── Page ─────────────────────────────────────────────────────────────

export default async function CategoriePage({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams: { page?: string; prixMax?: string; tri?: string }
}) {
  const cat = CATEGORIES[params.slug]
  if (!cat) notFound()

  const page   = searchParams.page   ?? '1'
  const prixMax = searchParams.prixMax ?? ''
  const tri    = searchParams.tri    ?? 'pertinence'

  const qs = new URLSearchParams({ limit: '24', page, categorie: params.slug })
  if (prixMax) qs.set('prixMax', prixMax)
  if (tri !== 'pertinence') qs.set('tri', tri)

  let produits: Produit[] = []
  let total = 0
  let pages = 1

  try {
    const res  = await fetch(`${BACKEND}/api/produits?${qs}`, { cache: 'no-store' })
    if (res.ok) {
      const data: ApiResponse = await res.json()
      produits = data.produits ?? data.data ?? []
      total    = data.total ?? produits.length
      pages    = Math.ceil(total / 24) || 1
    }
  } catch {
    // empty state
  }

  const currentPage = Number(page)

  function buildLink(p: Record<string, string>) {
    const ps = new URLSearchParams()
    if (prixMax) ps.set('prixMax', prixMax)
    if (tri !== 'pertinence') ps.set('tri', tri)
    Object.entries(p).forEach(([k, v]) => (v ? ps.set(k, v) : ps.delete(k)))
    const qs2 = ps.toString()
    return `/categorie/${params.slug}${qs2 ? `?${qs2}` : ''}`
  }

  // JSON-LD BreadcrumbList + ItemList
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: BASE },
      { '@type': 'ListItem', position: 2, name: cat.label, item: `${BASE}/categorie/${params.slug}` },
    ],
  }

  const itemListJsonLd = produits.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: cat.h1,
    description: cat.description,
    numberOfItems: total,
    itemListElement: produits.slice(0, 10).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${BASE}/produit/${p.id}`,
      name: p.nom,
    })),
  } : null

  const TRIS = [
    { val: 'pertinence', label: 'Pertinence' },
    { val: 'prix_asc',   label: 'Prix ↑' },
    { val: 'prix_desc',  label: 'Prix ↓' },
  ]

  const BUDGETS = [
    { label: '< 5 000',    val: '5000'   },
    { label: '< 15 000',   val: '15000'  },
    { label: '< 50 000',   val: '50000'  },
    { label: '< 150 000',  val: '150000' },
    { label: '< 500 000',  val: '500000' },
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      )}

      <div className="page-container" style={{ paddingTop: '1.5rem' }}>

        {/* Fil d'Ariane */}
        <nav aria-label="Fil d'Ariane" style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>
          <Link href="/" style={{ color: 'var(--text2)' }}>Accueil</Link>
          {' › '}
          <span style={{ color: 'var(--text1)' }}>{cat.label}</span>
        </nav>

        {/* En-tête SEO */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 800, color: 'var(--navy)', lineHeight: 1.2, marginBottom: 10 }}>
            {cat.emoji} {cat.h1}
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.6, maxWidth: 720 }}>
            {cat.intro}
          </p>
          {total > 0 && (
            <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 8 }}>
              <strong style={{ color: 'var(--accent)' }}>{total.toLocaleString('fr-FR')} produit{total > 1 ? 's' : ''}</strong> comparés au Sénégal · Prix mis à jour toutes les 6h
            </p>
          )}
        </div>

        {/* Filtres */}
        <div className="filtres-bar" style={{ marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
          <span className="filtres-label">Budget :</span>
          {BUDGETS.map(b => (
            <Link
              key={b.val}
              href={buildLink({ prixMax: prixMax === b.val ? '' : b.val, page: '1' })}
              className={`budget-pill${prixMax === b.val ? ' active' : ''}`}
            >
              {b.label}
            </Link>
          ))}
          {prixMax && (
            <Link href={buildLink({ prixMax: '', page: '1' })} className="budget-pill budget-pill--reset">
              ✕ Budget
            </Link>
          )}
          <span style={{ marginLeft: 8, color: 'var(--text3)', fontSize: 13 }}>Trier :</span>
          {TRIS.map(t => (
            <Link
              key={t.val}
              href={buildLink({ tri: t.val, page: '1' })}
              className={`budget-pill${tri === t.val ? ' active' : ''}`}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {/* Grille produits */}
        {produits.length === 0 ? (
          <div className="empty-state">
            <span style={{ fontSize: 48 }}>{cat.emoji}</span>
            <p>Aucun produit disponible dans cette catégorie pour l&apos;instant.</p>
            <Link href="/" className="budget-pill active" style={{ marginTop: 12 }}>
              Voir tous les produits
            </Link>
          </div>
        ) : (
          <div className="grid-produits">
            {produits.map(p => (
              <Link key={p.id} href={`/produit/${p.id}`} style={{ display: 'contents' }}>
                <article className="card-produit">
                  <div className="card-img">
                    <ExternalImg src={p.image_url} alt={p.nom} fallback={cat.emoji} fallbackClassName="card-img-placeholder" />
                  </div>
                  {p.marque && <p className="marque">{p.marque}</p>}
                  <p className="nom">{p.nom}</p>
                  <p className="prix">{p.prix_min ? fcfa(p.prix_min) : 'Prix sur demande'}</p>
                  {p.nb_offres != null && p.nb_offres > 1 && (
                    <p style={{ fontSize: '12px', color: 'var(--text3)' }}>
                      {p.nb_offres} offres
                    </p>
                  )}
                  <CardActions id={p.id} nom={p.nom} />
                </article>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="pagination">
            {currentPage > 1 && (
              <Link href={buildLink({ page: String(currentPage - 1) })} className="page-btn">
                ← Précédent
              </Link>
            )}
            <span className="page-info">Page {currentPage} / {pages}</span>
            {currentPage < pages && (
              <Link href={buildLink({ page: String(currentPage + 1) })} className="page-btn">
                Suivant →
              </Link>
            )}
          </div>
        )}

        {/* Bloc texte SEO en bas */}
        <div style={{
          marginTop: 48, padding: '24px 28px',
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 12, maxWidth: 720,
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)', marginBottom: 10 }}>
            Pourquoi comparer les prix {cat.label.toLowerCase()} sur Nopalou ?
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7 }}>
            Nopalou est le premier comparateur de prix dédié au marché sénégalais.
            Nous indexons les prix de {cat.exemples} chez tous les grands marchands en ligne du Sénégal — Jumia, Expat-Dakar, CoinAfrique et bien d&apos;autres.
            Les prix sont mis à jour automatiquement toutes les 6 heures.
            Que vous soyez à <strong>Dakar</strong>, Thiès, Saint-Louis ou Ziguinchor, trouvez le meilleur prix avant d&apos;acheter.
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
            <Link href="/" className="budget-pill active">Tous les produits</Link>
            {Object.entries(CATEGORIES)
              .filter(([s]) => s !== params.slug)
              .slice(0, 4)
              .map(([s, c]) => (
                <Link key={s} href={`/categorie/${s}`} className="budget-pill">
                  {c.emoji} {c.label}
                </Link>
              ))}
          </div>
        </div>
      </div>
    </>
  )
}
