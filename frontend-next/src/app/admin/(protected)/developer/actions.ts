'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'

async function getAdminHeaders(): Promise<Record<string, string>> {
  const jar = await cookies()
  const token = jar.get('nopalou_admin_jwt')?.value || jar.get('nopalou_admin')?.value || ''

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (token.startsWith('eyJ')) {
    headers['Authorization'] = `Bearer ${token}`
    headers['Cookie'] = `nopalou_admin_jwt=${token}`
    headers['X-Admin-Secret'] = token
  } else if (token) {
    headers['X-Admin-Secret'] = token
    headers['Cookie'] = `nopalou_admin=${token}`
  }

  return headers
}

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
