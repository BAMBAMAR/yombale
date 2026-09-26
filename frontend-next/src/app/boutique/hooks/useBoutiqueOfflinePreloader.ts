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

        // Précharge le plan souscrit
        fetchLow('/api/abonnements/mon-plan')
          .then((r) => (r.ok ? r.json() : Promise.reject()))
          .then((d) => {
            if (d?.abonnement) {
              const p = d.abonnement.is_trial ? 'business' : (d.abonnement.plan_effectif || d.abonnement.plan)
              if (p) localStorage.setItem('nopalou_plan_actif', p)
              localStorage.setItem('nopalou_offline_abonnement', JSON.stringify(d.abonnement))
            }
          })
          .catch(() => {})

        const boutiquesAPrecharger = boutiquesList.length > 0 ? boutiquesList : boutiques
        boutiquesAPrecharger.forEach(async (b) => {
          try {
            if (b.plan_actif && !localStorage.getItem('nopalou_plan_actif')) {
              localStorage.setItem('nopalou_plan_actif', b.plan_actif)
            }

            const prods = await getBoutiqueProduits(b.id)
            if (prods && Array.isArray(prods)) {
              const prodsFormates = prods.map((p: any) => {
                let stockVal = Number(p.stock ?? p.quantite_stock ?? p.stock_quantite)
                if (isNaN(stockVal)) stockVal = 10
                return { ...p, stock: stockVal }
              })
              localStorage.setItem(`nopalou_pos_produits_${b.id}`, JSON.stringify(prodsFormates))
              localStorage.setItem(`nopalou_offline_prods_${b.id}`, JSON.stringify(prodsFormates))
              sauvegarderProduitsLocaux(prodsFormates, b.id, userId).catch(() => {})

              // Calcul immédiat des compteurs
              try {
                const count = prodsFormates.length
                const alerts = prodsFormates.filter(
                  (p: any) => !p.en_stock || Number(p.stock) <= 3
                ).length
                const prevKey = `nopalou_offline_dash_counts_${b.id}`
                const existingStr = localStorage.getItem(prevKey)
                let existing: any = {}
                if (existingStr) try { existing = JSON.parse(existingStr) } catch (_) {}
                localStorage.setItem(prevKey, JSON.stringify({ ...existing, count, alerts }))
              } catch (_) {}
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
                localStorage.setItem(`nopalou_offline_clients_${b.id}`, JSON.stringify(dataClients.clients))
                import('@/lib/db-offline').then(({ sauvegarderClientsLocaux }) => {
                  sauvegarderClientsLocaux(dataClients.clients, b.id, userId).catch(() => {})
                }).catch(() => {})

                try {
                  const dettes = dataClients.clients
                    .filter((c: any) => c.solde > 0)
                    .reduce((s: number, c: any) => s + Number(c.solde || 0), 0)
                  const prevKey = `nopalou_offline_dash_counts_${b.id}`
                  const existingStr = localStorage.getItem(prevKey)
                  let existing: any = {}
                  if (existingStr) try { existing = JSON.parse(existingStr) } catch (_) {}
                  localStorage.setItem(prevKey, JSON.stringify({ ...existing, dettes }))
                } catch (_) {}
              }
            }

            fetchLow(`/api/comptabilite/${b.id}/dashboard`)
              .then((r) => (r.ok ? r.json() : Promise.reject()))
              .then((cDash) => {
                if (cDash) {
                  localStorage.setItem(`nopalou_offline_compta_dash_${b.id}`, JSON.stringify(cDash))
                  try {
                    const prevKey = `nopalou_offline_dash_counts_${b.id}`
                    const existingStr = localStorage.getItem(prevKey)
                    let existing: any = {}
                    if (existingStr) try { existing = JSON.parse(existingStr) } catch (_) {}
                    localStorage.setItem(
                      prevKey,
                      JSON.stringify({
                        ...existing,
                        ca: cDash.ca_mois ?? existing.ca ?? 0,
                        marge: cDash.marge_brute_mois ?? existing.marge ?? 0,
                        tauxMarge: cDash.taux_marge_mois ?? existing.tauxMarge ?? 0,
                      })
                    )
                  } catch (_) {}
                }
              }).catch(() => {})

            fetchLow(`/api/comptabilite/${b.id}/ventes`)
              .then((r) => (r.ok ? r.json() : Promise.reject()))
              .then((vData) => {
                if (Array.isArray(vData)) {
                  localStorage.setItem(`nopalou_offline_compta_ventes_${b.id}`, JSON.stringify(vData))
                }
              }).catch(() => {})

            fetchLow(`/api/boutiques/${b.id}/commandes`)
              .then((r) => (r.ok ? r.json() : Promise.reject()))
              .then((cmdData) => {
                const list = cmdData?.commandes || (Array.isArray(cmdData) ? cmdData : [])
                localStorage.setItem(`nopalou_offline_commandes_${b.id}_`, JSON.stringify(list))
              }).catch(() => {})

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
      }, 200)

      return () => clearTimeout(preloadTimer)
    }
  }, [boutiquesList, boutiques, isReallyOnline, userId])
}
