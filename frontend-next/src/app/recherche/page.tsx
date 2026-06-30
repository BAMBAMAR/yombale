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

async function search(q: string) {
  if (!q || q.length < 2) return null
  try {
    const r = await fetch(
      `${BACKEND}/api/search?q=${encodeURIComponent(q)}&limit=12`,
      { cache: 'no-store' }
    )
    if (!r.ok) return null
    return await r.json()
  } catch { return null }
}

export default async function RecherchePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  const query = (q ?? '').trim()
  const data = query ? await search(query) : null

  return <RechercheClient query={query} data={data} />
}
