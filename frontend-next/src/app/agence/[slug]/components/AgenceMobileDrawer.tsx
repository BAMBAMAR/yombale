'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  X,
  ArrowLeft,
  Building2,
  LayoutDashboard,
  Home,
  Users2,
  Calendar,
  Key,
  UserCheck,
  ShieldAlert,
  Settings,
  ExternalLink,
  Wallet,
  Wrench,
  FileText,
  CreditCard,
  Briefcase,
  FileSignature,
  Percent,
  History,
  Share2,
  Sparkles,
  LucideIcon
} from 'lucide-react'

interface DrawerItem {
  href: string
  label: string
  icon: LucideIcon
  badge?: number
  external?: boolean
}

interface DrawerSection {
  titre: string
  items: DrawerItem[]
}

interface AgenceMobileDrawerProps {
  slug: string
  nom: string
  isOpen: boolean
  onClose: () => void
  compteurs?: {
    demandes_visite: number
    loyers_retard: number
    mandats_expirants: number
    baux_expirants: number
    tickets_urgents: number
  }
}

export function AgenceMobileDrawer({
  slug,
  nom,
  isOpen,
  onClose,
  compteurs = { demandes_visite: 0, loyers_retard: 0, mandats_expirants: 0, baux_expirants: 0, tickets_urgents: 0 },
}: AgenceMobileDrawerProps) {
  const pathname = usePathname()

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sections: DrawerSection[] = [
    {
      titre: 'Transactions & Ventes',
      items: [
        { href: `/agence/${slug}/biens`, label: 'Biens Immobiliers', icon: Home },
        { href: `/agence/${slug}/mandats`, label: 'Mandats de Vente & Gestion', icon: FileSignature, badge: compteurs.mandats_expirants },
        { href: `/agence/${slug}/transactions`, label: 'Pipeline des Transactions', icon: Briefcase },
        { href: `/agence/${slug}/prospects`, label: 'CRM Prospects & Acquéreurs', icon: Users2 },
        { href: `/agence/${slug}/visites`, label: 'Agenda & Visites', icon: Calendar, badge: compteurs.demandes_visite },
      ],
    },
    {
      titre: 'Gestion Locative',
      items: [
        { href: `/agence/${slug}/locatif`, label: 'Loyers & Quittances', icon: Key, badge: compteurs.loyers_retard },
        { href: `/agence/${slug}/locatif?tab=baux`, label: 'Contrats de Bail', icon: FileSignature },
        { href: `/agence/${slug}/locataires`, label: 'Locataires', icon: UserCheck },
        { href: `/agence/${slug}/bailleurs`, label: 'Bailleurs Propriétaires', icon: Building2 },
        { href: `/agence/${slug}/maintenance`, label: 'Maintenance & Travaux', icon: Wrench, badge: compteurs.tickets_urgents },
        { href: `/agence/${slug}/credits`, label: 'Crédits & Échelonnement', icon: CreditCard },
      ],
    },
    {
      titre: 'Finance & Facturation',
      items: [
        { href: `/agence/${slug}/factures`, label: 'Factures d’Honoraires', icon: FileText },
        { href: `/agence/${slug}/commissions`, label: 'Commissions & Courtiers', icon: Percent },
        { href: `/agence/${slug}/compta`, label: 'Comptabilité & Bilan', icon: Wallet },
      ],
    },
    {
      titre: 'Marketing & Vitrine',
      items: [
        { href: `/agence/${slug}/studio`, label: 'Studio & Thèmes Agence', icon: Sparkles },
        { href: `/agence/${slug}/social`, label: 'Social Shop & Réseaux', icon: Share2 },
        { href: `/agence/${slug}/vitrine`, label: 'Vitrine Publique', icon: ExternalLink, external: true },
      ],
    },
    {
      titre: 'Organisation & Légal',
      items: [
        { href: `/agence/${slug}/abonnement`, label: 'Abonnement & Sponsoring', icon: CreditCard },
        { href: `/agence/${slug}/equipe`, label: 'Équipe, Agents & Courtiers', icon: Users2 },
        { href: `/agence/${slug}/journal`, label: 'Journal d’Activité & Audit', icon: History },
        { href: `/agence/${slug}/fiscalite`, label: 'Fiscalité & Légal COCC', icon: ShieldAlert },
        { href: `/agence/${slug}/parametres`, label: 'Paramètres Agence', icon: Settings },
      ],
    },
  ]

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 110,
        background: 'rgba(28, 43, 74, 0.55)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        justifyContent: 'flex-start',
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        style={{
          width: '85%',
          maxWidth: 320,
          background: '#FFFFFF',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '4px 0 24px rgba(0, 0, 0, 0.2)',
          animation: 'immoSlideRight 0.22s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Entête du tiroir */}
        <div
          style={{
            padding: '16px 18px',
            borderBottom: '1px solid var(--border, #E8DDD2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#FAF8F5',
          }}
        >
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              Espace Agence
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy, #1C2B4A)', marginTop: 2 }}>
              {nom}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--border, #E8DDD2)',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--navy, #1C2B4A)',
              cursor: 'pointer',
            }}
            aria-label="Fermer le menu"
          >
            <X size={16} />
          </button>
        </div>

        {/* Liens de bascule rapide */}
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border, #E8DDD2)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Link
            href="/compte"
            onClick={onClose}
            style={{
              flex: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              fontSize: 11.5,
              fontWeight: 700,
              color: 'var(--navy, #1C2B4A)',
              textDecoration: 'none',
              padding: '7px 8px',
              borderRadius: 6,
              background: '#FAF8F5',
              border: '1px solid var(--border, #E8DDD2)',
              whiteSpace: 'nowrap',
            }}
          >
            <ArrowLeft size={13} />
            Mon compte
          </Link>
          <Link
            href="/agence"
            onClick={onClose}
            style={{
              flex: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              fontSize: 11.5,
              fontWeight: 700,
              color: '#64748B',
              textDecoration: 'none',
              padding: '7px 8px',
              borderRadius: 6,
              background: '#FAF8F5',
              border: '1px solid var(--border, #E8DDD2)',
              whiteSpace: 'nowrap',
            }}
          >
            Mes agences
          </Link>
          <Link
            href="/immo"
            target="_blank"
            style={{
              flex: '1 1 100%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              fontSize: 11.5,
              fontWeight: 700,
              color: 'var(--accent, #C75B00)',
              textDecoration: 'none',
              padding: '6px 8px',
              borderRadius: 6,
              background: 'rgba(199, 91, 0, 0.06)',
            }}
          >
            <Sparkles size={13} />
            Portail Public Immobilier ↗
          </Link>
        </div>

        {/* Contenu déroulant ordonné */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 10px 30px' }}>
          {sections.map((sec) => (
            <div key={sec.titre} style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  color: '#94A3B8',
                  padding: '6px 10px 4px',
                  letterSpacing: '0.5px',
                }}
              >
                {sec.titre}
              </div>
              {sec.items.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    target={item.external ? '_blank' : undefined}
                    onClick={onClose}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: active ? 800 : 600,
                      textDecoration: 'none',
                      color: active ? 'var(--accent, #C75B00)' : 'var(--navy, #1C2B4A)',
                      background: active ? 'rgba(199, 91, 0, 0.08)' : 'transparent',
                      marginBottom: 2,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Icon size={16} color={active ? 'var(--accent, #C75B00)' : '#64748B'} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && item.badge > 0 ? (
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
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AgenceMobileDrawer
