'use client'

import React from 'react'
import { Send, X } from 'lucide-react'
import type { AxeTraficDetail } from './SurgaTraficModal'

interface SurgaTraficReportFormProps {
  axes: AxeTraficDetail[]
  axeSelectionne: string
  typeSignalement: string
  commentaire: string
  envoiEnCours: boolean
  onAxeChange: (axeId: string) => void
  onTypeChange: (type: string) => void
  onCommentaireChange: (val: string) => void
  onSubmit: (e: React.FormEvent) => void
  onAnnuler?: () => void
}

export default function SurgaTraficReportForm({
  axes,
  axeSelectionne,
  typeSignalement,
  commentaire,
  envoiEnCours,
  onAxeChange,
  onTypeChange,
  onCommentaireChange,
  onSubmit,
  onAnnuler,
}: SurgaTraficReportFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      style={{
        backgroundColor: 'var(--bg, #F8F5F0)',
        padding: '10px 12px',
        borderRadius: 8,
        marginBottom: 8,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        border: '1px solid var(--border, #E8DDD2)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
          Signaler une condition sur un axe
        </div>
        {onAnnuler && (
          <button
            type="button"
            onClick={onAnnuler}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text3, #73675E)',
              cursor: 'pointer',
              padding: 2,
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        <select
          value={axeSelectionne}
          onChange={(e) => onAxeChange(e.target.value)}
          style={{
            flex: 1,
            padding: '6px 8px',
            fontSize: 12,
            borderRadius: 6,
            border: '1px solid var(--border, #E8DDD2)',
            backgroundColor: '#FFFFFF',
            outline: 'none',
          }}
        >
          {axes.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nom.split('(')[0].trim()}
            </option>
          ))}
        </select>

        <select
          value={typeSignalement}
          onChange={(e) => onTypeChange(e.target.value)}
          style={{
            padding: '6px 8px',
            fontSize: 12,
            borderRadius: 6,
            border: '1px solid var(--border, #E8DDD2)',
            backgroundColor: '#FFFFFF',
            outline: 'none',
          }}
        >
          <option value="dense">Ralentissement</option>
          <option value="bloque">Bouché / Bloqué</option>
          <option value="accident">Accident</option>
          <option value="travaux">Travaux</option>
          <option value="fluide">Fluide</option>
        </select>
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        <input
          type="text"
          value={commentaire}
          onChange={(e) => onCommentaireChange(e.target.value)}
          placeholder="Précision (ex : vers péage Thiaroye)..."
          maxLength={180}
          style={{
            flex: 1,
            padding: '6px 10px',
            fontSize: 12,
            borderRadius: 6,
            border: '1px solid var(--border, #E8DDD2)',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={envoiEnCours}
          className="surga-btn-primary"
          style={{ fontSize: 12, padding: '6px 12px', gap: 4 }}
        >
          <Send size={12} />
          <span>Envoyer</span>
        </button>
      </div>
    </form>
  )
}
