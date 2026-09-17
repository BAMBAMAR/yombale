'use client'

import React from 'react'
import { DollarSign } from 'lucide-react'

interface BienSectionFinancesProps {
  charges: string
  onChargesChange: (val: string) => void
  depotGarantie: string
  onDepotGarantieChange: (val: string) => void
}

export default function BienSectionFinances({
  charges,
  onChargesChange,
  depotGarantie,
  onDepotGarantieChange,
}: BienSectionFinancesProps) {
  return (
    <div className="agence-card" style={{ marginBottom: 0 }}>
      <div className="agence-card-header">
        <div className="agence-card-title">
          <DollarSign size={17} color="var(--accent, #C75B00)" />
          Conditions Financières (Location)
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Charges mensuelles (FCFA)</label>
          <input
            type="number"
            placeholder="Ex: 25000"
            value={charges}
            onChange={e => onChargesChange(e.target.value)}
            className="form-input"
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Dépôt de garantie / Caution (FCFA)</label>
          <input
            type="number"
            placeholder="Ex: 900000"
            value={depotGarantie}
            onChange={e => onDepotGarantieChange(e.target.value)}
            className="form-input"
          />
        </div>
      </div>
    </div>
  )
}
