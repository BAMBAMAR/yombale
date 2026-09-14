'use client'

import React from 'react'
import { useTranslation } from '@/i18n/context'
import type { Boutique, ManageTab } from '../types'
import { useBoutiqueDashboardStats } from './dashboard/useBoutiqueDashboardStats'
import BoutiqueDashboardModeSwitch from './dashboard/BoutiqueDashboardModeSwitch'
import BoutiqueDashboardEssentielView from './dashboard/BoutiqueDashboardEssentielView'
import BoutiqueDashboardOnboarding from './dashboard/BoutiqueDashboardOnboarding'
import BoutiqueDashboardKpiGrid from './dashboard/BoutiqueDashboardKpiGrid'
import BoutiqueDashboardActionHub from './dashboard/BoutiqueDashboardActionHub'

export default function BoutiqueDashboard({
  boutique,
  planActif: _planActif,
  nbEnAttente,
  onNavigate,
  onOpenQrModal,
}: {
  boutique: Boutique
  planActif: 'pro' | 'business' | 'decouverte' | 'taf_taf' | null
  nbEnAttente: number
  onNavigate: (tab: ManageTab, subTab?: string) => void
  onOpenQrModal?: () => void
}) {
  const { t, formatPrice, formatNumber } = useTranslation() as { t: any; formatPrice: any; formatNumber: any }
  const stats = useBoutiqueDashboardStats(boutique)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        fontFamily: 'var(--font-inter), system-ui, sans-serif',
      }}
    >
      <BoutiqueDashboardModeSwitch
        modeEssentiel={stats.modeEssentiel}
        onToggleModeEssentiel={stats.toggleModeEssentiel}
      />

      {stats.modeEssentiel ? (
        <BoutiqueDashboardEssentielView
          boutique={boutique}
          loading={stats.loading}
          produitsCount={stats.produitsCount}
          dettesTotal={stats.dettesTotal}
          caMois={stats.caMois}
          nbEnAttente={nbEnAttente}
          formatNumber={formatNumber}
          formatPrice={formatPrice}
          onNavigate={onNavigate}
        />
      ) : (
        <>
          {(!stats.hasProducts || stats.pctReady < 100 || stats.isBienvenue) && !stats.onboardingDismissed && (
            <BoutiqueDashboardOnboarding
              pctReady={stats.pctReady}
              hasProducts={stats.hasProducts}
              hasLogoOrCover={stats.hasLogoOrCover}
              hasDesc={stats.hasDesc}
              onboardingOpen={stats.onboardingOpen}
              setOnboardingOpen={stats.setOnboardingOpen}
              onDismiss={stats.dismissOnboarding}
              onNavigate={onNavigate}
              onOpenQrModal={onOpenQrModal}
            />
          )}

          <BoutiqueDashboardKpiGrid
            loading={stats.loading}
            caMois={stats.caMois}
            nbEnAttente={nbEnAttente}
            stockAlertsCount={stats.stockAlertsCount}
            dettesTotal={stats.dettesTotal}
            produitsCount={stats.produitsCount}
            formatPrice={formatPrice}
            formatNumber={formatNumber}
            onNavigate={onNavigate}
            t={t}
          />

          <BoutiqueDashboardActionHub boutique={boutique} onNavigate={onNavigate} />
        </>
      )}
    </div>
  )
}
