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

export async function initierWaveImmoSponsoring(immo_id: string): Promise<PaiementResult> {
  const session = await getOptionalSession()
  if (!session) return { ok: false, error: 'Connexion requise' }

  try {
    const token = await getAuthToken(session)
    const res = await fetch(`${BACKEND}/api/paiement/immo-sponsoring/initier`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ immo_id }),
    })
    const body = await res.json()
    if (!res.ok) return { ok: false, error: body.error ?? `Erreur ${res.status}` }
    return { ok: true, url: body.wave_url }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erreur réseau' }
  }
}

export async function initierWaveProduitSponsoring(produit_id: string): Promise<PaiementResult> {
  const session = await getOptionalSession()
  if (!session) return { ok: false, error: 'Connexion requise' }

  try {
    const token = await getAuthToken(session)
    const res = await fetch(`${BACKEND}/api/paiement/produit-sponsoring/initier`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ produit_id }),
    })
    const body = await res.json()
    if (!res.ok) {
      const detail = body.detail ? ` (${JSON.stringify(body.detail)})` : ''
      return { ok: false, error: (body.error ?? `Erreur ${res.status}`) + detail }
    }
    return { ok: true, url: body.wave_url }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erreur réseau' }
  }
}

export async function initierWaveAbonnement(plan: 'pro' | 'business'): Promise<PaiementResult> {
  const session = await getOptionalSession()
  if (!session) return { ok: false, error: 'Connexion requise' }

  try {
    const token = await getAuthToken(session)
    const res = await fetch(`${BACKEND}/api/abonnements/initier`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ plan }),
    })
    const body = await res.json()
    if (!res.ok) return { ok: false, error: body.error ?? `Erreur ${res.status}` }
    return { ok: true, url: body.wave_url }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erreur réseau' }
  }
}

export async function initierWaveBoutiqueSponsoring(boutique_id: string): Promise<PaiementResult> {
  const session = await getOptionalSession()
  if (!session) return { ok: false, error: 'Connexion requise' }

  try {
    const token = await getAuthToken(session)
    const res = await fetch(`${BACKEND}/api/paiement/boutique-sponsoring/initier`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ boutique_id }),
    })
    const body = await res.json()
    if (!res.ok) return { ok: false, error: body.error ?? `Erreur ${res.status}` }
    return { ok: true, url: body.wave_url }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erreur réseau' }
  }
}

export async function declarerPaiementManuel(input: {
  reference: string
  montant: number
  methode: 'wave' | 'orange'
  telephoneExpediteur: string
  transactionId?: string
  preuve?: File
}): Promise<PaiementResult> {
  const session = await getOptionalSession()
  if (!session) return { ok: false, error: 'Connexion requise' }

  try {
    const token = await getAuthToken(session)
    const form = new FormData()
    form.set('reference', input.reference)
    form.set('montant', String(input.montant))
    form.set('methode', input.methode)
    form.set('telephone_expediteur', input.telephoneExpediteur)
    if (input.transactionId) form.set('transaction_id_client', input.transactionId)
    if (input.preuve) form.set('preuve', input.preuve)

    const res = await fetch(`${BACKEND}/api/paiement/manuel/declarer`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    })
    const body = await res.json()
    if (!res.ok) return { ok: false, error: body.error ?? `Erreur ${res.status}` }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erreur réseau' }
  }
}
