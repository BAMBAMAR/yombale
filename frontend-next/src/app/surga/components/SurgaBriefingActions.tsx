'use client'

import React, { useState } from 'react'
import { Bell, Check, Sparkles, RefreshCw } from 'lucide-react'

interface SurgaBriefingActionsProps {
  heureBriefing?: string
  titrePremierItem?: string
  onRefresh?: () => void
}

export default function SurgaBriefingActions({
  heureBriefing = '07:30',
  titrePremierItem = 'Briefing quotidien prêt',
  onRefresh,
}: SurgaBriefingActionsProps) {
  const [permissionState, setPermissionState] = useState<string>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission
    }
    return 'default'
  })
  const [isTestSent, setIsTestSent] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleDemanderPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission()
        setPermissionState(perm)
        if (perm === 'granted') {
          declencherNotificationTest()
        }
      } catch (err) {
        console.warn('[SURGA NOTIF PERM ERROR]:', err)
      }
    }
  }

  const declencherNotificationTest = () => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('Surga — Votre Briefing du Matin', {
          body: `Bonjour. Votre briefing de ${heureBriefing} est prêt : ${titrePremierItem.slice(0, 75)}...`,
          icon: '/icons/icon-192.png',
        })
        setIsTestSent(true)
        setTimeout(() => setIsTestSent(false), 5000)
        return
      } catch (e) {
        // Fallback si context service worker nécessaire
      }
    }
    // Simulation visuelle si notifications bloquées ou non supportées sur le périphérique
    alert(`[Notification Surga (${heureBriefing})]\nBonjour. Votre briefing quotidien est prêt avec vos actualités et résultats sportifs.`)
    setIsTestSent(true)
    setTimeout(() => setIsTestSent(false), 5000)
  }

  const handleRefreshClick = async () => {
    if (onRefresh) {
      setIsRefreshing(true)
      try {
        await onRefresh()
      } finally {
        setTimeout(() => setIsRefreshing(false), 800)
      }
    }
  }

  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
      {permissionState !== 'granted' ? (
        <button
          type="button"
          onClick={handleDemanderPermission}
          className="surga-btn-secondary"
          style={{
            flex: 1,
            minWidth: 160,
            fontSize: 13,
            padding: '8px 12px',
            borderColor: 'var(--accent, #C75B00)',
            color: 'var(--accent, #C75B00)',
          }}
        >
          <Bell size={15} />
          <span>Activer les alertes matinales</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={declencherNotificationTest}
          className="surga-btn-secondary"
          style={{
            flex: 1,
            minWidth: 160,
            fontSize: 13,
            padding: '8px 12px',
            backgroundColor: isTestSent ? 'rgba(10,92,54,0.06)' : undefined,
            color: isTestSent ? 'var(--price, #0A5C36)' : 'var(--navy, #1C2B4A)',
          }}
        >
          {isTestSent ? <Check size={15} /> : <Sparkles size={15} color="var(--accent, #C75B00)" />}
          <span>{isTestSent ? 'Notification envoyée !' : 'Tester la notification de briefing'}</span>
        </button>
      )}

      {onRefresh && (
        <button
          type="button"
          onClick={handleRefreshClick}
          className="surga-btn-secondary"
          style={{ width: 'auto', padding: '8px 12px' }}
          title="Actualiser les flux d’actualité"
          disabled={isRefreshing}
        >
          <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
        </button>
      )}
    </div>
  )
}
