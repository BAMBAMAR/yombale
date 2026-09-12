'use client'

import React from 'react'
import { ArrowUp, ArrowDown, Eye, EyeOff, Layers, RotateCcw } from 'lucide-react'
import { SectionItem, SECTIONS_PAR_DEFAUT } from '@/lib/boutique-sections'

export type { SectionItem }
export { SECTIONS_PAR_DEFAUT }

interface StudioDispositionSectionsProps {
  sections: SectionItem[]
  onChange: (newSections: SectionItem[]) => void
}

export default function StudioDispositionSections({
  sections,
  onChange,
}: StudioDispositionSectionsProps) {
  // Déplacer une section vers le haut
  const moveUp = (index: number) => {
    if (index === 0) return
    const updated = [...sections]
    const temp = updated[index - 1]
    updated[index - 1] = updated[index]
    updated[index] = temp
    onChange(updated)
  }

  // Déplacer une section vers le bas
  const moveDown = (index: number) => {
    if (index === sections.length - 1) return
    const updated = [...sections]
    const temp = updated[index + 1]
    updated[index + 1] = updated[index]
    updated[index] = temp
    onChange(updated)
  }

  // Activer ou masquer une section
  const toggleVisibility = (index: number) => {
    const updated = sections.map((s, i) => (i === index ? { ...s, visible: !s.visible } : s))
    onChange(updated)
  }

  // Réinitialiser vers l'ordre standard
  const resetToDefault = () => {
    onChange([...SECTIONS_PAR_DEFAUT])
  }

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Layers size={18} style={{ color: '#C75B00' }} />
          <div>
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
              Disposition & Ordre d'affichage des sections
            </h4>
            <p style={{ margin: 0, fontSize: 11.5, color: '#64748b' }}>
              Personnalisez l'ordre dans lequel les visiteurs découvrent votre vitrine publique
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={resetToDefault}
          style={{
            background: 'none',
            border: '1px solid #cbd5e1',
            borderRadius: 6,
            padding: '4px 10px',
            fontSize: 11.5,
            fontWeight: 700,
            color: '#64748b',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
          title="Rétablir l'ordre d'origine"
        >
          <RotateCcw size={12} />
          <span>Réinitialiser</span>
        </button>
      </div>

      {/* Liste des sections ordonnées */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sections.map((section, idx) => (
          <div
            key={section.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: 8,
              background: section.visible ? '#f8fafc' : '#f1f5f9',
              border: `1px solid ${section.visible ? '#e2e8f0' : '#cbd5e1'}`,
              opacity: section.visible ? 1 : 0.6,
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  background: section.visible ? '#fff7ed' : '#e2e8f0',
                  color: section.visible ? '#C75B00' : '#64748b',
                  fontSize: 11,
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {idx + 1}
              </span>

              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
                  {section.nom}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: 11,
                    color: '#64748b',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {section.description}
                </p>
              </div>
            </div>

            {/* Commandes de réorganisation */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              {/* Monter */}
              <button
                type="button"
                onClick={() => moveUp(idx)}
                disabled={idx === 0}
                style={{
                  padding: 5,
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: idx === 0 ? '#cbd5e1' : '#334155',
                  cursor: idx === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Déplacer vers le haut"
              >
                <ArrowUp size={14} />
              </button>

              {/* Descendre */}
              <button
                type="button"
                onClick={() => moveDown(idx)}
                disabled={idx === sections.length - 1}
                style={{
                  padding: 5,
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: idx === sections.length - 1 ? '#cbd5e1' : '#334155',
                  cursor: idx === sections.length - 1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Déplacer vers le bas"
              >
                <ArrowDown size={14} />
              </button>

              {/* Visibilité */}
              <button
                type="button"
                onClick={() => toggleVisibility(idx)}
                style={{
                  padding: 5,
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  background: section.visible ? '#ffffff' : '#e2e8f0',
                  color: section.visible ? '#16a34a' : '#94a3b8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title={section.visible ? 'Masquer cette section' : 'Afficher cette section'}
              >
                {section.visible ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
