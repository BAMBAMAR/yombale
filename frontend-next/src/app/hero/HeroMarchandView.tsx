'use client'

import React from 'react'
import Link from 'next/link'
import {
  Zap,
  Store,
  BookOpen,
  MessageCircle,
  ArrowRight
} from 'lucide-react'

interface HeroMarchandViewProps {
  prixTafTaf?: number
  activeBoutiqueNom?: string | null
}

const MARCHAND_CARDS = [
  {
    icon: Zap,
    iconBg: 'rgba(199, 91, 0, 0.12)',
    iconColor: 'var(--accent, #C75B00)',
    badge: '100% HORS-LIGNE',
    badgeBg: 'rgba(16, 185, 129, 0.12)',
    badgeColor: '#0A5C36',
    title: 'Caisse POS Tactile',
    desc: 'Encaissez au comptoir même sans Internet. Scan par caméra smartphone, tickets WhatsApp et clôtures Z.',
    href: '/pos',
    ctaText: 'Découvrir la caisse',
    isPrimary: true,
  },
  {
    icon: Store,
    iconBg: 'rgba(199, 91, 0, 0.12)',
    iconColor: 'var(--accent, #C75B00)',
    badge: '0% COMMISSION',
    badgeBg: 'rgba(199, 91, 0, 0.12)',
    badgeColor: 'var(--accent, #C75B00)',
    title: 'Boutique en Ligne',
    desc: 'Votre catalogue web en 2 minutes avec nom personnalisé, paiement Wave/OM et référencement Google.',
    href: '/creer-boutique',
    ctaText: 'Créer ma boutique',
    isPrimary: false,
  },
  {
    icon: BookOpen,
    iconBg: 'rgba(37, 99, 235, 0.12)',
    iconColor: '#2563EB',
    badge: 'RELANCE WAVE',
    badgeBg: 'rgba(37, 99, 235, 0.12)',
    badgeColor: '#1D4ED8',
    title: 'Carnet Dettes & Stock',
    desc: 'Finis les cahiers perdus. Suivez les créances clients, envoyez des liens de paiement Wave 1-clic et gérez vos alertes stock.',
    href: '/gestion-stock-carnet-dettes',
    ctaText: 'Gérer mes dettes',
    isPrimary: false,
  },
  {
    icon: MessageCircle,
    iconBg: 'rgba(16, 185, 129, 0.12)',
    iconColor: '#10B981',
    badge: 'BOT AUTOMATIQUE',
    badgeBg: 'rgba(16, 185, 129, 0.12)',
    badgeColor: '#065F46',
    title: 'WhatsApp Commerce',
    desc: 'Commandes directes sans ressaisie et bilan de caisse du soir envoyé en 3 secondes par le bot WhatsApp.',
    href: '/assistant-whatsapp',
    ctaText: 'Simulateur WhatsApp',
    isPrimary: false,
  },
]

