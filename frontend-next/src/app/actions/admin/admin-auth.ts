'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { BACKEND, COOKIE_SECRET, COOKIE_JWT, type AdminUserSession } from './admin-common'
export type { AdminUserSession }

export async function getAdminToken(): Promise<string | undefined> {
  const jar = await cookies()
  return jar.get(COOKIE_JWT)?.value || jar.get(COOKIE_SECRET)?.value
}

export async function getAdminSession(): Promise<AdminUserSession | null> {
  const jar = await cookies()
  const jwt = jar.get(COOKIE_JWT)?.value
  const secret = jar.get(COOKIE_SECRET)?.value

  if (jwt && jwt.startsWith('eyJ')) {
    try {
      const res = await fetch(`${BACKEND}/api/admin/auth/me`, {
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Cookie': `${COOKIE_JWT}=${jwt}`,
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(4000),
      })
      if (res.ok) {
        const data = await res.json()
        const adminObj = data.admin || data.user
        if (adminObj) {
          const rawPerms = adminObj.permissions || {}
          const permissions = Array.isArray(rawPerms)
            ? rawPerms
            : Object.keys(rawPerms).filter(k => rawPerms[k])
          return {
            id: adminObj.id,
            nom: adminObj.nom,
            email: adminObj.email,
            role: adminObj.role,
            permissions,
          }
        }
      } else if (res.status === 401) {
        // Le token a expiré ou est invalide : purger les cookies pour forcer une ré-authentification propre
        jar.delete(COOKIE_JWT)
        jar.delete(COOKIE_SECRET)
        return null
      }
    } catch {
      // Backend temporairement injoignable
    }
  }

  // Break-glass : seulement si secret brut présent (et pas un JWT expiré) correspondant à ADMIN_SECRET
  if (secret && !secret.startsWith('eyJ')) {
    const envSecret = process.env.ADMIN_SECRET
    if (!envSecret || secret === envSecret) {
      return {
        id: 'break-glass-admin',
        nom: 'Super Administrateur',
        email: process.env.ADMIN_EMAIL || 'contact@nopalou.com',
        role: 'super_admin',
        permissions: ['*'],
      }
    }
  }

  return null
}

// ── Login ──────────────────────────────────────────────────────────
export async function adminLogin(formData: FormData): Promise<void> {
  const email = (formData.get('email') as string ?? '').trim()
  const motDePasse = (formData.get('mot_de_passe') as string ?? (formData.get('password') as string ?? '')).trim()
  const secret = (formData.get('secret') as string ?? '').trim()

  const jar = await cookies()
  const sevenDays = 60 * 60 * 24 * 7

  // 1. Authentification nominative (Email + Mot de passe)
  if (email && motDePasse) {
    try {
      const res = await fetch(`${BACKEND}/api/admin/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, motDePasse }),
        cache: 'no-store',
      })

      if (res.ok) {
        const data = await res.json()
        if (data.token) {
          jar.set(COOKIE_JWT, data.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: sevenDays,
          })
          jar.set(COOKIE_SECRET, data.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: sevenDays,
          })
          redirect('/admin')
        }
      } else {
        redirect('/admin/login?error=secret_incorrect')
      }
    } catch (err: any) {
      if (err?.digest?.startsWith('NEXT_REDIRECT')) throw err
      redirect('/admin/login?error=erreur_serveur')
    }
  }

  // 2. Authentification par Secret Master (Break-glass & E2E Tests)
  if (secret) {
    // AUD-143 : le secret maître n'est plus jamais copié dans un cookie. Le backend le vérifie (comparaison à temps
    // constant, verrou anti-devinette) et renvoie un jeton nominatif court : c'est lui seul qui est conservé.
    try {
      const res = await fetch(`${BACKEND}/api/admin/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret }),
        cache: 'no-store',
        signal: AbortSignal.timeout(4000),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.token) {
          jar.set(COOKIE_JWT, data.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: sevenDays,
          })
          jar.set(COOKIE_SECRET, data.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: sevenDays,
          })
          redirect('/admin')
        }
      } else if (res.status === 401 || res.status === 403 || res.status === 429) {
        redirect('/admin/login?error=secret_incorrect')
      }
    } catch (err: any) {
      if (err?.digest?.startsWith('NEXT_REDIRECT')) throw err
    }

    redirect('/admin/login?error=erreur_serveur')
  }

  redirect('/admin/login?error=secret_requis')
}

// ── Logout ─────────────────────────────────────────────────────────
export async function adminLogout(): Promise<void> {
  const jar = await cookies()
  jar.delete(COOKIE_SECRET)
  jar.delete(COOKIE_JWT)
  redirect('/admin/login')
}
