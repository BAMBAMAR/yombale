'use client'

import React from 'react'
import {
  Calculator,
  Wallet,
  Calendar,
  FileText,
  Check,
  RotateCcw,
  GraduationCap,
  Car,
  FileCheck,
  Radio,
  ArrowRight,
} from 'lucide-react'
import type { ActionVocaleDetectee } from '@/lib/surga-voice'
import { formaterFCFA } from '@/lib/surga-calculator'

interface SurgaVoiceConfirmationProps {
  actionDetectee: ActionVocaleDetectee
  statutSauvegarde: 'IDLE' | 'EN_COURS' | 'VALIDE' | 'ERREUR'
  onConfirmer: () => void
  onAnnuler: () => void
  onOpenConcours?: (query?: string) => void
  onOpenTrafic?: () => void
  onOpenDemarches?: (query?: string) => void
  onOpenRadio?: (station?: string) => void
}

export default function SurgaVoiceConfirmation({
  actionDetectee,
  statutSauvegarde,
  onConfirmer,
  onAnnuler,
  onOpenConcours,
  onOpenTrafic,
  onOpenDemarches,
  onOpenRadio,
}: SurgaVoiceConfirmationProps) {
  const estRecherche = [
    'SEARCH_CONCOURS',
    'CHECK_TRAFFIC',
    'SEARCH_DEMARCHES',
    'PLAY_RADIO',
    'BRIEFING',
  ].includes(actionDetectee.intention)

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

      {/* Recherche Concours Nationaux */}
      {actionDetectee.intention === 'SEARCH_CONCOURS' && actionDetectee.concoursData && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--navy)', marginBottom: '6px' }}>
            <GraduationCap size={16} color="var(--accent)" />
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Concours & Examens du Sénégal</span>
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--navy)', marginBottom: '4px' }}>
            Recherche : « {actionDetectee.concoursData.query.toUpperCase()} »
          </div>
          <div style={{ fontSize: '0.82rem', color: '#6A7282', marginBottom: '10px' }}>
            Accédez aux 22 fiches officielles certifiées (dates, pièces, quittance Trésor).
          </div>
          {onOpenConcours && (
            <button
              type="button"
              onClick={() => onOpenConcours(actionDetectee.concoursData?.query)}
              className="btn-npl"
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <span>Consulter la fiche du concours</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      )}

      {/* Consultation Trafic Routier */}
      {actionDetectee.intention === 'CHECK_TRAFFIC' && actionDetectee.traficData && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--navy)', marginBottom: '6px' }}>
            <Car size={16} color="var(--accent)" />
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Trafic Dakar Live (TomTom)</span>
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--navy)', marginBottom: '4px' }}>
            Axe : {actionDetectee.traficData.axe.toUpperCase()}
          </div>
          <div style={{ fontSize: '0.82rem', color: '#6A7282', marginBottom: '10px' }}>
            Suivi en temps réel des ralentissements sur la presqu’île de Dakar.
          </div>
          {onOpenTrafic && (
            <button
              type="button"
              onClick={onOpenTrafic}
              className="btn-npl"
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <span>Voir le trafic en direct</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      )}

      {/* Démarches Administratives */}
      {actionDetectee.intention === 'SEARCH_DEMARCHES' && actionDetectee.demarcheData && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--navy)', marginBottom: '6px' }}>
            <FileCheck size={16} color="var(--accent)" />
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Démarche Administrative Officielle</span>
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--navy)', marginBottom: '4px' }}>
            Procédure : « {actionDetectee.demarcheData.query} »
          </div>
          <div style={{ fontSize: '0.82rem', color: '#6A7282', marginBottom: '10px' }}>
            Liste des pièces requises, timbres fiscaux et délais légaux.
          </div>
          {onOpenDemarches && (
            <button
              type="button"
              onClick={() => onOpenDemarches(actionDetectee.demarcheData?.query)}
              className="btn-npl"
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <span>Voir les pièces et la procédure</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      )}

      {/* Radio FM */}
      {actionDetectee.intention === 'PLAY_RADIO' && actionDetectee.radioData && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--navy)', marginBottom: '6px' }}>
            <Radio size={16} color="var(--accent)" />
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Radios Locales Sénégalaises Direct</span>
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--navy)', marginBottom: '4px' }}>
            {actionDetectee.radioData.action === 'STOP'
              ? 'Arrêter la radio en cours'
              : `Station : ${actionDetectee.radioData.station?.toUpperCase() || 'RFM'}`}
          </div>
          {onOpenRadio && (
            <button
              type="button"
              onClick={() => onOpenRadio(actionDetectee.radioData?.station)}
              className="btn-npl"
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                marginTop: '8px',
              }}
            >
              <span>Ouvrir les radios FM</span>
              <ArrowRight size={14} />
            </button>
          )}
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

      {/* Boutons d'action pour les écritures (Dépense, Rappel, Note) */}
      {!estRecherche && actionDetectee.intention !== 'CALCULATE' && (
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
