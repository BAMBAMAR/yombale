'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Bell, ExternalLink, Menu, User, Store, Building2 } from 'lucide-react'

interface AgenceTopNavbarProps {
  nom: string
  slug: string
  ville?: string
  sponsorise?: boolean
  totalAlertes: number
  onOpenAlertes: () => void
  onOpenMenu: () => void
}

export default function AgenceTopNavbar({
  nom,
  slug,
  ville = 'Dakar',
  sponsorise = false,
  totalAlertes = 0,
  onOpenAlertes,
  onOpenMenu,
}: AgenceTopNavbarProps) {
  const initiale = nom ? nom.charAt(0).toUpperCase() : 'A'

  return (
    <header
      className="agence-top-navbar"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        height: 56,
        background: '#FFFFFF',
        borderBottom: '1px solid var(--border, #E8DDD2)',
        padding: '0 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        boxSizing: 'border-box',
        boxShadow: '0 1px 4px rgba(28, 43, 74, 0.04)',
      }}
      aria-label="Barre d'en-tête Espace Agence"
    >
      {/* ── Gauche : Logo Nopalou + Tag Agence ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <Link
          href="/"
          style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
          title="Retour à l'accueil Nopalou"
        >
          <Image src="/icons/logo-mark.svg" alt="Nopalou" width={26} height={26} priority />
          <span style={{ fontSize: 17, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1 }}>
            <span style={{ color: 'var(--navy, #1C2B4A)' }}>Nopa</span>
            <span style={{ color: 'var(--accent, #C75B00)' }}>lou</span>
          </span>
        </Link>

        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            padding: '2px 8px',
            borderRadius: 6,
            background: 'var(--navy, #1C2B4A)',
            color: '#FFFFFF',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          Agence
        </span>
      </div>

      {/* ── Centre : Commutateur Multi-Activités (Desktop) ── */}
      <div
        className="immo-desktop-flex-inline"
        style={{
          display: 'none',
          alignItems: 'center',
          gap: 6,
          background: '#FAF8F5',
          padding: '3px 6px',
          borderRadius: 10,
          border: '1px solid var(--border, #E8DDD2)',
        }}
      >
        <Link
          href="/compte"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 10px',
            borderRadius: 7,
            fontSize: 12,
            fontWeight: 750,
            color: 'var(--navy, #1C2B4A)',
            textDecoration: 'none',
            transition: 'background 0.15s ease',
          }}
          title="Accéder à mon Espace Personnel"
        >
          <User size={13} />
          <span>Espace Perso</span>
        </Link>

        <Link
          href="/boutique"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 10px',
            borderRadius: 7,
            fontSize: 12,
            fontWeight: 750,
            color: 'var(--navy, #1C2B4A)',
            textDecoration: 'none',
            transition: 'background 0.15s ease',
          }}
          title="Accéder à ma Boutique Marchande"
        >
          <Store size={13} style={{ color: 'var(--accent, #C75B00)' }} />
          <span>Ma Boutique</span>
        </Link>

        <Link
          href="/agence"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 10px',
            borderRadius: 7,
            fontSize: 12,
            fontWeight: 800,
            color: '#FFFFFF',
            background: 'var(--navy, #1C2B4A)',
            textDecoration: 'none',
            boxShadow: '0 1px 3px rgba(28,43,74,0.15)',
          }}
          title="Toutes mes agences immobilières"
        >
          <Building2 size={13} />
          <span>Agence Immo</span>
        </Link>
      </div>

      {/* ── Droite : Alertes + Vitrine + Nom Agence & Avatar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {/* Cloche Notifications */}
        <button
          type="button"
          onClick={onOpenAlertes}
          style={{
            position: 'relative',
            background: '#FAF8F5',
            border: '1px solid var(--border, #E8DDD2)',
            borderRadius: 8,
            padding: '6px 10px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: 'var(--navy, #1C2B4A)',
            fontSize: 12,
            fontWeight: 700,
            transition: 'background 0.15s ease',
          }}
          aria-label="Centre d'alertes et notifications"
          title="Alertes & Notifications"
        >
          <Bell size={15} />
          <span className="immo-desktop-flex-inline" style={{ display: 'none' }}>
            Alertes
          </span>
          {totalAlertes > 0 && (
            <span
              style={{
                background: 'var(--accent, #C75B00)',
                color: '#FFFFFF',
                fontSize: 10,
                fontWeight: 900,
                padding: '1px 6px',
                borderRadius: 10,
              }}
            >
              {totalAlertes}
            </span>
          )}
        </button>

        {/* Bouton Vitrine Publique (Desktop seulement) */}
        <Link
          href={`/agence/${slug}/vitrine`}
          target="_blank"
          className="hidden-mobile"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--navy, #1C2B4A)',
            textDecoration: 'none',
            padding: '6px 12px',
            borderRadius: 8,
            background: '#FAF8F5',
            border: '1px solid var(--border, #E8DDD2)',
            transition: 'all 0.15s ease',
          }}
          title="Consulter la vitrine publique de l'agence"
        >
          <span className="immo-desktop-flex-inline" style={{ display: 'none' }}>
            Vitrine
          </span>
          <ExternalLink size={13} />
        </Link>

        {/* Séparateur vertical discret sur desktop */}
        <div
          className="immo-desktop-flex-inline"
          style={{ width: 1, height: 24, background: 'var(--border, #E8DDD2)', display: 'none' }}
        />

        {/* Identité de l'Agence : Nom + Ville (Desktop) + Avatar (Toujours visible) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            cursor: 'pointer',
          }}
          onClick={onOpenMenu}
          title="Menu de l'agence"
        >
          <div className="hidden-mobile" style={{ textAlign: 'right' }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: 'var(--navy, #1C2B4A)',
                whiteSpace: 'nowrap',
                maxWidth: 150,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: 1.2,
              }}
            >
              {nom}
            </div>
            <div style={{ fontSize: 10, color: '#64748B', fontWeight: 600 }}>{ville}</div>
          </div>

          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: 'var(--navy, #1C2B4A)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 14,
              boxShadow: '0 1px 3px rgba(28, 43, 74, 0.15)',
              flexShrink: 0,
            }}
          >
            {initiale}
          </div>
        </div>

        {/* Bouton Hamburger Mobile (< 768px) */}
        <button
          type="button"
          onClick={onOpenMenu}
          className="immo-mobile-only"
          style={{
            background: 'none',
            border: '1px solid var(--border, #E8DDD2)',
            borderRadius: 8,
            padding: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--navy, #1C2B4A)',
            marginLeft: 2,
          }}
          aria-label="Ouvrir le menu complet de l'agence"
        >
          <Menu size={18} />
        </button>
      </div>
    </header>
  )
}
