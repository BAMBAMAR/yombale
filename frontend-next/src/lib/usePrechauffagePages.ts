'use client'

import { useEffect } from 'react'

// Pages mémorisées par le Service Worker dès la connexion : toute la navigation reste possible sans réseau,
// y compris vers des pages jamais ouvertes. Le contenu privé vient ensuite de l'état local (préchargement des boutiques).
const PAGES_PUBLIQUES = ['/', '/boutiques', '/agences', '/immo', '/annonces', '/promo', '/aide', '/recherche']
// /favoris, /mes-annonces, /mes-alertes, /compte/apporteur… sont des redirections serveur vers /compte?tab=… :
// seule la page /compte est mémorisée, le Service Worker y renvoie ces adresses hors-ligne.
const PAGES_COMPTE = ['/compte', '/deposer-annonce', '/deposer-immo']
const PAGES_MARCHAND = ['/boutique', '/boutique/caisse', '/boutique/abonnement']

// Préfixe `nopalou_offline_` : effacé par purgerDonneesLocalesPrivees() à la déconnexion ou au changement de compte,
// ce qui relance un préchauffage complet pour le compte suivant.
const CLE_PRECHAUFFAGE = 'nopalou_offline_pages_warm'
const INTERVALLE_MS = 6 * 60 * 60 * 1000
const DELAI_DEMARRAGE_MS = 6000

function dejaFait(userId: string): boolean {
  try {
    const [uid, ts] = (localStorage.getItem(CLE_PRECHAUFFAGE) || '').split('|')
    return uid === userId && Date.now() - Number(ts) < INTERVALLE_MS
  } catch {
    return false
  }
}

export function usePrechauffagePages(isOnline: boolean) {
  useEffect(() => {
    if (typeof window === 'undefined' || !isOnline || !('serviceWorker' in navigator)) return
    if (process.env.NODE_ENV === 'development') return

    let annule = false
    let surMessage: ((e: MessageEvent) => void) | null = null

    const lancer = async () => {
      let userId: string | null = null
      try {
        userId = localStorage.getItem('nopalou_user_id')
      } catch {
        /* stockage indisponible */
      }
      // Seuls les comptes connectés sont préchauffés : les pages publiques se mémorisent à la visite.
      if (!userId || dejaFait(userId)) return
      const connexion = (navigator as any).connection
      if (connexion?.saveData) return

      const reg = await navigator.serviceWorker.ready
      if (annule || !reg.active) return

      surMessage = (e: MessageEvent) => {
        if (e.data?.type !== 'NOPALOU_PRECACHE_DONE') return
        // Succès partiel accepté : les pages manquantes sont mémorisées à leur première visite.
        if (e.data.ok > 0) {
          try {
            localStorage.setItem(CLE_PRECHAUFFAGE, `${userId}|${Date.now()}`)
          } catch {
            /* non bloquant */
          }
        }
        if (surMessage) navigator.serviceWorker.removeEventListener('message', surMessage)
      }
      navigator.serviceWorker.addEventListener('message', surMessage)
      reg.active.postMessage({
        type: 'NOPALOU_PRECACHE_PAGES',
        urls: [...PAGES_COMPTE, ...PAGES_MARCHAND, ...PAGES_PUBLIQUES],
      })
    }

    const minuteur = setTimeout(() => { lancer().catch(() => {}) }, DELAI_DEMARRAGE_MS)
    return () => {
      annule = true
      clearTimeout(minuteur)
      if (surMessage) navigator.serviceWorker.removeEventListener('message', surMessage)
    }
  }, [isOnline])
}
