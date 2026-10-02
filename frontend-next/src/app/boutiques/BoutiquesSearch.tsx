'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'

export default function BoutiquesSearch({
  currentQ,
  currentVille,
  currentCat,
  extraParams = {},
}: {
  currentQ: string
  currentVille: string
  currentCat?: string
  extraParams?: Record<string, string>
}) {
  const [q, setQ] = useState(currentQ)
  const router = useRouter()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const p = new URLSearchParams()
    Object.entries(extraParams).forEach(([k, v]) => {
      if (v) p.set(k, v)
    })
    if (currentVille) p.set('ville', currentVille)
    if (currentCat) p.set('cat', currentCat)
    if (q.trim()) p.set('q', q.trim())
    p.set('page', '1')
    router.push(`/boutiques?${p.toString()}#resultats`)
  }

  function handleClear() {
    setQ('')
    const p = new URLSearchParams()
    Object.entries(extraParams).forEach(([k, v]) => {
      if (v) p.set(k, v)
    })
    if (currentVille) p.set('ville', currentVille)
    if (currentCat) p.set('cat', currentCat)
    p.set('page', '1')
    router.push(`/boutiques?${p.toString()}#resultats`)
  }

  return (
    <form
      onSubmit={submit}
      style={{
        position: 'relative',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <style>{`
        .boutiques-search-btn-text {
          display: inline-block;
        }
        .boutiques-search-input {
          padding-right: 118px;
        }
        .boutiques-search-clear {
          right: 110px;
        }
        @media (max-width: 768px) {
          .boutiques-search-btn-text {
            display: none !important;
          }
          .boutiques-search-input {
            padding-right: 44px !important;
            padding-left: 36px !important;
            font-size: 13px !important;
          }
          .boutiques-search-clear {
            right: 42px !important;
          }
          .boutiques-search-submit {
            padding: 0 !important;
            width: 34px !important;
            height: 34px !important;
            border-radius: 17px !important;
            right: 4px !important;
            top: 4px !important;
            bottom: 4px !important;
          }
        }
      `}</style>

      <div
        style={{
          position: 'absolute',
          left: 13,
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#64748b',
          display: 'flex',
          alignItems: 'center',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      >
        <Search size={17} strokeWidth={2.5} />
      </div>

      <input
        type="text"
        aria-label="Rechercher une boutique ou un produit"
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Rechercher une boutique, produit..."
        className="boutiques-search-input"
        style={{
          width: '100%',
          maxWidth: '100%',
          height: 42,
          borderRadius: 21,
          border: '1.5px solid #e2e8f0',
          fontWeight: 500,
          outline: 'none',
          paddingLeft: 38,
          fontSize: 13,
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          transition: 'all 0.2s ease',
          backgroundColor: '#ffffff',
          color: '#0f172a',
        }}
        onFocus={(e) => {
          e.currentTarget.style.boxShadow = '0 4px 14px rgba(199,91,0,0.12)'
          e.currentTarget.style.borderColor = '#fdba74'
        }}
        onBlur={(e) => {
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)'
          e.currentTarget.style.borderColor = '#e2e8f0'
        }}
      />

      {q && (
        <button
          type="button"
          onClick={handleClear}
          className="boutiques-search-clear"
          style={{
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            background: '#f1f5f9',
            border: 'none',
            borderRadius: '50%',
            color: '#64748b',
            cursor: 'pointer',
            width: 20,
            height: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            zIndex: 3,
          }}
          title="Effacer"
        >
          <X size={11} strokeWidth={3} />
        </button>
      )}

      <button
        type="submit"
        className="boutiques-search-submit"
        style={{
          position: 'absolute',
          right: 4,
          top: 4,
          bottom: 4,
          borderRadius: 18,
          background: 'linear-gradient(135deg, #C75B00 0%, #ea580c 100%)',
          color: '#fff',
          border: 'none',
          fontWeight: 800,
          fontSize: 12.5,
          padding: '0 16px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          boxShadow: '0 2px 6px rgba(199,91,0,0.2)',
          transition: 'all 0.2s ease',
          zIndex: 3,
        }}
        title="Lancer la recherche"
        aria-label="Rechercher"
      >
        <Search size={15} strokeWidth={2.5} />
        <span className="boutiques-search-btn-text">Rechercher</span>
      </button>
    </form>
  )
}
