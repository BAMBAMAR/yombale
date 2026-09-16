'use client'

import React from 'react'
import ExternalImg from '@/components/ExternalImg'
import { Sparkles, RefreshCw, Search, Film } from 'lucide-react'
import { DiscoveredPost, SocialAccountAdmin } from '../types'
import { SocialProfilePlaceholderCard } from './SocialProfilePlaceholderCard'

interface SocialImportProfileViewProps {
  profilePlatform: 'tiktok' | 'instagram' | 'facebook' | 'youtube'
  setProfilePlatform: (p: 'tiktok' | 'instagram' | 'facebook' | 'youtube') => void
  profileUsername: string
  setProfileUsername: (u: string) => void
  exploringProfile: boolean
  handleExploreProfile: (e?: React.FormEvent) => Promise<void>
  accounts: SocialAccountAdmin[]
  discoveredPosts: DiscoveredPost[]
  selectedDiscoveredUrls: Set<string>
  setSelectedDiscoveredUrls: React.Dispatch<React.SetStateAction<Set<string>>>
  importingDiscovered: boolean
  handleImportDiscovered: () => Promise<void>
  batchUrlsText?: string
  setBatchUrlsText?: (text: string) => void
  batchImporting?: boolean
  handleImportBatch?: (e: React.FormEvent) => Promise<void>
}

