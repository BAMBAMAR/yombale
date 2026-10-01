import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import AnnonceGallery from './AnnonceGallery'
import MaskedContactPhone from '@/components/MaskedContactPhone'
import { apiFetch } from '@/lib/api'
import PageHeader from '@/components/PageHeader'
import { safeJsonLd } from '@/lib/jsonld'
import { sanitizeImgUrl } from '@/lib/sanitizeImg'
import { nettoyerTexteAnnonce, titreAffichableAnnonce, descriptionMetaAnnonce } from '@/lib/annonce-texte'

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
  contact_tel_masque?: string | null
  contact_tel_disponible?: boolean
  contact_sur_facebook?: boolean
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

// AUD-155 : titre et description publics = texte nettoyé (sans numéro, lien ni lettres éparpillées)
function vueTexteAnnonce(annonce: Annonce) {
  const lieu = annonce.ville ?? 'Dakar'
  const categorie = CAT_LABELS[annonce.categorie_slug] ?? annonce.categorie_slug
  const titre = titreAffichableAnnonce(annonce.titre, annonce.description, `Annonce ${categorie} à ${lieu}`)
  const description = nettoyerTexteAnnonce(annonce.description)
  const descriptionMeta = descriptionMetaAnnonce(
    annonce.description,
    `${titre} à ${lieu}. ${formatPrix(annonce.prix)}. Contactez l'annonceur sur Nopalou.`,
  )
  return { titre, description, descriptionMeta }
}

const MOIS_LONGS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
]

function formatDate(s: string) {
  if (!s) return ''
  const d = new Date(s)
  if (isNaN(d.getTime())) return ''
  const day = String(d.getDate()).padStart(2, '0')
  return `${day} ${MOIS_LONGS[d.getMonth()] || ''} ${d.getFullYear()}`
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id: rawId } = await params
  let id = rawId || ''
  try { id = decodeURIComponent(id) } catch {}
  const cleanId = id.replace(/(\{\{\d+\}\}|%7B%7B\d+%7D%7D|\{\d+\}|%7B\d+%7D)/gi, '').trim()

  const annonce = await fetchAnnonce(cleanId || id)
  if (!annonce) return { title: 'Annonce introuvable' }

  const { titre, descriptionMeta: desc } = vueTexteAnnonce(annonce)
  // URL d'image Facebook/Instagram à signature expirée : écartée (aperçu cassé sinon)
  const mainPhoto = sanitizeImgUrl(annonce.photos?.[0])
  const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'

  return {
    title: titre,
    description: desc,
    alternates: { canonical: `${BASE}/annonces/${cleanId || id}` },
    openGraph: {
      title: titre,
      description: desc,
      type: 'website',
      url: `${BASE}/annonces/${cleanId || id}`,
      ...(mainPhoto ? { images: [{ url: mainPhoto, width: 800, height: 600, alt: titre }] } : {}),
    },
  }
}

function buildAnnonceJsonLd(annonce: Annonce): string {
  const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'
  const { titre, description } = vueTexteAnnonce(annonce)
  const image = sanitizeImgUrl(annonce.photos?.[0])
  return safeJsonLd({
    '@context': 'https://schema.org',
    '@type': 'ItemPage',
    name: titre,
    description: description || undefined,
    url: `${BASE}/annonces/${annonce.id}`,
    ...(image ? { image } : {}),
    ...(annonce.prix ? {
      offers: {
        '@type': 'Offer',
        price: annonce.prix,
        priceCurrency: 'XOF',
        availability: 'https://schema.org/InStock',
        // Le nom d'un particulier n'est pas publié dans les données structurées
        seller: {
          '@type': 'Person',
          name: 'Vendeur particulier',
        },
      },
    } : {}),
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: `${BASE}/` },
        { '@type': 'ListItem', position: 2, name: 'Annonces', item: `${BASE}/annonces` },
        { '@type': 'ListItem', position: 3, name: titre },
      ],
    },
  })
}

export default async function AnnonceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params
  if (!rawId) redirect('/annonces')

  let id = rawId
  try { id = decodeURIComponent(id) } catch {}
  const cleanId = id.replace(/(\{\{\d+\}\}|%7B%7B\d+%7D%7D|\{\d+\}|%7B\d+%7D)/gi, '').trim()

  if (cleanId && cleanId !== rawId) {
    redirect(`/annonces/${cleanId}`)
  }

  let annonce = await fetchAnnonce(cleanId || id)
  if (!annonce) {
    // Redirection automatique via résolveur d'entités (immo, boutique, produit marchand, commande)
    try {
      const resolved = await apiFetch<{ found: boolean; type: string; url: string }>(`/entites/resoudre/${encodeURIComponent(cleanId || id)}`);
      if (resolved && resolved.found && resolved.url && resolved.url !== `/annonces/${rawId}`) {
        redirect(resolved.url);
      }
    } catch (rErr) {
      if ((rErr as any)?.digest?.startsWith('NEXT_REDIRECT')) throw rErr;
    }

    // Redirection de repli sans 404
    redirect('/annonces')
  }

  const { titre, description } = vueTexteAnnonce(annonce)
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
          { label: titre.length > 40 ? `${titre.slice(0, 40)}…` : titre }
        ]}
        titre={titre}
      />

      <div className="annonce-detail-layout">
        {/* Colonne gauche — contenu */}
        <div className="annonce-detail-main">
          {/* Galerie photos */}
          <AnnonceGallery photos={photos} titre={titre} />

          {/* Titre + meta */}
          <div className="annonce-detail-header" style={{ marginTop: 16 }}>
            <span className="annonce-detail-cat">
              {CAT_LABELS[annonce.categorie_slug] ?? annonce.categorie_slug}
            </span>
            <div className="annonce-detail-meta-row">
              <span>{annonce.quartier ? `${annonce.quartier}, ` : ''}{annonce.ville ?? 'Dakar'}</span>
              <span suppressHydrationWarning>{formatDate(annonce.created_at)}</span>
            </div>
          </div>

          {/* Prix */}
          <div className="annonce-detail-prix-box">
            <p className="annonce-detail-prix">{formatPrix(annonce.prix)}</p>
          </div>

          {/* Description */}
          {description && (
            <div className="annonce-detail-section">
              <h2 className="annonce-detail-section-titre">Description</h2>
              <p className="annonce-detail-description">{description}</p>
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
            {annonce.contact_sur_facebook ? (
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
            ) : annonce.contact_tel_disponible ? (
              <MaskedContactPhone
                masque={annonce.contact_tel_masque ?? null}
                titre={titre}
                prix={annonce.prix ?? undefined}
                annonceId={annonce.id}
                baseUrl={process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'}
              />
            ) : null}
            <p className="annonce-contact-warn">
              Ne payez jamais à l&apos;avance sans avoir vu le produit.
            </p>
            <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px dashed #cbd5e1', fontSize: '0.78rem', color: '#64748b', textAlign: 'center', lineHeight: '1.4' }}>
              Vous souhaitez retirer cette annonce ou votre numéro ? <a href="/cgu#suppression-donnees" style={{ color: 'var(--navy)', fontWeight: 700, textDecoration: 'underline' }}>Cliquez ici</a> ou envoyez &quot;supprimer&quot; sur <a href="https://wa.me/221708717942" target="_blank" rel="noopener noreferrer" style={{ color: '#25D366', fontWeight: 700, textDecoration: 'underline' }}>WhatsApp</a>.
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
