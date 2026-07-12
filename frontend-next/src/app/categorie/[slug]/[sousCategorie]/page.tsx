import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { fcfa } from '@/lib/format'
import CardActions from '@/app/CardActions'
import ExternalImg from '@/components/ExternalImg'
import JsonLd from '@/components/JsonLd'
import { breadcrumbSchema } from '@/lib/schema-org'
import { CATEGORIES } from '../../categories-data'
import { SOUS_CATEGORIES } from '../../sous-categories-data'

export const dynamic = 'force-dynamic'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'
const BUDGET_RE = /^moins-de-(\d{4,9})$/

interface PageParams { slug: string; sousCategorie: string }

interface Produit {
  id: string
  nom: string
  marque: string | null
  prix_min: number | null
  nb_offres: number | null
  image_url: string | null
}

interface ApiResponse { produits?: Produit[]; data?: Produit[]; total?: number }

// Résout le 3e segment : page budget, sous-catégorie connue, ou null (→ 404)
function resolve(params: PageParams) {
  const cat = CATEGORIES[params.slug]
  if (!cat) return null
  const budgetMatch = params.sousCategorie.match(BUDGET_RE)
  if (budgetMatch) return { kind: 'budget' as const, cat, budget: Number(budgetMatch[1]) }
  const sousCat = SOUS_CATEGORIES[`${params.slug}/${params.sousCategorie}`]
  if (sousCat) return { kind: 'souscat' as const, cat, sousCat }
  return null
}

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const r = resolve(params)
  // notFound() dès les métadonnées : lancé seulement dans le composant, le statut
  // HTTP resterait 200 (soft-404) car le streaming a déjà commencé.
  if (!r) notFound()
  const canonical = `${BASE}/categorie/${params.slug}/${params.sousCategorie}`
  if (r.kind === 'budget') {
    return {
      title: `${r.cat.label} à moins de ${fcfa(r.budget)} au Sénégal`,
      description: `Découvrez les ${r.cat.label.toLowerCase()} à moins de ${fcfa(r.budget)} au Sénégal. Comparez les meilleurs prix à Dakar, mis à jour toutes les 6h.`,
      alternates: { canonical },
      openGraph: { title: `${r.cat.label} à moins de ${fcfa(r.budget)} — Nopalou`, type: 'website', url: canonical },
    }
  }
  return {
    title: r.sousCat.titre,
    description: r.sousCat.description,
    keywords: r.sousCat.keywords,
    alternates: { canonical },
    openGraph: { title: `${r.sousCat.h1} — Nopalou`, description: r.sousCat.description, type: 'website', url: canonical },
  }
}

