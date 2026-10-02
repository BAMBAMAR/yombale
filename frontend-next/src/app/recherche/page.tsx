import type { Metadata } from 'next'
import RechercheClient from './RechercheClient'

export const dynamic = 'force-dynamic'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ q?: string }> }): Promise<Metadata> {
  const { q } = await searchParams
  return {
    title: q ? `"${q}" — Recherche Nopalou` : 'Recherche Nopalou',
    robots: 'noindex',
  }
}

type Params = { q?: string; prix_max?: string; tri?: string }

async function search(q: string, prixMax: string, tri: string) {
  if (!q || q.length < 2) return null
  try {
    const extra = `${prixMax ? `&prix_max=${encodeURIComponent(prixMax)}` : ''}${tri ? `&tri=${encodeURIComponent(tri)}` : ''}`
    const r = await fetch(
      `${BACKEND}/api/search?q=${encodeURIComponent(q)}&limit=12${extra}`,
      { cache: 'no-store' }
    )
    if (!r.ok) return null
    return await r.json()
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
