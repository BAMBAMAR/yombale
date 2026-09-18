'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { BACKEND, COOKIE, adminHeaders } from './admin-common'
import { getAdminToken } from './admin-auth'

// ── Activer sponsoring immo ─────────────────────────────────────────
export async function activerSponsoring(
  id: string | number
): Promise<{ error?: string }> {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value
  if (!secret) return { error: 'Non authentifié' }

  const sponsorisee_jusqu_au = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString()

  const r = await fetch(`${BACKEND}/api/immo/${id}`, {
    method: 'PUT',
    headers: adminHeaders(secret),
    body: JSON.stringify({ sponsorisee: true, sponsorisee_jusqu_au }),
    cache: 'no-store',
  })

  if (!r.ok) return { error: 'Erreur lors de l\'activation du sponsoring' }
  return {}
}

// ── Modérer annonce immo ────────────────────────────────────────────
export async function modererImmo(
  id: number,
  actif: boolean,
  motif_rejet?: string
): Promise<{ error?: string }> {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value
  if (!secret) return { error: 'Non authentifié' }

  const body: Record<string, unknown> = { actif }
  if (!actif && motif_rejet !== undefined) {
    body.rejete      = true
    body.motif_rejet = motif_rejet
  } else if (actif) {
    body.rejete      = false
    body.motif_rejet = null
  }

  const r = await fetch(`${BACKEND}/api/immo/${id}`, {
    method: 'PUT',
    headers: adminHeaders(secret),
    body: JSON.stringify(body),
    cache: 'no-store',
  })

  if (!r.ok) return { error: 'Erreur lors de la modération' }
  return {}
}

// ── Supprimer immo ──────────────────────────────────────────────────
export async function supprimerImmo(id: number | string): Promise<{ error?: string }> {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value
  if (!secret) return { error: 'Non authentifié' }

  const r = await fetch(`${BACKEND}/api/immo/${id}`, {
    method: 'DELETE',
    headers: adminHeaders(secret),
    cache: 'no-store',
  })

  if (!r.ok) return { error: 'Erreur lors de la suppression immo' }
  revalidatePath('/admin/immo')
  return {}
}

// ── Batch Actions Immo ──────────────────────────────────────────────
export async function batchModererImmo(
  ids: (number | string)[],
  action: 'valider' | 'desactiver' | 'sponsoriser' | 'supprimer'
): Promise<{ successCount: number; errors: number }> {
  let successCount = 0
  let errors = 0

  for (const id of ids) {
    const numId = typeof id === 'string' ? parseInt(id, 10) : id
    let res: { error?: string } = {}
    if (action === 'valider') {
      res = await modererImmo(numId, true)
    } else if (action === 'desactiver') {
      res = await modererImmo(numId, false)
    } else if (action === 'sponsoriser') {
      res = await activerSponsoring(numId)
    } else if (action === 'supprimer') {
      res = await supprimerImmo(numId)
    }

    if (res.error) errors++
    else successCount++
  }

  revalidatePath('/admin/immo')
  return { successCount, errors }
}

// ── Immobilier Global : Agences & Biens ─────────────────────────────
export async function adminModererAgence(
  agenceId: string,
  payload: { statut: 'active' | 'suspendue' | 'en_attente'; note_verification?: string }
): Promise<{ success?: boolean; agence?: any; error?: string }> {
  const token = await getAdminToken()
  if (!token) return { error: 'Non authentifié' }

  try {
    const r = await fetch(`${BACKEND}/api/admin/immo-global/agences/${agenceId}/statut`, {
      method: 'PUT',
      headers: adminHeaders(token),
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
    const data = await r.json()
    if (!r.ok) return { error: data.error || 'Erreur modération agence' }
    revalidatePath('/admin/immo/agences')
    return data
  } catch (err: any) {
    return { error: err.message || 'Erreur serveur' }
  }
}

export async function adminModererBien(
  bienId: string,
  payload: { statut: string }
): Promise<{ success?: boolean; bien?: any; error?: string }> {
  const token = await getAdminToken()
  if (!token) return { error: 'Non authentifié' }

  try {
    const r = await fetch(`${BACKEND}/api/admin/immo-global/biens/${bienId}/statut`, {
      method: 'PUT',
      headers: adminHeaders(token),
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
    const data = await r.json()
    if (!r.ok) return { error: data.error || 'Erreur modération bien' }
    revalidatePath('/admin/immo/biens')
    return data
  } catch (err: any) {
    return { error: err.message || 'Erreur serveur' }
  }
}

export async function adminChangerForfaitAgence(
  agenceId: string,
  payload: { abonnement_plan?: string; sponsorise?: boolean; jours_sponsoring?: number }
): Promise<{ success?: boolean; agence?: any; error?: string }> {
  const token = await getAdminToken()
  if (!token) return { error: 'Non authentifié' }

  try {
    const r = await fetch(`${BACKEND}/api/admin/immo-global/agences/${agenceId}/forfait`, {
      method: 'PUT',
      headers: adminHeaders(token),
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
    const data = await r.json()
    if (!r.ok) return { error: data.error || 'Erreur modification forfait agence' }
    revalidatePath('/admin/immo/agences')
    revalidatePath('/admin/plans')
    return data
  } catch (err: any) {
    return { error: err.message || 'Erreur serveur' }
  }
}

