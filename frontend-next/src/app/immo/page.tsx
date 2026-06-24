import type { Metadata } from 'next'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import { fcfa } from '@/lib/format'

export const metadata: Metadata = {
  title: 'Immobilier au Sénégal — Nopalou',
  description:
    'Annonces immobilières au Sénégal : appartements, villas, terrains à louer ou à vendre à Dakar et dans tout le pays.',
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
  sponsorisee: boolean
  created_at: string
}

interface ImmoResponse {
  annonces: AnnonceImmo[]
  total: number
  page: number
  pages: number
}

const TYPE_BIEN = [
  { val: '',            label: 'Tous types' },
  { val: 'appartement', label: 'Appartement' },
  { val: 'villa',       label: 'Villa' },
  { val: 'maison',      label: 'Maison' },
  { val: 'studio',      label: 'Studio' },
  { val: 'terrain',     label: 'Terrain' },
  { val: 'bureau',      label: 'Bureau' },
]

const TRIS = [
  { val: 'recent',       label: 'Récent' },
  { val: 'prix_asc',     label: 'Prix ↑' },
  { val: 'prix_desc',    label: 'Prix ↓' },
  { val: 'surface_desc', label: 'Surface ↓' },
]

const PRIX_MAX_LOCATION = [
  { label: '< 100k',     val: '100000'  },
  { label: '< 250k',     val: '250000'  },
  { label: '< 500k',     val: '500000'  },
  { label: '< 1M',       val: '1000000' },
]

const PRIX_MAX_VENTE = [
  { label: '< 20M',  val: '20000000'  },
  { label: '< 50M',  val: '50000000'  },
  { label: '< 100M', val: '100000000' },
  { label: '< 200M', val: '200000000' },
]

const TYPE_ICONS: Record<string, string> = {
  appartement: '🏢',
  villa:       '🏡',
  maison:      '🏠',
  studio:      '🛏',
  terrain:     '🌿',
  bureau:      '🏢',
}

const SOURCE_LABELS: Record<string, string> = {
  coinafrique: 'CoinAfrique',
  expat:       'Expat-Dakar',
  facebook:    'Facebook',
  manuel:      'Particulier',
}

function ImmoCard({ a }: { a: AnnonceImmo }) {
  const img = a.image_url ?? (a.images?.[0] ?? null)
  const localisation = [a.quartier, a.ville].filter(Boolean).join(', ') || 'Sénégal'
  const typeIcon = TYPE_ICONS[a.type_bien ?? ''] ?? '🏠'
  const isVente = a.transaction === 'vente'

  return (
    <Link href={`/immo/${a.id}`} className="immo-card">
      <div className="immo-card-img">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={a.titre} loading="lazy" />
        ) : (
          <span className="immo-img-placeholder">{typeIcon}</span>
        )}
        <span className={`immo-transaction-badge${isVente ? ' immo-transaction-badge--vente' : ''}`}>
          {isVente ? 'Vente' : 'Location'}
        </span>
        {a.sponsorisee && (
          <span className="immo-sponsored-badge">Sponsorisé</span>
        )}
      </div>

      <div className="immo-card-body">
        {a.type_bien && (
          <span className="immo-type-tag">{typeIcon} {a.type_bien}</span>
        )}
        <h3 className="immo-titre">{a.titre}</h3>
        <p className="immo-localisation">📍 {localisation}</p>

        <div className="immo-specs">
          {a.surface_m2 && (
            <span className="immo-spec">{a.surface_m2} m²</span>
          )}
          {a.nb_pieces && (
            <span className="immo-spec">{a.nb_pieces} pièce{a.nb_pieces > 1 ? 's' : ''}</span>
          )}
          {a.nb_chambres && (
            <span className="immo-spec">{a.nb_chambres} ch.</span>
          )}
        </div>

        <div className="immo-card-footer">
          <span className="immo-prix">
            {a.prix ? fcfa(a.prix) : 'Prix sur demande'}
            {!isVente && a.prix ? <span className="immo-prix-periode">/mois</span> : ''}
          </span>
          {a.source && SOURCE_LABELS[a.source] && (
            <span className="immo-source">{SOURCE_LABELS[a.source]}</span>
          )}
        </div>
      </div>
    </Link>
  )
}

