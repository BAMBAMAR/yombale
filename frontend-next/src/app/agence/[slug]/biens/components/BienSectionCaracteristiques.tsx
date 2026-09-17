'use client'

import React from 'react'
import { Sliders } from 'lucide-react'
import BienCommoditesSelector, { CommoditesState } from './BienCommoditesSelector'

interface BienSectionCaracteristiquesProps {
  surfaceM2: string
  onSurfaceM2Change: (val: string) => void
  nbPieces: string
  onNbPiecesChange: (val: string) => void
  nbChambres: string
  onNbChambresChange: (val: string) => void
  nbSdb: string
  onNbSdbChange: (val: string) => void
  etage: string
  onEtageChange: (val: string) => void
  statutOccupation: string
  onStatutOccupationChange: (val: string) => void
  commodites: CommoditesState
  onCommoditeChange: (key: keyof CommoditesState, checked: boolean) => void
}

export default function BienSectionCaracteristiques({
  surfaceM2,
  onSurfaceM2Change,
  nbPieces,
  onNbPiecesChange,
  nbChambres,
  onNbChambresChange,
  nbSdb,
  onNbSdbChange,
  etage,
  onEtageChange,
  statutOccupation,
  onStatutOccupationChange,
  commodites,
  onCommoditeChange,
}: BienSectionCaracteristiquesProps) {
  return (
    <div className="agence-card" style={{ marginBottom: 0 }}>
      <div className="agence-card-header">
        <div className="agence-card-title">
          <Sliders size={17} color="var(--accent, #C75B00)" />
          Caractéristiques & Équipements
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 10 }}>
        <div className="form-group">
          <label className="form-label">Surface (m²)</label>
          <input
            type="number"
            placeholder="120"
            value={surfaceM2}
            onChange={e => onSurfaceM2Change(e.target.value)}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Pièces</label>
          <input
            type="number"
            value={nbPieces}
            onChange={e => onNbPiecesChange(e.target.value)}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Chambres</label>
          <input
            type="number"
            value={nbChambres}
            onChange={e => onNbChambresChange(e.target.value)}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label className="form-label">SDB / Toilettes</label>
          <input
            type="number"
            value={nbSdb}
            onChange={e => onNbSdbChange(e.target.value)}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Étage</label>
          <input
            type="number"
            placeholder="ex: 2"
            value={etage}
            onChange={e => onEtageChange(e.target.value)}
            className="form-input"
          />
        </div>
      </div>

      <div className="form-group" style={{ marginTop: 6 }}>
        <label className="form-label">Statut d&apos;occupation</label>
        <select
          value={statutOccupation}
          onChange={e => onStatutOccupationChange(e.target.value)}
          className="form-select"
        >
          <option value="disponible">Disponible immédiatement</option>
          <option value="loue">Loué (Bail actif)</option>
          <option value="sous_compromis">Sous compromis / offre</option>
          <option value="vendu">Vendu</option>
          <option value="travaux">En rénovation / travaux</option>
        </select>
      </div>

      <BienCommoditesSelector
        values={commodites}
        onChange={onCommoditeChange}
      />
    </div>
  )
}
