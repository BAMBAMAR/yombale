'use client'

import React from 'react'
import { Calculator } from 'lucide-react'

interface SimulateurHonorairesImmoProps {
  typeFacture: string
  baseCalcul: string
  setBaseCalcul: (val: string) => void
  tauxCommission: string
  setTauxCommission: (val: string) => void
  onCalculer: () => void
}

export default function SimulateurHonorairesImmo({
  typeFacture,
  baseCalcul,
  setBaseCalcul,
  tauxCommission,
  setTauxCommission,
  onCalculer,
}: SimulateurHonorairesImmoProps) {
  if (typeFacture !== 'honoraires_vente' && typeFacture !== 'gestion_locative') {
    return null
  }

  const isVente = typeFacture === 'honoraires_vente'

  return (
    <div
      style={{
        padding: 12,
        background: '#F8FAFC',
        borderRadius: 8,
        border: '1px solid #E2E8F0',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 12,
          fontWeight: 700,
          color: 'var(--navy, #1C2B4A)',
          marginBottom: 8,
        }}
      >
        <Calculator size={14} color="var(--accent, #C75B00)" />
        <span>Simulateur d'Honoraires Agence ({isVente ? 'Transaction / Vente' : 'Gestion Locative'})</span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr auto',
          gap: 8,
          alignItems: 'center',
        }}
      >
        <div>
          <label style={{ display: 'block', fontSize: 11, color: '#64748B', marginBottom: 2 }}>
            {isVente ? 'Prix de vente acte (FCFA)' : 'Total loyers encaissés (FCFA)'}
          </label>
          <input
            type="number"
            placeholder={isVente ? 'Ex: 90000000' : 'Ex: 250000'}
            value={baseCalcul}
            onChange={e => setBaseCalcul(e.target.value)}
            style={{
              width: '100%',
              padding: '7px 10px',
              borderRadius: 6,
              border: '1px solid #CBD5E1',
              fontSize: 12.5,
              background: '#FFFFFF',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 11, color: '#64748B', marginBottom: 2 }}>
            Taux commission (%)
          </label>
          <input
            type="number"
            placeholder="Taux %"
            value={tauxCommission}
            onChange={e => setTauxCommission(e.target.value)}
            style={{
              width: '100%',
              padding: '7px 10px',
              borderRadius: 6,
              border: '1px solid #CBD5E1',
              fontSize: 12.5,
              background: '#FFFFFF',
            }}
          />
        </div>

        <div style={{ paddingTop: 16 }}>
          <button
            type="button"
            onClick={onCalculer}
            style={{
              padding: '8px 14px',
              borderRadius: 6,
              background: 'var(--navy, #1C2B4A)',
              color: '#FFF',
              fontSize: 12,
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Calculer HT
          </button>
        </div>
      </div>
    </div>
  )
}
