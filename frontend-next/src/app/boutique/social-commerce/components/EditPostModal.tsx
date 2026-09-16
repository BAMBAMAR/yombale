'use client'

import React, { useState } from 'react'
import { X, Image as ImageIcon, FileText, Check, Sparkles } from 'lucide-react'
import { SocialPostAdmin } from '../types'
import ExternalImg from '@/components/ExternalImg'

interface EditPostModalProps {
  post: SocialPostAdmin
  onClose: () => void
  onSave: (postId: string, data: { caption?: string; thumbnail_url?: string }) => Promise<void>
}

export default function EditPostModal({ post, onClose, onSave }: EditPostModalProps) {
  const [caption, setCaption] = useState(post.caption || '')
  const [thumbnailUrl, setThumbnailUrl] = useState(post.thumbnail_url || '')
  const [saving, setSaving] = useState(false)

  const productImages = post.produits?.flatMap(p => p.images || []).filter(Boolean) || []

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await onSave(post.id, {
      caption: caption.trim(),
      thumbnail_url: thumbnailUrl.trim() || undefined,
    })
    setSaving(false)
    onClose()
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 16,
          width: '100%',
          maxWidth: 480,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#fafaf9',
          }}
        >
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: '#1C2B4A' }}>
            Modifier la publication ({post.plateforme})
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#94a3b8',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} style={{ padding: '18px' }}>
          {/* Légende */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 6 }}>
              <FileText size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              Légende / Titre de la publication
            </label>
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              rows={3}
              placeholder="Ex: Robe de soirée en bazin riche..."
              style={{
                width: '100%',
                boxSizing: 'border-box',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                padding: '8px 10px',
                fontSize: 12.5,
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* URL de Miniature */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 6 }}>
              <ImageIcon size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              URL de la miniature / Aperçu photo
            </label>
            <input
              type="url"
              value={thumbnailUrl}
              onChange={e => setThumbnailUrl(e.target.value)}
              placeholder="https://... (URL d'image ou Cloudinary)"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                padding: '8px 10px',
                fontSize: 12.5,
                outline: 'none',
              }}
            />

            {/* Suggestions issues des produits associés */}
            {productImages.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                  <Sparkles size={11} style={{ color: '#C75B00' }} />
                  Utiliser une image du produit associé :
                </span>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {productImages.slice(0, 4).map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setThumbnailUrl(img)}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 6,
                        border: thumbnailUrl === img ? '2px solid #C75B00' : '1px solid #cbd5e1',
                        padding: 0,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        background: '#f8fafc',
                      }}
                      title="Sélectionner cette photo comme miniature"
                    >
                      <ExternalImg src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Prévisualisation */}
          {thumbnailUrl && (
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, background: '#f8fafc', padding: 8, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ width: 44, height: 44, borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
                <ExternalImg src={thumbnailUrl} alt="Aperçu" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <span style={{ fontSize: 11.5, color: '#16a34a', fontWeight: 700 }}>
                Aperçu valide
              </span>
            </div>
          )}

          {/* Boutons d'action */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#f1f5f9',
                color: '#475569',
                border: 'none',
                borderRadius: 8,
                padding: '8px 14px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                background: '#C75B00',
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 12,
                fontWeight: 800,
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Check size={14} />
              <span>{saving ? 'Enregistrement...' : 'Enregistrer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
