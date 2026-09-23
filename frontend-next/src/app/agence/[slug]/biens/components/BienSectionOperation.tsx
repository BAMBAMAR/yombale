'use client'

import React from 'react'
import { Home } from 'lucide-react'

interface ProprietaireOption {
  id: string
  nom: string
  prenom?: string
  telephone?: string
}

interface BienSectionOperationProps {
  operationType: 'location' | 'vente'
  onOperationTypeChange: (op: 'location' | 'vente') => void
  titre: string
  onTitreChange: (val: string) => void
  typeBien: string
  onTypeBienChange: (val: string) => void
  prixLocation: string
  onPrixLocationChange: (val: string) => void
  prixVente: string
  onPrixVenteChange: (val: string) => void
  proprietaires?: ProprietaireOption[]
  proprietaireId?: string
  onProprietaireIdChange?: (val: string) => void
}

export default function BienSectionOperation({
  operationType,
  onOperationTypeChange,
  titre,
  onTitreChange,
  typeBien,
  onTypeBienChange,
  prixLocation,
  onPrixLocationChange,
  prixVente,
  onPrixVenteChange,
  proprietaires = [],
  proprietaireId = '',
  onProprietaireIdChange,
}: BienSectionOperationProps) {
  return (
    <div className="agence-card" style={{ marginBottom: 0 }}>
      <div className="agence-card-header">
        <div className="agence-card-title">
          <Home size={17} color="var(--accent, #C75B00)" />
          Opération & Type de bien
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Type d&apos;opération *</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button
            type="button"
            onClick={() => onOperationTypeChange('location')}
            style={{
              padding: '12px',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 13.5,
              cursor: 'pointer',
              border: '1.5px solid',
              borderColor: operationType === 'location' ? 'var(--accent, #C75B00)' : 'var(--border, #E8DDD2)',
              background: operationType === 'location' ? 'rgba(199, 91, 0, 0.08)' : '#FFFFFF',
              color: operationType === 'location' ? 'var(--accent, #C75B00)' : 'var(--navy, #1C2B4A)',
              minHeight: 46,
            }}
          >
            Location
          </button>
          <button
            type="button"
            onClick={() => onOperationTypeChange('vente')}
            style={{
              padding: '12px',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 13.5,
              cursor: 'pointer',
              border: '1.5px solid',
              borderColor: operationType === 'vente' ? 'var(--accent, #C75B00)' : 'var(--border, #E8DDD2)',
              background: operationType === 'vente' ? 'rgba(199, 91, 0, 0.08)' : '#FFFFFF',
              color: operationType === 'vente' ? 'var(--accent, #C75B00)' : 'var(--navy, #1C2B4A)',
              minHeight: 46,
            }}
          >
            Vente
          </button>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Titre du bien *</label>
        <input
          type="text"
          required
          placeholder="Ex: Villa F5 Standing avec Jardin - Almadies"
          value={titre}
          onChange={e => onTitreChange(e.target.value)}
          className="form-input"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <div className="form-group">
          <label className="form-label">Type de bien *</label>
          <select
            value={typeBien}
            onChange={e => onTypeBienChange(e.target.value)}
            className="form-select"
          >
            <option value="appartement">Appartement</option>
            <option value="villa">Villa / Maison</option>
            <option value="studio">Studio / Chambre</option>
            <option value="terrain">Terrain</option>
            <option value="bureau">Bureau / Local commercial</option>
            <option value="immeuble">Immeuble entier</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">
            {operationType === 'location' ? 'Loyer mensuel (FCFA) *' : 'Prix de vente (FCFA) *'}
          </label>
          <input
            type="number"
            required
            placeholder={operationType === 'location' ? '450000' : '85000000'}
            value={operationType === 'location' ? prixLocation : prixVente}
            onChange={e =>
              operationType === 'location'
                ? onPrixLocationChange(e.target.value)
                : onPrixVenteChange(e.target.value)
            }
            className="form-input"
          />
        </div>
      </div>

      {/* Bailleur / Propriétaire associé */}
      <div className="form-group" style={{ marginTop: 14 }}>
        <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Bailleur / Propriétaire mandant (optionnel)</span>
          {proprietaireId && (
            <span style={{ fontSize: 11, color: 'var(--price, #0A5C36)', fontWeight: 700 }}>
              Bailleur associé
            </span>
          )}
        </label>
        <select
          value={proprietaireId}
          onChange={e => onProprietaireIdChange?.(e.target.value)}
          className="form-select"
        >
          <option value="">-- Aucun (Gestion directe agence / Mandat en attente) --</option>
          {proprietaires.map(p => (
            <option key={p.id} value={p.id}>
              {p.nom} {p.prenom || ''} {p.telephone ? `(${p.telephone})` : ''}
            </option>
          ))}
        </select>
        <span style={{ fontSize: 11.5, color: '#64748B', display: 'block', marginTop: 4 }}>
          L&apos;association à un bailleur permet l&apos;imputation comptable automatique des loyers et l&apos;édition des quittances et états de gestion.
        </span>
      </div>
    </div>
  )
}
