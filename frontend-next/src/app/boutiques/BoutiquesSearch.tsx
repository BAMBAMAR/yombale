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
    <form onSubmit={submit} className="boutiques-search-form" style={{ position: 'relative', width: '100%', maxWidth: 720, margin: '0 auto' }}>
      <div style={{ position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)', color: '#64748b', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
        <Search size={22} strokeWidth={2.5} />
      </div>
      <input
        type="text"
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Rechercher une boutique par nom, secteur ou ville..."
        style={{
          width: '100%',
          paddingLeft: 60,
          paddingRight: q ? 160 : 160,
          height: 64,
          borderRadius: 32,
          border: '1px solid #e2e8f0',
          fontSize: 16,
          fontWeight: 500,
          outline: 'none',
          boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
          transition: 'all 0.3s ease',
          backgroundColor: '#ffffff',
          color: '#0f172a'
        }}
        onFocus={(e) => { e.currentTarget.style.boxShadow = '0 12px 40px rgba(199,91,0,0.15)'; e.currentTarget.style.borderColor = '#fdba74' }}
        onBlur={(e) => { e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.06)'; e.currentTarget.style.borderColor = '#e2e8f0' }}
      />
      {q && (
        <button
          type="button"
          onClick={handleClear}
          style={{
            position: 'absolute', right: 140, top: '50%', transform: 'translateY(-50%)',
            background: '#f1f5f9', border: 'none', borderRadius: '50%', color: '#64748b', cursor: 'pointer', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
          }}
          title="Effacer"
        >
          <X size={14} strokeWidth={3} />
        </button>
      )}
      <button
        type="submit"
        className="boutiques-search-btn"
        style={{
          position: 'absolute', right: 8, top: 8, bottom: 8,
          padding: '0 24px', borderRadius: 26,
          background: 'linear-gradient(135deg, #C75B00 0%, #ea580c 100%)',
          color: '#fff', border: 'none', fontWeight: 800, fontSize: 15,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: '0 4px 12px rgba(199,91,0,0.25)', transition: 'all 0.2s'
        }}
      >
        Rechercher
      </button>
    </form>
  )
}

