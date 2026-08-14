import type { Metadata } from 'next'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import { fcfa } from '@/lib/format'
import ExternalImg from '@/components/ExternalImg'
import PageHeader from '@/components/PageHeader'

export const metadata: Metadata = {
  title: 'Comparaison immobilier',
}

interface AnnonceImmo {
  id: string
  titre: string
  prix: number | null
  ville: string | null
  quartier: string | null
  type_bien: string | null
  transaction: string | null
  surface_m2: number | null
  nb_pieces: number | null
  nb_chambres: number | null
  image_url: string | null
  images: string[] | null
  description: string | null
  source: string | null
}

const TYPE_ICONS: Record<string, string> = {
  appartement: '🏢', villa: '🏡', maison: '🏠',
  studio: '🛏', terrain: '🌿', bureau: '🏢',
}

function prixParM2(a: AnnonceImmo): number | null {
  if (!a.prix || !a.surface_m2) return null
  return Math.round(a.prix / a.surface_m2)
}

export default async function ImmoComparaisonPage({
  searchParams,
}: {
  searchParams: { ids?: string }
}) {
  const ids = (searchParams.ids ?? '')
    .split(',').map(s => s.trim()).filter(Boolean).slice(0, 3)

  if (ids.length < 2) {
    return (
      <div className="page-container" style={{ paddingTop: '3rem' }}>
        <div className="empty-state">
          <span style={{ fontSize: 48 }}>🏡</span>
          <p>Sélectionnez au moins 2 annonces à comparer depuis la liste.</p>
          <Link href="/immo" className="budget-pill active" style={{ marginTop: 8 }}>
            Parcourir les annonces
          </Link>
        </div>
      </div>
    )
  }

  const items = (
    await Promise.all(
      ids.map(async id => {
        try { return await apiFetch<AnnonceImmo>(`/immo/${id}`) }
        catch { return null }
      })
    )
  ).filter((x): x is AnnonceImmo => x !== null)

  if (items.length < 2) {
    return (
      <div className="page-container" style={{ paddingTop: '3rem' }}>
        <div className="empty-state">
          <span style={{ fontSize: 48 }}>🏡</span>
          <p>Impossible de charger les annonces demandées.</p>
          <Link href="/immo" className="budget-pill active" style={{ marginTop: 8 }}>Parcourir les annonces</Link>
        </div>
      </div>
    )
  }

  const meilleursIndex = (() => {
    let best = Infinity; let idx = -1
    items.forEach((a, i) => {
      if (a.prix && a.prix < best) { best = a.prix; idx = i }
    })
    return idx
  })()

  const rows = [
    { label: 'Prix',          render: (a: AnnonceImmo) => a.prix ? <><strong>{fcfa(a.prix)}</strong>{a.transaction === 'location' ? <span style={{ fontSize: 12, color: 'var(--text3)' }}>/mois</span> : ''}</> : 'Sur demande' },
    { label: 'Prix / m²',     render: (a: AnnonceImmo) => { const v = prixParM2(a); return v ? fcfa(v) + '/m²' : '—' } },
    { label: 'Surface',       render: (a: AnnonceImmo) => a.surface_m2 ? `${a.surface_m2} m²` : '—' },
    { label: 'Pièces',        render: (a: AnnonceImmo) => a.nb_pieces ?? '—' },
    { label: 'Chambres',      render: (a: AnnonceImmo) => a.nb_chambres ?? '—' },
    { label: 'Type de bien',  render: (a: AnnonceImmo) => a.type_bien ? `${TYPE_ICONS[a.type_bien] ?? '🏠'} ${a.type_bien}` : '—' },
    { label: 'Ville',         render: (a: AnnonceImmo) => [a.quartier, a.ville].filter(Boolean).join(', ') || '—' },
    { label: 'Transaction',   render: (a: AnnonceImmo) => a.transaction === 'vente' ? '🔑 Vente' : '🏠 Location' },
  ]

  return (
    <div className="page-container" style={{ paddingTop: '2rem' }}>
      <PageHeader
        breadcrumb={[
          { label: 'Immobilier', href: '/immo' },
          { label: 'Comparaison détaillée' }
        ]}
        titre="Comparaison immobilier"
      />
      <p className="comp-sous-titre">Comparez côte à côte les annonces immo au Sénégal.</p>

      <div className="comp-table-wrap">
        <table className="comp-table">
          <thead>
            <tr>
              <th className="comp-th-label"></th>
              {items.map((a, i) => {
                const img = a.image_url ?? a.images?.[0] ?? null
                return (
                  <th key={a.id} className={`comp-th${i === meilleursIndex ? ' comp-th--best' : ''}`}>
                    {i === meilleursIndex && <div className="comp-best-badge">Meilleur prix</div>}
                    <div className="comp-prod-img">
                      <ExternalImg src={img} alt={a.titre} fallback={TYPE_ICONS[a.type_bien ?? ''] ?? '🏠'} fallbackClassName="comp-img-placeholder" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <Link href={`/immo/${a.id}`} className="comp-prod-nom">{a.titre}</Link>
                    {a.ville && <span className="comp-prod-marque">📍 {a.ville}</span>}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className={ri === 0 ? 'comp-tr-section' : ''}>
                <td className="comp-td-label">{row.label}</td>
                {items.map((a, i) => (
                  <td key={a.id} className={`comp-td${i === meilleursIndex && ri === 0 ? ' comp-td--best' : ''}`}>
                    {ri === 0 && i === meilleursIndex
                      ? <span className="comp-prix comp-prix--best">{row.render(a)}</span>
                      : row.render(a)
                    }
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <td className="comp-td-label"></td>
              {items.map(a => (
                <td key={a.id} className="comp-td">
                  <Link href={`/immo/${a.id}`} className="comp-fiche-btn">Voir l&apos;annonce →</Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
    </div>
  )
}
