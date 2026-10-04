'use client'

import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'

export const CATEGORIES_DEPENSES = [
  'Alimentation',
  'Transport',
  'Logement',
  'Santé',
  'Factures',
  'Loisirs',
  'Autre',
]

interface SurgaDepenseFormProps {
  initialMontant?: string
  onClose: () => void
  onSubmit: (data: {
    montant: number
    categorie: string
    dateDepense: string
    note?: string
  }) => void
}

export default function SurgaDepenseForm({
  initialMontant = '',
  onClose,
  onSubmit,
}: SurgaDepenseFormProps) {
  const [montant, setMontant] = useState<string>(initialMontant)
  const [categorie, setCategorie] = useState<string>('Alimentation')
  const [dateDepense, setDateDepense] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  )
  const [note, setNote] = useState<string>('')

  useEffect(() => {
    if (initialMontant) {
      setMontant(initialMontant)
    }
  }, [initialMontant])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const val = parseInt(montant, 10)
    if (!val || Number.isNaN(val) || val <= 0) return

    onSubmit({
      montant: val,
      categorie,
      dateDepense,
      note: note.trim() || undefined,
    })
  }

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 16,
        border: '1px solid var(--border, #E8DDD2)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
          Nouvelle dépense
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer le formulaire"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
        >
          <X size={18} color="var(--text2, #5A4E42)" />
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2, #5A4E42)', display: 'block', marginBottom: 4 }}>
            Montant en FCFA *
          </label>
          <input
            type="number"
            placeholder="Ex : 2500"
            value={montant}
            onChange={(e) => setMontant(e.target.value)}
            required
            min="1"
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid var(--border, #E8DDD2)',
              fontSize: 16,
              fontWeight: 700,
              color: 'var(--price, #0A5C36)',
              outline: 'none',
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2, #5A4E42)', display: 'block', marginBottom: 4 }}>
            Catégorie
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {CATEGORIES_DEPENSES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategorie(c)}
                style={{
                  border: '1px solid',
                  borderColor: categorie === c ? 'var(--navy, #1C2B4A)' : 'var(--border, #E8DDD2)',
                  backgroundColor: categorie === c ? 'var(--navy, #1C2B4A)' : '#FFFFFF',
                  color: categorie === c ? '#FFFFFF' : 'var(--navy, #1C2B4A)',
                  padding: '6px 10px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2, #5A4E42)', display: 'block', marginBottom: 4 }}>
              Date
            </label>
            <input
              type="date"
              value={dateDepense}
              onChange={(e) => setDateDepense(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid var(--border, #E8DDD2)',
                fontSize: 13,
                outline: 'none',
              }}
            />
          </div>

          <div style={{ flex: 2 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2, #5A4E42)', display: 'block', marginBottom: 4 }}>
              Note / Détail (optionnel)
            </label>
            <input
              type="text"
              placeholder="Ex : Taxi Plateau, Courses..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid var(--border, #E8DDD2)',
                fontSize: 13,
                outline: 'none',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid var(--border, #E8DDD2)',
              backgroundColor: '#FFFFFF',
              color: 'var(--text2, #5A4E42)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="btn-npl"
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              backgroundColor: 'var(--price, #0A5C36)',
              color: '#FFFFFF',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Valider la dépense
          </button>
        </div>
      </form>
    </div>
  )
}
