'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Bell, Menu } from 'lucide-react'

interface AgenceMobileHeaderProps {
  nom: string
  ville?: string
  sponsorise?: boolean
  totalAlertes: number
  onOpenAlertes: () => void
  onOpenMenu: () => void
}

export function AgenceMobileHeader({
  nom,
  ville = 'Dakar',
  sponsorise = false,
  totalAlertes = 0,
  onOpenAlertes,
  onOpenMenu,
}: AgenceMobileHeaderProps) {
  const initiale = nom ? nom.charAt(0).toUpperCase() : 'A'

  return (
    <header
      className="immo-mobile-only"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        height: 54,
        background: '#FFFFFF',
        borderBottom: '1px solid var(--border, #E8DDD2)',
        padding: '0 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        boxShadow: '0 2px 8px rgba(28, 43, 74, 0.04)',
      }}
      aria-label="En-tête agence mobile"
    >
      {/* ── Gauche : Logo Nopalou + Tag Agence ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 5, textDecoration: 'none' }}>
          <Image src="/icons/logo-mark.svg" alt="Nopalou" width={24} height={24} priority />
          <span style={{ fontSize: 16, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1 }}>
            <span style={{ color: 'var(--navy, #1C2B4A)' }}>Nopa</span>
            <span style={{ color: 'var(--accent, #C75B00)' }}>lou</span>
          </span>
        </Link>
        <span
          style={{
            fontSize: 9.5,
            fontWeight: 800,
            padding: '2px 6px',
            borderRadius: 6,
            background: 'var(--navy, #1C2B4A)',
            color: '#FFFFFF',
            textTransform: 'uppercase',
            letterSpacing: '0.4px',
          }}
        >
          Agence
        </span>
      </div>

      {/* ── Droite : Nom de l'Agence + Icône + Cloche + Menu ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, justifyContent: 'flex-end', flex: 1 }}>
        {/* Nom & Avatar de l'Agence à droite */}
        <div
          onClick={onOpenMenu}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            cursor: 'pointer',
            minWidth: 0,
          }}
          title="Ouvrir le menu de l'agence"
        >
          <div style={{ textAlign: 'right', minWidth: 0, maxWidth: 115 }}>
            <div
              style={{
                fontSize: 12.5,
                fontWeight: 800,
                color: 'var(--navy, #1C2B4A)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: 1.15,
              }}
            >
              {nom}
            </div>
            <div style={{ fontSize: 9.5, color: '#64748B', fontWeight: 600 }}>
              {ville}
            </div>
          </div>

          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'var(--navy, #1C2B4A)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: 13,
              flexShrink: 0,
            }}
          >
            {initiale}
          </div>
        </div>

        {/* Cloche Notifications */}
        <button
          type="button"
          onClick={onOpenAlertes}
          style={{
            position: 'relative',
            background: '#FAF8F5',
            border: '1px solid var(--border, #E8DDD2)',
            borderRadius: 8,
            padding: '6px 7px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--navy, #1C2B4A)',
            minWidth: 34,
            minHeight: 34,
            flexShrink: 0,
          }}
          aria-label="Alertes et notifications de l'agence"
          title="Alertes & Notifications"
        >
          <Bell size={16} />
          {totalAlertes > 0 && (
            <span
              style={{
                position: 'absolute',
                top: -4,
                right: -4,
                background: 'var(--accent, #C75B00)',
                color: '#FFFFFF',
                fontSize: 9,
                fontWeight: 900,
                padding: '1px 5px',
                borderRadius: 10,
                minWidth: 15,
                textAlign: 'center',
                boxShadow: '0 0 0 2px #FFFFFF',
              }}
            >
              {totalAlertes > 99 ? '99+' : totalAlertes}
            </span>
          )}
        </button>

        {/* Bouton Menu Principal */}
        <button
          type="button"
          onClick={onOpenMenu}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px 8px',
            borderRadius: 8,
            background: 'var(--navy, #1C2B4A)',
            color: '#FFFFFF',
            border: 'none',
            cursor: 'pointer',
            minHeight: 34,
            minWidth: 34,
            flexShrink: 0,
          }}
          aria-label="Ouvrir le menu complet de l'agence"
          title="Menu de navigation"
        >
          <Menu size={17} />
        </button>
      </div>
    </header>
  )
}

export default AgenceMobileHeader
