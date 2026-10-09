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
import SurgaVoiceServiceCard from './SurgaVoiceServiceCard'

interface SurgaVoiceConfirmationProps {
  actionDetectee: ActionVocaleDetectee
  statutSauvegarde: 'IDLE' | 'EN_COURS' | 'VALIDE' | 'ERREUR'
  onConfirmer: () => void
  onAnnuler: () => void
  onOpenConcours?: (query?: string) => void
  onOpenPlaces?: (query?: string) => void
  onOpenTrafic?: (axe?: string) => void
  onOpenDemarches?: (query?: string) => void
  onOpenImmo?: (query?: string) => void
  onOpenMeteo?: () => void
  onOpenSport?: () => void
  onOpenPresse?: () => void
  onOpenRadio?: (station?: string) => void
  onOpenEmploi?: () => void
  onOpenVideos?: () => void
  onOpenCalc?: () => void
  onOpenCompte?: () => void
  onOpenPremium?: () => void
  onOpenPro?: () => void
  onNavigateTab?: (tab: 'notes' | 'depenses' | 'agenda' | 'aujourdhui' | 'services') => void
}

export default function SurgaVoiceConfirmation({
  actionDetectee,
  statutSauvegarde,
  onConfirmer,
  onAnnuler,
  onOpenConcours,
  onOpenPlaces,
  onOpenTrafic,
  onOpenDemarches,
  onOpenImmo,
  onOpenMeteo,
  onOpenSport,
  onOpenPresse,
  onOpenRadio,
  onOpenEmploi,
  onOpenVideos,
  onOpenCalc,
  onOpenCompte,
  onOpenPremium,
  onOpenPro,
  onNavigateTab,
}: SurgaVoiceConfirmationProps) {
  const estAction = ['ADD_EXPENSE', 'ADD_REMINDER', 'ADD_NOTE'].includes(actionDetectee.intention)

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
      {/* Calculatrice déterministe (Résultat d'évaluation) */}
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

      {/* Cartes d'action & Déclencheurs contextuels des services */}
      <SurgaVoiceServiceCard
        actionDetectee={actionDetectee}
        onOpenConcours={onOpenConcours}
        onOpenPlaces={onOpenPlaces}
        onOpenTrafic={onOpenTrafic}
        onOpenDemarches={onOpenDemarches}
        onOpenImmo={onOpenImmo}
        onOpenMeteo={onOpenMeteo}
        onOpenSport={onOpenSport}
        onOpenPresse={onOpenPresse}
        onOpenRadio={onOpenRadio}
        onOpenEmploi={onOpenEmploi}
        onOpenVideos={onOpenVideos}
        onOpenCalc={onOpenCalc}
        onOpenCompte={onOpenCompte}
        onOpenPremium={onOpenPremium}
        onOpenPro={onOpenPro}
        onNavigateTab={onNavigateTab}
      />

      {/* Dépense */}
      {actionDetectee.intention === 'ADD_EXPENSE' && actionDetectee.depenseData && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--surga-accent-ink, #A64B08)', marginBottom: '8px' }}>
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

      {/* Boutons d'action pour les écritures (Dépense, Rappel, Note) */}
      {estAction && (
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
