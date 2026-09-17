'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Store, Building2, ChevronDown, ShoppingCart, Sparkles } from 'lucide-react'

interface AgenceItem {
  id: string
  nom: string
  slug: string
}

interface BoutiqueItem {
  id: string
  nom: string
  slug?: string
}

export default function NavbarProSwitcher() {
  const [loading, setLoading] = useState(true)
  const [boutiques, setBoutiques] = useState<BoutiqueItem[]>([])
  const [agences, setAgences] = useState<AgenceItem[]>([])
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let isMounted = true

    async function chargerEspaces() {
      try {
        const [resBq, resAg] = await Promise.allSettled([
          fetch('/api/boutiques/mine', { priority: 'low' } as any),
          fetch('/api/agences/mine', { priority: 'low' } as any),
        ])

        if (!isMounted) return

        let bqList: BoutiqueItem[] = []
        let agList: AgenceItem[] = []

        if (resBq.status === 'fulfilled' && resBq.value.ok) {
          const dataBq = await resBq.value.json().catch(() => null)
          if (dataBq?.boutiques && Array.isArray(dataBq.boutiques)) {
            bqList = dataBq.boutiques
          }
        }

        if (resAg.status === 'fulfilled' && resAg.value.ok) {
          const dataAg = await resAg.value.json().catch(() => null)
          if (dataAg?.agences && Array.isArray(dataAg.agences)) {
            agList = dataAg.agences
          }
        }

        setBoutiques(bqList)
        setAgences(agList)
      } catch (err) {
        console.warn('[NavbarProSwitcher] Erreur chargement espaces pro :', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    chargerEspaces()

    return () => {
      isMounted = false
    }
  }, [])

  // Fermeture du dropdown au clic à l'extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) {
      document.addEventListener('pointerdown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside)
    }
  }, [dropdownOpen])

  const hasBoutique = boutiques.length > 0
  const hasAgence = agences.length > 0
  const isHybride = hasBoutique && hasAgence

  // CAS 1 : Utilisateur Hybride (Boutique + Agence)
  if (isHybride) {
    const premiereAgence = agences[0]
    return (
      <div ref={containerRef} style={{ position: 'relative' }} className="hidden-mobile">
        <button
          type="button"
          onClick={() => setDropdownOpen((v) => !v)}
          aria-expanded={dropdownOpen}
          aria-label="Menu de mes espaces professionnels"
          style={{
            background: 'linear-gradient(135deg, var(--navy, #1C2B4A) 0%, #152238 100%)',
            color: '#ffffff',
            padding: '6px 12px',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 12.5,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            whiteSpace: 'nowrap',
            border: '1.5px solid rgba(199,91,0,0.4)',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(28,43,74,0.2)',
          }}
        >
          <Sparkles size={13} style={{ color: 'var(--accent, #C75B00)' }} />
          <span>Espaces Pro</span>
          <ChevronDown
            size={13}
            style={{
              transform: dropdownOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.15s ease',
            }}
          />
        </button>

        {dropdownOpen && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              right: 0,
              width: 230,
              background: '#ffffff',
              borderRadius: 12,
              border: '1px solid var(--border, #E8DDD2)',
              boxShadow: '0 12px 28px rgba(28,43,74,0.18)',
              padding: '6px',
              zIndex: 1050,
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
            }}
          >
            <Link
              href="/boutique"
              onClick={() => setDropdownOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 10px',
                borderRadius: 8,
                color: 'var(--navy, #1C2B4A)',
                textDecoration: 'none',
                fontSize: 12.5,
                fontWeight: 700,
                background: '#FAF8F5',
              }}
            >
              <Store size={15} style={{ color: 'var(--accent, #C75B00)', flexShrink: 0 }} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ lineHeight: 1.2 }}>Ma Boutique</div>
                <div style={{ fontSize: 10.5, color: '#64748B', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {boutiques[0]?.nom || 'Catalogue & Ventes'}
                </div>
              </div>
            </Link>

            <Link
              href={premiereAgence?.slug ? `/agence/${premiereAgence.slug}` : '/agence'}
              onClick={() => setDropdownOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 10px',
                borderRadius: 8,
                color: 'var(--navy, #1C2B4A)',
                textDecoration: 'none',
                fontSize: 12.5,
                fontWeight: 700,
              }}
            >
              <Building2 size={15} style={{ color: 'var(--navy, #1C2B4A)', flexShrink: 0 }} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ lineHeight: 1.2 }}>Mon Agence Pro</div>
                <div style={{ fontSize: 10.5, color: '#64748B', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {premiereAgence?.nom || 'Gestion & Baux'}
                </div>
              </div>
            </Link>

            <Link
              href="/boutique/caisse"
              onClick={() => setDropdownOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 10px',
                borderRadius: 8,
                color: '#0A5C36',
                textDecoration: 'none',
                fontSize: 12,
                fontWeight: 800,
                borderTop: '1px solid var(--border, #E8DDD2)',
                marginTop: 2,
              }}
            >
              <ShoppingCart size={14} style={{ color: '#0A5C36', flexShrink: 0 }} />
              <span>Caisse Tactile POS</span>
            </Link>
          </div>
        )}
      </div>
    )
  }

  // CAS 2 : Agence Immobilière Uniquement
  if (hasAgence) {
    const agenceActive = agences[0]
    const lien = agenceActive?.slug ? `/agence/${agenceActive.slug}` : '/agence'
    return (
      <Link
        href={lien}
        className="navbar-maboutique hidden-mobile"
        aria-label="Accéder à mon agence immobilière"
        style={{
          background: 'var(--navy, #1C2B4A)',
          color: '#ffffff',
          padding: '6px 11px',
          borderRadius: 8,
          fontWeight: 700,
          textDecoration: 'none',
          fontSize: 12.5,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          whiteSpace: 'nowrap',
          border: '1px solid rgba(255,255,255,0.18)',
          boxShadow: '0 2px 6px rgba(28,43,74,0.15)',
        }}
      >
        <Building2 size={14} style={{ color: 'var(--accent, #C75B00)', flexShrink: 0 }} />
        <span className="navbar-maboutique-text">Mon Agence Pro</span>
      </Link>
    )
  }

  // CAS 3 : Boutique Uniquement (ou défaut rapide avant/pendant chargement)
  return (
    <Link
      href="/boutique"
      className="navbar-maboutique hidden-mobile"
      aria-label="Accéder à ma boutique"
      style={{
        background: 'var(--navy, #1C2B4A)',
        color: '#ffffff',
        padding: '6px 11px',
        borderRadius: 8,
        fontWeight: 700,
        textDecoration: 'none',
        fontSize: 12.5,
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        whiteSpace: 'nowrap',
        border: '1px solid rgba(255,255,255,0.15)',
      }}
    >
      <Store size={14} style={{ color: 'var(--accent, #C75B00)', flexShrink: 0 }} />
      <span className="navbar-maboutique-text">Ma Boutique</span>
    </Link>
  )
}
