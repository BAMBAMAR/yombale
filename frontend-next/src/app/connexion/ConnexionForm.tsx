'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { login, type AuthState } from '@/app/actions/auth'
import { setAuthCookieAction } from '@/app/actions/auth'
import { useRouter } from 'next/navigation'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className={`auth-submit-btn${pending ? ' auth-submit-btn--pending' : ''}`}>
      {pending ? (
        <><span className="auth-spinner" />Connexion…</>
      ) : 'Se connecter'}
    </button>
  )
}

export default function ConnexionForm() {
  const [state, action] = useFormState<AuthState, FormData>(login, {})
  const [showPassword, setShowPassword] = useState(false)
  
  const [loginMethod, setLoginMethod] = useState<'email' | 'whatsapp'>('email')
  
  const [telephone, setTelephone] = useState('')
  const [code, setCode] = useState('')
  const [stepWhatsapp, setStepWhatsapp] = useState<'phone' | 'code'>('phone')
  const [loadingWa, setLoadingWa] = useState(false)
  const [errorWa, setErrorWa] = useState('')
  
  const router = useRouter()

  const handleSendWaCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (telephone.length < 9) { setErrorWa('Numéro WhatsApp invalide.'); return; }
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
      if (!res.ok) throw new Error(data.error || 'Erreur lors de l\'envoi du code')
      setStepWhatsapp('code')
    } catch (err: any) {
      setErrorWa(err.message)
    } finally {
      setLoadingWa(false)
    }
  }

  const handleVerifyWaCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length < 4) { setErrorWa('Code invalide.'); return; }
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
      if (!res.ok) throw new Error(data.error || 'Code incorrect')
      
      if (data.token) {
        await setAuthCookieAction(data.token)
        router.push('/compte')
      }
    } catch (err: any) {
      setErrorWa(err.message)
      setLoadingWa(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, background: '#f8fafc', padding: 4, borderRadius: 12, border: '1px solid #e2e8f0' }}>
        <button 
          type="button" 
          onClick={() => setLoginMethod('email')}
          style={{ flex: 1, padding: '10px', border: 'none', borderRadius: 8, background: loginMethod === 'email' ? '#fff' : 'transparent', color: loginMethod === 'email' ? '#C75B00' : '#64748b', fontWeight: loginMethod === 'email' ? 800 : 600, boxShadow: loginMethod === 'email' ? '0 2px 6px rgba(199,91,0,0.12)' : 'none', cursor: 'pointer' }}
        >
          ✉ Email
        </button>
        <button 
          type="button" 
          onClick={() => setLoginMethod('whatsapp')}
          style={{ flex: 1, padding: '10px', border: 'none', borderRadius: 8, background: loginMethod === 'whatsapp' ? '#fff' : 'transparent', color: loginMethod === 'whatsapp' ? '#C75B00' : '#64748b', fontWeight: loginMethod === 'whatsapp' ? 800 : 600, boxShadow: loginMethod === 'whatsapp' ? '0 2px 6px rgba(199,91,0,0.12)' : 'none', cursor: 'pointer' }}
        >
          💬 WhatsApp
        </button>
      </div>

      {loginMethod === 'email' ? (
        <form action={action} className="auth-form">
          {state.error && (
            <div className="auth-error" role="alert">
              <span className="auth-error-icon">⚠</span>
              {state.error}
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="email" className="auth-label">Adresse email</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">✉</span>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="vous@exemple.com"
                className="auth-input auth-input--icon"
              />
            </div>
          </div>

          <div className="auth-field">
            <div className="auth-label-row">
              <label htmlFor="password" className="auth-label">Mot de passe</label>
              <a href="/mot-de-passe-oublie" className="auth-forgot">Mot de passe oublié ?</a>
            </div>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">🔒</span>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                placeholder="Votre mot de passe"
                className="auth-input auth-input--icon auth-input--eye"
              />
              <button
                type="button"
                className="auth-eye-btn"
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
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
              <label htmlFor="telephone" className="auth-label">Numéro WhatsApp</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">📱</span>
                <input
                  id="telephone"
                  type="tel"
                  required
                  value={telephone}
                  onChange={e => setTelephone(e.target.value)}
                  placeholder="Ex: 77 123 45 67"
                  className="auth-input auth-input--icon"
                  autoFocus
                />
              </div>
            </div>
          ) : (
            <div className="auth-field">
              <label htmlFor="code" className="auth-label">Code reçu sur WhatsApp</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">💬</span>
                <input
                  id="code"
                  type="text"
                  required
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  className="auth-input auth-input--icon"
                  autoFocus
                  style={{ letterSpacing: '2px' }}
                />
              </div>
              <button type="button" onClick={() => setStepWhatsapp('phone')} style={{ background: 'none', border: 'none', color: '#64748b', marginTop: 12, cursor: 'pointer', fontSize: 14 }}>
                ← Modifier le numéro
              </button>
            </div>
          )}

          <button type="submit" disabled={loadingWa} className={`auth-submit-btn${loadingWa ? ' auth-submit-btn--pending' : ''}`} style={{ background: '#25D366' }}>
            {loadingWa ? (
              <><span className="auth-spinner" />Veuillez patienter…</>
            ) : stepWhatsapp === 'phone' ? 'Recevoir un code' : 'Vérifier et se connecter'}
          </button>
        </form>
      )}

      <div className="auth-divider"><span>ou</span></div>

      <p className="auth-switch">
        Pas encore de compte ?{' '}
        <a href="/inscription" className="auth-link">Créer un compte gratuit</a>
      </p>
    </div>
  )
}
