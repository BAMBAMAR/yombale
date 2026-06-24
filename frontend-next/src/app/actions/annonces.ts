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

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
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
