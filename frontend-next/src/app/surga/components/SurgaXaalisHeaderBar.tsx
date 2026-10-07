'use client'

import React from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  Calculator,
} from 'lucide-react'

interface SurgaXaalisHeaderBarProps {
  libelleMois: string
  masque: boolean
  protegeParPin: boolean
  verrouille: boolean
  onChangerMois: (direction: 'prec' | 'suiv') => void
  onToggleMasque: () => void
  onActionPin: () => void
  onOpenCalc: () => void
}

export default function SurgaXaalisHeaderBar({
  libelleMois,
  masque,
  protegeParPin,
  verrouille,
  onChangerMois,
  onToggleMasque,
  onActionPin,
  onOpenCalc,
}: SurgaXaalisHeaderBarProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        marginBottom: 14,
        flexWrap: 'wrap',
      }}
    >
      {/* Sélecteur de mois */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button
          type="button"
          onClick={() => onChangerMois('prec')}
          style={{
            background: '#FFFFFF',
            border: '1px solid var(--surga-border, #E2E8F0)',
            borderRadius: 8,
            padding: '6px 8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            minHeight: 34,
          }}
          aria-label="Mois précédent"
        >
          <ChevronLeft size={16} />
        </button>
        <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--navy, #1C2B4A)', minWidth: 120, textAlign: 'center' }}>
          {libelleMois}
        </span>
        <button
          type="button"
          onClick={() => onChangerMois('suiv')}
          style={{
            background: '#FFFFFF',
            border: '1px solid var(--surga-border, #E2E8F0)',
            borderRadius: 8,
            padding: '6px 8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            minHeight: 34,
          }}
          aria-label="Mois suivant"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Contrôles de Confidentialité, PIN & Calculatrice */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* Bouton Afficher / Masquer les montants */}
        <button
          type="button"
          onClick={onToggleMasque}
          title={masque ? 'Afficher les montants réels' : 'Masquer les montants (confidentialité)'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '6px 10px',
            borderRadius: 8,
            backgroundColor: masque ? 'rgba(199, 91, 0, 0.1)' : '#FFFFFF',
            border: `1px solid ${masque ? 'var(--accent, #C75B00)' : 'var(--surga-border, #E2E8F0)'}`,
            fontSize: 12,
            fontWeight: 700,
            color: masque ? 'var(--accent, #C75B00)' : 'var(--navy, #1C2B4A)',
            cursor: 'pointer',
            minHeight: 34,
          }}
        >
          {masque ? <EyeOff size={14} /> : <Eye size={14} />}
          <span>{masque ? 'Masqué' : 'Masquer'}</span>
        </button>

        {/* Bouton Code PIN / Sécurité */}
        <button
          type="button"
          onClick={onActionPin}
          title={
            protegeParPin
              ? verrouille
                ? 'Déverrouiller avec le code PIN'
                : 'Reverrouiller immédiatement'
              : 'Configurer un code PIN à 4 chiffres'
          }
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '6px 10px',
            borderRadius: 8,
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--surga-border, #E2E8F0)',
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--navy, #1C2B4A)',
            cursor: 'pointer',
            minHeight: 34,
          }}
        >
          {protegeParPin ? (
            <>
              <Lock size={14} color="var(--accent, #C75B00)" />
              <span>{verrouille ? 'Déverrouiller' : 'Verrouiller'}</span>
            </>
          ) : (
            <>
              <ShieldCheck size={14} color="var(--price, #0A5C36)" />
              <span>Protéger par PIN</span>
            </>
          )}
        </button>

        {/* Bouton Calculatrice */}
        <button
          type="button"
          onClick={onOpenCalc}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '6px 10px',
            borderRadius: 8,
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--surga-border, #E2E8F0)',
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--navy, #1C2B4A)',
            cursor: 'pointer',
            minHeight: 34,
          }}
        >
          <Calculator size={14} color="var(--accent, #C75B00)" />
          <span>Calculatrice</span>
        </button>
      </div>
    </div>
  )
}
