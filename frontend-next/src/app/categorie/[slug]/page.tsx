import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { fcfa } from '@/lib/format'
import CardActions from '@/app/CardActions'
import ExternalImg from '@/components/ExternalImg'
import CompareFilterBanner from '@/components/CompareFilterBanner'
import PageHeader from '@/components/PageHeader'
import FiltresBar from '@/components/FiltresBar'
import SeoCard from '@/components/SeoCard'
import SearchWithAnchor from '@/app/SearchWithAnchor'
import { CATEGORIES } from '../categories-data'
import { SOUS_CATEGORIES } from '../sous-categories-data'

export const dynamic = 'force-dynamic'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
const SSR_SECRET = process.env.SSR_SECRET || ''
const SSR_HEADERS: Record<string, string> = SSR_SECRET ? { 'X-SSR-Token': SSR_SECRET } : {}

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
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const cat = CATEGORIES[slug]
  if (!cat) return { title: 'Catégorie introuvable' }

  return {
    title: `${cat.label} au Sénégal — Comparer les prix`,
    description: cat.description,
    keywords: cat.keywords,
    openGraph: {
      title: `${cat.label} au Sénégal — Nopalou`,
      description: cat.description,
      type: 'website',
      url: `${BASE}/categorie/${slug}`,
    },
    alternates: {
      canonical: `${BASE}/categorie/${slug}`,
    },
  }
}

// ── Page ─────────────────────────────────────────────────────────────

export default async function CategoriePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string; prixMax?: string; tri?: string; sousType?: string; q?: string }> | { page?: string; prixMax?: string; tri?: string; sousType?: string; q?: string }
}) {
  const { slug } = await params
  const cat = CATEGORIES[slug]
  if (!cat) notFound()

  const sp = await Promise.resolve(searchParams)
  const page   = sp?.page   ?? '1'
  const prixMax = sp?.prixMax ?? ''
  const tri    = sp?.tri    ?? 'pertinence'
  const sousType = sp?.sousType ?? ''
  const q      = sp?.q      ?? ''

  const qs = new URLSearchParams({ limit: '24', page, categorie: params.slug })
  if (prixMax) qs.set('prixMax', prixMax)
  if (tri !== 'pertinence') qs.set('tri', tri)
  if (sousType) qs.set('sousType', sousType)
  if (q) qs.set('q', q)

  let produits: Produit[] = []
  let total = 0
  let pages = 1

  try {
    const res  = await fetch(`${BACKEND}/api/produits?${qs}`, { cache: 'no-store', headers: SSR_HEADERS })
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
    if (sousType) ps.set('sousType', sousType)
    if (q) ps.set('q', q)
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

  // 'pertinence' est la sentinelle historique "aucun paramètre tri envoyé au backend"
  // (voir buildLink / construction de qs plus haut) — le défaut backend est désormais prix croissant.
  const TRIS = [
    { val: 'pertinence', label: '💰 Prix ↑' },
    { val: 'populaire',  label: '⭐ Populaires' },
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

        <PageHeader
          breadcrumb={[{ label: 'Accueil', href: '/' }, { label: cat.label }]}
          emoji={cat.emoji}
          titre={cat.h1}
          compteur={total > 0 ? `${total.toLocaleString('fr-FR')} produit${total > 1 ? 's' : ''} comparés au Sénégal · Prix mis à jour toutes les 6h` : undefined}
        />

        {/* Recherche texte */}
        <SearchWithAnchor 
          action={`/categorie/${params.slug}`} 
          defaultValue={q} 
          placeholder={`Rechercher dans ${cat.label.toLowerCase()}…`}
          hiddenParams={{ prixMax, tri: tri !== 'pertinence' ? tri : '', sousType }}
          clearLink={buildLink({ q: '' })}
        />

        {/* Filtres */}
        <div style={{ marginBottom: 20 }}>
          <FiltresBar
            essentiels={[
              ...BUDGETS.map(b => ({
                key: b.val,
                label: b.label,
                href: buildLink({ prixMax: prixMax === b.val ? '' : b.val, page: '1' }),
                active: prixMax === b.val,
              })),
              ...(prixMax ? [{
                key: 'reset-budget',
                label: '✕ Budget',
                href: buildLink({ prixMax: '', page: '1' }),
                active: false,
                reset: true,
              }] : []),
            ]}
            tri={TRIS.map(t => ({
              key: t.val,
              label: t.label,
              href: buildLink({ tri: t.val, page: '1' }),
              active: tri === t.val,
            }))}
          />
        </div>

        {/* Grille produits */}
        <CompareFilterBanner />
        {produits.length === 0 ? (
          <div className="empty-state">
            <span style={{ fontSize: 48 }}>{cat.emoji}</span>
            <p>Aucun produit disponible dans cette catégorie pour l&apos;instant.</p>
            <Link href="/" className="budget-pill active" style={{ marginTop: 12 }}>
              Voir tous les produits
            </Link>
          </div>
        ) : (
          <div id="resultats" className="grid-produits">
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
                  <CardActions id={p.id} nom={p.nom} categorieSlug={params.slug} />
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
        <SeoCard
          titre={`Pourquoi comparer les prix ${cat.label.toLowerCase()} sur Nopalou ?`}
          blurbs={[
            {
              emoji: '📊',
              text: (
                <>
                  <p>
                    Nopalou est le premier comparateur de prix dédié au marché sénégalais.
                    Nous indexons les prix de {cat.exemples} chez tous les grands marchands en ligne du Sénégal — Jumia, Expat-Dakar, CoinAfrique et bien d&apos;autres.
                    Les prix sont mis à jour automatiquement toutes les 6 heures.
                  </p>
                  <p>
                    {cat.intro}
                    {' '}Que vous soyez à <strong>Dakar</strong>, Thiès, Saint-Louis ou Ziguinchor, trouvez le meilleur prix avant d&apos;acheter.
                  </p>
                </>
              ),
            },
            {
              emoji: '📍',
              text: (
                <>
                  {cat.contenu.map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </>
              ),
            },
          ]}
          chipRows={[
            {
              label: 'Sous-catégories & budgets',
              chips: [
                ...Object.entries(SOUS_CATEGORIES)
                  .filter(([, sc]) => sc.categorie === params.slug)
                  .map(([key, sc]) => ({ href: `/categorie/${key}`, emoji: sc.emoji, label: sc.label })),
                { href: `/categorie/${params.slug}/moins-de-50000`, emoji: '💰', label: 'Moins de 50 000 FCFA' },
                { href: `/categorie/${params.slug}/moins-de-100000`, emoji: '💰', label: 'Moins de 100 000 FCFA' },
              ],
            },
            {
              label: 'Autres catégories',
              chips: [
                { href: '/', emoji: '🗂', label: 'Tous les produits', small: true },
                ...Object.entries(CATEGORIES)
                  .filter(([s]) => s !== params.slug)
                  .slice(0, 4)
                  .map(([s, c]) => ({ href: `/categorie/${s}`, emoji: c.emoji, label: c.label, small: true })),
              ],
            },
          ]}
          foot="Prix vérifiés automatiquement toutes les 6 heures sur tous les grands marchands sénégalais"
        />
      </div>
    </>
  )
}
