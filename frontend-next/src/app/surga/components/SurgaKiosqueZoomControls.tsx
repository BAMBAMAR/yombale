'use client'

import React from 'react'
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Minimize2, PanelBottom } from 'lucide-react'

interface SurgaKiosqueZoomControlsProps {
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  onResetZoom: () => void
  isPleinEcran: boolean
  onTogglePleinEcran: () => void
  afficherVignettes: boolean
  onToggleVignettes: () => void
}

export default function SurgaKiosqueZoomControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  isPleinEcran,
  onTogglePleinEcran,
  afficherVignettes,
  onToggleVignettes,
}: SurgaKiosqueZoomControlsProps) {
  const pourcentage = Math.round(zoom * 100)

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'var(--bg, #F8F5F0)',
        border: '1px solid var(--border, #E8DDD2)',
        borderRadius: 8,
        padding: '2px 4px',
      }}
    >
      {/* Zoom arrière */}
      <button
        type="button"
        onClick={onZoomOut}
        disabled={zoom <= 1}
        aria-label="Zoom arrière"
        title="Zoom arrière (-)"
        style={{
          background: 'none',
          border: 'none',
          width: 26,
          height: 26,
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: zoom <= 1 ? 'not-allowed' : 'pointer',
          color: zoom <= 1 ? 'var(--text3, #73675E)' : 'var(--navy, #1C2B4A)',
          opacity: zoom <= 1 ? 0.4 : 1,
        }}
      >
        <ZoomOut size={15} />
      </button>

      {/* Indicateur et bouton Reset */}
      <button
        type="button"
        onClick={onResetZoom}
        aria-label="Réinitialiser le zoom à 100%"
        title="Réinitialiser le zoom (0)"
        style={{
          background: zoom > 1 ? 'rgba(199, 91, 0, 0.12)' : 'none',
          border: 'none',
          padding: '2px 6px',
          borderRadius: 4,
          fontSize: 11,
          fontWeight: 700,
          color: zoom > 1 ? 'var(--accent, #C75B00)' : 'var(--navy, #1C2B4A)',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 3,
        }}
      >
        {zoom > 1 && <RotateCcw size={11} />}
        <span>{pourcentage}%</span>
      </button>

      {/* Zoom avant */}
      <button
        type="button"
        onClick={onZoomIn}
        disabled={zoom >= 4}
        aria-label="Zoom avant"
        title="Zoom avant (+)"
        style={{
          background: 'none',
          border: 'none',
          width: 26,
          height: 26,
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: zoom >= 4 ? 'not-allowed' : 'pointer',
          color: zoom >= 4 ? 'var(--text3, #73675E)' : 'var(--navy, #1C2B4A)',
          opacity: zoom >= 4 ? 0.4 : 1,
        }}
      >
        <ZoomIn size={15} />
      </button>

      {/* Séparateur */}
      <div style={{ width: 1, height: 16, backgroundColor: 'var(--border, #E8DDD2)', margin: '0 2px' }} />

      {/* Bascule Plein écran */}
      <button
        type="button"
        onClick={onTogglePleinEcran}
        aria-label={isPleinEcran ? 'Quitter le plein écran' : 'Passer en plein écran'}
        title={isPleinEcran ? 'Quitter le plein écran (F)' : 'Plein écran (F)'}
        style={{
          background: isPleinEcran ? 'var(--navy, #1C2B4A)' : 'none',
          border: 'none',
          width: 26,
          height: 26,
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: isPleinEcran ? '#FFFFFF' : 'var(--navy, #1C2B4A)',
        }}
      >
        {isPleinEcran ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
      </button>

      {/* Masquer / Afficher le carrousel des vignettes pour gagner de la place */}
      <button
        type="button"
        onClick={onToggleVignettes}
        aria-label={afficherVignettes ? 'Masquer la bande de vignettes' : 'Afficher la bande de vignettes'}
        title={afficherVignettes ? 'Masquer les vignettes du bas' : 'Afficher les vignettes'}
        style={{
          background: !afficherVignettes ? 'rgba(10, 92, 54, 0.12)' : 'none',
          border: 'none',
          width: 26,
          height: 26,
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: !afficherVignettes ? 'var(--price, #0A5C36)' : 'var(--navy, #1C2B4A)',
        }}
      >
        <PanelBottom size={14} />
      </button>
    </div>
  )
}
