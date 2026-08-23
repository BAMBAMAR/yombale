import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import ImmoClientWrapper from './ImmoClientWrapper'
import ImmoQuartierInput from './ImmoQuartierInput'
import ImmoCard, { type AnnonceImmo, TYPE_ICONS } from './ImmoCard'
import PageHeader from '@/components/PageHeader'
import FiltresBar from '@/components/FiltresBar'
import SeoCard from '@/components/SeoCard'

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

export default async function ImmoPage({
  searchParams,
}: {
  searchParams: Promise<{
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
  }> | {
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
  const sp = await Promise.resolve(searchParams)
  const transaction = sp?.transaction ?? 'location'
  const type_bien   = sp?.type_bien   ?? ''
  const tri         = sp?.tri         ?? 'recent'
  const prixMax     = sp?.prixMax     ?? ''
  const ville       = sp?.ville       ?? ''
  const quartier    = sp?.quartier    ?? ''
  const surfaceMin  = sp?.surfaceMin  ?? ''
  const nbPieces    = sp?.nbPieces    ?? ''
  const nbChambres  = sp?.nbChambres  ?? ''
  const meuble      = sp?.meuble      ?? ''
  const page        = sp?.page        ?? '1'

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
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <PageHeader
          breadcrumb={[{ label: 'Accueil', href: '/' }, { label: 'Immobilier' }]}
          titre="Immobilier au Sénégal"
          compteur={total > 0
            ? `${total.toLocaleString('fr-FR')} annonce${total > 1 ? 's' : ''} disponible${total > 1 ? 's' : ''}`
            : 'Trouvez votre bien idéal'}
        />
        <ImmoClientWrapper />
      </div>

      {/* Barre de filtres */}
      <FiltresBar
        essentiels={[
          {
            key: 'transaction-location',
            label: '🏠 Location',
            href: buildLink({ transaction: 'location', prixMax: '', page: '1' }),
            active: transaction === 'location',
          },
          {
            key: 'transaction-vente',
            label: '🔑 Vente',
            href: buildLink({ transaction: 'vente', prixMax: '', page: '1' }),
            active: transaction === 'vente',
          },
          ...TYPE_BIEN.map(t => ({
            key: `type-${t.val || 'tous'}`,
            label: t.val ? `${TYPE_ICONS[t.val] ?? ''} ${t.label}` : t.label,
            href: buildLink({ type_bien: t.val, page: '1' }),
            active: type_bien === t.val,
          })),
          ...prixOptions.map(p => ({
            key: `prix-${p.val}`,
            label: p.label,
            href: buildLink({ prixMax: p.val, page: '1' }),
            active: prixMax === p.val,
          })),
          ...(prixMax ? [{
            key: 'reset-budget',
            label: '✕ Budget',
            href: buildLink({ prixMax: '', page: '1' }),
            active: false,
            reset: true,
          }] : []),
          ...(ville ? [
            {
              key: `ville-${ville}`,
              label: `📍 ${ville}`,
              href: buildLink({ ville, quartier: '', page: '1' }),
              active: true,
            },
            {
              key: 'reset-ville',
              label: '✕ Ville',
              href: buildLink({ ville: '', quartier: '', page: '1' }),
              active: false,
              reset: true,
            }
          ] : []),
        ]}
        secondaires={[
          ...VILLES_SN.map(v => ({
            key: `ville-${v}`,
            label: `📍 ${v}`,
            href: buildLink({ ville: ville === v ? '' : v, quartier: '', page: '1' }),
            active: ville === v,
          })),
          ...SURFACE_MIN.map(s => ({
            key: `surface-${s.val}`,
            label: `${s.label}+`,
            href: buildLink({ surfaceMin: surfaceMin === s.val ? '' : s.val, page: '1' }),
            active: surfaceMin === s.val,
          })),
          ...NB_PIECES.map(n => ({
            key: `pieces-${n.val}`,
            label: `${n.label} pièce${n.val !== '1' ? 's' : ''}`,
            href: buildLink({ nbPieces: nbPieces === n.val ? '' : n.val, page: '1' }),
            active: nbPieces === n.val,
          })),
          ...NB_CHAMBRES.map(n => ({
            key: `chambres-${n.val}`,
            label: `${n.label} chambre${n.val !== '1' ? 's' : ''}`,
            href: buildLink({ nbChambres: nbChambres === n.val ? '' : n.val, page: '1' }),
            active: nbChambres === n.val,
          })),
          {
            key: 'meuble',
            label: '✅ Meublé',
            href: buildLink({ meuble: meuble === 'true' ? '' : 'true', page: '1' }),
            active: meuble === 'true',
          },
        ]}
        tri={TRIS.map(t => ({
          key: t.val,
          label: t.label,
          href: buildLink({ tri: t.val, page: '1' }),
          active: tri === t.val,
        }))}
      />

      {/* Quartier — champ texte, garde son propre input, affiché sous la barre de pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, marginBottom: 20 }}>
        <span className="filtres-label">Quartier</span>
        <Suspense fallback={<span className="immo-quartier-input" style={{display:'inline-block',width:220}}>…</span>}>
          <ImmoQuartierInput currentQuartier={quartier} />
        </Suspense>
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

      <SeoCard
        titre="Pourquoi chercher votre bien immobilier sur Nopalou ?"
        blurbs={[
          {
            emoji: '🏘',
            text: (
              <>
                Nopalou regroupe les annonces immobilières publiées directement par les propriétaires et agences,
                ainsi que celles importées des principales plateformes du Sénégal — pour vous éviter de multiplier les sites.
              </>
            ),
          },
          {
            emoji: '📍',
            text: (
              <>
                Location ou vente, appartement, villa, studio ou terrain — filtrez par budget, ville et surface pour trouver
                le bien qui correspond exactement à votre recherche, partout à <strong>Dakar</strong> et dans les grandes villes du Sénégal.
              </>
            ),
          },
        ]}
        chipRows={[
          {
            label: 'Recherches populaires',
            chips: [
              { href: '/immo/location-appartement-dakar', emoji: '🏢', label: 'Location appartement Dakar' },
              { href: '/immo/location-chambre-dakar', emoji: '🛏️', label: 'Chambre à louer Dakar' },
              { href: '/immo/location-studio-dakar', emoji: '🏠', label: 'Studio à louer Dakar' },
              { href: '/immo/vente-terrain-dakar', emoji: '🗺️', label: 'Terrain à vendre Dakar' },
              { href: '/immo/vente-maison-dakar', emoji: '🏡', label: 'Maison à vendre Dakar' },
            ],
          },
        ]}
        foot="Nouvelles annonces publiées chaque jour par des particuliers et agences au Sénégal"
      />
    </div>
  )
}
