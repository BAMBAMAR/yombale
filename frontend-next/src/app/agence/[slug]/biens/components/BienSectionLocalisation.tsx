'use client'

import React from 'react'
import { MapPin } from 'lucide-react'

interface BienSectionLocalisationProps {
  ville: string
  onVilleChange: (val: string) => void
  quartier: string
  onQuartierChange: (val: string) => void
  adresse: string
  onAdresseChange: (val: string) => void
}

export default function BienSectionLocalisation({
  ville,
  onVilleChange,
  quartier,
  onQuartierChange,
  adresse,
  onAdresseChange,
}: BienSectionLocalisationProps) {
  return (
    <div className="agence-card" style={{ marginBottom: 0 }}>
      <div className="agence-card-header">
        <div className="agence-card-title">
          <MapPin size={17} color="var(--accent, #C75B00)" />
          Localisation
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <div className="form-group">
          <label className="form-label">Ville *</label>
          <select
            value={ville}
            onChange={e => onVilleChange(e.target.value)}
            className="form-select"
          >
            <option value="Dakar">Dakar</option>
            <option value="Thiès">Thiès</option>
            <option value="Saly">Saly / Mbour</option>
            <option value="Saint-Louis">Saint-Louis</option>
            <option value="Ziguinchor">Ziguinchor</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Quartier</label>
          <input
            type="text"
            placeholder="Ex: Almadies, Ngor, Mermoz, Fann..."
            value={quartier}
            onChange={e => onQuartierChange(e.target.value)}
            className="form-input"
          />
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">Adresse / Rue</label>
        <input
          type="text"
          placeholder="Ex: Rue 10 angle Boulevard..."
          value={adresse}
          onChange={e => onAdresseChange(e.target.value)}
          className="form-input"
        />
      </div>
    </div>
  )
}
