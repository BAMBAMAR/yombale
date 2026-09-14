'use client'

import React from 'react'
import { Plus } from 'lucide-react'

interface MotifOption {
  id: string
  label: string
  icon: React.ComponentType<any>
}

interface PosTiroirMouvementFormProps {
  tab: 'sortie' | 'entree'
  montant: string
  setMontant: (m: string) => void
  motifSelectionne: string
  setMotifSelectionne: (m: string) => void
  motifPersonnalise: string
  setMotifPersonnalise: (m: string) => void
  beneficiaire: string
  setBeneficiaire: (b: string) => void
  submitting: boolean
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  fcfa: (val: number) => string
  motifsSortie: MotifOption[]
  motifsEntree: MotifOption[]
  montantsRapides: number[]
}

export default function PosTiroirMouvementForm({
  tab,
  montant,
  setMontant,
  motifSelectionne,
  setMotifSelectionne,
  motifPersonnalise,
  setMotifPersonnalise,
  beneficiaire,
  setBeneficiaire,
  submitting,
  onClose,
  onSubmit,
  fcfa,
  motifsSortie,
  motifsEntree,
  montantsRapides,
}: PosTiroirMouvementFormProps) {
  const isSortie = tab === 'sortie'

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Montant */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
          Montant en FCFA *
        </label>
        <input
          type="number"
          min={100}
          step={50}
          required
          autoFocus
          placeholder="Ex: 2500"
          value={montant}
          onChange={(e) => setMontant(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: 10,
            border: '1.5px solid #cbd5e1',
            fontSize: 18,
            fontWeight: 900,
            textAlign: 'center',
            boxSizing: 'border-box',
            outline: 'none',
          }}
        />
      </div>

      {/* Raccourcis montants rapides */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {montantsRapides.map((mt) => (
          <button
            key={mt}
            type="button"
            onClick={() => setMontant(String(mt))}
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              background: montant === String(mt) ? '#0f172a' : '#f1f5f9',
              color: montant === String(mt) ? '#ffffff' : '#334155',
              border: '1px solid #e2e8f0',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            +{fcfa(mt)}
          </button>
        ))}
      </div>

      {/* Motifs fréquents */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
          Motif de l&apos;opération *
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {(isSortie ? motifsSortie : motifsEntree).map((item) => {
            const Icon = item.icon
            const isSelected = motifSelectionne === item.label
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setMotifSelectionne(item.label)}
                style={{
                  padding: '10px',
                  borderRadius: 10,
                  border: isSelected
                    ? isSortie
                      ? '2px solid #ea580c'
                      : '2px solid #0A5C36'
                    : '1px solid #e2e8f0',
                  background: isSelected ? (isSortie ? '#fffaf5' : '#f0fdf4') : '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  textAlign: 'left',
                  boxSizing: 'border-box',
                }}
              >
                <Icon size={16} color={isSelected ? (isSortie ? '#ea580c' : '#0A5C36') : '#64748b'} />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: isSelected ? 800 : 600,
                    color: isSelected ? '#0f172a' : '#475569',
                    lineHeight: 1.25,
                  }}
                >
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Motif personnalisé / Détails */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
          Précisions ou commentaire libre (facultatif)
        </label>
        <input
          type="text"
          maxLength={140}
          placeholder="Ex: Livreur Mamadou - Course Ouakam"
          value={motifPersonnalise}
          onChange={(e) => setMotifPersonnalise(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid #cbd5e1',
            fontSize: 13,
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Bénéficiaire */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
          Bénéficiaire / Destinataire (facultatif)
        </label>
        <input
          type="text"
          maxLength={80}
          placeholder="Ex: Moussa Diop (Tiak-Tiak) - 77 123 45 67"
          value={beneficiaire}
          onChange={(e) => setBeneficiaire(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid #cbd5e1',
            fontSize: 13,
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Boutons d'action */}
      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        <button
          type="button"
          onClick={onClose}
          style={{
            flex: 1,
            padding: '12px',
            background: '#f1f5f9',
            color: '#475569',
            border: '1px solid #cbd5e1',
            borderRadius: 10,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={submitting}
          style={{
            flex: 1.5,
            padding: '12px',
            background: isSortie ? '#ea580c' : '#0A5C36',
            color: '#ffffff',
            border: 'none',
            borderRadius: 10,
            fontWeight: 900,
            fontSize: 13.5,
            cursor: submitting ? 'not-allowed' : 'pointer',
            opacity: submitting ? 0.7 : 1,
            boxShadow: isSortie ? '0 4px 12px rgba(234,88,12,0.25)' : '0 4px 12px rgba(10,92,54,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <Plus size={16} />
          <span>
            {submitting
              ? 'Enregistrement...'
              : isSortie
              ? "Valider la Sortie d'espèces"
              : "Valider l'Entrée d'espèces"}
          </span>
        </button>
      </div>
    </form>
  )
}
