'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { login, type AuthState } from '@/app/actions/auth'

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

  return (
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

      <div className="auth-divider"><span>ou</span></div>

      <p className="auth-switch">
        Pas encore de compte ?{' '}
        <a href="/inscription" className="auth-link">Créer un compte gratuit</a>
      </p>
    </form>
  )
}