export function SocialImportProfileView({
  profilePlatform,
  setProfilePlatform,
  profileUsername,
  setProfileUsername,
  exploringProfile,
  handleExploreProfile,
  accounts,
  discoveredPosts,
  selectedDiscoveredUrls,
  setSelectedDiscoveredUrls,
  importingDiscovered,
  handleImportDiscovered,
  batchUrlsText = '',
  setBatchUrlsText,
  batchImporting = false,
  handleImportBatch,
}: SocialImportProfileViewProps) {
  const placeholderPost = discoveredPosts.find(p => p.isProfilePlaceholder)
  const realPosts = discoveredPosts.filter(p => !p.isProfilePlaceholder)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div
        style={{
          background: '#fff7ed',
          border: '1px solid #fed7aa',
          borderRadius: 10,
          padding: '10px 14px',
          fontSize: 12.5,
          color: '#9a3412',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Sparkles size={16} style={{ flexShrink: 0 }} />
        <span>
          <strong>Zéro copier-coller :</strong> Renseignez votre pseudo ou collez des liens de vidéos. Nopalou explore vos contenus et les prépare pour votre catalogue.
        </span>
      </div>

      <form onSubmit={handleExploreProfile} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <select
          value={profilePlatform}
          onChange={e => setProfilePlatform(e.target.value as any)}
          style={{
            padding: '10px 12px',
            borderRadius: 10,
            border: '1.5px solid #cbd5e1',
            fontSize: 13,
            fontWeight: 700,
            background: '#ffffff',
            outline: 'none',
            flex: '0 0 auto',
          }}
        >
          <option value="tiktok">TikTok</option>
          <option value="instagram">Instagram</option>
          <option value="youtube">YouTube</option>
          <option value="facebook">Facebook</option>
        </select>

        <div style={{ flex: '1 1 180px', minWidth: 0, position: 'relative' }}>
          <input
            type="text"
            placeholder="Ex: @votre_boutique ou collez des liens de vidéos..."
            value={profileUsername}
            onChange={e => setProfileUsername(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 10,
              border: '1.5px solid #cbd5e1',
              fontSize: 13,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={exploringProfile || !profileUsername.trim()}
          style={{
            background: exploringProfile ? '#94a3b8' : '#0f172a',
            color: '#ffffff',
            border: 'none',
            borderRadius: 10,
            padding: '10px 18px',
            fontSize: 13,
            fontWeight: 900,
            cursor: exploringProfile ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            flex: '1 1 auto',
          }}
        >
          {exploringProfile ? (
            <>
              <RefreshCw size={14} className="spin" />
              <span>Exploration…</span>
            </>
          ) : (
            <>
              <Search size={14} />
              <span>Aspirer les vidéos</span>
            </>
          )}
        </button>
      </form>

      {/* Raccourcis profils connectés */}
      {accounts.filter(a => a.nom_compte).length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11.5, color: '#64748b' }}>Raccourcis :</span>
          {accounts
            .filter(a => a.nom_compte)
            .map(acc => (
              <button
                key={acc.id}
                type="button"
                onClick={() => {
                  setProfilePlatform(acc.plateforme as any)
                  setProfileUsername(acc.nom_compte)
                }}
                style={{
                  background: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  borderRadius: 20,
                  padding: '2px 8px',
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: '#334155',
                  cursor: 'pointer',
                }}
              >
                @{acc.nom_compte.replace(/^@/, '')} ({acc.plateforme})
              </button>
            ))}
        </div>
      )}

      {/* Carte Profil Vérifié + Zone d'import rapide si timeline protégée */}
      {placeholderPost && (
        <SocialProfilePlaceholderCard
          placeholderPost={placeholderPost}
          profileUsername={profileUsername}
          batchUrlsText={batchUrlsText}
          setBatchUrlsText={setBatchUrlsText}
          batchImporting={batchImporting}
          handleImportBatch={handleImportBatch}
        />
      )}

      {/* Grille des publications découvertes à cocher */}
      {realPosts.length > 0 && (
        <div style={{ border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '14px', background: '#f8fafc' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 8,
              marginBottom: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>
                {realPosts.length} trouvée(s)
              </span>
              <span
                style={{
                  fontSize: 11.5,
                  color: '#C75B00',
                  background: '#fff7ed',
                  padding: '1px 6px',
                  borderRadius: 8,
                  fontWeight: 700,
                }}
              >
                {selectedDiscoveredUrls.size} cochée(s)
              </span>
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                onClick={() => {
                  const all = new Set<string>()
                  realPosts.forEach(p => all.add(p.url))
                  setSelectedDiscoveredUrls(all)
                }}
                style={{
                  background: '#fff',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  padding: '3px 8px',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Tout cocher
              </button>
              <button
                type="button"
                onClick={() => setSelectedDiscoveredUrls(new Set())}
                style={{
                  background: '#fff',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  padding: '3px 8px',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Décocher
              </button>
            </div>
          </div>

          {/* Grille 2 colonnes ultra-compacte */}
          <div className="social-discovered-grid">
            {realPosts.map((p, idx) => {
              const isSelected = selectedDiscoveredUrls.has(p.url)
              return (
                <div
                  key={p.url || idx}
                  onClick={() => {
                    if (p.is_already_imported) return
                    const next = new Set(selectedDiscoveredUrls)
                    if (next.has(p.url)) next.delete(p.url)
                    else next.add(p.url)
                    setSelectedDiscoveredUrls(next)
                  }}
                  style={{
                    display: 'flex',
                    gap: 8,
                    padding: 8,
                    borderRadius: 10,
                    background: isSelected ? '#fff7ed' : '#ffffff',
                    border: `1.5px solid ${isSelected ? '#C75B00' : '#e2e8f0'}`,
                    cursor: p.is_already_imported ? 'default' : 'pointer',
                    opacity: p.is_already_imported ? 0.6 : 1,
                    position: 'relative',
                    boxSizing: 'border-box',
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 58,
                      borderRadius: 6,
                      background: '#0f172a',
                      overflow: 'hidden',
                      flexShrink: 0,
                      position: 'relative',
                    }}
                  >
                    {p.thumbnailUrl ? (
                      <ExternalImg src={p.thumbnailUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#94a3b8',
                        }}
                      >
                        <Film size={18} />
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: 11.5,
                        color: '#1e293b',
                        fontWeight: 600,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        lineHeight: 1.3,
                      }}
                    >
                      {p.caption || 'Sans légende'}
                    </p>
                    <span
                      style={{
                        fontSize: 10,
                        color: p.is_already_imported ? '#16a34a' : isSelected ? '#C75B00' : '#64748b',
                        fontWeight: 800,
                      }}
                    >
                      {p.is_already_imported ? '✓ Déjà importé' : isSelected ? '✓ Sélectionné' : '+ Sélectionner'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          <button
            type="button"
            onClick={handleImportDiscovered}
            disabled={importingDiscovered || selectedDiscoveredUrls.size === 0}
            style={{
              marginTop: 12,
              width: '100%',
              background: selectedDiscoveredUrls.size === 0 ? '#cbd5e1' : '#C75B00',
              color: '#ffffff',
              border: 'none',
              borderRadius: 10,
              padding: '11px',
              fontSize: 13,
              fontWeight: 900,
              cursor: selectedDiscoveredUrls.size === 0 || importingDiscovered ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {importingDiscovered ? (
              <>
                <RefreshCw size={15} className="spin" />
                <span>Importation en cours…</span>
              </>
            ) : (
              <>
                <Sparkles size={15} />
                <span>Importer les {selectedDiscoveredUrls.size} publications sélectionnées</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
