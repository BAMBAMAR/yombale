'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Bell, ExternalLink, Menu, User, Store, Building2 } from 'lucide-react'
import type { Boutique } from '../types'

interface BoutiqueTopNavbarProps {
  boutique: Boutique
  nbEnAttente?: number
  onNavigateTab?: (tab: any, subTab?: string) => void
  onOpenMenu: () => void
  onBack?: () => void
}

export default function BoutiqueTopNavbar({
  boutique,
  nbEnAttente = 0,
  onNavigateTab,
  onOpenMenu,
  onBack,
}: BoutiqueTopNavbarProps) {
  const nom = boutique?.nom || 'Ma Boutique'
  const initiale = nom ? nom.charAt(0).toUpperCase() : 'B'
  const vitrineUrl = `/boutiques/${boutique?.slug || boutique?.id}`

  return (
    <header
      className="boutique-top-navbar"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        height: 56,
        background: '#FFFFFF',
        borderBottom: '1px solid #E5E7EB',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        boxSizing: 'border-box',
        boxShadow: '0 1px 4px rgba(28, 43, 74, 0.04)',
      }}
      aria-label="Barre d'en-tête Espace Boutique"
    >
      {/* ── Gauche : Logo Nopalou + Tag Boutique ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
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
          Boutique
        </span>
      </div>

      {/* ── Centre : Commutateur Multi-Activités (Desktop) ── */}
      <div
        className="hidden-mobile"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: '#FAF8F5',
          padding: '3px 6px',
          borderRadius: 10,
          border: '1px solid #E5E7EB',
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
            fontWeight: 800,
            color: '#FFFFFF',
            background: 'var(--navy, #1C2B4A)',
            textDecoration: 'none',
            boxShadow: '0 1px 3px rgba(28,43,74,0.15)',
          }}
          title="Ma Boutique Marchande"
        >
          <Store size={13} />
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
            fontWeight: 750,
            color: 'var(--navy, #1C2B4A)',
            textDecoration: 'none',
            transition: 'background 0.15s ease',
          }}
          title="Accéder à mes Agences Immobilières"
        >
          <Building2 size={13} style={{ color: 'var(--navy, #1C2B4A)' }} />
          <span>Agence Immo</span>
        </Link>
      </div>

      {/* ── Droite : Commandes + Vitrine + Nom Boutique & Avatar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        {/* Cloche Notifications Commandes */}
        <button
          type="button"
          onClick={() => onNavigateTab?.('commandes')}
          style={{
            position: 'relative',
            background: '#FAF8F5',
            border: '1px solid #E5E7EB',
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
          aria-label="Commandes et alertes de la boutique"
          title="Commandes & Notifications"
        >
          <Bell size={15} />
          <span className="bq-desktop-only-inline" style={{ display: 'none' }}>
            Commandes
          </span>
          {nbEnAttente > 0 && (
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
              {nbEnAttente}
            </span>
          )}
        </button>

        {/* Bouton Vitrine Publique (Desktop seulement — sur mobile accessible via la carte et le menu) */}
        <Link
          href={vitrineUrl}
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
            border: '1px solid #E5E7EB',
            transition: 'all 0.15s ease',
          }}
          title="Voir ma vitrine boutique publique"
        >
          <span className="bq-desktop-only-inline" style={{ display: 'none' }}>
            Vitrine
          </span>
          <ExternalLink size={13} />
        </Link>

        {/* Séparateur vertical sur desktop */}
        <div
          className="bq-desktop-only-inline"
          style={{ width: 1, height: 24, background: '#E5E7EB', display: 'none' }}
        />

        {/* Identité de la Boutique : Nom + Ville (Desktop) + Avatar (Toujours visible) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            cursor: 'pointer',
          }}
          onClick={onOpenMenu}
          title="Ouvrir le menu de la boutique"
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
            <div style={{ fontSize: 10, color: '#64748B', fontWeight: 600 }}>
              {boutique?.ville || 'Sénégal'}
            </div>
          </div>

          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: boutique?.logo_url ? '#FFFFFF' : 'var(--navy, #1C2B4A)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 14,
              boxShadow: '0 1px 3px rgba(28, 43, 74, 0.15)',
              overflow: 'hidden',
              flexShrink: 0,
              border: boutique?.logo_url ? '1px solid #E5E7EB' : 'none',
            }}
          >
            {boutique?.logo_url ? (
              <img
                src={boutique.logo_url}
                alt={nom}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              initiale
            )}
          </div>
        </div>

        {/* Bouton Hamburger Mobile (< 768px) */}
        <button
          type="button"
          onClick={onOpenMenu}
          className="bq-mobile-only-btn"
          style={{
            background: 'none',
            border: '1px solid #E5E7EB',
            borderRadius: 8,
            padding: '6px',
            cursor: 'pointer',
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--navy, #1C2B4A)',
            marginLeft: 2,
          }}
          aria-label="Ouvrir le menu complet de la boutique"
        >
          <Menu size={18} />
        </button>
      </div>
    </header>
  )
}
