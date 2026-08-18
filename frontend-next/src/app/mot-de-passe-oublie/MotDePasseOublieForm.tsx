'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from '@/i18n/context'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'

function FormDemande() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')
  const { t } = useTranslation()

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
      setErr(t('errors.networkError'))
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="auth-success">
        <p className="auth-success-icon">✅</p>
        <p>{t('auth.resetLinkSent')}</p>
        <Link href="/connexion" className="auth-link" style={{ display: 'block', marginTop: 16 }}>{t('auth.backToLogin')}</Link>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="auth-form">
      {err && <div className="auth-error" role="alert"><span className="auth-error-icon">⚠</span>{err}</div>}
      <div className="auth-field">
        <label htmlFor="email" className="auth-label">{t('auth.emailLabel')}</label>
        <div className="auth-input-wrap">
          <span className="auth-input-icon">✉</span>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            placeholder={t('auth.emailPlaceholder')}
            className="auth-input auth-input--icon"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>
      </div>
      <button type="submit" disabled={loading} className={`auth-submit-btn${loading ? ' auth-submit-btn--pending' : ''}`}>
        {loading ? <><span className="auth-spinner" />{t('common.pleaseWait')}</> : t('auth.sendResetLink')}
      </button>
      <p className="auth-switch" style={{ marginTop: 16 }}>
        <Link href="/connexion" className="auth-link">{t('auth.backToLogin')}</Link>
      </p>
    </form>
  )
}

function FormReinit({ token }: { token: string }) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')
  const { t } = useTranslation()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) { setErr(t('errors.passwordTooShort')); return }
    setLoading(true)
    setErr('')
    try {
      const r = await fetch(`${BACKEND}/api/auth/reinitialiser-mot-de-passe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, mot_de_passe: password }),
      })
      if (!r.ok) { const d = await r.json(); setErr(d.error || t('errors.genericError')); return }
      setDone(true)
    } catch {
      setErr(t('errors.networkError'))
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="auth-success">
        <p className="auth-success-icon">✅</p>
        <p>{t('account.profileUpdated')}</p>
        <Link href="/connexion" className="auth-link" style={{ display: 'block', marginTop: 16 }}>{t('auth.loginLink')}</Link>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="auth-form">
      {err && <div className="auth-error" role="alert"><span className="auth-error-icon">⚠</span>{err}</div>}
      <div className="auth-field">
        <label htmlFor="password" className="auth-label">{t('auth.passwordLabel')}</label>
        <div className="auth-input-wrap">
          <span className="auth-input-icon">🔒</span>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            required
            minLength={6}
            placeholder={t('auth.passwordPlaceholder')}
            className="auth-input auth-input--icon auth-input--eye"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <button
            type="button"
            className="auth-eye-btn"
            onClick={() => setShowPassword(v => !v)}
            aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
          >
            {showPassword ? '🙈' : '👁️'}
          </button>
        </div>
      </div>
      <button type="submit" disabled={loading} className={`auth-submit-btn${loading ? ' auth-submit-btn--pending' : ''}`}>
        {loading ? <><span className="auth-spinner" />{t('common.pleaseWait')}</> : t('common.save')}
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
