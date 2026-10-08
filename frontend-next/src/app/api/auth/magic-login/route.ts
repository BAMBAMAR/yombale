// frontend-next/src/app/api/auth/magic-login/route.ts
// Handler de connexion transparente par Magic Link (Anti-Mur de Login WhatsApp)
// Établit la session HTTP-Only et redirige le marchand directement sur son outil.

import { NextRequest, NextResponse } from 'next/server'
import { createSession, versionDuJeton } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')?.trim() || ''
  const rawRedirect = searchParams.get('redirect')?.trim() || '/boutique'

  // Assainissement de l'URL de redirection (anti-Open Redirect)
  const safeRedirect = rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')
    ? rawRedirect
    : '/boutique'

  if (!token) {
    const errorUrl = new URL(`/connexion?error=token_manquant&redirect=${encodeURIComponent(safeRedirect)}`, request.url)
    return NextResponse.redirect(errorUrl)
  }

  try {
    const BACKEND = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'
    const res = await fetch(`${BACKEND}/api/auth/magic-verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
      cache: 'no-store',
    })

    const data = await res.json()

    if (!res.ok || !data.success || !data.user) {
      const errorUrl = new URL(
        `/connexion?error=${encodeURIComponent(data.error || 'lien_expire')}&redirect=${encodeURIComponent(safeRedirect)}`,
        request.url
      )
      return NextResponse.redirect(errorUrl)
    }

    // Établir la session Next.js HTTP-Only
    await createSession({
      userId: String(data.user.id),
      nom: data.user.nom || undefined,
      email: data.user.email || undefined,
      telephone: data.user.telephone || undefined,
      jwtVersion: versionDuJeton(data.token),
    })

    // Redirection directe vers la destination finale demandée
    const targetUrl = new URL(safeRedirect, request.url)
    return NextResponse.redirect(targetUrl)
  } catch (err: any) {
    console.error('[MAGIC LOGIN HANDLER ERROR]:', err?.message)
    const fallbackUrl = new URL(
      `/connexion?error=erreur_serveur&redirect=${encodeURIComponent(safeRedirect)}`,
      request.url
    )
    return NextResponse.redirect(fallbackUrl)
  }
}
