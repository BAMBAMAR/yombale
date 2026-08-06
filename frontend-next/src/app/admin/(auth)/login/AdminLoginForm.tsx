'use client'

import { useState } from 'react'
import { adminLogin } from '@/app/actions/admin'

export default function AdminLoginForm() {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <form action={adminLogin} className="auth-form">
      <div className="auth-field">
        <label htmlFor="secret" className="auth-label">Secret administrateur</label>
        <div className="auth-input-wrap">
          <span className="auth-input-icon">🔑</span>
          <input
            id="secret"
            name="secret"
            type={showPassword ? 'text' : 'password'}
            required
            placeholder="••••••••••••••••"
            className="auth-input auth-input--icon auth-input--eye"
            autoComplete="current-password"
          />
          <button
            type="button"
            className="auth-eye-btn"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Masquer le secret" : "Afficher le secret"}
          >
            {showPassword ? '🙈' : '👁️'}
          </button>
        </div>
      </div>

      <button type="submit" className="auth-submit-btn">
        Accéder au panneau admin
      </button>
    </form>
  )
}
