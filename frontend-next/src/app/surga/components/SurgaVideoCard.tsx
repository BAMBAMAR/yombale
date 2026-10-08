'use client'

import React from 'react'
import {
  ExternalLink,
  Calendar,
  BellCheck,
} from 'lucide-react'
import { VideoItem } from './SurgaVideosModal'

interface SurgaVideoCardProps {
  video: VideoItem
  estRappele: boolean
  onToggleRappel: (video: VideoItem) => void
}

export default function SurgaVideoCard({
  video,
  estRappele,
  onToggleRappel,
}: SurgaVideoCardProps) {
  return (
    <div
      style={{
        padding: '10px 12px',
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        border: '1px solid #E2E8F0',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      {/* Ligne 1 : Titre complet */}
      <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', lineHeight: 1.35 }}>
        {video.titre}
      </div>

      {/* Ligne 2 : Métadonnées + Boutons d'action calés à droite */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B' }}>
          <span
            style={{
              padding: '2px 6px',
              borderRadius: 4,
              backgroundColor: video.source_type === 'LUTTE' ? '#FEF2F2' : '#EFF6FF',
              color: video.source_type === 'LUTTE' ? '#DC2626' : '#2563EB',
              fontWeight: 800,
              fontSize: 12,
            }}
          >
            {video.source_type === 'LUTTE' ? 'LUTTE' : 'SÉRIE'}
          </span>
          <span style={{ fontWeight: 600 }}>{video.source_nom?.split('(')[0]?.trim() || 'Chaîne officielle'}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {/* Passerelle Agenda */}
          <button
            type="button"
            onClick={() => onToggleRappel(video)}
            title={estRappele ? 'Retirer le rappel de l’agenda' : 'Programmer un rappel dans l’agenda'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 8px',
              borderRadius: 6,
              border: estRappele ? '1px solid #F59E0B' : '1px solid #E2E8F0',
              backgroundColor: estRappele ? '#FEF3C7' : '#FFFFFF',
              color: estRappele ? '#92400E' : '#475569',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {estRappele ? <BellCheck size={12} color="#D97706" /> : <Calendar size={12} color="#64748B" />}
            <span>{estRappele ? 'Rappelé' : 'Rappel'}</span>
          </button>

          {/* Lien sortant plateforme */}
          <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
              borderRadius: 6,
              backgroundColor: 'var(--surga-navy, #1C2B4A)',
              color: '#FFFFFF',
              fontSize: 12,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            <span>Voir</span>
            <ExternalLink size={11} />
          </a>
        </div>
      </div>
    </div>
  )
}
