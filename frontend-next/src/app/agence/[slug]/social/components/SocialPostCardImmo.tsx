'use client'

import React, { useState } from 'react'
import {
  Camera,
  Music,
  Share2,
  Video,
  ExternalLink,
  Trash2,
  Eye,
  EyeOff,
  Star,
  Link2,
  Home,
  Play,
  Sparkles,
  Check
} from 'lucide-react'
import { BienItem, SocialPostItem } from '../types'
import { matchBiensClient, BienMatchSuggestion } from '../matching-immo-client'

interface SocialPostCardImmoProps {
  post: SocialPostItem
  biens: BienItem[]
  onUpdatePost: (updatedPost: SocialPostItem) => void
  onDeletePost: (postId: string) => void
  onOpenBienModal: (post: SocialPostItem) => void
}

export function SocialPostCardImmo({
  post,
  biens,
  onUpdatePost,
  onDeletePost,
  onOpenBienModal,
}: SocialPostCardImmoProps) {
  const [showIframe, setShowIframe] = useState(false)
  const hasBien = post.biens_associes && post.biens_associes.length > 0
  const bien = hasBien ? post.biens_associes![0] : null

  // Suggestions automatiques de Smart Matching si pas encore associé
  const suggestions: BienMatchSuggestion[] = !hasBien && post.caption
    ? matchBiensClient(post.caption, biens)
    : []
  const topSuggestion = suggestions.length > 0 ? suggestions[0] : null

  function getPlatformIcon(plat: string) {
    if (plat === 'tiktok') return <Music size={13} />
    if (plat === 'facebook') return <Share2 size={13} />
    if (plat === 'youtube') return <Video size={13} />
    return <Camera size={13} />
  }

  function getPlatformColor(plat: string) {
    if (plat === 'tiktok') return '#000000'
    if (plat === 'facebook') return '#1877F2'
    if (plat === 'youtube') return '#FF0000'
    return '#E1306C'
  }

  function handleQuickAssociate(b: BienItem) {
    const updated: SocialPostItem = {
      ...post,
      biens_associes: [
        {
          id: b.id,
          titre: b.titre,
          prix: b.prix_location || b.prix_vente || 0,
          type_operation: b.prix_location ? 'location' : 'vente',
          quartier: b.quartier,
          image_url: b.images?.[0],
        },
      ],
    }
    onUpdatePost(updated)
  }

  // Détermination de la miniature
  const isInstagram = post.plateforme === 'instagram'
  const fallbackThumb = bien?.image_url || null
  const displayThumb = post.thumbnail_url || fallbackThumb

  // Extraction d'ID Instagram pour iframe direct si miniature absente
  let igEmbedId = ''
  if (isInstagram && post.post_url) {
    const m = post.post_url.match(/\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/)
    if (m) igEmbedId = m[1]
  }

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid var(--border, #E8DDD2)',
        borderRadius: 12,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 1px 3px rgba(28, 43, 74, 0.04)',
        position: 'relative',
      }}
    >
      {/* ── Zone Média / Miniature (Format Compact) ── */}
      <div
        style={{
          position: 'relative',
          height: 180,
          background: '#0F172A',
          overflow: 'hidden',
        }}
      >
        {displayThumb && !showIframe ? (
          <img
            src={displayThumb}
            alt={post.caption || 'Visite immobilière'}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: post.visible ? 1 : 0.45,
            }}
            onError={() => {
              if (igEmbedId) setShowIframe(true)
            }}
          />
        ) : igEmbedId ? (
          <iframe
            src={`https://www.instagram.com/reel/${igEmbedId}/embed/`}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              pointerEvents: 'none',
              opacity: post.visible ? 1 : 0.45,
            }}
            title="Aperçu vidéo"
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94A3B8',
              gap: 6,
            }}
          >
            <Video size={28} />
            <span style={{ fontSize: 11 }}>Visite vidéo</span>
          </div>
        )}

        {/* Badge Plateforme */}
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            background: 'rgba(0,0,0,0.72)',
            backdropFilter: 'blur(4px)',
            color: '#FFFFFF',
            padding: '3px 8px',
            borderRadius: 6,
            fontSize: 10.5,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            zIndex: 2,
          }}
        >
          <span style={{ color: getPlatformColor(post.plateforme) }}>
            {getPlatformIcon(post.plateforme)}
          </span>
          <span style={{ textTransform: 'uppercase' }}>{post.plateforme}</span>
        </div>

        {/* Bouton Lien Externe / Lecture */}
        <a
          href={post.post_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.92)',
            color: 'var(--navy, #1C2B4A)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            zIndex: 2,
          }}
          title="Regarder sur la plateforme"
        >
          <Play size={18} style={{ marginLeft: 2 }} />
        </a>

        {/* Badge À la une */}
        {post.is_featured && (
          <div
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              background: 'var(--accent, #C75B00)',
              color: '#FFFFFF',
              padding: '2px 7px',
              borderRadius: 4,
              fontSize: 10,
              fontWeight: 800,
              zIndex: 2,
            }}
          >
            À la une
          </div>
        )}
      </div>

      {/* ── Contenu & Bien Associé ── */}
      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--navy, #1C2B4A)',
            lineHeight: 1.4,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {post.caption || 'Sans légende'}
        </div>

        {/* Bien Taggué */}
        {bien ? (
          <div
            style={{
              background: '#FAF8F5',
              border: '1px solid var(--border, #E8DDD2)',
              borderRadius: 8,
              padding: '6px 8px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Home size={15} style={{ color: 'var(--accent, #C75B00)', flexShrink: 0 }} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: 'var(--navy, #1C2B4A)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {bien.titre}
              </div>
              <div style={{ fontSize: 10.5, color: '#166534', fontWeight: 800 }}>
                {Number(bien.prix).toLocaleString('fr-FR')} FCFA {bien.type_operation === 'location' ? '/ mois' : ''}
              </div>
            </div>
          </div>
        ) : topSuggestion ? (
          /* Suggestion Smart Matching IA */
          <div
            style={{
              background: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: 8,
              padding: '6px 8px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#1D4ED8', display: 'flex', alignItems: 'center', gap: 3 }}>
                <Sparkles size={11} /> Suggestion ({Math.round(topSuggestion.confidence_score * 100)}%)
              </span>
              <button
                type="button"
                onClick={() => handleQuickAssociate(topSuggestion.bien)}
                style={{
                  background: 'var(--navy, #1C2B4A)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 4,
                  padding: '2px 6px',
                  fontSize: 10,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                <Check size={10} /> Associer
              </button>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {topSuggestion.bien.titre}
            </div>
          </div>
        ) : (
          <div
            style={{
              background: '#FEF3C7',
              borderRadius: 8,
              padding: '5px 8px',
              fontSize: 11,
              color: '#92400E',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>Aucun bien taggué</span>
            <button
              type="button"
              onClick={() => onOpenBienModal(post)}
              style={{
                background: 'none',
                border: 'none',
                color: '#92400E',
                fontWeight: 800,
                fontSize: 10.5,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Taguer +
            </button>
          </div>
        )}

        {/* ── Actions de Gestion ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 'auto',
            paddingTop: 8,
            borderTop: '1px solid var(--border, #E8DDD2)',
          }}
        >
          <div style={{ display: 'flex', gap: 5 }}>
            <button
              type="button"
              title={post.visible ? 'Masquer de la vitrine' : 'Rendre visible sur la vitrine'}
              onClick={() => onUpdatePost({ ...post, visible: !post.visible })}
              style={{
                background: 'none',
                border: '1px solid var(--border, #E8DDD2)',
                padding: '4px 6px',
                borderRadius: 6,
                cursor: 'pointer',
                color: post.visible ? '#166534' : '#64748B',
              }}
            >
              {post.visible ? <Eye size={13} /> : <EyeOff size={13} />}
            </button>

            <button
              type="button"
              title="Mettre à la une"
              onClick={() => onUpdatePost({ ...post, is_featured: !post.is_featured })}
              style={{
                background: post.is_featured ? '#FEF3C7' : 'none',
                border: '1px solid var(--border, #E8DDD2)',
                padding: '4px 6px',
                borderRadius: 6,
                cursor: 'pointer',
                color: post.is_featured ? '#D97706' : '#64748B',
              }}
            >
              <Star size={13} />
            </button>

            <button
              type="button"
              title="Modifier l'association de bien"
              onClick={() => onOpenBienModal(post)}
              style={{
                background: 'none',
                border: '1px solid var(--border, #E8DDD2)',
                padding: '4px 6px',
                borderRadius: 6,
                cursor: 'pointer',
                color: 'var(--navy, #1C2B4A)',
              }}
            >
              <Link2 size={13} />
            </button>
          </div>

          <button
            type="button"
            title="Supprimer la vidéo"
            onClick={() => onDeletePost(post.id)}
            style={{
              background: 'none',
              border: 'none',
              color: '#DC2626',
              padding: 4,
              cursor: 'pointer',
            }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}
