'use client'

import React from 'react'
import Link from 'next/link'
import { Monitor, HelpCircle, PlusCircle } from 'lucide-react'
import { useTranslation } from '@/i18n/context'

interface BoutiqueListHeaderProps {
  boutiquesCount: number
  canCreate: boolean
  planActif?: string | null
  prixPro: number
  successMsg: string | null
  deleteError: string | null
  sponsorError: string | null
  onOpenProductTour: () => void
  onCreateShop: () => void
}

export default function BoutiqueListHeader({
  boutiquesCount,
  canCreate,
  planActif,
  prixPro,
  successMsg,
  deleteError,
  sponsorError,
  onOpenProductTour,
  onCreateShop,
}: BoutiqueListHeaderProps) {
  const { t } = useTranslation()

  return (
    <>
      {/* Fil d'Ariane */}
      <nav
        aria-label="Fil d'Ariane"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 12,
          fontWeight: 600,
          background: 'var(--orange2, #FFF3E8)',
          padding: '5px 14px',
          borderRadius: '20px',
          border: '1px solid rgba(199, 91, 0, 0.12)',
          boxShadow: '0 1px 3px rgba(199, 91, 0, 0.05)',
          marginBottom: 16,
        }}
      >
        <Link
          href="/compte"
          style={{
            color: 'var(--text2, #6B5E52)',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          Mon compte
        </Link>
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--accent, #C75B00)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ opacity: 0.6 }}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span style={{ color: 'var(--accent, #C75B00)', fontWeight: 700 }}>Mes boutiques</span>
      </nav>

      {/* Header Principal Harmonisé */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 16,
          padding: '24px 28px',
          border: '1px solid var(--border, #E8DDD2)',
          boxShadow: 'var(--shadow-xs)',
          marginBottom: 28,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 20,
        }}
      >
        <div style={{ flex: '1 1 320px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 900,
                color: 'var(--navy, #1C2B4A)',
                margin: 0,
                letterSpacing: '-0.02em',
              }}
            >
              Mes Boutiques
            </h1>
            <span
              style={{
                fontSize: 12,
                fontWeight: 800,
                background: 'var(--orange2, #FFF3E8)',
                color: 'var(--accent, #C75B00)',
                border: '1px solid rgba(199, 91, 0, 0.2)',
                padding: '3px 10px',
                borderRadius: 20,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent, #C75B00)' }} />
              {boutiquesCount > 3
                ? `${boutiquesCount} boutiques actives`
                : `${boutiquesCount} / 3 autorisée${boutiquesCount > 1 ? 's' : ''}`}
            </span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text2, #6B5E52)', margin: 0, lineHeight: 1.5 }}>
            Gérez vos points de vente, catalogue produits, encaissements et caisse enregistreuse POS.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/boutique/caisse"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              borderRadius: 10,
              background: '#ffffff',
              border: '1.5px solid var(--border, #E8DDD2)',
              color: 'var(--navy, #1C2B4A)',
              fontWeight: 700,
              fontSize: 13,
              textDecoration: 'none',
              boxShadow: '0 2px 6px rgba(26,22,18,0.04)',
              transition: 'all 0.15s ease',
            }}
          >
            <Monitor size={16} style={{ color: 'var(--navy, #1C2B4A)' }} />
            <span>{t('shop.openPosBtn')}</span>
          </Link>

          <button
            type="button"
            onClick={onOpenProductTour}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 14px',
              borderRadius: 10,
              background: '#ffffff',
              border: '1.5px solid #e2e8f0',
              color: '#334155',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title="Revoir le guide de démarrage en 3 étapes"
          >
            <HelpCircle size={15} />
            <span>Guide 3 étapes</span>
          </button>

          {canCreate && (
            <button
              onClick={onCreateShop}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                borderRadius: 10,
                background: 'linear-gradient(135deg, #C75B00 0%, #a84c00 100%)',
                border: 'none',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(199,91,0,0.25)',
                transition: 'all 0.15s ease',
              }}
            >
              <PlusCircle size={16} />
              <span>{t('shop.createShop')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div
          style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: 10,
            padding: '12px 16px',
            color: '#16a34a',
            fontSize: 14,
            marginBottom: 20,
            fontWeight: 600,
          }}
        >
          {successMsg}
        </div>
      )}
      {(deleteError || sponsorError) && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 10,
            padding: '12px 16px',
            color: '#dc2626',
            fontSize: 14,
            marginBottom: 20,
          }}
        >
          {deleteError || sponsorError}
        </div>
      )}

      {/* Bannière pro */}
      {!planActif && boutiquesCount > 0 && (
        <Link
          href="/boutique/abonnement"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            background: 'linear-gradient(135deg, #fff8f0 0%, #fff3e0 100%)',
            border: '1px solid #f59e0b',
            borderRadius: 14,
            padding: '16px 20px',
            marginBottom: 24,
            textDecoration: 'none',
          }}
        >
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: '#92400e' }}>{t('shop.proBannerTitle')}</p>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: '#b45309' }}>
              {t('shop.proBannerDesc')} — {prixPro.toLocaleString('fr-FR')} FCFA/mois
            </p>
          </div>
          <span style={{ color: '#C75B00', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
            {t('shop.viewPlans')}
          </span>
        </Link>
      )}
    </>
  )
}
