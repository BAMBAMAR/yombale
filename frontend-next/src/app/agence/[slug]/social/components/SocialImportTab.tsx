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
  Check,
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

  function detectPlatformFromUrl(url: string): 'instagram' | 'tiktok' | 'facebook' | 'youtube' {
    if (url.includes('tiktok.com')) return 'tiktok'
    if (url.includes('instagram.com')) return 'instagram'
    if (url.includes('facebook.com') || url.includes('fb.watch')) return 'facebook'
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
    return 'instagram'
  }

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
      setSuccessMsg(`${newPosts.length} vidéo(s) importée(s) avec succès avec leurs aperçus officiels !`)
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
      if (platform === 'youtube') {
        const res = await fetch(`/api/social-shop/explore-profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plateforme: 'youtube', username: cleanUser }),
        })
        const data = await res.json()
        if (data.success && data.posts && data.posts.length > 0) {
          const imported: SocialPostItem[] = data.posts.map((p: any, idx: number) => ({
            id: 'yt-' + Date.now().toString(36) + '-' + idx,
            plateforme: 'youtube',
            post_url: p.url,
            media_type: 'video',
            thumbnail_url: p.thumbnailUrl || fallbackThumb,
            caption: p.caption,
            auteur: p.author,
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
          setSuccessMsg(`${imported.length} vidéo(s) YouTube de @${cleanUser} importée(s) !`)
          setTimeout(() => setSuccessMsg(null), 4000)
          return
        }
      }

      setMode('batch')
      alert(`Pour ${platform === 'instagram' ? 'Instagram' : 'TikTok'}, copiez et collez directement les liens de vos vidéos dans l'onglet "Import en Lot" (un lien par ligne) pour les importer instantanément.`)
    } catch (err: any) {
      alert(err.message || 'Impossible d\'explorer ce profil')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Sélecteur de Mode d'Importation ── */}
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
        <div
          style={{
            padding: '12px 16px',
            background: '#DCFCE7',
            color: '#166534',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <CheckCircle2 size={16} />
          {successMsg}
        </div>
      )}

      {/* ── Formulaire Selon le Mode ── */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid var(--border, #E8DDD2)',
          borderRadius: 12,
          padding: 24,
        }}
      >
        {mode === 'single' && (
          <form onSubmit={handleImportSingle} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="form-label">URL de la vidéo / Reel TikTok, Instagram ou Facebook</label>
              <input
                type="url"
                required
                value={singleUrl}
                onChange={e => setSingleUrl(e.target.value)}
                placeholder="https://www.instagram.com/reel/... ou https://www.tiktok.com/@.../video/..."
                className="form-input"
              />
              <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 4 }}>
                Collez le lien de partage officiel de la visite immobilière.
              </div>
            </div>

            <div>
              <label className="form-label">Associer un bien immobilier de votre catalogue (Optionnel)</label>
              <select
                value={selectedBienId}
                onChange={e => setSelectedBienId(e.target.value)}
                className="form-select"
              >
                <option value="">-- Aucun bien lié (Vidéo générale de l'agence) --</option>
                {biens.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.titre} — {b.prix_location ? `${Number(b.prix_location).toLocaleString('fr-FR')} FCFA/mois` : `${Number(b.prix_vente || 0).toLocaleString('fr-FR')} FCFA`} ({b.quartier || b.ville})
                  </option>
                ))}
              </select>
              <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 4 }}>
                Le bien sélectionné apparaîtra en incrustation sur la vidéo avec son prix et bouton WhatsApp direct.
              </div>
            </div>

            <div>
              <label className="form-label">Titre ou légende d'accroche</label>
              <input
                type="text"
                value={caption}
                onChange={e => setCaption(e.target.value)}
                placeholder="Ex: Visite guidée magnifique Villa R+2 à Ngor Almadies"
                className="form-input"
              />
            </div>

            <button
              type="submit"
              disabled={importing || !singleUrl.trim()}
              className="btn-npl"
              style={{
                padding: '12px 20px',
                borderRadius: 8,
                background: 'var(--accent, #C75B00)',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: 14,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginTop: 8,
              }}
            >
              <Plus size={16} />
              {importing ? 'Importation en cours...' : 'Ajouter la vidéo au Social Shop'}
            </button>
          </form>
        )}

        {mode === 'profile' && (
          <form onSubmit={handleExploreProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-grid-2">
              <div>
                <label className="form-label">Plateforme sociale</label>
                <select
                  value={platform}
                  onChange={e => setPlatform(e.target.value as any)}
                  className="form-select"
                >
                  <option value="instagram">Instagram</option>
                  <option value="tiktok">TikTok</option>
                  <option value="facebook">Facebook</option>
                  <option value="youtube">YouTube</option>
                </select>
              </div>

              <div>
                <label className="form-label">Nom d'utilisateur / Handle</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="@mon_agence_immo"
                  className="form-input"
                />
              </div>
            </div>

            <div>
              <label className="form-label">Associer un bien immobilier par défaut</label>
              <select
                value={selectedBienId}
                onChange={e => setSelectedBienId(e.target.value)}
                className="form-select"
              >
                <option value="">-- Aucun bien lié par défaut --</option>
                {biens.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.titre} ({b.quartier || b.ville})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={importing || !username.trim()}
              className="btn-npl"
              style={{
                padding: '12px 20px',
                borderRadius: 8,
                background: 'var(--accent, #C75B00)',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: 14,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginTop: 8,
              }}
            >
              <Search size={16} />
              {importing ? 'Recherche des publications...' : 'Explorer et synchroniser le profil'}
            </button>
          </form>
        )}

        {mode === 'batch' && (
          <form onSubmit={handleImportBatch} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="form-label">Liste d'URLs de vidéos (Une par ligne)</label>
              <textarea
                rows={5}
                required
                value={batchUrls}
                onChange={e => setBatchUrls(e.target.value)}
                placeholder="https://www.tiktok.com/@agence/video/123&#10;https://www.instagram.com/reel/456&#10;https://www.facebook.com/watch/789"
                className="form-textarea"
              />
              <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 4 }}>
                Collez jusqu'à 20 liens de vidéos en même temps pour alimenter rapidement votre catalogue interactif.
              </div>
            </div>

            <div>
              <label className="form-label">Associer un bien aux vidéos importées</label>
              <select
                value={selectedBienId}
                onChange={e => setSelectedBienId(e.target.value)}
                className="form-select"
              >
                <option value="">-- Aucun bien lié par défaut --</option>
                {biens.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.titre} ({b.quartier || b.ville})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={importing || !batchUrls.trim()}
              className="btn-npl"
              style={{
                padding: '12px 20px',
                borderRadius: 8,
                background: 'var(--accent, #C75B00)',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: 14,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginTop: 8,
              }}
            >
              <Download size={16} />
              {importing ? 'Importation du lot...' : 'Importer tout le lot de vidéos'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
