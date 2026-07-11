'use server'

import { backendAuthFetch } from '@/lib/backendFetch'

export async function createAlerte(
  produit_id: string,
  prix_cible: number,
  email: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await backendAuthFetch('/alertes', {
      method: 'POST',
      body: JSON.stringify({ produit_id, prix_cible, email }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      return { ok: false, error: body.error ?? `Erreur ${res.status}` }
    }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erreur inconnue' }
  }
}

export async function deleteAlerte(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await backendAuthFetch(`/alertes/${id}`, { method: 'DELETE' })
    if (!res.ok) return { ok: false, error: `Erreur ${res.status}` }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erreur inconnue' }
  }
}

export async function fetchUserAlertes(
  userId: string
): Promise<{ ok: boolean; alertes?: any[]; error?: string }> {
  try {
    // backendAuthFetch ajoute déjà le préfixe /api/ — ne pas le doubler
    const res = await backendAuthFetch(`/alertes/user/${userId}`)
    if (!res.ok) return { ok: false, error: `Erreur ${res.status}` }
    const data = await res.json()
    const alertes = Array.isArray(data) ? data : data.alertes || []
    return { ok: true, alertes }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erreur inconnue' }
  }
}
