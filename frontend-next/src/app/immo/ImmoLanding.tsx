// frontend-next/src/app/immo/ImmoLanding.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import JsonLd from '@/components/JsonLd'
import { breadcrumbSchema } from '@/lib/schema-org'
import ImmoCard, { type AnnonceImmo } from './ImmoCard'
import { IMMO_LANDINGS } from './landing-data'

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'

export function immoLandingMetadata(slug: string): Metadata {
  const cfg = IMMO_LANDINGS[slug]
  const canonical = `${BASE}/immo/${slug}`
  return {
    title: cfg.titre,
    description: cfg.description,
    keywords: cfg.keywords,
    alternates: { canonical },
    openGraph: { title: `${cfg.h1} — Nopalou`, description: cfg.description, type: 'website', url: canonical },
  }
}

interface ImmoResponse { annonces: AnnonceImmo[]; total: number; pages: number }

export default async function ImmoLanding({
  slug, searchParams,
}: { slug: string; searchParams: { page?: string } }) {
  const cfg = IMMO_LANDINGS[slug]
  const page = searchParams.page ?? '1'

  const qs = new URLSearchParams({
    limit: '24', page,
    transaction: cfg.transaction, type_bien: cfg.typeBien, ville: cfg.ville, tri: 'recent',
  })

  let data: ImmoResponse = { annonces: [], total: 0, pages: 1 }
  try {
    data = await apiFetch<ImmoResponse>(`/immo?${qs.toString()}`)
  } catch { /* état vide */ }

  const currentPage = Number(page)
  const self = `/immo/${slug}`

  const itemListJsonLd = data.annonces.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: cfg.h1,
    numberOfItems: data.total,
    itemListElement: data.annonces.slice(0, 10).map((a, i) => ({
      '@type': 'ListItem', position: i + 1, url: `${BASE}/immo/${a.id}`, name: a.titre,
    })),
  } : null

  return (
    <>
      <JsonLd schema={breadcrumbSchema([
        { name: 'Accueil', url: '/' },
        { name: 'Immobilier', url: '/immo' },
        { name: cfg.label, url: self },
      ])} />
      {itemListJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      )}

      <div className="page-container" style={{ paddingTop: '1.5rem' }}>
        <nav aria-label="Fil d'Ariane" style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>
          <Link href="/" style={{ color: 'var(--text2)' }}>Accueil</Link>
          {' › '}
          <Link href="/immo" style={{ color: 'var(--text2)' }}>Immobilier</Link>
          {' › '}
          <span style={{ color: 'var(--text1)' }}>{cfg.label}</span>
        </nav>

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 800, color: 'var(--navy)', lineHeight: 1.2, marginBottom: 10 }}>
            {cfg.h1}
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.6, maxWidth: 720 }}>{cfg.intro}</p>
          {data.total > 0 && (
            <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 8 }}>
              <strong style={{ color: 'var(--accent)' }}>{data.total.toLocaleString('fr-FR')} annonce{data.total > 1 ? 's' : ''}</strong> disponibles · mises à jour en continu
            </p>
          )}
        </div>

        {data.annonces.length === 0 ? (
          <div className="empty-state">
            <span style={{ fontSize: 48 }}>🏘</span>
            <p>Aucune annonce disponible pour l&apos;instant.</p>
            <Link href="/immo" className="budget-pill active" style={{ marginTop: 8 }}>Voir tout l&apos;immobilier</Link>
          </div>
        ) : (
          <div className="immo-grid">
            {data.annonces.map(a => <ImmoCard key={a.id} a={a} />)}
          </div>
        )}

        {data.pages > 1 && (
          <div className="pagination">
            {currentPage > 1 && <Link href={`${self}?page=${currentPage - 1}`} className="page-btn">← Précédent</Link>}
            <span className="page-info">Page {currentPage} / {data.pages}</span>
            {currentPage < data.pages && <Link href={`${self}?page=${currentPage + 1}`} className="page-btn">Suivant →</Link>}
          </div>
        )}

        <div style={{ marginTop: 32, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link href={`/immo?transaction=${cfg.transaction}&type_bien=${cfg.typeBien}&ville=${cfg.ville}`} className="budget-pill">
            Affiner avec tous les filtres →
          </Link>
          {Object.entries(IMMO_LANDINGS).filter(([s]) => s !== slug).slice(0, 4).map(([s, c]) => (
            <Link key={s} href={`/immo/${s}`} className="budget-pill">{c.label}</Link>
          ))}
        </div>
      </div>
    </>
  )
}
