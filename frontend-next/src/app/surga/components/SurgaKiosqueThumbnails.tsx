'use client'

import React, { useRef, useEffect } from 'react'
import type { UneItem } from './SurgaKiosqueLightbox'

interface SurgaKiosqueThumbnailsProps {
  unes: UneItem[]
  selectedIndex: number
  onSelectIndex: (index: number) => void
}

export default function SurgaKiosqueThumbnails({
  unes,
  selectedIndex,
  onSelectIndex,
}: SurgaKiosqueThumbnailsProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Scroll automatique pour centrer la miniature sélectionnée
  useEffect(() => {
    if (!containerRef.current) return
    const activeBtn = containerRef.current.children[selectedIndex] as HTMLElement
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }, [selectedIndex])

  return (
    <div
      ref={containerRef}
      style={{
        padding: '8px 12px',
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid var(--border, #E8DDD2)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        overflowX: 'auto',
        flexShrink: 0,
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {unes.map((une, idx) => {
        const estActif = idx === selectedIndex
        return (
          <button
            key={une.id}
            type="button"
            onClick={() => onSelectIndex(idx)}
            title={une.nom_journal}
            style={{
              background: 'none',
              border: estActif ? '2px solid var(--accent, #C75B00)' : '1px solid var(--border, #E8DDD2)',
              borderRadius: 6,
              padding: 2,
              cursor: 'pointer',
              flexShrink: 0,
              opacity: estActif ? 1 : 0.65,
              transform: estActif ? 'scale(1.06)' : 'scale(1)',
              transition: 'all 0.15s ease',
            }}
          >
            <img
              src={une.image_url}
              alt={une.nom_journal}
              loading="lazy"
              style={{
                width: 34,
                height: 46,
                objectFit: 'cover',
                objectPosition: 'top',
                borderRadius: 4,
                display: 'block',
              }}
            />
          </button>
        )
      })}
    </div>
  )
}
