import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import { fcfa } from '@/lib/format'
import ImmoClientWrapper from './ImmoClientWrapper'
import { cloudinaryHQ } from '@/lib/cloudinary'
import ImmoQuartierInput from './ImmoQuartierInput'
import CardActions from '@/app/CardActions'

export const metadata: Metadata = {
  title: 'Immobilier au Sénégal — Location et vente à Dakar',
  description:
    'Annonces immobilières au Sénégal : appartements, villas, terrains à louer ou à vendre à Dakar et dans tout le pays.',
  keywords: [
    'Location chambre Dakar par mois', 'Chambre à louer 30000 par mois',
    'Location chambre Parcelles Assainies par mois', 'Location chambre salle de bain Dakar par mois',
    'Chambre salle de bain à louer par mois', 'Chambre à louer 30000 par mois Dakar',
    'Chambre à louer à Dakar Medina Par mois', 'Chambre à louer 5000f par jour',
  ],
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'}/immo`,
  },
  openGraph: {
    title: 'Immobilier au Sénégal — Appartements, villas, terrains',
    description: 'Trouvez votre bien immobilier au Sénégal : louer ou acheter à Dakar, Saint-Louis, Thiès et partout au pays.',
    type: 'website',
    images: [{ url: '/api/og-image', width: 1200, height: 630, alt: 'Immobilier au Sénégal — Nopalou' }],
  },
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
  meuble: boolean | null
  photos: string[] | null
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

const SURFACE_MIN = [
  { label: '20 m²',  val: '20'  },
  { label: '40 m²',  val: '40'  },
  { label: '60 m²',  val: '60'  },
  { label: '100 m²', val: '100' },
]

const NB_PIECES = [
  { label: '1+', val: '1' },
  { label: '2+', val: '2' },
  { label: '3+', val: '3' },
  { label: '4+', val: '4' },
]

const NB_CHAMBRES = [
  { label: '1+', val: '1' },
  { label: '2+', val: '2' },
  { label: '3+', val: '3' },
  { label: '4+', val: '4' },
]

const VILLES_SN = ['Dakar', 'Pikine', 'Guédiawaye', 'Rufisque', 'Thiès', 'Mbour', 'Saint-Louis', 'Ziguinchor', 'Kaolack', 'Touba']

const TYPE_ICONS: Record<string, string> = {
  appartement:        '🏢',
  appartement_meuble: '🏢',
  villa:              '🏡',
  maison:             '🏠',
  studio:             '🛏',
  chambre:            '🛏',
  chambre_meuble:     '🛏',
  terrain:            '🌿',
  bureau:             '🏢',
}

const SOURCE_LABELS: Record<string, string> = {
  coinafrique: 'CoinAfrique',
  expat:       'Expat-Dakar',
  facebook:    'Facebook',
  manuel:      'Particulier',
}

