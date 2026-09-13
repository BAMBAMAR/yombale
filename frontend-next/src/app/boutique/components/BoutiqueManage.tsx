'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/i18n/context'
import type { Boutique } from '../types'
import QrCodeShareModal from '@/components/QrCodeShareModal'

import { useBoutiqueManageNav } from './manage/useBoutiqueManageNav'
import BoutiqueManageSidebarHeader from './manage/BoutiqueManageSidebarHeader'
import BoutiqueManageSidebarNav from './manage/BoutiqueManageSidebarNav'
import BoutiqueManageHeader from './manage/BoutiqueManageHeader'
import BoutiqueManagePlanGate from './manage/BoutiqueManagePlanGate'
import BoutiqueManageContent from './manage/BoutiqueManageContent'

export default function BoutiqueManage({
  boutique,
  planActif,
  onBack,
  onEdit,
  prixPro,
  initialTab: initialTabProp,
  hasMultipleBoutiques = false,
  boutiques = [],
  onSelectBoutique,
  onCreateBoutique,
}: {
  boutique: Boutique
  planActif: 'pro' | 'business' | 'decouverte' | 'taf_taf' | null
  onBack: () => void
  onEdit: () => void
  prixPro: number
  initialTab?: string
  hasMultipleBoutiques?: boolean
  boutiques?: Boutique[]
  onSelectBoutique?: (b: Boutique) => void
  onCreateBoutique?: () => void
}) {
  const router = useRouter()
  const { t, formatNumber } = useTranslation() as { t: any; formatNumber: any }
  const [showQrModal, setShowQrModal] = useState(false)

  const nav = useBoutiqueManageNav({
    boutique,
    planActif,
    initialTabProp,
    t,
  })

  const handleBoutiqueSaved = useCallback(() => {
    router.refresh()
  }, [router])

  return (
    <>
      <div className="bq-manage-layout">
        {/* Sidebar */}
        <aside className={`bq-sidebar${!nav.isSidebarOpen ? ' bq-sidebar--hidden' : ''}`}>
          <BoutiqueManageSidebarHeader
            boutique={boutique}
            tab={nav.tab}
            hasMultipleBoutiques={hasMultipleBoutiques}
            boutiques={boutiques}
            onBack={onBack}
            onSelectBoutique={onSelectBoutique}
            onCreateBoutique={onCreateBoutique}
            onNavigateTab={nav.handleNavigateTab}
            isSwitcherOpen={nav.isSwitcherOpen}
            setIsSwitcherOpen={nav.setIsSwitcherOpen}
            isTrialActive={nav.isTrialActive}
            planActif={planActif}
            onCloseSidebar={() => nav.setIsSidebarOpen(false)}
            t={t}
          />

          <BoutiqueManageSidebarNav
            navGroups={nav.navGroups}
            navAdvanced={nav.navAdvanced}
            tab={nav.tab}
            onNavigateTab={nav.handleNavigateTab}
            showAdvancedNav={nav.showAdvancedNav}
            navTier={nav.navTier}
            onToggleAdvancedNav={nav.toggleNavTier}
            isAllowed={nav.isAllowed}
            nbEnAttente={nav.nbEnAttente}
            formatNumber={formatNumber}
            boutique={boutique}
            onBack={onBack}
            hasMultipleBoutiques={hasMultipleBoutiques}
            boutiques={boutiques}
            onSelectBoutique={onSelectBoutique}
            t={t}
          />
        </aside>

        <QrCodeShareModal
          isOpen={showQrModal}
          onClose={() => setShowQrModal(false)}
          url={
            typeof window !== 'undefined'
              ? `${window.location.origin}/boutiques/${boutique.slug || boutique.id}`
              : `https://nopalou.com/boutiques/${boutique.slug || boutique.id}`
          }
          boutiqueNom={boutique.nom}
        />

        {/* Contenu principal */}
        <main className={`bq-main${!nav.isSidebarOpen ? ' bq-main--expanded' : ''}`}>
          <BoutiqueManageHeader
            toast={nav.toast}
            onToastClick={() => {
              nav.setTab('commandes')
              nav.setToast(null)
            }}
            onCloseToast={() => nav.setToast(null)}
            isSidebarOpen={nav.isSidebarOpen}
            onOpenSidebar={() => nav.setIsSidebarOpen(true)}
            boutiqueNom={boutique.nom}
            isTrialActive={nav.isTrialActive}
            joursRestantsEssai={nav.joursRestantsEssai}
            currentTabInfo={nav.currentTabInfo}
          />

          {!nav.tabAllowed ? (
            <BoutiqueManagePlanGate minPlan={nav.currentNavItem?.minPlan} t={t} />
          ) : (
            <BoutiqueManageContent
              tab={nav.tab}
              boutique={boutique}
              effectivePlan={nav.effectivePlan}
              prixPro={prixPro}
              subTabCompta={nav.subTabCompta}
              isModeFacile={nav.isModeFacile}
              onSetModeFacile={nav.setModeFacilePersisted}
              filtreProduitsMarketing={nav.filtreProduitsMarketing}
              onSetFiltreProduitsMarketing={nav.setFiltreProduitsMarketing}
              onNavigateTab={nav.handleNavigateTab}
              onBack={onBack}
              onBoutiqueSaved={handleBoutiqueSaved}
              onOpenQrModal={() => setShowQrModal(true)}
              nbEnAttente={nav.nbEnAttente}
            />
          )}
        </main>
      </div>
    </>
  )
}
