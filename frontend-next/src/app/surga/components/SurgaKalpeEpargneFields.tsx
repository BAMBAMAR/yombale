'use client'

import React from 'react'
import type { KalpeObjectifLocal } from '@/lib/surga-kalpe'

interface SurgaKalpeEpargneFieldsProps {
  typeActionEpargne: 'verser' | 'creer'
  setTypeActionEpargne: (t: 'verser' | 'creer') => void
  objectifsExistants: KalpeObjectifLocal[]
  objectifSelectionneId: string
  setObjectifSelectionneId: (id: string) => void
  titreNouvelObjectif: string
  setTitreNouvelObjectif: (t: string) => void
  montantCibleNouvelObjectif: string
  setMontantCibleNouvelObjectif: (m: string) => void
}

export default function SurgaKalpeEpargneFields({
  typeActionEpargne,
  setTypeActionEpargne,
  objectifsExistants,
  objectifSelectionneId,
  setObjectifSelectionneId,
  titreNouvelObjectif,
  setTitreNouvelObjectif,
  montantCibleNouvelObjectif,
  setMontantCibleNouvelObjectif,
}: SurgaKalpeEpargneFieldsProps) {
  return (
    <>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          onClick={() => setTypeActionEpargne('verser')}
          style={{
            flex: 1,
            padding: '10px 8px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            minHeight: 44,
            border: `1px solid ${typeActionEpargne === 'verser' ? '#2563EB' : 'var(--surga-border, #E2E8F0)'}`,
            backgroundColor: typeActionEpargne === 'verser' ? '#2563EB' : '#FFFFFF',
            color: typeActionEpargne === 'verser' ? '#FFFFFF' : 'var(--surga-text2, #475569)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          Ajouter un versement
        </button>
        <button
          type="button"
          onClick={() => setTypeActionEpargne('creer')}
          style={{
            flex: 1,
            padding: '10px 8px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            minHeight: 44,
            border: `1px solid ${typeActionEpargne === 'creer' ? '#2563EB' : 'var(--surga-border, #E2E8F0)'}`,
            backgroundColor: typeActionEpargne === 'creer' ? '#2563EB' : '#FFFFFF',
            color: typeActionEpargne === 'creer' ? '#FFFFFF' : 'var(--surga-text2, #475569)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          Créer un objectif
        </button>
      </div>

      {typeActionEpargne === 'verser' ? (
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--surga-text2, #475569)', marginBottom: 6 }}>
            Sélectionner l’objectif *
          </label>
          <select
            value={objectifSelectionneId}
            onChange={(e) => setObjectifSelectionneId(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: 14,
              borderRadius: 8,
              border: '1px solid var(--surga-border, #E2E8F0)',
              backgroundColor: '#FFFFFF',
              boxSizing: 'border-box',
            }}
          >
            {objectifsExistants.length === 0 ? (
              <option value="">Aucun objectif existant (cliquez sur Créer)</option>
            ) : (
              objectifsExistants.map((obj) => (
                <option key={obj.id} value={obj.id}>
                  {obj.titre} (Cible: {obj.montant_cible.toLocaleString('fr-FR')} FCFA)
                </option>
              ))
            )}
          </select>
        </div>
      ) : (
        <>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--surga-text2, #475569)', marginBottom: 6 }}>
              Titre de l’objectif *
            </label>
            <input
              type="text"
              placeholder="Ex: Achat matériel, Tabaski, Permis..."
              value={titreNouvelObjectif}
              onChange={(e) => setTitreNouvelObjectif(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: 14,
                borderRadius: 8,
                border: '1px solid var(--surga-border, #E2E8F0)',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--surga-text2, #475569)', marginBottom: 6 }}>
              Montant cible total (FCFA) *
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Ex: 300000"
              value={montantCibleNouvelObjectif}
              onChange={(e) => setMontantCibleNouvelObjectif(e.target.value.replace(/[^0-9]/g, ''))}
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: 14,
                borderRadius: 8,
                border: '1px solid var(--surga-border, #E2E8F0)',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </>
      )}
    </>
  )
}
