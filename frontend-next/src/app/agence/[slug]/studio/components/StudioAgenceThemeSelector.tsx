'use client';

import React from 'react';
import { Check, Sparkles } from 'lucide-react';
import { THEMES_IMMO_PRESETS } from '../constants';
import type { ThemeImmoPreset } from '../types';

interface StudioAgenceThemeSelectorProps {
  currentThemeId: string;
  onSelectTheme: (theme: ThemeImmoPreset) => void;
}

export default function StudioAgenceThemeSelector({
  currentThemeId,
  onSelectTheme,
}: StudioAgenceThemeSelectorProps) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 14,
        border: '1px solid var(--border, #E8DDD2)',
        padding: 22,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Sparkles size={18} style={{ color: 'var(--accent, #C75B00)' }} />
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
            Thèmes & Styles de Prestige
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#64748B' }}>
            Choisissez une ambiance visuelle calibrée pour le marché immobilier sénégalais.
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 14,
        }}
      >
        {THEMES_IMMO_PRESETS.map((theme) => {
          const isSelected = currentThemeId === theme.id;
          const Icon = theme.icon;

          return (
            <div
              key={theme.id}
              onClick={() => onSelectTheme(theme)}
              style={{
                border: isSelected
                  ? '2px solid var(--accent, #C75B00)'
                  : '1px solid var(--border, #E8DDD2)',
                background: isSelected ? '#FAF8F5' : '#FFFFFF',
                borderRadius: 12,
                padding: 16,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                boxShadow: isSelected ? '0 4px 12px rgba(199, 91, 0, 0.1)' : 'none',
                position: 'relative',
              }}
            >
              {isSelected && (
                <div
                  style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: 'var(--accent, #C75B00)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Check size={14} />
                </div>
              )}

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: theme.couleurAccent,
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={16} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                      {theme.nom}
                    </h4>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        color: 'var(--accent, #C75B00)',
                      }}
                    >
                      {theme.badge}
                    </span>
                  </div>
                </div>

                <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.4, margin: '8px 0' }}>
                  {theme.description}
                </p>
              </div>

              {/* Aperçu de la palette */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginTop: 12,
                  paddingTop: 10,
                  borderTop: '1px solid rgba(0,0,0,0.06)',
                }}
              >
                <div style={{ display: 'flex', gap: 4 }}>
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 4,
                      background: theme.couleurAccent,
                      border: '1px solid rgba(0,0,0,0.1)',
                    }}
                    title="Couleur Principale"
                  />
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 4,
                      background: theme.couleurFond,
                      border: '1px solid rgba(0,0,0,0.15)',
                    }}
                    title="Fond"
                  />
                </div>
                <span style={{ fontSize: 11, color: '#64748B', marginLeft: 'auto' }}>
                  Boutons {theme.formeBoutons}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
