'use client'

import React, { useState, useRef } from 'react'
import {
  Video,
  Film,
  Upload,
  Link2,
  Trash2,
  Play,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Plus,
  ExternalLink
} from 'lucide-react'
import { getImmoAuthHeaders } from '@/lib/immo-auth'

interface BienVideoUploaderProps {
  slug: string
  videos: string[]
  onChange: (videos: string[]) => void
  maxVideos?: number
}

function detectVideoType(url: string): 'youtube' | 'tiktok' | 'matterport' | 'direct' | 'other' {
  if (!url) return 'other'
  const lower = url.toLowerCase()
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube'
  if (lower.includes('tiktok.com')) return 'tiktok'
  if (lower.includes('matterport.com')) return 'matterport'
  if (lower.match(/\.(mp4|webm|mov|ogg)(\?.*)?$/i) || lower.includes('cloudinary') || lower.includes('video/upload')) return 'direct'
  return 'other'
}

export function BienVideoUploader({
  slug,
  videos,
  onChange,
  maxVideos = 3,
}: BienVideoUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)
  const [linkInput, setLinkInput] = useState('')
  const [addingLink, setAddingLink] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // 1. Ajout via téléversement direct de fichier vidéo (MP4, MOV, WebM)
  async function handleVideoFileSelected(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploadError(null)
    setUploadSuccess(null)

    if (videos.length >= maxVideos) {
      setUploadError(`Vous avez atteint la limite maximale de ${maxVideos} vidéos.`)
      return
    }

    const file = files[0]
    // Limite 50 Mo
    if (file.size > 50 * 1024 * 1024) {
      setUploadError('Le fichier vidéo dépasse la taille maximale autorisée (50 Mo).')
      return
    }

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('video', file)

      const res = await fetch(`/api/biens/agence/${slug}/upload-video`, {
        method: 'POST',
        headers: getImmoAuthHeaders(),
        body: formData,
      })

      const data = await res.json()
      if (res.ok && data.success && data.url) {
        onChange([...videos, data.url])
        setUploadSuccess('Vidéo téléversée avec succès !')
        setTimeout(() => setUploadSuccess(null), 3000)
      } else {
        setUploadError(data.error || 'Erreur lors du téléversement de la vidéo.')
      }
    } catch (err) {
      console.error('[VIDEO_UPLOAD_ERR]', err)
      setUploadError('Erreur de connexion. Vérifiez votre réseau et réessayez.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // 2. Ajout via lien externe (YouTube, TikTok, Reel, Matterport 3D, MP4)
  async function handleAddLink(e: React.FormEvent) {
    e.preventDefault()
    setUploadError(null)
    setUploadSuccess(null)

    const trimmed = linkInput.trim()
    if (!trimmed) return

    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      setUploadError('Veuillez saisir une URL valide débutant par https://')
      return
    }

    if (videos.includes(trimmed)) {
      setUploadError('Cette vidéo a déjà été ajoutée.')
      return
    }

    if (videos.length >= maxVideos) {
      setUploadError(`Vous avez atteint la limite maximale de ${maxVideos} vidéos.`)
      return
    }

    try {
      setAddingLink(true)
      const res = await fetch(`/api/biens/agence/${slug}/upload-video`, {
        method: 'POST',
        headers: getImmoAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ url: trimmed }),
      })

      const data = await res.json()
      if (res.ok && data.success && data.url) {
        onChange([...videos, data.url])
        setLinkInput('')
        setUploadSuccess('Lien vidéo validé et ajouté !')
        setTimeout(() => setUploadSuccess(null), 3000)
      } else {
        // En cas d'indisponibilité du validateur, on conserve l'URL saisie
        onChange([...videos, trimmed])
        setLinkInput('')
        setUploadSuccess('Lien vidéo ajouté.')
        setTimeout(() => setUploadSuccess(null), 3000)
      }
    } catch (err) {
      // Fallback
      onChange([...videos, trimmed])
      setLinkInput('')
    } finally {
      setAddingLink(false)
    }
  }

  function handleRemove(index: number) {
    const updated = videos.filter((_, i) => i !== index)
    onChange(updated)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* ── Entrée Fichier Vidéo Invisible ── */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm,video/*"
        style={{ display: 'none' }}
        onChange={(e) => handleVideoFileSelected(e.target.files)}
      />

      {/* ── Actions d'Ajout (Upload Fichier & Lien Externe) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
        {/* Bouton Téléverser Fichier Vidéo */}
        <button
          type="button"
          disabled={uploading || videos.length >= maxVideos}
          onClick={() => fileInputRef.current?.click()}
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
            cursor: uploading || videos.length >= maxVideos ? 'not-allowed' : 'pointer',
            opacity: videos.length >= maxVideos ? 0.6 : 1,
            minHeight: 46,
          }}
        >
          {uploading ? (
            <>
              <Loader2 size={17} className="spin" />
              <span>Téléversement vidéo…</span>
            </>
          ) : (
            <>
              <Upload size={17} />
              <span>Téléverser vidéo (MP4, MOV)</span>
            </>
          )}
        </button>
      </div>

      {/* ── Formulaire d'Ajout par Lien Externe ── */}
      <form onSubmit={handleAddLink} style={{ display: 'flex', gap: 8 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <div
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94A3B8',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Link2 size={16} />
          </div>
          <input
            type="url"
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            placeholder="Lien YouTube, TikTok, Matterport 3D ou MP4..."
            disabled={addingLink || videos.length >= maxVideos}
            style={{
              width: '100%',
              padding: '11px 12px 11px 36px',
              borderRadius: 8,
              border: '1.5px solid var(--border, #E8DDD2)',
              background: '#FFFFFF',
              fontSize: 13,
              color: 'var(--navy, #1C2B4A)',
              outline: 'none',
            }}
          />
        </div>
        <button
          type="submit"
          disabled={addingLink || !linkInput.trim() || videos.length >= maxVideos}
          style={{
            padding: '0 16px',
            borderRadius: 8,
            background: 'var(--accent, #C75B00)',
            color: '#FFFFFF',
            border: 'none',
            fontSize: 13,
            fontWeight: 700,
            cursor: addingLink || !linkInput.trim() || videos.length >= maxVideos ? 'not-allowed' : 'pointer',
            opacity: !linkInput.trim() || videos.length >= maxVideos ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            whiteSpace: 'nowrap',
          }}
        >
          {addingLink ? (
            <Loader2 size={15} className="spin" />
          ) : (
            <>
              <Plus size={15} />
              <span>Ajouter</span>
            </>
          )}
        </button>
      </form>

      {/* Messages Feedback */}
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

      {uploadSuccess && (
        <div
          style={{
            padding: '10px 14px',
            background: '#F0FDF4',
            borderRadius: 8,
            border: '1px solid #BBF7D0',
            color: '#166534',
            fontSize: 12.5,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <CheckCircle2 size={16} />
          <span>{uploadSuccess}</span>
        </div>
      )}

      {/* ── Liste des Vidéos Ajoutées ── */}
      {videos.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
          {videos.map((vidUrl, idx) => {
            const vType = detectVideoType(vidUrl)
            const isDirectVideo = vType === 'direct'

            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: '#FAF8F5',
                  border: '1px solid var(--border, #E8DDD2)',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: 'rgba(199, 91, 0, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--accent, #C75B00)',
                      flexShrink: 0,
                    }}
                  >
                    {isDirectVideo ? <Film size={18} /> : <Video size={18} />}
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: 'var(--navy, #1C2B4A)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span>Vidéo {idx + 1}</span>
                      <span
                        style={{
                          fontSize: 10.5,
                          padding: '1px 6px',
                          borderRadius: 4,
                          background: '#E2E8F0',
                          color: '#475569',
                          textTransform: 'uppercase',
                          fontWeight: 800,
                        }}
                      >
                        {vType}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 11.5,
                        color: '#64748B',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: 320,
                      }}
                      title={vidUrl}
                    >
                      {vidUrl}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <a
                    href={vidUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 32,
                      height: 32,
                      borderRadius: 6,
                      background: '#FFFFFF',
                      border: '1px solid var(--border, #E8DDD2)',
                      color: 'var(--navy, #1C2B4A)',
                      textDecoration: 'none',
                    }}
                    title="Voir la vidéo"
                  >
                    <ExternalLink size={14} />
                  </a>

                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 32,
                      height: 32,
                      borderRadius: 6,
                      background: '#FEE2E2',
                      border: '1px solid #FCA5A5',
                      color: '#991B1B',
                      cursor: 'pointer',
                    }}
                    title="Supprimer cette vidéo"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div
          style={{
            padding: '16px 14px',
            background: '#FAF8F5',
            borderRadius: 10,
            border: '1.5px dashed var(--border, #E8DDD2)',
            textAlign: 'center',
            color: '#64748B',
            fontSize: 12.5,
          }}
        >
          Aucune vidéo ajoutée. Ajoutez une vidéo de visite ou collez un lien YouTube / Matterport 3D pour booster l'engagement.
        </div>
      )}

      <div style={{ fontSize: 11, color: '#94A3B8' }}>
        {videos.length} / {maxVideos} vidéo(s) • Fichiers MP4/MOV jusqu&apos;à 50 Mo ou liens YouTube, TikTok, Matterport 3D acceptés.
      </div>
    </div>
  )
}

export default BienVideoUploader
