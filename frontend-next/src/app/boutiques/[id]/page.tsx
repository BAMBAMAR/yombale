export const dynamic = 'force-dynamic'
export const revalidate = 0

import type { Metadata } from 'next'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import { notFound, redirect } from 'next/navigation'
import { cloudinaryHQ } from '@/lib/cloudinary'
import BoutiqueDetailClient, { type Produit, type Annonce } from './BoutiqueDetailClient'
import { getCategoryCoverPhoto } from '@/lib/boutique-covers'
import ExternalImg from '@/components/ExternalImg'
import BoutonPartager from '@/components/BoutonPartager'

interface Boutique {
  id: string
  slug: string | null
  nom: string
  description: string | null
  categorie: string | null
  telephone: string | null
  whatsapp: string | null
  adresse: string | null
  ville: string
  logo_url: string | null
  cover_url: string | null
  site_web: string | null
  facebook: string | null
  instagram: string | null
  horaires: Record<string, string> | null
  utilisateur_id: string
  plan_actif: 'pro' | 'business' | null
  created_at: string
}

const CAT_ICONS: Record<string, string> = {
  smartphones: '📱', informatique: '💻', 'tv-electro': '📺',
  mode: '👗', maison: '🏠', 'auto-moto': '🚗', jeux: '🎮',
  services: '🛠', alimentation: '🥗', beaute: '💄', autre: '🏪',
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  try {
    const { id } = await params
    const b = await apiFetch<Boutique>(`/boutiques/${id}`)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'
    const ogImageUrl = `${siteUrl}/assets/boutique/${b.id}/og`
    const desc = b.description ? b.description.slice(0, 160) : `Découvrez le catalogue, les nouveautés et les promotions de ${b.nom} à ${b.ville}.`

    return {
      title: `${b.nom} — Vitrine Officielle`,
      description: desc,
      openGraph: {
        title: `${b.nom} — Vitrine Officielle`,
        description: desc,
        url: `${siteUrl}/boutiques/${b.slug || b.id}`,
        siteName: b.nom,
        type: 'website',
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: `${b.nom} — Vitrine Officielle`,
          },
          ...(b.logo_url ? [{ url: b.logo_url, alt: b.nom }] : []),
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${b.nom} — Vitrine Officielle`,
        description: desc,
        images: [ogImageUrl],
      },
    }
  } catch {
    return { title: 'Vitrine Boutique' }
  }
}

export default async function BoutiqueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let boutique: Boutique
  let annonces: Annonce[] = []
  let produits: Produit[] = []

  try {
    boutique = await apiFetch<Boutique>(`/boutiques/${id}`)
  } catch {
    notFound()
  }

  const b = boutique!

  // URL canonique : rediriger vers le slug si on est arrivé via l'UUID
  if (b.slug && id !== b.slug) {
    redirect(`/boutiques/${b.slug}`)
  }

  // Fetch produits + annonces en parallèle — utiliser b.id (UUID) même si params.id est un slug
  await Promise.all([
    apiFetch<{ produits: Produit[] }>(`/boutiques/${b.id}/produits`)
      .then(d => { produits = d.produits ?? [] })
      .catch(() => {}),
    apiFetch<{ annonces: Annonce[] }>(`/annonces?utilisateur_id=${b.utilisateur_id}&limit=24`)
      .then(d => { annonces = d.annonces ?? [] })
      .catch(() => {}),
  ])

  const contactNumber = b.whatsapp || b.telephone
  const whatsappUrl = contactNumber
    ? `https://wa.me/${contactNumber.replace(/\D/g, '')}`
    : null

  return (
    <div className="page-container" style={{ maxWidth: 1440, paddingTop: 0, paddingBottom: '3rem' }}>

      {/* Cover photo HD responsive */}
      <div className="bq-public-cover">
        <ExternalImg
          src={b.cover_url ? cloudinaryHQ(b.cover_url, { width: 1200 }) : getCategoryCoverPhoto(b.nom, b.categorie)}
          alt={b.nom}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, transparent 30%, rgba(0,0,0,.55) 100%)',
        }} />
      </div>

      {/* Header boutique compact */}
      <div className="bq-public-header-card">
        <div style={{ maxWidth: 1350, margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end' }}>
            {/* Logo */}
            <div className="bq-public-logo">
              <ExternalImg src={b.logo_url} alt={b.nom} fallback={CAT_ICONS[b.categorie ?? ''] ?? '🏪'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>

            <div style={{ flex: 1, minWidth: 0, paddingBottom: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h1 style={{ fontFamily: 'var(--font-archivo), sans-serif', fontSize: 'clamp(18px, 4vw, 22px)', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  {b.nom}
                </h1>
                {b.plan_actif === 'business' && (
                  <span style={{ fontSize: 11, background: '#1e3a5f', color: '#fff', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>
                    💼 Business
                  </span>
                )}
                {b.plan_actif === 'pro' && (
                  <span style={{ fontSize: 11, background: '#C75B00', color: '#fff', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>
                    ⭐ Vendeur Pro
                  </span>
                )}
              </div>
              <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {[b.categorie, b.adresse, b.ville].filter(Boolean).join(' · ')}
              </p>
            </div>
          </div>

          {/* Boutons d'action harmonisés */}
          <div className="bq-public-actions-bar">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank" rel="noopener noreferrer"
                className="bq-public-btn-whatsapp"
              >
                💬 WhatsApp
              </a>
            )}
            {b.telephone && (
              <a
                href={`tel:${b.telephone}`}
                className="bq-public-btn-tel"
              >
                📞 {b.telephone}
              </a>
            )}
            <BoutonPartager
              variant="unified"
              className="bq-public-btn-share"
              lien={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'}/boutiques/${b.slug || b.id}`}
              message={`Découvrez la boutique officielle de ${b.nom} sur Nopalou :\n\n${process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'}/boutiques/${b.slug || b.id}`}
              lienVisuel={`/assets/boutique/${b.id}/story`}
            />
            {b.site_web && (
              <a
                href={b.site_web}
                target="_blank" rel="noopener noreferrer"
                className="bq-public-btn-site"
              >
                🌐 Site web
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Contenu avec onglets */}
      <div style={{ maxWidth: 1350, margin: '0 auto', padding: '0 16px' }}>
        {/* Fil d'Ariane ultra-compact */}
        <nav aria-label="Fil d'Ariane" className="bq-breadcrumb-compact">
          <Link href="/boutiques" style={{ color: 'var(--text2, #6B5E52)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span>🏪 Toutes les boutiques</span>
          </Link>
          <span style={{ color: '#cbd5e1' }}>›</span>
          <span style={{ color: 'var(--accent, #C75B00)', fontWeight: 700 }}>
            {b.nom}
          </span>
        </nav>

        <BoutiqueDetailClient
          boutique={{
            id: b.id,
            slug: b.slug,
            nom: b.nom,
            telephone: b.telephone,
            whatsapp: b.whatsapp,
            facebook: b.facebook,
            instagram: b.instagram,
            site_web: b.site_web,
            horaires: b.horaires,
            adresse: b.adresse,
            ville: b.ville,
            categorie: b.categorie,
            description: b.description,
            plan_actif: b.plan_actif,
          }}
          produits={produits}
          annonces={annonces}
        />
      </div>
    </div>
  )
}
