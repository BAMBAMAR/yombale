'use client'

import React, { useState } from 'react'
import {
  Camera,
  Music,
  Share2,
  MessageCircle,
  Globe,
  Video,
  Send,
  CheckCircle2,
  Save,
  Check,
  ExternalLink,
  Plus,
  Trash2,
} from 'lucide-react'
import { SocialAccountsConfig } from '../types'

interface SocialAccountsTabProps {
  accounts: SocialAccountsConfig
  setAccounts: React.Dispatch<React.SetStateAction<SocialAccountsConfig>>
  onSave: () => Promise<void>
  saving: boolean
}

const PLATFORMS_CONFIG = [
  {
    key: 'instagram' as const,
    label: 'Instagram',
    icon: Camera,
    placeholder: '@mon_agence_immo ou https://instagram.com/...',
    color: '#E1306C',
    desc: 'Diffusez vos reels de visites de villas et appartements.'
  },
  {
    key: 'tiktok' as const,
    label: 'TikTok',
    icon: Music,
    placeholder: '@agence_immo_sn ou https://tiktok.com/@...',
    color: '#000000',
    desc: 'Visites guidées immersives et formats courts viraux.'
  },
  {
    key: 'facebook' as const,
    label: 'Facebook',
    icon: Share2,
    placeholder: 'https://facebook.com/monagence',
    color: '#1877F2',
    desc: 'Page officielle et annonces sponsorisées de biens.'
  },
  {
    key: 'whatsapp' as const,
    label: 'WhatsApp Pro / Groupe',
    icon: MessageCircle,
    placeholder: '+221 77 000 00 00 ou https://wa.me/221...',
    color: '#25D366',
    desc: 'Canal direct de discussion et diffusion des nouveaux biens.'
  },
  {
    key: 'linkedin' as const,
    label: 'LinkedIn Entreprise',
    icon: Globe,
    placeholder: 'https://linkedin.com/company/agence-immo',
    color: '#0A66C2',
    desc: 'Immobilier professionnel, bureaux, plateaux et investisseurs.'
  },
  {
    key: 'youtube' as const,
    label: 'YouTube (Visites 4K)',
    icon: Video,
    placeholder: 'https://youtube.com/@agence_immo',
    color: '#FF0000',
    desc: 'Visites complètes en haute définition et interviews.'
  },
  {
    key: 'twitter' as const,
    label: 'X / Twitter',
    icon: Send,
    placeholder: '@agence_immo',
    color: '#0F1419',
    desc: 'Actualités du marché immobilier et opportunités urgentes.'
  },
  {
    key: 'site_web' as const,
    label: 'Site Web Officiel',
    icon: Globe,
    placeholder: 'https://monagence.sn',
    color: 'var(--navy, #1C2B4A)',
    desc: 'Votre domaine ou portail web institutionnel.'
  },
]

export function SocialAccountsTab({
  accounts,
  setAccounts,
  onSave,
  saving,
}: SocialAccountsTabProps) {
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [tempValue, setTempValue] = useState('')

  function startEditing(key: string, currentValue: string) {
    setEditingKey(key)
    setTempValue(currentValue || '')
  }

  function handleSaveSingle(key: string) {
    const cleaned = tempValue.replace(/^@+$/, '').trim()
    setAccounts(prev => ({ ...prev, [key]: cleaned }))
    setEditingKey(null)
    setTempValue('')
  }

  function handleDisconnect(key: string) {
    setAccounts(prev => ({ ...prev, [key]: '' }))
    if (editingKey === key) {
      setEditingKey(null)
      setTempValue('')
    }
  }

  const nbConfigured = Object.values(accounts).filter(v => !!v?.trim() && v.trim() !== '@').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Bandeau d'état ── */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid var(--border, #E8DDD2)',
          borderRadius: 12,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
            Réseaux Sociaux Officiels de l'Agence
          </div>
          <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 2 }}>
            {nbConfigured} sur {PLATFORMS_CONFIG.length} réseaux connectés • Vos liens s'affichent automatiquement sur votre vitrine publique.
          </div>
        </div>

        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="btn-npl"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '9px 18px',
            borderRadius: 8,
            background: 'var(--accent, #C75B00)',
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: 13,
            border: 'none',
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? <Check size={16} /> : <Save size={16} />}
          {saving ? 'Enregistrement...' : 'Enregistrer tous les profils'}
        </button>
      </div>

      {/* ── Grille des réseaux sociaux ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 14 }}>
        {PLATFORMS_CONFIG.map(plat => {
          const Icon = plat.icon
          const rawVal = accounts[plat.key] || ''
          const val = rawVal.replace(/^@+$/, '').trim()
          const isConnected = !!val && val !== '@'
          const isEditing = editingKey === plat.key

          return (
            <div
              key={plat.key}
              style={{
                background: '#FFFFFF',
                border: `1px solid ${isConnected ? '#BBF7D0' : 'var(--border, #E8DDD2)'}`,
                borderRadius: 12,
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                boxShadow: isConnected ? '0 1px 4px rgba(22, 163, 74, 0.06)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: isConnected ? '#DCFCE7' : 'rgba(28, 43, 74, 0.05)',
                      color: isConnected ? '#166534' : plat.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                      {plat.label}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>{plat.desc}</div>
                  </div>
                </div>

                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 750,
                    padding: '2px 8px',
                    borderRadius: 12,
                    background: isConnected ? '#DCFCE7' : '#F1F5F9',
                    color: isConnected ? '#166534' : '#64748B',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  {isConnected ? (
                    <>
                      <CheckCircle2 size={12} />
                      Connecté
                    </>
                  ) : (
                    'Non configuré'
                  )}
                </span>
              </div>

              {/* Valeur ou Champ d'édition */}
              {isEditing ? (
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  <input
                    type="text"
                    value={tempValue}
                    onChange={e => setTempValue(e.target.value)}
                    placeholder={plat.placeholder}
                    className="form-input"
                    style={{ padding: '8px 10px', fontSize: 12.5 }}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveSingle(plat.key)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: 'var(--accent, #C75B00)',
                      color: '#FFFFFF',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Valider
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingKey(null)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 8,
                      background: '#F1F5F9',
                      color: '#64748B',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    Annuler
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                  <div
                    style={{
                      fontSize: 12.5,
                      color: isConnected ? 'var(--navy, #1C2B4A)' : '#94A3B8',
                      fontWeight: isConnected ? 600 : 400,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '65%',
                    }}
                  >
                    {val || plat.placeholder}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {isConnected && (
                      <button
                        type="button"
                        onClick={() => handleDisconnect(plat.key)}
                        style={{
                          background: '#FEF2F2',
                          border: '1px solid #FECACA',
                          padding: '4px 8px',
                          borderRadius: 6,
                          fontSize: 11.5,
                          fontWeight: 700,
                          color: '#DC2626',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                        title="Déconnecter ce compte"
                      >
                        <Trash2 size={12} />
                        <span>Déconnecter</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => startEditing(plat.key, val)}
                      style={{
                        background: 'none',
                        border: '1px solid var(--border, #E8DDD2)',
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontSize: 11.5,
                        fontWeight: 700,
                        color: 'var(--navy, #1C2B4A)',
                        cursor: 'pointer',
                      }}
                    >
                      {isConnected ? 'Modifier' : 'Configurer'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
