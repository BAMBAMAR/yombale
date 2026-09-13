'use client'

import { useEffect } from 'react'
import { getBoutiqueProduits } from '../actions'
import { sauvegarderProduitsLocaux } from '@/lib/db-offline'
import type { Boutique } from '../types'

export function useBoutiqueOfflinePreloader(
  boutiquesList: Boutique[],
  boutiques: Boutique[],
  isReallyOnline: boolean,
  userId: string
) {
  useEffect(() => {
    if (typeof window !== 'undefined' && isReallyOnline) {
      const preloadTimer = setTimeout(() => {
        const fetchLow = (url: string) => fetch(url, { priority: 'low' } as any)
        const boutiquesAPrecharger = boutiquesList.length > 0 ? boutiquesList : boutiques
        boutiquesAPrecharger.forEach(async (b) => {
          try {
            const prods = await getBoutiqueProduits(b.id)
            if (prods && Array.isArray(prods)) {
              const prodsFormates = prods.map((p: any) => {
                let stockVal = Number(p.stock ?? p.quantite_stock ?? p.stock_quantite)
                if (isNaN(stockVal)) stockVal = 10
                return { ...p, stock: stockVal }
              })
              localStorage.setItem(`nopalou_pos_produits_${b.id}`, JSON.stringify(prodsFormates))
              sauvegarderProduitsLocaux(prodsFormates, b.id, userId).catch(() => {})
            }

            import('../actions').then(({ getPosHistorique }) => {
              getPosHistorique(b.id).then((hist) => {
                if (hist && Array.isArray(hist) && hist.length > 0) {
                  localStorage.setItem(`nopalou_pos_historique_${b.id}`, JSON.stringify(hist))
                }
              }).catch(() => {})
            }).catch(() => {})

            const resClients = await fetchLow(`/api/boutiques/${b.id}/credits-clients`).catch(() => null)
            if (resClients && resClients.ok) {
              const dataClients = await resClients.json().catch(() => null)
              if (dataClients && dataClients.clients && Array.isArray(dataClients.clients)) {
                import('@/lib/db-offline').then(({ sauvegarderClientsLocaux }) => {
                  sauvegarderClientsLocaux(dataClients.clients, b.id, userId).catch(() => {})
                }).catch(() => {})
              }
            }

            fetchLow(`/api/analytics/boutique/${b.id}`)
              .then((r) => (r.ok ? r.json() : Promise.reject()))
              .then((data) => {
                if (data.stats) localStorage.setItem(`nopalou_offline_analytics_${b.id}`, JSON.stringify(data))
              }).catch(() => {})

            fetchLow(`/api/boutiques/${b.id}/admins`)
              .then((r) => (r.ok ? r.json() : Promise.reject()))
              .then((data) => {
                if (data.admins) localStorage.setItem(`nopalou_offline_admins_${b.id}`, JSON.stringify(data.admins))
              }).catch(() => {})

            fetchLow(`/api/boutiques/${b.id}/caissiers`)
              .then((r) => (r.ok ? r.json() : Promise.reject()))
              .then((data) => {
                if (data.caissiers) localStorage.setItem(`nopalou_offline_caissiers_${b.id}`, JSON.stringify(data.caissiers))
              }).catch(() => {})

            fetchLow(`/api/boutiques/${b.id}/logs?limit=150`)
              .then((r) => (r.ok ? r.json() : Promise.reject()))
              .then((data) => {
                if (data.logs) localStorage.setItem(`nopalou_offline_logs_${b.id}_tous`, JSON.stringify(data.logs))
              }).catch(() => {})
          } catch (e) {
            console.error('[Preload Offline] Erreur préchargement boutique', b.id, e)
          }
        })
      }, 2500)

      return () => clearTimeout(preloadTimer)
    }
  }, [boutiquesList, boutiques, isReallyOnline, userId])
}
