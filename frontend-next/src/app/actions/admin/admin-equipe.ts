'use server'

import { revalidatePath } from 'next/cache'
import { BACKEND, adminHeaders } from './admin-common'
import { getAdminToken } from './admin-auth'

// ── Équipe & RBAC Administrateur ───────────────────────────────────
export async function adminGetEquipe(): Promise<{ success?: boolean; membres?: any[]; error?: string }> {
  const token = await getAdminToken()
  if (!token) return { error: 'Non authentifié' }

  try {
    const r = await fetch(`${BACKEND}/api/admin/equipe`, {
      headers: adminHeaders(token),
      cache: 'no-store',
    })
    const data = await r.json()
    if (!r.ok) return { error: data.error || 'Erreur récupération équipe' }
    return data
  } catch (err: any) {
    return { error: err.message || 'Erreur serveur' }
  }
}

export async function adminCreerMembreEquipe(payload: {
  nom: string
  email: string
  motDePasse: string
  role: string
  telephone?: string
}): Promise<{ success?: boolean; membre?: any; error?: string }> {
  const token = await getAdminToken()
  if (!token) return { error: 'Non authentifié' }

  try {
    const r = await fetch(`${BACKEND}/api/admin/equipe`, {
      method: 'POST',
      headers: adminHeaders(token),
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
    const data = await r.json()
    if (!r.ok) return { error: data.error || 'Erreur création membre' }
    revalidatePath('/admin/equipe-admin')
    return data
  } catch (err: any) {
    return { error: err.message || 'Erreur serveur' }
  }
}

export async function adminModifierMembreEquipe(
  id: string,
  payload: { nom?: string; email?: string; role?: string; actif?: boolean; motDePasse?: string }
): Promise<{ success?: boolean; membre?: any; error?: string }> {
  const token = await getAdminToken()
  if (!token) return { error: 'Non authentifié' }

  try {
    const r = await fetch(`${BACKEND}/api/admin/equipe/${id}`, {
      method: 'PUT',
      headers: adminHeaders(token),
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
    const data = await r.json()
    if (!r.ok) return { error: data.error || 'Erreur mise à jour membre' }
    revalidatePath('/admin/equipe-admin')
    return data
  } catch (err: any) {
    return { error: err.message || 'Erreur serveur' }
  }
}

export async function adminSupprimerMembreEquipe(id: string): Promise<{ success?: boolean; error?: string }> {
  const token = await getAdminToken()
  if (!token) return { error: 'Non authentifié' }

  try {
    const r = await fetch(`${BACKEND}/api/admin/equipe/${id}`, {
      method: 'DELETE',
      headers: adminHeaders(token),
      cache: 'no-store',
    })
    const data = await r.json()
    if (!r.ok) return { error: data.error || 'Erreur suppression membre' }
    revalidatePath('/admin/equipe-admin')
    return data
  } catch (err: any) {
    return { error: err.message || 'Erreur serveur' }
  }
}
