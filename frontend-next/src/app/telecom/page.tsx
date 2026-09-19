import type { Metadata } from 'next'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import { fcfa } from '@/lib/format'
import TelecomClient from './TelecomClient'

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'

export const metadata: Metadata = {
  title: 'Forfaits Télécom Sénégal 2026 : Comparateur Pass Internet Orange, Yas, Promobile & Expresso',
  description: 'Comparez les forfaits internet et appels au Sénégal (Orange, Yas ex-Free, Promobile, Expresso). Calcul du coût réel par Go, pass illimix et catalogue officiel ARTP 2026.',
  keywords: [
    'Forfait Orange Sénégal', 'Forfait Internet Orange Sénégal', 'Promobile forfait internet',
    'Promobile forfait appel', 'Forfait illimix Orange', 'Forfait Promobile',
    'Forfait Orange appel', 'Forfait mobile sénégal 2026', 'Promo pass internet Senegal',
  ],
  alternates: { canonical: `${BASE}/telecom` },
}

export interface Forfait {
  id: string
  operateur: string
  nom: string
  type: string
  data_mo: number | null
  minutes: number | null
  sms: number | null
  validite_jours: number | null
  prix: number
  description: string | null
  image_url: string | null
}

interface TelecomResponse {
  forfaits: Forfait[]
  total: number
  page: number
  pages: number
}

import { breadcrumbSchema, itemListSchema } from '@/lib/schema-org'

export default async function TelecomPage({
  searchParams,
}: {
  searchParams: Promise<{ operateur?: string; type?: string; tri?: string; page?: string }> | { operateur?: string; type?: string; tri?: string; page?: string }
}) {
  const sp = await Promise.resolve(searchParams)
  const { operateur = '', type = '', tri = '', page = '1' } = sp || {}

  const qs = new URLSearchParams()
  qs.set('limit', '100')
  qs.set('page', '1')
  if (operateur) qs.set('operateur', operateur)
  if (type) qs.set('type', type)
  if (tri) qs.set('tri', tri)

  let forfaits: Forfait[] = []
  let total = 0
  let operateurs: string[] = []

  try {
    const [data, ops] = await Promise.all([
      apiFetch<TelecomResponse>(`/telecom?${qs.toString()}`),
      apiFetch<string[]>('/telecom/operateurs'),
    ])
    forfaits = data.forfaits
    total = data.total
    operateurs = ops
  } catch { /* shows empty state */ }

  const breadcrumbs = breadcrumbSchema([
    { name: 'Accueil', url: '/' },
    { name: 'Forfaits Télécom', url: '/telecom' },
  ])

  const itemList = forfaits.length > 0 ? itemListSchema(
    forfaits.slice(0, 25).map(f => ({
      name: `${f.nom} (${f.operateur}) - ${fcfa(f.prix)}`,
      url: `/telecom/${f.id}`,
      description: f.description || `Forfait mobile ${f.nom} proposé par ${f.operateur} au Sénégal.`,
    })),
    'Forfaits Télécom Sénégal'
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
      <TelecomClient
        forfaits={forfaits}
        total={total}
        operateurs={operateurs}
        currentOperateur={operateur}
        currentType={type}
        currentTri={tri}
      />
    </>
  )
}
