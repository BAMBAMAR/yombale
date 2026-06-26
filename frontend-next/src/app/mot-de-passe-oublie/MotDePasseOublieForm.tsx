'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'

function FormDemande() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErr('')
    try {
      await fetch(`${BACKEND}/api/auth/mot-de-passe-oublie`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setDone(true)
    } catch {
      setErr('Impossible de contacter le serveur. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="auth-success">
        <p className="auth-success-icon">✅</p>
        <p>Si cette adresse est associée à un compte, vous recevrez un email avec un lien de réinitialisation dans quelques minutes.</p>
        <a href="/connexion" className="auth-link" style={{ display: 'block', marginTop: 16 }}>Retour à la connexion</a>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="auth-form">
      {err && <div className="auth-error" role="alert"><span className="auth-error-icon">⚠</span>{err}</div>}
      <div className="auth-field">
        <label htmlFor="email" className="auth-label">Adresse email</label>
        <div className="auth-input-wrap">
          <span className="auth-input-icon">✉</span>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            placeholder="vous@exemple.com"
            className="auth-input auth-input--icon"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>
      </div>
      <button type="submit" disabled={loading} className={`auth-submit-btn${loading ? ' auth-submit-btn--pending' : ''}`}>
        {loading ? <><span className="auth-spinner" />Envoi en cours…</> : 'Envoyer le lien'}
      </button>
      <p className="auth-switch" style={{ marginTop: 16 }}>
        <a href="/connexion" className="auth-link">Retour à la connexion</a>
      </p>
    </form>
  )
}

function FormReinit({ token }: { token: string }) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) { setErr('Le mot de passe doit contenir au moins 6 caractères.'); return }
    setLoading(true)
    setErr('')
    try {
      const r = await fetch(`${BACKEND}/api/auth/reinitialiser-mot-de-passe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, mot_de_passe: password }),
      })
      if (!r.ok) { const d = await r.json(); setErr(d.error || 'Lien invalide ou expiré.'); return }
      setDone(true)
    } catch {
      setErr('Impossible de contacter le serveur. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="auth-success">
        <p className="auth-success-icon">✅</p>
        <p>Votre mot de passe a été mis à jour avec succès.</p>
        <a href="/connexion" className="auth-link" style={{ display: 'block', marginTop: 16 }}>Se connecter</a>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="auth-form">
      {err && <div className="auth-error" role="alert"><span className="auth-error-icon">⚠</span>{err}</div>}
      <div className="auth-field">
        <label htmlFor="password" className="auth-label">Nouveau mot de passe</label>
        <div className="auth-input-wrap">
          <span className="auth-input-icon">🔒</span>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            placeholder="Minimum 6 caractères"
            className="auth-input auth-input--icon"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>
      </div>
      <button type="submit" disabled={loading} className={`auth-submit-btn${loading ? ' auth-submit-btn--pending' : ''}`}>
        {loading ? <><span className="auth-spinner" />Mise à jour…</> : 'Changer le mot de passe'}
      </button>
    </form>
  )
}

function FormRouter() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  return token ? <FormReinit token={token} /> : <FormDemande />
}

export default function MotDePasseOublieForm() {
  return (
    <Suspense fallback={<FormDemande />}>
      <FormRouter />
    </Suspense>
  )
}
