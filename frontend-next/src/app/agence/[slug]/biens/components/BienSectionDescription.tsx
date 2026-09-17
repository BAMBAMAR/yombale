'use client'

import React from 'react'
import { FileText } from 'lucide-react'

interface BienSectionDescriptionProps {
  description: string
  onDescriptionChange: (val: string) => void
  notesInternes: string
  onNotesInternesChange: (val: string) => void
}

export default function BienSectionDescription({
  description,
  onDescriptionChange,
  notesInternes,
  onNotesInternesChange,
}: BienSectionDescriptionProps) {
  return (
    <div className="agence-card" style={{ marginBottom: 0 }}>
      <div className="agence-card-header">
        <div className="agence-card-title">
          <FileText size={17} color="var(--accent, #C75B00)" />
          Description & Notes Internes
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Description commerciale (Visible par les clients)</label>
        <textarea
          rows={3}
          placeholder="Décrivez les atouts majeurs, luminosité, proximité des écoles/commerces, finitions..."
          value={description}
          onChange={e => onDescriptionChange(e.target.value)}
          className="form-textarea"
        />
      </div>
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">Notes internes privées (Visible uniquement par l&apos;agence)</label>
        <input
          type="text"
          placeholder="Ex: Coordonnées du gardien, code d'accès, historique négociations..."
          value={notesInternes}
          onChange={e => onNotesInternesChange(e.target.value)}
          className="form-input"
        />
      </div>
    </div>
  )
}
