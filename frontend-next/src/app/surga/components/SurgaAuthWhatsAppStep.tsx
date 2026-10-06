'use client'

import React from 'react'
import {
  MessageCircle,
  User,
  Send,
  RefreshCw,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react'

interface SurgaAuthWhatsAppStepProps {
  waStep: 'phone' | 'otp'
  telephone: string
  setTelephone: (t: string) => void
  nom: string
  setNom: (n: string) => void
  otpCode: string
  setOtpCode: (c: string) => void
  isRegisterMode: boolean
  setIsRegisterMode: (r: boolean) => void
  loading: boolean
  resendTimer: number
  onSendOtp: (e?: React.FormEvent) => void
  onVerifyOtp: (e: React.FormEvent) => void
  onBackToPhone: () => void
  onResetError: () => void
}

export default function SurgaAuthWhatsAppStep({
  waStep,
  telephone,
  setTelephone,
  nom,
  setNom,
  otpCode,
  setOtpCode,
  isRegisterMode,
  setIsRegisterMode,
  loading,
  resendTimer,
  onSendOtp,
  onVerifyOtp,
  onBackToPhone,
  onResetError,
}: SurgaAuthWhatsAppStepProps) {
  if (waStep === 'phone') {
    return (
      <form onSubmit={onSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {isRegisterMode && (
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--surga-primary, #0F172A)', marginBottom: 6 }}>
              Votre Nom complet
            </label>
            <div style={{ position: 'relative' }}>
              <User size={16} color="var(--surga-text3, #94A3B8)" style={{ position: 'absolute', left: 12, top: 13 }} />
              <input
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Ex: Awa Diop"
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
        )}

        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--surga-primary, #0F172A)', marginBottom: 6 }}>
            Numéro WhatsApp (+221)
          </label>
          <div style={{ position: 'relative' }}>
            <MessageCircle size={16} color="var(--surga-emerald, #059669)" style={{ position: 'absolute', left: 12, top: 13 }} />
            <input
              type="tel"
              inputMode="tel"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              placeholder="77 123 45 67"
              style={{
                width: '100%',
                padding: '11px 14px 11px 38px',
                borderRadius: 10,
                border: '1px solid var(--surga-border, #E2E8F0)',
                fontSize: 15,
                fontWeight: 600,
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
              <span>Envoi du code...</span>
            </>
          ) : (
            <>
              <Send size={16} />
              <span>{isRegisterMode ? 'Créer mon compte et recevoir le code' : 'Recevoir le code par WhatsApp'}</span>
            </>
          )}
        </button>

        <div style={{ textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(!isRegisterMode)
              onResetError()
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--surga-accent, #D97706)',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: 6,
            }}
          >
            {isRegisterMode
              ? 'Déjà un compte ? Se connecter'
              : 'Nouveau sur Surga ? Créer un compte'}
          </button>
        </div>
      </form>
    )
  }

  return (
    <form onSubmit={onVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--surga-primary, #0F172A)', marginBottom: 6 }}>
          Code de validation reçu par WhatsApp
        </label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={otpCode}
          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
          placeholder="• • • • • •"
          autoFocus
          autoComplete="one-time-code"
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: 10,
            border: '2px solid var(--surga-emerald, #059669)',
            fontSize: 22,
            textAlign: 'center',
            letterSpacing: 8,
            fontWeight: 800,
            boxSizing: 'border-box',
          }}
        />
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
            <span>Vérification...</span>
          </>
        ) : (
          <>
            <CheckCircle2 size={16} />
            <span>Valider et synchroniser</span>
          </>
        )}
      </button>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
        <button
          type="button"
          onClick={onBackToPhone}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--surga-text3, #94A3B8)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: 6,
          }}
        >
          <ArrowLeft size={14} />
          <span>Modifier numéro</span>
        </button>

        <button
          type="button"
          disabled={resendTimer > 0 || loading}
          onClick={() => onSendOtp()}
          style={{
            background: 'none',
            border: 'none',
            color: resendTimer > 0 ? 'var(--surga-text3, #94A3B8)' : 'var(--surga-accent, #D97706)',
            cursor: resendTimer > 0 ? 'not-allowed' : 'pointer',
            fontWeight: 700,
            textDecoration: resendTimer > 0 ? 'none' : 'underline',
            padding: 6,
          }}
        >
          {resendTimer > 0 ? `Renvoyer (${resendTimer}s)` : 'Renvoyer le code'}
        </button>
      </div>
    </form>
  )
}
