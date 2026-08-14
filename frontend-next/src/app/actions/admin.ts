'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
const COOKIE  = 'nopalou_admin'

function adminHeaders(secret: string): HeadersInit {
  return { 'X-Admin-Secret': secret, 'Content-Type': 'application/json' }
}

// ── Login ──────────────────────────────────────────────────────────
export async function adminLogin(formData: FormData): Promise<void> {
  const secret = (formData.get('secret') as string ?? '').trim()
  if (!secret) redirect('/admin/login?error=secret_requis')

  const r = await fetch(`${BACKEND}/api/annonces/admin/en-attente`, {
    headers: { 'X-Admin-Secret': secret },
    cache: 'no-store',
  })

  if (r.status === 401 || r.status === 403) redirect('/admin/login?error=secret_incorrect')
  if (!r.ok) redirect('/admin/login?error=erreur_serveur')

  const jar = await cookies()
  jar.set(COOKIE, secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  })

  redirect('/admin')
}

// ── Logout ─────────────────────────────────────────────────────────
export async function adminLogout(): Promise<void> {
  const jar = await cookies()
  jar.set(COOKIE, '', { maxAge: 0, httpOnly: true, path: '/', sameSite: 'lax', secure: process.env.NODE_ENV === 'production' })
  jar.set(COOKIE, '', { maxAge: 0, httpOnly: true, path: '/admin', sameSite: 'lax', secure: process.env.NODE_ENV === 'production' })
  redirect('/admin/login')
}

// ── Modérer annonce classifiée ──────────────────────────────────────
export async function modererAnnonce(
  id: string,
  action: 'approuver' | 'rejeter'
): Promise<{ error?: string }> {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value
  if (!secret) return { error: 'Non authentifié' }

  const body = action === 'approuver'
    ? { actif: true,  rejete: false }
    : { actif: false, rejete: true  }

  const r = await fetch(`${BACKEND}/api/annonces/admin/${id}`, {
    method: 'PUT',
    headers: adminHeaders(secret),
    body: JSON.stringify(body),
    cache: 'no-store',
  })

  if (!r.ok) return { error: 'Erreur lors de la modération' }
  revalidatePath('/admin/annonces')
  revalidatePath('/annonces')
  return {}
}

// ── Modérer partenaire ─────────────────────────────────────────────
export async function modererPartenaire(
  id: string,
  statut: 'approuve' | 'rejete'
): Promise<{ error?: string }> {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value
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

// ── Modérer boutique (activer/désactiver) ───────────────────────────
export async function modererBoutique(
  id: string,
  actif: boolean
): Promise<{ error?: string }> {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value
  if (!secret) return { error: 'Non authentifié' }

  const r = await fetch(`${BACKEND}/api/boutiques/admin/${id}`, {
    method: 'PUT',
    headers: adminHeaders(secret),
    body: JSON.stringify({ actif }),
    cache: 'no-store',
  })

  if (!r.ok) return { error: 'Erreur lors de la modération' }
  return {}
}

// ── Sponsoriser boutique ─────────────────────────────────────────────
export async function activerSponsoringBoutique(
  id: string,
  activer: boolean
): Promise<{ error?: string }> {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value
  if (!secret) return { error: 'Non authentifié' }

  const body = activer
    ? { sponsorise: true, sponsor_jusqu_au: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString() }
    : { sponsorise: false, sponsor_jusqu_au: null }

  const r = await fetch(`${BACKEND}/api/boutiques/admin/${id}`, {
    method: 'PUT',
    headers: adminHeaders(secret),
    body: JSON.stringify(body),
    cache: 'no-store',
  })

  if (!r.ok) return { error: 'Erreur lors du sponsoring' }
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

// ── Supprimer annonce classifiée ───────────────────────────────────
export async function supprimerAnnonce(id: string): Promise<{ error?: string }> {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value
  if (!secret) return { error: 'Non authentifié' }

  const r = await fetch(`${BACKEND}/api/annonces/admin/${id}`, {
    method: 'DELETE',
    headers: adminHeaders(secret),
    cache: 'no-store',
  })

  if (!r.ok) return { error: 'Erreur lors de la suppression' }
  revalidatePath('/admin/annonces')
  revalidatePath('/annonces')
  return {}
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

// ── Supprimer boutique ──────────────────────────────────────────────
export async function supprimerBoutique(id: string): Promise<{ error?: string }> {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value
  if (!secret) return { error: 'Non authentifié' }

  const r = await fetch(`${BACKEND}/api/boutiques/admin/${id}`, {
    method: 'DELETE',
    headers: adminHeaders(secret),
    cache: 'no-store',
  })

  if (!r.ok) return { error: 'Erreur lors de la suppression de la boutique' }
  revalidatePath('/admin/boutiques')
  return {}
}

// ── Batch Actions Boutiques ─────────────────────────────────────────
export async function batchModererBoutiques(ids: string[], actif: boolean): Promise<{ successCount: number; errors: number }> {
  let successCount = 0
  let errors = 0
  for (const id of ids) {
    const res = await modererBoutique(id, actif)
    if (res.error) errors++
    else successCount++
  }
  revalidatePath('/admin/boutiques')
  return { successCount, errors }
}

export async function batchSupprimerBoutiques(ids: string[]): Promise<{ successCount: number; errors: number }> {
  let successCount = 0
  let errors = 0
  for (const id of ids) {
    const res = await supprimerBoutique(id)
    if (res.error) errors++
    else successCount++
  }
  revalidatePath('/admin/boutiques')
  return { successCount, errors }
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

// ── Supprimer Partenaire ────────────────────────────────────────────
export async function supprimerPartenaire(id: string): Promise<{ error?: string }> {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value
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
  const secret = jar.get(COOKIE)?.value
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

// ── Reversements Wave Marchands 1-Clic ──────────────────────────────
export async function fetchReversementsDus(): Promise<{ reversements?: any[]; error?: string }> {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value
  if (!secret) return { error: 'Non authentifié' }

  try {
    const r = await fetch(`${BACKEND}/api/comptabilite/admin/reversements-dus`, {
      headers: adminHeaders(secret),
      cache: 'no-store',
    })
    if (!r.ok) return { error: 'Erreur lors du chargement' }
    return await r.json()
  } catch (err: any) {
    return { error: err.message || 'Erreur réseau' }
  }
}

export async function effectuerReversementWave(commandeId: string): Promise<{ success?: boolean; error?: string; payout?: any; net_amount?: number; mobile?: string }> {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value
  if (!secret) return { error: 'Non authentifié' }

  try {
    const r = await fetch(`${BACKEND}/api/comptabilite/admin/reversements/${commandeId}/payer`, {
      method: 'POST',
      headers: adminHeaders(secret),
    })
    const data = await r.json()
    if (!r.ok) return { error: data.error || 'Erreur lors du transfert Wave' }
    revalidatePath('/admin/reversements')
    return data
  } catch (err: any) {
    return { error: err.message || 'Erreur serveur' }
  }
}

export async function validerLotReversementsWave(ids: string[]): Promise<{ success?: boolean; count?: number; error?: string }> {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value
  if (!secret) return { error: 'Non authentifié' }

  try {
    const r = await fetch(`${BACKEND}/api/comptabilite/admin/reversements/valider-lot`, {
      method: 'POST',
      headers: adminHeaders(secret),
      body: JSON.stringify({ ids }),
    })
    const data = await r.json()
    if (!r.ok) return { error: data.error || 'Erreur lors de la validation du lot' }
    revalidatePath('/admin/reversements')
    return data
  } catch (err: any) {
    return { error: err.message || 'Erreur serveur' }
  }
}


