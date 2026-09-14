'use client'

import React from 'react'
import { Palette, Wand2, Sliders } from 'lucide-react'
import { PALETTES_POPULAIRES } from './constants'

interface StudioColorsAndButtonsProps {
  couleurTheme: string
  setCouleurTheme: (color: string) => void
  logoExtractedColors: string[]
  formeBoutons: string
  setFormeBoutons: (shape: string) => void
  contrastBtnText: string
}

export default function StudioColorsAndButtons({
  couleurTheme,
  setCouleurTheme,
  logoExtractedColors,
  formeBoutons,
  setFormeBoutons,
  contrastBtnText,
}: StudioColorsAndButtonsProps) {
  return (
    <>
      {/* BLOC 2 : COULEUR SUR-MESURE & LOGO */}
      <div style={{ background: '#fff', borderRadius: 16, padding: '16px 18px', border: '1.5px solid #E2E8F0' }}>
        <h2
          style={{
            fontSize: 15,
            fontWeight: 850,
            color: '#0F172A',
            margin: '0 0 4px',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Palette size={16} style={{ color: couleurTheme }} />
          <span>2. Couleur principale de votre marque</span>
        </h2>
        <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 14px' }}>
          Appliquée automatiquement sur vos boutons d&apos;achat, onglets, badges et prix.
        </p>

        {/* Détection automatique depuis le Logo */}
        {logoExtractedColors.length > 0 && (
          <div
            style={{
              background: '#F8FAFC',
              border: '1.5px solid #E2E8F0',
              borderRadius: 12,
              padding: '12px 14px',
              marginBottom: 14,
            }}
          >
            <p
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: '#0F172A',
                margin: '0 0 8px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Wand2 size={14} style={{ color: '#C75B00' }} />
              <span>Couleurs détectées dans votre logo :</span>
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              {logoExtractedColors.map((hex, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCouleurTheme(hex)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 20,
                    border:
                      couleurTheme.toLowerCase() === hex.toLowerCase() ? '2px solid #0F172A' : '1px solid #CBD5E1',
                    background: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 11.5,
                    fontWeight: 750,
                  }}
                >
                  <span
                    style={{ width: 14, height: 14, borderRadius: '50%', background: hex, display: 'inline-block' }}
                  />
                  <span>{hex.toUpperCase()}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Nuancier rapide */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
          {PALETTES_POPULAIRES.map((p) => {
            const isSelected = couleurTheme.toLowerCase() === p.hex.toLowerCase()
            return (
              <button
                key={p.hex}
                type="button"
                title={p.nom}
                onClick={() => setCouleurTheme(p.hex)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: p.hex,
                  border: isSelected ? '3px solid #ffffff' : '1.5px solid rgba(0,0,0,0.1)',
                  boxShadow: isSelected ? `0 0 0 2.5px ${p.hex}` : '0 1px 3px rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: 14,
                  fontWeight: 900,
                }}
              >
                {isSelected && '✓'}
              </button>
            )
          })}
        </div>

        {/* Sélecteur personnalisé HEX */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="color"
              value={couleurTheme}
              onChange={(e) => setCouleurTheme(e.target.value)}
              style={{ width: 44, height: 38, borderRadius: 8, border: '1px solid #D1D5DB', cursor: 'pointer', padding: 2 }}
            />
            <input
              type="text"
              value={couleurTheme}
              onChange={(e) => setCouleurTheme(e.target.value)}
              maxLength={7}
              placeholder="#C75B00"
              style={{
                width: 100,
                height: 38,
                borderRadius: 8,
                border: '1px solid #D1D5DB',
                padding: '0 10px',
                fontSize: 13,
                fontWeight: 700,
                fontFamily: 'monospace',
              }}
            />
          </div>
          <span style={{ fontSize: 12, color: '#64748B' }}>Couleur personnalisée (Code Hex)</span>
        </div>
      </div>

      {/* BLOC 5 : FORME DES BOUTONS */}
      <div style={{ background: '#fff', borderRadius: 16, padding: '16px 18px', border: '1.5px solid #E2E8F0' }}>
        <h2
          style={{
            fontSize: 15,
            fontWeight: 850,
            color: '#0F172A',
            margin: '0 0 4px',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Sliders size={16} style={{ color: couleurTheme }} />
          <span>Forme des boutons &amp; Ergonomie</span>
        </h2>
        <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 14px' }}>
          Harmonisez l&apos;ergonomie visuelle de vos boutons de commande.
        </p>

        <div className="studio-buttons-grid">
          {[
            { id: 'squircle', nom: 'Squircle (Doux)', radius: '10px' },
            { id: 'pill', nom: 'Pilule (Rond)', radius: '999px' },
            { id: 'arrondi', nom: 'Arrondi standard', radius: '14px' },
            { id: 'droit', nom: 'Droit (Moderne)', radius: '4px' },
          ].map((f) => {
            const isSelected = formeBoutons === f.id
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFormeBoutons(f.id)}
                style={{
                  padding: '10px 8px',
                  borderRadius: f.radius,
                  border: isSelected ? `2px solid ${couleurTheme}` : '1.5px solid #E2E8F0',
                  background: isSelected ? couleurTheme : '#F8FAFC',
                  color: isSelected ? contrastBtnText : '#1E293B',
                  fontWeight: 800,
                  fontSize: 12,
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                {f.nom}
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}