export default async function ImmoPage({
  searchParams,
}: {
  searchParams: {
    transaction?: string
    type_bien?: string
    tri?: string
    prixMax?: string
    ville?: string
    page?: string
  }
}) {
  const transaction = searchParams.transaction ?? 'location'
  const type_bien   = searchParams.type_bien   ?? ''
  const tri         = searchParams.tri         ?? 'recent'
  const prixMax     = searchParams.prixMax     ?? ''
  const ville       = searchParams.ville       ?? ''
  const page        = searchParams.page        ?? '1'

  const qs = new URLSearchParams()
  qs.set('limit', '24')
  qs.set('page', page)
  qs.set('transaction', transaction)
  if (type_bien) qs.set('type_bien', type_bien)
  if (tri)       qs.set('tri', tri)
  if (prixMax)   qs.set('prixMax', prixMax)
  if (ville)     qs.set('ville', ville)

  let data: ImmoResponse = { annonces: [], total: 0, page: 1, pages: 1 }

  try {
    data = await apiFetch<ImmoResponse>(`/immo?${qs.toString()}`)
  } catch {
    // empty state below
  }

  const { annonces, total, pages } = data
  const currentPage = Number(page)

  function buildLink(params: Record<string, string>) {
    const p = new URLSearchParams()
    p.set('transaction', transaction)
    if (type_bien) p.set('type_bien', type_bien)
    if (tri)       p.set('tri', tri)
    if (prixMax)   p.set('prixMax', prixMax)
    if (ville)     p.set('ville', ville)
    Object.entries(params).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)))
    return `/immo?${p.toString()}`
  }

  const prixOptions = transaction === 'vente' ? PRIX_MAX_VENTE : PRIX_MAX_LOCATION

  return (
    <div className="page-container" style={{ paddingTop: '2rem' }}>
      {/* En-tête */}
      <div className="immo-header">
        <div>
          <h1 className="immo-titre-page">
            Immobilier au <span style={{ color: 'var(--accent)' }}>Sénégal</span>
          </h1>
          <p className="immo-sous-titre">
            {total > 0
              ? `${total.toLocaleString('fr-FR')} annonce${total > 1 ? 's' : ''} disponible${total > 1 ? 's' : ''}`
              : 'Trouvez votre bien idéal'}
          </p>
        </div>
      </div>

      {/* Barre de filtres */}
      <div className="immo-filtres">

        {/* Transaction */}
        <div className="immo-filtres-row">
          <span className="filtres-label">Type</span>
          <div className="immo-toggle">
            <Link
              href={buildLink({ transaction: 'location', prixMax: '', page: '1' })}
              className={`immo-toggle-btn${transaction === 'location' ? ' active' : ''}`}
            >
              🏠 Location
            </Link>
            <Link
              href={buildLink({ transaction: 'vente', prixMax: '', page: '1' })}
              className={`immo-toggle-btn${transaction === 'vente' ? ' active' : ''}`}
            >
              🔑 Vente
            </Link>
          </div>
        </div>

        {/* Type de bien */}
        <div className="immo-filtres-row">
          <span className="filtres-label">Bien</span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {TYPE_BIEN.map(t => (
              <Link
                key={t.val}
                href={buildLink({ type_bien: t.val, page: '1' })}
                className={`budget-pill${type_bien === t.val ? ' active' : ''}`}
              >
                {t.val ? (TYPE_ICONS[t.val] ?? '') + ' ' : ''}{t.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Prix max */}
        <div className="immo-filtres-row">
          <span className="filtres-label">Budget</span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {prixOptions.map(p => (
              <Link
                key={p.val}
                href={buildLink({ prixMax: p.val, page: '1' })}
                className={`budget-pill${prixMax === p.val ? ' active' : ''}`}
              >
                {p.label}
              </Link>
            ))}
            {prixMax && (
              <Link href={buildLink({ prixMax: '', page: '1' })} className="budget-pill budget-pill--reset">
                ✕ Budget
              </Link>
            )}
          </div>
        </div>

        {/* Tri */}
        <div className="immo-filtres-row">
          <span className="filtres-label">Trier</span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
        </div>
      </div>

      {/* Grille annonces */}
      {annonces.length === 0 ? (
        <div className="empty-state">
          <span style={{ fontSize: 48 }}>🏘</span>
          <p>Aucune annonce trouvée pour ces critères.</p>
          <Link href="/immo" className="budget-pill active" style={{ marginTop: 8 }}>
            Voir toutes les annonces
          </Link>
        </div>
      ) : (
        <div className="immo-grid">
          {annonces.map(a => (
            <ImmoCard key={a.id} a={a} />
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
    </div>
  )
}
