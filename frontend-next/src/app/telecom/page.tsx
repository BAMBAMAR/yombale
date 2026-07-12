import type { Metadata } from 'next'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import { fcfa } from '@/lib/format'
import TelecomClient from './TelecomClient'

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'

export const metadata: Metadata = {
  title: 'Forfaits télécom au Sénégal — Orange, Yas, Expresso, Promobile',
  description: 'Comparez les forfaits internet, voix et data des opérateurs télécom au Sénégal : Orange, Free, Expresso et plus.',
  keywords: [
    'Forfait Orange Sénégal', 'Forfait Internet Orange Sénégal', 'Promobile forfait internet',
    'Promobile forfait appel', 'Forfait illimix Orange', 'Forfait Promobile',
    'Forfait Orange appel', 'Forfait mobile sénégal', 'Promo téléphone Orange Senegal',
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

export default async function TelecomPage({
  searchParams,
}: {
  searchParams: { operateur?: string; type?: string; tri?: string; page?: string }
}) {
  const { operateur = '', type = '', tri = '', page = '1' } = searchParams

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

  return (
    <TelecomClient
      forfaits={forfaits}
      total={total}
      operateurs={operateurs}
      currentOperateur={operateur}
      currentType={type}
      currentTri={tri}
    />
  )
}
