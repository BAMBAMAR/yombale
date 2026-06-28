'use client'

import { useState } from 'react'

interface Props {
  photos: string[]
  titre: string
}

export default function AnnonceGallery({ photos, titre }: Props) {
  const [current, setCurrent] = useState(0)

  if (photos.length === 0) {
    return (
      <div className="annonce-detail-no-photo">
        <span>📦</span>
        <p>Pas de photo</p>
      </div>
    )
  }

  const prev = () => setCurrent(i => (i - 1 + photos.length) % photos.length)
  const next = () => setCurrent(i => (i + 1) % photos.length)

  return (
    <div className="annonce-detail-gallery">
      <div className="annonce-gallery-main-wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photos[current]}
          alt={`${titre} — photo ${current + 1}`}
          className="annonce-detail-photo-main"
        />
        {photos.length > 1 && (
          <>
            <button
              className="annonce-gallery-arrow annonce-gallery-arrow-left"
              onClick={prev}
              aria-label="Photo précédente"
            >
              ‹
            </button>
            <button
              className="annonce-gallery-arrow annonce-gallery-arrow-right"
              onClick={next}
              aria-label="Photo suivante"
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
              src={p}
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
