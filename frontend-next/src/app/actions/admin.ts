'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
const COOKIE  = 'nopalou_admin'

function adminHeaders(secret: string): HeadersInit {
  return { 'X-Admin-Secret': secret, 'Content-Type': 'application/json' }
}

// ── Login ──────────────────────────────────────────────────────────
export async function adminLogin(formData: FormData): Promise<void> {
  const secret = (formData.get('secret') as string ?? '').trim()
  if (!secret) redirect('/admin/login?error=secret_requis')

  const r = await fetch(`${BACKEND}/api/annonces/admin/en-attente`, {
    headers: { 'X-Admin-Secret': secret },
    cache: 'no-store',
  })

  if (r.status === 401 || r.status === 403) redirect('/admin/login?error=secret_incorrect')
  if (!r.ok) redirect('/admin/login?error=erreur_serveur')

  const jar = await cookies()
  jar.set(COOKIE, secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  })

  redirect('/admin')
}

// ── Logout ─────────────────────────────────────────────────────────
export async function adminLogout(): Promise<void> {
  const jar = await cookies()
  jar.set(COOKIE, '', { maxAge: 0, httpOnly: true, path: '/', sameSite: 'lax', secure: process.env.NODE_ENV === 'production' })
  jar.set(COOKIE, '', { maxAge: 0, httpOnly: true, path: '/admin', sameSite: 'lax', secure: process.env.NODE_ENV === 'production' })
  redirect('/admin/login')
}

// ── Modérer annonce classifiée ──────────────────────────────────────
export async function modererAnnonce(
  id: string,
  action: 'approuver' | 'rejeter'
): Promise<{ error?: string }> {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value
  if (!secret) return { error: 'Non authentifié' }

  const body = action === 'approuver'
    ? { actif: true,  rejete: false }
    : { actif: false, rejete: true  }

  const r = await fetch(`${BACKEND}/api/annonces/admin/${id}`, {
    method: 'PUT',
    headers: adminHeaders(secret),
    body: JSON.stringify(body),
    cache: 'no-store',
  })

  if (!r.ok) return { error: 'Erreur lors de la modération' }
  return {}
}

// ── Modérer annonce immo ────────────────────────────────────────────
export async function modererImmo(
  id: number,
  actif: boolean
): Promise<{ error?: string }> {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value
  if (!secret) return { error: 'Non authentifié' }

  const r = await fetch(`${BACKEND}/api/immo/${id}`, {
    method: 'PUT',
    headers: adminHeaders(secret),
    body: JSON.stringify({ actif }),
    cache: 'no-store',
  })

  if (!r.ok) return { error: 'Erreur lors de la modération' }
  return {}
}
