'use client'

import { useState } from 'react'
import { adminLogin } from '@/app/actions/admin'
import { Mail, Lock, KeyRound, Eye, EyeOff, ShieldCheck } from 'lucide-react'

export default function AdminLoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [showSecret, setShowSecret] = useState(false)

  return (
    <form action={adminLogin} className="auth-form" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* 1. Clé secrète / Master Access (Prioritaire pour l'infrastructure & les tests automatisés) */}
      <div className="auth-field">
        <label htmlFor="secret" className="auth-label">
          Clé secrète d&apos;administration (Break-glass)
        </label>
        <div className="auth-input-wrap" style={{ position: 'relative' }}>
          <span className="auth-input-icon" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }}>
            <KeyRound size={16} />
          </span>
          <input
            id="secret"
            name="secret"
            type={showSecret ? 'text' : 'password'}
            placeholder="Clé master ADMIN_SECRET"
            className="auth-input"
            style={{ paddingLeft: 38, paddingRight: 40 }}
            autoComplete="current-password"
          />
          <button
            type="button"
            className="auth-eye-btn"
            onClick={() => setShowSecret((prev) => !prev)}
            aria-label={showSecret ? 'Masquer le secret' : 'Afficher le secret'}
            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)' }}
          >
            {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', margin: '4px 0', gap: 10 }}>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
          OU COMPTE NOMINATIF
        </span>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      </div>

      {/* 2. Compte Nominatif Staff */}
      <div className="auth-field">
        <label htmlFor="email" className="auth-label">Email professionnel</label>
        <div className="auth-input-wrap" style={{ position: 'relative' }}>
          <span className="auth-input-icon" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }}>
            <Mail size={16} />
          </span>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="admin@nopalou.com"
            className="auth-input"
            style={{ paddingLeft: 38 }}
            autoComplete="email"
          />
        </div>
      </div>

      <div className="auth-field">
        <label htmlFor="mot_de_passe" className="auth-label">Mot de passe personnel</label>
        <div className="auth-input-wrap" style={{ position: 'relative' }}>
          <span className="auth-input-icon" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }}>
            <Lock size={16} />
          </span>
          <input
            id="mot_de_passe"
            name="mot_de_passe"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••••••"
            className="auth-input"
            style={{ paddingLeft: 38, paddingRight: 40 }}
            autoComplete="current-password"
          />
          <button
            type="button"
            className="auth-eye-btn"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)' }}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        className="auth-submit-btn"
        style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
      >
        <ShieldCheck size={16} />
        <span>Connexion Control Center</span>
      </button>
    </form>
  )
}
