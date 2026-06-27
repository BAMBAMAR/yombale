'use server'

import { SignJWT } from 'jose'
import { getOptionalSession } from '@/lib/dal'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'

export interface ImmoResult {
  ok: boolean
  id?: string
  error?: string
  errors?: Array<{ msg: string }>
}

export async function deleteAnnonceImmo(id: string): Promise<{ error?: string }> {
  const session = await getOptionalSession()
  if (!session) return { error: 'Connexion requise' }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    const token = await new SignJWT({ userId: session.userId, email: session.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('2m')
      .sign(secret)

    const res = await fetch(`${BACKEND}/api/immo/mine/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      return { error: body.error ?? `Erreur ${res.status}` }
    }
    return {}
  } catch (err) {
    console.error('[deleteAnnonceImmo]', err)
    return { error: 'Erreur réseau — réessayez.' }
  }
}

export async function deposerAnnonceImmo(formData: FormData): Promise<ImmoResult> {
  const session = await getOptionalSession()
  if (!session) return { ok: false, error: 'Connexion requise' }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    const token = await new SignJWT({ userId: session.userId, email: session.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('5m')
      .sign(secret)

    const body = {
      titre:       formData.get('titre'),
      type_bien:   formData.get('type_bien'),
      transaction: formData.get('transaction'),
      prix:        formData.get('prix') || null,
      surface_m2:  formData.get('surface_m2') || null,
      nb_pieces:   formData.get('nb_pieces') || null,
      nb_chambres: formData.get('nb_chambres') || null,
      meuble:      formData.get('meuble') === 'on',
      ville:       formData.get('ville'),
      quartier:    formData.get('quartier') || null,
      description: formData.get('description') || null,
      contact_nom: formData.get('contact_nom') || null,
      contact_tel: formData.get('contact_tel'),
    }

    const res = await fetch(`${BACKEND}/api/immo/public`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      return {
        ok: false,
        error: data.error ?? `Erreur ${res.status}`,
        errors: data.errors,
      }
    }

    return { ok: true, id: data.id }
  } catch (err) {
    console.error('[deposerAnnonceImmo]', err)
    return { ok: false, error: 'Erreur réseau — réessayez.' }
  }
}
