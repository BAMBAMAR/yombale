'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Plus, Megaphone, Home, Store, Building2 } from 'lucide-react'

const ENTREES = [
  { href: '/deposer-annonce', Icone: Megaphone, titre: 'Publier une annonce', detail: 'Vendre, louer ou proposer un service' },
  { href: '/deposer-immo', Icone: Home, titre: 'Publier un bien immobilier', detail: 'Location ou vente, particulier' },
  { href: '/creer-boutique', Icone: Store, titre: 'Créer une boutique', detail: 'Vitrine, caisse et WhatsApp' },
  { href: '/agence', Icone: Building2, titre: 'Créer une agence immo', detail: 'Gestion locative et mandats' },
]

export default function NavbarCreerMenu() {
  const [ouvert, setOuvert] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ouvert) return
    const dehors = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOuvert(false)
    }
    const echap = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOuvert(false)
    }
    document.addEventListener('pointerdown', dehors)
    document.addEventListener('keydown', echap)
    return () => {
      document.removeEventListener('pointerdown', dehors)
      document.removeEventListener('keydown', echap)
    }
  }, [ouvert])

  return (
    <div ref={ref} className="navbar-creer">
      <button
        type="button"
        className="navbar-creer-btn"
        onClick={() => setOuvert((v) => !v)}
        aria-expanded={ouvert}
        aria-haspopup="menu"
        aria-label="Publier ou créer"
        title="Publier ou créer"
      >
        <Plus size={18} strokeWidth={2.6} />
      </button>
      {ouvert && (
        <div className="navbar-creer-menu" role="menu">
          {ENTREES.map(({ href, Icone, titre, detail }) => (
            <a key={href} href={href} role="menuitem" className="navbar-creer-item" onClick={() => setOuvert(false)}>
              <Icone size={16} className="navbar-creer-icone" />
              <span className="navbar-creer-texte">
                <span className="navbar-creer-titre">{titre}</span>
                <span className="navbar-creer-detail">{detail}</span>
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
