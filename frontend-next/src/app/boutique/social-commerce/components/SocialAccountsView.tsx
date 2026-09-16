'use client'

import React from 'react'
import { Camera, Music, Share2, RefreshCw, Trash2, Film } from 'lucide-react'
import { SocialAccountAdmin } from '../types'

interface SocialAccountsViewProps {
  accounts: SocialAccountAdmin[]
  editingPlatform: string | null
  setEditingPlatform: (plat: string | null) => void
  accountInput: string
  setAccountInput: (val: string) => void
  handleSaveAccount: (platform: string) => Promise<void>
  handleDeleteAccount: (platform: string) => Promise<void>
  handleToggleAutoSync: (acc: SocialAccountAdmin) => Promise<void>
  handleSyncAccount: (acc: SocialAccountAdmin) => Promise<void>
  syncingAccountId: string | null
}

const PLATFORMS_CONFIG = [
  { key: 'instagram', label: 'Instagram', Icon: Camera, placeholder: '@maboutique ou lien profil' },
  { key: 'tiktok', label: 'TikTok', Icon: Music, placeholder: '@maboutique ou lien profil' },
  { key: 'facebook', label: 'Facebook', Icon: Share2, placeholder: 'Page ou profil Facebook' },
  { key: 'youtube', label: 'YouTube', Icon: Film, placeholder: '@machaîne ou lien chaîne' },
]

export function SocialAccountsView({
  accounts,
  editingPlatform,
  setEditingPlatform,
  accountInput,
  setAccountInput,
  handleSaveAccount,
  handleDeleteAccount,
  handleToggleAutoSync,
  handleSyncAccount,
  syncingAccountId,
}: SocialAccountsViewProps) {
  return (
    <div className="social-shop-compact-card">
      <div style={{ marginBottom: 14 }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 900, color: '#0f172a' }}>
          Profils Sociaux Connectés
        </h3>
        <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
          Renseignez vos identifiants officiels pour aspirer vos publications en 1 clic et synchroniser votre catalogue.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {PLATFORMS_CONFIG.map(plat => {
          const acc = accounts.find(a => a.plateforme === plat.key)
          const isConfigured = Boolean(acc && acc.nom_compte && acc.nom_compte !== '@' && acc.nom_compte.replace(/^@/, '').trim())
          const isEditing = editingPlatform === plat.key
          const IconComp = plat.Icon

          return (
            <div
              key={plat.key}
              className={`social-account-row-compact ${isConfigured ? 'connected' : ''}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: isConfigured ? '#f0fdf4' : '#f1f5f9',
                    border: `1px solid ${isConfigured ? '#bbf7d0' : '#e2e8f0'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isConfigured ? '#15803d' : '#64748b',
                    flexShrink: 0,
                  }}
                >
                  <IconComp size={18} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 800, fontSize: 13.5, color: '#0f172a' }}>{plat.label}</span>
                    {isConfigured ? (
                      <span
                        style={{
                          fontSize: 10.5,
                          background: '#16a34a',
                          color: '#fff',
                          padding: '1px 6px',
                          borderRadius: 10,
                          fontWeight: 800,
                        }}
                      >
                        Connecté
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: 10.5,
                          background: '#e2e8f0',
                          color: '#64748b',
                          padding: '1px 6px',
                          borderRadius: 10,
                          fontWeight: 700,
                        }}
                      >
                        Non configuré
                      </span>
                    )}
                  </div>

                  {isEditing ? (
                    <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                      <input
                        type="text"
                        placeholder={plat.placeholder}
                        value={accountInput}
                        onChange={e => setAccountInput(e.target.value)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: 8,
                          border: '1.5px solid #C75B00',
                          fontSize: 12.5,
                          outline: 'none',
                          flex: '1 1 180px',
                          minWidth: 0,
                        }}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const cleanVal = accountInput.trim()
                          if (!cleanVal || cleanVal === '@') {
                            handleDeleteAccount(plat.key)
                          } else {
                            handleSaveAccount(plat.key)
                          }
                        }}
                        style={{
                          background: '#C75B00',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 8,
                          padding: '6px 12px',
                          fontWeight: 800,
                          fontSize: 12,
                          cursor: 'pointer',
                        }}
                      >
                        Enregistrer
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPlatform(null)
                          setAccountInput('')
                        }}
                        style={{
                          background: '#e2e8f0',
                          color: '#475569',
                          border: 'none',
                          borderRadius: 8,
                          padding: '6px 10px',
                          fontWeight: 700,
                          fontSize: 12,
                          cursor: 'pointer',
                        }}
                      >
                        Annuler
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: isConfigured ? '#15803d' : '#64748b' }}>
                        {isConfigured ? `@${acc!.nom_compte.replace(/^@/, '')}` : 'Aucun compte associé'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {!isEditing && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {isConfigured && acc && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleToggleAutoSync(acc)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          background: acc.auto_sync ? '#dcfce7' : '#f1f5f9',
                          border: `1px solid ${acc.auto_sync ? '#86efac' : '#cbd5e1'}`,
                          borderRadius: 8,
                          padding: '5px 8px',
                          fontSize: 11,
                          fontWeight: 700,
                          color: acc.auto_sync ? '#15803d' : '#64748b',
                          cursor: 'pointer',
                        }}
                        title="Activer/Désactiver la synchronisation automatique en arrière-plan"
                      >
                        <span>{acc.auto_sync ? 'Auto-Sync ON' : 'Auto-Sync OFF'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSyncAccount(acc)}
                        disabled={syncingAccountId === acc.id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          background: '#dcfce7',
                          color: '#15803d',
                          border: '1.5px solid #86efac',
                          borderRadius: 8,
                          padding: '5px 10px',
                          fontSize: 11.5,
                          fontWeight: 800,
                          cursor: syncingAccountId === acc.id ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <RefreshCw size={11} className={syncingAccountId === acc.id ? 'spin' : ''} />
                        <span>{syncingAccountId === acc.id ? 'Recherche…' : 'Sync & Choisir'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteAccount(plat.key)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          background: '#fef2f2',
                          color: '#dc2626',
                          border: '1px solid #fecaca',
                          borderRadius: 8,
                          padding: '5px 8px',
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                        title="Déconnecter et supprimer ce compte"
                      >
                        <Trash2 size={11} />
                        <span>Déconnecter</span>
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setEditingPlatform(plat.key)
                      setAccountInput(isConfigured && acc ? acc.nom_compte : '')
                    }}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: 8,
                      padding: '5px 10px',
                      fontSize: 11.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                      color: '#334155',
                    }}
                  >
                    {isConfigured ? 'Modifier' : '+ Configurer'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
