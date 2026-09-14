'use client'

import React, { useState, useEffect, useRef } from 'react'
import { ShieldCheck, AlertCircle, CheckCircle2, MessageCircle, X } from 'lucide-react'

interface Props {
  isOpen: boolean
  action: string
  actionLabel?: string
  telephoneMasque?: string
  onClose: () => void
  onSuccess: () => void
}

export default function ModalConfirmationOtp({
  isOpen,
  action,
  actionLabel = 'confirmer cette opération',
  telephoneMasque = '****',
  onClose,
  onSuccess,
}: Props) {
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(600) // 10 minutes
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (!isOpen) {
      setCode(['', '', '', '', '', ''])
      setErrorMsg(null)
      return
    }
    inputsRef.current[0]?.focus()
    const timer = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [isOpen])

  if (!isOpen) return null

  const minutes = Math.floor(countdown / 60)
  const seconds = countdown % 60
  const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

  function handleChange(idx: number, val: string) {
    const char = val.slice(-1)
    if (char && !/^\d$/.test(char)) return
    const newCode = [...code]
    newCode[idx] = char
    setCode(newCode)
    if (char && idx < 5) {
      inputsRef.current[idx + 1]?.focus()
    }
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !code[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus()
    }
  }

  async function handleValider(e: React.FormEvent) {
    e.preventDefault()
    const fullCode = code.join('')
    if (fullCode.length !== 6) {
      setErrorMsg('Veuillez saisir les 6 chiffres du code.')
      return
    }
    setErrorMsg(null)
    setLoading(true)

    try {
      const res = await fetch('/api/auth/2fa/valider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, code: fullCode }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Code invalide ou expiré.')
        return
      }
      onSuccess()
      onClose()
    } catch {
      setErrorMsg('Erreur réseau. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 20,
          padding: '28px 24px',
          maxWidth: 440,
          width: '100%',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25)',
          position: 'relative',
          textAlign: 'center',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#64748B',
          }}
        >
          <X size={20} />
        </button>

        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: 'var(--orange2, #FFF3E8)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent, #C75B00)',
            marginBottom: 12,
          }}
        >
          <ShieldCheck size={28} />
        </div>

        <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
          Vérification de Sécurité (2FA)
        </h3>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text2, #5A4E42)', lineHeight: 1.4 }}>
          Pour {actionLabel}, saisissez le code à 6 chiffres envoyé sur votre WhatsApp (terminant par <strong>{telephoneMasque}</strong>).
        </p>

        {errorMsg && (
          <div
            style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              color: '#DC2626',
              padding: '10px 12px',
              borderRadius: 10,
              fontSize: 12.5,
              marginBottom: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              textAlign: 'left',
            }}
          >
            <AlertCircle size={15} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleValider}>
          {/* 6 Boîtes OTP */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
            {code.map((digit, i) => (
              <input
                key={i}
                ref={el => { inputsRef.current[i] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                style={{
                  width: 44,
                  height: 52,
                  textAlign: 'center',
                  fontSize: 22,
                  fontWeight: 900,
                  borderRadius: 10,
                  border: digit ? '2px solid var(--accent, #C75B00)' : '1px solid var(--border, #E8DDD2)',
                  background: digit ? 'var(--orange2, #FFF3E8)' : '#FFFFFF',
                  color: 'var(--navy, #1C2B4A)',
                  outline: 'none',
                }}
              />
            ))}
          </div>

          <div style={{ fontSize: 12, color: '#64748B', marginBottom: 16 }}>
            Temps restant : <strong style={{ color: countdown < 60 ? '#DC2626' : 'inherit' }}>{timeStr}</strong>
          </div>

          <button
            type="submit"
            disabled={loading || code.join('').length !== 6}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: 10,
              background: 'var(--accent, #C75B00)',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 800,
              fontSize: 14,
              cursor: loading || code.join('').length !== 6 ? 'not-allowed' : 'pointer',
              opacity: loading || code.join('').length !== 6 ? 0.6 : 1,
              boxShadow: '0 4px 12px rgba(199,91,0,0.3)',
            }}
          >
            {loading ? 'Vérification...' : 'Confirmer le Code'}
          </button>
        </form>
      </div>
    </div>
  )
}
