'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

export default function NavbarGuides() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="navbar-guides-wrap" ref={ref}>
      <button
        className="navbar-guides-btn"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
      >
        📚 Guides {open ? '▲' : '▼'}
      </button>

      {open && (
        <div className="navbar-guides-dropdown" role="menu">
          <Link href="/guide-achat" className="navbar-guide-item" role="menuitem" onClick={() => setOpen(false)}>
            <span>🏆</span>
            <span>
              <span style={{ display: 'block', fontWeight: 700 }}>Guide d&apos;achat intelligent</span>
              <span style={{ fontWeight: 400, fontSize: 11, color: 'var(--text3)' }}>Classement personnalisé de produits</span>
            </span>
          </Link>
          <Link href="/guide-forfait" className="navbar-guide-item" role="menuitem" onClick={() => setOpen(false)}>
            <span>📡</span>
            <span>
              <span style={{ display: 'block', fontWeight: 700 }}>Guide d&apos;achat forfait</span>
              <span style={{ fontWeight: 400, fontSize: 11, color: 'var(--text3)' }}>Trouver le meilleur forfait télécom</span>
            </span>
          </Link>
          <Link href="/guide-immo" className="navbar-guide-item" role="menuitem" onClick={() => setOpen(false)}>
            <span>🏡</span>
            <span>
              <span style={{ display: 'block', fontWeight: 700 }}>Guide immobilier</span>
              <span style={{ fontWeight: 400, fontSize: 11, color: 'var(--text3)' }}>Trouver mon logement idéal</span>
            </span>
          </Link>
          <Link href="/guide-prix" className="navbar-guide-item" role="menuitem" onClick={() => setOpen(false)}>
            <span>💡</span>
            <span>
              <span style={{ display: 'block', fontWeight: 700 }}>Guide des prix</span>
              <span style={{ fontWeight: 400, fontSize: 10, color: 'var(--text3)' }}>Comprendre le prix d&apos;un produit</span>
            </span>
          </Link>
          <Link href="/guide-emploi" className="navbar-guide-item" role="menuitem" onClick={() => setOpen(false)}>
            <span>📖</span>
            <span>
              <span style={{ display: 'block', fontWeight: 700 }}>Guide d&apos;emploi</span>
              <span style={{ fontWeight: 400, fontSize: 10, color: 'var(--text3)' }}>Comment utiliser Nopalou</span>
            </span>
          </Link>
        </div>
      )}
    </div>
  )
}
