'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'

export default function AgencesSearch({
  currentQ,
  currentVille,
  extraParams = {},
}: {
  currentQ: string
  currentVille: string
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
    if (q.trim()) p.set('recherche', q.trim())
    p.set('page', '1')
    router.push(`/agences?${p.toString()}#resultats`)
  }

  function handleClear() {
    setQ('')
    const p = new URLSearchParams()
    Object.entries(extraParams).forEach(([k, v]) => {
      if (v) p.set(k, v)
    })
    if (currentVille) p.set('ville', currentVille)
    p.set('page', '1')
    router.push(`/agences?${p.toString()}#resultats`)
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
      <div
        style={{
          position: 'absolute',
          left: 14,
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#64748b',
          display: 'flex',
          alignItems: 'center',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      >
        <Search size={18} strokeWidth={2.5} />
      </div>

      <style>{`
        .agences-search-btn-text {
          display: inline-block;
        }
        .agences-search-btn-icon {
          display: none;
        }
        .agences-search-input {
          padding-right: 114px;
        }
        .agences-search-clear {
          right: 108px;
        }
        @media (max-width: 768px) {
          .agences-search-btn-text {
            display: none !important;
          }
          .agences-search-btn-icon {
            display: inline-flex !important;
            align-items: center;
            justify-content: center;
          }
          .agences-search-input {
            padding-right: 44px !important;
            padding-left: 36px !important;
            font-size: 13px !important;
          }
          .agences-search-clear {
            right: 42px !important;
          }
          .agences-search-submit {
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

      <input
        type="text"
        aria-label="Rechercher une agence ou un bien"
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Rechercher une agence, bien..."
        className="agences-search-input"
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
        onFocus={e => {
          e.currentTarget.style.boxShadow = '0 4px 14px rgba(28,43,74,0.12)'
          e.currentTarget.style.borderColor = '#1C2B4A'
        }}
        onBlur={e => {
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)'
          e.currentTarget.style.borderColor = '#e2e8f0'
        }}
      />

      {q && (
        <button
          type="button"
          onClick={handleClear}
          className="agences-search-clear"
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
        className="agences-search-submit"
        style={{
          position: 'absolute',
          right: 3,
          top: 3,
          bottom: 3,
          borderRadius: 18,
          background: 'linear-gradient(135deg, #1C2B4A 0%, #2b4270 100%)',
          color: '#fff',
          border: 'none',
          fontWeight: 800,
          fontSize: 12.5,
          padding: '0 16px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 5,
          boxShadow: '0 2px 6px rgba(28,43,74,0.2)',
          zIndex: 2,
        }}
        title="Rechercher"
      >
        <span className="agences-search-btn-text">Rechercher</span>
        <span className="agences-search-btn-icon"><Search size={15} strokeWidth={2.5} /></span>
      </button>
    </form>
  )
}
