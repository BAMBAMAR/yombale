'use client'

import React from 'react'

interface SurgaKalpeDetteFieldsProps {
  directionDette: 'a_recevoir' | 'a_payer'
  setDirectionDette: (d: 'a_recevoir' | 'a_payer') => void
  tiersNom: string
  setTiersNom: (n: string) => void
  tiersTel: string
  setTiersTel: (t: string) => void
  dateEcheance: string
  setDateEcheance: (d: string) => void
}

export default function SurgaKalpeDetteFields({
  directionDette,
  setDirectionDette,
  tiersNom,
  setTiersNom,
  tiersTel,
  setTiersTel,
  dateEcheance,
  setDateEcheance,
}: SurgaKalpeDetteFieldsProps) {
  return (
    <>
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--surga-text2, #475569)', marginBottom: 6 }}>
          Type d’opération
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <button
            type="button"
            onClick={() => setDirectionDette('a_recevoir')}
            style={{
              padding: '10px 8px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              minHeight: 44,
              border: `1px solid ${directionDette === 'a_recevoir' ? 'var(--surga-emerald, #059669)' : 'var(--surga-border, #E2E8F0)'}`,
              backgroundColor: directionDette === 'a_recevoir' ? 'var(--surga-emerald, #059669)' : '#FFFFFF',
              color: directionDette === 'a_recevoir' ? '#FFFFFF' : 'var(--surga-text2, #475569)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            On me doit (Créance)
          </button>
          <button
            type="button"
            onClick={() => setDirectionDette('a_payer')}
            style={{
              padding: '10px 8px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              minHeight: 44,
              border: `1px solid ${directionDette === 'a_payer' ? 'var(--surga-accent, #D97706)' : 'var(--surga-border, #E2E8F0)'}`,
              backgroundColor: directionDette === 'a_payer' ? 'var(--surga-accent, #D97706)' : '#FFFFFF',
              color: directionDette === 'a_payer' ? '#FFFFFF' : 'var(--surga-text2, #475569)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Je dois (Dette)
          </button>
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--surga-text2, #475569)', marginBottom: 6 }}>
          Nom de la personne ou entreprise *
        </label>
        <input
          type="text"
          required
          placeholder="Ex: Ibrahima Fall"
          value={tiersNom}
          onChange={(e) => setTiersNom(e.target.value)}
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
          Numéro de téléphone (optionnel)
        </label>
        <input
          type="tel"
          inputMode="tel"
          placeholder="Ex: +221 77 000 00 00"
          value={tiersTel}
          onChange={(e) => setTiersTel(e.target.value)}
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
          Date d’échéance prévue (optionnel)
        </label>
        <input
          type="date"
          value={dateEcheance}
          onChange={(e) => setDateEcheance(e.target.value)}
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
  )
}
