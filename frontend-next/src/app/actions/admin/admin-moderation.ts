'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { BACKEND, COOKIE, extractAdminToken, adminHeaders } from './admin-common'

// ── Modérer annonce classifiée ──────────────────────────────────────
export async function modererAnnonce(
  id: string,
  action: 'approuver' | 'rejeter'
): Promise<{ error?: string; success?: boolean }> {
  const jar    = await cookies()
  const secret = extractAdminToken(jar)
  if (!secret) return { error: 'Non authentifié' }

  const body = action === 'approuver'
    ? { actif: true,  rejete: false }
    : { actif: false, rejete: true  }

  try {
    const r = await fetch(`${BACKEND}/api/annonces/admin/${id}`, {
      method: 'PUT',
      headers: adminHeaders(secret),
      body: JSON.stringify(body),
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    })

    if (!r.ok) {
      const data = await r.json().catch(() => ({}))
      return { error: data.error || 'Erreur lors de la modération' }
    }
    revalidatePath('/admin/annonces')
    revalidatePath('/annonces')
    return { success: true }
  } catch (err: any) {
    return { error: err?.message || 'Erreur de connexion au serveur' }
  }
}

// ── Booster annonce classifiée (7 jours ou personnalisé) ────────────
export async function boosterAnnonce(
  id: string,
  jours = 7
): Promise<{ error?: string; boost_until?: string }> {
  const jar    = await cookies()
  const secret = extractAdminToken(jar)
  if (!secret) return { error: 'Non authentifié' }

  try {
    const r = await fetch(`${BACKEND}/api/annonces/admin/${id}/boost`, {
      method: 'POST',
      headers: adminHeaders(secret),
      body: JSON.stringify({ jours }),
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    })

    if (!r.ok) {
      const data = await r.json().catch(() => ({}))
      return { error: data.error || 'Erreur lors du boost de l\'annonce' }
    }
    const data = await r.json()
    revalidatePath('/admin/annonces')
    revalidatePath('/annonces')
    return { boost_until: data.annonce?.boost_until }
  } catch (err: any) {
    return { error: err?.message || 'Erreur lors du boost' }
  }
}

// ── Supprimer annonce classifiée ───────────────────────────────────
export async function supprimerAnnonce(id: string): Promise<{ error?: string; success?: boolean }> {
  const jar    = await cookies()
  const secret = extractAdminToken(jar)
  if (!secret) return { error: 'Non authentifié' }

  try {
    const r = await fetch(`${BACKEND}/api/annonces/admin/${id}`, {
      method: 'DELETE',
      headers: adminHeaders(secret),
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    })

    if (!r.ok) {
      const data = await r.json().catch(() => ({}))
      return { error: data.error || 'Erreur lors de la suppression' }
    }
    revalidatePath('/admin/annonces')
    revalidatePath('/annonces')
    return { success: true }
  } catch (err: any) {
    return { error: err?.message || 'Erreur lors de la suppression' }
  }
}

// ── Batch Actions Annonces ──────────────────────────────────────────
export async function batchModererAnnonces(ids: string[], action: 'approuver' | 'rejeter'): Promise<{ successCount: number; errors: number }> {
  let successCount = 0
  let errors = 0
  for (const id of ids) {
    const res = await modererAnnonce(id, action)
    if (res.error) errors++
    else successCount++
  }
  revalidatePath('/admin/annonces')
  return { successCount, errors }
}

export async function batchSupprimerAnnonces(ids: string[]): Promise<{ successCount: number; errors: number }> {
  let successCount = 0
  let errors = 0
  for (const id of ids) {
    const res = await supprimerAnnonce(id)
    if (res.error) errors++
    else successCount++
  }
  revalidatePath('/admin/annonces')
  return { successCount, errors }
}

// ── Modérer partenaire ─────────────────────────────────────────────
export async function modererPartenaire(
  id: string,
  statut: 'approuve' | 'rejete'
): Promise<{ error?: string }> {
  const jar    = await cookies()
  const secret = extractAdminToken(jar)
  if (!secret) return { error: 'Non authentifié' }

  const r = await fetch(`${BACKEND}/api/partenaires/${id}`, {
    method: 'PUT',
    headers: adminHeaders(secret),
    body: JSON.stringify({ statut }),
    cache: 'no-store',
  })

  if (!r.ok) return { error: 'Erreur lors de la modération' }
  return {}
}

