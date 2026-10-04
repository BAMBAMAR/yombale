'use client'

import React from 'react'
import {
  Calculator,
  Wallet,
  Calendar,
  FileText,
  Check,
  RotateCcw,
} from 'lucide-react'
import type { ActionVocaleDetectee } from '@/lib/surga-voice'
import { formaterFCFA } from '@/lib/surga-calculator'

interface SurgaVoiceConfirmationProps {
  actionDetectee: ActionVocaleDetectee
  statutSauvegarde: 'IDLE' | 'EN_COURS' | 'VALIDE' | 'ERREUR'
  onConfirmer: () => void
  onAnnuler: () => void
}

export default function SurgaVoiceConfirmation({
  actionDetectee,
  statutSauvegarde,
  onConfirmer,
  onAnnuler,
}: SurgaVoiceConfirmationProps) {
  return (
    <div
      style={{
        padding: '14px',
        borderRadius: '10px',
        backgroundColor: 'rgba(10, 92, 54, 0.05)',
        border: '1px solid rgba(10, 92, 54, 0.2)',
        marginBottom: '16px',
      }}
    >
      {/* Calculatrice déterministe */}
      {actionDetectee.intention === 'CALCULATE' && actionDetectee.calculResultat && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--price)', marginBottom: '6px' }}>
            <Calculator size={16} />
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Résultat exact</span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--navy)' }}>
            {formaterFCFA(actionDetectee.calculResultat.resultat ?? 0)}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#6A7282', marginTop: '4px' }}>
            Opération : {actionDetectee.calculResultat.expressionNettoyee}
          </div>
        </div>
      )}

      {/* Dépense */}
      {actionDetectee.intention === 'ADD_EXPENSE' && actionDetectee.depenseData && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)', marginBottom: '8px' }}>
            <Wallet size={16} />
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Enregistrer cette dépense ?</span>
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--price)', marginBottom: '4px' }}>
            {formaterFCFA(actionDetectee.depenseData.montant)}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--navy)' }}>
            • Catégorie : <strong>{actionDetectee.depenseData.categorie}</strong>
          </div>
          {actionDetectee.depenseData.note && (
            <div style={{ fontSize: '0.85rem', color: '#6A7282', marginTop: '2px' }}>
              • Détail : {actionDetectee.depenseData.note}
            </div>
          )}
        </div>
      )}

      {/* Rappel Agenda */}
      {actionDetectee.intention === 'ADD_REMINDER' && actionDetectee.rappelData && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--navy)', marginBottom: '8px' }}>
            <Calendar size={16} />
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Programmer ce rappel ?</span>
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--navy)', marginBottom: '4px' }}>
            « {actionDetectee.rappelData.titre} »
          </div>
          <div style={{ fontSize: '0.85rem', color: '#6A7282' }}>
            Date : {actionDetectee.rappelData.date} à {actionDetectee.rappelData.heure}
          </div>
        </div>
      )}

      {/* Note */}
      {actionDetectee.intention === 'ADD_NOTE' && actionDetectee.noteData && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--navy)', marginBottom: '8px' }}>
            <FileText size={16} />
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Enregistrer cette note ?</span>
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--navy)' }}>
            « {actionDetectee.noteData.contenu} »
          </div>
        </div>
      )}

      {/* Boutons de confirmation (obligatoire pour toute écriture) */}
      {actionDetectee.intention !== 'CALCULATE' && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
          <button
            type="button"
            onClick={onConfirmer}
            disabled={statutSauvegarde === 'EN_COURS' || statutSauvegarde === 'VALIDE'}
            className="btn-npl"
            style={{
              flex: 1,
              backgroundColor: statutSauvegarde === 'VALIDE' ? 'var(--price)' : 'var(--navy)',
              color: '#FFFFFF',
              padding: '8px 12px',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Check size={16} />
            {statutSauvegarde === 'VALIDE' ? 'Enregistré' : statutSauvegarde === 'EN_COURS' ? 'En cours...' : 'Valider'}
          </button>
          <button
            type="button"
            onClick={onAnnuler}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              backgroundColor: '#FFFFFF',
              color: '#6A7282',
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <RotateCcw size={14} />
            Annuler
          </button>
        </div>
      )}
    </div>
  )
}
