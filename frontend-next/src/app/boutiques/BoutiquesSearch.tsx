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
    router.push(`/boutiques?${p.toString()}#resultats`)
  }

  function handleClear() {
    setQ('')
    const p = new URLSearchParams()
    if (currentVille) p.set('ville', currentVille)
    if (currentCat) p.set('cat', currentCat)
    p.set('page', '1')
    router.push(`/boutiques?${p.toString()}#resultats`)
  }

  return (
    <>
      <style>{`
        .boutiques-search-input {
          padding-left: 50px;
          padding-right: 125px;
          font-size: 15px;
        }
        .search-clear-btn {
          right: 118px;
        }
        .boutiques-search-btn {
          padding: 0 18px;
        }
        .search-btn-icon-only {
          display: none;
        }
        
        @media (max-width: 640px) {
          .boutiques-search-input {
            padding-right: 60px !important;
            padding-left: 42px !important;
            font-size: 14px !important;
          }
          .boutiques-search-btn {
            padding: 0 14px !important;
          }
          .search-btn-text {
            display: none !important;
          }
          .search-btn-icon-only {
            display: block !important;
          }
          .search-btn-icon-text {
            display: none !important;
          }
          .search-clear-btn {
            right: 56px !important;
          }
          .search-icon-left {
            left: 14px !important;
          }
        }
      `}</style>
      <form onSubmit={submit} className="boutiques-search-form" style={{ position: 'relative', width: '100%', maxWidth: 720, margin: '0 auto' }}>
        <div className="search-icon-left" style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', color: '#64748b', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
          <Search size={20} strokeWidth={2.5} />
        </div>
        <input
          type="text"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Rechercher une boutique..."
          className="boutiques-search-input"
          style={{
            width: '100%',
            height: 52,
            borderRadius: 26,
            border: '1px solid #e2e8f0',
            fontWeight: 500,
            outline: 'none',
            boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
            transition: 'all 0.3s ease',
            backgroundColor: '#ffffff',
            color: '#0f172a'
          }}
          onFocus={(e) => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(199,91,0,0.12)'; e.currentTarget.style.borderColor = '#fdba74' }}
          onBlur={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.04)'; e.currentTarget.style.borderColor = '#e2e8f0' }}
        />
        {q && (
          <button
            type="button"
            onClick={handleClear}
            className="search-clear-btn"
            style={{
              position: 'absolute', top: '50%', transform: 'translateY(-50%)',
              background: '#f1f5f9', border: 'none', borderRadius: '50%', color: '#64748b', cursor: 'pointer', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
            }}
            title="Effacer"
          >
            <X size={13} strokeWidth={3} />
          </button>
        )}
        <button
          type="submit"
          className="boutiques-search-btn"
          style={{
            position: 'absolute', right: 6, top: 6, bottom: 6,
            borderRadius: 20,
            background: 'linear-gradient(135deg, #C75B00 0%, #ea580c 100%)',
            color: '#fff', border: 'none', fontWeight: 800, fontSize: 14,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            boxShadow: '0 3px 10px rgba(199,91,0,0.22)', transition: 'all 0.2s'
          }}
        >
          <Search size={16} strokeWidth={2.5} className="search-btn-icon-text" />
          <Search size={18} strokeWidth={2.5} className="search-btn-icon-only" />
          <span className="search-btn-text">Rechercher</span>
        </button>
      </form>
    </>
  )
}

