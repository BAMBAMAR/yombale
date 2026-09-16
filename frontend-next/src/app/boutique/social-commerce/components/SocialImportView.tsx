'use client'

import React from 'react'
import { Sparkles, Layers, Link2, UploadCloud } from 'lucide-react'
import { DiscoveredPost, ImportMode, SocialAccountAdmin, ProduitCatalogue } from '../types'
import { SocialImportProfileView } from './SocialImportProfileView'
import { SocialImportBatchView } from './SocialImportBatchView'
import { SocialImportSingleView } from './SocialImportSingleView'
import { SocialImportMediaView } from './SocialImportMediaView'

interface SocialImportViewProps {
  importMode: ImportMode
  setImportMode: (m: ImportMode) => void
  autoMatch: boolean
  setAutoMatch: (b: boolean) => void
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
  catalogue?: ProduitCatalogue[]
  batchUrlsText: string
  setBatchUrlsText: (text: string) => void
  batchImporting: boolean
  handleImportBatch: (e: React.FormEvent) => Promise<void>
  importUrl: string
  setImportUrl: (url: string) => void
  importing: boolean
  handleImportUrl: (e: React.FormEvent) => Promise<void>
  handleImportMedia?: (files: File[], caption: string) => Promise<void>
  mediaUploading?: boolean
}

export function SocialImportView({
  importMode,
  setImportMode,
  autoMatch,
  setAutoMatch,
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
  catalogue = [],
  batchUrlsText,
  setBatchUrlsText,
  batchImporting,
  handleImportBatch,
  importUrl,
  setImportUrl,
  importing,
  handleImportUrl,
  handleImportMedia,
  mediaUploading = false,
}: SocialImportViewProps) {
  return (
    <div id="social-selection-section" className="social-shop-compact-card">
      <div style={{ marginBottom: 14 }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 900, color: '#0f172a' }}>
          Ajouter des Publications
        </h3>
        <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
          Importez vos vidéos Instagram, TikTok, YouTube ou vos photos WhatsApp Status avec analyse IA.
        </p>
      </div>

      {/* Barre de navigation des 4 Sous-Modes */}
      <div className="social-tabs-nav" style={{ flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setImportMode('profile')}
          className="social-tab-btn"
          style={{
            background: importMode === 'profile' ? '#C75B00' : '#f8fafc',
            color: importMode === 'profile' ? '#ffffff' : '#475569',
            boxShadow: importMode === 'profile' ? '0 2px 8px rgba(199,91,0,0.2)' : 'none',
          }}
        >
          <Sparkles size={14} />
          <span>Aspirateur @pseudo</span>
        </button>

        <button
          type="button"
          onClick={() => setImportMode('media')}
          className="social-tab-btn"
          style={{
            background: importMode === 'media' ? '#C75B00' : '#f8fafc',
            color: importMode === 'media' ? '#ffffff' : '#475569',
            boxShadow: importMode === 'media' ? '0 2px 8px rgba(199,91,0,0.2)' : 'none',
          }}
        >
          <UploadCloud size={14} />
          <span>WhatsApp & Photos (OCR)</span>
        </button>

        <button
          type="button"
          onClick={() => setImportMode('batch')}
          className="social-tab-btn"
          style={{
            background: importMode === 'batch' ? '#C75B00' : '#f8fafc',
            color: importMode === 'batch' ? '#ffffff' : '#475569',
            boxShadow: importMode === 'batch' ? '0 2px 8px rgba(199,91,0,0.2)' : 'none',
          }}
        >
          <Layers size={14} />
          <span>Liens en lot</span>
        </button>

        <button
          type="button"
          onClick={() => setImportMode('single')}
          className="social-tab-btn"
          style={{
            background: importMode === 'single' ? '#C75B00' : '#f8fafc',
            color: importMode === 'single' ? '#ffffff' : '#475569',
            boxShadow: importMode === 'single' ? '0 2px 8px rgba(199,91,0,0.2)' : 'none',
          }}
        >
          <Link2 size={14} />
          <span>Lien unique</span>
        </button>
      </div>

      {/* Sous-mode actif */}
      {importMode === 'profile' && (
        <SocialImportProfileView
          profilePlatform={profilePlatform}
          setProfilePlatform={setProfilePlatform}
          profileUsername={profileUsername}
          setProfileUsername={setProfileUsername}
          exploringProfile={exploringProfile}
          handleExploreProfile={handleExploreProfile}
          accounts={accounts}
          discoveredPosts={discoveredPosts}
          selectedDiscoveredUrls={selectedDiscoveredUrls}
          setSelectedDiscoveredUrls={setSelectedDiscoveredUrls}
          importingDiscovered={importingDiscovered}
          handleImportDiscovered={handleImportDiscovered}
          catalogue={catalogue}
          batchUrlsText={batchUrlsText}
          setBatchUrlsText={setBatchUrlsText}
          batchImporting={batchImporting}
          handleImportBatch={handleImportBatch}
        />
      )}

      {importMode === 'media' && handleImportMedia && (
        <SocialImportMediaView
          onImportMedia={handleImportMedia}
          mediaUploading={mediaUploading}
          autoMatch={autoMatch}
          setAutoMatch={setAutoMatch}
        />
      )}

      {importMode === 'batch' && (
        <SocialImportBatchView
          batchUrlsText={batchUrlsText}
          setBatchUrlsText={setBatchUrlsText}
          batchImporting={batchImporting}
          handleImportBatch={handleImportBatch}
        />
      )}

      {importMode === 'single' && (
        <SocialImportSingleView
          importUrl={importUrl}
          setImportUrl={setImportUrl}
          importing={importing}
          handleImportUrl={handleImportUrl}
        />
      )}

      {/* Option partagée : Smart Matching */}
      {importMode !== 'media' && (
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#334155', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={autoMatch}
              onChange={e => setAutoMatch(e.target.checked)}
              style={{ accentColor: '#C75B00' }}
            />
            <span>Activer le <strong>Smart Matching</strong> automatique (+85% similarité nom/légende)</span>
          </label>
        </div>
      )}
    </div>
  )
}
