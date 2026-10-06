// frontend-next/src/lib/surga-reminders.ts
// Gestionnaire d'ordonnancement et notifications pour les rappels Surga (Tranches 4 & Audit)
// Support Web Push VAPID en tâche de fond (Android / Doze / navigateur fermé) + repli local

import { getLocalAgenda, setLocalAgenda, type SurgaEvenement } from './surga-offline-sync'

let intervalId: ReturnType<typeof setInterval> | null = null
const scheduledTimeouts: Map<string, ReturnType<typeof setTimeout>> = new Map()

/**
 * Convertit une clé VAPID base64 en Uint8Array pour le pushManager du navigateur
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

/**
 * Enregistre ou actualise l'abonnement Web Push VAPID auprès du serveur backend
 */
export async function synchroniserAbonnementWebPush(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false
  }

  try {
    const reg = await navigator.serviceWorker.ready
    if (!reg) return false

    // Récupération de la clé VAPID publique depuis l'API backend
    const keyRes = await fetch('/api/surga/push/vapid-key')
    if (!keyRes.ok) return false
    const keyData = await keyRes.json()
    if (!keyData.success || !keyData.publicKey) return false

    // Vérifier l'abonnement existant ou s'abonner
    let sub = await reg.pushManager.getSubscription()
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyData.publicKey) as unknown as BufferSource,
      })
    }

    if (!sub) return false

    // Transmettre la souscription au backend
    const subJson = sub.toJSON()
    const token = localStorage.getItem('surga_token') || localStorage.getItem('auth_token') || ''
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const postRes = await fetch('/api/surga/push/subscribe', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        subscription: subJson,
        userAgent: navigator.userAgent,
      }),
    })

    return postRes.ok
  } catch (err) {
    console.warn('[SURGA WEB PUSH SYNC ERR]:', err)
    return false
  }
}

/**
 * Demande la permission de notification et initialise Web Push si accepté
 */
export async function demanderPermissionNotification(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false
  if (Notification.permission === 'granted') {
    // S'assurer que le push est synchronisé
    synchroniserAbonnementWebPush().catch(() => {})
    return true
  }
  if (Notification.permission !== 'denied') {
    const res = await Notification.requestPermission()
    if (res === 'granted') {
      synchroniserAbonnementWebPush().catch(() => {})
      return true
    }
  }
  return false
}

/**
 * Émet une notification web locale (via ServiceWorker si actif pour Android, ou fallback Notification)
 */
export async function emettreNotificationWeb(titre: string, options?: NotificationOptions): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false
  if (Notification.permission !== 'granted') return false

  try {
    // Privilégier le ServiceWorker pour une fiabilité maximale sur Android
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready
      if (reg && reg.showNotification) {
        await reg.showNotification(titre, {
          icon: '/surga/icon-192.png',
          badge: '/surga/icon-192.png',
          ...options,
        })
        return true
      }
    }

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

  // Tenter également une souscription Web Push si la permission est déjà accordée
  if ('Notification' in window && Notification.permission === 'granted') {
    synchroniserAbonnementWebPush().catch(() => {})
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
