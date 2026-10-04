'use client'

import React from 'react'
import { Play, Square, MapPin } from 'lucide-react'
import type { StationRadio } from './SurgaRadioModal'

interface SurgaRadioCardProps {
  station: StationRadio
  isEnLecture: boolean
  onTogglePlay: (station: StationRadio) => void
}

export default function SurgaRadioCard({
  station,
  isEnLecture,
  onTogglePlay,
}: SurgaRadioCardProps) {
  return (
    <div
      style={{
        padding: '10px 12px',
        borderRadius: 10,
        border: '1px solid',
        borderColor: isEnLecture ? 'var(--accent, #C75B00)' : 'var(--border, #E8DDD2)',
        backgroundColor: isEnLecture ? '#FFF9F3' : '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        transition: 'all 0.15s ease',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
            {station.nom}
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              padding: '1px 5px',
              borderRadius: 4,
              backgroundColor: 'var(--bg, #F8F5F0)',
              color: 'var(--accent, #C75B00)',
              border: '1px solid var(--border, #E8DDD2)',
            }}
          >
            {station.frequence}
          </span>
        </div>

        <div
          style={{
            fontSize: 11,
            color: 'var(--text2, #5A4E42)',
            marginTop: 2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {station.slogan}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 4,
            fontSize: 10,
            color: 'var(--text3, #73675E)',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <MapPin size={10} />
            {station.region}
          </span>
          <span>•</span>
          <span>{station.bitrateKbps} kbps</span>
          <span>•</span>
          <span>{station.langues.slice(0, 2).join(', ')}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onTogglePlay(station)}
        aria-label={isEnLecture ? `Arrêter ${station.nom}` : `Écouter ${station.nom}`}
        style={{
          padding: '6px 12px',
          borderRadius: 6,
          border: 'none',
          backgroundColor: isEnLecture ? 'var(--navy, #1C2B4A)' : 'var(--accent, #C75B00)',
          color: '#FFFFFF',
          fontSize: 11,
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          flexShrink: 0,
        }}
      >
        {isEnLecture ? (
          <>
            <Square size={12} />
            <span>Stop</span>
          </>
        ) : (
          <>
            <Play size={12} />
            <span>Écouter</span>
          </>
        )}
      </button>
    </div>
  )
}
