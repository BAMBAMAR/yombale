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
        border: '1px solid var(--surga-border, #E2E8F0)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--surga-primary, #0F172A)' }}>
          Nouvelle dépense
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer le formulaire"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 8,
            minWidth: 40,
            minHeight: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8,
          }}
        >
          <X size={20} color="var(--surga-text2, #475569)" />
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--surga-text2, #475569)', display: 'block', marginBottom: 6 }}>
            Montant en FCFA *
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Ex : 2500"
            value={montant}
            onChange={(e) => setMontant(e.target.value.replace(/[^0-9]/g, ''))}
            required
            autoComplete="off"
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 10,
              border: '1px solid var(--surga-border, #E2E8F0)',
              fontSize: 18,
              fontWeight: 800,
              color: 'var(--surga-emerald, #059669)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--surga-text2, #475569)', display: 'block', marginBottom: 6 }}>
            Catégorie
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {CATEGORIES_DEPENSES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategorie(c)}
                style={{
                  border: '1px solid',
                  borderColor: categorie === c ? 'var(--surga-primary, #0F172A)' : 'var(--surga-border, #E2E8F0)',
                  backgroundColor: categorie === c ? 'var(--surga-primary, #0F172A)' : '#FFFFFF',
                  color: categorie === c ? '#FFFFFF' : 'var(--surga-primary, #0F172A)',
                  padding: '8px 12px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  minHeight: 38,
                  transition: 'all 0.15s ease',
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--surga-text2, #475569)', display: 'block', marginBottom: 6 }}>
              Date
            </label>
            <input
              type="date"
              value={dateDepense}
              onChange={(e) => setDateDepense(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--surga-border, #E2E8F0)',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ flex: 2 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--surga-text2, #475569)', display: 'block', marginBottom: 6 }}>
              Note / Détail (optionnel)
            </label>
            <input
              type="text"
              placeholder="Ex : Taxi Plateau, Courses..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--surga-border, #E2E8F0)',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 16px',
              borderRadius: 10,
              border: '1px solid var(--surga-border, #E2E8F0)',
              backgroundColor: '#FFFFFF',
              color: 'var(--surga-text2, #475569)',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              minHeight: 44,
            }}
          >
            Annuler
          </button>
          <button
            type="submit"
            style={{
              padding: '10px 20px',
              borderRadius: 10,
              border: 'none',
              backgroundColor: 'var(--surga-emerald, #059669)',
              color: '#FFFFFF',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              minHeight: 44,
              boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)',
              transition: 'all 0.15s ease',
            }}
          >
            Valider la dépense
          </button>
        </div>
      </form>
    </div>
  )
}
