import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { Building2, List, MapPin, CreditCard } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import ImmoClientWrapper from './ImmoClientWrapper'
import ImmoQuartierInput from './ImmoQuartierInput'
import ImmoCard, { type AnnonceImmo, TYPE_ICONS } from './ImmoCard'
import ImmoInteractiveMap from './ImmoInteractiveMap'
import PageHeader from '@/components/PageHeader'
import FiltresBar from '@/components/FiltresBar'
import SeoCard from '@/components/SeoCard'

import { breadcrumbSchema, itemListSchema } from '@/lib/schema-org'

export const metadata: Metadata = {
  title: 'Immobilier Sénégal : Locations & Ventes à Dakar | Nopalou',
  description:
    'Annonces immobilières vérifiées au Sénégal : appartements, chambres au mois dès 25 000 FCFA, studios, villas et terrains avec titres fonciers à Dakar et régions.',
  keywords: [
    'Location chambre Dakar par mois', 'Chambre à louer 30000 par mois',
    'Location chambre Parcelles Assainies par mois', 'Location chambre salle de bain Dakar par mois',
    'Chambre salle de bain à louer par mois', 'Chambre à louer 30000 par mois Dakar',
    'Chambre à louer à Dakar Medina Par mois', 'Location appartement Dakar 2026',
    'Immobilier Sénégal', 'Nopalou Immo'
  ],
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'}/immo`,
  },
  openGraph: {
    title: 'Immobilier Sénégal — Locations & Ventes Vérifiées à Dakar',
    description: 'Appartements, chambres, studios et terrains au Sénégal. Annonces géolocalisées et gestion locative sécurisée.',
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

import {
  TYPE_BIEN,
  TRIS,
  PRIX_MAX_LOCATION,
  PRIX_MAX_VENTE,
  SURFACE_MIN,
  NB_PIECES,
  NB_CHAMBRES,
  VILLES_SN,
} from './ImmoFiltresConfig'

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
    commodite?: string
    vue?: string
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
    commodite?: string
    vue?: string
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
  const commodite   = sp?.commodite   ?? ''
  const vue         = sp?.vue         ?? 'liste'
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
  if (commodite)   qs.set('commodite', commodite)

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
    if (commodite)  p.set('commodite', commodite)
    if (vue && vue !== 'liste') p.set('vue', vue)
    Object.entries(params).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)))
    return `/immo?${p.toString()}`
  }

  const prixOptions = transaction === 'vente' ? PRIX_MAX_VENTE : PRIX_MAX_LOCATION

  const breadcrumbs = breadcrumbSchema([
    { name: 'Accueil', url: '/' },
    { name: 'Immobilier Sénégal', url: '/immo' },
  ])

  const itemList = annonces.length > 0 ? itemListSchema(
    annonces.slice(0, 20).map(a => ({
      name: `${a.titre} - ${a.quartier || a.ville || 'Dakar'}`,
      url: `/immo/${a.id}`,
      image: (Array.isArray(a.photos) && a.photos[0]) ? a.photos[0] : undefined,
      description: a.description ? a.description.slice(0, 150) : `${a.type_bien || 'Bien'} à ${a.transaction || 'louer'} à ${a.ville || 'Dakar'}.`,
    })),
    'Immobilier au Sénégal'
  ) : null

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      {itemList && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
        />
      )}
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
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Commutateur Vue Liste / Carte */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: '#FFFFFF',
              border: '1px solid var(--border, #E8DDD2)',
              borderRadius: 8,
              padding: 3,
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <Link
              href={buildLink({ vue: 'liste' })}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 12px',
                borderRadius: 6,
                fontSize: 12.5,
                fontWeight: 750,
                textDecoration: 'none',
                background: vue !== 'carte' ? 'var(--navy, #1C2B4A)' : 'transparent',
                color: vue !== 'carte' ? '#FFFFFF' : 'var(--navy, #1C2B4A)',
                transition: 'all 0.15s ease',
              }}
            >
              <List size={14} />
              <span>Liste</span>
            </Link>
            <Link
              href={buildLink({ vue: 'carte' })}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 12px',
                borderRadius: 6,
                fontSize: 12.5,
                fontWeight: 750,
                textDecoration: 'none',
                background: vue === 'carte' ? 'var(--accent, #C75B00)' : 'transparent',
                color: vue === 'carte' ? '#FFFFFF' : 'var(--navy, #1C2B4A)',
                transition: 'all 0.15s ease',
              }}
            >
              <MapPin size={14} />
              <span>Carte</span>
            </Link>
          </div>

          <Link
            href="/agences"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 16px',
              borderRadius: 8,
              background: '#FFFFFF',
              border: '1px solid var(--border, #E8DDD2)',
              color: 'var(--navy, #1C2B4A)',
              fontWeight: 750,
              fontSize: 13,
              textDecoration: 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <Building2 size={15} style={{ color: 'var(--accent, #C75B00)' }} />
            Agences Immobilières
          </Link>

          <Link
            href="/payer-loyer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 16px',
              borderRadius: 8,
              background: '#DCFCE7',
              border: '1.5px solid #BBF7D0',
              color: '#15803D',
              fontWeight: 800,
              fontSize: 13,
              textDecoration: 'none',
              boxShadow: '0 1px 3px rgba(16,185,129,0.1)',
            }}
          >
            <CreditCard size={15} color="#16a34a" />
            <span>Payer mon Loyer</span>
          </Link>
          <ImmoClientWrapper />
        </div>
      </div>

      {/* ── BANDEAU APPEL D'AIR LOCATAIRES : PAIEMENT WAVE & QUITTANCE OHADA ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #F8F5F0 0%, #FFFFFF 100%)',
          border: '1px solid var(--border, #E8DDD2)',
          borderRadius: 14,
          padding: '12px 18px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
            Espace Locataires :
          </span>
          <span style={{ fontSize: 13, color: 'var(--text2, #5A4E42)' }}>
            Réglez votre loyer par <strong>Wave</strong> ou <strong>Orange Money</strong> et téléchargez instantanément votre quittance officielle certifiée avec QR Code.
          </span>
        </div>
        <Link
          href="/payer-loyer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--navy, #1C2B4A)',
            color: '#ffffff',
            padding: '7px 14px',
            borderRadius: 8,
            fontSize: 12.5,
            fontWeight: 800,
            textDecoration: 'none',
            whiteSpace: 'nowrap'
          }}
        >
          <span>Accéder au paiement</span>
          <span>→</span>
        </Link>
      </div>

      {/* Barre de filtres */}
      <FiltresBar
        essentiels={[
          {
            key: 'transaction-location',
            label: 'Location',
            href: buildLink({ transaction: 'location', prixMax: '', page: '1' }),
            active: transaction === 'location',
          },
          {
            key: 'transaction-vente',
            label: 'Vente',
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
              label: `${ville}`,
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
            label: `${v}`,
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
            label: 'Meublé',
            href: buildLink({ meuble: meuble === 'true' ? '' : 'true', page: '1' }),
            active: meuble === 'true',
          },
          {
            key: 'comm-groupe',
            label: 'Groupe électrogène',
            href: buildLink({ commodite: commodite === 'groupe' ? '' : 'groupe', page: '1' }),
            active: commodite === 'groupe',
          },
          {
            key: 'comm-suppresseur',
            label: 'Suppresseur eau',
            href: buildLink({ commodite: commodite === 'suppresseur' ? '' : 'suppresseur', page: '1' }),
            active: commodite === 'suppresseur',
          },
          {
            key: 'comm-titre',
            label: 'Titre Foncier / Bail',
            href: buildLink({ commodite: commodite === 'titre_foncier' ? '' : 'titre_foncier', page: '1' }),
            active: commodite === 'titre_foncier',
          },
          {
            key: 'comm-gardien',
            label: 'Gardiennage 24/7',
            href: buildLink({ commodite: commodite === 'gardien' ? '' : 'gardien', page: '1' }),
            active: commodite === 'gardien',
          },
        ]}
        tri={TRIS.map(t => ({
          key: t.val,
          label: t.label,
          href: buildLink({ tri: t.val, page: '1' }),
          active: tri === t.val,
        }))}
      />

      {/* Quartier — champ texte avec autocomplétion */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, marginBottom: 20 }}>
        <span className="filtres-label">Quartier</span>
        <Suspense fallback={<span className="immo-quartier-input" style={{display:'inline-block',width:220}}>…</span>}>
          <ImmoQuartierInput currentQuartier={quartier} />
        </Suspense>
      </div>

      {/* Vue Carte Interactive si activée */}
      {vue === 'carte' && <ImmoInteractiveMap annonces={annonces} />}

      {/* Grille annonces */}
      {annonces.length === 0 ? (
        <div className="empty-state">
          <Building2 size={44} style={{ color: 'var(--accent, #C75B00)', margin: '0 auto 12px' }} />
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
            emoji: '',
            text: (
              <>
                Nopalou regroupe les annonces immobilières publiées directement par les propriétaires et agences,
                ainsi que celles importées des principales plateformes du Sénégal — pour vous éviter de multiplier les sites.
              </>
            ),
          },
          {
            emoji: '',
            text: (
              <>
                Location ou vente, appartement, villa, studio ou terrain — filtrez par budget, ville et commodités (groupe, suppresseur, titre foncier)
                pour trouver le bien qui correspond exactement à votre recherche, partout à <strong>Dakar</strong> et dans les régions.
              </>
            ),
          },
        ]}
        chipRows={[
          {
            label: 'Recherches populaires',
            chips: [
              { href: '/immo/location-appartement-dakar', emoji: '', label: 'Location appartement Dakar' },
              { href: '/immo/location-chambre-dakar', emoji: '', label: 'Chambre à louer Dakar' },
              { href: '/immo/location-studio-dakar', emoji: '', label: 'Studio à louer Dakar' },
              { href: '/immo/vente-terrain-dakar', emoji: '', label: 'Terrain à vendre Dakar' },
              { href: '/immo/vente-maison-dakar', emoji: '', label: 'Maison à vendre Dakar' },
            ],
          },
        ]}
        foot="Nouvelles annonces publiées chaque jour par des particuliers et agences au Sénégal"
      />
    </div>
    </>
  )
}
