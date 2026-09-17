'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import type { Boutique, ManageTab, NavGroup } from '../../types'
import { VALID_TABS, getBoutiqueNavSections, getNavEssential, getNavCommerce, getNavAdvanced, getTabInfoMap } from './constants'

export function useBoutiqueManageNav({
  boutique,
  planActif,
  initialTabProp,
  t,
}: {
  boutique: Boutique
  planActif: 'pro' | 'business' | 'decouverte' | 'taf_taf' | null
  initialTabProp?: string
  t: (key: string, params?: any) => string
}) {
  const resolvedInitialTab: ManageTab = VALID_TABS.includes(initialTabProp as ManageTab)
    ? (initialTabProp as ManageTab)
    : 'dashboard'

  const navEssential = useMemo(() => getNavEssential(t), [t])
  const navCommerce = useMemo(() => getNavCommerce(t), [t])
  const navAdvanced = useMemo(() => getNavAdvanced(t), [t])
  const tabInfoMap = useMemo(() => getTabInfoMap(t), [t])

  const [navTier, setNavTierState] = useState<'essential' | 'commerce' | 'all'>('all')

  const setNavTier = useCallback((tier: 'essential' | 'commerce' | 'all') => {
    setNavTierState(tier)
  }, [])

  const showAdvancedNav = true
  const setShowAdvancedNav = useCallback(() => {}, [])
  const toggleNavTier = useCallback(() => {}, [])

  const navGroups: NavGroup[] = useMemo(() => {
    return getBoutiqueNavSections(t, boutique.id)
  }, [t, boutique.id])

  const [tab, setTab] = useState<ManageTab>(resolvedInitialTab)
  const [subTabCompta, setSubTabCompta] = useState<'bilan' | 'dashboard' | 'express' | 'ventes' | 'depenses'>('bilan')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false)
  const [filtreProduitsMarketing, setFiltreProduitsMarketing] = useState<'jamais_partage' | undefined>(undefined)
  const [nbEnAttente, setNbEnAttente] = useState(0)
  const [toast, setToast] = useState<string | null>(null)

  const [isModeFacile, setIsModeFacile] = useState<boolean>(() => {
    try {
      return localStorage.getItem('nopalou_dashboard_mode_facile') === 'true'
    } catch {
      return false
    }
  })

  const setModeFacilePersisted = useCallback((enabled: boolean) => {
    setIsModeFacile(enabled)
    try {
      localStorage.setItem('nopalou_dashboard_mode_facile', enabled ? 'true' : 'false')
    } catch (err) {
      console.warn('[Nopalou:BoutiqueManage:mode_facile]', err)
    }
  }, [])

  const isTrialActive = Boolean(boutique.is_trial)
  const joursRestantsEssai = boutique.jours_restants_essai ?? 30
  const effectivePlan = isTrialActive ? 'business' : planActif

  const isAllowed = useCallback((minPlan?: 'pro' | 'business') => {
    if (isTrialActive) return true
    if (!minPlan) return true
    if (effectivePlan === 'business') return true
    if (minPlan === 'pro' && effectivePlan === 'pro') return true
    return false
  }, [isTrialActive, effectivePlan])

  const handleNavigateTab = useCallback((targetTab: ManageTab, subTab?: string) => {
    if (targetTab === 'compta') {
      setSubTabCompta((subTab as any) || 'bilan')
    }
    const isAdvancedTab = navAdvanced.some((g) => g.items.some((i) => i.key === targetTab))
    if (isAdvancedTab) {
      setNavTier('all')
    } else {
      const isCommerceTab = navCommerce.some((g) => g.items.some((i) => i.key === targetTab))
      if (isCommerceTab) {
        setNavTierState((prev) => (prev === 'essential' ? 'commerce' : prev))
      }
    }
    if (typeof window !== 'undefined' && targetTab !== tab) {
      const url = new URL(window.location.href)
      url.searchParams.set('tab', targetTab)
      window.history.pushState({ tab: targetTab, boutiqueManage: true }, '', url.toString())
    }
    setTab(targetTab)
  }, [navAdvanced, navCommerce, setNavTier, tab])

  // Sync browser popstate
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window === 'undefined') return
      const url = new URL(window.location.href)
      const currentTab = (url.searchParams.get('tab') as ManageTab) || 'dashboard'
      if (VALID_TABS.includes(currentTab)) {
        setTab(currentTab)
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Sync tab search param in URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      if (url.searchParams.get('tab') !== tab) {
        url.searchParams.set('tab', tab)
        window.history.replaceState(null, '', url.toString())
      }
    }
  }, [tab])

  // Sync boutique manage param in URL
  useEffect(() => {
    if (boutique?.id && typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      if (url.searchParams.get('manage') !== boutique.id) {
        url.searchParams.set('manage', boutique.id)
        window.history.replaceState(null, '', url.toString())
      }
    }
  }, [boutique?.id])

  // Polling for pending orders count
  useEffect(() => {
    let lastCount = -1
    async function check() {
      try {
        const res = await fetch(`/api/compta-proxy/${boutique.id}/commandes-count`)
        if (!res.ok) return
        const { count } = await res.json()
        if (lastCount >= 0 && count > lastCount) {
          const diff = count - lastCount
          setToast(`${diff} nouvelle${diff > 1 ? 's' : ''} commande${diff > 1 ? 's' : ''} en attente !`)
          setTimeout(() => setToast(null), 6000)
        }
        lastCount = count
        setNbEnAttente(count)
      } catch {
        /* silencieux */
      }
    }
    check()
    const id = setInterval(check, 30_000)
    return () => clearInterval(id)
  }, [boutique.id])

  const allNavItems = useMemo(() => navGroups.flatMap((g) => g.items), [navGroups])
  const currentNavItem = allNavItems.find((i) => i.key === tab)
  const tabAllowed = isAllowed(currentNavItem?.minPlan)
  const currentTabInfo = tabInfoMap[tab] ?? tabInfoMap.dashboard

  return {
    tab,
    setTab,
    subTabCompta,
    handleNavigateTab,
    navTier,
    setNavTier,
    toggleNavTier,
    navCommerce,
    showAdvancedNav,
    setShowAdvancedNav,
    navGroups,
    navAdvanced,
    isSidebarOpen,
    setIsSidebarOpen,
    isSwitcherOpen,
    setIsSwitcherOpen,
    isModeFacile,
    setModeFacilePersisted,
    filtreProduitsMarketing,
    setFiltreProduitsMarketing,
    nbEnAttente,
    toast,
    setToast,
    isTrialActive,
    joursRestantsEssai,
    effectivePlan,
    isAllowed,
    currentNavItem,
    tabAllowed,
    currentTabInfo,
  }
}
