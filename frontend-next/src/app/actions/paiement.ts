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
  fallbackManuel?: boolean
  reference?: string
  montant?: number
  numeroDepot?: string
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
    if (!res.ok || body.fallback_manuel || !body.wave_url) {
      return {
        ok: false,
        fallbackManuel: Boolean(body.fallback_manuel || !body.wave_url),
        error: body.error ?? `Erreur ${res.status}`,
        reference: body.reference,
        montant: body.montant,
        numeroDepot: body.numero_depot,
      }
    }
    return { ok: true, url: body.wave_url }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erreur réseau' }
  }
}

export async function initierWaveBoost(annonce_id: string): Promise<PaiementResult> {
  const session = await getOptionalSession()
  if (!session) return { ok: false, error: 'Connexion requise' }

  try {
    const token = await getAuthToken(session)
    const res = await fetch(`${BACKEND}/api/paiement/boost/initier`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ annonce_id }),
    })
    const body = await res.json()
    if (!res.ok || body.fallback_manuel || !body.wave_url) {
      return {
        ok: false,
        fallbackManuel: Boolean(body.fallback_manuel || !body.wave_url),
        error: body.error ?? `Erreur ${res.status}`,
        reference: body.reference,
        montant: body.montant,
        numeroDepot: body.numero_depot,
      }
    }
    return { ok: true, url: body.wave_url }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erreur réseau' }
  }
}

export async function initierOrangeAnnonce(annonce_id: string): Promise<PaiementResult> {
  const session = await getOptionalSession()
  if (!session) return { ok: false, error: 'Connexion requise' }

  try {
    let montant = 1500
    try {
      const r = await fetch(`${BACKEND}/api/settings/public`, { cache: 'no-store' })
      if (r.ok) montant = Number((await r.json()).prix_annonce) || 1500
    } catch {
      // fallback 1500 en cas d'échec du fetch settings
    }

    const token = await getAuthToken(session)
    const res = await fetch(`${BACKEND}/api/paiement/orange/initier`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ montant, commande_id: `ann_${annonce_id}` }),
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
    if (!res.ok || body.fallback_manuel || !body.wave_url) {
      return {
        ok: false,
        fallbackManuel: Boolean(body.fallback_manuel || !body.wave_url),
        error: body.error ?? `Erreur ${res.status}`,
        reference: body.reference,
        montant: body.montant,
        numeroDepot: body.numero_depot,
      }
    }
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
    if (!res.ok || body.fallback_manuel || !body.wave_url) {
      const detail = body.detail ? ` (${JSON.stringify(body.detail)})` : ''
      return {
        ok: false,
        fallbackManuel: Boolean(body.fallback_manuel || !body.wave_url),
        error: (body.error ?? `Erreur ${res.status}`) + detail,
        reference: body.reference,
        montant: body.montant,
        numeroDepot: body.numero_depot,
      }
    }
    return { ok: true, url: body.wave_url }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erreur réseau' }
  }
}

export async function initierWaveAbonnement(plan: 'pro' | 'business', duree_mois: number = 1): Promise<PaiementResult> {
  const session = await getOptionalSession()
  if (!session) return { ok: false, error: 'Connexion requise' }

  try {
    const token = await getAuthToken(session)
    const res = await fetch(`${BACKEND}/api/abonnements/initier`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ plan, duree_mois }),
    })
    const body = await res.json()
    if (!res.ok || body.fallback_manuel || !body.wave_url) {
      return {
        ok: false,
        fallbackManuel: Boolean(body.fallback_manuel || !body.wave_url),
        error: body.error ?? `Erreur ${res.status}`,
        reference: body.reference,
        montant: body.montant,
        numeroDepot: body.numero_depot,
      }
    }
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
    if (!res.ok || body.fallback_manuel || !body.wave_url) {
      return {
        ok: false,
        fallbackManuel: Boolean(body.fallback_manuel || !body.wave_url),
        error: body.error ?? `Erreur ${res.status}`,
        reference: body.reference,
        montant: body.montant,
        numeroDepot: body.numero_depot,
      }
    }
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
