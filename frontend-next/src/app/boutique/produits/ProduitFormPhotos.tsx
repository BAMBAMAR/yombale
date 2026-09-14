'use client'

import React, { useRef } from 'react'
import ExternalImg from '@/components/ExternalImg'
import { Camera, X } from 'lucide-react'

interface ProduitFormPhotosProps {
  imagesExistantes: string[]
  setImagesExistantes: React.Dispatch<React.SetStateAction<string[]>>
  photos: File[]
  setPhotos: React.Dispatch<React.SetStateAction<File[]>>
  previews: string[]
  setPreviews: React.Dispatch<React.SetStateAction<string[]>>
}

export function ProduitFormPhotos({
  imagesExistantes,
  setImagesExistantes,
  photos,
  setPhotos,
  previews,
  setPreviews,
}: ProduitFormPhotosProps) {
  const fileRef = useRef<HTMLInputElement>(null)

  function syncFileInput(fichiers: File[]) {
    if (!fileRef.current) return
    const dt = new DataTransfer()
    fichiers.forEach(f => dt.items.add(f))
    fileRef.current.files = dt.files
  }

  function handlePhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const dispo = 5 - imagesExistantes.length - photos.length
    const ajouts = files.slice(0, Math.max(0, dispo))
    const total = [...photos, ...ajouts]
    setPhotos(total)
    syncFileInput(total)
    ajouts.forEach(file => {
      const reader = new FileReader()
      reader.onload = ev => setPreviews(prev => [...prev, ev.target?.result as string])
      reader.readAsDataURL(file)
    })
  }

  function removeNouvellePhoto(i: number) {
    const next = photos.filter((_, j) => j !== i)
    setPhotos(next)
    setPreviews(prev => prev.filter((_, j) => j !== i))
    syncFileInput(next)
  }

  function removeImageExistante(i: number) {
    setImagesExistantes(prev => prev.filter((_, j) => j !== i))
  }

  const totalCount = imagesExistantes.length + photos.length

  return (
    <div style={{ background: '#ffffff', borderRadius: 14, border: '1.5px solid #e2e8f0', padding: 16 }}>
      <label className="npl-label-airy" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>
          Photos de l&apos;article{' '}
          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>(Max 5 — Recommandé)</span>
        </span>
        <span style={{ fontSize: 11.5, color: '#1d4ed8', fontWeight: 700 }}>
          {totalCount}/5 photos
        </span>
      </label>

      <div className="photos-zone" style={{ marginTop: 8 }}>
        {totalCount < 5 && (
          <div
            className="photos-dropzone"
            onClick={() => fileRef.current?.click()}
            onKeyDown={e => e.key === 'Enter' && fileRef.current?.click()}
            tabIndex={0}
            role="button"
            aria-label="Ajouter des photos"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              padding: '14px 18px',
              minHeight: 64,
              borderRadius: 12,
              border: '2px dashed #93c5fd',
              background: '#eff6ff',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: '#dbeafe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1d4ed8',
                flexShrink: 0,
              }}
            >
              <Camera size={20} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 13.5, color: '#1d4ed8' }}>
                Toucher pour ajouter une photo
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 11.5, color: '#64748b' }}>
                Prenez une photo ou choisissez depuis votre galerie
              </p>
            </div>
          </div>
        )}
        <input
          ref={fileRef}
          name="photos"
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={handlePhotos}
        />

        {(imagesExistantes.length > 0 || previews.length > 0) && (
          <div className="photos-previews" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
            {imagesExistantes.map((src, i) => (
              <div
                key={`existante-${i}`}
                className="photo-thumb"
                style={{
                  position: 'relative',
                  width: 72,
                  height: 72,
                  borderRadius: 10,
                  overflow: 'hidden',
                  border: '1px solid #cbd5e1',
                }}
              >
                <ExternalImg src={src} alt={`Photo ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button
                  type="button"
                  className="photo-remove"
                  onClick={() => removeImageExistante(i)}
                  aria-label="Supprimer"
                  style={{
                    position: 'absolute',
                    top: 3,
                    right: 3,
                    background: 'rgba(0,0,0,0.65)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: 22,
                    height: 22,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            {previews.map((src, i) => (
              <div
                key={`nouvelle-${i}`}
                className="photo-thumb"
                style={{
                  position: 'relative',
                  width: 72,
                  height: 72,
                  borderRadius: 10,
                  overflow: 'hidden',
                  border: '2px solid #3b82f6',
                }}
              >
                <ExternalImg src={src} alt={`Nouvelle photo ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button
                  type="button"
                  className="photo-remove"
                  onClick={() => removeNouvellePhoto(i)}
                  aria-label="Supprimer"
                  style={{
                    position: 'absolute',
                    top: 3,
                    right: 3,
                    background: 'rgba(0,0,0,0.65)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: 22,
                    height: 22,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
