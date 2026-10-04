// frontend-next/src/lib/surga-reminders.ts
// Gestionnaire d'ordonnancement et notifications pour les rappels Surga (Tranche 4)

import { getLocalAgenda, setLocalAgenda, type SurgaEvenement } from './surga-offline-sync'

let intervalId: ReturnType<typeof setInterval> | null = null
const scheduledTimeouts: Map<string, ReturnType<typeof setTimeout>> = new Map()

export async function demanderPermissionNotification(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission !== 'denied') {
    const res = await Notification.requestPermission()
    return res === 'granted'
  }
  return false
}

export function emettreNotificationWeb(titre: string, options?: NotificationOptions): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) return false
  if (Notification.permission !== 'granted') return false

  try {
    new Notification(titre, {
      icon: '/surga/icon-192.png',
      badge: '/surga/icon-192.png',
      ...options,
    })
    return true
  } catch (err) {
    console.warn('[SURGA NOTIF ERROR]:', err)
    return false
  }
}

/**
 * Vérifie et déclenche les rappels échus ou planifie les rappels imminents
 */
export function verifierEtPlanifierRappels(): void {
  if (typeof window === 'undefined') return

  const items = getLocalAgenda()
  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  let hasUpdates = false

  items.forEach((item) => {
    if (!item.est_rappel || item.termine || item.notification_envoyee) return
    if (item.date_evenement !== todayStr || !item.heure_evenement) return

    const [h, m] = item.heure_evenement.split(':').map(Number)
    const targetMinutes = h * 60 + m
    const diffMinutes = targetMinutes - currentMinutes

    if (diffMinutes <= 0 && diffMinutes >= -5) {
      // Échu tout récemment (dans les 5 dernières minutes)
      emettreNotificationWeb(`Rappel : ${item.titre}`, {
        body: item.description || `Prévu aujourd’hui à ${item.heure_evenement}`,
      })
      item.notification_envoyee = true
      hasUpdates = true
    } else if (diffMinutes > 0 && diffMinutes <= 120) {
      // À venir dans les 2 prochaines heures : planifier un timeout précis
      const msUntilTarget = (targetMinutes * 60 - (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds())) * 1000

      if (msUntilTarget > 0 && !scheduledTimeouts.has(item.id)) {
        const timeout = setTimeout(() => {
          emettreNotificationWeb(`Rappel : ${item.titre}`, {
            body: item.description || `Prévu aujourd’hui à ${item.heure_evenement}`,
          })
          const freshItems = getLocalAgenda()
          const idx = freshItems.findIndex((it) => it.id === item.id)
          if (idx !== -1) {
            freshItems[idx].notification_envoyee = true
            setLocalAgenda(freshItems)
          }
          scheduledTimeouts.delete(item.id)
        }, msUntilTarget)

        scheduledTimeouts.set(item.id, timeout)
      }
    }
  })

  if (hasUpdates) {
    setLocalAgenda(items)
  }
}

/**
 * Démarre le contrôleur de fond des rappels
 */
export function demarrerSurveillanceRappels(): () => void {
  if (typeof window === 'undefined') return () => {}

  verifierEtPlanifierRappels()

  if (!intervalId) {
    intervalId = setInterval(verifierEtPlanifierRappels, 30000) // Toutes les 30s
  }

  return () => {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
    scheduledTimeouts.forEach((t) => clearTimeout(t))
    scheduledTimeouts.clear()
  }
}
