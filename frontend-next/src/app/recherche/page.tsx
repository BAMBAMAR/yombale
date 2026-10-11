import type { Metadata } from 'next'
import RechercheClient from './RechercheClient'

import { apiFetch } from '@/lib/api'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ q?: string }> }): Promise<Metadata> {
  const { q } = await searchParams
  return {
    title: q ? `"${q}" — Recherche Nopalou` : 'Recherche Nopalou',
    robots: 'noindex',
  }
}

type Params = { q?: string; prix_max?: string; tri?: string }
type SearchData = NonNullable<React.ComponentProps<typeof RechercheClient>['data']>

async function search(q: string, prixMax: string, tri: string) {
  if (!q || q.length < 2) return null
  try {
    const extra = `${prixMax ? `&prix_max=${encodeURIComponent(prixMax)}` : ''}${tri ? `&tri=${encodeURIComponent(tri)}` : ''}`
    return await apiFetch<SearchData>(`/search?q=${encodeURIComponent(q)}&limit=12${extra}`)
  } catch { return null }
}

export default async function RecherchePage({ searchParams }: { searchParams: Promise<Params> }) {
  const { q, prix_max, tri } = await searchParams
  const query = (q ?? '').trim()
  const prixMax = /^\d{1,9}$/.test(prix_max ?? '') ? (prix_max as string) : ''
  const triOk = tri === 'prix_asc' || tri === 'prix_desc' ? tri : ''
  const data = query ? await search(query, prixMax, triOk) : null

  return <RechercheClient query={query} data={data} prixMax={prixMax} tri={triOk} />
}
