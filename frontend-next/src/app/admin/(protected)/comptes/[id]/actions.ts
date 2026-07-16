'use server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
const COOKIE  = 'nopalou_admin'

export interface ActionState { error?: string; success?: boolean; info?: string; lien?: string }

async function adminHeaders() {
  const jar = await cookies()
  const secret = jar.get(COOKIE)?.value
  if (!secret) throw new Error('Non authentifié')
  return { 'X-Admin-Secret': secret, 'Content-Type': 'application/json' }
}

export async function verifierEmail(id: string): Promise<ActionState> {
  try {
    const headers = await adminHeaders()
    const res = await fetch(`${BACKEND}/api/admin/utilisateurs/${id}/verifier-email`, { method: 'PUT', headers })
    const data = await res.json()
    if (!res.ok) return { error: data.error ?? `Erreur ${res.status}` }
    revalidatePath(`/admin/comptes/${id}`)
    return { success: true, info: 'Email marqué comme vérifié.' }
  } catch (e: unknown) { return { error: e instanceof Error ? e.message : 'Erreur' } }
}

export async function renvoyerVerification(id: string): Promise<ActionState> {
  try {
    const headers = await adminHeaders()
    const res = await fetch(`${BACKEND}/api/admin/utilisateurs/${id}/renvoyer-verification`, { method: 'POST', headers })
    const data = await res.json()
    if (!res.ok) return { error: data.error ?? `Erreur ${res.status}` }
    return { success: true, info: data.message ?? 'Email renvoyé.' }
  } catch (e: unknown) { return { error: e instanceof Error ? e.message : 'Erreur' } }
}

export async function genererLienReset(id: string): Promise<ActionState> {
  try {
    const headers = await adminHeaders()
    const res = await fetch(`${BACKEND}/api/admin/utilisateurs/${id}/lien-reset`, { method: 'POST', headers })
    const data = await res.json()
    if (!res.ok) return { error: data.error ?? `Erreur ${res.status}` }
    return { success: true, lien: data.lien }
  } catch (e: unknown) { return { error: e instanceof Error ? e.message : 'Erreur' } }
}

export async function suspendreCompte(id: string): Promise<ActionState> {
  try {
    const headers = await adminHeaders()
    const res = await fetch(`${BACKEND}/api/admin/utilisateurs/${id}/suspendre`, { method: 'PUT', headers })
    const data = await res.json()
    if (!res.ok) return { error: data.error ?? `Erreur ${res.status}` }
    revalidatePath(`/admin/comptes/${id}`)
    return { success: true, info: 'Compte suspendu.' }
  } catch (e: unknown) { return { error: e instanceof Error ? e.message : 'Erreur' } }
}

export async function reactiverCompte(id: string): Promise<ActionState> {
  try {
    const headers = await adminHeaders()
    const res = await fetch(`${BACKEND}/api/admin/utilisateurs/${id}/reactiver`, { method: 'PUT', headers })
    const data = await res.json()
    if (!res.ok) return { error: data.error ?? `Erreur ${res.status}` }
    revalidatePath(`/admin/comptes/${id}`)
    return { success: true, info: 'Compte réactivé.' }
  } catch (e: unknown) { return { error: e instanceof Error ? e.message : 'Erreur' } }
}

export async function marquerSupprime(id: string): Promise<ActionState> {
  try {
    const headers = await adminHeaders()
    const res = await fetch(`${BACKEND}/api/admin/utilisateurs/${id}/marquer-supprime`, { method: 'POST', headers })
    const data = await res.json()
    if (!res.ok) return { error: data.error ?? `Erreur ${res.status}` }
    revalidatePath(`/admin/comptes/${id}`)
    return { success: true, info: 'Compte marqué pour suppression (période de grâce 30 jours).' }
  } catch (e: unknown) { return { error: e instanceof Error ? e.message : 'Erreur' } }
}

export async function restaurerCompte(id: string): Promise<ActionState> {
  try {
    const headers = await adminHeaders()
    const res = await fetch(`${BACKEND}/api/admin/utilisateurs/${id}/restaurer`, { method: 'POST', headers })
    const data = await res.json()
    if (!res.ok) return { error: data.error ?? `Erreur ${res.status}` }
    revalidatePath(`/admin/comptes/${id}`)
    return { success: true, info: 'Suppression annulée, compte restauré.' }
  } catch (e: unknown) { return { error: e instanceof Error ? e.message : 'Erreur' } }
}

export async function purgerCompte(id: string): Promise<ActionState> {
  try {
    const headers = await adminHeaders()
    const res = await fetch(`${BACKEND}/api/admin/utilisateurs/${id}/purger`, { method: 'POST', headers })
    const data = await res.json()
    if (!res.ok) return { error: data.error ?? `Erreur ${res.status}` }
    revalidatePath(`/admin/comptes/${id}`)
    return { success: true, info: 'Compte purgé définitivement (anonymisé).' }
  } catch (e: unknown) { return { error: e instanceof Error ? e.message : 'Erreur' } }
}
