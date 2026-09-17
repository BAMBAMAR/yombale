'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Bell, Plus, User, Store, Building2, Heart, Users, LogOut, ChevronDown, Menu, BookOpen } from 'lucide-react'
import { logout } from '@/app/actions/auth'

interface AccountTopNavbarProps {
  nom?: string
  email?: string | null
  initiale?: string
  activeSpace?: 'compte' | 'boutique' | 'agence'
  customCta?: {
    label: string
    onClick?: () => void
    href?: string
  }
  onOpenMenu?: () => void
}

export default function AccountTopNavbar({
  nom = 'Mon Compte',
  email = null,
  initiale = 'U',
  activeSpace = 'compte',
  customCta,
  onOpenMenu,
}: AccountTopNavbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [dropdownOpen])

  return (
    <header
      className="account-top-navbar"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        height: 56,
        background: '#FFFFFF',
        borderBottom: '1px solid #E5E7EB',
        padding: '0 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        boxSizing: 'border-box',
        boxShadow: '0 1px 4px rgba(28, 43, 74, 0.04)',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
      aria-label="Barre d'en-tête Espace Compte"
    >
      {/* ── Gauche : Logo Nopalou + Badge Espace Perso ── */}
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
            padding: '2px 7px',
            borderRadius: 6,
            background: 'var(--navy, #1C2B4A)',
            color: '#FFFFFF',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          {activeSpace === 'agence' ? (
            <>
              <span className="immo-mobile-only">Immo</span>
              <span className="hidden-mobile">Immobilier Pro</span>
            </>
          ) : activeSpace === 'boutique' ? (
            'Boutique'
          ) : (
            'Mon Compte'
          )}
        </span>
      </div>

      {/* ── Centre : Switcher rapide Desktop (Boutique / Agence / Compte) ── */}
      <div
        className="account-top-switcher hidden-mobile"
        style={{
          display: 'flex',
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
            fontWeight: activeSpace === 'compte' ? 800 : 750,
            color: activeSpace === 'compte' ? '#FFFFFF' : 'var(--navy, #1C2B4A)',
            background: activeSpace === 'compte' ? 'var(--navy, #1C2B4A)' : 'transparent',
            textDecoration: 'none',
            boxShadow: activeSpace === 'compte' ? '0 1px 3px rgba(28,43,74,0.15)' : 'none',
            transition: 'background 0.15s ease',
          }}
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
            fontWeight: activeSpace === 'boutique' ? 800 : 750,
            color: activeSpace === 'boutique' ? '#FFFFFF' : 'var(--navy, #1C2B4A)',
            background: activeSpace === 'boutique' ? 'var(--navy, #1C2B4A)' : 'transparent',
            textDecoration: 'none',
            boxShadow: activeSpace === 'boutique' ? '0 1px 3px rgba(28,43,74,0.15)' : 'none',
            transition: 'background 0.15s ease',
          }}
        >
          <Store size={13} style={{ color: activeSpace === 'boutique' ? '#FFFFFF' : 'var(--navy, #1C2B4A)' }} />
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
            fontWeight: activeSpace === 'agence' ? 800 : 750,
            color: activeSpace === 'agence' ? '#FFFFFF' : 'var(--navy, #1C2B4A)',
            background: activeSpace === 'agence' ? 'var(--navy, #1C2B4A)' : 'transparent',
            textDecoration: 'none',
            boxShadow: activeSpace === 'agence' ? '0 1px 3px rgba(28,43,74,0.15)' : 'none',
            transition: 'background 0.15s ease',
          }}
        >
          <Building2 size={13} style={{ color: activeSpace === 'agence' ? '#FFFFFF' : 'var(--navy, #1C2B4A)' }} />
          <span>Agence Immo</span>
        </Link>
      </div>

      {/* ── Droite : Alertes + Publier / Action + Profil & Avatar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
        {/* Raccourci Alertes prix */}
        <Link
          href="/compte?tab=mes-alertes"
          style={{
            position: 'relative',
            background: '#FAF8F5',
            border: '1px solid #E5E7EB',
            borderRadius: 8,
            padding: '7px 9px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--navy, #1C2B4A)',
            textDecoration: 'none',
          }}
          title="Mes alertes prix"
          aria-label="Mes alertes prix"
        >
          <Bell size={16} />
        </Link>

        {/* Bouton d'action principal (+ Publier ou customCta) */}
        {customCta ? (
          customCta.href ? (
            <Link
              href={customCta.href}
              className="btn-npl hidden-mobile"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: 800,
                background: 'var(--accent, #C75B00)',
                color: '#FFFFFF',
                textDecoration: 'none',
                boxShadow: '0 2px 6px rgba(199,91,0,0.2)',
                whiteSpace: 'nowrap',
              }}
            >
              <Plus size={15} />
              <span>{customCta.label}</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={customCta.onClick}
              className="btn-npl hidden-mobile"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: 800,
                background: 'var(--accent, #C75B00)',
                color: '#FFFFFF',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(199,91,0,0.2)',
                whiteSpace: 'nowrap',
              }}
            >
              <Plus size={15} />
              <span>{customCta.label}</span>
            </button>
          )
        ) : (
          <Link
            href="/deposer-annonce"
            className="btn-npl hidden-mobile"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 14px',
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 800,
              background: 'var(--accent, #C75B00)',
              color: '#FFFFFF',
              textDecoration: 'none',
              border: 'none',
              boxShadow: '0 2px 6px rgba(199,91,0,0.2)',
            }}
          >
            <Plus size={15} />
            <span>Publier</span>
          </Link>
        )}

        {/* Dropdown Profil Utilisateur (Desktop & Mobile) */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setDropdownOpen(v => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: '#FAF8F5',
              border: '1px solid #E8DDD2',
              borderRadius: 24,
              padding: '2px 4px 2px 2px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--navy, #1C2B4A) 0%, var(--accent, #C75B00) 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 900,
                flexShrink: 0,
              }}
            >
              {initiale}
            </div>
            <span
              className="hidden-mobile"
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: 'var(--navy, #1C2B4A)',
                maxWidth: 110,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {nom}
            </span>
            <ChevronDown size={14} className="hidden-mobile" style={{ color: '#64748B' }} />
          </button>

          {/* Menu Déroulant Profil */}
          {dropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: 230,
                background: '#FFFFFF',
                borderRadius: 12,
                border: '1px solid #E2E8F0',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                padding: '8px 0',
                zIndex: 200,
              }}
            >
              <div style={{ padding: '8px 16px 10px', borderBottom: '1px solid #F1F5F9' }}>
                <p style={{ margin: 0, fontSize: 13.5, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>{nom}</p>
                {email && (
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {email}
                  </p>
                )}
              </div>

              <div style={{ padding: '6px 0' }}>
                <Link
                  href="/compte?tab=profil"
                  onClick={() => setDropdownOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    padding: '8px 16px',
                    fontSize: 13,
                    fontWeight: 650,
                    color: '#334155',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#FAF8F5')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <User size={15} style={{ color: 'var(--accent, #C75B00)' }} />
                  <span>Mon profil</span>
                </Link>

                <Link
                  href="/compte?tab=favoris"
                  onClick={() => setDropdownOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    padding: '8px 16px',
                    fontSize: 13,
                    fontWeight: 650,
                    color: '#334155',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#FAF8F5')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <Heart size={15} style={{ color: '#DB2777' }} />
                  <span>Mes favoris</span>
                </Link>

                <Link
                  href="/compte?tab=apporteur"
                  onClick={() => setDropdownOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    padding: '8px 16px',
                    fontSize: 13,
                    fontWeight: 650,
                    color: '#334155',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#FAF8F5')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <Users size={15} style={{ color: '#D97706' }} />
                  <span>Programme Apporteur (20%)</span>
                </Link>

                <Link
                  href="/guide-emploi"
                  target="_blank"
                  onClick={() => setDropdownOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    padding: '8px 16px',
                    fontSize: 13,
                    fontWeight: 650,
                    color: '#334155',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#FAF8F5')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <BookOpen size={15} style={{ color: '#64748B' }} />
                  <span>Guide d&apos;utilisation</span>
                </Link>
              </div>

              <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 6 }}>
                <form action={logout} style={{ margin: 0, width: '100%' }}>
                  <button
                    type="submit"
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 9,
                      padding: '8px 16px',
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#DC2626',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#FEF2F2')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <LogOut size={15} />
                    <span>Se déconnecter</span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Bouton Hamburger Mobile (pour ouvrir le tiroir complet) */}
        <button
          type="button"
          onClick={onOpenMenu}
          className="account-mobile-burger-btn"
          style={{
            display: 'none',
            background: '#FAF8F5',
            border: '1px solid #E5E7EB',
            borderRadius: 8,
            padding: '7px',
            color: 'var(--navy, #1C2B4A)',
            cursor: 'pointer',
          }}
          aria-label="Ouvrir le menu du compte"
        >
          <Menu size={18} />
        </button>
      </div>
    </header>
  )
}
