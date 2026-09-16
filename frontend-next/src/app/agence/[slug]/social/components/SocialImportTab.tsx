'use client'

import React, { useState } from 'react'
import {
  Download,
  Link2,
  Camera,
  Music,
  Share2,
  Video,
  CheckCircle2,
  Plus,
  Search,
  Sparkles
} from 'lucide-react'
import { BienItem, SocialPostItem } from '../types'
import { SocialDiscoveredGrid, DiscoveredItem } from './SocialDiscoveredGrid'
import { matchBiensClient } from '../matching-immo-client'
import { getImmoAuthHeaders } from '@/lib/immo-auth'

interface SocialImportTabProps {
  biens: BienItem[]
  onImportPosts: (newPosts: SocialPostItem[]) => void
}

function extractCleanSocialUsername(raw: string): string {
  let u = (raw || '').trim()
  try {
    if (u.startsWith('http://') || u.startsWith('https://')) {
      const parsed = new URL(u)
      const parts = parsed.pathname.split('/').filter(Boolean)
      const atPart = parts.find(p => p.startsWith('@'))
      u = atPart ? atPart.replace(/^@+/, '') : (parts[0] || u)
    }
  } catch (_parseErr) {
    // Si format invalide, conserver la chaîne brute
  }
  return u.replace(/^@+/, '').replace(/\/+$/, '').trim()
}

