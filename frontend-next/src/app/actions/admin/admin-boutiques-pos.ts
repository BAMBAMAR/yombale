'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { BACKEND, COOKIE, getAdminToken, adminHeaders } from './admin-auth'

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

// ── Relance & Onboarding Catalogue Marchands ──────────────────────────────
export async function relancerCatalogueBoutique(
  boutiqueId: string,
  messageCustom?: string,
  titreCustom?: string
): Promise<{ success?: boolean; result?: any; error?: string }> {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value
  if (!secret) return { error: 'Non authentifié' }

  try {
    const r = await fetch(`${BACKEND}/api/boutiques/admin/relance-catalogue`, {
      method: 'POST',
      headers: adminHeaders(secret),
      body: JSON.stringify({ boutiqueId, messageCustom, titreCustom }),
    })
    const data = await r.json()
    if (!r.ok) return { error: data.error || 'Erreur lors de l\'envoi de la relance' }
    revalidatePath('/admin/boutiques')
    return data
  } catch (err: any) {
    return { error: err.message || 'Erreur serveur' }
  }
}

export async function batchRelancerCatalogueBoutiques(
  boutiqueIds: string[],
  messageCustom?: string,
  titreCustom?: string
): Promise<{ success?: boolean; successCount?: number; errorCount?: number; errors?: any[]; error?: string }> {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value
  if (!secret) return { error: 'Non authentifié' }

  try {
    const r = await fetch(`${BACKEND}/api/boutiques/admin/relance-catalogue`, {
      method: 'POST',
      headers: adminHeaders(secret),
      body: JSON.stringify({ boutiqueIds, messageCustom, titreCustom }),
    })
    const data = await r.json()
    if (!r.ok) return { error: data.error || 'Erreur lors de la relance groupée' }
    revalidatePath('/admin/boutiques')
    return data
  } catch (err: any) {
    return { error: err.message || 'Erreur serveur' }
  }
}

export async function getRelanceCatalogueConfig(): Promise<{
  config?: {
    actif: boolean
    seuil: number
    delai_heures: number
    intervalle_jours: number
    titre: string
    template: string
  }
  stats?: Record<string, number>
  boutiquesEligibles?: Array<{
    id: string
    nom: string
    slug: string
    nb_produits: number
    telephone: string
    created_at: string
    derniere_relance_catalogue_at?: string | null
    nb_relances_catalogue?: number
  }>
  error?: string
}> {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value
  if (!secret) return { error: 'Non authentifié' }

  try {
    const r = await fetch(`${BACKEND}/api/boutiques/admin/relance-catalogue/config`, {
      headers: adminHeaders(secret),
      cache: 'no-store',
    })
    const data = await r.json()
    if (!r.ok) return { error: data.error || 'Erreur chargement configuration' }
    return data
  } catch (err: any) {
    return { error: err.message || 'Erreur serveur' }
  }
}

export async function updateRelanceCatalogueConfig(payload: {
  actif?: boolean
  seuil?: number
  delai_heures?: number
  intervalle_jours?: number
  titre?: string
  template?: string
}): Promise<{ success?: boolean; message?: string; error?: string }> {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value
  if (!secret) return { error: 'Non authentifié' }

  try {
    const r = await fetch(`${BACKEND}/api/boutiques/admin/relance-catalogue/config`, {
      method: 'PUT',
      headers: adminHeaders(secret),
      body: JSON.stringify(payload),
    })
    const data = await r.json()
    if (!r.ok) return { error: data.error || 'Erreur lors de la sauvegarde de la configuration' }
    revalidatePath('/admin/boutiques')
    return data
  } catch (err: any) {
    return { error: err.message || 'Erreur serveur' }
  }
}

export async function executerCronRelanceCatalogueAction(): Promise<{
  success?: boolean
  count?: number
  successCount?: number
  errorCount?: number
  errors?: any[]
  message?: string
  error?: string
}> {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value
  if (!secret) return { error: 'Non authentifié' }

  try {
    const r = await fetch(`${BACKEND}/api/boutiques/admin/relance-catalogue/executer-cron`, {
      method: 'POST',
      headers: adminHeaders(secret),
    })
    const data = await r.json()
    if (!r.ok) return { error: data.error || 'Erreur lors de l\'exécution du cron' }
    revalidatePath('/admin/boutiques')
    return data
  } catch (err: any) {
    return { error: err.message || 'Erreur serveur' }
  }
}

// ── Modération Produits Marchands & POS ─────────────────────────
export async function adminModererProduit(
  id: string,
  payload: { actif?: boolean; prix?: number; stock?: number }
): Promise<{ success?: boolean; produit?: any; error?: string }> {
  const token = await getAdminToken()
  if (!token) return { error: 'Non authentifié' }

  try {
    const r = await fetch(`${BACKEND}/api/admin/produits/${id}/moderation`, {
      method: 'PUT',
      headers: adminHeaders(token),
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
    const data = await r.json()
    if (!r.ok) return { error: data.error || 'Erreur modération produit' }
    revalidatePath('/admin/produits')
    return data
  } catch (err: any) {
    return { error: err.message || 'Erreur serveur' }
  }
}

// ── POS Sessions Superviseur ────────────────────────────────────
export async function adminFermerSessionPOS(
  sessionId: string,
  payload: { notes?: string }
): Promise<{ success?: boolean; session?: any; error?: string }> {
  const token = await getAdminToken()
  if (!token) return { error: 'Non authentifié' }

  try {
    const r = await fetch(`${BACKEND}/api/admin/pos/sessions/${sessionId}/force-fermeture`, {
      method: 'POST',
      headers: adminHeaders(token),
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
    const data = await r.json()
    if (!r.ok) return { error: data.error || 'Erreur clôture session' }
    revalidatePath('/admin/pos')
    return data
  } catch (err: any) {
    return { error: err.message || 'Erreur serveur' }
  }
}

// ── Carnet de dettes & Crédits Clients ──────────────────────────
export async function adminAjusterCreditClient(
  clientId: string,
  payload: { limite_credit?: number; actif?: boolean }
): Promise<{ success?: boolean; client?: any; error?: string }> {
  const token = await getAdminToken()
  if (!token) return { error: 'Non authentifié' }

  try {
    const r = await fetch(`${BACKEND}/api/admin/credits/clients/${clientId}`, {
      method: 'PUT',
      headers: adminHeaders(token),
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
    const data = await r.json()
    if (!r.ok) return { error: data.error || 'Erreur mise à jour client crédit' }
    revalidatePath('/admin/carnet-dettes')
    return data
  } catch (err: any) {
    return { error: err.message || 'Erreur serveur' }
  }
}
