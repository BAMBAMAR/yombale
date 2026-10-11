'use client'

import React from 'react'
import { X } from 'lucide-react'
import SurgaMeteoCard from './SurgaMeteoCard'
import type { MeteoData } from '@/lib/surga-meteo'

// Fenêtre météo de la colonne de droite (ordinateur).
// Sur ordinateur la carte météo de l'écran Aujourd'hui est masquée (SRG-UI-05, un seul exemplaire des blocs de
// contexte) ; le clic sur le widget de la colonne de droite renvoyait vers cet écran, déjà affiché : rien ne s'ouvrait.
// La fenêtre montre la même carte : température, détail du jour, prévisions, changement de localité et position.

interface Props {
  ville: string
  meteo?: MeteoData | null
  onClose: () => void
  onVilleChange?: (nouvelleVille: string) => void
}

export default function SurgaMeteoFenetre({ ville, meteo, onClose, onVilleChange }: Props) {
  return (
    <div
      data-surga-fenetre="Météo"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 560,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxSizing: 'border-box',
          backgroundColor: 'var(--surga-bg, #F8FAFC)',
          borderRadius: 16,
          padding: 16,
          boxShadow: '0 20px 50px rgba(15, 23, 42, 0.35)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--surga-text1, #0F172A)' }}>Météo</h2>
          <button
            type="button"
            aria-label="Fermer la météo"
            onClick={onClose}
            style={{
              width: 40,
              height: 40,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--surga-border, #E2E8F0)',
              borderRadius: 10,
              backgroundColor: '#FFFFFF',
              color: 'var(--surga-text1, #0F172A)',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>
        <SurgaMeteoCard initialMeteo={meteo} ville={ville} onVilleChange={onVilleChange} />
      </div>
    </div>
  )
}
