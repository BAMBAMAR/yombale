'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Share2,
  Plus,
  Copy,
  ExternalLink,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Check,
  Eye,
  EyeOff,
  Send,
  MessageCircle,
} from 'lucide-react'
import { SocialLinkItem } from './types'
import ModalEditSocialLink from './ModalEditSocialLink'
import { adminSaveSocialLinks, adminResetSocialLinks } from '@/app/actions/admin'

interface KitComSocialLinksManagerProps {
  initialLinks?: SocialLinkItem[]
  onCopy: (txt: string, label: string) => void
}

const DEFAULT_LINKS: SocialLinkItem[] = [
  { id: 'tiktok', name: 'TikTok Officiel', handle: '@nopalou.com', url: 'https://www.tiktok.com/@nopalou.com', code: 'TT', bg: '#000000', color: '#ffffff', actif: true, ordre: 1, description: 'Vidéos démos & astuces commerçants' },
  { id: 'whatsapp_channel', name: 'Canal WhatsApp', handle: 'Canal Nopalou.com', url: 'https://whatsapp.com/channel/0029Vb8fc4bBadmW40AFKx33', code: 'WA', bg: '#25D366', color: '#ffffff', actif: true, ordre: 2, description: 'Canal officiel des alertes et bons plans' },
  { id: 'facebook', name: 'Facebook Page', handle: 'Nopalou Sénégal', url: 'https://www.facebook.com/profile.php?id=61591675701726', code: 'FB', bg: '#1877F2', color: '#ffffff', actif: true, ordre: 3, description: 'Actualités, communauté et événements' },
  { id: 'instagram', name: 'Instagram', handle: '@nopalousn', url: 'https://www.instagram.com/nopalousn/', code: 'IG', bg: '#E4405F', color: '#ffffff', actif: true, ordre: 4, description: 'Photos boutiques, carrousels et stories' },
  { id: 'twitter', name: 'Twitter / X', handle: '@nopalou_sn', url: 'https://x.com/nopalou_sn', code: 'X', bg: '#0f172a', color: '#ffffff', actif: true, ordre: 5, description: 'Fil d\'actualités et mises à jour produit' },
  { id: 'whatsapp_support', name: 'WhatsApp Support', handle: '+221 70 871 79 42', url: 'https://wa.me/221708717942', code: 'SP', bg: '#128C7E', color: '#ffffff', actif: true, ordre: 6, description: 'Ligne directe assistance marchands & acheteurs' },
]

