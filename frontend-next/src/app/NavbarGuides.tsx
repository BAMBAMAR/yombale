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
        aria-haspopup="true"
        aria-controls="navbar-guides-dropdown"
        aria-label="Guides d'achat et assistants Nopalou"
      >
        📚 Guides {open ? '▲' : '▼'}
      </button>

      {open && (
        <div id="navbar-guides-dropdown" className="navbar-guides-dropdown" role="menu" aria-label="Sous-menu des guides">
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
          <Link href="/assistant-whatsapp" className="navbar-guide-item" role="menuitem" onClick={() => setOpen(false)}>
            <span>💬</span>
            <span>
              <span style={{ display: 'block', fontWeight: 700 }}>Assistant WhatsApp</span>
              <span style={{ fontWeight: 400, fontSize: 10, color: 'var(--text3)' }}>Comparez les prix depuis WhatsApp</span>
            </span>
          </Link>
          <Link href="/demo" className="navbar-guide-item" role="menuitem" onClick={() => setOpen(false)} style={{ background: '#FFF7ED', borderRadius: 8 }}>
            <span>🚀</span>
            <span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, color: 'var(--accent)' }}>
                Démo Commerciale <span style={{ background: 'var(--accent)', color: '#FFF', fontSize: 9, padding: '1px 6px', borderRadius: 10 }}>NOUVEAU</span>
              </span>
              <span style={{ fontWeight: 500, fontSize: 10, color: 'var(--text2)' }}>Parcours interactif &amp; Bac à sable</span>
            </span>
          </Link>
        </div>
      )}
    </div>
  )
}
