'use client'

import React, { useState, useEffect } from 'react'
import AccountHubHero from './hub/AccountHubHero'
import AccountHubKpis from './hub/AccountHubKpis'
import AccountHubQuickActions from './hub/AccountHubQuickActions'
import AccountHubRecentAnnonces from './hub/AccountHubRecentAnnonces'

interface Props {
  nom: string
  email: string | null
  initiale: string
  userId: string
  session: any
  onNavigateTab: (tabKey: string) => void
}

export default function AccountDashboardHub({
  nom,
  email,
  initiale,
  userId,
  session,
  onNavigateTab,
}: Props) {
  const [annonces, setAnnonces] = useState<any[]>([])
  const [boutiques, setBoutiques] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Récupération des annonces depuis cache ou API
    const cacheAnnoncesKey = `nopalou_offline_annonces_${userId}`
    const cachedAnnonces = typeof window !== 'undefined' ? localStorage.getItem(cacheAnnoncesKey) : null
    if (cachedAnnonces) {
      try {
        setAnnonces(JSON.parse(cachedAnnonces))
      } catch (err) {
        console.warn('[Nopalou:AccountDashboardHub:cachedAnnonces]', err)
      }
    }

    // 2. Récupération des boutiques depuis cache ou API
    const cachedBoutiques = typeof window !== 'undefined' ? localStorage.getItem('nopalou_pos_user_boutiques') : null
    if (cachedBoutiques) {
      try {
        setBoutiques(JSON.parse(cachedBoutiques))
      } catch (err) {
        console.warn('[Nopalou:AccountDashboardHub:cachedBoutiques]', err)
      }
    }

    // Fetch réseau en arrière-plan
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || sessionStorage.getItem('token') : null
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}

    Promise.all([
      fetch('/api/annonces/mine', { headers })
        .then(r => (r.ok ? r.json() : null))
        .then(d => {
          if (d?.annonces) {
            setAnnonces(d.annonces)
            localStorage.setItem(cacheAnnoncesKey, JSON.stringify(d.annonces))
          }
        })
        .catch(() => {}),

      fetch('/api/boutiques/mine', { headers })
        .then(r => (r.ok ? r.json() : null))
        .then(d => {
          const bList = d?.boutiques || (Array.isArray(d) ? d : [])
          if (bList.length > 0) {
            setBoutiques(bList)
            localStorage.setItem('nopalou_pos_user_boutiques', JSON.stringify(bList))
          }
        })
        .catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [userId])

  const hasBoutique = boutiques.length > 0
  const annoncesActives = annonces.filter(a => a.actif).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 1. Hero Card Profil & Statut */}
      <AccountHubHero
        nom={nom}
        email={email}
        initiale={initiale}
        hasBoutique={hasBoutique}
        onNavigateTab={onNavigateTab}
      />

      {/* 2. Grille de 4 KPIs d'Activité en Direct */}
      <AccountHubKpis
        hasBoutique={hasBoutique}
        boutiques={boutiques}
        annonces={annonces}
        annoncesActives={annoncesActives}
        onNavigateTab={onNavigateTab}
      />

      {/* 3. Hub d'Actions Rapides 1-Tap & Raccourcis Horizontaux */}
      <AccountHubQuickActions
        hasBoutique={hasBoutique}
        onNavigateTab={onNavigateTab}
      />

      {/* 4. Vos Dernières Annonces ou Onboarding Compact */}
      <AccountHubRecentAnnonces
        annonces={annonces}
        annoncesActives={annoncesActives}
        hasBoutique={hasBoutique}
        onNavigateTab={onNavigateTab}
      />
    </div>
  )
}
