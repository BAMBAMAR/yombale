'use client'

import React, { useState, useRef } from 'react'
import {
  Camera,
  Image as ImageIcon,
  Star,
  Trash2,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Plus
} from 'lucide-react'
import { getImmoAuthHeaders } from '@/lib/immo-auth'

interface BienPhotoUploaderProps {
  slug: string
  photos: string[]
  onChange: (photos: string[]) => void
  maxPhotos?: number
}

// Fonction utilitaire de compression légère côté client pour les photos smartphone HD
async function compressImageClient(file: File, maxDim = 1600, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        let { width, height } = img
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width)
            width = maxDim
          } else {
            width = Math.round((width * maxDim) / height)
            height = maxDim
          }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(e.target?.result as string)
          return
        }
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = () => resolve(e.target?.result as string)
      img.src = e.target?.result as string
    }
    reader.onerror = (err) => reject(err)
    reader.readAsDataURL(file)
  })
}

export function BienPhotoUploader({
  slug,
  photos,
  onChange,
  maxPhotos = 12,
}: BienPhotoUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)

  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  async function handleFilesSelected(filesList: FileList | null) {
    if (!filesList || filesList.length === 0) return
    setUploadError(null)

    const remainingSlots = maxPhotos - photos.length
    if (remainingSlots <= 0) {
      setUploadError(`Vous avez atteint la limite maximale de ${maxPhotos} photos.`)
      return
    }

    const filesToProcess = Array.from(filesList).slice(0, remainingSlots)

    try {
      setUploading(true)
      setUploadProgress(`Optimisation de ${filesToProcess.length} photo(s)...`)

      // 1. Compression locale instantanée
      const base64Images: string[] = []
      for (let i = 0; i < filesToProcess.length; i++) {
        const compressed = await compressImageClient(filesToProcess[i])
        base64Images.push(compressed)
      }

      setUploadProgress('Téléversement sécurisé vers Nopalou Cloud...')

      // 2. Envoi au backend
      const res = await fetch(`/api/biens/agence/${slug}/upload-photos`, {
        method: 'POST',
        headers: getImmoAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ images: base64Images }),
      })

      const data = await res.json()
      if (res.ok && data.success && Array.isArray(data.urls) && data.urls.length > 0) {
        onChange([...photos, ...data.urls])
        setUploadProgress(null)
      } else {
        // En cas de panne Cloudinary temporaire, fallback sur les images compressées
        onChange([...photos, ...base64Images])
        setUploadProgress(null)
      }
    } catch (err: any) {
      console.error('[PHOTO_UPLOAD_ERR]', err)
      setUploadError('Erreur de connexion. Veuillez réessayer.')
    } finally {
      setUploading(false)
      setUploadProgress(null)
      if (cameraInputRef.current) cameraInputRef.current.value = ''
      if (galleryInputRef.current) galleryInputRef.current.value = ''
    }
  }

  function handleSetPrimary(index: number) {
    if (index === 0) return
    const reordered = [...photos]
    const [selected] = reordered.splice(index, 1)
    reordered.unshift(selected)
    onChange(reordered)
  }

  function handleRemove(index: number) {
    const updated = photos.filter((_, i) => i !== index)
    onChange(updated)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* ── Entrées Fichiers Invisibles ── */}
      {/* 1. Caméra Directe Smartphone */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={(e) => handleFilesSelected(e.target.files)}
      />

      {/* 2. Galerie Multi-sélection */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => handleFilesSelected(e.target.files)}
      />

      {/* ── Boutons d'Action Smartphone ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
        {/* Prendre une photo (Caméra) */}
        <button
          type="button"
          disabled={uploading || photos.length >= maxPhotos}
          onClick={() => cameraInputRef.current?.click()}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '12px 14px',
            borderRadius: 10,
            background: 'var(--navy, #1C2B4A)',
            color: '#FFFFFF',
            border: 'none',
            fontSize: 13,
            fontWeight: 700,
            cursor: uploading ? 'not-allowed' : 'pointer',
            minHeight: 46,
          }}
        >
          <Camera size={18} />
          <span>Prendre photo</span>
        </button>

        {/* Galerie Photos */}
        <button
          type="button"
          disabled={uploading || photos.length >= maxPhotos}
          onClick={() => galleryInputRef.current?.click()}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '12px 14px',
            borderRadius: 10,
            background: '#FFFFFF',
            color: 'var(--navy, #1C2B4A)',
            border: '1.5px solid var(--border, #E8DDD2)',
            fontSize: 13,
            fontWeight: 700,
            cursor: uploading ? 'not-allowed' : 'pointer',
            minHeight: 46,
          }}
        >
          <ImageIcon size={18} color="var(--accent, #C75B00)" />
          <span>Depuis galerie</span>
        </button>
      </div>

      {/* Feedback de Chargement */}
      {uploading && (
        <div
          style={{
            padding: '10px 14px',
            background: '#FAF8F5',
            borderRadius: 8,
            border: '1px solid var(--border, #E8DDD2)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 12.5,
            color: 'var(--navy, #1C2B4A)',
          }}
        >
          <Loader2 size={16} className="spin" color="var(--accent, #C75B00)" />
          <span>{uploadProgress || 'Téléversement en cours…'}</span>
        </div>
      )}

      {/* Message d'erreur */}
      {uploadError && (
        <div
          style={{
            padding: '10px 14px',
            background: '#FEE2E2',
            borderRadius: 8,
            border: '1px solid #FCA5A5',
            color: '#991B1B',
            fontSize: 12.5,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <AlertCircle size={16} />
          <span>{uploadError}</span>
        </div>
      )}

      {/* ── Grille des Photos Ajoutées ── */}
      {photos.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(95px, 1fr))',
            gap: 10,
            marginTop: 6,
          }}
        >
          {photos.map((url, idx) => {
            const isPrimary = idx === 0
            return (
              <div
                key={idx}
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '1 / 1',
                  borderRadius: 10,
                  overflow: 'hidden',
                  border: isPrimary ? '2px solid var(--accent, #C75B00)' : '1px solid var(--border, #E8DDD2)',
                  background: '#F1EBE3',
                }}
              >
                <img
                  src={url}
                  alt={`Photo ${idx + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  loading="lazy"
                />

                {/* Badge Principale */}
                {isPrimary ? (
                  <div
                    style={{
                      position: 'absolute',
                      top: 4,
                      left: 4,
                      background: 'var(--accent, #C75B00)',
                      color: '#FFFFFF',
                      fontSize: 9,
                      fontWeight: 800,
                      padding: '2px 5px',
                      borderRadius: 4,
                    }}
                  >
                    Principale
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(idx)}
                    style={{
                      position: 'absolute',
                      top: 4,
                      left: 4,
                      background: 'rgba(255, 255, 255, 0.85)',
                      border: 'none',
                      borderRadius: '50%',
                      width: 24,
                      height: 24,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                    title="Définir comme photo principale"
                  >
                    <Star size={13} color="#D97706" />
                  </button>
                )}

                {/* Bouton Supprimer */}
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    background: 'rgba(220, 38, 38, 0.85)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '50%',
                    width: 24,
                    height: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                  title="Supprimer cette photo"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            )
          })}
        </div>
      ) : (
        <div
          style={{
            padding: '20px 14px',
            background: '#FAF8F5',
            borderRadius: 10,
            border: '1.5px dashed var(--border, #E8DDD2)',
            textAlign: 'center',
            color: '#64748B',
            fontSize: 12.5,
          }}
        >
          Aucune photo ajoutée. Photographiez le bien sur place avec votre téléphone pour valoriser l&apos;annonce.
        </div>
      )}

      <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
        {photos.length} / {maxPhotos} photos • La 1ère photo sera le visuel de couverture.
      </div>
    </div>
  )
}

export default BienPhotoUploader
