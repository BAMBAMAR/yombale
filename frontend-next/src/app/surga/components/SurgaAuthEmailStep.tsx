'use client'

import React from 'react'
import {
  Mail,
  Lock,
  ArrowRight,
  RefreshCw,
} from 'lucide-react'

interface SurgaAuthEmailStepProps {
  email: string
  setEmail: (e: string) => void
  password: string
  setPassword: (p: string) => void
  loading: boolean
  onSubmit: (e: React.FormEvent) => void
}

export default function SurgaAuthEmailStep({
  email,
  setEmail,
  password,
  setPassword,
  loading,
  onSubmit,
}: SurgaAuthEmailStepProps) {
  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--surga-primary, #0F172A)', marginBottom: 6 }}>
          Adresse Email
        </label>
        <div style={{ position: 'relative' }}>
          <Mail size={16} color="var(--surga-text3, #94A3B8)" style={{ position: 'absolute', left: 12, top: 13 }} />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="votre@email.com"
            required
            autoComplete="email"
            style={{
              width: '100%',
              padding: '11px 14px 11px 38px',
              borderRadius: 10,
              border: '1px solid var(--surga-border, #E2E8F0)',
              fontSize: 14,
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--surga-primary, #0F172A)', marginBottom: 6 }}>
          Mot de passe
        </label>
        <div style={{ position: 'relative' }}>
          <Lock size={16} color="var(--surga-text3, #94A3B8)" style={{ position: 'absolute', left: 12, top: 13 }} />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
            style={{
              width: '100%',
              padding: '11px 14px 11px 38px',
              borderRadius: 10,
              border: '1px solid var(--surga-border, #E2E8F0)',
              fontSize: 14,
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="surga-btn-primary"
        style={{
          minHeight: 46,
          fontSize: 14,
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? (
          <>
            <RefreshCw size={16} className="animate-spin" />
            <span>Connexion...</span>
          </>
        ) : (
          <>
            <ArrowRight size={16} />
            <span>Se connecter</span>
          </>
        )}
      </button>
    </form>
  )
}
