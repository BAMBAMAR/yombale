'use client'

import React, { useState } from 'react'
import {
  Mic,
  X,
  AlertCircle,
  Keyboard,
  ArrowRight,
} from 'lucide-react'
import {
  interpreterCommandeVocale,
} from '@/lib/surga-voice'
import { useSurgaSpeechRecognition } from '@/lib/useSurgaSpeechRecognition'
import SurgaVoiceConfirmationBridge from './SurgaVoiceConfirmationBridge'
import SurgaVoicePillsList from './SurgaVoicePillsList'

interface SurgaVoiceModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirmerDepense?: (depense: { montant: number; categorie: string; note: string }) => Promise<void>
  onConfirmerNote?: (note: { titre: string; contenu: string }) => Promise<void>
  onConfirmerRappel?: (rappel: { titre: string; date: string; heure: string }) => Promise<void>
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

export default function SurgaVoiceModal({
  isOpen,
  onClose,
  onConfirmerDepense,
  onConfirmerNote,
  onConfirmerRappel,
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
}: SurgaVoiceModalProps) {
  const {
    estSupporte,
    enEcoute,
    transcription,
    setTranscription,
    actionDetectee,
    setActionDetectee,
    messageErreur,
    demarrerEcoute,
    arreterEcoute,
  } = useSurgaSpeechRecognition(isOpen)

  const [texteSaisiManuel, setTexteSaisiManuel] = useState('')
  const [statutSauvegarde, setStatutSauvegarde] = useState<'IDLE' | 'EN_COURS' | 'VALIDE' | 'ERREUR'>('IDLE')

  if (!isOpen) return null

  const handleValidationManuel = (e: React.FormEvent) => {
    e.preventDefault()
    if (!texteSaisiManuel.trim()) return
    const action = interpreterCommandeVocale(texteSaisiManuel)
    setActionDetectee(action)
    setTranscription(texteSaisiManuel)
  }

  const handleConfirmerAction = async () => {
    if (!actionDetectee) return
    setStatutSauvegarde('EN_COURS')

    try {
      if (actionDetectee.intention === 'ADD_EXPENSE' && actionDetectee.depenseData && onConfirmerDepense) {
        await onConfirmerDepense(actionDetectee.depenseData)
      } else if (actionDetectee.intention === 'ADD_NOTE' && actionDetectee.noteData && onConfirmerNote) {
        await onConfirmerNote(actionDetectee.noteData)
      } else if (actionDetectee.intention === 'ADD_REMINDER' && actionDetectee.rappelData && onConfirmerRappel) {
        await onConfirmerRappel(actionDetectee.rappelData)
      }
      setStatutSauvegarde('VALIDE')
      setTimeout(() => {
        onClose()
      }, 1400)
    } catch {
      setStatutSauvegarde('ERREUR')
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
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
          padding: 24,
          position: 'relative',
          border: '1px solid var(--surga-border, #E2E8F0)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: 'var(--surga-accent-soft, rgba(217, 119, 6, 0.1))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--surga-accent-ink, #A64B08)',
              }}
            >
              <Mic size={20} strokeWidth={2.4} />
            </div>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--surga-primary, #0F172A)', margin: 0 }}>
              Commande Vocale Surga
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la boîte vocale"
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--surga-text3, #94A3B8)',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 8,
              minWidth: 36,
              minHeight: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Animation du microphone ou repli */}
        {estSupporte ? (
          <div style={{ textAlign: 'center', margin: '20px 0' }}>
            <button
              type="button"
              onClick={enEcoute ? arreterEcoute : demarrerEcoute}
              className={enEcoute ? 'surga-voice-listening' : ''}
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: enEcoute
                  ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
                  : 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
                color: enEcoute ? '#0F172A' : '#FFFFFF',
                border: 'none',
                boxShadow: enEcoute
                  ? '0 0 0 12px rgba(217, 119, 6, 0.25), 0 8px 24px rgba(217, 119, 6, 0.4)'
                  : '0 6px 18px rgba(15, 23, 42, 0.2)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title={enEcoute ? "Arrêter l'écoute" : 'Parler à Surga'}
            >
              <Mic size={34} strokeWidth={2.4} />
            </button>
            <p style={{ fontSize: 14, color: 'var(--surga-text2, #475569)', marginTop: 14, marginBottom: 0, fontWeight: 500 }}>
              {enEcoute ? "Surga vous écoute... Parlez naturellement." : "Appuyez sur le micro pour parler."}
            </p>
          </div>
        ) : (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 10,
              backgroundColor: 'var(--surga-accent-soft, rgba(217, 119, 6, 0.08))',
              color: 'var(--surga-primary, #0F172A)',
              fontSize: 13,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              marginBottom: 16,
            }}
          >
            <AlertCircle size={18} color="var(--surga-accent, #D97706)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              Reconnaissance vocale non disponible sur ce navigateur. Vous pouvez saisir votre commande ci-dessous.
            </div>
          </div>
        )}

        {messageErreur && (
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 8,
              backgroundColor: 'var(--surga-danger-soft, rgba(220, 38, 38, 0.09))',
              color: 'var(--surga-danger, #DC2626)',
              fontSize: 13,
              marginBottom: 14,
            }}
          >
            {messageErreur}
          </div>
        )}

        {/* Transcription en direct ou texte manuel */}
        {transcription && (
          <div
            style={{
              padding: '12px 14px',
              backgroundColor: 'var(--surga-bg, #F8FAFC)',
              borderRadius: 10,
              border: '1px solid var(--surga-border, #E2E8F0)',
              marginBottom: 16,
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--surga-primary, #0F172A)',
              fontStyle: enEcoute ? 'italic' : 'normal',
            }}
          >
            « {transcription} »
          </div>
        )}

        {/* Zone de saisie manuelle de repli */}
        {!enEcoute && !actionDetectee && (
          <form onSubmit={handleValidationManuel} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                placeholder='Ex : note 2500 taxi'
                value={texteSaisiManuel}
                onChange={(e) => setTexteSaisiManuel(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  borderRadius: 10,
                  border: '1px solid var(--surga-border, #E2E8F0)',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <Keyboard size={16} color="var(--surga-text3, #94A3B8)" style={{ position: 'absolute', left: 12, top: 12 }} />
            </div>
            <button
              type="submit"
              style={{
                padding: '0 16px',
                height: 42,
                borderRadius: 10,
                border: 'none',
                backgroundColor: 'var(--surga-primary, #0F172A)',
                color: '#FFFFFF',
                fontSize: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ArrowRight size={18} />
            </button>
          </form>
        )}

        {/* Pastilles de suggestions modulaires */}
        {!enEcoute && !actionDetectee && (
          <SurgaVoicePillsList
            onSelect={(texte, action) => {
              setTranscription(texte)
              setActionDetectee(action)
            }}
          />
        )}

        {/* Chaîne de confirmation pour Dépense, Note, Rappel ou Navigation */}
        {actionDetectee && actionDetectee.intention !== 'INCONNU' && (
          <SurgaVoiceConfirmationBridge
            actionDetectee={actionDetectee}
            statutSauvegarde={statutSauvegarde}
            onConfirmer={handleConfirmerAction}
            onAnnuler={() => {
              setActionDetectee(null)
              setTranscription('')
            }}
            onClose={onClose}
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
        )}

        {actionDetectee && actionDetectee.intention === 'INCONNU' && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              backgroundColor: 'var(--surga-bg, #F8FAFC)',
              border: '1px solid var(--surga-border, #E2E8F0)',
              color: 'var(--surga-text2, #475569)',
              fontSize: 13,
              marginBottom: 14,
            }}
          >
            Commande non reconnue. Exemples : <em>"cherche concours douanes"</em>, <em>"note 2500 taxi"</em>, <em>"rappel demain 14h"</em>, <em>"trafic VDN"</em>.
          </div>
        )}

        {/* Pied de dialogue */}
        <div style={{ textAlign: 'center', marginTop: 10 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--surga-text3, #94A3B8)',
              fontSize: 13,
              cursor: 'pointer',
              padding: 6,
            }}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
