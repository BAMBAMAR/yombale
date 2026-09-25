'use client'

import React, { useState, useEffect, useRef } from 'react'
import { ShieldCheck, MessageCircle, ArrowRight, RotateCcw, AlertCircle, Loader2 } from 'lucide-react'

interface Props {
  telephoneMasque: string
  devCode?: string
  loading: boolean
  error: string | null
  onValiderOtp: (code: string) => void
  onRenvoyerOtp: () => void
  onChangePhone: () => void
}

export default function PortailOtpCard({
  telephoneMasque,
  devCode,
  loading,
  error,
  onValiderOtp,
  onRenvoyerOtp,
  onChangePhone,
}: Props) {
  const [code, setCode] = useState('')
  const [countdown, setCountdown] = useState(60)
  const isSubmittingRef = useRef(false)

  // Réinitialiser le verrou de soumission si une erreur survient
  useEffect(() => {
    if (error) {
      isSubmittingRef.current = false
    }
  }, [error])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  function doSubmit(val: string) {
    const clean = val.trim().replace(/\D/g, '')
    if (clean.length !== 6) return
    if (loading || isSubmittingRef.current) return
    isSubmittingRef.current = true
    onValiderOtp(clean)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    doSubmit(code)
  }

  function handleResend() {
    if (countdown === 0 && !loading && !isSubmittingRef.current) {
      setCountdown(60)
      setCode('')
      isSubmittingRef.current = false
      onRenvoyerOtp()
    }
  }

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: 18,
        padding: '24px 22px',
        border: '1.5px solid var(--border, #E8DDD2)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        marginBottom: 24,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: '#DCFCE7',
            color: '#166534',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <MessageCircle size={22} style={{ color: '#16a34a' }} />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
            Code de Sécurité WhatsApp
          </h3>
          <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>
            Un code à 6 chiffres a été envoyé au <strong>{telephoneMasque}</strong>
          </p>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            color: '#991B1B',
            fontSize: 12.5,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 14,
          }}
        >
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {devCode && (
        <div
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            background: '#EFF6FF',
            border: '1px solid #BFDBFE',
            color: '#1D4ED8',
            fontSize: 11.5,
            fontWeight: 700,
            marginBottom: 12,
          }}
        >
          Mode développement — Code test : <strong>{devCode}</strong>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label
            htmlFor="otp-code-input"
            style={{
              display: 'block',
              fontSize: 12,
              fontWeight: 800,
              color: 'var(--navy, #1C2B4A)',
              marginBottom: 6,
            }}
          >
            Saisissez le code à 6 chiffres :
          </label>
          <input
            id="otp-code-input"
            type="text"
            inputMode="numeric"
            maxLength={6}
            autoFocus
            disabled={loading}
            value={code}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 6)
              setCode(val)
              if (val.length === 6) {
                doSubmit(val)
              }
            }}
            placeholder="• • • • • •"
            style={{
              width: '100%',
              maxWidth: 260,
              padding: '12px 16px',
              borderRadius: 12,
              border: '2px solid var(--navy, #1C2B4A)',
              fontSize: 22,
              fontWeight: 900,
              letterSpacing: '0.3em',
              textAlign: 'center',
              outline: 'none',
              boxSizing: 'border-box',
              background: '#FAF8F5',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="submit"
            disabled={loading || code.length !== 6 || isSubmittingRef.current}
            style={{
              background: code.length === 6 && !loading ? 'var(--navy, #1C2B4A)' : '#CBD5E1',
              color: '#ffffff',
              border: 'none',
              borderRadius: 10,
              padding: '12px 22px',
              fontSize: 13.5,
              fontWeight: 800,
              cursor: code.length === 6 && !loading ? 'pointer' : 'not-allowed',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: code.length === 6 ? '0 4px 12px rgba(28, 43, 74, 0.25)' : 'none',
            }}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Vérification...</span>
              </>
            ) : (
              <>
                <ShieldCheck size={16} style={{ color: 'var(--accent, #C75B00)' }} />
                <span>Déverrouiller mon Bail</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleResend}
            disabled={countdown > 0 || loading}
            style={{
              background: 'none',
              border: '1px solid var(--border, #E8DDD2)',
              borderRadius: 10,
              padding: '11px 16px',
              fontSize: 12.5,
              fontWeight: 700,
              color: countdown > 0 ? '#94A3B8' : 'var(--navy, #1C2B4A)',
              cursor: countdown > 0 ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <RotateCcw size={13} />
            <span>{countdown > 0 ? `Renvoyer (${countdown}s)` : 'Renvoyer le code'}</span>
          </button>

          <button
            type="button"
            onClick={onChangePhone}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748B',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: '4px 8px',
            }}
          >
            Changer de numéro
          </button>
        </div>
      </form>
    </div>
  )
}
