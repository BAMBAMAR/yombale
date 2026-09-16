'use client'

import React, { useState, useMemo } from 'react'
import ExternalImg from '@/components/ExternalImg'
import { fcfa } from '@/lib/format'
import {
  Film,
  Star,
  Eye,
  EyeOff,
  Trash2,
  ExternalLink,
  ShoppingBag,
  Plus,
  CheckSquare,
  Square,
  Sparkles,
} from 'lucide-react'
import { ProduitCatalogue, SocialPostAdmin } from '../types'
import { matchProductsClient } from '../matching'
import { QuickProductPicker } from './QuickProductPicker'

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
}: SocialPostCardProps) {
  const [showQuickPicker, setShowQuickPicker] = useState(false)
  const [associating, setAssociating] = useState(false)

  // Smart Matching instantané côté client
  const smartSuggestions = useMemo(() => {
    if (!catalogue || catalogue.length === 0) return []
    const combinedText = [post.caption, post.ocr_text].filter(Boolean).join(' ')
    return matchProductsClient(combinedText, catalogue)
  }, [post.caption, post.ocr_text, catalogue])

  const topSuggestion = smartSuggestions[0]
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
        <div className="social-compact-thumb">
          {post.thumbnail_url ? (
            <ExternalImg src={post.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
            {post.produits && post.produits.length > 0 ? (
              <>
                {post.produits.map(prod => (
                  <span key={prod.id} className="social-prod-pill">
                    <ShoppingBag size={10} style={{ color: '#C75B00', flexShrink: 0 }} />
                    <span style={{ maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {prod.nom} ({prod.prix ? fcfa(prod.prix) : '—'})
                    </span>
                    <button
                      onClick={() => onDissociateProduct(post.id, prod.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#94a3b8',
                        padding: 0,
                        fontSize: 12,
                        lineHeight: 1,
                        marginLeft: 2,
                      }}
                      title="Dissocier ce produit"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <button
                  onClick={() => setShowQuickPicker(!showQuickPicker)}
                  style={{
                    background: '#fff',
                    border: '1px dashed #cbd5e1',
                    color: '#64748b',
                    borderRadius: 6,
                    padding: '2px 5px',
                    fontSize: 10,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                  title="Associer un autre produit"
                >
                  +
                </button>
              </>
            ) : topSuggestion ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: '#FFF7ED',
                    border: '1px solid #FED7AA',
                    borderRadius: 6,
                    padding: '2px 8px',
                    fontSize: 11,
                  }}
                >
                  <Sparkles size={12} style={{ color: '#C75B00', flexShrink: 0 }} />
                  <span style={{ fontWeight: 700, color: '#9a3412' }}>
                    Suggéré ({Math.round(topSuggestion.confidence_score * 100)}%) : {topSuggestion.produit.nom} {topSuggestion.produit.prix ? `(${fcfa(topSuggestion.produit.prix)})` : ''}
                  </span>
                  <button
                    type="button"
                    disabled={associating}
                    onClick={async () => {
                      if (onDirectAssociate) {
                        setAssociating(true)
                        await onDirectAssociate(post.id, topSuggestion.produit.id)
                        setAssociating(false)
                      } else {
                        onOpenAssociateModal(post)
                      }
                    }}
                    style={{
                      background: '#C75B00',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 4,
                      padding: '2px 6px',
                      fontSize: 10,
                      fontWeight: 800,
                      cursor: associating ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {associating ? '...' : 'Associer en 1 clic'}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQuickPicker(!showQuickPicker)}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    color: '#64748b',
                    borderRadius: 6,
                    padding: '2px 6px',
                    fontSize: 10.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                  }}
                >
                  <Plus size={10} />
                  <span>Autre</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowQuickPicker(!showQuickPicker)}
                style={{
                  background: '#fff7ed',
                  border: '1px solid #fed7aa',
                  color: '#c2410c',
                  borderRadius: 6,
                  padding: '2px 8px',
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                <Plus size={11} />
                <span>Associer un produit</span>
              </button>
            )}
          </div>

          {/* Sélecteur de produit rapide inline */}
          {showQuickPicker && (
            <QuickProductPicker
              catalogue={catalogue}
              suggestions={smartSuggestions}
              onSelect={async (prodId) => {
                if (onDirectAssociate) {
                  setAssociating(true)
                  await onDirectAssociate(post.id, prodId)
                  setAssociating(false)
                }
                setShowQuickPicker(false)
              }}
              onClose={() => setShowQuickPicker(false)}
              isSubmitting={associating}
            />
          )}
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

        <button
          onClick={() => onDelete(post.id)}
          className="social-compact-action-btn"
          style={{ color: '#ef4444' }}
          title="Supprimer la publication"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  )
}
