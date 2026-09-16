'use client'

import React, { useState } from 'react'
import { BienItem, SocialPostItem } from '../types'
import { SocialPostCardImmo } from './SocialPostCardImmo'
import { ModalAssocierBien } from './ModalAssocierBien'

interface SocialPostsFeedTabProps {
  posts: SocialPostItem[]
  biens: BienItem[]
  onUpdatePost: (updatedPost: SocialPostItem) => void
  onDeletePost: (postId: string) => void
}

export function SocialPostsFeedTab({
  posts,
  biens,
  onUpdatePost,
  onDeletePost,
}: SocialPostsFeedTabProps) {
  const [filterPlatform, setFilterPlatform] = useState<string>('all')
  const [filterLinked, setFilterLinked] = useState<string>('all')
  const [associatingPost, setAssociatingPost] = useState<SocialPostItem | null>(null)

  const filteredPosts = posts.filter(p => {
    if (filterPlatform !== 'all' && p.plateforme !== filterPlatform) return false
    if (filterLinked === 'linked' && (!p.biens_associes || p.biens_associes.length === 0)) return false
    if (filterLinked === 'unlinked' && p.biens_associes && p.biens_associes.length > 0) return false
    if (filterLinked === 'featured' && !p.is_featured) return false
    return true
  })

  function handleSaveBienAssociation(chosenBien: BienItem | null) {
    if (!associatingPost) return

    const updated: SocialPostItem = {
      ...associatingPost,
      biens_associes: chosenBien
        ? [
            {
              id: chosenBien.id,
              titre: chosenBien.titre,
              prix: chosenBien.prix_location || chosenBien.prix_vente || 0,
              type_operation: chosenBien.prix_location ? 'location' : 'vente',
              quartier: chosenBien.quartier,
              image_url: chosenBien.images?.[0],
            },
          ]
        : [],
    }

    onUpdatePost(updated)
    setAssociatingPost(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ── Barre de Filtres ── */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid var(--border, #E8DDD2)',
          borderRadius: 12,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>Plateforme :</span>
          {['all', 'instagram', 'tiktok', 'facebook', 'youtube'].map(plat => (
            <button
              key={plat}
              type="button"
              onClick={() => setFilterPlatform(plat)}
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 700,
                border: 'none',
                background: filterPlatform === plat ? 'var(--navy, #1C2B4A)' : '#F1F5F9',
                color: filterPlatform === plat ? '#FFFFFF' : 'var(--navy, #1C2B4A)',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {plat === 'all' ? 'Toutes' : plat}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>Statut :</span>
          <select
            value={filterLinked}
            onChange={e => setFilterLinked(e.target.value)}
            className="form-select"
            style={{ padding: '4px 8px', fontSize: 12, width: 'auto' }}
          >
            <option value="all">Toutes les vidéos ({posts.length})</option>
            <option value="linked">Biens associés</option>
            <option value="unlinked">Sans bien associé</option>
            <option value="featured">À la une</option>
          </select>
        </div>
      </div>

      {/* ── Grille des Publications Vidéo Immobilières ── */}
      {filteredPosts.length === 0 ? (
        <div
          style={{
            background: '#FFFFFF',
            border: '1px dashed var(--border, #E8DDD2)',
            borderRadius: 12,
            padding: '40px 20px',
            textAlign: 'center',
            color: '#64748B',
          }}
        >
          <p style={{ fontWeight: 700, fontSize: 14 }}>Aucune vidéo trouvée</p>
          <p style={{ fontSize: 12.5, marginTop: 4 }}>
            Utilisez l'onglet "Importer des Vidéos" pour ajouter des visites virtuelles depuis TikTok, Instagram, YouTube ou Facebook.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
          {filteredPosts.map(post => (
            <SocialPostCardImmo
              key={post.id}
              post={post}
              biens={biens}
              onUpdatePost={onUpdatePost}
              onDeletePost={onDeletePost}
              onOpenBienModal={p => setAssociatingPost(p)}
            />
          ))}
        </div>
      )}

      {/* ── Modale d'Association de Bien ── */}
      {associatingPost && (
        <ModalAssocierBien
          post={associatingPost}
          biens={biens}
          onClose={() => setAssociatingPost(null)}
          onSave={handleSaveBienAssociation}
        />
      )}
    </div>
  )
}
