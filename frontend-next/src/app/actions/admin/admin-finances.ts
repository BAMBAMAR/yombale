'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { BACKEND, COOKIE, adminHeaders } from './admin-auth'

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

export async function effectuerReversementWave(
  commandeId: string
): Promise<{ success?: boolean; error?: string; payout?: any; net_amount?: number; mobile?: string }> {
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

export async function validerLotReversementsWave(
  ids: string[]
): Promise<{ success?: boolean; count?: number; error?: string }> {
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
