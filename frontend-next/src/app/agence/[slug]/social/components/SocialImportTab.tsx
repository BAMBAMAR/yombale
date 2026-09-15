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

  function handleImportSingle(e: React.FormEvent) {
    e.preventDefault()
    if (!singleUrl.trim()) return

    setImporting(true)
    const detectedPlat = detectPlatformFromUrl(singleUrl)
    const chosenBien = biens.find(b => b.id === selectedBienId)

    const newPost: SocialPostItem = {
      id: 'post-' + Date.now().toString(36),
      plateforme: detectedPlat,
      post_url: singleUrl.trim(),
      media_type: singleUrl.includes('/reel') || singleUrl.includes('/video') ? 'reel' : 'video',
      thumbnail_url: chosenBien?.images?.[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
      caption: caption.trim() || (chosenBien ? `Visite guidée : ${chosenBien.titre}` : 'Visite exclusive bien immobilier'),
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
    setImporting(false)
    setSingleUrl('')
    setCaption('')
    setSuccessMsg('Publication importée avec succès et associée à votre vitrine !')
    setTimeout(() => setSuccessMsg(null), 4000)
  }

  function handleImportBatch(e: React.FormEvent) {
    e.preventDefault()
    if (!batchUrls.trim()) return

    setImporting(true)
    const urls = batchUrls
      .split('\n')
      .map(u => u.trim())
      .filter(u => u.length > 5 && u.startsWith('http'))

    const chosenBien = biens.find(b => b.id === selectedBienId)

    const newPosts: SocialPostItem[] = urls.map((u, idx) => ({
      id: 'batch-' + Date.now().toString(36) + '-' + idx,
      plateforme: detectPlatformFromUrl(u),
      post_url: u,
      media_type: 'reel',
      thumbnail_url: chosenBien?.images?.[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
      caption: chosenBien ? `Visite ${chosenBien.titre}` : `Visite vidéo #${idx + 1}`,
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
    setImporting(false)
    setBatchUrls('')
    setSuccessMsg(`${newPosts.length} vidéo(s) importée(s) avec succès !`)
    setTimeout(() => setSuccessMsg(null), 4000)
  }

  function handleExploreProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!username.trim()) return

    setImporting(true)
    const cleanUser = username.replace('@', '').trim()
    const chosenBien = biens.find(b => b.id === selectedBienId)

    // Simulation de découverte des 3 dernières publications du profil
    const simulatedPosts: SocialPostItem[] = [1, 2, 3].map(i => ({
      id: `profile-${cleanUser}-${Date.now()}-${i}`,
      plateforme: platform,
      post_url: `https://${platform}.com/@${cleanUser}/video/${Date.now() + i}`,
      media_type: 'reel',
      thumbnail_url: chosenBien?.images?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=600&q=80',
      caption: `Visite immobilière officielle par @${cleanUser} - Épisode ${i}`,
      auteur: `@${cleanUser}`,
      visible: true,
      is_featured: i === 1,
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

    onImportPosts(simulatedPosts)
    setImporting(false)
    setUsername('')
    setSuccessMsg(`3 publications de @${cleanUser} synchronisées avec succès !`)
    setTimeout(() => setSuccessMsg(null), 4000)
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
