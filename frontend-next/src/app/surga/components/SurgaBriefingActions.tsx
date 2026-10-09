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

  return null
}
