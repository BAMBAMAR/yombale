'use client'

import React, { useState, useCallback, useEffect } from 'react'
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
import BoutiqueTopNavbar from './BoutiqueTopNavbar'
import BoutiqueBottomNav from './BoutiqueBottomNav'
import BoutiqueQuickActionsSheet from './BoutiqueQuickActionsSheet'
import BoutiqueMobileDrawer from './BoutiqueMobileDrawer'

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
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [quickActionsOpen, setQuickActionsOpen] = useState(false)

  useEffect(() => {
    document.body.classList.add('in-boutique-workspace')
    return () => {
      document.body.classList.remove('in-boutique-workspace')
    }
  }, [])

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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ── Entête Unique au niveau Nopalou (56px Desktop & Mobile) ── */}
      <BoutiqueTopNavbar
        boutique={boutique}
        nbEnAttente={nav.nbEnAttente}
        onNavigateTab={nav.handleNavigateTab}
        onOpenMenu={() => setMobileDrawerOpen(true)}
        onBack={onBack}
      />

      {/* ── Corps : Sidebar à gauche sous Nopalou + Contenu Marchand ── */}
      <div className="bq-manage-layout">
        {/* Sidebar */}
        <aside className={`bq-sidebar${!nav.isSidebarOpen ? ' bq-sidebar--hidden' : ''}`} data-tab={nav.tab}>
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

      {/* ── Pied Mobile (Barre basse fixe 5 boutons avec FAB central) ── */}
      <BoutiqueBottomNav
        currentTab={nav.tab}
        subTabCompta={nav.subTabCompta}
        onNavigateTab={nav.handleNavigateTab}
        onOpenQuickActions={() => {
          const isExpressPresent =
            nav.tab === 'express' ||
            (nav.tab === 'compta' && nav.subTabCompta === 'express') ||
            (typeof document !== 'undefined' && Boolean(document.getElementById('express-view-container')))

          if (nav.tab === 'carnet') {
            window.dispatchEvent(new CustomEvent('nopalou:carnet:open_sheet'))
          } else if (isExpressPresent) {
            window.dispatchEvent(new CustomEvent('nopalou:express:quick_action'))
          } else {
            setQuickActionsOpen(true)
          }
        }}
        onOpenDrawer={() => setMobileDrawerOpen(true)}
        nbEnAttente={nav.nbEnAttente}
      />

      {/* ── Action Sheet Rapide Marchande ── */}
      <BoutiqueQuickActionsSheet
        nom={boutique.nom}
        boutiqueId={boutique.id}
        isOpen={quickActionsOpen}
        onClose={() => setQuickActionsOpen(false)}
        onNavigateTab={nav.handleNavigateTab}
        onOpenQrModal={() => setShowQrModal(true)}
      />

      {/* ── Tiroir Latéral Navigation Complète Mobile (27 Outils) ── */}
      <BoutiqueMobileDrawer
        boutique={boutique}
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        currentTab={nav.tab}
        onNavigateTab={nav.handleNavigateTab}
        onBack={onBack}
        nbEnAttente={nav.nbEnAttente}
        isAllowed={nav.isAllowed}
        t={t}
        hasMultipleBoutiques={hasMultipleBoutiques}
        boutiques={boutiques}
        onSelectBoutique={onSelectBoutique}
      />
    </div>
  )
}
