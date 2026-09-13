'use client'

import React from 'react'
import { Layers } from 'lucide-react'
import { CATEGORIES } from '@/lib/categories'
import { STYLES_PRESETS } from './constants'
import type { StylePreset } from './types'

interface StudioPresetAndCategoryProps {
  categorie: string
  setCategorie: (cat: string) => void
  styleActif: string
  couleurTheme: string
  onAppliquerPresetStyle: (preset: StylePreset) => void
}

export default function StudioPresetAndCategory({
  categorie,
  setCategorie,
  styleActif,
  couleurTheme,
  onAppliquerPresetStyle,
}: StudioPresetAndCategoryProps) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: '16px 18px', border: '1.5px solid #E2E8F0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <h2
            style={{
              fontSize: 15,
              fontWeight: 850,
              color: '#0F172A',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Layers size={16} style={{ color: couleurTheme }} />
            <span>1. Secteur d&apos;activité &amp; Style de la boutique</span>
          </h2>
          <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0' }}>
            Nopalou calibre automatiquement vos couleurs, boutons et ambiance visuelle.
          </p>
        </div>
      </div>

      {/* ── SÉLECTEUR DE CATÉGORIE MÉTIER DE LA BOUTIQUE ── */}
      <div
        style={{
          background: '#F8FAFC',
          borderRadius: 14,
          padding: '14px 16px',
          border: '1.5px solid #E2E8F0',
          marginBottom: 16,
        }}
      >
        <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>
          Secteur d&apos;activité principal de votre boutique
        </label>
        <select
          value={categorie}
          onChange={(e) => setCategorie(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: 10,
            border: '1.5px solid #CBD5E1',
            fontSize: 13,
            fontWeight: 700,
            color: '#0F172A',
            background: '#FFFFFF',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          {CATEGORIES.filter((c) => !['annonces', 'immo'].includes(c.value)).map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <p style={{ fontSize: 11.5, color: '#64748B', margin: '6px 0 0', lineHeight: 1.4 }}>
          Définit votre classement sur la marketplace Nopalou et adapte automatiquement les modèles de bannières
          suggérés ci-dessous.
        </p>
      </div>

      <div className="studio-presets-grid">
        {STYLES_PRESETS.map((preset) => {
          const isSelected = styleActif === preset.id
          const PresetIcon = preset.icon
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onAppliquerPresetStyle(preset)}
              style={{
                textAlign: 'left',
                padding: 12,
                borderRadius: 12,
                border: isSelected ? `2px solid ${preset.couleurTheme}` : '1.5px solid #E2E8F0',
                background: isSelected ? '#FAFCFF' : '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                position: 'relative',
                boxShadow: isSelected ? '0 3px 12px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <PresetIcon size={18} style={{ color: preset.couleurTheme }} />
                <span
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: preset.couleurTheme,
                    display: 'inline-block',
                    border: '1.5px solid #fff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }}
                />
              </div>
              <p
                style={{
                  margin: 0,
                  fontWeight: 850,
                  fontSize: 13,
                  color: isSelected ? preset.couleurTheme : '#1E293B',
                }}
              >
                {preset.nom}
              </p>
              <span style={{ fontSize: 10.5, color: '#64748B', lineHeight: 1.3 }}>{preset.description}</span>
              <span
                style={{
                  fontSize: 9.5,
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: 6,
                  background: isSelected ? preset.couleurTheme : '#F1F5F9',
                  color: isSelected ? '#ffffff' : '#64748B',
                  alignSelf: 'flex-start',
                  marginTop: 'auto',
                }}
              >
                {preset.badge}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
