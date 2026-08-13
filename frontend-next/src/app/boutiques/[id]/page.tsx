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
    return {
      title: `${b.nom} — Boutique sur Nopalou`,
      description: b.description ?? `Boutique de ${b.ville} sur Nopalou`,
      openGraph: b.logo_url ? { images: [b.logo_url] } : undefined,
    }
  } catch {
    return { title: 'Boutique' }
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

      {/* Cover photo HD */}
      <div style={{
        width: '100%', height: 220, background: '#f1f5f9',
        position: 'relative', overflow: 'hidden', marginBottom: 0,
      }}>
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

      {/* Header boutique */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #e5e7eb',
        padding: '0 20px 20px', marginBottom: 24,
        position: 'relative', zIndex: 5,
      }}>
        <div style={{ maxWidth: 1350, margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', marginTop: -44 }}>
            {/* Logo */}
            <div style={{
              width: 88, height: 88, borderRadius: 14, overflow: 'hidden', flexShrink: 0,
              border: '4px solid #fff', background: '#f8fafc',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(0,0,0,.18)',
              position: 'relative', zIndex: 10,
            }}>
              <ExternalImg src={b.logo_url} alt={b.nom} fallback={CAT_ICONS[b.categorie ?? ''] ?? '🏪'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>

            <div style={{ flex: 1, paddingBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h1 style={{ fontFamily: 'var(--font-archivo), sans-serif', fontSize: 22, fontWeight: 800, margin: 0 }}>
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
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>
                {[b.categorie, b.adresse, b.ville].filter(Boolean).join(' · ')}
              </p>
            </div>
          </div>

          {/* Boutons d'action */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: '#25d366', color: '#fff', padding: '9px 18px',
                  borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 14,
                }}
              >
                💬 WhatsApp
              </a>
            )}
            {b.telephone && (
              <a
                href={`tel:${b.telephone}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: '#f0f9ff', color: '#1d4ed8', border: '1px solid #bfdbfe',
                  padding: '9px 18px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 14,
                }}
              >
                📞 {b.telephone}
              </a>
            )}
            {b.site_web && (
              <a
                href={b.site_web}
                target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: '#f8fafc', color: '#374151', border: '1px solid #e5e7eb',
                  padding: '9px 18px', borderRadius: 10, textDecoration: 'none', fontWeight: 600, fontSize: 14,
                }}
              >
                🌐 Site web
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Contenu avec onglets */}
      <div style={{ maxWidth: 1350, margin: '0 auto', padding: '0 20px' }}>
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

        <div style={{ marginTop: 32 }}>
          <Link href="/boutiques" style={{ color: '#6b7280', textDecoration: 'none', fontSize: 14 }}>
            ← Toutes les boutiques
          </Link>
        </div>
      </div>
    </div>
  )
}
