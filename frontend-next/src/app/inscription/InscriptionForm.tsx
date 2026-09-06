'use client'

import { useState, useRef, useEffect } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { signup, type AuthState, setAuthCookieAction } from '@/app/actions/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from '@/i18n/context'

function SubmitButton() {
  const { pending } = useFormStatus()
  const { t } = useTranslation()

  return (
    <button type="submit" disabled={pending} className={`auth-submit-btn${pending ? ' auth-submit-btn--pending' : ''}`}>
      {pending ? (
        <><span className="auth-spinner" />{t('auth.registering')}</>
      ) : t('auth.registerBtn')}
    </button>
  )
}

function getPasswordStrength(pwd: string): { score: number; label: string; color: string } {
  if (!pwd) return { score: 0, label: '', color: '' }
  let score = 0
  if (pwd.length >= 8)  score++
  if (/[A-Z]/.test(pwd)) score++
  if (/[0-9]/.test(pwd)) score++
  if (/[^A-Za-z0-9]/.test(pwd)) score++
  if (score <= 1) return { score: 1, label: 'Trop faible', color: '#EF4444' }
  if (score === 2) return { score: 2, label: 'Faible',     color: '#F97316' }
  if (score === 3) return { score: 3, label: 'Moyen',      color: '#EAB308' }
  if (score === 4) return { score: 4, label: 'Fort',       color: '#22C55E' }
  return { score: 5, label: 'Très fort', color: '#0A5C36' }
}

