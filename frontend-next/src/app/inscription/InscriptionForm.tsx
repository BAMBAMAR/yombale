'use client'

import { useState, useRef } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { signup, type AuthState } from '@/app/actions/auth'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className={`auth-submit-btn${pending ? ' auth-submit-btn--pending' : ''}`}>
      {pending ? (
        <><span className="auth-spinner" />Création du compte…</>
      ) : 'Créer mon compte gratuitement'}
    </button>
  )
}

function getPasswordStrength(pwd: string): { score: number; label: string; color: string } {
  if (!pwd) return { score: 0, label: '', color: '' }
  let score = 0
  if (pwd.length >= 8)  score++
  if (pwd.length >= 12) score++
  if (/[0-9]/.test(pwd)) score++
  if (/[A-Z]/.test(pwd)) score++
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

  const displayError = clientError || state.error

  return (
    <form ref={formRef} action={action} onSubmit={handleSubmit} className="auth-form">
      {displayError && (
        <div className="auth-error" role="alert">
          <span className="auth-error-icon">⚠</span>
          {displayError}
        </div>
      )}

      {/* Nom */}
      <div className="auth-field">
        <label htmlFor="nom" className="auth-label">Nom complet</label>
        <div className="auth-input-wrap">
          <span className="auth-input-icon">👤</span>
          <input
            id="nom"
            name="nom"
            type="text"
            autoComplete="name"
            required
            placeholder="Mamadou Diallo"
            className="auth-input auth-input--icon"
          />
        </div>
      </div>

      {/* Email */}
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

      {/* Mot de passe */}
      <div className="auth-field">
        <label htmlFor="password" className="auth-label">Mot de passe</label>
        <div className="auth-input-wrap">
          <span className="auth-input-icon">🔒</span>
          <input
            id="password"
            name="password"
            type={showPwd ? 'text' : 'password'}
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="8 caractères minimum"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="auth-input auth-input--icon auth-input--eye"
          />
          <button type="button" className="auth-eye-btn" onClick={() => setShowPwd(v => !v)}
            aria-label={showPwd ? 'Masquer' : 'Afficher'}>
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
          Confirmer le mot de passe
          {confirmOk  && <span className="auth-confirm-ok"> ✓ Identiques</span>}
          {confirmErr && <span className="auth-confirm-err"> ✗ Différents</span>}
        </label>
        <div className="auth-input-wrap">
          <span className="auth-input-icon">🔒</span>
          <input
            id="confirm"
            name="confirm"
            type={showConfirm ? 'text' : 'password'}
            autoComplete="new-password"
            required
            placeholder="Répétez votre mot de passe"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            className={`auth-input auth-input--icon auth-input--eye${confirmErr ? ' auth-input--error' : confirmOk ? ' auth-input--ok' : ''}`}
          />
          <button type="button" className="auth-eye-btn" onClick={() => setShowConfirm(v => !v)}
            aria-label={showConfirm ? 'Masquer' : 'Afficher'}>
            {showConfirm ? '🙈' : '👁'}
          </button>
        </div>
      </div>

      {/* CGU */}
      <p className="auth-cgu">
        En créant un compte, vous acceptez nos{' '}
        <a href="/cgu" className="auth-link">CGU</a>
        {' '}et notre{' '}
        <a href="/confidentialite" className="auth-link">politique de confidentialité</a>.
      </p>

      <SubmitButton />

      <p className="auth-switch">
        Déjà un compte ?{' '}
        <a href="/connexion" className="auth-link">Se connecter</a>
      </p>
    </form>
  )
}
