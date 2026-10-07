'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Lock, ShieldCheck, X, Delete, KeyRound, AlertCircle } from 'lucide-react'
import {
  verifierXaalisPin,
  definirXaalisPin,
  supprimerXaalisPin,
  deverrouillerXaalisSession,
} from '@/lib/surga-xaalis-security'

export type PinModalMode = 'unlock' | 'setup' | 'change' | 'disable'

interface SurgaXaalisPinModalProps {
  isOpen: boolean
  mode: PinModalMode
  onClose: () => void
  onSuccess: () => void
}

export default function SurgaXaalisPinModal({
  isOpen,
  mode,
  onClose,
  onSuccess,
}: SurgaXaalisPinModalProps) {
  const [pin, setPin] = useState('')
  const [etape, setEtape] = useState<'initial' | 'confirm' | 'new_pin'>('initial')
  const [pinTemp, setPinTemp] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)
  const [shake, setShake] = useState(false)

  // Réinitialisation lors de l'ouverture
  useEffect(() => {
    if (isOpen) {
      setPin('')
      setEtape('initial')
      setPinTemp('')
      setErreur(null)
      setShake(false)
    }
  }, [isOpen, mode])

  const declencherSecousse = (msg: string) => {
    setErreur(msg)
    setShake(true)
    setPin('')
    setTimeout(() => setShake(false), 500)
  }

  const traiterSoumission = useCallback(
    (codeComplet: string) => {
      if (mode === 'unlock') {
        if (verifierXaalisPin(codeComplet)) {
          deverrouillerXaalisSession()
          onSuccess()
          onClose()
        } else {
          declencherSecousse('Code PIN incorrect. Veuillez réessayer.')
        }
      } else if (mode === 'setup') {
        if (etape === 'initial') {
          setPinTemp(codeComplet)
          setPin('')
          setEtape('confirm')
          setErreur(null)
        } else if (etape === 'confirm') {
          if (codeComplet === pinTemp) {
            definirXaalisPin(codeComplet)
            onSuccess()
            onClose()
          } else {
            declencherSecousse('Les codes ne correspondent pas. Recommencez.')
            setEtape('initial')
            setPinTemp('')
          }
        }
      } else if (mode === 'disable') {
        if (verifierXaalisPin(codeComplet)) {
          supprimerXaalisPin(codeComplet)
          onSuccess()
          onClose()
        } else {
          declencherSecousse('Code PIN incorrect. Désactivation impossible.')
        }
      } else if (mode === 'change') {
        if (etape === 'initial') {
          if (verifierXaalisPin(codeComplet)) {
            setPin('')
            setEtape('new_pin')
            setErreur(null)
          } else {
            declencherSecousse('Ancien code PIN incorrect.')
          }
        } else if (etape === 'new_pin') {
          setPinTemp(codeComplet)
          setPin('')
          setEtape('confirm')
          setErreur(null)
        } else if (etape === 'confirm') {
          if (codeComplet === pinTemp) {
            definirXaalisPin(codeComplet)
            onSuccess()
            onClose()
          } else {
            declencherSecousse('Les codes ne correspondent pas. Recommencez.')
            setEtape('new_pin')
            setPinTemp('')
          }
        }
      }
    },
    [mode, etape, pinTemp, onSuccess, onClose]
  )

  const ajouterChiffre = useCallback(
    (chiffre: string) => {
      if (pin.length >= 4) return
      const nouveau = pin + chiffre
      setPin(nouveau)
      setErreur(null)
      if (nouveau.length === 4) {
        setTimeout(() => traiterSoumission(nouveau), 120)
      }
    },
    [pin, traiterSoumission]
  )

  const effacerChiffre = useCallback(() => {
    setPin((prev) => prev.slice(0, -1))
    setErreur(null)
  }, [])

  // Écoute clavier physique
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        ajouterChiffre(e.key)
      } else if (e.key === 'Backspace') {
        effacerChiffre()
      } else if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, ajouterChiffre, effacerChiffre, onClose])

  if (!isOpen) return null

  // Titres et consignes selon mode et étape
  let titre = 'Code PIN Sama Xaalis'
  let sousTitre = 'Saisissez votre code à 4 chiffres'

  if (mode === 'unlock') {
    titre = 'Déverrouiller Sama Xaalis'
    sousTitre = 'Entrez votre code PIN pour accéder à vos finances perso'
  } else if (mode === 'setup') {
    titre = 'Configurer le code PIN'
    sousTitre =
      etape === 'initial'
        ? 'Choisissez un code PIN à 4 chiffres'
        : 'Confirmez votre code PIN à 4 chiffres'
  } else if (mode === 'disable') {
    titre = 'Désactiver le code PIN'
    sousTitre = 'Entrez votre code actuel pour supprimer la protection'
  } else if (mode === 'change') {
    titre = 'Modifier le code PIN'
    if (etape === 'initial') sousTitre = 'Entrez votre code PIN actuel'
    else if (etape === 'new_pin') sousTitre = 'Entrez votre nouveau code PIN'
    else sousTitre = 'Confirmez le nouveau code PIN'
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
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
          maxWidth: 360,
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          padding: '24px 20px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bouton Fermer */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            background: 'none',
            border: 'none',
            color: 'var(--text3, #73675E)',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
          }}
          aria-label="Fermer"
        >
          <X size={20} />
        </button>

        {/* En-tête avec Icône */}
        <div
          style={{
            width: 50,
            height: 50,
            borderRadius: 16,
            backgroundColor: 'rgba(199, 91, 0, 0.12)',
            color: 'var(--accent, #C75B00)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
          }}
        >
          {mode === 'setup' || mode === 'change' ? <KeyRound size={24} /> : <Lock size={24} />}
        </div>

        <h3
          style={{
            fontSize: 17,
            fontWeight: 800,
            color: 'var(--navy, #1C2B4A)',
            margin: '0 0 6px 0',
            textAlign: 'center',
          }}
        >
          {titre}
        </h3>

        <p
          style={{
            fontSize: 12.5,
            color: 'var(--text2, #475569)',
            margin: '0 0 18px 0',
            textAlign: 'center',
            lineHeight: 1.4,
          }}
        >
          {sousTitre}
        </p>

        {/* 4 Bulles Indicateurs du PIN */}
        <div
          style={{
            display: 'flex',
            gap: 14,
            marginBottom: erreur ? 10 : 20,
            transform: shake ? 'translateX(-8px)' : 'none',
            transition: 'transform 0.1s ease',
          }}
        >
          {[0, 1, 2, 3].map((idx) => {
            const rempli = pin.length > idx
            return (
              <div
                key={idx}
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  backgroundColor: rempli ? 'var(--navy, #1C2B4A)' : 'transparent',
                  border: `2px solid ${rempli ? 'var(--navy, #1C2B4A)' : 'var(--surga-border, #CBD5E1)'}`,
                  transition: 'all 0.15s ease',
                  transform: rempli ? 'scale(1.15)' : 'scale(1)',
                }}
              />
            )
          })}
        </div>

        {/* Message d'erreur */}
        {erreur && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: '#DC2626',
              fontSize: 12,
              fontWeight: 600,
              marginBottom: 14,
              textAlign: 'center',
            }}
          >
            <AlertCircle size={14} />
            <span>{erreur}</span>
          </div>
        )}

        {/* Pavé Numérique Tactile 3x4 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10,
            width: '100%',
            maxWidth: 280,
          }}
        >
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((chiffre) => (
            <button
              key={chiffre}
              type="button"
              onClick={() => ajouterChiffre(chiffre)}
              style={{
                height: 52,
                borderRadius: 12,
                backgroundColor: 'var(--surga-bg, #F8FAFC)',
                border: '1px solid var(--surga-border, #E2E8F0)',
                color: 'var(--navy, #1C2B4A)',
                fontSize: 20,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.1s ease',
              }}
            >
              {chiffre}
            </button>
          ))}

          {/* Ligne du bas : Annuler / Vide, 0, Effacer */}
          <button
            type="button"
            onClick={onClose}
            style={{
              height: 52,
              borderRadius: 12,
              backgroundColor: 'transparent',
              border: 'none',
              color: 'var(--text3, #73675E)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={() => ajouterChiffre('0')}
            style={{
              height: 52,
              borderRadius: 12,
              backgroundColor: 'var(--surga-bg, #F8FAFC)',
              border: '1px solid var(--surga-border, #E2E8F0)',
              color: 'var(--navy, #1C2B4A)',
              fontSize: 20,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            0
          </button>

          <button
            type="button"
            onClick={effacerChiffre}
            style={{
              height: 52,
              borderRadius: 12,
              backgroundColor: 'transparent',
              border: 'none',
              color: 'var(--navy, #1C2B4A)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Effacer le dernier chiffre"
          >
            <Delete size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}
