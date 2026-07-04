import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import AnnonceGallery from './AnnonceGallery'
import { getOptionalSession } from '@/lib/dal'
import BoutonWhatsApp from '@/components/BoutonWhatsApp'

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
  jeux:         'Jeux',
  services:     'Services',
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
  caracteristiques: Record<string, string> | null
  created_at: string
}

async function fetchAnnonce(id: string): Promise<Annonce | null> {
  try {
    const r = await fetch(`${BACKEND}/api/annonces/${id}`, { headers: SSR_HEADERS, next: { revalidate: 120 } })
    if (r.status === 404) return null
    if (!r.ok) return null
    return r.json()
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
  const session = await getOptionalSession()

  const photos = Array.isArray(annonce.photos) ? annonce.photos : []
  const car = annonce.caracteristiques ?? {}
  const carEntries = Object.entries(car).filter(([, v]) => v && String(v).trim())

  return (
    <div className="annonce-detail-page">
      {/* Breadcrumb */}
      <nav className="annonce-detail-breadcrumb">
        <Link href="/">Accueil</Link>
        <span>›</span>
        <Link href="/annonces">Annonces</Link>
        <span>›</span>
        <Link href={`/annonces?categorie=${annonce.categorie_slug}`}>
          {CAT_LABELS[annonce.categorie_slug] ?? annonce.categorie_slug}
        </Link>
        <span>›</span>
        <span>{annonce.titre.slice(0, 40)}{annonce.titre.length > 40 ? '…' : ''}</span>
      </nav>

      <div className="annonce-detail-layout">
        {/* Colonne gauche — contenu */}
        <div className="annonce-detail-main">
          {/* Galerie photos */}
          <AnnonceGallery photos={photos} titre={annonce.titre} />

          {/* Titre + meta */}
          <div className="annonce-detail-header">
            <span className="annonce-detail-cat">
              {CAT_LABELS[annonce.categorie_slug] ?? annonce.categorie_slug}
            </span>
            <h1 className="annonce-detail-titre">{annonce.titre}</h1>
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
            <a
              href={`tel:${annonce.contact_tel}`}
              className="annonce-contact-tel"
            >
              📞 {annonce.contact_tel}
            </a>
            <a
              href={`https://wa.me/${annonce.contact_tel.replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour, je suis intéressé(e) par votre annonce :\n\n*${annonce.titre}*${annonce.prix ? ` — ${formatPrix(annonce.prix)}` : ''}\n\n${process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'}/annonces/${annonce.id}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="annonce-contact-whatsapp"
            >
              WhatsApp
            </a>
            <BoutonWhatsApp type="annonce" id={annonce.id} isConnecte={!!session} />
            <p className="annonce-contact-warn">
              ⚠️ Ne payez jamais à l&apos;avance sans avoir vu le produit.
            </p>
          </div>

          <div className="annonce-contact-nav">
            <Link href="/annonces" className="annonce-contact-back">
              ← Retour aux annonces
            </Link>
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
