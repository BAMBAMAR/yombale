'use client'

import React, { useState, useEffect } from 'react'
import AccountHubHero from './hub/AccountHubHero'
import AccountHubKpis from './hub/AccountHubKpis'
import AccountHubQuickActions from './hub/AccountHubQuickActions'
import AccountHubRecentAnnonces from './hub/AccountHubRecentAnnonces'
import { Wallet, ArrowRight } from 'lucide-react'

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
  const [locations, setLocations] = useState<any[]>([])
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

      fetch('/api/locatif-immo/mes-locations', { headers })
        .then(r => (r.ok ? r.json() : null))
        .then(d => {
          if (d?.locations) {
            setLocations(d.locations)
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

      {/* 1.5 Showcase Sama Xaalis */}
      <div
        onClick={() => onNavigateTab('kalpe')}
        style={{
          background: 'linear-gradient(135deg, #1C2B4A 0%, #2A3F6D 100%)',
          borderRadius: 14,
          padding: '16px 18px',
          color: '#FFFFFF',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          boxShadow: '0 4px 14px rgba(28, 43, 74, 0.15)',
          transition: 'transform 0.15s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: 1 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(199, 91, 0, 0.2)',
              border: '1px solid rgba(199, 91, 0, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Wallet size={22} color="#FFA86A" style={{ flexShrink: 0 }} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 15, fontWeight: 800, whiteSpace: 'nowrap', color: '#FFFFFF' }}>
                Sama Xaalis
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  background: '#C75B00',
                  color: '#FFFFFF',
                  padding: '2px 8px',
                  borderRadius: 999,
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  letterSpacing: '0.04em',
                }}
              >
                Mon Argent
              </span>
            </div>
            <div style={{ fontSize: 12, color: '#C8D4E5', marginTop: 3, lineHeight: 1.4 }}>
              Dépenses, entrées, carnet de dettes & épargne avec dictée vocale bilingue
            </div>
          </div>
        </div>
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.12)',
            padding: '8px 14px',
            borderRadius: 8,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            fontWeight: 700,
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          <span>Ouvrir</span> <ArrowRight size={14} style={{ flexShrink: 0 }} />
        </div>
      </div>

      {/* 2. Grille de KPIs d'Activité en Direct */}
      <AccountHubKpis
        hasBoutique={hasBoutique}
        boutiques={boutiques}
        annonces={annonces}
        annoncesActives={annoncesActives}
        locations={locations}
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
