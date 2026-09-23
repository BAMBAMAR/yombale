import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSession } from '@/lib/session'
import { AlertCircle, ArrowRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Connexion Magique | Nopalou',
  description: 'Authentification sécurisée par lien magique Nopalou.',
}

export default async function ConnexionMagiquePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; redirect?: string }>
}) {
  const { token, redirect: redirectParam } = await searchParams
  const API = process.env.BACKEND_URL ?? 'http://localhost:3000'

  let errorMessage: string | null = null

  if (token) {
    try {
      const res = await fetch(`${API}/api/auth/magic-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
        cache: 'no-store',
      })
      const data = await res.json()

      if (res.ok && data?.user?.id) {
        await createSession({
          userId: data.user.id,
          nom: data.user.nom,
          email: data.user.email,
          telephone: data.user.telephone,
        })

        const destination =
          redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('//')
            ? redirectParam
            : '/boutique'

        redirect(destination)
      } else {
        errorMessage = data?.error || 'Ce lien de connexion est invalide ou a déjà expiré.'
      }
    } catch (err: any) {
      if (err?.digest?.startsWith('NEXT_REDIRECT')) throw err
      console.error('[CONNEXION MAGIQUE ERROR]:', err?.message || err)
      errorMessage = 'Une erreur est survenue lors de la validation de votre lien.'
    }
  } else {
    errorMessage = 'Aucun jeton de connexion magique fourni dans le lien.'
  }

  return (
    <div
      style={{
        minHeight: '75vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          maxWidth: '460px',
          width: '100%',
          background: '#ffffff',
          borderRadius: '16px',
          border: '1.5px solid var(--border, #E8DDD2)',
          padding: '32px 24px',
          textAlign: 'center',
          boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: '#FEF2F2',
            color: '#DC2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <AlertCircle size={28} />
        </div>

        <h1
          style={{
            fontSize: '20px',
            fontWeight: 700,
            color: 'var(--navy, #1C2B4A)',
            marginBottom: '8px',
          }}
        >
          Lien de connexion expiré
        </h1>

        <p
          style={{
            fontSize: '14px',
            color: '#64748B',
            lineHeight: '1.5',
            marginBottom: '24px',
          }}
        >
          {errorMessage}
        </p>

        <Link
          href={`/connexion${
            redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : ''
          }`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '100%',
            padding: '12px 18px',
            background: 'var(--navy, #1C2B4A)',
            color: '#ffffff',
            borderRadius: '10px',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          <span>Accéder à la connexion</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  )
}
