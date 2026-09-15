'use client'

import React from 'react'
import Link from 'next/link'
import {
  Briefcase,
  FileSignature,
  Scale,
  Key,
  UserCheck,
  Wrench,
  CreditCard,
  FileText,
  Wallet,
  Share2,
  ExternalLink,
  Users,
  ShieldAlert,
  Settings,
  ArrowRight,
  TrendingUp,
  Building2,
  Receipt,
  Sparkles,
  Shield,
  LucideIcon
} from 'lucide-react'

interface DashboardRubriquesProps {
  slug: string
}

interface RubriqueTool {
  href: string
  title: string
  desc: string
  icon: LucideIcon
  color: string
}

interface RubriqueSection {
  title: string
  subtitle: string
  icon: LucideIcon
  badge: string
  tools: RubriqueTool[]
}

export function DashboardRubriques({ slug }: DashboardRubriquesProps) {
  const sections: RubriqueSection[] = [
    {
      title: 'Transactions & Ventes',
      subtitle: 'Pipeline notarial, mandats de vente et offres d’achat',
      icon: Briefcase,
      badge: 'Vente',
      tools: [
        {
          href: `/agence/${slug}/transactions`,
          title: 'Transactions & Compromis',
          desc: 'Suivi notarial, séquestres, actes authentiques et clôtures',
          icon: Briefcase,
          color: '#0284C7',
        },
        {
          href: `/agence/${slug}/mandats`,
          title: 'Mandats de Vente & Recherche',
          desc: 'Mandats exclusifs et simples, durées et renouvellements',
          icon: FileSignature,
          color: '#0284C7',
        },
        {
          href: `/agence/${slug}/offres`,
          title: 'Offres & Négociations',
          desc: 'Offres d’achat reçues, contre-propositions et accords',
          icon: Scale,
          color: '#0284C7',
        },
      ],
    },
    {
      title: 'Gestion Locative & Terrain',
      subtitle: 'Baux, quittances automatiques, incidents et cautions échelonnées',
      icon: Building2,
      badge: 'Gérance',
      tools: [
        {
          href: `/agence/${slug}/locatif`,
          title: 'Loyers & Quittances',
          desc: 'Encaissements Wave/OM/Cash et quittances certifiées numérotées',
          icon: Key,
          color: '#166534',
        },
        {
          href: `/agence/${slug}/locataires`,
          title: 'Répertoire Locataires',
          desc: 'Fiches locataires, baux actifs, historique et contact direct',
          icon: UserCheck,
          color: '#0369A1',
        },
        {
          href: `/agence/${slug}/maintenance`,
          title: 'Maintenance & Travaux',
          desc: 'Gestion des incidents signalés, artisans et imputation des coûts',
          icon: Wrench,
          color: '#D97706',
        },
        {
          href: `/agence/${slug}/credits`,
          title: 'Crédits & Échelonnement',
          desc: 'Caution en 2x/3x/4x, terrains étalés et relances WhatsApp',
          icon: CreditCard,
          color: '#EA580C',
        },
      ],
    },
    {
      title: 'Finance, Facturation & Commissions',
      subtitle: 'Honoraires de gestion, commissions de vente et factures légales',
      icon: Receipt,
      badge: 'Finance',
      tools: [
        {
          href: `/agence/${slug}/factures`,
          title: 'Factures & Honoraires',
          desc: 'Émission factures pro avec TVA 18%, NINEA et impression PDF',
          icon: FileText,
          color: '#0284C7',
        },
        {
          href: `/agence/${slug}/compta`,
          title: 'Comptabilité & Commissions',
          desc: 'Honoraires d’agence, commissions partagées et reversements bailleurs',
          icon: Wallet,
          color: 'var(--navy, #1C2B4A)',
        },
      ],
    },
    {
      title: 'Marketing & Vitrine Commerciale',
      subtitle: 'Social Shop, flux vidéo Reels et vitrine publique des biens',
      icon: Sparkles,
      badge: 'Visibilité',
      tools: [
        {
          href: `/agence/${slug}/social`,
          title: 'Social Shop & Vidéos',
          desc: 'Aspirateur de Reels TikTok/Instagram, tagging de biens et marketing',
          icon: Share2,
          color: '#16a34a',
        },
        {
          href: `/agence/${slug}/vitrine`,
          title: 'Vitrine Publique Agence',
          desc: 'Page publique avec catalogue de biens et contact direct WhatsApp',
          icon: ExternalLink,
          color: 'var(--accent, #C75B00)',
        },
      ],
    },
    {
      title: 'Organisation, Équipe & Légal',
      subtitle: 'Négociateurs internes, courtiers partenaires et conformité',
      icon: Shield,
      badge: 'Direction',
      tools: [
        {
          href: `/agence/${slug}/equipe`,
          title: 'Équipe, Agents & Courtiers',
          desc: 'Gestion des négociateurs et courtiers partenaires apporteurs',
          icon: Users,
          color: '#166534',
        },
        {
          href: `/agence/${slug}/fiscalite`,
          title: 'Fiscalité & Légal',
          desc: 'NINEA, RCCM, TVA 18%, timbre fiscal et mentions légales',
          icon: ShieldAlert,
          color: '#7C3AED',
        },
        {
          href: `/agence/${slug}/parametres`,
          title: 'Paramètres & Statut Agence',
          desc: 'Statut actif/pause/congés, coordonnées et informations générales',
          icon: Settings,
          color: '#475569',
        },
      ],
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginTop: 24 }}>
      {sections.map((sec, sIdx) => {
        const SectionIcon = sec.icon
        return (
          <div key={sIdx} className="agence-card">
            {/* Titre de Rubrique */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: 14,
                marginBottom: 16,
                borderBottom: '1px solid var(--border, #E8DDD2)',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: 'rgba(28, 43, 74, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--navy, #1C2B4A)',
                  }}
                >
                  <SectionIcon size={16} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                    {sec.title}
                  </h3>
                  <p style={{ margin: 0, fontSize: 11.5, color: '#64748B' }}>
                    {sec.subtitle}
                  </p>
                </div>
              </div>

              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  background: 'rgba(199, 91, 0, 0.08)',
                  color: 'var(--accent, #C75B00)',
                  padding: '3px 10px',
                  borderRadius: 12,
                }}
              >
                {sec.badge}
              </span>
            </div>

            {/* Grille de Cartes */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: 14,
              }}
            >
              {sec.tools.map((m) => {
                const Icon = m.icon
                return (
                  <Link
                    key={m.href}
                    href={m.href}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      padding: 14,
                      borderRadius: 10,
                      border: '1px solid var(--border, #E8DDD2)',
                      background: '#FFFFFF',
                      textDecoration: 'none',
                      transition: 'all 0.15s ease',
                    }}
                    className="kpi-card"
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: 'rgba(28, 43, 74, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: m.color,
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={18} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 750,
                          color: 'var(--navy, #1C2B4A)',
                          fontSize: 13,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span>{m.title}</span>
                        <ArrowRight size={13} style={{ color: '#94A3B8', opacity: 0.6 }} />
                      </div>
                      <div
                        style={{
                          fontSize: 11.5,
                          color: '#64748B',
                          marginTop: 3,
                          lineHeight: 1.4,
                        }}
                      >
                        {m.desc}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
