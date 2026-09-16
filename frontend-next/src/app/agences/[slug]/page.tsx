import type { Metadata } from 'next'
import { apiFetch } from '@/lib/api'
import AgenceVitrinePubliquePage from '../../agence/[slug]/vitrine/page'

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'

interface AgenceData {
  id: string
  nom: string
  slug: string
  description?: string
  logo_url?: string
  ville?: string
  quartier?: string
  adresse?: string
  telephone?: string
  whatsapp?: string
  email_contact?: string
  site_web?: string
  numero_agrement?: string
}

async function getAgence(slug: string): Promise<AgenceData | null> {
  try {
    const data = await apiFetch<{ success: boolean; agence: AgenceData }>(`/agences/public/${slug}`)
    if (data.success && data.agence) {
      return data.agence
    }
  } catch {
    // Fallback silencieux en cas d'erreur de récupération
  }
  return null
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const agence = await getAgence(slug)

  if (!agence) {
    return {
      title: 'Agence Immobilière au Sénégal — Nopalou Immo',
      description: 'Découvrez la vitrine officielle et le catalogue de biens de cette agence immobilière partenaire.',
    }
  }

  const titre = `${agence.nom} — Agence Immobilière à ${agence.ville || 'Dakar'} | Nopalou Immo`
  const description = agence.description
    ? agence.description.slice(0, 155)
    : `Consultez les offres immobilières, appartements et villas à louer et à vendre de ${agence.nom} à ${agence.ville || 'Dakar'}.`

  return {
    title: titre,
    description,
    alternates: {
      canonical: `${BASE}/agences/${slug}`,
    },
    openGraph: {
      title: titre,
      description,
      url: `${BASE}/agences/${slug}`,
      images: agence.logo_url ? [{ url: agence.logo_url }] : undefined,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: titre,
      description,
    },
  }
}

export default async function AgencePubliquePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const agence = await getAgence(slug)

  const jsonLd = agence
    ? {
        '@context': 'https://schema.org',
        '@type': 'RealEstateAgent',
        name: agence.nom,
        description: agence.description || undefined,
        url: `${BASE}/agences/${slug}`,
        telephone: agence.telephone || agence.whatsapp || undefined,
        email: agence.email_contact || undefined,
        image: agence.logo_url || undefined,
        address: {
          '@type': 'PostalAddress',
          streetAddress: agence.adresse || agence.quartier || undefined,
          addressLocality: agence.ville || 'Dakar',
          addressCountry: 'SN',
        },
        priceRange: 'FCFA',
      }
    : null

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <AgenceVitrinePubliquePage />
    </>
  )
}
