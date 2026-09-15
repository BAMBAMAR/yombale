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
  Home,
  Search,
  Sparkles
} from 'lucide-react'
import { BienItem, SocialPostItem } from '../types'

interface SocialImportTabProps {
  biens: BienItem[]
  onImportPosts: (newPosts: SocialPostItem[]) => void
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

  async function handleImportSingle(e: React.FormEvent) {
    e.preventDefault()
    if (!singleUrl.trim()) return

    setImporting(true)
    const chosenBien = biens.find(b => b.id === selectedBienId)
    const fallbackThumb = chosenBien?.images?.[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80'

    try {
      const res = await fetch('/api/social-shop/parse-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: singleUrl.trim(),
          fallback_thumbnail: fallbackThumb,
          custom_caption: caption.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors de la résolution de la vidéo')
      }

      const postData = data.data
      const newPost: SocialPostItem = {
        id: 'post-' + Date.now().toString(36),
        plateforme: postData.plateforme,
        post_url: postData.post_url,
        media_type: postData.media_type === 'TIKTOK_VIDEO' || postData.media_type === 'REEL' || postData.media_type === 'reel' ? 'reel' : 'video',
        thumbnail_url: postData.thumbnail_url || fallbackThumb,
        caption: caption.trim() || postData.caption || (chosenBien ? `Visite guidée : ${chosenBien.titre}` : 'Visite exclusive bien immobilier'),
        auteur: postData.auteur,
        visible: true,
        is_featured: true,
        created_at: new Date().toISOString(),
        biens_associes: chosenBien ? [
          {
            id: chosenBien.id,
            titre: chosenBien.titre,
            prix: chosenBien.prix_location || chosenBien.prix_vente || 0,
            type_operation: chosenBien.prix_location ? 'location' : 'vente',
            quartier: chosenBien.quartier,
            image_url: chosenBien.images?.[0],
          }
        ] : [],
      }

      onImportPosts([newPost])
      setSingleUrl('')
      setCaption('')
      setSuccessMsg(`Publication ${postData.plateforme.toUpperCase()} importée avec succès !`)
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
    const chosenBien = biens.find(b => b.id === selectedBienId)
    const fallbackThumb = chosenBien?.images?.[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80'

    try {
      const res = await fetch('/api/social-shop/parse-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raw_urls: batchUrls,
          fallback_thumbnail: fallbackThumb,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors du traitement en lot')
      }

      const parsedPosts = data.posts || []
      const newPosts: SocialPostItem[] = parsedPosts.map((p: any, idx: number) => ({
        id: 'batch-' + Date.now().toString(36) + '-' + idx,
        plateforme: p.plateforme,
        post_url: p.post_url,
        media_type: 'reel',
        thumbnail_url: p.thumbnail_url || fallbackThumb,
        caption: p.caption || (chosenBien ? `Visite ${chosenBien.titre}` : `Visite vidéo #${idx + 1}`),
        auteur: p.auteur,
        visible: true,
        is_featured: idx === 0,
        created_at: new Date().toISOString(),
        biens_associes: chosenBien ? [
          {
            id: chosenBien.id,
            titre: chosenBien.titre,
            prix: chosenBien.prix_location || chosenBien.prix_vente || 0,
            type_operation: chosenBien.prix_location ? 'location' : 'vente',
            quartier: chosenBien.quartier,
            image_url: chosenBien.images?.[0],
          }
        ] : [],
      }))

      onImportPosts(newPosts)
      setBatchUrls('')
      setSuccessMsg(`${newPosts.length} vidéo(s) importée(s) avec succès !`)
      setTimeout(() => setSuccessMsg(null), 4000)
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l\'import groupé')
    } finally {
      setImporting(false)
    }
  }

  async function handleExploreProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!username.trim()) return

    const cleanUser = username.replace(/^@+/, '').trim()
    if (!cleanUser) return

    setImporting(true)
    const chosenBien = biens.find(b => b.id === selectedBienId)
    const fallbackThumb = chosenBien?.images?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=600&q=80'

    try {
      const res = await fetch(`/api/social-shop/explore-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plateforme: platform, username: cleanUser }),
      })
      const data = await res.json()
      if (data.success && data.posts && data.posts.length > 0) {
        const imported: SocialPostItem[] = data.posts.map((p: any, idx: number) => ({
          id: `${platform.slice(0, 2)}-` + Date.now().toString(36) + '-' + idx,
          plateforme: platform,
          post_url: p.url,
          media_type: p.mediaType === 'VIDEO' ? 'video' : 'reel',
          thumbnail_url: p.thumbnailUrl || fallbackThumb,
          caption: p.caption || (chosenBien ? `Visite ${chosenBien.titre}` : `Publication @${cleanUser}`),
          auteur: p.author || `@${cleanUser}`,
          visible: true,
          is_featured: idx === 0,
          created_at: new Date().toISOString(),
          biens_associes: chosenBien ? [
            {
              id: chosenBien.id,
              titre: chosenBien.titre,
              prix: chosenBien.prix_location || chosenBien.prix_vente || 0,
              type_operation: chosenBien.prix_location ? 'location' : 'vente',
              quartier: chosenBien.quartier,
              image_url: chosenBien.images?.[0],
            }
          ] : [],
        }))
        onImportPosts(imported)
        setUsername('')
        setSuccessMsg(`${imported.length} publication(s) de @${cleanUser} importée(s) avec succès !`)
        setTimeout(() => setSuccessMsg(null), 4000)
      } else {
        throw new Error(data.error || 'Aucune publication publique trouvée pour ce compte')
      }
    } catch (err: any) {
      alert(err.message || 'Impossible d\'explorer ce profil')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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
        <button
          type="button"
          onClick={() => setMode('single')}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: 8,
            border: 'none',
            background: mode === 'single' ? 'var(--navy, #1C2B4A)' : 'transparent',
            color: mode === 'single' ? '#FFFFFF' : '#64748B',
            fontWeight: 800,
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <Link2 size={16} />
          Lien Direct (Reel / Vidéo)
        </button>

        <button
          type="button"
          onClick={() => setMode('profile')}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: 8,
            border: 'none',
            background: mode === 'profile' ? 'var(--navy, #1C2B4A)' : 'transparent',
            color: mode === 'profile' ? '#FFFFFF' : '#64748B',
            fontWeight: 800,
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <Search size={16} />
          Par Profil (@Compte)
        </button>

        <button
          type="button"
          onClick={() => setMode('batch')}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: 8,
            border: 'none',
            background: mode === 'batch' ? 'var(--navy, #1C2B4A)' : 'transparent',
            color: mode === 'batch' ? '#FFFFFF' : '#64748B',
            fontWeight: 800,
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <Download size={16} />
          Import par Lot (Multi-Liens)
        </button>
      </div>

      {successMsg && (
        <div style={{ padding: '12px 16px', background: '#DCFCE7', color: '#166534', borderRadius: 8, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle2 size={16} />
          {successMsg}
        </div>
      )}

      {/* ── Formulaire Selon Mode ── */}
      <div style={{ background: '#FFFFFF', border: '1px solid var(--border, #E8DDD2)', borderRadius: 12, padding: 24 }}>
        {mode === 'single' && (
          <form onSubmit={handleImportSingle} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
              <label className="form-label">Associer un bien immobilier de votre catalogue (Optionnel)</label>
              <select
                value={selectedBienId}
                onChange={e => setSelectedBienId(e.target.value)}
                className="form-input"
                style={{ background: '#FFF' }}
              >
                <option value="">-- Aucun bien associé --</option>
                {biens.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.titre} ({b.prix_location ? `${b.prix_location.toLocaleString()} F/mois` : `${(b.prix_vente || 0).toLocaleString()} F`}) - {b.quartier}
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
              <Plus size={16} />
              <span>{importing ? 'Importation en cours...' : 'Importer cette vidéo'}</span>
            </button>
          </form>
        )}

        {mode === 'profile' && (
          <form onSubmit={handleExploreProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="form-label">Plateforme Réseau Social</label>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
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
                      onClick={() => setPlatform(p.id as any)}
                      style={{
                        padding: '10px 16px',
                        borderRadius: 8,
                        border: '1.5px solid',
                        borderColor: active ? 'var(--navy, #1C2B4A)' : 'var(--border, #E8DDD2)',
                        background: active ? 'var(--navy, #1C2B4A)' : '#FFFFFF',
                        color: active ? '#FFFFFF' : 'var(--navy, #1C2B4A)',
                        fontWeight: 700,
                        fontSize: 13,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        cursor: 'pointer',
                      }}
                    >
                      <Icon size={16} />
                      {p.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="form-label">Pseudo du compte (@nom_utilisateur) *</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: 10, color: '#94A3B8', fontWeight: 800 }}>@</span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="mon_agence_immo"
                  className="form-input"
                  style={{ paddingLeft: 30 }}
                />
              </div>
            </div>

            <div>
              <label className="form-label">Associer un bien de votre catalogue aux vidéos importées (Optionnel)</label>
              <select
                value={selectedBienId}
                onChange={e => setSelectedBienId(e.target.value)}
                className="form-input"
                style={{ background: '#FFF' }}
              >
                <option value="">-- Aucun bien associé --</option>
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
              <Sparkles size={16} />
              <span>{importing ? 'Exploration & Importation...' : 'Aspirer les vidéos publiques'}</span>
            </button>
          </form>
        )}

        {mode === 'batch' && (
          <form onSubmit={handleImportBatch} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="form-label">Collez les liens de vos vidéos (Un lien par ligne)</label>
              <textarea
                rows={5}
                required
                value={batchUrls}
                onChange={e => setBatchUrls(e.target.value)}
                placeholder="https://www.instagram.com/reel/C7x...&#10;https://www.tiktok.com/@agence/video/73...&#10;https://www.youtube.com/shorts/..."
                className="form-input"
                style={{ fontFamily: 'monospace', fontSize: 12.5 }}
              />
              <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 4 }}>
                Prend en charge Instagram Reels, TikTok, YouTube Shorts et vidéos Facebook.
              </div>
            </div>

            <div>
              <label className="form-label">Associer un bien à ce lot de vidéos (Optionnel)</label>
              <select
                value={selectedBienId}
                onChange={e => setSelectedBienId(e.target.value)}
                className="form-input"
                style={{ background: '#FFF' }}
              >
                <option value="">-- Aucun bien associé --</option>
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
              <Download size={16} />
              <span>{importing ? 'Importation en cours...' : 'Importer tout le lot'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