export default function HeroMarchandView({
  prixTafTaf = 2500,
  activeBoutiqueNom
}: HeroMarchandViewProps) {
  return (
    <div style={{ width: '100%', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* ── EN-TÊTE ESPACE COMMERÇANT ── */}
      <div style={{ textAlign: 'center', maxWidth: 780, margin: '0 auto 20px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(199, 91, 0, 0.1)',
            color: 'var(--accent, #C75B00)',
            padding: '4px 14px',
            borderRadius: 20,
            fontSize: 11.5,
            fontWeight: 800,
            marginBottom: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}
        >
          <Zap size={13} color="var(--accent, #C75B00)" />
          <span>Le Système d&apos;Exploitation du Commerçant Sénégalais</span>
        </div>

        <h2
          style={{
            fontSize: 'clamp(22px, 3.2vw, 32px)',
            fontWeight: 900,
            color: 'var(--navy, #1C2B4A)',
            margin: '0 0 10px',
            lineHeight: 1.22,
            letterSpacing: '-0.02em'
          }}
        >
          Gérez votre magasin physique, vendez en ligne et encaissez sur{' '}
          <span style={{ color: 'var(--accent, #C75B00)' }}>Wave &amp; WhatsApp</span>
        </h2>

        <p
          style={{
            fontSize: 14,
            color: 'var(--text-subtle, #5A4E42)',
            margin: '0 auto',
            maxWidth: 640,
            lineHeight: 1.5
          }}
        >
          Caisse tactile 100% hors-ligne sur votre téléphone, carnet de dettes avec relance Wave automatique et boutique web sans commission.
        </p>

        {/* Bannière Pro Connecté si session active */}
        {activeBoutiqueNom && (
          <div
            style={{
              marginTop: 12,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              background: '#ECFDF5',
              border: '1.5px solid #A7F3D0',
              padding: '6px 14px',
              borderRadius: 12,
              fontSize: 12,
              color: '#065F46'
            }}
          >
            <span>
              <strong>Boutique active : {activeBoutiqueNom}</strong>
            </span>
            <Link
              href="/boutique"
              style={{ color: '#047857', fontWeight: 800, textDecoration: 'underline' }}
            >
              Accéder à mon tableau de bord →
            </Link>
          </div>
        )}
      </div>

      {/* ── LES 4 PILIERS MARCHANDS HARMONISÉS ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 230px), 1fr))',
          gap: 16,
          marginBottom: 20
        }}
      >
        {MARCHAND_CARDS.map((card) => {
          const IconComp = card.icon
          return (
            <div
              key={card.title}
              style={{
                background: '#FFFFFF',
                borderRadius: 18,
                padding: '22px 18px',
                boxShadow: '0 4px 16px rgba(28, 43, 74, 0.05)',
                border: '1.5px solid var(--border, #E8DDD2)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 14
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: card.iconBg,
                      color: card.iconColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <IconComp size={20} />
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 900,
                      background: card.badgeBg,
                      color: card.badgeColor,
                      padding: '3px 8px',
                      borderRadius: 8,
                      letterSpacing: '0.03em'
                    }}
                  >
                    {card.badge}
                  </span>
                </div>
                <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
                  {card.title}
                </h3>
                <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-subtle, #5A4E42)', lineHeight: 1.45 }}>
                  {card.desc}
                </p>
              </div>

              <Link
                href={card.href}
                style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: card.isPrimary ? 'var(--navy, #1C2B4A)' : '#F8F5F0',
                  color: card.isPrimary ? '#FFFFFF' : 'var(--navy, #1C2B4A)',
                  border: card.isPrimary ? 'none' : '1.5px solid var(--border, #E8DDD2)',
                  fontSize: 12.5,
                  fontWeight: 800,
                  textDecoration: 'none',
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                <span>{card.ctaText}</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          )
        })}
      </div>

      {/* ── BANDEAU TARIF TAF-TAF ÉPURÉ ET HARMONIEUX ── */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1.5px solid var(--border, #E8DDD2)',
          borderRadius: 14,
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', fontSize: 13 }}>
          <span style={{ color: 'var(--navy, #1C2B4A)', fontWeight: 800 }}>
            Formule Boutique Taf-Taf :
          </span>
          <span style={{ color: 'var(--text-subtle, #5A4E42)' }}>
            Dès <strong style={{ color: 'var(--accent, #C75B00)' }}>{prixTafTaf.toLocaleString('fr-FR')} FCFA/mois</strong> après 30 jours d&apos;essai gratuit • 0% de commission sur vos ventes • Sans engagement
          </span>
        </div>

        <Link
          href="/tarifs-boutique"
          style={{
            color: 'var(--navy, #1C2B4A)',
            fontWeight: 800,
            fontSize: 13,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          <span>Voir la grille tarifaire</span>
          <span>→</span>
        </Link>
      </div>
    </div>
  )
}
