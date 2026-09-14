'use client'

import React from 'react'
import { Palette, Check, Sparkles } from 'lucide-react'
import { THEMES_BOUTIQUE, BoutiqueTheme } from '@/lib/boutique-themes'

interface StudioThemeSelectorProps {
  themeActif: string
  onSelectTheme: (theme: BoutiqueTheme) => void
}

export default function StudioThemeSelector({
  themeActif,
  onSelectTheme,
}: StudioThemeSelectorProps) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 16,
        padding: '16px 18px',
        border: '1.5px solid #E2E8F0',
        marginBottom: 16,
      }}
    >
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
            <Palette size={16} style={{ color: '#C75B00' }} />
            <span>Thème visuel de la vitrine</span>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 800,
                color: '#C75B00',
                background: '#FFF3E8',
                padding: '2px 8px',
                borderRadius: 9999,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
              }}
            >
              <Sparkles size={11} /> 5 Thèmes
            </span>
          </h2>
          <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0' }}>
            Choisissez l&apos;ambiance complète de votre vitrine publique (palette, contrastes, coins et typographie).
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12,
        }}
      >
        {THEMES_BOUTIQUE.map((theme) => {
          const isSelected = (themeActif || 'classique') === theme.id
          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => onSelectTheme(theme)}
              style={{
                textAlign: 'left',
                padding: 14,
                borderRadius: 14,
                border: isSelected ? '2px solid #C75B00' : '1.5px solid #E2E8F0',
                background: isSelected ? '#FFFBF8' : '#FFFFFF',
                boxShadow: isSelected ? '0 4px 14px rgba(199, 91, 0, 0.12)' : '0 1px 3px rgba(0,0,0,0.04)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              {/* Header de la carte de thème */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A' }}>
                    {theme.nom}
                  </span>
                  {isSelected && (
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: '#C75B00',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Check size={12} strokeWidth={3} />
                    </span>
                  )}
                </div>

                <p
                  style={{
                    fontSize: 11.5,
                    color: '#64748B',
                    margin: '0 0 12px',
                    lineHeight: 1.4,
                    minHeight: 32,
                  }}
                >
                  {theme.description}
                </p>
              </div>

              {/* Aperçu des pastilles de couleur du thème */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 10px',
                  borderRadius: 10,
                  background: theme.css.background,
                  border: `1px solid ${theme.css.border}`,
                }}
              >
                <span
                  title="Primaire"
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: theme.css.primary,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    display: 'inline-block',
                  }}
                />
                <span
                  title="Sombre"
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: theme.css.primaryDark,
                    display: 'inline-block',
                  }}
                />
                <span
                  title="Texte"
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: theme.css.textPrimary,
                    display: 'inline-block',
                  }}
                />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: theme.css.textPrimary,
                    marginLeft: 'auto',
                  }}
                >
                  {theme.css.borderRadius}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