export function SocialImportTab({ biens, onImportPosts }: SocialImportTabProps) {
  const [mode, setMode] = useState<'profile' | 'batch' | 'single'>('single')
  const [platform, setPlatform] = useState<'instagram' | 'tiktok' | 'facebook' | 'youtube'>('instagram')
  const [singleUrl, setSingleUrl] = useState('')
  const [batchUrls, setBatchUrls] = useState('')
  const [username, setUsername] = useState('')
  const [selectedBienId, setSelectedBienId] = useState('')
  const [caption, setCaption] = useState('')
  const [importing, setImporting] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [discoveredPosts, setDiscoveredPosts] = useState<DiscoveredItem[]>([])
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set())

  function resolveBienForPost(postCaption: string): BienItem | null {
    if (selectedBienId) {
      return biens.find(b => b.id === selectedBienId) || null
    }
    // Smart Matching IA automatique si aucun bien n'a été sélectionné
    if (postCaption && biens.length > 0) {
      const suggestions = matchBiensClient(postCaption, biens)
      if (suggestions.length > 0 && suggestions[0].confidence_score >= 0.50) {
        return suggestions[0].bien
      }
    }
    return null
  }

  function formatAssociatedBien(chosenBien: BienItem | null) {
    if (!chosenBien) return []
    return [
      {
        id: chosenBien.id,
        titre: chosenBien.titre,
        prix: chosenBien.prix_location || chosenBien.prix_vente || 0,
        type_operation: chosenBien.prix_location ? ('location' as const) : ('vente' as const),
        quartier: chosenBien.quartier,
        image_url: chosenBien.images?.[0],
      }
    ]
  }

  async function handleImportSingle(e: React.FormEvent) {
    e.preventDefault()
    if (!singleUrl.trim()) return

    setImporting(true)
    const manualBien = biens.find(b => b.id === selectedBienId)
    const fallbackThumb = manualBien?.images?.[0] || ''

    try {
      const res = await fetch('/api/social-shop/parse-url', {
        method: 'POST',
        headers: getImmoAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          url: singleUrl.trim(),
          fallback_thumbnail: fallbackThumb || undefined,
          custom_caption: caption.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors de la résolution de la vidéo')
      }

      const postData = data.data
      const finalCaption = caption.trim() || postData.caption || (manualBien ? `Visite guidée : ${manualBien.titre}` : '')
      const matchedBien = resolveBienForPost(finalCaption)

      const newPost: SocialPostItem = {
        id: 'post-' + Date.now().toString(36),
        plateforme: postData.plateforme,
        post_url: postData.post_url,
        media_type: postData.media_type === 'TIKTOK_VIDEO' || postData.media_type === 'REEL' || postData.media_type === 'reel' ? 'reel' : 'video',
        thumbnail_url: postData.thumbnail_url || matchedBien?.images?.[0] || '',
        caption: finalCaption || (matchedBien ? `Visite guidée : ${matchedBien.titre}` : 'Visite exclusive bien immobilier'),
        auteur: postData.auteur,
        visible: true,
        is_featured: true,
        created_at: new Date().toISOString(),
        biens_associes: formatAssociatedBien(matchedBien),
      }

      onImportPosts([newPost])
      setSingleUrl('')
      setCaption('')
      const matchNotice = matchedBien ? ` (Bien associé : ${matchedBien.titre})` : ''
      setSuccessMsg(`Publication ${postData.plateforme.toUpperCase()} importée avec succès !${matchNotice}`)
      setTimeout(() => setSuccessMsg(null), 4000)
    } catch (err: any) {
      alert(err.message || 'Impossible d\'importer cette vidéo')
    } finally {
      setImporting(false)
    }
  }

  async function handleImportBatch(e: React.FormEvent) {
    e.preventDefault()
    if (!batchUrls.trim()) return

    setImporting(true)
    const manualBien = biens.find(b => b.id === selectedBienId)
    const fallbackThumb = manualBien?.images?.[0] || ''

    try {
      const res = await fetch('/api/social-shop/parse-batch', {
        method: 'POST',
        headers: getImmoAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          raw_urls: batchUrls,
          fallback_thumbnail: fallbackThumb || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors du traitement par lot')
      }

      const importedPosts: SocialPostItem[] = data.posts.map((p: any, idx: number) => {
        const itemCaption = p.caption || ''
        const matchedBien = resolveBienForPost(itemCaption)
        return {
          id: 'batch-' + Date.now().toString(36) + '-' + idx,
          plateforme: p.plateforme,
          post_url: p.post_url,
          media_type: p.media_type === 'TIKTOK_VIDEO' || p.media_type === 'REEL' ? 'reel' : 'video',
          thumbnail_url: p.thumbnail_url || matchedBien?.images?.[0] || '',
          caption: itemCaption || (matchedBien ? `Visite ${matchedBien.titre}` : 'Visite immobilière'),
          auteur: p.auteur,
          visible: true,
          is_featured: idx === 0,
          created_at: new Date().toISOString(),
          biens_associes: formatAssociatedBien(matchedBien),
        }
      })

      if (importedPosts.length === 0) {
        throw new Error('Aucun lien vidéo valide n\'a pu être extrait')
      }

      onImportPosts(importedPosts)
      setBatchUrls('')
      setSuccessMsg(`${importedPosts.length} publication(s) importée(s) avec succès !`)
      setTimeout(() => setSuccessMsg(null), 4000)
    } catch (err: any) {
      alert(err.message || 'Impossible de traiter ce lot')
    } finally {
      setImporting(false)
    }
  }

  async function handleExploreProfile(e: React.FormEvent) {
    e.preventDefault()
    const cleanUser = extractCleanSocialUsername(username)
    if (!cleanUser) {
      alert('Veuillez renseigner un pseudo ou un lien de compte valide.')
      return
    }

    setImporting(true)
    setDiscoveredPosts([])
    setSelectedUrls(new Set())

    try {
      const res = await fetch('/api/social-shop/explore-profile', {
        method: 'POST',
        headers: getImmoAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          plateforme: platform,
          platform: platform,
          username: cleanUser,
        }),
      })
      const data = await res.json()
      if (data.success && data.posts && data.posts.length > 0) {
        const found: DiscoveredItem[] = data.posts
        setDiscoveredPosts(found)
        setSelectedUrls(new Set(found.map(p => p.url)))
        setSuccessMsg(`${found.length} publication(s) trouvée(s) pour @${cleanUser}. Sélectionnez celles à importer :`)
      } else {
        throw new Error(data.error || 'Aucune publication publique trouvée pour ce compte')
      }
    } catch (err: any) {
      alert(err.message || 'Impossible d\'explorer ce profil')
    } finally {
      setImporting(false)
    }
  }

  function toggleUrlSelection(url: string) {
    const next = new Set(selectedUrls)
    if (next.has(url)) next.delete(url)
    else next.add(url)
    setSelectedUrls(next)
  }

  function handleConfirmImportDiscovered() {
    const chosen = discoveredPosts.filter(p => selectedUrls.has(p.url))
    if (chosen.length === 0) {
      alert('Veuillez sélectionner au moins une vidéo à importer.')
      return
    }

    const imported: SocialPostItem[] = chosen.map((p, idx) => {
      const matchedBien = resolveBienForPost(p.caption || '')
      return {
        id: `${platform.slice(0, 2)}-` + Date.now().toString(36) + '-' + idx,
        plateforme: (p.platform || platform) as 'instagram' | 'tiktok' | 'facebook' | 'youtube',
        post_url: p.url,
        media_type: p.mediaType === 'VIDEO' ? 'video' : 'reel',
        thumbnail_url: p.thumbnailUrl || matchedBien?.images?.[0] || '',
        caption: p.caption || (matchedBien ? `Visite ${matchedBien.titre}` : `Publication @${username}`),
        auteur: p.author || `@${username}`,
        visible: true,
        is_featured: idx === 0,
        created_at: new Date().toISOString(),
        biens_associes: formatAssociatedBien(matchedBien),
      }
    })

    onImportPosts(imported)
    setDiscoveredPosts([])
    setSelectedUrls(new Set())
    setUsername('')
    setSuccessMsg(`${imported.length} publication(s) importée(s) et enregistrée(s) avec succès !`)
    setTimeout(() => setSuccessMsg(null), 4000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ── Sélecteur de Mode ── */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid var(--border, #E8DDD2)',
          borderRadius: 12,
          padding: 6,
          display: 'flex',
          gap: 6,
        }}
      >
        {[
          { id: 'single' as const, label: 'Lien Direct (Reel / Vidéo)', icon: Link2 },
          { id: 'profile' as const, label: 'Par Profil (@Compte)', icon: Search },
          { id: 'batch' as const, label: 'Import par Lot (Multi-Liens)', icon: Download },
        ].map(m => {
          const Icon = m.icon
          const active = mode === m.id
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => { setMode(m.id); setDiscoveredPosts([]) }}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: 8,
                border: 'none',
                background: active ? 'var(--navy, #1C2B4A)' : 'transparent',
                color: active ? '#FFFFFF' : '#64748B',
                fontWeight: 800,
                fontSize: 12.5,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Icon size={15} />
              <span>{m.label}</span>
            </button>
          )
        })}
      </div>

      {successMsg && (
        <div style={{ padding: '10px 14px', background: '#DCFCE7', color: '#166534', borderRadius: 8, fontSize: 12.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle2 size={16} />
          {successMsg}
        </div>
      )}

      {/* ── Formulaire Selon Mode ── */}
      <div style={{ background: '#FFFFFF', border: '1px solid var(--border, #E8DDD2)', borderRadius: 12, padding: 20 }}>
        {mode === 'single' && (
          <form onSubmit={handleImportSingle} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="form-label">URL de la vidéo / Reel TikTok, Instagram, YouTube ou Facebook</label>
              <input
                type="url"
                required
                value={singleUrl}
                onChange={e => setSingleUrl(e.target.value)}
                placeholder="https://www.instagram.com/reel/... ou https://www.tiktok.com/@.../video/..."
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Associer un bien immobilier (Optionnel - Détection IA automatique si vide)</label>
              <select
                value={selectedBienId}
                onChange={e => setSelectedBienId(e.target.value)}
                className="form-input"
                style={{ background: '#FFF' }}
              >
                <option value="">-- Détection automatique par Smart Matching --</option>
                {biens.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.titre} ({b.prix_location ? `${Number(b.prix_location).toLocaleString('fr-FR')} F/mois` : `${Number(b.prix_vente || 0).toLocaleString('fr-FR')} F`}) - {b.quartier}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Légende personnalisée (Optionnel)</label>
              <input
                type="text"
                value={caption}
                onChange={e => setCaption(e.target.value)}
                placeholder="Ex: Splendide villa aux Almadies avec piscine..."
                className="form-input"
              />
            </div>

            <button
              type="submit"
              disabled={importing}
              className="agence-btn-primary"
              style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <Plus size={15} />
              <span>{importing ? 'Importation en cours...' : 'Importer cette vidéo'}</span>
            </button>
          </form>
        )}

        {mode === 'profile' && (
          <form onSubmit={handleExploreProfile} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="form-label">Plateforme Réseau Social</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { id: 'instagram', label: 'Instagram', icon: Camera },
                  { id: 'tiktok', label: 'TikTok', icon: Music },
                  { id: 'youtube', label: 'YouTube', icon: Video },
                  { id: 'facebook', label: 'Facebook', icon: Share2 },
                ].map(p => {
                  const Icon = p.icon
                  const active = platform === p.id
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => { setPlatform(p.id as any); setDiscoveredPosts([]) }}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 8,
                        border: '1.5px solid',
                        borderColor: active ? 'var(--navy, #1C2B4A)' : 'var(--border, #E8DDD2)',
                        background: active ? 'var(--navy, #1C2B4A)' : '#FFFFFF',
                        color: active ? '#FFFFFF' : 'var(--navy, #1C2B4A)',
                        fontWeight: 700,
                        fontSize: 12.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        cursor: 'pointer',
                      }}
                    >
                      <Icon size={15} />
                      {p.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="form-label">Pseudo du compte officiel (@nom_utilisateur) *</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: 10, color: '#94A3B8', fontWeight: 800 }}>@</span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => {
                    const val = e.target.value
                    if (val.includes('http') || val.includes('.com') || val.includes('/') || val.startsWith('@')) {
                      setUsername(extractCleanSocialUsername(val))
                    } else {
                      setUsername(val)
                    }
                  }}
                  onBlur={() => setUsername(extractCleanSocialUsername(username))}
                  placeholder="nom_compte ou coller l'URL du profil"
                  className="form-input"
                  style={{ paddingLeft: 30 }}
                />
              </div>
            </div>

            <div>
              <label className="form-label">Associer un bien aux vidéos trouvées (Optionnel)</label>
              <select
                value={selectedBienId}
                onChange={e => setSelectedBienId(e.target.value)}
                className="form-input"
                style={{ background: '#FFF' }}
              >
                <option value="">-- Détection automatique par Smart Matching --</option>
                {biens.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.titre} - {b.quartier}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={importing}
              className="agence-btn-primary"
              style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <Sparkles size={15} />
              <span>{importing ? 'Exploration en cours...' : 'Aspirer les vidéos publiques'}</span>
            </button>
          </form>
        )}

        {mode === 'batch' && (
          <form onSubmit={handleImportBatch} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="form-label">Collez les liens de vos vidéos (Un lien par ligne)</label>
              <textarea
                rows={5}
                required
                value={batchUrls}
                onChange={e => setBatchUrls(e.target.value)}
                placeholder="https://www.instagram.com/reel/C7x...&#10;https://www.tiktok.com/@agence/video/73...&#10;https://www.youtube.com/shorts/..."
                className="form-input"
                style={{ fontFamily: 'monospace', fontSize: 12 }}
              />
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
                Prend en charge Instagram Reels, TikTok, YouTube Shorts et vidéos Facebook.
              </div>
            </div>

            <div>
              <label className="form-label">Associer un bien à ce lot (Optionnel)</label>
              <select
                value={selectedBienId}
                onChange={e => setSelectedBienId(e.target.value)}
                className="form-input"
                style={{ background: '#FFF' }}
              >
                <option value="">-- Détection automatique par Smart Matching --</option>
                {biens.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.titre} - {b.quartier}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={importing}
              className="agence-btn-primary"
              style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <Download size={15} />
              <span>{importing ? 'Importation en cours...' : 'Importer tout le lot'}</span>
            </button>
          </form>
        )}
      </div>

      {/* ── Grille de Sélection des Publications Découvertes ── */}
      <SocialDiscoveredGrid
        discoveredPosts={discoveredPosts}
        selectedUrls={selectedUrls}
        onToggleUrl={toggleUrlSelection}
        onConfirmImport={handleConfirmImportDiscovered}
      />
    </div>
  )
}
