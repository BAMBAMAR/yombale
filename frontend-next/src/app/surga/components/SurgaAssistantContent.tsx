'use client'

import React from 'react'
import {
  Copy,
  Check,
  FileText,
  Share2,
  ArrowRight,
  Calculator,
  Calendar,
  Wallet,
  Loader2,
} from 'lucide-react'
import type { SurgaAssistantResultat } from './SurgaAssistantModal'

interface SurgaAssistantContentProps {
  chargement: boolean
  resultat: SurgaAssistantResultat | null
  aCopie: boolean
  noteEnregistree: boolean
  actionValidee: boolean
  onCopier: () => void
  onSauvegarderNote: () => void
  onPartagerWhatsApp: () => void
  onValiderAction: () => void
}

export default function SurgaAssistantContent({
  chargement,
  resultat,
  aCopie,
  noteEnregistree,
  actionValidee,
  onCopier,
  onSauvegarderNote,
  onPartagerWhatsApp,
  onValiderAction,
}: SurgaAssistantContentProps) {
  if (chargement) {
    return (
      <div style={{ textAlign: 'center', padding: '36px 0', color: '#64748B' }}>
        <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px auto', color: 'var(--surga-accent, #D97706)' }} />
        <div style={{ fontWeight: 600 }}>Surga prépare votre réponse...</div>
      </div>
    )
  }

  if (!resultat) {
    return (
      <div style={{ textAlign: 'center', padding: '30px 0', color: '#94A3B8' }}>
        Posez votre question ou dictez votre demande à Surga.
      </div>
    )
  }

  return (
    <div>
      {/* 1. RÉPONSE LLM (DISCOURS, REFORMULATION, RÉDACTION LIBRE) */}
      {resultat.type === 'LLM_REPLY' && (
        <div>
          {resultat.titreSuggere && (
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--surga-accent, #D97706)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {resultat.titreSuggere}
            </div>
          )}
          <div
            style={{
              fontSize: 14.5,
              lineHeight: 1.65,
              color: 'var(--surga-primary, #0F172A)',
              whiteSpace: 'pre-line',
              backgroundColor: '#F8FAFC',
              padding: '16px 18px',
              borderRadius: 12,
              border: '1px solid #E2E8F0',
            }}
          >
            {resultat.texte}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
            <button
              type="button"
              onClick={onCopier}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                backgroundColor: aCopie ? '#F0FDF4' : '#FFFFFF',
                color: aCopie ? '#16A34A' : '#0F172A',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {aCopie ? <Check size={15} /> : <Copy size={15} />}
              {aCopie ? 'Copié !' : 'Copier le texte'}
            </button>

            <button
              type="button"
              onClick={onSauvegarderNote}
              disabled={noteEnregistree}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                backgroundColor: noteEnregistree ? '#FEF3C7' : '#FFFFFF',
                color: noteEnregistree ? '#D97706' : '#0F172A',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <FileText size={15} />
              {noteEnregistree ? 'Enregistré dans Notes !' : 'Enregistrer dans mes Notes'}
            </button>

            <button
              type="button"
              onClick={onPartagerWhatsApp}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                color: '#0F172A',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Share2 size={15} />
              WhatsApp
            </button>
          </div>
        </div>
      )}

      {/* 2. ACTION LOCALE DÉPENSE */}
      {resultat.type === 'ACTION_DEPENSE' && (
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(5, 150, 105, 0.1)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
            <Wallet size={22} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#059669', marginBottom: 4 }}>
            {resultat.data?.montant?.toLocaleString('fr-FR')} FCFA
          </div>
          <div style={{ fontSize: 14, color: '#64748B', marginBottom: 18 }}>
            Catégorie : <strong>{resultat.data?.categorie}</strong> {resultat.data?.note && `• Note : ${resultat.data.note}`}
          </div>
          <button
            type="button"
            onClick={onValiderAction}
            disabled={actionValidee}
            style={{
              backgroundColor: actionValidee ? '#16A34A' : '#059669',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 10,
              padding: '12px 24px',
              fontSize: 14,
              fontWeight: 700,
              cursor: actionValidee ? 'default' : 'pointer',
            }}
          >
            {actionValidee ? 'Dépense enregistrée avec succès !' : 'Confirmer et enregistrer la dépense'}
          </button>
        </div>
      )}

      {/* 3. ACTION LOCALE RAPPEL */}
      {resultat.type === 'ACTION_RAPPEL' && (
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(217, 119, 6, 0.1)', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
            <Calendar size={22} />
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>
            {resultat.data?.titre}
          </div>
          <div style={{ fontSize: 14, color: '#64748B', marginBottom: 18 }}>
            Date : <strong>{resultat.data?.date}</strong> à <strong>{resultat.data?.heure}</strong>
          </div>
          <button
            type="button"
            onClick={onValiderAction}
            disabled={actionValidee}
            style={{
              backgroundColor: actionValidee ? '#16A34A' : '#D97706',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 10,
              padding: '12px 24px',
              fontSize: 14,
              fontWeight: 700,
              cursor: actionValidee ? 'default' : 'pointer',
            }}
          >
            {actionValidee ? 'Rappel ajouté avec succès !' : 'Confirmer et ajouter à l\'agenda'}
          </button>
        </div>
      )}

      {/* 4. CALCUL ARITHMÉTIQUE */}
      {resultat.type === 'CALCUL' && (
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#F1F5F9', color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
            <Calculator size={22} />
          </div>
          <div style={{ fontSize: 14, color: '#64748B', marginBottom: 4 }}>
            {resultat.expression} =
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--surga-accent, #D97706)' }}>
            {resultat.formatFCFA}
          </div>
        </div>
      )}

      {/* 5. NAVIGATION DIRECTE */}
      {(resultat.type === 'NAVIGATION' || resultat.type === 'DATA_TRAFIC' || resultat.type === 'DATA_CONCOURS' || resultat.type === 'DATA_METEO') && (
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
            {resultat.message}
          </div>
          <button
            type="button"
            onClick={onValiderAction}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              backgroundColor: '#0F172A',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 10,
              padding: '10px 20px',
              fontSize: 13.5,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <span>Ouvrir dans Surga</span>
            <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
