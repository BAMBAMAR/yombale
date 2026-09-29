'use server'

import { revalidatePath } from 'next/cache'
import { getAdminAuthHeaders } from '@/lib/admin-auth-headers'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'

// Alias local vers le helper partagé (évite la duplication avec page.tsx et route.ts)
const getAdminHeaders = getAdminAuthHeaders

export async function fetchDevPortalData() {
  try {
    const headers = await getAdminHeaders()
    const res = await fetch(`${BACKEND}/api/boutiques/admin/developer-portal`, {
      headers,
      cache: 'no-store',
    })

    if (!res.ok) {
      throw new Error(`Erreur ${res.status} lors de l'interrogation du portail`)
    }

    const data = await res.json()
    return { success: true, keys: data.keys || [], webhooks: data.webhooks || [] }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'
    return { success: false, error: msg, keys: [], webhooks: [] }
  }
}

export async function revoquerCleApiAction(keyId: string) {
  try {
    const headers = await getAdminHeaders()
    const res = await fetch(`${BACKEND}/api/boutiques/admin/api-keys/${keyId}`, {
      method: 'DELETE',
      headers,
    })

    if (!res.ok) {
      throw new Error(`Erreur ${res.status} lors de la révocation de la clé API`)
    }

    revalidatePath('/admin/developer')
    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur lors de la révocation'
    return { success: false, error: msg }
  }
}

export async function supprimerWebhookAction(webhookId: string) {
  try {
    const headers = await getAdminHeaders()
    const res = await fetch(`${BACKEND}/api/boutiques/admin/webhooks/${webhookId}`, {
      method: 'DELETE',
      headers,
    })

    if (!res.ok) {
      throw new Error(`Erreur ${res.status} lors de la suppression du webhook`)
    }

    revalidatePath('/admin/developer')
    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur lors de la suppression'
    return { success: false, error: msg }
  }
}
