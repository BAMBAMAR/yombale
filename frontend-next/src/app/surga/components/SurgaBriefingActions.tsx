'use client'

import React, { useState } from 'react'
import { Bell, X, RefreshCw } from 'lucide-react'

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
  const [masquerBandeau, setMasquerBandeau] = useState<boolean>(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleDemanderPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission()
        setPermissionState(perm)
      } catch (err) {
        console.warn('[SURGA NOTIF PERM ERROR]:', err)
      }
    }
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
    <>
      {/* Mini bandeau d'alerte matinale : discret et fermable d'un clic */}
      {!masquerBandeau && permissionState !== 'granted' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            padding: '6px 10px',
            backgroundColor: 'rgba(217, 119, 6, 0.08)',
            border: '1px solid rgba(217, 119, 6, 0.2)',
            borderRadius: 8,
            fontSize: 12,
            marginTop: 8,
          }}
        >
          <button
            type="button"
            onClick={handleDemanderPermission}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: 'var(--surga-accent, #D97706)',
              fontWeight: 700,
              fontSize: 12,
              textAlign: 'left',
              minHeight: 28,
            }}
          >
            <Bell size={13} />
            <span>Alerte matinale à {heureBriefing}</span>
          </button>
          <button
            type="button"
            onClick={() => setMasquerBandeau(true)}
            aria-label="Fermer la suggestion"
            style={{
              background: 'none',
              border: 'none',
              padding: '4px 6px',
              cursor: 'pointer',
              color: 'var(--surga-text2, #475569)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 28,
            }}
          >
            <X size={13} />
          </button>
        </div>
      )}
    </>
  )
}
