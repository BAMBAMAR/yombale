'use client'

import React from 'react'
import { Building2, X, AlertCircle } from 'lucide-react'

interface ModalCreerAgenceProps {
  isOpen: boolean
  onClose: () => void
  formData: {
    nom: string
    ville: string
    quartier: string
    telephone: string
    whatsapp: string
    description: string
  }
  setFormData: React.Dispatch<
    React.SetStateAction<{
      nom: string
      ville: string
      quartier: string
      telephone: string
      whatsapp: string
      description: string
    }>
  >
  onSubmit: (e: React.FormEvent) => void
  creating: boolean
  formError: string | null
}

export function ModalCreerAgence({
  isOpen,
  onClose,
  formData,
  setFormData,
  onSubmit,
  creating,
  formError,
}: ModalCreerAgenceProps) {
  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(28, 43, 74, 0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 14,
          maxWidth: 520,
          width: '100%',
          padding: 24,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'rgba(199, 91, 0, 0.1)',
                color: 'var(--accent, #C75B00)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Building2 size={20} />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
              Créer une agence immobilière
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 20,
              color: '#94A3B8',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {formError && (
          <div
            style={{
              padding: '10px 14px',
              background: '#FEE2E2',
              color: '#991B1B',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 16,
            }}
          >
            <AlertCircle size={16} />
            {formError}
          </div>
        )}

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label className="form-label">Nom de l'agence *</label>
            <input
              type="text"
              required
              placeholder="Ex: Teranga Immo, Almadies Prestige..."
              value={formData.nom}
              onChange={e => setFormData(prev => ({ ...prev, nom: e.target.value }))}
              className="form-input"
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Ville *</label>
              <select
                value={formData.ville}
                onChange={e => setFormData(prev => ({ ...prev, ville: e.target.value }))}
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
                placeholder="Ex: Almadies, Mermoz, Plateau..."
                value={formData.quartier}
                onChange={e => setFormData(prev => ({ ...prev, quartier: e.target.value }))}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Téléphone</label>
              <input
                type="tel"
                placeholder="+221 77 000 00 00"
                value={formData.telephone}
                onChange={e => setFormData(prev => ({ ...prev, telephone: e.target.value }))}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">WhatsApp Pro</label>
              <input
                type="tel"
                placeholder="+221 77 000 00 00"
                value={formData.whatsapp}
                onChange={e => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Brève description</label>
            <textarea
              rows={3}
              placeholder="Spécialiste de la location et vente résidentielle à Dakar..."
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="form-textarea"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <button
              type="button"
              onClick={onClose}
              className="agence-btn-secondary"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={creating}
              className="agence-btn-primary"
            >
              {creating ? 'Création...' : 'Créer mon agence'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
