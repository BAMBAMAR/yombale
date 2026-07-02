'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { fcfa } from '@/lib/format'
import ExternalImg from '@/components/ExternalImg'

export interface RecentItem {
  id: number
  nom: string
  prix_min: number | null
  image_url: string | null
}

const KEY = 'nopalou_recents'
const MAX = 6

export function saveRecent(item: RecentItem) {
  try {
    const existing: RecentItem[] = JSON.parse(localStorage.getItem(KEY) || '[]')
    const filtered = existing.filter(r => r.id !== item.id)
    const updated  = [item, ...filtered].slice(0, MAX)
    localStorage.setItem(KEY, JSON.stringify(updated))
  } catch { /* localStorage indisponible */ }
}

export default function RecentlyViewed() {
  const [recents, setRecents] = useState<RecentItem[]>([])

  useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem(KEY) || '[]')
      setRecents(data)
    } catch { /* ignore */ }
  }, [])

  if (recents.length === 0) return null

  return (
    <section className="recents-section">
      <h2 className="recents-titre">🕐 Récemment consultés</h2>
      <div className="recents-grid">
        {recents.map(p => (
          <Link key={p.id} href={`/produit/${p.id}`} className="recents-card">
            <div className="recents-img">
              <ExternalImg src={p.image_url} alt={p.nom} />
            </div>
            <p className="recents-nom">{p.nom}</p>
            {p.prix_min && <p className="recents-prix">{fcfa(p.prix_min)}</p>}
          </Link>
        ))}
      </div>
    </section>
  )
}