export default function KitComSocialLinksManager({
  initialLinks,
  onCopy,
}: KitComSocialLinksManagerProps) {
  const [links, setLinks] = useState<SocialLinkItem[]>(
    Array.isArray(initialLinks) && initialLinks.length > 0 ? initialLinks : DEFAULT_LINKS
  )
  const [editingItem, setEditingItem] = useState<SocialLinkItem | null | undefined>(undefined) // undefined = closed, null = new, item = edit
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<string | null>(null)

  const persistLinks = async (nextLinks: SocialLinkItem[]) => {
    setLinks(nextLinks)
    setSaving(true)
    setSaveStatus(null)
    try {
      const res = await adminSaveSocialLinks(nextLinks)
      if (res.success) {
        setSaveStatus('Enregistré ✓')
        setTimeout(() => setSaveStatus(null), 3000)
      } else {
        setSaveStatus('Erreur de sauvegarde')
      }
    } catch {
      setSaveStatus('Erreur réseau')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveModal = async (saved: SocialLinkItem) => {
    let next: SocialLinkItem[]
    const exists = links.some((l) => l.id === saved.id)
    if (exists) {
      next = links.map((l) => (l.id === saved.id ? saved : l))
    } else {
      next = [...links, { ...saved, ordre: links.length + 1 }]
    }
    setEditingItem(undefined)
    await persistLinks(next)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Supprimer définitivement le profil "${name}" des réseaux officiels ?`)) return
    const next = links.filter((l) => l.id !== id)
    await persistLinks(next)
  }

  const handleToggleActif = async (id: string) => {
    const next = links.map((l) => (l.id === id ? { ...l, actif: !l.actif } : l))
    await persistLinks(next)
  }

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= links.length) return
    const next = [...links]
    const temp = next[index]
    next[index] = next[targetIndex]
    next[targetIndex] = temp
    const reordered = next.map((l, idx) => ({ ...l, ordre: idx + 1 }))
    await persistLinks(reordered)
  }

  const handleReset = async () => {
    if (!window.confirm('Rétablir la liste des réseaux sociaux officiels par défaut ?')) return
    setSaving(true)
    try {
      const res = await adminResetSocialLinks()
      if (res.success) {
        setLinks(DEFAULT_LINKS)
        setSaveStatus('Réseaux par défaut rétablis ✓')
        setTimeout(() => setSaveStatus(null), 3000)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleCopyInvitation = (item: SocialLinkItem) => {
    const msg = `Suivez Nopalou sur ${item.name} (${item.handle}) pour découvrir les meilleures offres et nouveautés au Sénégal : ${item.url}`
    onCopy(msg, `Message d'invitation ${item.name}`)
  }

  return (
    <section>
      {/* En-tête de section avec actions globales */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Share2 size={18} color="var(--navy, #1C2B4A)" />
          <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
            Profils Sociaux & Réseaux Officiels Nopalou
          </h2>
          <span style={{ fontSize: 12, background: '#f1f5f9', padding: '2px 8px', borderRadius: 12, color: 'var(--text2)', fontWeight: 600 }}>
            {links.filter((l) => l.actif).length} actifs / {links.length} total
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {saveStatus && (
            <span style={{ fontSize: 12, color: saveStatus.includes('✓') ? '#047857' : '#b91c1c', fontWeight: 600 }}>
              {saveStatus}
            </span>
          )}
          <button
            type="button"
            onClick={handleReset}
            disabled={saving}
            title="Rétablir les profils officiels initiaux"
            className="btn-npl"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '6px 10px', background: '#ffffff', border: '1px solid var(--border)' }}
          >
            <RotateCcw size={12} />
            <span>Rétablir défaut</span>
          </button>
          <button
            type="button"
            onClick={() => setEditingItem(null)}
            className="btn-npl"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              padding: '6px 12px',
              background: 'var(--navy)',
              color: '#ffffff',
              border: 'none',
            }}
          >
            <Plus size={13} />
            <span>Ajouter un réseau</span>
          </button>
        </div>
      </div>

      {/* Grille des Réseaux Sociaux */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {links.map((s, index) => (
          <div
            key={s.id}
            style={{
              border: s.actif ? '1px solid var(--border, #E2E8F0)' : '1px dashed #cbd5e1',
              borderRadius: 12,
              padding: '16px',
              background: s.actif ? '#fff' : '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 12,
              opacity: s.actif ? 1 : 0.75,
              position: 'relative',
            }}
          >
            <div>
              {/* Badge supérieur & statut */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: s.bg,
                      color: s.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      fontWeight: 900,
                      letterSpacing: '0.5px',
                      flexShrink: 0,
                    }}
                  >
                    {s.code}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                      {s.name}
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>
                      {s.handle}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button
                    type="button"
                    onClick={() => handleToggleActif(s.id)}
                    title={s.actif ? 'Masquer ce réseau' : 'Activer ce réseau'}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: s.actif ? '#047857' : '#94a3b8',
                      padding: 2,
                    }}
                  >
                    {s.actif ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingItem(s)}
                    title="Modifier ce profil réseau"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--navy)',
                      padding: 2,
                    }}
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(s.id, s.name)}
                    title="Supprimer ce profil réseau"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#b91c1c',
                      padding: 2,
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {s.description && (
                <p style={{ margin: '4px 0 8px', fontSize: 11, color: 'var(--text2)', fontStyle: 'italic' }}>
                  {s.description}
                </p>
              )}

              {/* URL tronquée sécurisée */}
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--accent, #C75B00)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  background: '#f8fafc',
                  padding: '4px 8px',
                  borderRadius: 4,
                  border: '1px solid var(--border)',
                }}
                title={s.url}
              >
                {s.url}
              </div>
            </div>

            {/* Actions sur le profil */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => onCopy(s.url, s.name)}
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    background: '#F1F5F9',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--navy, #1C2B4A)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                  }}
                >
                  <Copy size={11} />
                  <span>Copier lien</span>
                </button>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '6px 12px',
                    background: s.bg,
                    color: s.color,
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <span>Ouvrir</span>
                  <ExternalLink size={11} />
                </a>
              </div>

              {/* Raccourci inviter / créer post */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, borderTop: '1px solid #f1f5f9', paddingTop: 6 }}>
                <button
                  type="button"
                  onClick={() => handleCopyInvitation(s)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text2)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: 0,
                    fontSize: 11,
                  }}
                  title="Copier le texte d'invitation à rejoindre ce réseau"
                >
                  <MessageCircle size={11} />
                  <span>Texte d&apos;invitation</span>
                </button>

                {/* Ordonnancement */}
                <div style={{ display: 'flex', gap: 2 }}>
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => handleMove(index, 'up')}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: index === 0 ? 'default' : 'pointer',
                      opacity: index === 0 ? 0.3 : 0.8,
                      padding: 1,
                    }}
                    title="Monter"
                  >
                    <ArrowUp size={12} />
                  </button>
                  <button
                    type="button"
                    disabled={index === links.length - 1}
                    onClick={() => handleMove(index, 'down')}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: index === links.length - 1 ? 'default' : 'pointer',
                      opacity: index === links.length - 1 ? 0.3 : 0.8,
                      padding: 1,
                    }}
                    title="Descendre"
                  >
                    <ArrowDown size={12} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modale d'édition / création */}
      {editingItem !== undefined && (
        <ModalEditSocialLink
          item={editingItem}
          onClose={() => setEditingItem(undefined)}
          onSave={handleSaveModal}
        />
      )}
    </section>
  )
}