export default function InscriptionForm() {
  const [state, action] = useFormState<AuthState, FormData>(signup, {})
  const [showPwd, setShowPwd]         = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [password, setPassword]       = useState('')
  const [confirm, setConfirm]         = useState('')
  const [clientError, setClientError] = useState('')
  const formRef = useRef<HTMLFormElement>(null)
  const { t } = useTranslation()

  const [signupMethod, setSignupMethod] = useState<'whatsapp' | 'email'>('whatsapp')
  
  const [nom, setNom] = useState('')
  const [telephone, setTelephone] = useState('')
  const [code, setCode] = useState('')
  const [stepWhatsapp, setStepWhatsapp] = useState<'form' | 'code'>('form')
  const [loadingWa, setLoadingWa] = useState(false)
  const [errorWa, setErrorWa] = useState('')
  const [isDegraded, setIsDegraded] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  const router = useRouter()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const tel = params.get('tel')
      if (tel) {
        setTelephone(tel)
      }
    }
  }, [])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const interval = setInterval(() => {
      setResendCooldown(prev => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [resendCooldown])

  const strength = getPasswordStrength(password)
  const confirmOk = confirm.length > 0 && confirm === password
  const confirmErr = confirm.length > 0 && confirm !== password

  function handleSubmit(e: React.FormEvent) {
    if (confirm && confirm !== password) {
      e.preventDefault()
      setClientError('Les mots de passe ne correspondent pas.')
    } else {
      setClientError('')
    }
  }

  const handleSendWaCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nom.trim()) { setErrorWa(t('errors.fieldRequired')); return; }
    if (telephone.length < 9) { setErrorWa(t('auth.waInvalidPhone')); return; }
    setErrorWa('')
    setIsDegraded(false)
    setLoadingWa(true)
    try {
      const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'
      const res = await fetch(`${BACKEND}/api/auth/whatsapp-otp-send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telephone, type: 'register' })
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 503 || data.degraded) {
          setIsDegraded(true)
          setErrorWa(data.error || 'Le service WhatsApp est momentanément indisponible.')
          return
        }
        throw new Error(data.error || t('errors.serverError'))
      }
      setStepWhatsapp('code')
      setResendCooldown(45)
    } catch (err: any) {
      setErrorWa(err.message)
    } finally {
      setLoadingWa(false)
    }
  }

  const handleResendCode = async () => {
    if (resendCooldown > 0 || loadingWa) return
    setErrorWa('')
    setLoadingWa(true)
    try {
      const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'
      const res = await fetch(`${BACKEND}/api/auth/whatsapp-otp-send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telephone, type: 'register' })
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 503 || data.degraded) {
          setIsDegraded(true)
          setErrorWa(data.error || 'Le service WhatsApp est momentanément indisponible.')
          return
        }
        throw new Error(data.error || t('errors.serverError'))
      }
      setResendCooldown(45)
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
      const res = await fetch(`${BACKEND}/api/auth/whatsapp-otp-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telephone, code, nom })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || t('errors.serverError'))
      
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
    if (err.includes('déjà utilisé') || err.includes('existe déjà')) return t('errors.invalidEmail')
    if (err.includes('ECONNRESET') || err.includes('Erreur de connexion') || err.includes('Erreur serveur') || err.includes('timeout')) {
      return t('errors.serverError')
    }
    return err
  }

  const rawError = clientError || state.error
  const displayError = getLocalizedError(rawError)

  return (
    <div>
      {/* ── Sélecteur de méthode d'inscription WhatsApp / Email ultra visible & engageant ── */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>⚡</span>
            <span>{t('auth.chooseMethodLabel') || 'Mode d\'inscription :'}</span>
          </label>
          <span style={{
            fontSize: 11,
            fontWeight: 800,
            padding: '2px 8px',
            borderRadius: 12,
            background: signupMethod === 'whatsapp' ? '#dcfce7' : '#f1f5f9',
            color: signupMethod === 'whatsapp' ? '#15803d' : '#64748b',
            border: signupMethod === 'whatsapp' ? '1px solid #bbf7d0' : '1px solid #e2e8f0'
          }}>
            {signupMethod === 'whatsapp' ? `✓ ${t('auth.waBadgeRecommended') || 'Recommandé au Sénégal'}` : 'Classique'}
          </span>
        </div>

        <div
          role="tablist"
          aria-label="Méthode d'inscription"
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
            aria-selected={signupMethod === 'whatsapp'}
            onClick={() => setSignupMethod('whatsapp')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              padding: '12px 8px',
              borderRadius: 10,
              border: signupMethod === 'whatsapp' ? '2px solid #22c55e' : '2px solid #e2e8f0',
              background: signupMethod === 'whatsapp' ? '#ffffff' : '#f1f5f9',
              color: signupMethod === 'whatsapp' ? '#15803d' : '#64748b',
              boxShadow: signupMethod === 'whatsapp' ? '0 4px 14px rgba(34, 197, 94, 0.22)' : 'none',
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
              color: signupMethod === 'whatsapp' ? '#166534' : '#94a3b8'
            }}>
              ⚡ {t('auth.waFastMethodDesc') || '1 clic sans mot de passe'}
            </span>
          </button>

          {/* Onglet 2 : Email */}
          <button
            type="button"
            role="tab"
            aria-selected={signupMethod === 'email'}
            onClick={() => setSignupMethod('email')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              padding: '12px 8px',
              borderRadius: 10,
              border: signupMethod === 'email' ? '2px solid #C75B00' : '2px solid #e2e8f0',
              background: signupMethod === 'email' ? '#ffffff' : '#f1f5f9',
              color: signupMethod === 'email' ? '#C75B00' : '#64748b',
              boxShadow: signupMethod === 'email' ? '0 4px 14px rgba(199, 91, 0, 0.18)' : 'none',
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
              color: signupMethod === 'email' ? '#9a3412' : '#94a3b8'
            }}>
              {t('auth.emailClassicDesc') || 'Avec mot de passe'}
            </span>
          </button>
        </div>
      </div>

      {signupMethod === 'email' ? (
        <form ref={formRef} action={action} onSubmit={handleSubmit} className="auth-form">
          {displayError && (
            <div className="auth-error" role="alert">
              <span className="auth-error-icon">⚠</span>
              {displayError}
            </div>
          )}

          {/* Nom */}
          <div className="auth-field">
            <label htmlFor="nom" className="auth-label">{t('auth.nomLabel')}</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">👤</span>
              <input
                id="nom"
                name="nom"
                type="text"
                autoComplete="name"
                required
                placeholder={t('auth.nomPlaceholder')}
                className="auth-input auth-input--icon"
              />
            </div>
          </div>

          {/* Email */}
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

          {/* Mot de passe */}
          <div className="auth-field">
            <label htmlFor="password" className="auth-label">{t('auth.passwordLabel')}</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">🔒</span>
              <input
                id="password"
                name="password"
                type={showPwd ? 'text' : 'password'}
                autoComplete="new-password"
                required
                minLength={8}
                placeholder={t('auth.passwordMinimum')}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="auth-input auth-input--icon auth-input--eye"
              />
              <button type="button" className="auth-eye-btn" onClick={() => setShowPwd(v => !v)}
                aria-label={showPwd ? t('auth.hidePassword') : t('auth.showPassword')}>
                {showPwd ? '🙈' : '👁'}
              </button>
            </div>

            {/* Indicateur de force */}
            {password.length > 0 && (
              <div className="auth-strength">
                <div className="auth-strength-bars">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div
                      key={i}
                      className="auth-strength-bar"
                      style={{ background: i <= strength.score ? strength.color : '#E8DDD2' }}
                    />
                  ))}
                </div>
                <span className="auth-strength-label" style={{ color: strength.color }}>
                  {strength.label}
                </span>
              </div>
            )}
          </div>

          {/* Confirmation mot de passe */}
          <div className="auth-field">
            <label htmlFor="confirm" className="auth-label">
              {t('auth.confirmPassword')}
              {confirmOk  && <span className="auth-confirm-ok"> ✓ {t('auth.passwordsMatch')}</span>}
              {confirmErr && <span className="auth-confirm-err"> ✗ {t('auth.passwordsDifferent')}</span>}
            </label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">🔒</span>
              <input
                id="confirm"
                name="confirm"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                required
                placeholder={t('auth.repeatPassword')}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className={`auth-input auth-input--icon auth-input--eye${confirmErr ? ' auth-input--error' : confirmOk ? ' auth-input--ok' : ''}`}
              />
              <button type="button" className="auth-eye-btn" onClick={() => setShowConfirm(v => !v)}
                aria-label={showConfirm ? t('auth.hidePassword') : t('auth.showPassword')}>
                {showConfirm ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {/* CGU */}
          <p className="auth-cgu">
            {t('auth.termsIntro')}{' '}
            <Link href="/cgu" className="auth-link">CGU</Link>
            {' '}{t('auth.termsAnd')}{' '}
            <Link href="/confidentialite" className="auth-link">{t('auth.privacyPolicy')}</Link>.
          </p>

          <SubmitButton />
        </form>
      ) : (
        <form onSubmit={stepWhatsapp === 'form' ? handleSendWaCode : handleVerifyWaCode} className="auth-form">
          {isDegraded && (
            <div style={{
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: 12,
              padding: '14px 16px',
              marginBottom: 18,
              color: '#92400e',
              fontSize: 13.5,
              lineHeight: 1.5,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, marginBottom: 6 }}>
                <span>⚠️</span>
                <span>Service WhatsApp momentanément indisponible</span>
              </div>
              <p style={{ margin: '0 0 10px 0' }}>
                {errorWa || 'Les vérifications WhatsApp sont momentanément indisponibles. Vous pouvez vous inscrire facilement avec votre adresse Email.'}
              </p>
              <button
                type="button"
                onClick={() => setSignupMethod('email')}
                style={{
                  background: '#d97706',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '9px 15px',
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <span>✉️</span>
                <span>S'inscrire par Email & Mot de passe</span>
              </button>
            </div>
          )}

          {!isDegraded && errorWa && (
            <div className="auth-error" role="alert">
              <span className="auth-error-icon">⚠</span>
              {errorWa}
            </div>
          )}

          {stepWhatsapp === 'form' ? (
            <>
              <div className="auth-field">
                <label htmlFor="nom_wa" className="auth-label">{t('auth.nomLabel')}</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon">👤</span>
                  <input
                    id="nom_wa"
                    type="text"
                    required
                    value={nom}
                    onChange={e => setNom(e.target.value)}
                    placeholder={t('auth.nomPlaceholder')}
                    className="auth-input auth-input--icon"
                  />
                </div>
              </div>
              
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
                  />
                </div>
              </div>
            </>
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
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => { setStepWhatsapp('form'); setErrorWa(''); setIsDegraded(false); }}
                  style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 13, padding: 0 }}
                >
                  ← {t('auth.waChangeNumber') || 'Changer de numéro'}
                </button>
                <button
                  type="button"
                  disabled={resendCooldown > 0 || loadingWa}
                  onClick={handleResendCode}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: resendCooldown > 0 ? '#94a3b8' : '#15803d',
                    cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                    fontSize: 13,
                    fontWeight: 700,
                    padding: 0
                  }}
                >
                  {resendCooldown > 0 ? `Renvoyer (${resendCooldown}s)` : '↻ Renvoyer le code'}
                </button>
              </div>
            </div>
          )}

          <p className="auth-cgu">
            En créant un compte, vous acceptez nos{' '}
            <Link href="/cgu" className="auth-link">CGU</Link>
            {' '}et notre{' '}
            <Link href="/confidentialite" className="auth-link">politique de confidentialité</Link>.
          </p>

          <button type="submit" disabled={loadingWa} className={`auth-submit-btn${loadingWa ? ' auth-submit-btn--pending' : ''}`} style={{ background: '#25D366' }}>
            {loadingWa ? (
              <><span className="auth-spinner" />{t('common.pleaseWait')}</>
            ) : stepWhatsapp === 'form' ? t('auth.waSendCode') : t('auth.registerBtn')}
          </button>

          {stepWhatsapp === 'code' && (
            <div style={{
              marginTop: 16,
              padding: '10px 14px',
              background: '#f8fafc',
              border: '1px dashed #cbd5e1',
              borderRadius: 10,
              fontSize: 12.5,
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8
            }}>
              <span>Code non reçu sur WhatsApp ?</span>
              <button
                type="button"
                onClick={() => setSignupMethod('email')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#C75B00',
                  fontWeight: 800,
                  fontSize: 12.5,
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                S'inscrire par Email →
              </button>
            </div>
          )}
        </form>
      )}

      <p className="auth-switch">
        {t('auth.alreadyAccountPrompt')}{' '}
        <Link href="/connexion" className="auth-link">{t('auth.loginLink')}</Link>
      </p>
    </div>
  )
}
