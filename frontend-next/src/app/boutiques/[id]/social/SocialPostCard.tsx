'use client'

import React from 'react'
import { Play, ShoppingBag, ShoppingCart, MessageCircle, ChevronRight, Check } from 'lucide-react'
import ExternalImg from '@/components/ExternalImg'
import { cloudinaryHQ } from '@/lib/cloudinary'
import { fcfa } from '@/lib/format'
import { SocialPost, SocialProduct, PLATFORM_CONFIG, formatHandle } from './types'

interface SocialPostCardProps {
  post: SocialPost
  boutiqueNom: string
  whatsappNumber?: string | null
  addedProductId: string | null
  onSelect: (post: SocialPost) => void
  onAddToCart: (produit: SocialProduct, e?: React.MouseEvent) => void
  getWhatsAppUrl: (post: SocialPost, produit?: SocialProduct) => string | null
}

export default function SocialPostCard({
  post,
  boutiqueNom,
  whatsappNumber,
  addedProductId,
  onSelect,
  onAddToCart,
  getWhatsAppUrl,
}: SocialPostCardProps) {
  const conf = PLATFORM_CONFIG[post.plateforme] || PLATFORM_CONFIG.tiktok
  const PlatformIcon = conf.IconComponent
  const hasProducts = post.produits_associes && post.produits_associes.length > 0
  const firstProduct = hasProducts ? post.produits_associes[0] : null

  return (
    <div
      onClick={() => onSelect(post)}
      style={{
        background: '#ffffff',
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        position: 'relative',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.03)'
      }}
    >
      {/* Image de couverture verticale / Miniature HD */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '9/14', background: '#0f172a', overflow: 'hidden' }}>
        {post.thumbnail_url ? (
          <ExternalImg
            src={post.thumbnail_url}
            alt={post.caption || 'Publication sociale'}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            loading="lazy"
            fallback={
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background:
                    post.plateforme === 'instagram'
                      ? 'linear-gradient(135deg, #405DE6 0%, #833AB4 50%, #E1306C 100%)'
                      : 'linear-gradient(135deg, #1e293b, #0f172a)',
                  color: '#ffffff',
                  padding: 16,
                  textAlign: 'center',
                }}
              >
                <PlatformIcon size={32} style={{ marginBottom: 6 }} />
                <span style={{ fontSize: 12, fontWeight: 800 }}>{formatHandle(post.auteur) || conf.label}</span>
              </div>
            }
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
              background:
                post.plateforme === 'instagram'
                  ? 'linear-gradient(135deg, #405DE6 0%, #5851DB 25%, #833AB4 50%, #C13584 75%, #E1306C 100%)'
                  : post.plateforme === 'tiktok'
                  ? 'linear-gradient(135deg, #000000 0%, #161823 100%)'
                  : 'linear-gradient(135deg, #1877F2 0%, #0c4a9e 100%)',
              color: '#ffffff',
              padding: 20,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 10,
                border: '1.5px solid rgba(255,255,255,0.35)',
              }}
            >
              <PlatformIcon size={24} />
            </div>
            <p style={{ margin: 0, fontWeight: 900, fontSize: 13, color: '#ffffff', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
              {formatHandle(post.auteur) || `@${boutiqueNom}`}
            </p>
            <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.85)', marginTop: 4, fontWeight: 700 }}>
              Profil officiel connecté
            </span>
          </div>
        )}

        {/* Gradient sombre pour lisibilité */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, transparent 40%, rgba(0,0,0,0.85) 100%)',
          }}
        />

        {/* Badge Plateforme en haut à gauche */}
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(6px)',
            color: '#fff',
            padding: '4px 10px',
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          <PlatformIcon size={12} />
          <span>{conf.label}</span>
        </div>

        {/* Badge Articles Associés en haut à droite */}
        {hasProducts && (
          <div
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              background: 'var(--accent, #C75B00)',
              color: '#ffffff',
              padding: '4px 10px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              boxShadow: '0 2px 8px rgba(199,91,0,0.4)',
            }}
          >
            <ShoppingBag size={12} />
            <span>
              {post.produits_associes.length} {post.produits_associes.length > 1 ? 'articles' : 'article'}
            </span>
          </div>
        )}

        {/* Icône Centrale Play */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 46,
            height: 46,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.85)',
            color: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          }}
        >
          <Play size={20} style={{ marginLeft: 2 }} />
        </div>

        {/* Légende en bas de miniature */}
        <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12 }}>
          {post.auteur && (
            <p style={{ margin: '0 0 2px', fontSize: 11.5, fontWeight: 800, color: '#f8fafc' }}>
              {formatHandle(post.auteur)}
            </p>
          )}
          {post.caption && (
            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: '#cbd5e1',
                lineHeight: 1.35,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {post.caption}
            </p>
          )}
        </div>
      </div>

      {/* Accroche produit attachée sous la carte */}
      {firstProduct ? (
        <div
          style={{
            padding: '10px 12px',
            background: '#fafaf9',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <div style={{ width: 34, height: 34, borderRadius: 6, background: '#fff', border: '1px solid #e2e8f0', overflow: 'hidden', flexShrink: 0 }}>
              {firstProduct.images?.[0] ? (
                <ExternalImg src={cloudinaryHQ(firstProduct.images[0], { width: 100 })} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingBag size={16} style={{ color: '#94a3b8' }} />
                </div>
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {firstProduct.nom}
              </p>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 900, color: 'var(--accent, #C75B00)' }}>
                {firstProduct.prix ? fcfa(firstProduct.prix) : 'Prix sur demande'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={e => onAddToCart(firstProduct, e)}
            style={{
              background: addedProductId === firstProduct.id ? '#16a34a' : '#0f172a',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '6px 10px',
              fontSize: 11,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              flexShrink: 0,
            }}
          >
            {addedProductId === firstProduct.id ? (
              <>
                <Check size={12} />
                <span>Ajouté</span>
              </>
            ) : (
              <>
                <ShoppingCart size={12} />
                <span>+ Panier</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <div style={{ padding: '8px 12px', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ margin: 0, fontSize: 11, color: '#15803d', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block', flexShrink: 0 }} />
              Commande directe
            </p>
            <p style={{ margin: 0, fontSize: 10, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Non listé au catalogue
            </p>
          </div>
          {whatsappNumber ? (
            <a
              href={getWhatsAppUrl(post) || '#'}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              style={{
                background: '#25d366',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '5px 10px',
                fontSize: 11,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                flexShrink: 0,
                textDecoration: 'none',
                boxShadow: '0 2px 6px rgba(37,211,102,0.25)',
              }}
            >
              <MessageCircle size={12} />
              <span>Commander</span>
            </a>
          ) : (
            <span style={{ fontSize: 11, color: 'var(--accent, #C75B00)', fontWeight: 800, display: 'flex', alignItems: 'center' }}>
              <span>Voir</span> <ChevronRight size={12} />
            </span>
          )}
        </div>
      )}
    </div>
  )
}
