'use client'

// États du briefing quand le serveur n'a pas répondu (SRG-A3-006) : un message, la date de ce qui est affiché,
// un bouton pour réessayer. Jamais « aucune donnée » quand la donnée n'a pas été reçue.

import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

function dateLisible(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const jour = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' }).format(d)
  const heure = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(d).replace(':', ' h ')
  return `${jour} à ${heure}`
}

const BOUTON: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  minHeight: 40,
  padding: '8px 14px',
  borderRadius: 8,
  border: '1px solid var(--surga-border, #E2E8F0)',
  background: 'var(--surga-surface, #FFFFFF)',
  color: 'var(--surga-primary, #0F172A)',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
  flexShrink: 0,
  whiteSpace: 'nowrap',
}

export function SurgaBriefingIndisponible({ onReessayer }: { onReessayer: () => void }) {
  return (
    <div className="surga-card" role="alert" style={{ borderLeft: '4px solid var(--surga-accent, #D97706)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <AlertTriangle size={18} color="var(--surga-accent-text, #92400E)" style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--surga-primary, #0F172A)' }}>
            Le briefing n’a pas pu être chargé.
          </div>
          <div style={{ fontSize: 13, color: 'var(--surga-text2, #475569)', margin: '4px 0 12px', lineHeight: 1.4 }}>
            Vérifiez votre connexion, puis réessayez. Vos notes, votre agenda et Sama Xaalis restent utilisables.
          </div>
          <button type="button" onClick={onReessayer} style={BOUTON}>
            <RefreshCw size={14} />
            <span>Réessayer</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export function SurgaBriefingNonActualise({ recuLe, enCours, onReessayer }: { recuLe: string; enCours: boolean; onReessayer: () => void }) {
  return (
    <div
      role="status"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        flexWrap: 'wrap',
        padding: '8px 12px',
        marginBottom: 10,
        borderRadius: 8,
        border: '1px solid var(--surga-border, #E2E8F0)',
        background: 'var(--surga-bg, #F8FAFC)',
        fontSize: 12,
        color: 'var(--surga-text2, #475569)',
      }}
    >
      <span>
        Briefing reçu le {dateLisible(recuLe)}. {enCours ? 'Actualisation en cours…' : 'Il n’a pas pu être actualisé.'}
      </span>
      {!enCours && (
        <button type="button" onClick={onReessayer} style={BOUTON}>
          <RefreshCw size={14} />
          <span>Réessayer</span>
        </button>
      )}
    </div>
  )
}