function ImmoCard({ a }: { a: AnnonceImmo }) {
  const img = Array.isArray(a.photos) ? a.photos[0] ?? null : null
  const localisation = [a.quartier, a.ville].filter(Boolean).join(', ') || 'Sénégal'
  const typeIcon = TYPE_ICONS[a.type_bien ?? ''] ?? '🏠'
  const isVente = a.transaction === 'vente'

  return (
    <Link href={`/immo/${a.id}`} className="immo-card" style={{ position: 'relative' }}>
      <CardActions id={a.id} nom={a.titre} type="immo" />
      <div className="immo-card-img">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cloudinaryHQ(img, { width: 480 })} alt={a.titre} loading="lazy" />
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
          {a.meuble && (
            <span className="immo-spec">Meublé</span>
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
    quartier?: string
    surfaceMin?: string
    nbPieces?: string
    nbChambres?: string
    meuble?: string
    page?: string
  }
}) {
  const transaction = searchParams.transaction ?? 'location'
  const type_bien   = searchParams.type_bien   ?? ''
  const tri         = searchParams.tri         ?? 'recent'
  const prixMax     = searchParams.prixMax     ?? ''
  const ville       = searchParams.ville       ?? ''
  const quartier    = searchParams.quartier    ?? ''
  const surfaceMin  = searchParams.surfaceMin  ?? ''
  const nbPieces    = searchParams.nbPieces    ?? ''
  const nbChambres  = searchParams.nbChambres  ?? ''
  const meuble      = searchParams.meuble      ?? ''
  const page        = searchParams.page        ?? '1'

  const qs = new URLSearchParams()
  qs.set('limit', '24')
  qs.set('page', page)
  qs.set('transaction', transaction)
  if (type_bien)   qs.set('type_bien', type_bien)
  if (tri)         qs.set('tri', tri)
  if (prixMax)     qs.set('prixMax', prixMax)
  if (ville)       qs.set('ville', ville)
  if (quartier)    qs.set('quartier', quartier)
  if (surfaceMin)  qs.set('surfaceMin', surfaceMin)
  if (nbPieces)    qs.set('nbPieces', nbPieces)
  if (nbChambres)  qs.set('nbChambres', nbChambres)
  if (meuble)      qs.set('meuble', meuble)

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
    if (type_bien)  p.set('type_bien', type_bien)
    if (tri)        p.set('tri', tri)
    if (prixMax)    p.set('prixMax', prixMax)
    if (ville)      p.set('ville', ville)
    if (quartier)   p.set('quartier', quartier)
    if (surfaceMin) p.set('surfaceMin', surfaceMin)
    if (nbPieces)   p.set('nbPieces', nbPieces)
    if (nbChambres) p.set('nbChambres', nbChambres)
    if (meuble)     p.set('meuble', meuble)
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
        <ImmoClientWrapper />
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

        {/* Ville */}
        <div className="immo-filtres-row">
          <span className="filtres-label">Ville</span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {VILLES_SN.map(v => (
              <Link key={v} href={buildLink({ ville: ville === v ? '' : v, quartier: '', page: '1' })} className={`budget-pill${ville === v ? ' active' : ''}`}>
                {v}
              </Link>
            ))}
            {ville && <Link href={buildLink({ ville: '', quartier: '', page: '1' })} className="budget-pill budget-pill--reset">✕ Ville</Link>}
          </div>
        </div>

        {/* Quartier */}
        <div className="immo-filtres-row">
          <span className="filtres-label">Quartier</span>
          <Suspense fallback={<span className="immo-quartier-input" style={{display:'inline-block',width:220}}>…</span>}>
            <ImmoQuartierInput currentQuartier={quartier} />
          </Suspense>
        </div>

        {/* Surface min */}
        <div className="immo-filtres-row">
          <span className="filtres-label">Surface min</span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {SURFACE_MIN.map(s => (
              <Link key={s.val} href={buildLink({ surfaceMin: surfaceMin === s.val ? '' : s.val, page: '1' })} className={`budget-pill${surfaceMin === s.val ? ' active' : ''}`}>
                {s.label}
              </Link>
            ))}
            {surfaceMin && <Link href={buildLink({ surfaceMin: '', page: '1' })} className="budget-pill budget-pill--reset">✕ Surface</Link>}
          </div>
        </div>

        {/* Nb pièces */}
        <div className="immo-filtres-row">
          <span className="filtres-label">Pièces</span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {NB_PIECES.map(n => (
              <Link key={n.val} href={buildLink({ nbPieces: nbPieces === n.val ? '' : n.val, page: '1' })} className={`budget-pill${nbPieces === n.val ? ' active' : ''}`}>
                {n.label}
              </Link>
            ))}
            {nbPieces && <Link href={buildLink({ nbPieces: '', page: '1' })} className="budget-pill budget-pill--reset">✕ Pièces</Link>}
          </div>
        </div>

        {/* Nb chambres */}
        <div className="immo-filtres-row">
          <span className="filtres-label">Chambres</span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {NB_CHAMBRES.map(n => (
              <Link key={n.val} href={buildLink({ nbChambres: nbChambres === n.val ? '' : n.val, page: '1' })} className={`budget-pill${nbChambres === n.val ? ' active' : ''}`}>
                {n.label}
              </Link>
            ))}
            {nbChambres && <Link href={buildLink({ nbChambres: '', page: '1' })} className="budget-pill budget-pill--reset">✕ Chambres</Link>}
          </div>
        </div>

        {/* Meublé */}
        <div className="immo-filtres-row">
          <span className="filtres-label">Meublé</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link
              href={buildLink({ meuble: meuble === 'true' ? '' : 'true', page: '1' })}
              className={`budget-pill${meuble === 'true' ? ' active' : ''}`}
            >
              ✅ Meublé
            </Link>
            {meuble && <Link href={buildLink({ meuble: '', page: '1' })} className="budget-pill budget-pill--reset">✕ Meublé</Link>}
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
