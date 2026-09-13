'use client'

import React from 'react'
import type { ManageTab } from '../../types'
import { Info, ChevronRight } from 'lucide-react'

interface BoutiqueDashboardKpiGridProps {
  loading: boolean
  caMois: number | null
  nbEnAttente: number
  stockAlertsCount: number | null
  dettesTotal: number | null
  produitsCount: number | null
  formatPrice: (n: number) => string
  formatNumber: (n: number) => string
  onNavigate: (tab: ManageTab) => void
  t: (key: string) => string
}

export default function BoutiqueDashboardKpiGrid({
  loading,
  caMois,
  nbEnAttente,
  stockAlertsCount,
  dettesTotal,
  produitsCount,
  formatPrice,
  formatNumber,
  onNavigate,
  t,
}: BoutiqueDashboardKpiGridProps) {
  return (
    <div className="bq-kpi-grid">
      {/* KPI 1 : Chiffre d'Affaires du Mois */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onNavigate('compta')}
        onKeyDown={(e) => e.key === 'Enter' && onNavigate('compta')}
        className="bq-kpi-card"
        style={{
          background: '#FFFFFF',
          border: '1.5px solid #E2E8F0',
          borderRadius: 14,
          padding: '16px 18px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 6,
          minHeight: 92,
          cursor: 'pointer',
          transition: 'all 0.18s ease',
        }}
        title="Cliquez pour accéder au journal et au bilan comptable"
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
          <span
            className="num-tabular"
            style={{
              fontSize: 22,
              fontWeight: 850,
              color: 'var(--navy, #1C2B4A)',
              lineHeight: '28px',
              letterSpacing: '-0.02em',
            }}
          >
            {loading ? '...' : caMois !== null ? `${formatPrice(caMois)}` : '0 FCFA'}
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#16A34A',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
            }}
          >
            ● Ce mois
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>Chiffre d&apos;affaires</span>
          <span
            title="Total des encaissements enregistrés ce mois-ci (ventes caisse POS et commandes web)"
            style={{ display: 'inline-flex', alignItems: 'center' }}
          >
            <Info size={13} style={{ color: '#94A3B8', flexShrink: 0 }} />
          </span>
          <ChevronRight size={13} style={{ marginLeft: 'auto', color: '#CBD5E1' }} />
        </div>
      </div>

      {/* KPI 2 : Commandes en attente */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onNavigate('commandes')}
        onKeyDown={(e) => e.key === 'Enter' && onNavigate('commandes')}
        className="bq-kpi-card"
        style={{
          background: '#FFFFFF',
          border: nbEnAttente > 0 ? '1.5px solid #FED7AA' : '1.5px solid #E2E8F0',
          borderRadius: 14,
          padding: '16px 18px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 6,
          minHeight: 92,
          cursor: 'pointer',
          transition: 'all 0.18s ease',
        }}
        title="Cliquez pour gérer et préparer vos commandes"
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
          <span
            className="num-tabular"
            style={{
              fontSize: 22,
              fontWeight: 850,
              color: nbEnAttente > 0 ? 'var(--accent, #C75B00)' : 'var(--navy, #1C2B4A)',
              lineHeight: '28px',
              letterSpacing: '-0.02em',
            }}
          >
            {formatNumber(nbEnAttente)}
          </span>
          {nbEnAttente > 0 ? (
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#DC2626',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
              }}
            >
              ● {nbEnAttente} à traiter
            </span>
          ) : (
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#16A34A',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
              }}
            >
              ✓ À jour
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>
            {t('shop.pendingOrdersCount')}
          </span>
          <span
            title="Commandes clients en attente de préparation ou d'expédition"
            style={{ display: 'inline-flex', alignItems: 'center' }}
          >
            <Info size={13} style={{ color: '#94A3B8', flexShrink: 0 }} />
          </span>
          <ChevronRight size={13} style={{ marginLeft: 'auto', color: '#CBD5E1' }} />
        </div>
      </div>

      {/* KPI 3 : Alertes Stock */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onNavigate('produits')}
        onKeyDown={(e) => e.key === 'Enter' && onNavigate('produits')}
        className="bq-kpi-card"
        style={{
          background: '#FFFFFF',
          border: stockAlertsCount && stockAlertsCount > 0 ? '1.5px solid #FCD34D' : '1.5px solid #E2E8F0',
          borderRadius: 14,
          padding: '16px 18px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 6,
          minHeight: 92,
          cursor: 'pointer',
          transition: 'all 0.18s ease',
        }}
        title="Cliquez pour réapprovisionner ou ajuster vos stocks"
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
          <span
            className="num-tabular"
            style={{
              fontSize: 22,
              fontWeight: 850,
              color: stockAlertsCount && stockAlertsCount > 0 ? '#B45309' : 'var(--navy, #1C2B4A)',
              lineHeight: '28px',
              letterSpacing: '-0.02em',
            }}
          >
            {loading ? '...' : formatNumber(stockAlertsCount ?? 0)}
          </span>
          {stockAlertsCount && stockAlertsCount > 0 ? (
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#D97706',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
              }}
            >
              Faible
            </span>
          ) : (
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#16A34A',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
              }}
            >
              ✓ En stock
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>{t('shop.stockAlerts')}</span>
          <span
            title="Articles dont le stock est épuisé ou inférieur au seuil d'alerte configuré"
            style={{ display: 'inline-flex', alignItems: 'center' }}
          >
            <Info size={13} style={{ color: '#94A3B8', flexShrink: 0 }} />
          </span>
          <ChevronRight size={13} style={{ marginLeft: 'auto', color: '#CBD5E1' }} />
        </div>
      </div>

      {/* KPI 4 : Dettes Clients / Carnet */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onNavigate(dettesTotal && dettesTotal > 0 ? 'carnet' : 'produits')}
        onKeyDown={(e) =>
          e.key === 'Enter' && onNavigate(dettesTotal && dettesTotal > 0 ? 'carnet' : 'produits')
        }
        className="bq-kpi-card"
        style={{
          background: '#FFFFFF',
          border: dettesTotal && dettesTotal > 0 ? '1.5px solid #FECACA' : '1.5px solid #E2E8F0',
          borderRadius: 14,
          padding: '16px 18px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 6,
          minHeight: 92,
          cursor: 'pointer',
          transition: 'all 0.18s ease',
        }}
        title="Cliquez pour consulter le carnet de dettes et relancer les clients"
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
          <span
            className="num-tabular"
            style={{
              fontSize: 22,
              fontWeight: 850,
              color: dettesTotal && dettesTotal > 0 ? '#DC2626' : 'var(--navy, #1C2B4A)',
              lineHeight: '28px',
              letterSpacing: '-0.02em',
            }}
          >
            {loading
              ? '...'
              : dettesTotal && dettesTotal > 0
              ? `${formatPrice(dettesTotal)}`
              : `${formatNumber(produitsCount ?? 0)} art.`}
          </span>
          {dettesTotal && dettesTotal > 0 ? (
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#DC2626',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
              }}
            >
              ● À recouvrer
            </span>
          ) : (
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#16A34A',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
              }}
            >
              ✓ Zéro dette
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>
            {dettesTotal && dettesTotal > 0 ? 'Dettes clients' : t('shop.catalog')}
          </span>
          <span
            title="Montant total des crédits et dettes clients en cours à recouvrer via relance WhatsApp"
            style={{ display: 'inline-flex', alignItems: 'center' }}
          >
            <Info size={13} style={{ color: '#94A3B8', flexShrink: 0 }} />
          </span>
          <ChevronRight size={13} style={{ marginLeft: 'auto', color: '#CBD5E1' }} />
        </div>
      </div>
    </div>
  )
}