export default async function SousCategoriePage({
  params, searchParams,
}: { params: PageParams; searchParams: { page?: string; tri?: string } }) {
  const r = resolve(params)
  if (!r) notFound()

  const page = searchParams.page ?? '1'
  const tri = searchParams.tri ?? ''

  const qs = new URLSearchParams({ limit: '24', page, categorie: params.slug })
  if (r.kind === 'budget') qs.set('prixMax', String(r.budget))
  else qs.set('sousType', r.sousCat.sousType)
  if (tri) qs.set('tri', tri)

  let produits: Produit[] = []
  let total = 0
  let pages = 1
  try {
    const res = await fetch(`${BACKEND}/api/produits?${qs}`, { cache: 'no-store' })
    if (res.ok) {
      const data: ApiResponse = await res.json()
      produits = data.produits ?? data.data ?? []
      total = data.total ?? produits.length
      pages = Math.ceil(total / 24) || 1
    }
  } catch { /* état vide */ }

  const currentPage = Number(page)
  const h1 = r.kind === 'budget' ? `${r.cat.label} à moins de ${fcfa(r.budget)}` : r.sousCat.h1
  const intro = r.kind === 'budget'
    ? `Tous les ${r.cat.label.toLowerCase()} à moins de ${fcfa(r.budget)} disponibles au Sénégal, comparés chez tous les marchands en ligne. Prix mis à jour toutes les 6 heures.`
    : r.sousCat.intro
  const emoji = r.kind === 'budget' ? r.cat.emoji : r.sousCat.emoji
  const crumbLabel = r.kind === 'budget' ? `Moins de ${fcfa(r.budget)}` : r.sousCat.label
  const self = `/categorie/${params.slug}/${params.sousCategorie}`

  const breadcrumbs = [
    { name: 'Accueil', url: '/' },
    { name: r.cat.label, url: `/categorie/${params.slug}` },
    { name: crumbLabel, url: self },
  ]

  const itemListJsonLd = produits.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: h1,
    numberOfItems: total,
    itemListElement: produits.slice(0, 10).map((p, i) => ({
      '@type': 'ListItem', position: i + 1, url: `${BASE}/produit/${p.id}`, name: p.nom,
    })),
  } : null

  function pageLink(n: number) {
    const ps = new URLSearchParams()
    if (tri) ps.set('tri', tri)
    if (n > 1) ps.set('page', String(n))
    const s = ps.toString()
    return `${self}${s ? `?${s}` : ''}`
  }

  return (
    <>
      <JsonLd schema={breadcrumbSchema(breadcrumbs)} />
      {itemListJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      )}

      <div className="page-container" style={{ paddingTop: '1.5rem' }}>
        <nav aria-label="Fil d'Ariane" style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>
          <Link href="/" style={{ color: 'var(--text2)' }}>Accueil</Link>
          {' › '}
          <Link href={`/categorie/${params.slug}`} style={{ color: 'var(--text2)' }}>{r.cat.label}</Link>
          {' › '}
          <span style={{ color: 'var(--text1)' }}>{crumbLabel}</span>
        </nav>

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 800, color: 'var(--navy)', lineHeight: 1.2, marginBottom: 10 }}>
            {emoji} {h1}
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.6, maxWidth: 720 }}>{intro}</p>
          {total > 0 && (
            <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 8 }}>
              <strong style={{ color: 'var(--accent)' }}>{total.toLocaleString('fr-FR')} produit{total > 1 ? 's' : ''}</strong> comparés au Sénégal · Prix mis à jour toutes les 6h
            </p>
          )}
        </div>

        {produits.length === 0 ? (
          <div className="empty-state">
            <span style={{ fontSize: 48 }}>{emoji}</span>
            <p>Aucun produit disponible pour l&apos;instant.</p>
            <Link href={`/categorie/${params.slug}`} className="budget-pill active" style={{ marginTop: 12 }}>
              Voir toute la catégorie {r.cat.label}
            </Link>
          </div>
        ) : (
          <div className="grid-produits">
            {produits.map(p => (
              <Link key={p.id} href={`/produit/${p.id}`} style={{ display: 'contents' }}>
                <article className="card-produit">
                  <div className="card-img">
                    <ExternalImg src={p.image_url} alt={p.nom} fallback={emoji} fallbackClassName="card-img-placeholder" />
                  </div>
                  {p.marque && <p className="marque">{p.marque}</p>}
                  <p className="nom">{p.nom}</p>
                  <p className="prix">{p.prix_min ? fcfa(p.prix_min) : 'Prix sur demande'}</p>
                  {p.nb_offres != null && p.nb_offres > 1 && (
                    <p style={{ fontSize: '12px', color: 'var(--text3)' }}>{p.nb_offres} offres</p>
                  )}
                  <CardActions id={p.id} nom={p.nom} />
                </article>
              </Link>
            ))}
          </div>
        )}

        {pages > 1 && (
          <div className="pagination">
            {currentPage > 1 && <Link href={pageLink(currentPage - 1)} className="page-btn">← Précédent</Link>}
            <span className="page-info">Page {currentPage} / {pages}</span>
            {currentPage < pages && <Link href={pageLink(currentPage + 1)} className="page-btn">Suivant →</Link>}
          </div>
        )}

        <div style={{ marginTop: 32 }}>
          <Link href={`/categorie/${params.slug}`} className="budget-pill">← Toute la catégorie {r.cat.label}</Link>
        </div>
      </div>
    </>
  )
}
