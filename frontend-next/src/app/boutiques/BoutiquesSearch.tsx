'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function BoutiquesSearch({ currentQ, currentVille }: { currentQ: string; currentVille: string }) {
  const [q, setQ] = useState(currentQ)
  const router = useRouter()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const p = new URLSearchParams()
    if (currentVille) p.set('ville', currentVille)
    if (q.trim()) p.set('q', q.trim())
    p.set('page', '1')
    router.push(`/boutiques?${p.toString()}`)
  }

  return (
    <form onSubmit={submit} className="boutiques-search-form">
      <input
        type="text"
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Rechercher une boutique…"
        className="boutiques-search-input"
      />
      <button type="submit" className="boutiques-search-btn">🔍 Rechercher</button>
    </form>
  )
}
