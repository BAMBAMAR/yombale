'use client'

import React, { useState, useRef } from 'react'
import { UploadCloud, Image, Film, X, Sparkles, RefreshCw, CheckCircle2 } from 'lucide-react'

interface SocialImportMediaViewProps {
  onImportMedia: (files: File[], caption: string) => Promise<void>
  mediaUploading: boolean
  autoMatch: boolean
  setAutoMatch: (val: boolean) => void
}

export function SocialImportMediaView({
  onImportMedia,
  mediaUploading,
  autoMatch,
  setAutoMatch,
}: SocialImportMediaViewProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [caption, setCaption] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      setSelectedFiles(prev => [...prev, ...newFiles].slice(0, 10))
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).filter(
        f => f.type.startsWith('image/') || f.type.startsWith('video/')
      )
      setSelectedFiles(prev => [...prev, ...newFiles].slice(0, 10))
    }
  }

  function handleRemoveFile(index: number) {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (selectedFiles.length === 0 || mediaUploading) return
    await onImportMedia(selectedFiles, caption)
    setSelectedFiles([])
    setCaption('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Bannière d'explication WhatsApp & Médias */}
      <div
        style={{
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: 10,
          padding: '10px 14px',
          fontSize: 12.5,
          color: '#166534',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Sparkles size={16} style={{ flexShrink: 0, color: '#16a34a' }} />
        <span>
          <strong>WhatsApp Status & Galerie Photo :</strong> Uploadez vos captures d&apos;écran WhatsApp ou photos de produits. Notre OCR extrait automatiquement les prix et les références pour les associer à vos produits.
        </span>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Zone Dropzone */}
        <div
          onDragOver={e => {
            e.preventDefault()
            setIsDragOver(true)
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${isDragOver ? '#C75B00' : '#cbd5e1'}`,
            borderRadius: 12,
            background: isDragOver ? '#fff7ed' : '#ffffff',
            padding: '24px 16px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: '#fff7ed',
              color: '#C75B00',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <UploadCloud size={22} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#1C2B4A' }}>
              Cliquez pour choisir vos fichiers ou glissez-déposez ici
            </p>
            <p style={{ margin: '3px 0 0', fontSize: 11.5, color: '#64748b' }}>
              Photos WhatsApp Status, affiches, captures ou vidéos (JPG, PNG, WebP, MP4 — max 10 fichiers)
            </p>
          </div>
        </div>

        {/* Prévisualisation des fichiers sélectionnés */}
        {selectedFiles.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 11.5, fontWeight: 800, color: '#1C2B4A' }}>
              Fichiers sélectionnés ({selectedFiles.length}/10) :
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {selectedFiles.map((file, idx) => {
                const isImg = file.type.startsWith('image/')
                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      background: '#F8F5F0',
                      border: '1px solid #E8DDD2',
                      borderRadius: 8,
                      padding: '4px 8px',
                      fontSize: 11.5,
                      color: '#1C2B4A',
                    }}
                  >
                    {isImg ? <Image size={14} style={{ color: '#0A5C36' }} /> : <Film size={14} style={{ color: '#C75B00' }} />}
                    <span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {file.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#94a3b8',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      title="Retirer ce fichier"
                    >
                      <X size={13} />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Légende globale optionnelle */}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#1C2B4A', marginBottom: 4 }}>
            Légende ou description (optionnelle, analysée avec l&apos;OCR) :
          </label>
          <input
            type="text"
            placeholder="Ex: Robe chic en soie disponible 25.000 FCFA #mode"
            value={caption}
            onChange={e => setCaption(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: 8,
              border: '1.5px solid #cbd5e1',
              fontSize: 12.5,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Option auto-link */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#334155', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={autoMatch}
            onChange={e => setAutoMatch(e.target.checked)}
            style={{ accentColor: '#C75B00' }}
          />
          <span>
            <strong>Auto-associer :</strong> Lier automatiquement les produits ayant un score de correspondance élevé (≥ 85%)
          </span>
        </label>

        {/* Bouton d'importation */}
        <button
          type="submit"
          disabled={mediaUploading || selectedFiles.length === 0}
          style={{
            background: mediaUploading || selectedFiles.length === 0 ? '#94a3b8' : '#C75B00',
            color: '#ffffff',
            border: 'none',
            borderRadius: 10,
            padding: '11px 18px',
            fontSize: 13,
            fontWeight: 900,
            cursor: mediaUploading || selectedFiles.length === 0 ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {mediaUploading ? (
            <>
              <RefreshCw size={15} className="spin" />
              <span>Analyse OCR & Importation en cours…</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={15} />
              <span>Importer et analyser avec l&apos;IA ({selectedFiles.length})</span>
            </>
          )}
        </button>
      </form>
    </div>
  )
}
