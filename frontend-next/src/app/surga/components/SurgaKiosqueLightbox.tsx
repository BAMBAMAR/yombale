'use client'

import React, { useEffect, useCallback, useState } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import SurgaShareButton from './SurgaShareButton'

export interface UneItem {
  id: string
  nom_journal: string
  image_url: string
  description?: string
  date_parution?: string
}

interface SurgaKiosqueLightboxProps {
  unes: UneItem[]
  selectedIndex: number | null
  onClose: () => void
  onSelectIndex: (index: number) => void
}

export default function SurgaKiosqueLightbox({
  unes,
  selectedIndex,
  onClose,
  onSelectIndex,
}: SurgaKiosqueLightboxProps) {
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [touchEndX, setTouchEndX] = useState<number | null>(null)

  const selectedUne = selectedIndex !== null && unes[selectedIndex] ? unes[selectedIndex] : null

  const allerPrecedent = useCallback(
    (e?: React.MouseEvent) => {
      if (e) e.stopPropagation()
      if (selectedIndex === null || unes.length === 0) return
      onSelectIndex((selectedIndex - 1 + unes.length) % unes.length)
    },
    [selectedIndex, unes.length, onSelectIndex]
  )

  const allerSuivant = useCallback(
    (e?: React.MouseEvent) => {
      if (e) e.stopPropagation()
      if (selectedIndex === null || unes.length === 0) return
      onSelectIndex((selectedIndex + 1) % unes.length)
    },
    [selectedIndex, unes.length, onSelectIndex]
  )

  // Navigation clavier (flèches et Échap)
  useEffect(() => {
    if (selectedIndex === null) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') allerPrecedent()
      else if (e.key === 'ArrowRight') allerSuivant()
      else if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedIndex, allerPrecedent, allerSuivant, onClose])

  // Geste tactile Swipe pour smartphones
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEndX(null)
    setTouchStartX(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (touchStartX === null || touchEndX === null) return
    const diff = touchStartX - touchEndX
    if (diff > 45) {
      allerSuivant()
    } else if (diff < -45) {
      allerPrecedent()
    }
  }

  if (!selectedUne || selectedIndex === null) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Une de ${selectedUne.nom_journal}`}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(20, 25, 38, 0.9)',
        backdropFilter: 'blur(6px)',
        zIndex: 1100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: 'relative',
          maxWidth: 540,
          width: '100%',
          maxHeight: '92vh',
          backgroundColor: '#FFFFFF',
          borderRadius: 14,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.4)',
        }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header avec titre, compteur et contrôles */}
        <div
          style={{
            padding: '10px 14px',
            borderBottom: '1px solid var(--border, #E8DDD2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#FFFFFF',
            flexShrink: 0,
          }}
        >
          <div style={{ minWidth: 0, flex: 1, paddingRight: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: 'var(--navy, #1C2B4A)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {selectedUne.nom_journal}
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'var(--accent, #C75B00)',
                  backgroundColor: 'rgba(199, 91, 0, 0.1)',
                  padding: '1px 6px',
                  borderRadius: 10,
                  flexShrink: 0,
                }}
              >
                {selectedIndex + 1} / {unes.length}
              </span>
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--text3, #73675E)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {selectedUne.description || 'Quotidien national d’information'}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <button
              type="button"
              onClick={allerPrecedent}
              aria-label="Une précédente"
              title="Une précédente (Flèche gauche)"
              style={{
                background: 'var(--bg, #F8F5F0)',
                border: '1px solid var(--border, #E8DDD2)',
                width: 28,
                height: 28,
                borderRadius: 6,
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
              onClick={allerSuivant}
              aria-label="Une suivante"
              title="Une suivante (Flèche droite)"
              style={{
                background: 'var(--bg, #F8F5F0)',
                border: '1px solid var(--border, #E8DDD2)',
                width: 28,
                height: 28,
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--navy, #1C2B4A)',
              }}
            >
              <ChevronRight size={16} />
            </button>

            <SurgaShareButton
              payload={{
                titre: `Une de ${selectedUne.nom_journal}`,
                texte: `*Surga — Kiosque de la Presse Sénégalaise*\n• Journal : ${selectedUne.nom_journal}\n• Date : ${selectedUne.date_parution || 'Aujourd’hui'}\nConsulter la revue de presse sur Surga : https://surga.nopalou.com`,
                url: 'https://surga.nopalou.com',
              }}
              libelle="Partager"
              taille="sm"
            />

            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer la vue"
              title="Fermer (Échap)"
              style={{
                background: 'none',
                border: 'none',
                width: 28,
                height: 28,
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text2, #5A4E42)',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Conteneur Image avec boutons de défilement latéraux */}
        <div
          style={{
            position: 'relative',
            flex: 1,
            overflowY: 'auto',
            backgroundColor: '#0F172A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px 36px',
            minHeight: 280,
          }}
        >
          <button
            type="button"
            onClick={allerPrecedent}
            aria-label="Journal précédent"
            style={{
              position: 'absolute',
              left: 6,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 2,
              width: 34,
              height: 34,
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.88)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              color: 'var(--navy, #1C2B4A)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(4px)',
            }}
          >
            <ChevronLeft size={20} />
          </button>

          <img
            key={selectedUne.id}
            src={selectedUne.image_url}
            alt={`Une complète de ${selectedUne.nom_journal}`}
            style={{
              maxWidth: '100%',
              maxHeight: '64vh',
              objectFit: 'contain',
              borderRadius: 4,
              display: 'block',
              animation: 'fadeIn 0.15s ease-out',
            }}
          />

          <button
            type="button"
            onClick={allerSuivant}
            aria-label="Journal suivant"
            style={{
              position: 'absolute',
              right: 6,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 2,
              width: 34,
              height: 34,
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.88)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              color: 'var(--navy, #1C2B4A)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(4px)',
            }}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Carrousel inférieur des miniatures */}
        <div
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
                  opacity: estActif ? 1 : 0.6,
                  transform: estActif ? 'scale(1.05)' : 'scale(1)',
                  transition: 'all 0.15s ease',
                }}
              >
                <img
                  src={une.image_url}
                  alt={une.nom_journal}
                  style={{
                    width: 32,
                    height: 42,
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
      </div>
    </div>
  )
}
