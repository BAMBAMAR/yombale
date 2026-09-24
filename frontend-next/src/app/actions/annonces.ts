'use server'

import { SignJWT } from 'jose'
import { getOptionalSession } from '@/lib/dal'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'

export interface AnnonceResult {
  ok: boolean
  id?: string
  error?: string
  errors?: Array<{ msg: string }>
}

export async function creerAnnonce(formData: FormData): Promise<AnnonceResult> {
  const session = await getOptionalSession()
  if (!session) return { ok: false, error: 'Connexion requise' }

  const jwtSecret = process.env.JWT_SECRET || process.env.SESSION_SECRET
  if (!jwtSecret) {
    console.error('[creerAnnonce] JWT_SECRET/SESSION_SECRET non défini — configurer dans Render Environment')
    return { ok: false, error: 'Configuration serveur manquante — contactez l\'administrateur' }
  }

  try {
    const secret = new TextEncoder().encode(jwtSecret)
    const token = await new SignJWT({ userId: session.userId, email: session.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('5m')
      .sign(secret)

    const res = await fetch(`${BACKEND}/api/annonces`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    })

    const body = await res.json().catch(() => ({}))

    if (!res.ok) {
      return {
        ok: false,
        error: body.error ?? `Erreur ${res.status}`,
        errors: body.errors,
      }
    }

    return { ok: true, id: body.id }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erreur inconnue' }
  }
}

export async function updateAnnonce(id: string, formData: FormData): Promise<AnnonceResult> {
  const session = await getOptionalSession()
  if (!session) return { ok: false, error: 'Connexion requise' }

  const jwtSecret = process.env.JWT_SECRET || process.env.SESSION_SECRET
  if (!jwtSecret) {
    return { ok: false, error: 'Configuration serveur manquante — contactez l\'administrateur' }
  }

  try {
    const secret = new TextEncoder().encode(jwtSecret)
    const token = await new SignJWT({ userId: session.userId, email: session.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('5m')
      .sign(secret)

    const res = await fetch(`${BACKEND}/api/annonces/mine/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    })

    const body = await res.json().catch(() => ({}))

    if (!res.ok) {
      return {
        ok: false,
        error: body.error ?? `Erreur ${res.status}`,
        errors: body.errors,
      }
    }

    return { ok: true, id: body.id ?? id }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erreur inconnue' }
  }
}

export async function deleteAnnonce(id: string): Promise<{ error?: string }> {
  const session = await getOptionalSession()
  if (!session) return { error: 'Connexion requise' }

  const jwtSecret = process.env.JWT_SECRET || process.env.SESSION_SECRET
  if (!jwtSecret) return { error: 'Configuration serveur manquante' }

  try {
    const secret = new TextEncoder().encode(jwtSecret)
    const token = await new SignJWT({ userId: session.userId, email: session.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('2m')
      .sign(secret)

    const res = await fetch(`${BACKEND}/api/annonces/mine/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      return { error: body.error ?? `Erreur ${res.status}` }
    }
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Erreur inconnue' }
  }
}
