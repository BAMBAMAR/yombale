'use client'

import { useState, useEffect } from 'react'
import { getBoutiqueProduits, getDashboard, getCreditsClients } from '../../actions'
import type { Boutique } from '../../types'

export function useBoutiqueDashboardStats(boutique: Boutique) {
  const cacheKey = `nopalou_offline_dash_counts_${boutique.id}`

  const getInitialStats = () => {
    let count: number | null = null
    let alerts: number | null = null
    let ca: number | null = null
    let marge: number | null = null
    let tauxMarge: number | null = null
    let dettes: number | null = null

    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(cacheKey)
        if (cached) {
          const parsed = JSON.parse(cached)
          if (typeof parsed.count === 'number' && parsed.count > 0) count = parsed.count
          if (typeof parsed.alerts === 'number') alerts = parsed.alerts
          if (typeof parsed.ca === 'number' && parsed.ca > 0) ca = parsed.ca
          if (typeof parsed.marge === 'number') marge = parsed.marge
          if (typeof parsed.tauxMarge === 'number') tauxMarge = parsed.tauxMarge
          if (typeof parsed.dettes === 'number') dettes = parsed.dettes
        }
      } catch (_) {}

      // Calcul de secours depuis le cache produits
      try {
        const cachedProds =
          localStorage.getItem(`nopalou_pos_produits_${boutique.id}`) ||
          localStorage.getItem(`nopalou_offline_prods_${boutique.id}`)
        if (cachedProds) {
          const prods = JSON.parse(cachedProds)
          if (Array.isArray(prods) && prods.length > 0) {
            if (count === null || count === 0) count = prods.length
            if (alerts === null) {
              alerts = prods.filter(
                (p: any) =>
                  !p.en_stock ||
                  Number(p.quantite_stock ?? p.stock_quantite ?? p.stock ?? 10) <= 3
              ).length
            }
          }
        }
      } catch (_) {}

      // Calcul de secours depuis le cache clients
      try {
        const cachedClients = localStorage.getItem(`nopalou_offline_clients_${boutique.id}`)
        if (cachedClients) {
          const clients = JSON.parse(cachedClients)
          if (Array.isArray(clients) && clients.length > 0) {
            const sumDettes = clients
              .filter((c: any) => c.solde > 0)
              .reduce((s: number, c: any) => s + Number(c.solde || 0), 0)
            if (dettes === null) dettes = sumDettes
          }
        }
      } catch (_) {}

      // Calcul de secours depuis les analytics
      try {
        const cachedAnalytics = localStorage.getItem(`nopalou_offline_analytics_${boutique.id}`)
        if (cachedAnalytics) {
          const aData = JSON.parse(cachedAnalytics)
          if (aData?.stats?.ca_total && (ca === null || ca === 0)) {
            ca = Number(aData.stats.ca_total)
          }
        }
      } catch (_) {}
    }

    return { count, alerts, ca, marge, tauxMarge, dettes }
  }

  const initial = getInitialStats()

  const [produitsCount, setProduitsCount] = useState<number | null>(initial.count)
  const [stockAlertsCount, setStockAlertsCount] = useState<number | null>(initial.alerts)
  const [caMois, setCaMois] = useState<number | null>(initial.ca)
  const [margeBruteMois, setMargeBruteMois] = useState<number | null>(initial.marge)
  const [tauxMargeMois, setTauxMargeMois] = useState<number | null>(initial.tauxMarge)
  const [dettesTotal, setDettesTotal] = useState<number | null>(initial.dettes)
  const [loading, setLoading] = useState(initial.count === null && initial.ca === null)
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

    Promise.allSettled([
      getBoutiqueProduits(boutique.id),
      getDashboard(boutique.id),
      getCreditsClients(boutique.id),
    ]).then(([resProduits, resDash, resCredits]) => {
      if (!active) return

      let hasNewData = false
      let newCount = produitsCount
      let newAlerts = stockAlertsCount
      let newCa = caMois
      let newMarge = margeBruteMois
      let newTauxMarge = tauxMargeMois
      let newDettes = dettesTotal

      if (resProduits.status === 'fulfilled' && Array.isArray(resProduits.value)) {
        hasNewData = true
        const prods = resProduits.value
        newCount = prods.length
        newAlerts = prods.filter(
          (p) =>
            !p.en_stock ||
            ((p.quantite_stock ?? p.stock_quantite) !== null &&
              (p.quantite_stock ?? p.stock_quantite)! <= 3)
        ).length
        setProduitsCount(newCount)
        setStockAlertsCount(newAlerts)
      }

      if (resDash.status === 'fulfilled' && resDash.value) {
        hasNewData = true
        if (typeof resDash.value.ca_mois === 'number') {
          newCa = resDash.value.ca_mois
          setCaMois(newCa)
        }
        if (typeof resDash.value.marge_brute_mois === 'number') {
          newMarge = resDash.value.marge_brute_mois
          setMargeBruteMois(newMarge)
        }
        if (typeof resDash.value.taux_marge_mois === 'number') {
          newTauxMarge = resDash.value.taux_marge_mois
          setTauxMargeMois(newTauxMarge)
        }
      }

      if (
        resCredits.status === 'fulfilled' &&
        resCredits.value?.clients &&
        Array.isArray(resCredits.value.clients)
      ) {
        hasNewData = true
        newDettes = resCredits.value.clients
          .filter((c: any) => c.solde > 0)
          .reduce((s: number, c: any) => s + Number(c.solde), 0)
        setDettesTotal(newDettes)
      }

      // UNIQUEMENT mettre à jour le cache si de vraies données serveur ont été reçues
      // Ne JAMAIS écraser le cache avec des zéros en cas d'échec réseau / offline
      if (hasNewData) {
        try {
          localStorage.setItem(
            cacheKey,
            JSON.stringify({
              count: newCount,
              alerts: newAlerts,
              ca: newCa,
              dettes: newDettes,
              marge: newMarge,
              tauxMarge: newTauxMarge,
            })
          )
        } catch (err) {
          console.warn('[Nopalou:BoutiqueDashboard:cache]', err)
        }
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
