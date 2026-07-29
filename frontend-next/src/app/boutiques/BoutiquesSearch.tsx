'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'

export default function BoutiquesSearch({ currentQ, currentVille, currentCat }: { currentQ: string; currentVille: string; currentCat?: string }) {
  const [q, setQ] = useState(currentQ)
  const router = useRouter()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const p = new URLSearchParams()
    if (currentVille) p.set('ville', currentVille)
    if (currentCat) p.set('cat', currentCat)
    if (q.trim()) p.set('q', q.trim())
    p.set('page', '1')
    router.push(`/boutiques?${p.toString()}`)
  }

  function handleClear() {
    setQ('')
    const p = new URLSearchParams()
    if (currentVille) p.set('ville', currentVille)
    if (currentCat) p.set('cat', currentCat)
    p.set('page', '1')
    router.push(`/boutiques?${p.toString()}`)
  }

  return (
    <form onSubmit={submit} className="boutiques-search-form" style={{ position: 'relative', width: '100%', maxWidth: 540 }}>
      <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
        <Search size={18} />
      </div>
      <input
        type="text"
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Rechercher une boutique par nom, secteur ou ville..."
        className="boutiques-search-input"
        style={{
          width: '100%',
          paddingLeft: 42,
          paddingRight: q ? 40 : 110,
          height: 48,
          borderRadius: 12,
          border: '1.5px solid #e5e7eb',
          fontSize: 14,
          outline: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          transition: 'all 0.2s',
        }}
      />
      {q && (
        <button
          type="button"
          onClick={handleClear}
          style={{
            position: 'absolute', right: q ? 100 : 14, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center',
          }}
          title="Effacer"
        >
          <X size={16} />
        </button>
      )}
      <button
        type="submit"
        className="boutiques-search-btn"
        style={{
          position: 'absolute', right: 4, top: 4, bottom: 4,
          padding: '0 16px', borderRadius: 9,
          background: 'linear-gradient(135deg, #C75B00, #ea580c)',
          color: '#fff', border: 'none', fontWeight: 700, fontSize: 13,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          boxShadow: '0 2px 6px rgba(199,91,0,0.3)',
        }}
      >
        Rechercher
      </button>
    </form>
  )
}

