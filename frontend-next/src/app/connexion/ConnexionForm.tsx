'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { login, type AuthState } from '@/app/actions/auth'
import { setAuthCookieAction } from '@/app/actions/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from '@/i18n/context'

function SubmitButton() {
  const { pending } = useFormStatus()
  const { t } = useTranslation()

  return (
    <button type="submit" disabled={pending} className={`auth-submit-btn${pending ? ' auth-submit-btn--pending' : ''}`}>
      {pending ? (
        <><span className="auth-spinner" />{t('auth.loggingIn')}</>
      ) : t('auth.loginBtn')}
    </button>
  )
}

export default function ConnexionForm() {
  const [state, action] = useFormState<AuthState, FormData>(login, {})
  const [showPassword, setShowPassword] = useState(false)
  const { t } = useTranslation()
  
  const [loginMethod, setLoginMethod] = useState<'whatsapp' | 'email'>('whatsapp')
  
  const [telephone, setTelephone] = useState('')
  const [code, setCode] = useState('')
  const [stepWhatsapp, setStepWhatsapp] = useState<'phone' | 'code'>('phone')
  const [loadingWa, setLoadingWa] = useState(false)
  const [errorWa, setErrorWa] = useState('')
  
  const router = useRouter()

  const handleSendWaCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (telephone.length < 9) { setErrorWa(t('auth.waInvalidPhone')); return; }
    setErrorWa('')
    setLoadingWa(true)
    try {
      const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'
      const res = await fetch(`${BACKEND}/api/auth/whatsapp-otp-send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telephone })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || t('errors.serverError'))
      setStepWhatsapp('code')
    } catch (err: any) {
      setErrorWa(err.message)
    } finally {
      setLoadingWa(false)
    }
  }

  const handleVerifyWaCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length < 4) { setErrorWa(t('auth.waInvalidCode')); return; }
    setErrorWa('')
    setLoadingWa(true)
    try {
      const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'
      const res = await fetch(`${BACKEND}/api/auth/whatsapp-otp-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telephone, code })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || t('auth.waCodeIncorrect'))
      
      if (data.token) {
        await setAuthCookieAction(data.token)
        router.push('/compte')
      }
    } catch (err: any) {
      setErrorWa(err.message)
      setLoadingWa(false)
    }
  }

  const getLocalizedError = (err?: string) => {
    if (!err) return null
    if (err === 'Identifiants incorrects' || err === 'Identifiants invalides') return t('errors.unauthorized')
    if (err.includes('ECONNRESET') || err.includes('Erreur de connexion') || err.includes('Erreur serveur') || err.includes('timeout')) {
      return t('errors.serverError')
    }
    return err
  }

  return (
    <div>
      {/* ── Sélecteur de méthode WhatsApp / Email ultra visible & engageant ── */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>⚡</span>
            <span>{t('auth.chooseMethodLabel') || 'Mode de connexion :'}</span>
          </label>
          <span style={{
            fontSize: 11,
            fontWeight: 800,
            padding: '2px 8px',
            borderRadius: 12,
            background: loginMethod === 'whatsapp' ? '#dcfce7' : '#f1f5f9',
            color: loginMethod === 'whatsapp' ? '#15803d' : '#64748b',
            border: loginMethod === 'whatsapp' ? '1px solid #bbf7d0' : '1px solid #e2e8f0'
          }}>
            {loginMethod === 'whatsapp' ? `✓ ${t('auth.waBadgeRecommended') || 'Recommandé au Sénégal'}` : 'Classique'}
          </span>
        </div>

        <div
          role="tablist"
          aria-label="Méthode d'authentification"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
            background: '#f8fafc',
            padding: 6,
            borderRadius: 14,
            border: '2px solid #e2e8f0'
          }}
        >
          {/* Onglet 1 : WhatsApp (Par défaut) */}
          <button
            type="button"
            role="tab"
            aria-selected={loginMethod === 'whatsapp'}
            onClick={() => setLoginMethod('whatsapp')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              padding: '12px 8px',
              borderRadius: 10,
              border: loginMethod === 'whatsapp' ? '2px solid #22c55e' : '2px solid #e2e8f0',
              background: loginMethod === 'whatsapp' ? '#ffffff' : '#f1f5f9',
              color: loginMethod === 'whatsapp' ? '#15803d' : '#64748b',
              boxShadow: loginMethod === 'whatsapp' ? '0 4px 14px rgba(34, 197, 94, 0.22)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 900, fontSize: 14.5 }}>
              <span style={{ fontSize: 18 }}>💬</span>
              <span>WhatsApp</span>
            </div>
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              color: loginMethod === 'whatsapp' ? '#166534' : '#94a3b8'
            }}>
              ⚡ {t('auth.waFastMethodDesc') || '1 clic sans mot de passe'}
            </span>
          </button>

          {/* Onglet 2 : Email */}
          <button
            type="button"
            role="tab"
            aria-selected={loginMethod === 'email'}
            onClick={() => setLoginMethod('email')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              padding: '12px 8px',
              borderRadius: 10,
              border: loginMethod === 'email' ? '2px solid #C75B00' : '2px solid #e2e8f0',
              background: loginMethod === 'email' ? '#ffffff' : '#f1f5f9',
              color: loginMethod === 'email' ? '#C75B00' : '#64748b',
              boxShadow: loginMethod === 'email' ? '0 4px 14px rgba(199, 91, 0, 0.18)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 900, fontSize: 14.5 }}>
              <span style={{ fontSize: 16 }}>✉️</span>
              <span>Email</span>
            </div>
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              color: loginMethod === 'email' ? '#9a3412' : '#94a3b8'
            }}>
              {t('auth.emailClassicDesc') || 'Avec mot de passe'}
            </span>
          </button>
        </div>
      </div>

      {loginMethod === 'email' ? (
        <form action={action} className="auth-form">
          {state.error && (
            <div className="auth-error" role="alert">
              <span className="auth-error-icon">⚠</span>
              {getLocalizedError(state.error)}
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="email" className="auth-label">{t('auth.emailLabel')}</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">✉</span>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder={t('auth.emailPlaceholder')}
                className="auth-input auth-input--icon"
              />
            </div>
          </div>

          <div className="auth-field">
            <div className="auth-label-row">
              <label htmlFor="password" className="auth-label">{t('auth.passwordLabel')}</label>
              <Link href="/mot-de-passe-oublie" className="auth-forgot">{t('auth.forgotPassword')}</Link>
            </div>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">🔒</span>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                placeholder={t('auth.passwordPlaceholder')}
                className="auth-input auth-input--icon auth-input--eye"
              />
              <button
                type="button"
                className="auth-eye-btn"
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          <SubmitButton />
        </form>
      ) : (
        <form onSubmit={stepWhatsapp === 'phone' ? handleSendWaCode : handleVerifyWaCode} className="auth-form">
          {errorWa && (
            <div className="auth-error" role="alert">
              <span className="auth-error-icon">⚠</span>
              {errorWa}
            </div>
          )}

          {stepWhatsapp === 'phone' ? (
            <div className="auth-field">
              <label htmlFor="telephone" className="auth-label">{t('auth.waPhoneLabel')}</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">📱</span>
                <input
                  id="telephone"
                  type="tel"
                  required
                  value={telephone}
                  onChange={e => setTelephone(e.target.value)}
                  placeholder={t('auth.waPhonePlaceholder')}
                  className="auth-input auth-input--icon"
                  autoFocus
                />
              </div>
            </div>
          ) : (
            <div className="auth-field">
              <label htmlFor="code" className="auth-label">{t('auth.waCodeLabel')}</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">💬</span>
                <input
                  id="code"
                  type="text"
                  required
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  placeholder={t('auth.waCodePlaceholder')}
                  maxLength={6}
                  className="auth-input auth-input--icon"
                  autoFocus
                  style={{ letterSpacing: '2px' }}
                />
              </div>
              <button type="button" onClick={() => setStepWhatsapp('phone')} style={{ background: 'none', border: 'none', color: '#64748b', marginTop: 12, cursor: 'pointer', fontSize: 14 }}>
                {t('auth.waChangeNumber')}
              </button>
            </div>
          )}

          <button type="submit" disabled={loadingWa} className={`auth-submit-btn${loadingWa ? ' auth-submit-btn--pending' : ''}`} style={{ background: '#25D366' }}>
            {loadingWa ? (
              <><span className="auth-spinner" />{t('common.pleaseWait')}</>
            ) : stepWhatsapp === 'phone' ? t('auth.waSendCode') : t('auth.waVerifyLogin')}
          </button>
        </form>
      )}

      <div className="auth-divider"><span>{t('auth.orDivider')}</span></div>

      <p className="auth-switch">
        {t('auth.noAccountPrompt')}{' '}
        <Link href="/inscription" className="auth-link">{t('auth.createAccountLink')}</Link>
      </p>
    </div>
  )
}
