'use client'

import React from 'react'
import { sessionEstPerdue } from '@/lib/surga-offline-sync'
import {
  X,
  MessageCircle,
  Mail,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react'
import { useSurgaAuthModal, type SurgaAuthUser } from '@/lib/useSurgaAuthModal'
import SurgaAuthWhatsAppStep from './SurgaAuthWhatsAppStep'
import SurgaAuthEmailStep from './SurgaAuthEmailStep'

export type { SurgaAuthUser }

interface SurgaAuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (user: SurgaAuthUser) => void
}

export default function SurgaAuthModal({
  isOpen,
  onClose,
  onSuccess,
}: SurgaAuthModalProps) {
  const {
    method,
    setMethod,
    isRegisterMode,
    setIsRegisterMode,
    waStep,
    setWaStep,
    telephone,
    setTelephone,
    nom,
    setNom,
    otpCode,
    setOtpCode,
    resendTimer,
    email,
    setEmail,
    password,
    setPassword,
    loading,
    errorMsg,
    setErrorMsg,
    successMsg,
    handleSendWaOtp,
    handleVerifyWaOtp,
    handleEmailLogin,
  } = useSurgaAuthModal({ isOpen, onSuccess, onClose })

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          backgroundColor: 'var(--surga-surface, #FFFFFF)',
          borderRadius: 16,
          boxShadow: '0 20px 40px rgba(15, 23, 42, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid var(--surga-border, #E2E8F0)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div
          style={{
            padding: '16px 20px',
            backgroundColor: 'var(--surga-primary, #0F172A)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldCheck size={18} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>Compte &amp; Synchronisation</div>
              <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.75)' }}>
                {sessionEstPerdue()
                  ? 'Votre session a expiré. Reconnectez-vous : vos saisies sont gardées sur cet appareil.'
                  : 'Sauvegardez vos notes, dépenses et accès Surga'}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            style={{
              background: 'none',
              border: 'none',
              color: '#FFFFFF',
              cursor: 'pointer',
              padding: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 6,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Corps */}
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Messages statut */}
          {errorMsg && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                backgroundColor: 'var(--surga-accent-soft, rgba(217, 119, 6, 0.08))',
                border: '1px solid rgba(217, 119, 6, 0.3)',
                color: 'var(--surga-accent, #D97706)',
                fontSize: 13,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                backgroundColor: 'var(--surga-emerald-soft, rgba(5, 150, 105, 0.08))',
                border: '1px solid rgba(5, 150, 105, 0.3)',
                color: 'var(--surga-emerald, #059669)',
                fontSize: 13,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
              }}
            >
              <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Onglets Méthode */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--surga-bg, #F8FAFC)',
              borderRadius: 10,
              padding: 4,
              gap: 4,
              border: '1px solid var(--surga-border, #E2E8F0)',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setMethod('whatsapp')
                setErrorMsg(null)
              }}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: method === 'whatsapp' ? 'var(--surga-surface, #FFFFFF)' : 'transparent',
                color: method === 'whatsapp' ? 'var(--surga-primary, #0F172A)' : 'var(--surga-text3, #94A3B8)',
                fontWeight: method === 'whatsapp' ? 800 : 500,
                fontSize: 12.5,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                minHeight: 36,
                boxShadow: method === 'whatsapp' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <MessageCircle size={15} color={method === 'whatsapp' ? 'var(--surga-emerald, #059669)' : 'currentColor'} />
              <span>WhatsApp (Recommandé)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMethod('email')
                setErrorMsg(null)
              }}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: method === 'email' ? 'var(--surga-surface, #FFFFFF)' : 'transparent',
                color: method === 'email' ? 'var(--surga-primary, #0F172A)' : 'var(--surga-text3, #94A3B8)',
                fontWeight: method === 'email' ? 800 : 500,
                fontSize: 12.5,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                minHeight: 36,
                boxShadow: method === 'email' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <Mail size={15} />
              <span>Email &amp; Passe</span>
            </button>
          </div>

          {/* FLUX 1 : WHATSAPP */}
          {method === 'whatsapp' && (
            <SurgaAuthWhatsAppStep
              waStep={waStep}
              telephone={telephone}
              setTelephone={setTelephone}
              nom={nom}
              setNom={setNom}
              otpCode={otpCode}
              setOtpCode={setOtpCode}
              isRegisterMode={isRegisterMode}
              setIsRegisterMode={setIsRegisterMode}
              loading={loading}
              resendTimer={resendTimer}
              onSendOtp={handleSendWaOtp}
              onVerifyOtp={handleVerifyWaOtp}
              onBackToPhone={() => setWaStep('phone')}
              onResetError={() => setErrorMsg(null)}
            />
          )}

          {/* FLUX 2 : EMAIL */}
          {method === 'email' && (
            <SurgaAuthEmailStep
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              loading={loading}
              onSubmit={handleEmailLogin}
            />
          )}
        </div>
      </div>
    </div>
  )
}
