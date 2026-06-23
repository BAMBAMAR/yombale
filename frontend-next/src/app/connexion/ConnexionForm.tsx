'use client'
import { useFormState, useFormStatus } from 'react-dom'
import { login, type AuthState } from '@/app/actions/auth'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        width: '100%',
        padding: '12px',
        background: pending ? '#94a3b8' : 'var(--blue2)',
        color: '#fff',
        border: 'none',
        borderRadius: '10px',
        fontSize: '15px',
        fontWeight: 700,
        cursor: pending ? 'not-allowed' : 'pointer',
        transition: 'background 0.2s',
      }}
    >
      {pending ? 'Connexion…' : 'Se connecter'}
    </button>
  )
}

export default function ConnexionForm() {
  const [state, action] = useFormState<AuthState, FormData>(login, {})

  return (
    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {state.error && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '10px 14px',
          color: 'var(--red)',
          fontSize: '14px',
        }}>
          {state.error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label htmlFor="email" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text2)' }}>
          Adresse email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="vous@exemple.com"
          style={{
            padding: '10px 14px',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none',
            background: '#fff',
          }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label htmlFor="password" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text2)' }}>
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          style={{
            padding: '10px 14px',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none',
            background: '#fff',
          }}
        />
      </div>

      <SubmitButton />

      <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text3)' }}>
        Pas encore de compte ?{' '}
        <a href="/inscription" style={{ color: 'var(--blue2)', fontWeight: 600 }}>
          S&apos;inscrire
        </a>
      </p>
    </form>
  )
}
