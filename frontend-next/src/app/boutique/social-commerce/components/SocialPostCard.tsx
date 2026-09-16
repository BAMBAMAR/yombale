'use client'

import React, { useState, useMemo } from 'react'
import ExternalImg from '@/components/ExternalImg'
import {
  Film,
  Star,
  Eye,
  EyeOff,
  Trash2,
  ExternalLink,
  CheckSquare,
  Square,
  Pencil,
} from 'lucide-react'
import { ProduitCatalogue, SocialPostAdmin } from '../types'
import { matchProductsClient } from '../matching'
import { SocialPostCardProducts } from './SocialPostCardProducts'
import EditPostModal from './EditPostModal'

interface SocialPostCardProps {
  post: SocialPostAdmin
  isSelected: boolean
  catalogue?: ProduitCatalogue[]
  onToggleSelect: (id: string) => void
  onToggleVisible: (post: SocialPostAdmin) => void
  onToggleFeatured: (post: SocialPostAdmin) => void
  onDelete: (id: string) => void
  onDissociateProduct: (postId: string, productId: string) => void
  onOpenAssociateModal: (post: SocialPostAdmin) => void
  onDirectAssociate?: (postId: string, productId: string) => Promise<void> | void
  onUpdatePost?: (postId: string, data: { caption?: string; thumbnail_url?: string }) => Promise<void>
}

