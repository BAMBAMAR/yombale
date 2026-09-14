'use client'

import React, { useState, useEffect } from 'react'
import { ShieldAlert, KeyRound, X, Check } from 'lucide-react'

interface CaissierItem {
  id: string
  nom: string
  prenom?: string
  role?: string
  code_pin?: string
  actif?: boolean
}

interface PosSuperviseurPinModalProps {
  isOpen: boolean
  titre: string
  caissiersList: CaissierItem[]
  pinSuperviseurFallback: string
  onClose: () => void
  onSuccess: () => void
}

export default function PosSuperviseurPinModal({
  isOpen,
  titre,
  caissiersList,
  pinSuperviseurFallback,
  onClose,
  onSuccess,
}: PosSuperviseurPinModalProps) {
  const [pinSaisi, setPinSaisi] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setPinSaisi('')
      setErreur(null)
    }
  }, [isOpen])

  function validerPin() {
    const superviseurs = caissiersList.filter((c) => c.role === 'superviseur' || c.role === 'admin')
    const hasSuperviseurPin = superviseurs.some((c) => c.code_pin && c.code_pin === pinSaisi)

    const isValide = superviseurs.length > 0
      ? hasSuperviseurPin
      : (pinSaisi === pinSuperviseurFallback)

    if (isValide) {
      onSuccess()
    } else {
      setErreur('Code PIN Superviseur incorrect.')
    }
  }

  // Auto-validation dès 4 chiffres
  useEffect(() => {
    if (isOpen && pinSaisi.length === 4) {
      validerPin()
    }
  }, [pinSaisi, isOpen])

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.65)',
        backdropFilter: 'blur(3px)',
        zIndex: 12500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 20,
          padding: 24,
          width: '100%',
          maxWidth: 380,
          border: '2px solid #ea580c',
          textAlign: 'center',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
          position: 'relative',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            background: '#f1f5f9',
            border: 'none',
            borderRadius: '50%',
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#64748b',
          }}
          aria-label="Fermer"
        >
          <X size={16} />
        </button>

        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            background: '#fff7ed',
            border: '1.5px solid #fed7aa',
            color: '#ea580c',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
          }}
        >
          <ShieldAlert size={26} />
        </div>

        <h3 style={{ margin: '0 0 6px', fontSize: 17, color: '#0f172a', fontWeight: 900 }}>
          Autorisation Requise
        </h3>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: '#c2410c', fontWeight: 600 }}>
          {titre}
        </p>

        <div style={{ marginBottom: 16 }}>
          <input
            type="password"
            maxLength={6}
            placeholder="••••"
            value={pinSaisi}
            autoFocus
            onChange={(e) => {
              setPinSaisi(e.target.value.replace(/\D/g, ''))
              setErreur(null)
            }}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: 12,
              border: erreur ? '2px solid #dc2626' : '1.5px solid #ea580c',
              background: '#f8fafc',
              color: '#0f172a',
              fontSize: 24,
              textAlign: 'center',
              letterSpacing: '0.3em',
              boxSizing: 'border-box',
              fontWeight: 900,
              outline: 'none',
            }}
          />
          {erreur && (
            <p style={{ margin: '6px 0 0', color: '#dc2626', fontSize: 12, fontWeight: 700 }}>
              {erreur}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              padding: '11px',
              background: '#e2e8f0',
              color: '#334155',
              border: 'none',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={validerPin}
            style={{
              flex: 1.2,
              padding: '11px',
              background: '#ea580c',
              color: '#ffffff',
              border: 'none',
              borderRadius: 10,
              fontWeight: 900,
              fontSize: 13,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Check size={16} />
            <span>Valider</span>
          </button>
        </div>
      </div>
    </div>
  )
}
