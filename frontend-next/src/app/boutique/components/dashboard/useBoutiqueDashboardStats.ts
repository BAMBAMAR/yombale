'use client'

import { useState, useEffect } from 'react'
import { getBoutiqueProduits, getDashboard, getCreditsClients } from '../../actions'
import type { Boutique } from '../../types'

export function useBoutiqueDashboardStats(boutique: Boutique) {
  const [produitsCount, setProduitsCount] = useState<number | null>(null)
  const [stockAlertsCount, setStockAlertsCount] = useState<number | null>(null)
  const [caMois, setCaMois] = useState<number | null>(null)
  const [margeBruteMois, setMargeBruteMois] = useState<number | null>(null)
  const [tauxMargeMois, setTauxMargeMois] = useState<number | null>(null)
  const [dettesTotal, setDettesTotal] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [onboardingOpen, setOnboardingOpen] = useState(false)
  const [onboardingDismissed, setOnboardingDismissed] = useState(false)
  const [modeEssentiel, setModeEssentiel] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`nopalou_mode_essentiel_${boutique.id}`) === 'true'
    }
    return false
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem(`nopalou_onboarding_dismissed_${boutique.id}`) === 'true'
      setOnboardingDismissed(dismissed)
    }
  }, [boutique.id])

  useEffect(() => {
    let active = true
    const cacheKey = `nopalou_offline_dash_counts_${boutique.id}`
    const cached = typeof window !== 'undefined' ? localStorage.getItem(cacheKey) : null
    if (cached) {
      try {
        const { count, alerts, ca, dettes, marge, tauxMarge } = JSON.parse(cached)
        if (typeof count === 'number') setProduitsCount(count)
        if (typeof alerts === 'number') setStockAlertsCount(alerts)
        if (typeof ca === 'number') setCaMois(ca)
        if (typeof marge === 'number') setMargeBruteMois(marge)
        if (typeof tauxMarge === 'number') setTauxMargeMois(tauxMarge)
        if (typeof dettes === 'number') setDettesTotal(dettes)
        setLoading(false)
      } catch (e) {
        console.warn('[Nopalou:BoutiqueDashboard]', e)
      }
    }

    Promise.allSettled([
      getBoutiqueProduits(boutique.id),
      getDashboard(boutique.id),
      getCreditsClients(boutique.id),
    ]).then(([resProduits, resDash, resCredits]) => {
      if (!active) return
      let count = produitsCount || 0
      let alerts = stockAlertsCount || 0
      let ca = caMois || 0
      let dettes = dettesTotal || 0

      if (resProduits.status === 'fulfilled' && Array.isArray(resProduits.value)) {
        const prods = resProduits.value
        count = prods.length
        alerts = prods.filter(
          (p) =>
            !p.en_stock ||
            ((p.quantite_stock ?? p.stock_quantite) !== null &&
              (p.quantite_stock ?? p.stock_quantite)! <= 3)
        ).length
        setProduitsCount(count)
        setStockAlertsCount(alerts)
      }

      let marge = margeBruteMois || 0
      let tauxMarge = tauxMargeMois || 0

      if (resDash.status === 'fulfilled' && resDash.value) {
        if (typeof resDash.value.ca_mois === 'number') {
          ca = resDash.value.ca_mois
          setCaMois(ca)
        }
        if (typeof resDash.value.marge_brute_mois === 'number') {
          marge = resDash.value.marge_brute_mois
          setMargeBruteMois(marge)
        }
        if (typeof resDash.value.taux_marge_mois === 'number') {
          tauxMarge = resDash.value.taux_marge_mois
          setTauxMargeMois(tauxMarge)
        }
      }

      if (
        resCredits.status === 'fulfilled' &&
        resCredits.value?.clients &&
        Array.isArray(resCredits.value.clients)
      ) {
        dettes = resCredits.value.clients
          .filter((c: any) => c.solde > 0)
          .reduce((s: number, c: any) => s + Number(c.solde), 0)
        setDettesTotal(dettes)
      }

      try {
        localStorage.setItem(cacheKey, JSON.stringify({ count, alerts, ca, dettes, marge, tauxMarge }))
      } catch (err) {
        console.warn('[Nopalou:BoutiqueDashboard:cache]', err)
      }
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [boutique.id])

  const toggleModeEssentiel = (enabled: boolean) => {
    setModeEssentiel(enabled)
    if (typeof window !== 'undefined') {
      localStorage.setItem(`nopalou_mode_essentiel_${boutique.id}`, enabled ? 'true' : 'false')
    }
  }

  const dismissOnboarding = () => {
    setOnboardingDismissed(true)
    if (typeof window !== 'undefined') {
      localStorage.setItem(`nopalou_onboarding_dismissed_${boutique.id}`, 'true')
    }
  }

  const hasProducts = Boolean(produitsCount && produitsCount > 0)
  const hasLogoOrCover = Boolean(boutique.logo_url || boutique.cover_url)
  const hasDesc = Boolean(boutique.description && boutique.description.trim().length > 5)
  const hasPhone = Boolean(boutique.whatsapp || boutique.telephone)
  const isBienvenue = typeof window !== 'undefined' && window.location.search.includes('bienvenue')

  const stepsDone = [true, hasPhone, hasProducts, hasLogoOrCover || hasDesc].filter(Boolean).length
  const pctReady = Math.round((stepsDone / 4) * 100)

  return {
    produitsCount,
    stockAlertsCount,
    caMois,
    margeBruteMois,
    tauxMargeMois,
    dettesTotal,
    loading,
    modeEssentiel,
    toggleModeEssentiel,
    onboardingOpen,
    setOnboardingOpen,
    onboardingDismissed,
    dismissOnboarding,
    hasProducts,
    hasLogoOrCover,
    hasDesc,
    isBienvenue,
    pctReady,
  }
}
