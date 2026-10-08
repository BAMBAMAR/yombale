'use client'

import React, { useState } from 'react'
import { X, Delete, ArrowRight, Check } from 'lucide-react'
import { evaluerCalcul, formaterFCFA, formaterNombreCalcul } from '@/lib/surga-calculator'
import SurgaShareButton from './SurgaShareButton'
import { formaterPartageCalcul } from '@/lib/surga-share'

interface SurgaCalculatorModalProps {
  isOpen: boolean
  onClose: () => void
  onInjectMontant?: (montant: number) => void
}

export default function SurgaCalculatorModal({
  isOpen,
  onClose,
  onInjectMontant,
}: SurgaCalculatorModalProps) {
  const [expression, setExpression] = useState<string>('')
  const [resultat, setResultat] = useState<number | null>(null)
  const [approche, setApproche] = useState<boolean>(false)
  const [erreur, setErreur] = useState<string | null>(null)

  if (!isOpen) return null

  const handleTouche = (val: string) => {
    setErreur(null)
    setExpression((prev) => prev + val)
  }

  const handleEffacer = () => {
    setExpression('')
    setResultat(null)
    setErreur(null)
  }

  const handleBackspace = () => {
    setErreur(null)
    setExpression((prev) => prev.slice(0, -1))
  }

  const handleCalculer = () => {
    if (!expression.trim()) return
    const res = evaluerCalcul(expression)
    if (res.success && res.resultat !== undefined) {
      setResultat(res.resultat)
      setApproche(Boolean(res.approche))
      setErreur(null)
    } else {
      setErreur(res.erreur || 'Calcul invalide')
    }
  }

  const handleInjecter = () => {
    if (resultat !== null && onInjectMontant) {
      onInjectMontant(Math.round(resultat))
      onClose()
    }
  }

  const touches = [
    ['C', '%', '÷', 'DEL'],
    ['7', '8', '9', '×'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['0', '.', '=', 'OK'],
  ]

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(28, 43, 74, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          backgroundColor: '#FFFFFF',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: '20px 16px 30px 16px',
          boxShadow: '0 -8px 30px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
            Calculatrice Déterministe
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la calculatrice"
            style={{
              background: 'none',
              border: 'none',
              padding: 6,
              cursor: 'pointer',
              color: 'var(--text2, #5A4E42)',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Écran d'affichage */}
        <div
          style={{
            backgroundColor: 'var(--bg, #F8F5F0)',
            borderRadius: 12,
            padding: '12px 16px',
            border: '1px solid var(--border, #E8DDD2)',
            textAlign: 'right',
            minHeight: 76,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              fontSize: 16,
              color: 'var(--text2, #5A4E42)',
              minHeight: 22,
              wordBreak: 'break-all',
            }}
          >
            {expression || '0'}
          </div>
          {erreur ? (
            <div style={{ fontSize: 13, color: '#DC2626', fontWeight: 600 }}>{erreur}</div>
          ) : (
            <div
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: 'var(--price, #0A5C36)',
                minHeight: 32,
              }}
            >
              {resultat !== null ? `${approche ? '≈ ' : ''}${formaterNombreCalcul(resultat)}` : ''}
            </div>
          )}
        </div>

        {/* Clavier tactile */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {touches.flat().map((t, idx) => {
            let bg = '#FFFFFF'
            let color = 'var(--navy, #1C2B4A)'
            let fontWeight = 600

            const isOp = ['+', '-', '×', '÷', '%'].includes(t)
            const isSpecial = ['C', 'DEL', '=', 'OK'].includes(t)

            if (isOp) {
              bg = 'rgba(199, 91, 0, 0.1)'
              color = 'var(--accent, #C75B00)'
              fontWeight = 700
            } else if (t === 'C' || t === 'DEL') {
              bg = 'rgba(28, 43, 74, 0.06)'
              color = 'var(--text2, #5A4E42)'
            } else if (t === '=' || t === 'OK') {
              bg = 'var(--navy, #1C2B4A)'
              color = '#FFFFFF'
              fontWeight = 800
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  if (t === 'C') handleEffacer()
                  else if (t === 'DEL') handleBackspace()
                  else if (t === '=' || t === 'OK') handleCalculer()
                  else handleTouche(t)
                }}
                style={{
                  height: 52,
                  borderRadius: 10,
                  border: '1px solid var(--border, #E8DDD2)',
                  backgroundColor: bg,
                  color,
                  fontSize: 18,
                  fontWeight,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.15s',
                }}
              >
                {t === 'DEL' ? <Delete size={20} /> : t}
              </button>
            )
          })}
        </div>

        {/* Bouton d'injection dans une dépense et bouton de partage si résultat */}
        {resultat !== null && (
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            {onInjectMontant && (
              <button
                type="button"
                onClick={handleInjecter}
                className="btn-npl"
                style={{
                  flex: 1,
                  backgroundColor: 'var(--price, #0A5C36)',
                  color: '#FFFFFF',
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Check size={16} />
                <span>Utiliser {formaterFCFA(Math.round(resultat))}{Number.isInteger(resultat) ? '' : ' (arrondi)'}</span>
              </button>
            )}

            <SurgaShareButton
              payload={{
                titre: 'Surga Calculatrice',
                texte: formaterPartageCalcul({
                  expression,
                  resultatFormate: formaterNombreCalcul(resultat),
                }),
              }}
              taille="md"
              libelle="Partager"
            />
          </div>
        )}
      </div>
    </div>
  )
}
