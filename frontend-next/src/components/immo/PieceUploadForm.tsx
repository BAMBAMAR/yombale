'use client'

import React, { useState } from 'react'
import { Upload, Loader2 } from 'lucide-react'

export const TYPE_PIECES_OPTIONS = [
  { value: 'cni_recto', label: 'Carte Nationale d\'Identité (Recto)' },
  { value: 'cni_verso', label: 'Carte Nationale d\'Identité (Verso)' },
  { value: 'passeport', label: 'Passeport en cours de validité' },
  { value: 'bulletin_salaire', label: 'Bulletin de salaire / Justificatif de revenus' },
  { value: 'contrat_travail', label: 'Contrat de travail / Attestation d\'emploi' },
  { value: 'justificatif_domicile', label: 'Facture Senelec / Justificatif d\'adresse' },
  { value: 'garant_cni', label: 'Pièce d\'identité du garant' },
  { value: 'autre', label: 'Autre document justificatif' },
]

interface Props {
  uploading: boolean
  onSubmitFile: (file: File, typePiece: string, label: string) => Promise<void>
}

export default function PieceUploadForm({ uploading, onSubmitFile }: Props) {
  const [selectedType, setSelectedType] = useState('cni_recto')
  const [fileToUpload, setFileToUpload] = useState<File | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fileToUpload) return
    const opt = TYPE_PIECES_OPTIONS.find((o) => o.value === selectedType)
    await onSubmitFile(fileToUpload, selectedType, opt?.label || selectedType)
    setFileToUpload(null)
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: '#FAF8F5',
        padding: '14px',
        borderRadius: 14,
        border: '1px dashed var(--border, #E8DDD2)',
        marginBottom: 18,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy, #1C2B4A)', marginBottom: 10 }}>
        Ajouter une nouvelle pièce justificative
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 10 }}>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 4 }}>
            Type de document
          </label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid var(--border, #E8DDD2)',
              fontSize: 12.5,
              background: '#ffffff',
              fontWeight: 600,
            }}
          >
            {TYPE_PIECES_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 4 }}>
            Fichier (PDF, Image JPG/PNG max 15Mo)
          </label>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setFileToUpload(e.target.files?.[0] || null)}
            style={{ width: '100%', fontSize: 12, boxSizing: 'border-box' }}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={uploading || !fileToUpload}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 16px',
          borderRadius: 8,
          background: !fileToUpload || uploading ? '#CBD5E1' : 'var(--navy, #1C2B4A)',
          color: '#ffffff',
          border: 'none',
          fontSize: 12.5,
          fontWeight: 800,
          cursor: !fileToUpload || uploading ? 'not-allowed' : 'pointer',
        }}
      >
        {uploading ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            <span>Envoi en cours...</span>
          </>
        ) : (
          <>
            <Upload size={14} />
            <span>Téléverser la pièce</span>
          </>
        )}
      </button>
    </form>
  )
}
