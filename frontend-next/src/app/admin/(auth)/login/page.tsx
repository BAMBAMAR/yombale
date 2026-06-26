import type { Metadata } from 'next'
import { adminLogin } from '@/app/actions/admin'

export const metadata: Metadata = {
  title: 'Connexion Admin — Nopalou',
  robots: 'noindex, nofollow',
}

const MESSAGES: Record<string, string> = {
  secret_requis:    'Secret requis.',
  secret_incorrect: 'Secret incorrect.',
  erreur_serveur:   'Erreur serveur — réessayez.',
}

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  const errorMsg = error ? (MESSAGES[error] ?? 'Erreur inconnue.') : null

  return (
    <div className="admin-login-page">
      <div className="admin-login-box">
        <div className="admin-login-logo">
          Nopa<span>lou</span>
          <em>Admin</em>
        </div>
        <h1 className="admin-login-titre">Accès administration</h1>
        {errorMsg && (
          <p style={{ color: '#dc2626', fontSize: 14, marginBottom: 12, textAlign: 'center' }}>
            {errorMsg}
          </p>
        )}
        <form action={adminLogin} className="admin-login-form">
          <label htmlFor="secret" className="admin-login-label">Secret administrateur</label>
          <input
            id="secret"
            name="secret"
            type="password"
            required
            placeholder="••••••••••••"
            className="admin-login-input"
            autoComplete="current-password"
          />
          <button type="submit" className="btn-primary admin-login-btn">
            Se connecter
          </button>
        </form>
      </div>
    </div>
  )
}
