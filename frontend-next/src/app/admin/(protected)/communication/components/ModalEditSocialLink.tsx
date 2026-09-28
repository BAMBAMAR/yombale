'use client'

import React, { useState } from 'react'
import { X, Check, Share2, Palette } from 'lucide-react'
import { SocialLinkItem } from './types'

interface ModalEditSocialLinkProps {
  item: SocialLinkItem | null // null = nouveau
  onClose: () => void
  onSave: (savedItem: SocialLinkItem) => void
}

const PRESETS = [
  { label: 'TikTok', code: 'TT', bg: '#000000', color: '#ffffff', urlPrefix: 'https://www.tiktok.com/@' },
  { label: 'WhatsApp Canal', code: 'WA', bg: '#25D366', color: '#ffffff', urlPrefix: 'https://whatsapp.com/channel/' },
  { label: 'WhatsApp Support', code: 'SP', bg: '#128C7E', color: '#ffffff', urlPrefix: 'https://wa.me/221' },
  { label: 'Facebook', code: 'FB', bg: '#1877F2', color: '#ffffff', urlPrefix: 'https://www.facebook.com/' },
  { label: 'Instagram', code: 'IG', bg: '#E4405F', color: '#ffffff', urlPrefix: 'https://www.instagram.com/' },
  { label: 'Twitter / X', code: 'X', bg: '#0f172a', color: '#ffffff', urlPrefix: 'https://x.com/' },
  { label: 'YouTube', code: 'YT', bg: '#FF0000', color: '#ffffff', urlPrefix: 'https://www.youtube.com/@' },
  { label: 'LinkedIn', code: 'LI', bg: '#0A66C2', color: '#ffffff', urlPrefix: 'https://www.linkedin.com/company/' },
  { label: 'Telegram', code: 'TG', bg: '#24A1DE', color: '#ffffff', urlPrefix: 'https://t.me/' },
  { label: 'Threads', code: 'TH', bg: '#000000', color: '#ffffff', urlPrefix: 'https://www.threads.net/@' },
]

const PALETTE_COULEURS = [
  '#000000', '#25D366', '#128C7E', '#1877F2', '#E4405F',
  '#0f172a', '#FF0000', '#0A66C2', '#24A1DE', '#C75B00', '#1C2B4A'
]

export default function ModalEditSocialLink({
  item,
  onClose,
  onSave,
}: ModalEditSocialLinkProps) {
  const isNew = !item

  const [name, setName] = useState(item?.name || '')
  const [handle, setHandle] = useState(item?.handle || '')
  const [url, setUrl] = useState(item?.url || '')
  const [code, setCode] = useState(item?.code || 'SOC')
  const [bg, setBg] = useState(item?.bg || '#1C2B4A')
  const [color, setColor] = useState(item?.color || '#ffffff')
  const [description, setDescription] = useState(item?.description || '')
  const [actif, setActif] = useState(item ? item.actif : true)

  const handleApplyPreset = (p: typeof PRESETS[0]) => {
    if (!name || isNew) setName(p.label)
    setCode(p.code)
    setBg(p.bg)
    setColor(p.color)
    if (!url || isNew) setUrl(p.urlPrefix)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !url.trim()) return

    const generatedId = item?.id || name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now().toString().slice(-4)

    onSave({
      id: generatedId,
      name: name.trim(),
      handle: handle.trim() || name.trim(),
      url: url.trim(),
      code: (code.trim() || 'SN').toUpperCase().slice(0, 4),
      bg,
      color,
      actif,
      description: description.trim() || undefined,
      ordre: item?.ordre || 99,
    })
  }

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div
        className="admin-modal"
        style={{ maxWidth: 520 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: bg,
                color: color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: 12,
              }}
            >
              {code || 'SN'}
            </div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--navy)' }}>
              {isNew ? 'Ajouter un réseau social' : `Modifier "${item.name}"`}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Boutons de préconfiguration rapide */}
        <div style={{ marginBottom: 16 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
            Préréglages rapides :
          </span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => handleApplyPreset(p)}
                style={{
                  padding: '3px 8px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  border: '1px solid var(--border)',
                  background: '#ffffff',
                  color: 'var(--navy)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: p.bg,
                    display: 'inline-block',
                  }}
                />
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="admin-form-field">
            <label>Nom public du réseau / canal</label>
            <input
              type="text"
              required
              placeholder="Ex: TikTok Officiel, Canal WhatsApp..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: '100%', fontSize: 13 }}
            />
          </div>

          <div className="admin-form-row">
            <div className="admin-form-field">
              <label>Identifiant / Handle visible</label>
              <input
                type="text"
                placeholder="Ex: @nopalou.com, +221..."
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                style={{ width: '100%', fontSize: 13 }}
              />
            </div>
            <div className="admin-form-field">
              <label>Code badge (2-4 lettres)</label>
              <input
                type="text"
                maxLength={4}
                placeholder="Ex: TT, WA, FB..."
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                style={{ width: '100%', fontSize: 13, textTransform: 'uppercase' }}
              />
            </div>
          </div>

          <div className="admin-form-field">
            <label>URL officielle / Lien de redirection</label>
            <input
              type="url"
              required
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              style={{ width: '100%', fontSize: 13 }}
            />
          </div>

          <div className="admin-form-field">
            <label>Description / Usage (facultatif)</label>
            <input
              type="text"
              placeholder="Ex: Vidéos démos et astuces pour commerçants..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: '100%', fontSize: 13 }}
            />
          </div>

          {/* Palette de couleur */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.04em', display: 'block', marginBottom: 6 }}>
              Couleur de la marque
            </label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              {PALETTE_COULEURS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setBg(c)}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    background: c,
                    border: bg === c ? '2px solid var(--navy)' : '1px solid rgba(0,0,0,0.1)',
                    cursor: 'pointer',
                    boxShadow: bg === c ? '0 0 0 2px #ffffff inset' : 'none',
                  }}
                  title={c}
                />
              ))}
              <input
                type="color"
                value={bg}
                onChange={(e) => setBg(e.target.value)}
                style={{ width: 28, height: 26, padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
                title="Couleur personnalisée"
              />
            </div>
          </div>

          {/* Statut Actif */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--navy)',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={actif}
                onChange={(e) => setActif(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: 'var(--accent, #C75B00)' }}
              />
              <span>Réseau actif (visible dans le kit et sur la plateforme)</span>
            </label>
          </div>

          <div className="admin-modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn-npl"
              style={{ background: '#f1f5f9', color: 'var(--text1)', border: '1px solid var(--border)' }}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn-npl"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'var(--navy)',
                color: '#ffffff',
                border: 'none',
              }}
            >
              <Check size={14} />
              <span>{isNew ? 'Créer le réseau' : 'Enregistrer les modifications'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
