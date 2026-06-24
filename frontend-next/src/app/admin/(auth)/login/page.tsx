import type { Metadata } from 'next'
import { adminLogin } from '@/app/actions/admin'

export const metadata: Metadata = {
  title: 'Connexion Admin — Nopalou',
  robots: 'noindex, nofollow',
}

export default function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  return (
    <div className="admin-login-page">
      <div className="admin-login-box">
        <div className="admin-login-logo">
          Nopa<span>lou</span>
          <em>Admin</em>
        </div>
        <h1 className="admin-login-titre">Accès administration</h1>
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