// ── Supprimer Partenaire ────────────────────────────────────────────
export async function supprimerPartenaire(id: string): Promise<{ error?: string }> {
  const jar    = await cookies()
  const secret = extractAdminToken(jar)
  if (!secret) return { error: 'Non authentifié' }

  const r = await fetch(`${BACKEND}/api/partenaires/${id}`, {
    method: 'DELETE',
    headers: adminHeaders(secret),
    cache: 'no-store',
  })

  if (!r.ok) return { error: 'Erreur lors de la suppression' }
  revalidatePath('/admin/partenaires')
  return {}
}

// ── Batch Actions Partenaires ───────────────────────────────────────
export async function batchModererPartenaires(
  ids: string[],
  action: 'approuver' | 'rejeter' | 'supprimer'
): Promise<{ successCount: number; errors: number }> {
  let successCount = 0
  let errors = 0
  for (const id of ids) {
    let res: { error?: string } = {}
    if (action === 'approuver') res = await modererPartenaire(id, 'approuve')
    else if (action === 'rejeter') res = await modererPartenaire(id, 'rejete')
    else if (action === 'supprimer') res = await supprimerPartenaire(id)

    if (res.error) errors++
    else successCount++
  }
  revalidatePath('/admin/partenaires')
  return { successCount, errors }
}

// ── Batch Actions Comptes ───────────────────────────────────────────
export async function batchModererComptes(
  ids: string[],
  action: 'suspendre' | 'reactiver' | 'supprimer'
): Promise<{ successCount: number; errors: number }> {
  const jar    = await cookies()
  const secret = extractAdminToken(jar)
  if (!secret) return { successCount: 0, errors: ids.length }

  let successCount = 0
  let errors = 0

  for (const id of ids) {
    let url = `${BACKEND}/api/admin/utilisateurs/${id}/suspendre`
    let method = 'PUT'

    if (action === 'reactiver') {
      url = `${BACKEND}/api/admin/utilisateurs/${id}/reactiver`
    } else if (action === 'supprimer') {
      url = `${BACKEND}/api/admin/utilisateurs/${id}/marquer-supprime`
      method = 'POST'
    }

    try {
      const r = await fetch(url, {
        method,
        headers: adminHeaders(secret),
        cache: 'no-store',
      })
      if (r.ok) successCount++
      else errors++
    } catch {
      errors++
    }
  }

  revalidatePath('/admin/comptes')
  return { successCount, errors }
}

// ── Modérer / Supprimer un avis boutique ─────────────────────────────
export async function supprimerAvisBoutique(id: string): Promise<{ success?: boolean; error?: string }> {
  const jar = await cookies()
  const token = extractAdminToken(jar)
  if (!token) return { error: 'Non authentifié' }

  const r = await fetch(`${BACKEND}/api/admin/avis/${id}`, {
    method: 'DELETE',
    headers: adminHeaders(token),
    cache: 'no-store',
  })

  if (!r.ok) {
    const err = await r.json().catch(() => ({}))
    return { error: err.error || 'Erreur lors de la suppression de l\'avis' }
  }
  revalidatePath('/admin/avis')
  return { success: true }
}

// ── Traiter un signalement d'abus ──────────────────────────────────
export async function traiterSignalement(
  id: string,
  statut: 'traite' | 'rejete',
  decision?: string
): Promise<{ success?: boolean; error?: string }> {
  const jar = await cookies()
  const token = extractAdminToken(jar)
  if (!token) return { error: 'Non authentifié' }

  const r = await fetch(`${BACKEND}/api/admin/signalements/${id}/traiter`, {
    method: 'PUT',
    headers: adminHeaders(token),
    body: JSON.stringify({ statut, decision }),
    cache: 'no-store',
  })

  if (!r.ok) {
    const err = await r.json().catch(() => ({}))
    return { error: err.error || 'Erreur lors du traitement du signalement' }
  }
  revalidatePath('/admin/signalements')
  return { success: true }
}

