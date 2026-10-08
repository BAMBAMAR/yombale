'use client'

import React from 'react'
import { Play, Square, Volume2, VolumeX, X, Signal } from 'lucide-react'
import type { StationRadio } from './SurgaRadioModal'

interface SurgaRadioMiniPlayerProps {
  station: StationRadio
  isPlaying: boolean
  isBuffering: boolean
  isMuted: boolean
  onTogglePlay: (station: StationRadio) => void
  onToggleMute: () => void
  onArreter: () => void
}

export default function SurgaRadioMiniPlayer({
  station,
  isPlaying,
  isBuffering,
  isMuted,
  onTogglePlay,
  onToggleMute,
  onArreter,
}: SurgaRadioMiniPlayerProps) {
  return (
    <div
      style={{
        padding: '10px 14px',
        backgroundColor: '#F8F5F0',
        borderBottom: '2px solid var(--accent, #C75B00)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <button
          type="button"
          onClick={() => onTogglePlay(station)}
          aria-label={isPlaying ? 'Arrêter' : 'Reprendre'}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            backgroundColor: 'var(--accent, #C75B00)',
            color: '#FFFFFF',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          {isPlaying ? <Square size={14} /> : <Play size={15} style={{ marginLeft: 2 }} />}
        </button>

        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--navy, #1C2B4A)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {station.nom}
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                padding: '1px 5px',
                borderRadius: 4,
                backgroundColor: 'var(--price, #0A5C36)',
                color: '#FFFFFF',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              <Signal size={9} />
              {isBuffering ? 'Connexion...' : 'DIRECT'}
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3, #73675E)' }}>
            {station.frequence} • {station.region}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <button
          type="button"
          onClick={onToggleMute}
          aria-label={isMuted ? 'Rétablir le son' : 'Couper le son'}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
            color: 'var(--navy, #1C2B4A)',
          }}
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
        <button
          type="button"
          onClick={onArreter}
          title="Fermer le lecteur"
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
            color: 'var(--text3, #73675E)',
          }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
