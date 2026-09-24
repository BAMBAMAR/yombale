import type { Metadata } from 'next'
import Image from 'next/image'
import { AlertCircle } from 'lucide-react'
import AdminLoginForm from './AdminLoginForm'

export const metadata: Metadata = {
  title: 'Connexion Admin',
  robots: 'noindex, nofollow',
}

const MESSAGES: Record<string, string> = {
  secret_requis:    'Identifiants requis.',
  secret_incorrect: 'Identifiants incorrects ou accès révoqué.',
  session_expiree:  'Votre session administrateur a expiré. Veuillez vous reconnecter.',
  erreur_serveur:   'Erreur serveur — réessayez dans quelques instants.',
}

export default async function AdminLoginPage({ searchParams }: { searchParams?: Promise<{ error?: string }> | { error?: string } }) {
  const resolved = searchParams ? await searchParams : {}
  const error = resolved?.error
  const errorMsg = error ? (MESSAGES[error] ?? 'Erreur inconnue.') : null

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Image src="/icons/logo-mark.svg" alt="Nopalou" width={48} height={48} priority style={{ marginBottom: 12 }} />
          <a href="/" className="auth-brand">
            Nopa<span className="auth-brand-accent">lou</span>
          </a>
          <p className="auth-brand-sub">Administration</p>
          <h1 className="auth-titre">Accès sécurisé</h1>
          <p className="auth-sous-titre">Réservé aux administrateurs Nopalou</p>
        </div>

        {errorMsg && (
          <div className="auth-error" role="alert" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <AdminLoginForm />

        <p className="auth-switch" style={{ marginTop: 24 }}>
          <a href="/" className="auth-link">← Retour au site</a>
        </p>
      </div>
    </div>
  )
}
