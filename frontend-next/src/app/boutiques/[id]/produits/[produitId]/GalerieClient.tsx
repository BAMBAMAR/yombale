'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cloudinaryHQ } from '@/lib/cloudinary'

export default function GalerieClient({
  images,
  nom,
  enStock,
}: {
  images: string[]
  nom: string
  enStock: boolean
}) {
  const [idx, setIdx] = useState(0)
  const imgs = images?.length ? images : []
  const current = imgs[idx] ?? null

  const prev = () => setIdx(i => (i - 1 + imgs.length) % imgs.length)
  const next = () => setIdx(i => (i + 1) % imgs.length)

  // Navigation clavier avec les touches fléchées Gauche / Droite
  useEffect(() => {
    if (imgs.length <= 1) return

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
  }, [imgs.length])

  // Défilement tactile (Swipe gauche / droite sur mobile)
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
    if (distance > 40) {
      next()
    } else if (distance < -40) {
      prev()
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Image principale */}
      <div
        tabIndex={0}
        role="region"
        aria-label="Galerie photos produit"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          width: '100%',
          aspectRatio: '1 / 1',
          position: 'relative',
          background: '#f8fafc',
          borderRadius: 16,
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
          outline: 'none',
          userSelect: 'none',
          touchAction: 'pan-y',
        }}
      >
        {current ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cloudinaryHQ(current, { width: 800 })}
            alt={`${nom} — image ${idx + 1}`}
            draggable={false}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              pointerEvents: 'none',
            }}
          />
        ) : (
          <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80 }} />
        )}

        {!enStock && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 4,
          }}>
            <span style={{ background: '#ef4444', color: '#fff', fontWeight: 800, fontSize: 15, padding: '8px 20px', borderRadius: 20 }}>
              Rupture de stock
            </span>
          </div>
        )}

        {/* Flèches navigation si plusieurs images */}
        {imgs.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                prev()
              }}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 42,
                height: 42,
                borderRadius: '50%',
                border: 'none',
                background: 'rgba(255, 255, 255, 0.92)',
                backdropFilter: 'blur(4px)',
                color: '#1C2B4A',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.18)',
                zIndex: 10,
                touchAction: 'manipulation',
                transition: 'transform 0.15s ease, background 0.15s ease',
              }}
              aria-label="Image précédente (←)"
              title="Image précédente (Flèche gauche)"
            >
              <ChevronLeft size={20} strokeWidth={2.5} />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                next()
              }}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 42,
                height: 42,
                borderRadius: '50%',
                border: 'none',
                background: 'rgba(255, 255, 255, 0.92)',
                backdropFilter: 'blur(4px)',
                color: '#1C2B4A',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.18)',
                zIndex: 10,
                touchAction: 'manipulation',
                transition: 'transform 0.15s ease, background 0.15s ease',
              }}
              aria-label="Image suivante (→)"
              title="Image suivante (Flèche droite)"
            >
              <ChevronRight size={20} strokeWidth={2.5} />
            </button>

            {/* Compteur */}
            <span style={{
              position: 'absolute',
              bottom: 12,
              right: 12,
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(4px)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 700,
              padding: '4px 12px',
              borderRadius: 20,
              letterSpacing: '0.04em',
              zIndex: 5,
              pointerEvents: 'none',
            }}>
              {idx + 1}/{imgs.length}
            </span>
          </>
        )}
      </div>

      {/* Miniatures */}
      {imgs.length > 1 && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {imgs.map((src, i) => (
            <button
              type="button"
              key={i}
              onClick={(e) => {
                e.preventDefault()
                setIdx(i)
              }}
              style={{
                width: 72,
                height: 72,
                borderRadius: 10,
                overflow: 'hidden',
                flexShrink: 0,
                border: idx === i ? '2px solid #C75B00' : '2px solid #e2e8f0',
                padding: 0,
                cursor: 'pointer',
                background: 'none',
                transition: 'border-color .15s, opacity .15s',
                opacity: idx === i ? 1 : 0.75,
              }}
              aria-label={`Afficher l'image ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cloudinaryHQ(src, { width: 150 })}
                alt=""
                draggable={false}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
