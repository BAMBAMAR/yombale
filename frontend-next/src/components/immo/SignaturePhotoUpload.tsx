'use client'

import React, { useRef, useState } from 'react'
import { Upload, Camera, RefreshCw, Trash2, CheckCircle2, AlertCircle, Stamp } from 'lucide-react'

interface SignaturePhotoUploadProps {
  label: string
  subtitle: string
  imageDataUrl: string | null
  onChange: (dataUrl: string | null) => void
  isStamp?: boolean
  signerRole?: 'locataire' | 'bailleur' | 'agence'
}

export function optimizeImageFile(file: File, isSignature: boolean = false): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Veuillez sélectionner un fichier image valide (JPG, PNG, WEBP).'))
      return
    }

    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier image.'))
    reader.onload = (e) => {
      const img = new Image()
      img.onerror = () => reject(new Error('Format d\'image non supporté ou fichier corrompu.'))
      img.onload = () => {
        try {
          const maxDim = 1000
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
          canvas.width = Math.max(width, 1)
          canvas.height = Math.max(height, 1)
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            resolve(String(e.target?.result))
            return
          }

          ctx.drawImage(img, 0, 0, width, height)

          // Pour une signature manuscrite sur papier, nettoyer le fond blanc/gris
          if (isSignature) {
            try {
              const imgData = ctx.getImageData(0, 0, width, height)
              const data = imgData.data
              for (let i = 0; i < data.length; i += 4) {
                const r = data[i]
                const g = data[i + 1]
                const b = data[i + 2]
                const brightness = (r * 299 + g * 587 + b * 114) / 1000
                if (brightness > 220) {
                  // Fond clair transformé en transparence nette
                  data[i + 3] = 0
                } else {
                  // Renforcement de la signature manuscrite en bleu-nuit / noir
                  data[i] = Math.max(0, Math.min(28, r))
                  data[i + 1] = Math.max(0, Math.min(43, g))
                  data[i + 2] = Math.max(0, Math.min(74, b))
                }
              }
              ctx.putImageData(imgData, 0, 0)
            } catch {
              // En cas de restriction canvas, conserver l'image originale
            }
          }

          resolve(canvas.toDataURL('image/png'))
        } catch {
          resolve(String(e.target?.result))
        }
      }
      img.src = String(e.target?.result)
    }
    reader.readAsDataURL(file)
  })
}

export default function SignaturePhotoUpload({
  label,
  subtitle,
  imageDataUrl,
  onChange,
  isStamp = false,
  signerRole = 'locataire',
}: SignaturePhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setLoading(true)
      setErrorMsg(null)
      const optimized = await optimizeImageFile(file, !isStamp)
      onChange(optimized)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Impossible de charger l\'image.')
    } finally {
      setLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function handleTriggerClick() {
    fileInputRef.current?.click()
  }

  function handleRemove() {
    onChange(null)
    setErrorMsg(null)
  }

  return (
    <div style={{ marginTop: 6, marginBottom: 12 }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {errorMsg && (
        <div
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            color: '#991B1B',
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 8,
          }}
        >
          <AlertCircle size={14} style={{ flexShrink: 0 }} />
          <span>{errorMsg}</span>
        </div>
      )}

      {imageDataUrl ? (
        <div
          style={{
            padding: '12px',
            borderRadius: 12,
            border: '1.5px solid var(--border, #E8DDD2)',
            background: '#FAF8F5',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {isStamp ? (
                <Stamp size={15} style={{ color: 'var(--accent, #C75B00)' }} />
              ) : (
                <CheckCircle2 size={15} style={{ color: '#166534' }} />
              )}
              <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                {label}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                type="button"
                onClick={handleTriggerClick}
                disabled={loading}
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--border, #E8DDD2)',
                  borderRadius: 6,
                  color: 'var(--navy, #1C2B4A)',
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '4px 8px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <RefreshCw size={11} />
                <span>Remplacer</span>
              </button>

              <button
                type="button"
                onClick={handleRemove}
                disabled={loading}
                style={{
                  background: '#FFF1F2',
                  border: '1px solid #FECDD3',
                  borderRadius: 6,
                  color: '#E11D48',
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '4px 8px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Trash2 size={11} />
                <span>Supprimer</span>
              </button>
            </div>
          </div>

          {/* Aperçu de la photo */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: isStamp ? 140 : 130,
              background: '#ffffff',
              borderRadius: 8,
              border: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              padding: 8,
              boxSizing: 'border-box',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageDataUrl}
              alt={label}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                filter: isStamp ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' : 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10.5, color: '#64748B' }}>
            <span>Photo certifiée pour le document</span>
            <span>Intégré sur le contrat PDF</span>
          </div>
        </div>
      ) : (
        <div
          onClick={handleTriggerClick}
          style={{
            border: '2px dashed var(--border, #E8DDD2)',
            borderRadius: 12,
            background: '#FAF8F5',
            padding: '20px 16px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: '#ffffff',
              border: '1px solid var(--border, #E8DDD2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isStamp ? 'var(--accent, #C75B00)' : 'var(--navy, #1C2B4A)',
            }}
          >
            {isStamp ? <Stamp size={20} /> : <Camera size={20} />}
          </div>

          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
            {label}
          </div>
          <div style={{ fontSize: 11.5, color: '#64748B', maxWidth: 360, lineHeight: 1.35 }}>
            {subtitle}
          </div>

          <div
            style={{
              marginTop: 4,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 12px',
              borderRadius: 6,
              background: 'var(--navy, #1C2B4A)',
              color: '#ffffff',
              fontSize: 11.5,
              fontWeight: 700,
            }}
          >
            <Upload size={12} />
            <span>{loading ? 'Chargement...' : 'Choisir une photo / Scanner'}</span>
          </div>
        </div>
      )}
    </div>
  )
}
