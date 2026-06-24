'use server'

import { SignJWT } from 'jose'
import { getOptionalSession } from '@/lib/dal'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'

async function getAuthToken(session: { userId: string; email?: string | null }) {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
  return new SignJWT({ userId: session.userId, email: session.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('5m')
    .sign(secret)
}

export interface PaiementResult {
  ok: boolean
  url?: string
  error?: string
}

export async function initierWaveAnnonce(annonce_id: string): Promise<PaiementResult> {
  const session = await getOptionalSession()
  if (!session) return { ok: false, error: 'Connexion requise' }

  try {
    const token = await getAuthToken(session)
    const res = await fetch(`${BACKEND}/api/paiement/annonce/initier`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ annonce_id }),
    })
    const body = await res.json()
    if (!res.ok) return { ok: false, error: body.error ?? `Erreur ${res.status}` }
    return { ok: true, url: body.wave_url }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erreur réseau' }
  }
}

export async function initierOrangeAnnonce(annonce_id: string): Promise<PaiementResult> {
  const session = await getOptionalSession()
  if (!session) return { ok: false, error: 'Connexion requise' }

  try {
    const token = await getAuthToken(session)
    const res = await fetch(`${BACKEND}/api/paiement/orange/initier`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ montant: 1500, commande_id: `ann_${annonce_id}` }),
    })
    const body = await res.json()
    if (!res.ok) return { ok: false, error: body.error ?? `Erreur ${res.status}` }
    return { ok: true, url: body.pay_url }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erreur réseau' }
  }
}
