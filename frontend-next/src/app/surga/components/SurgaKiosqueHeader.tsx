'use client'

import React from 'react'
import {
  X,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
} from 'lucide-react'
import { SURGA_BASE_URL } from '@/lib/surga-share'
import SurgaShareButton from './SurgaShareButton'
import SurgaKiosqueZoomControls from './SurgaKiosqueZoomControls'
import type { UneItem } from './SurgaKiosqueLightbox'

interface SurgaKiosqueHeaderProps {
  selectedUne: UneItem
  selectedIndex: number
  totalUnes: number
  zoom: number
  isPleinEcran: boolean
  afficherVignettes: boolean
  lienCopie: boolean
  onZoomIn: () => void
  onZoomOut: () => void
  onResetZoom: () => void
  onTogglePleinEcran: () => void
  onToggleVignettes: () => void
  onPrecedent: (e?: React.MouseEvent) => void
  onSuivant: (e?: React.MouseEvent) => void
  onCopierLien: () => void
  onClose: () => void
}

export default function SurgaKiosqueHeader({
  selectedUne,
  selectedIndex,
  totalUnes,
  zoom,
  isPleinEcran,
  afficherVignettes,
  lienCopie,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onTogglePleinEcran,
  onToggleVignettes,
  onPrecedent,
  onSuivant,
  onCopierLien,
  onClose,
}: SurgaKiosqueHeaderProps) {
  return (
    <div
      style={{
        padding: '10px 16px',
        borderBottom: '1px solid var(--border, #E8DDD2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        flexShrink: 0,
        gap: 8,
        flexWrap: 'wrap',
      }}
    >
      {/* Titre et édition (le bouton Fermer reste sur cette ligne) */}
      <div style={{ minWidth: 0, flex: '1 1 200px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: 'var(--navy, #1C2B4A)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            Kiosque des Unes
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--surga-accent-ink, #A64B08)',
              backgroundColor: 'rgba(199, 91, 0, 0.1)',
              padding: '2px 8px',
              borderRadius: 10,
              flexShrink: 0,
            }}
          >
            {selectedIndex + 1} / {totalUnes}
          </span>
        </div>
        <div
          style={{
            fontSize: 12,
            color: 'var(--text3, #73675E)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {(() => {
            // La date arrive au format « 2026-10-09T00:00:00.000Z » : elle s'écrit en français (« 9 octobre 2026 »).
            const d = selectedUne.date_parution ? new Date(selectedUne.date_parution) : null
            const lisible = d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : null
            return lisible ? `Édition du ${lisible}` : 'Édition du jour'
          })()}
        </div>
      </div>

      {/* Fermer */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer la vue"
        title="Fermer (Échap)"
        style={{
          background: 'none',
          border: 'none',
          width: 30,
          height: 30,
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--text2, #5A4E42)',
        }}
      >
        <X size={20} />
      </button>

      {/* Contrôles de zoom, plein écran, navigation et actions */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, flex: '1 1 100%', justifyContent: 'space-between' }}>
        <SurgaKiosqueZoomControls
          zoom={zoom}
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          onResetZoom={onResetZoom}
          isPleinEcran={isPleinEcran}
          onTogglePleinEcran={onTogglePleinEcran}
          afficherVignettes={afficherVignettes}
          onToggleVignettes={onToggleVignettes}
        />

        {/* Flèches précédente / suivante */}
        <button
          type="button"
          onClick={onPrecedent}
          aria-label="Une précédente"
          title="Une précédente (Flèche gauche)"
          style={{
            background: 'var(--bg, #F8F5F0)',
            border: '1px solid var(--border, #E8DDD2)',
            width: 30,
            height: 30,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--navy, #1C2B4A)',
          }}
        >
          <ChevronLeft size={16} />
        </button>
        <button
          type="button"
          onClick={onSuivant}
          aria-label="Une suivante"
          title="Une suivante (Flèche droite)"
          style={{
            background: 'var(--bg, #F8F5F0)',
            border: '1px solid var(--border, #E8DDD2)',
            width: 30,
            height: 30,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--navy, #1C2B4A)',
          }}
        >
          <ChevronRight size={16} />
        </button>

        {/* Partager */}
        <SurgaShareButton
          payload={{
            titre: 'Une de la presse sénégalaise',
            texte: `*Surga — Kiosque de la Presse Sénégalaise*\n• Date : ${selectedUne.date_parution || 'Aujourd’hui'}\nConsulter la revue de presse sur Surga : https://surga.nopalou.com`,
            url: SURGA_BASE_URL,
          }}
          libelle="Partager"
          taille="sm"
        />

        {/* Copier le lien */}
        <button
          type="button"
          onClick={onCopierLien}
          aria-label="Copier le lien de l’image"
          title={lienCopie ? 'Lien copié !' : 'Copier le lien de l’image'}
          style={{
            background: lienCopie ? 'rgba(10, 92, 54, 0.12)' : 'var(--bg, #F8F5F0)',
            border: '1px solid',
            borderColor: lienCopie ? 'var(--price, #0A5C36)' : 'var(--border, #E8DDD2)',
            width: 30,
            height: 30,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: lienCopie ? 'var(--price, #0A5C36)' : 'var(--navy, #1C2B4A)',
            transition: 'all 0.15s ease',
          }}
        >
          {lienCopie ? <Check size={14} /> : <Copy size={14} />}
        </button>


      </div>
    </div>
  )
}
