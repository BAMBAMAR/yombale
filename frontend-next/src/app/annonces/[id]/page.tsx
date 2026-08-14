import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import AnnonceGallery from './AnnonceGallery'
import MaskedContactPhone from '@/components/MaskedContactPhone'
import { apiFetch } from '@/lib/api'
import PageHeader from '@/components/PageHeader'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'
const SSR_SECRET = process.env.SSR_SECRET || ''
const SSR_HEADERS: Record<string, string> = SSR_SECRET ? { 'X-SSR-Token': SSR_SECRET } : {}

const CAT_LABELS: Record<string, string> = {
  smartphones:  'Téléphones',
  informatique: 'Informatique',
  'tv-electro': 'TV & Électro',
  mode:         'Mode',
  maison:       'Maison',
  'auto-moto':  'Auto & Moto',
  immo:         'Immobilier',
  beaute:       'Beauté',
  emploi:       'Emploi',
  jeux:         'Jeux',
  services:     'Services',
  divers:       'Divers',
}

interface Annonce {
  id: string
  titre: string
  description: string | null
  prix: number | null
  ville: string | null
  quartier: string | null
  categorie_slug: string
  photos: string[]
  contact_nom: string | null
  contact_tel: string
  url_source: string | null
  caracteristiques: Record<string, string> | null
  created_at: string
}

async function fetchAnnonce(id: string): Promise<Annonce | null> {
  try {
    return await apiFetch<Annonce>(`/annonces/${id}`)
  } catch { return null }
}

function formatPrix(p: number | null) {
  if (!p) return 'Prix à négocier'
  return new Intl.NumberFormat('fr-SN').format(p) + ' FCFA'
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('fr-SN', { day: '2-digit', month: 'long', year: 'numeric' })
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const annonce = await fetchAnnonce(id)
  if (!annonce) return { title: 'Annonce introuvable' }

  const titre = annonce.titre
  const desc = annonce.description?.slice(0, 155) ??
    `${annonce.titre} — ${annonce.ville ?? 'Dakar'}, ${formatPrix(annonce.prix)}`
  const mainPhoto = annonce.photos?.[0] ?? null
  const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'

  return {
    title: titre,
    description: desc,
    alternates: { canonical: `${BASE}/annonces/${id}` },
    openGraph: {
      title: titre,
      description: desc,
      type: 'website',
      url: `${BASE}/annonces/${id}`,
      ...(mainPhoto ? { images: [{ url: mainPhoto, width: 800, height: 600, alt: titre }] } : {}),
    },
  }
}

function buildAnnonceJsonLd(annonce: Annonce): string {
  const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ItemPage',
    name: annonce.titre,
    description: annonce.description ?? undefined,
    url: `${BASE}/annonces/${annonce.id}`,
    ...(annonce.photos?.[0] ? { image: annonce.photos[0] } : {}),
    ...(annonce.prix ? {
      offers: {
        '@type': 'Offer',
        price: annonce.prix,
        priceCurrency: 'XOF',
        availability: 'https://schema.org/InStock',
        seller: {
          '@type': 'Person',
          name: annonce.contact_nom ?? 'Vendeur particulier',
        },
      },
    } : {}),
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: `${BASE}/` },
        { '@type': 'ListItem', position: 2, name: 'Annonces', item: `${BASE}/annonces` },
        { '@type': 'ListItem', position: 3, name: annonce.titre },
      ],
    },
  })
}

export default async function AnnonceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const annonce = await fetchAnnonce(id)
  if (!annonce) notFound()

  const photos = Array.isArray(annonce.photos) ? annonce.photos : []
  const car = annonce.caracteristiques ?? {}
  const carEntries = Object.entries(car).filter(([, v]) => v && String(v).trim())

  return (
    <div className="annonce-detail-page">
      <PageHeader
        breadcrumb={[
          { label: 'Accueil', href: '/' },
          { label: 'Annonces', href: '/annonces' },
          { label: CAT_LABELS[annonce.categorie_slug] ?? annonce.categorie_slug, href: `/annonces?categorie=${annonce.categorie_slug}` },
          { label: annonce.titre.length > 40 ? `${annonce.titre.slice(0, 40)}…` : annonce.titre }
        ]}
        titre={annonce.titre}
      />

      <div className="annonce-detail-layout">
        {/* Colonne gauche — contenu */}
        <div className="annonce-detail-main">
          {/* Galerie photos */}
          <AnnonceGallery photos={photos} titre={annonce.titre} />

          {/* Titre + meta */}
          <div className="annonce-detail-header" style={{ marginTop: 16 }}>
            <span className="annonce-detail-cat">
              {CAT_LABELS[annonce.categorie_slug] ?? annonce.categorie_slug}
            </span>
            <div className="annonce-detail-meta-row">
              <span>📍 {annonce.quartier ? `${annonce.quartier}, ` : ''}{annonce.ville ?? 'Dakar'}</span>
              <span>🗓 {formatDate(annonce.created_at)}</span>
            </div>
          </div>

          {/* Prix */}
          <div className="annonce-detail-prix-box">
            <p className="annonce-detail-prix">{formatPrix(annonce.prix)}</p>
          </div>

          {/* Description */}
          {annonce.description && (
            <div className="annonce-detail-section">
              <h2 className="annonce-detail-section-titre">Description</h2>
              <p className="annonce-detail-description">{annonce.description}</p>
            </div>
          )}

          {/* Caractéristiques */}
          {carEntries.length > 0 && (
            <div className="annonce-detail-section">
              <h2 className="annonce-detail-section-titre">Caractéristiques</h2>
              <dl className="annonce-detail-specs">
                {carEntries.map(([k, v]) => (
                  <div key={k} className="annonce-detail-spec-row">
                    <dt className="annonce-detail-spec-key">
                      {k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </dt>
                    <dd className="annonce-detail-spec-val">{String(v)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>

        {/* Colonne droite — contact sticky */}
        <aside className="annonce-detail-sidebar">
          <div className="annonce-contact-card">
            <p className="annonce-contact-titre">Contacter le vendeur</p>
            {annonce.contact_nom && (
              <p className="annonce-contact-nom">{annonce.contact_nom}</p>
            )}
            {annonce.contact_tel === 'Voir sur Facebook' ? (
              annonce.url_source && (
                <a
                  href={annonce.url_source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="annonce-contact-tel"
                >
                  📘 Voir sur Facebook
                </a>
              )
            ) : (
              <MaskedContactPhone
                phone={annonce.contact_tel}
                titre={annonce.titre}
                prix={annonce.prix ?? undefined}
                annonceId={annonce.id}
                baseUrl={process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'}
              />
            )}
            <p className="annonce-contact-warn">
              ⚠️ Ne payez jamais à l&apos;avance sans avoir vu le produit.
            </p>
            <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px dashed #cbd5e1', fontSize: '0.78rem', color: '#64748b', textAlign: 'center', lineHeight: '1.4' }}>
              🗑️ Vous souhaitez retirer cette annonce ou votre numéro ? <a href="/cgu#suppression-donnees" style={{ color: '#0284c7', textDecoration: 'underline' }}>Cliquez ici</a> ou envoyez &quot;supprimer&quot; sur <a href="https://wa.me/221708717942" target="_blank" rel="noopener noreferrer" style={{ color: '#16a34a', textDecoration: 'underline' }}>WhatsApp</a>.
            </div>
          </div>

          <div className="annonce-contact-nav">
            <Link href="/deposer-annonce" className="annonce-contact-deposer">
              + Publier une annonce
            </Link>
          </div>
        </aside>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: buildAnnonceJsonLd(annonce) }}
      />
    </div>
  )
}
