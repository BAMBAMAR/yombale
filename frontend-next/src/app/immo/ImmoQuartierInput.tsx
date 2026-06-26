'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function ImmoQuartierInput({ currentQuartier }: { currentQuartier: string }) {
  const [val, setVal] = useState(currentQuartier)
  const router = useRouter()
  const searchParams = useSearchParams()

  function buildUrl(quartier: string) {
    const p = new URLSearchParams(searchParams.toString())
    if (quartier.trim()) {
      p.set('quartier', quartier.trim())
    } else {
      p.delete('quartier')
    }
    p.set('page', '1')
    return `/immo?${p.toString()}`
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    router.push(buildUrl(val))
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <input
        type="text"
        value={val}
        onChange={e => setVal(e.target.value)}
        placeholder="ex: Plateau, Almadies, Mermoz…"
        className="immo-quartier-input"
      />
      <button type="submit" className="immo-quartier-btn">OK</button>
      {currentQuartier && (
        <button
          type="button"
          className="budget-pill budget-pill--reset"
          onClick={() => { setVal(''); router.push(buildUrl('')) }}
        >
          ✕
        </button>
      )}
    </form>
  )
}