export function SocialPostCard({
  post,
  isSelected,
  catalogue = [],
  onToggleSelect,
  onToggleVisible,
  onToggleFeatured,
  onDelete,
  onDissociateProduct,
  onOpenAssociateModal,
  onDirectAssociate,
  onUpdatePost,
}: SocialPostCardProps) {
  const [showEditModal, setShowEditModal] = useState(false)

  // Fallbacks intelligents pour YouTube et Instagram
  const ytVideoId =
    post.plateforme === 'youtube' && !post.thumbnail_url
      ? post.external_post_id || post.post_url?.match(/(?:youtu\.be\/|watch\?v=)([a-zA-Z0-9_-]{11})/)?.[1]
      : null
  const ytFallbackThumb = ytVideoId ? `https://img.youtube.com/vi/${ytVideoId}/hqdefault.jpg` : null

  const merchantThumb =
    post.thumbnail_url ||
    ytFallbackThumb ||
    (post.produits && post.produits.length > 0 && post.produits[0].images?.[0]
      ? post.produits[0].images[0]
      : null)

  const igPostId =
    post.plateforme === 'instagram' && !merchantThumb
      ? post.external_post_id && !post.external_post_id.startsWith('ig_profile_')
        ? post.external_post_id
        : post.post_url?.match(/\/(?:p|reel)\/([A-Za-z0-9_-]+)/)?.[1] || null
      : null
  const igEmbedUrl = igPostId
    ? `https://www.instagram.com/${post.media_type === 'REEL' ? 'reel' : 'p'}/${igPostId}/embed/`
    : null

  // Smart Matching instantané côté client
  const smartSuggestions = useMemo(() => {
    if (!catalogue || catalogue.length === 0) return []
    const combinedText = [post.caption, post.ocr_text].filter(Boolean).join(' ')
    return matchProductsClient(combinedText, catalogue)
  }, [post.caption, post.ocr_text, catalogue])

  return (
    <div
      className={`social-compact-post-card ${isSelected ? 'selected' : ''}`}
      style={{
        border: isSelected ? '1.5px solid #C75B00' : post.is_featured ? '1.5px solid #fdba74' : undefined,
        background: isSelected ? '#fffbf7' : !post.visible ? '#f8fafc' : '#ffffff',
        opacity: !post.visible && !isSelected ? 0.75 : 1,
        transition: 'all 0.15s ease',
      }}
    >
      {/* Zone supérieure du post */}
      <div className="social-post-card-top">
        {/* Checkbox de sélection par lot */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onToggleSelect(post.id)
          }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0 2px',
            color: isSelected ? '#C75B00' : '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
          title={isSelected ? 'Désélectionner' : 'Sélectionner pour action par lot'}
        >
          {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
        </button>

        {/* Miniature vidéo */}
        <div
          className="social-compact-thumb"
          onClick={() => onUpdatePost && setShowEditModal(true)}
          style={{ cursor: onUpdatePost ? 'pointer' : 'default' }}
          title={onUpdatePost ? 'Modifier la miniature ou la légende' : undefined}
        >
          {merchantThumb ? (
            <ExternalImg
              src={merchantThumb}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              fallback={
                igEmbedUrl ? (
                  <iframe
                    src={igEmbedUrl}
                    style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }}
                    scrolling="no"
                    tabIndex={-1}
                    aria-hidden="true"
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                    <Film size={20} />
                  </div>
                )
              }
            />
          ) : igEmbedUrl ? (
            <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', pointerEvents: 'none' }}>
              <iframe
                src={igEmbedUrl}
                style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }}
                scrolling="no"
                tabIndex={-1}
                aria-hidden="true"
              />
            </div>
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
              <Film size={20} />
            </div>
          )}
          <span
            style={{
              position: 'absolute',
              top: 3,
              left: 3,
              fontSize: 9,
              background: 'rgba(0,0,0,0.75)',
              color: '#fff',
              padding: '1px 4px',
              borderRadius: 3,
              fontWeight: 900,
              textTransform: 'uppercase',
            }}
          >
            {post.plateforme === 'instagram' ? 'IG' : post.plateforme === 'tiktok' ? 'TT' : post.plateforme === 'youtube' ? 'YT' : post.plateforme === 'whatsapp' ? 'WA' : 'FB'}
          </span>
        </div>

        {/* Infos & Produit */}
        <div className="social-compact-info" style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10.5, fontWeight: 900, color: '#C75B00', textTransform: 'uppercase' }}>
              {post.plateforme}
            </span>
            {post.auteur && (
              <span style={{ fontSize: 10.5, color: '#64748b' }}>
                @{post.auteur}
              </span>
            )}
            {post.is_featured && (
              <span
                style={{
                  fontSize: 9.5,
                  background: '#fff7ed',
                  color: '#C75B00',
                  border: '1px solid #fed7aa',
                  padding: '0 5px',
                  borderRadius: 8,
                  fontWeight: 800,
                }}
              >
                À la une
              </span>
            )}
            {!post.visible && (
              <span
                style={{
                  fontSize: 9.5,
                  background: '#f1f5f9',
                  color: '#64748b',
                  padding: '0 5px',
                  borderRadius: 8,
                  fontWeight: 700,
                }}
              >
                Masqué
              </span>
            )}
          </div>

          <p
            style={{
              margin: 0,
              fontSize: 12.5,
              color: '#0f172a',
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              maxWidth: '100%',
            }}
          >
            {post.caption || (post.ocr_text ? `[OCR] ${post.ocr_text}` : 'Publication sans légende')}
          </p>

          {/* Pastilles de Produits associés & Suggestions Smart Matching */}
          <SocialPostCardProducts
            post={post}
            catalogue={catalogue}
            smartSuggestions={smartSuggestions}
            onDissociateProduct={onDissociateProduct}
            onOpenAssociateModal={onOpenAssociateModal}
            onDirectAssociate={onDirectAssociate}
          />
        </div>
      </div>

      {/* Actions d'administration compactes */}
      <div className="social-compact-actions">
        <button
          onClick={() => onToggleVisible(post)}
          className="social-compact-action-btn"
          style={{
            color: post.visible ? '#15803d' : '#94a3b8',
            background: post.visible ? '#f0fdf4' : '#f8fafc',
            borderColor: post.visible ? '#bbf7d0' : '#e2e8f0',
          }}
          title={post.visible ? 'Visible en boutique (cliquer pour masquer)' : 'Masqué (cliquer pour afficher)'}
        >
          {post.visible ? <Eye size={13} /> : <EyeOff size={13} />}
        </button>

        <button
          onClick={() => onToggleFeatured(post)}
          className="social-compact-action-btn"
          style={{
            color: post.is_featured ? '#C75B00' : '#94a3b8',
            background: post.is_featured ? '#fff7ed' : '#f8fafc',
            borderColor: post.is_featured ? '#fed7aa' : '#e2e8f0',
          }}
          title={post.is_featured ? 'À la une (cliquer pour retirer)' : 'Mettre en vedette'}
        >
          <Star size={13} fill={post.is_featured ? '#C75B00' : 'none'} />
        </button>

        <a
          href={post.post_url}
          target="_blank"
          rel="noopener noreferrer"
          className="social-compact-action-btn"
          title="Voir la publication originale"
        >
          <ExternalLink size={12} />
        </a>

        {onUpdatePost && (
          <button
            onClick={() => setShowEditModal(true)}
            className="social-compact-action-btn"
            style={{ color: '#0f172a' }}
            title="Modifier la miniature ou la légende"
          >
            <Pencil size={12} />
          </button>
        )}

        <button
          onClick={() => onDelete(post.id)}
          className="social-compact-action-btn"
          style={{ color: '#ef4444' }}
          title="Supprimer la publication"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {/* Modal de modification rapide de miniature et légende */}
      {showEditModal && onUpdatePost && (
        <EditPostModal
          post={post}
          onClose={() => setShowEditModal(false)}
          onSave={onUpdatePost}
        />
      )}
    </div>
  )
}
