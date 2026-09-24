'use client'

import { useState, useEffect } from 'react'
import { cloudinaryHQ } from '@/lib/cloudinary'

interface Props {
  photos: string[]
  titre: string
}

export default function AnnonceGallery({ photos, titre }: Props) {
  const [current, setCurrent] = useState(0)

  const prev = () => setCurrent(i => (i - 1 + photos.length) % photos.length)
  const next = () => setCurrent(i => (i + 1) % photos.length)

  // Navigation clavier avec les touches fléchées Gauche / Droite
  useEffect(() => {
    if (photos.length <= 1) return

    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null
      const tagName = target?.tagName?.toLowerCase()
      if (tagName === 'input' || tagName === 'textarea' || tagName === 'select' || target?.isContentEditable) {
        return
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        prev()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        next()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [photos.length])

  // Défilement tactile (Swipe)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (touchStart === null || touchEnd === null) return
    const distance = touchStart - touchEnd
    if (distance > 45) {
      next()
    } else if (distance < -45) {
      prev()
    }
  }

  if (photos.length === 0) {
    return (
      <div className="annonce-detail-no-photo">
        <span></span>
        <p>Pas de photo</p>
      </div>
    )
  }

  return (
    <div className="annonce-detail-gallery">
      <div
        className="annonce-gallery-main-wrap"
        tabIndex={0}
        role="region"
        aria-label="Galerie photos"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{ outline: 'none' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cloudinaryHQ(photos[current], { width: 900 })}
          alt={`${titre} — photo ${current + 1}`}
          className="annonce-detail-photo-main"
        />
        {photos.length > 1 && (
          <>
            <button
              type="button"
              className="annonce-gallery-arrow annonce-gallery-arrow-left"
              onClick={prev}
              aria-label="Photo précédente (Flèche gauche ←)"
              title="Photo précédente (←)"
            >
              ‹
            </button>
            <button
              type="button"
              className="annonce-gallery-arrow annonce-gallery-arrow-right"
              onClick={next}
              aria-label="Photo suivante (Flèche droite →)"
              title="Photo suivante (→)"
            >
              ›
            </button>
            <span className="annonce-gallery-counter">
              {current + 1} / {photos.length}
            </span>
          </>
        )}
      </div>

      {photos.length > 1 && (
        <div className="annonce-detail-thumbs">
          {photos.map((p, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={cloudinaryHQ(p, { width: 160 })}
              alt={`Photo ${i + 1}`}
              className={`annonce-detail-thumb${i === current ? ' annonce-detail-thumb-active' : ''}`}
              onClick={() => setCurrent(i)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
