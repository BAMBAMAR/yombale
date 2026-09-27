'use client'

import { useEffect } from 'react'
import { getBoutiqueProduits } from '../actions'
import { sauvegarderProduitsLocaux, sauvegarderClientsLocaux, sauvegarderCaissiersLocaux } from '@/lib/db-offline'
import type { Boutique } from '../types'

export function useBoutiqueOfflinePreloader(
  boutiquesList: Boutique[],
  boutiques: Boutique[],
  isReallyOnline: boolean,
  userId: string
) {
  useEffect(() => {
    if (typeof window === 'undefined' || !isReallyOnline) {
      return
    }

    const executerPrechargement = () => {
      const clientToken = typeof window !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('nopalou_token') || '') : ''
      const fetchLow = (url: string) => {
        const headers: Record<string, string> = {}
        if (clientToken) headers['Authorization'] = `Bearer ${clientToken}`
        return fetch(url, { priority: 'low', headers } as any)
      }

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
          if (prods && Array.isArray(prods) && prods.length > 0) {
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
              const cachedStr = typeof window !== 'undefined' ? localStorage.getItem(`nopalou_offline_clients_${b.id}`) : null
              let localCount = 0
              if (cachedStr) try { localCount = JSON.parse(cachedStr)?.length || 0 } catch (_) {}
              if (dataClients.clients.length > 0 || localCount === 0) {
                localStorage.setItem(`nopalou_offline_clients_${b.id}`, JSON.stringify(dataClients.clients))
                sauvegarderClientsLocaux(dataClients.clients, b.id, userId).catch(() => {})
              }

              // Précharge l'historique des dettes pour chaque client
              dataClients.clients.slice(0, 50).forEach((c: any) => {
                if (!c?.id) return
                fetchLow(`/api/boutiques/${b.id}/credits-clients/${c.id}/historique`)
                  .then((r) => (r.ok ? r.json() : Promise.reject()))
                  .then((hData) => {
                    if (hData?.transactions && Array.isArray(hData.transactions)) {
                      localStorage.setItem(`nopalou_offline_carnet_hist_${b.id}_${c.id}`, JSON.stringify(hData.transactions))
                    }
                  })
                  .catch(() => {})
              })

              try {
                const dettes = dataClients.clients
                  .filter((c: any) => Number(c.solde) > 0)
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
              if (cDash && (typeof cDash.ca_mois === 'number' || typeof cDash.marge_brute_mois === 'number')) {
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
              if (Array.isArray(vData) && vData.length > 0) {
                localStorage.setItem(`nopalou_offline_compta_ventes_${b.id}`, JSON.stringify(vData))
              }
            }).catch(() => {})

          fetchLow(`/api/comptabilite/${b.id}/commandes`)
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((cmdData) => {
              const list = Array.isArray(cmdData) ? cmdData : (cmdData?.commandes || [])
              const existingCmdStr = localStorage.getItem(`nopalou_offline_commandes_${b.id}_`)
              let localCmdCount = 0
              if (existingCmdStr) try { localCmdCount = JSON.parse(existingCmdStr)?.length || 0 } catch (_) {}
              if (list.length > 0 || localCmdCount === 0) {
                localStorage.setItem(`nopalou_offline_commandes_${b.id}_`, JSON.stringify(list))
              }
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
              if (data.caissiers) {
                localStorage.setItem(`nopalou_offline_caissiers_${b.id}`, JSON.stringify(data.caissiers))
                sauvegarderCaissiersLocaux(data.caissiers, b.id, userId).catch(() => {})
              }
            }).catch(() => {})

          fetchLow(`/api/boutiques/${b.id}/logs?limit=150`)
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((data) => {
              if (data.logs) localStorage.setItem(`nopalou_offline_logs_${b.id}_tous`, JSON.stringify(data.logs))
            }).catch(() => {})

          // Précharge les entrepôts et stocks par site
          fetchLow(`/api/boutiques/${b.id}/entrepots`)
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((data) => {
              if (data?.entrepots && Array.isArray(data.entrepots) && data.entrepots.length > 0) {
                localStorage.setItem(`nopalou_offline_entrepots_${b.id}`, JSON.stringify(data.entrepots))
              }
            }).catch(() => {})

          fetchLow(`/api/boutiques/${b.id}/entrepots/stocks`)
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((data) => {
              if (data?.stocks && Array.isArray(data.stocks)) {
                localStorage.setItem(`nopalou_offline_stocks_${b.id}`, JSON.stringify(data.stocks))
              }
            }).catch(() => {})

          // Précharge les documents (Factures, Devis, Proformas)
          fetchLow(`/api/boutiques/${b.id}/documents`)
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((data) => {
              const docsList = Array.isArray(data) ? data : (data?.documents || [])
              if (Array.isArray(docsList) && docsList.length > 0) {
                localStorage.setItem(`nopalou_offline_docs_${b.id}`, JSON.stringify(docsList))
              }
            }).catch(() => {})

          // Précharge les fournisseurs
          fetchLow(`/api/boutiques/${b.id}/fournisseurs`)
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((data) => {
              const fousList = Array.isArray(data) ? data : (data?.fournisseurs || [])
              if (Array.isArray(fousList) && fousList.length > 0) {
                localStorage.setItem(`nopalou_offline_fournisseurs_${b.id}`, JSON.stringify(fousList))
              }
            }).catch(() => {})

          // Précharge les abonnements et livraisons récurrentes
          fetchLow(`/api/boutiques/${b.id}/abonnements`)
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((data) => {
              if (data?.abonnements && Array.isArray(data.abonnements)) {
                localStorage.setItem(`nopalou_offline_abonnements_${b.id}`, JSON.stringify(data.abonnements))
              }
            }).catch(() => {})

          // Précharge les articles de blog SEO marchand
          fetchLow(`/api/boutiques/${b.id}/articles?tous=true`)
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((data) => {
              if (data?.articles && Array.isArray(data.articles)) {
                localStorage.setItem(`nopalou_offline_articles_${b.id}`, JSON.stringify(data.articles))
              }
            }).catch(() => {})

          // Précharge les dépenses de caisse
          fetchLow(`/api/comptabilite/${b.id}/depenses`)
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((data) => {
              const depList = Array.isArray(data) ? data : (data?.depenses || [])
              if (Array.isArray(depList) && depList.length > 0) {
                localStorage.setItem(`nopalou_offline_compta_depenses_${b.id}`, JSON.stringify(depList))
              }
            }).catch(() => {})

          // Précharge le Social Shop (Publications & Comptes)
          fetchLow(`/api/boutiques/${b.id}/social/admin/overview`)
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((data) => {
              if (data?.comptes && Array.isArray(data.comptes)) {
                localStorage.setItem(`nopalou_offline_social_accounts_${b.id}`, JSON.stringify(data.comptes))
              }
              if (data?.stats) {
                localStorage.setItem(`nopalou_offline_social_stats_${b.id}`, JSON.stringify(data.stats))
              }
            }).catch(() => {})

          fetchLow(`/api/boutiques/${b.id}/social/admin/posts`)
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((data) => {
              if (data?.posts && Array.isArray(data.posts)) {
                localStorage.setItem(`nopalou_offline_social_posts_${b.id}`, JSON.stringify(data.posts))
              }
            }).catch(() => {})
        } catch (e) {
          console.error('[Preload Offline] Erreur préchargement boutique', b.id, e)
        }
      })
    }

    const preloadTimer = setTimeout(executerPrechargement, 250)
    // Synchronisation automatique périodique toutes les 10 minutes
    const preloadInterval = setInterval(executerPrechargement, 10 * 60 * 1000)

    const handleVisibilityOrOnline = () => {
      if (document.visibilityState === 'visible' && isReallyOnline) {
        executerPrechargement()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityOrOnline)
    window.addEventListener('online', handleVisibilityOrOnline)

    return () => {
      clearTimeout(preloadTimer)
      clearInterval(preloadInterval)
      document.removeEventListener('visibilitychange', handleVisibilityOrOnline)
      window.removeEventListener('online', handleVisibilityOrOnline)
    }
  }, [boutiquesList, boutiques, isReallyOnline, userId])
}
