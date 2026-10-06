'use client'

import React, { useEffect, useCallback, useState, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import SurgaKiosqueHeader from './SurgaKiosqueHeader'
import SurgaKiosqueThumbnails from './SurgaKiosqueThumbnails'

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
  // États de zoom, pan et plein écran
  const [zoom, setZoom] = useState<number>(1)
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isPleinEcran, setIsPleinEcran] = useState<boolean>(false)
  const [afficherVignettes, setAfficherVignettes] = useState<boolean>(true)
  const [lienCopie, setLienCopie] = useState<boolean>(false)

  // Touch gestures
  const [touchStartX, setTouchStartX] = useState<number | null>(null)

  const lightboxRef = useRef<HTMLDivElement>(null)

  const selectedUne = selectedIndex !== null && unes[selectedIndex] ? unes[selectedIndex] : null

  // Réinitialiser zoom et déplacement
  const resetZoom = useCallback(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [])

  const zoomIn = useCallback(() => {
    setZoom((z) => Math.min(4, Math.round((z + 0.5) * 10) / 10))
  }, [])

  const zoomOut = useCallback(() => {
    setZoom((z) => {
      const next = Math.max(1, Math.round((z - 0.5) * 10) / 10)
      if (next === 1) setPan({ x: 0, y: 0 })
      return next
    })
  }, [])

  const allerPrecedent = useCallback(
    (e?: React.MouseEvent) => {
      if (e) e.stopPropagation()
      if (selectedIndex === null || unes.length === 0) return
      resetZoom()
      onSelectIndex((selectedIndex - 1 + unes.length) % unes.length)
    },
    [selectedIndex, unes.length, onSelectIndex, resetZoom]
  )

  const allerSuivant = useCallback(
    (e?: React.MouseEvent) => {
      if (e) e.stopPropagation()
      if (selectedIndex === null || unes.length === 0) return
      resetZoom()
      onSelectIndex((selectedIndex + 1) % unes.length)
    },
    [selectedIndex, unes.length, onSelectIndex, resetZoom]
  )

  const togglePleinEcran = useCallback(() => {
    if (!document.fullscreenElement) {
      lightboxRef.current?.requestFullscreen?.().catch(() => {})
      setIsPleinEcran(true)
    } else {
      document.exitFullscreen?.().catch(() => {})
      setIsPleinEcran(false)
    }
  }, [])

  // Synchronisation avec l'API fullscreen native
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsPleinEcran(Boolean(document.fullscreenElement))
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Copier le lien
  const handleCopierLien = async () => {
    if (!selectedUne) return
    try {
      const url = selectedUne.image_url || 'https://surga.nopalou.com'
      await navigator.clipboard.writeText(url)
      setLienCopie(true)
      setTimeout(() => setLienCopie(false), 2000)
    } catch {}
  }

  // Navigation clavier complète
  useEffect(() => {
    if (selectedIndex === null) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && zoom === 1) allerPrecedent()
      else if (e.key === 'ArrowRight' && zoom === 1) allerSuivant()
      else if (e.key === '+' || e.key === '=') zoomIn()
      else if (e.key === '-') zoomOut()
      else if (e.key === '0' || e.key.toLowerCase() === 'r') resetZoom()
      else if (e.key.toLowerCase() === 'f') togglePleinEcran()
      else if (e.key === 'Escape') {
        if (zoom > 1) {
          resetZoom()
        } else if (isPleinEcran) {
          togglePleinEcran()
        } else {
          onClose()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedIndex, zoom, isPleinEcran, allerPrecedent, allerSuivant, zoomIn, zoomOut, resetZoom, togglePleinEcran, onClose])

  // Molette de souris pour zoomer
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    if (e.deltaY < 0) {
      zoomIn()
    } else {
      zoomOut()
    }
  }

  // Double clic pour basculer rapidement entre 1x et 2x
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (zoom === 1) {
      setZoom(2)
      setPan({ x: 0, y: 0 })
    } else {
      resetZoom()
    }
  }

  // Drag souris quand zoom > 1
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoom <= 1) return
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Gestes tactiles mobiles
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      setTouchStartX(touch.clientX)
      if (zoom > 1) {
        setIsDragging(true)
        setDragStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y })
      }
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && zoom > 1 && isDragging) {
      const touch = e.touches[0]
      setPan({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y,
      })
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsDragging(false)
    if (zoom === 1 && touchStartX !== null) {
      const touchEndX = e.changedTouches[0].clientX
      const diffX = touchStartX - touchEndX
      if (diffX > 50) {
        allerSuivant()
      } else if (diffX < -50) {
        allerPrecedent()
      }
    }
    setTouchStartX(null)
  }

  if (!selectedUne || selectedIndex === null) return null

  return (
    <div
      ref={lightboxRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Une de ${selectedUne.nom_journal}`}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.94)',
        backdropFilter: 'blur(8px)',
        zIndex: 1100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isPleinEcran ? 0 : 12,
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: 'relative',
          maxWidth: isPleinEcran ? '100vw' : '1080px',
          width: isPleinEcran ? '100vw' : '96vw',
          maxHeight: isPleinEcran ? '100vh' : '95vh',
          height: isPleinEcran ? '100vh' : 'auto',
          backgroundColor: '#FFFFFF',
          borderRadius: isPleinEcran ? 0 : 16,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.5)',
          transition: 'max-width 0.2s ease, max-height 0.2s ease, border-radius 0.2s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header avec informations, contrôles de zoom et boutons d'action */}
        <SurgaKiosqueHeader
          selectedUne={selectedUne}
          selectedIndex={selectedIndex}
          totalUnes={unes.length}
          zoom={zoom}
          isPleinEcran={isPleinEcran}
          afficherVignettes={afficherVignettes}
          lienCopie={lienCopie}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onResetZoom={resetZoom}
          onTogglePleinEcran={togglePleinEcran}
          onToggleVignettes={() => setAfficherVignettes((v) => !v)}
          onPrecedent={allerPrecedent}
          onSuivant={allerSuivant}
          onCopierLien={handleCopierLien}
          onClose={onClose}
        />

        {/* Zone de visualisation de l'image (Agrandie + Zoom + Pan) */}
        <div
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            position: 'relative',
            flex: 1,
            overflow: 'hidden',
            backgroundColor: '#0F172A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: isPleinEcran ? 'calc(100vh - 120px)' : '320px',
            userSelect: 'none',
            cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
          }}
          title={zoom === 1 ? 'Double-cliquez pour zoomer ou utilisez la molette' : 'Glissez pour déplacer l’image'}
        >
          {/* Bouton Précédent flottant */}
          <button
            type="button"
            onClick={allerPrecedent}
            aria-label="Journal précédent"
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              width: 38,
              height: 38,
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.92)',
              border: '1px solid rgba(255, 255, 255, 0.5)',
              color: 'var(--navy, #1C2B4A)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(4px)',
              transition: 'transform 0.15s ease',
            }}
          >
            <ChevronLeft size={22} />
          </button>

          {/* L'image de la Une avec scale & translate */}
          <img
            key={selectedUne.id}
            src={selectedUne.image_url}
            alt={`Une complète de ${selectedUne.nom_journal}`}
            onDoubleClick={handleDoubleClick}
            draggable={false}
            style={{
              maxWidth: '100%',
              maxHeight: isPleinEcran
                ? afficherVignettes
                  ? 'calc(100vh - 130px)'
                  : 'calc(100vh - 65px)'
                : afficherVignettes
                ? '75vh'
                : '84vh',
              objectFit: 'contain',
              borderRadius: 4,
              display: 'block',
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)',
              pointerEvents: 'auto',
            }}
          />

          {/* Bouton Suivant flottant */}
          <button
            type="button"
            onClick={allerSuivant}
            aria-label="Journal suivant"
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              width: 38,
              height: 38,
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.92)',
              border: '1px solid rgba(255, 255, 255, 0.5)',
              color: 'var(--navy, #1C2B4A)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(4px)',
              transition: 'transform 0.15s ease',
            }}
          >
            <ChevronRight size={22} />
          </button>
        </div>

        {/* Carrousel inférieur des miniatures (masquable pour 100% de hauteur) */}
        {afficherVignettes && (
          <SurgaKiosqueThumbnails
            unes={unes}
            selectedIndex={selectedIndex}
            onSelectIndex={(idx) => {
              resetZoom()
              onSelectIndex(idx)
            }}
          />
        )}
      </div>
    </div>
  )
}
