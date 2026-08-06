import type { Metadata } from 'next'
import AdminLoginForm from './AdminLoginForm'

export const metadata: Metadata = {
  title: 'Connexion Admin',
  robots: 'noindex, nofollow',
}

const MESSAGES: Record<string, string> = {
  secret_requis:    'Le secret administrateur est requis.',
  secret_incorrect: 'Secret incorrect. Vérifiez vos identifiants.',
  erreur_serveur:   'Erreur serveur — réessayez dans quelques instants.',
}

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  const errorMsg = error ? (MESSAGES[error] ?? 'Erreur inconnue.') : null

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <a href="/" className="auth-brand">
            Nopa<span className="auth-brand-accent">lou</span>
          </a>
          <p className="auth-brand-sub">Administration</p>
          <h1 className="auth-titre">Accès sécurisé</h1>
          <p className="auth-sous-titre">Réservé aux administrateurs Nopalou</p>
        </div>

        {errorMsg && (
          <div className="auth-error" role="alert">
            <span className="auth-error-icon">⚠</span>
            {errorMsg}
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
