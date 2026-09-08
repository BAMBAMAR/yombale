'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import ExternalImg from '@/components/ExternalImg'
import { cloudinaryHQ } from '@/lib/cloudinary'
import { fcfa } from '@/lib/format'
import { useCart } from '@/context/CartContext'
import BoutonPartager from '@/components/BoutonPartager'
import { 
  Play, ShoppingBag, ShoppingCart, MessageCircle, ExternalLink, 
  Sparkles, Filter, X, ChevronRight, Share2, Check, Store
} from 'lucide-react'

export interface SocialProduct {
  id: string
  nom: string
  prix: number | null
  prix_barre?: number | null
  images: string[]
  en_stock: boolean
  categorie?: string | null
  confidence_score?: number
}

export interface SocialPost {
  id: string
  boutique_id: string
  plateforme: 'instagram' | 'tiktok' | 'facebook' | 'youtube'
  external_post_id?: string | null
  post_url: string
  media_type: string
  media_url?: string | null
  thumbnail_url?: string | null
  embed_html?: string | null
  caption?: string | null
  auteur?: string | null
  is_featured: boolean
  ordre: number
  published_at: string
  produits_associes: SocialProduct[]
}

export interface SocialAccount {
  plateforme: string
  nom_compte: string
  profil_url: string | null
}

interface SocialShopFeedProps {
  boutiqueId: string
  boutiqueNom: string
  boutiqueSlug?: string | null
  whatsappNumber?: string | null
  initialPosts?: SocialPost[]
  socialAccounts?: SocialAccount[]
  activePostId?: string | null
}

const PLATFORM_CONFIG = {
  instagram: {
    label: 'Instagram',
    icon: '📸',
    color: '#e1306c',
    bg: '#fdf2f8',
    border: '#fbcfe8',
  },
  tiktok: {
    label: 'TikTok',
    icon: '🎵',
    color: '#0f172a',
    bg: '#f1f5f9',
    border: '#e2e8f0',
  },
  facebook: {
    label: 'Facebook',
    icon: '📘',
    color: '#1877f2',
    bg: '#eff6ff',
    border: '#bfdbfe',
  },
  youtube: {
    label: 'YouTube',
    icon: '▶️',
    color: '#ef4444',
    bg: '#fef2f2',
    border: '#fecaca',
  },
}

function formatHandle(raw?: string | null): string {
  if (!raw) return ''
  let u = raw.trim()
  try {
    if (u.startsWith('http://') || u.startsWith('https://')) {
      const parsed = new URL(u)
      const parts = parsed.pathname.split('/').filter(Boolean)
      u = parts[0] || ''
    }
  } catch (_) {}
  const cleaned = u.replace(/^@+/, '').replace(/\/+$/, '').trim()
  return cleaned ? `@${cleaned}` : raw
}

export default function SocialShopFeed({
  boutiqueId,
  boutiqueNom,
  boutiqueSlug,
  whatsappNumber,
  initialPosts = [],
  socialAccounts = [],
  activePostId = null,
}: SocialShopFeedProps) {
  const { addToCart, openCart } = useCart()
  const [posts, setPosts] = useState<SocialPost[]>(initialPosts)
  const [accounts, setAccounts] = useState<SocialAccount[]>(socialAccounts)
  const [loading, setLoading] = useState<boolean>(initialPosts.length === 0)
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null)
  const [addedProductId, setAddedProductId] = useState<string | null>(null)

  const boutiqueKey = boutiqueSlug || boutiqueId

  // Chargement initial des publications publiques si non injectées côté serveur
  useEffect(() => {
    let isCancelled = false

    async function loadSocialFeed() {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || ''
        const res = await fetch(`${backendUrl}/api/boutiques/${boutiqueId}/social/posts`)
        if (!res.ok) return
        const data = await res.json()
        if (!isCancelled) {
          if (Array.isArray(data.posts)) {
            setPosts(data.posts)
          }
          if (Array.isArray(data.comptes_sociaux)) {
            setAccounts(data.comptes_sociaux)
          }
        }
      } catch (err) {
        console.warn('[SOCIAL_FEED_LOAD_ERR]', err)
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }

    if (posts.length === 0) {
      loadSocialFeed()
    } else {
      setLoading(false)
    }

    return () => { isCancelled = true }
  }, [boutiqueId, posts.length])

  // Gestion de l'ouverture automatique d'une publication par Deep Link (?post=id)
  useEffect(() => {
    if (activePostId && posts.length > 0) {
      const match = posts.find(p => p.id === activePostId)
      if (match) setSelectedPost(match)
    }
  }, [activePostId, posts])

  // Hydratation dynamique du script officiel TikTok Falcon Embed lors de l'ouverture du modal
  useEffect(() => {
    if (selectedPost?.plateforme === 'tiktok') {
      const existingScript = document.getElementById('tiktok-embed-script')
      if (existingScript) existingScript.remove()

      const script = document.createElement('script')
      script.id = 'tiktok-embed-script'
      script.src = 'https://www.tiktok.com/embed.js'
      script.async = true
      document.body.appendChild(script)

      return () => {
        const s = document.getElementById('tiktok-embed-script')
        if (s) s.remove()
      }
    }
  }, [selectedPost])

  // Filtrage des publications
  const filteredPosts = useMemo(() => {
    if (activeFilter === 'all') return posts
    if (activeFilter === 'featured') return posts.filter(p => p.is_featured)
    if (activeFilter === 'with_products') return posts.filter(p => p.produits_associes && p.produits_associes.length > 0)
    return posts.filter(p => p.plateforme === activeFilter)
  }, [posts, activeFilter])

  // Ajout au panier avec feedback visuel
  function handleAddProductToCart(produit: SocialProduct, e?: React.MouseEvent) {
    if (e) e.stopPropagation()
    addToCart(
      boutiqueKey,
      boutiqueNom,
      {
        id: produit.id,
        nom: produit.nom,
        prix: produit.prix,
        images: produit.images,
      },
      whatsappNumber,
      false
    )
    setAddedProductId(produit.id)
    setTimeout(() => setAddedProductId(null), 1800)
  }

  // Génération du message WhatsApp contextuel pour une publication
  function getWhatsAppUrlForPost(post: SocialPost, produit?: SocialProduct) {
    if (!whatsappNumber) return null
    const cleanTel = whatsappNumber.replace(/\D/g, '')
    const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://nopalou.com'
    const postLink = `${siteUrl}/boutiques/${boutiqueKey}?post=${post.id}`

    let msg = `Bonjour ${boutiqueNom} ! 👋\n`
    if (produit) {
      msg += `Je souhaite commander cet article vu sur votre publication ${post.plateforme.toUpperCase()} :\n`
      msg += `🛍️ Produit : *${produit.nom}*\n`
      if (produit.prix) msg += `💰 Prix : *${fcfa(produit.prix)}*\n`
    } else {
      msg += `Je souhaite commander l'article présenté dans votre publication ${post.plateforme.toUpperCase()} :\n`
      if (post.caption) {
        const cleanCaption = post.caption.replace(/#\S+/g, '').replace(/\s+/g, ' ').trim()
        if (cleanCaption) {
          msg += `📝 Référence / Description : *${cleanCaption.slice(0, 120)}${cleanCaption.length > 120 ? '...' : ''}*\n`
        }
      }
    }
    msg += `🔗 Lien de la publication : ${postLink}\n`
    msg += `Est-ce toujours disponible et quel est son prix avec livraison ? Merci !`

    return `https://wa.me/${cleanTel}?text=${encodeURIComponent(msg)}`
  }

  // Obtenir le code HTML d'embed optimisé avec iframe officielle pour Facebook
  function getRenderableEmbedHtml(post: SocialPost): string {
    if (!post.embed_html) return ''

    // Cas Facebook : si l'embed contient l'ancien format xfbml <div class="fb-post" ou n'a pas d'iframe
    if (post.plateforme === 'facebook' && (post.embed_html.includes('fb-post') || !post.embed_html.includes('<iframe'))) {
      const url = post.post_url
      const isVideoOrReel = /\/(reel|videos|watch)/i.test(url)
      const isPage = !isVideoOrReel && !/\/(posts|photos|story\.php|permalink\.php)/i.test(url)
      
      let fbPluginUrl = ''
      if (isVideoOrReel) {
        fbPluginUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&width=380&show_text=true&appId=`
      } else if (isPage) {
        fbPluginUrl = `https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(url)}&tabs=timeline&width=380&height=500&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true&appId=`
      } else {
        fbPluginUrl = `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(url)}&width=380&show_text=true&appId=`
      }

      return `<iframe src="${fbPluginUrl}" width="100%" height="480" style="border:none;overflow:hidden;border-radius:12px;background:#ffffff;" scrolling="no" frameborder="0" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe>`
    }

    return post.embed_html
  }

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* ── BANNIÈRE D'ACCROCHE & BADGES OFFICIELS DES RÉSEAUX MARCHAND ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: 16,
        padding: '20px 24px',
        color: '#fff',
        marginBottom: 20,
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(199, 91, 0, 0.25)', border: '1px solid rgba(199, 91, 0, 0.5)', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800, color: '#fed7aa', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <Sparkles size={12} /> Autres Produits & Vidéos
            </div>
            <h2 style={{ margin: 0, fontSize: 'clamp(18px, 3.5vw, 22px)', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em' }}>
              Autres produits de la boutique
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8', maxWidth: 650 }}>
              Retrouvez ici les articles présentés sur nos réseaux sociaux officiels (vidéos, Reels, publications). Commandez en 1 clic !
            </p>
          </div>

          {/* Profils officiels connectés */}
          {accounts.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {accounts.map(acc => {
                const conf = PLATFORM_CONFIG[acc.plateforme as keyof typeof PLATFORM_CONFIG]
                if (!conf) return null
                return (
                  <a
                    key={acc.plateforme}
                    href={acc.profil_url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      padding: '6px 12px',
                      borderRadius: 20,
                      color: '#ffffff',
                      fontSize: 12,
                      fontWeight: 700,
                      textDecoration: 'none',
                      transition: 'background 0.15s ease',
                      flexShrink: 0,
                    }}
                  >
                    <span>{conf.icon}</span>
                    <span>{formatHandle(acc.nom_compte)}</span>
                    <ExternalLink size={12} style={{ opacity: 0.6 }} />
                  </a>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── BARRE DE FILTRES RESPONSIVE MOBILE SANS TEXTE TRONQUÉ ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        overflowX: 'auto',
        paddingBottom: 8,
        marginBottom: 16,
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
      }}>
        <button
          onClick={() => setActiveFilter('all')}
          style={{
            padding: '7px 14px',
            borderRadius: 20,
            border: activeFilter === 'all' ? '1.5px solid #0f172a' : '1px solid #e2e8f0',
            background: activeFilter === 'all' ? '#0f172a' : '#ffffff',
            color: activeFilter === 'all' ? '#ffffff' : '#475569',
            fontSize: 12,
            fontWeight: 800,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span>Tous ({posts.length})</span>
        </button>

        <button
          onClick={() => setActiveFilter('with_products')}
          style={{
            padding: '7px 14px',
            borderRadius: 20,
            border: activeFilter === 'with_products' ? '1.5px solid #C75B00' : '1px solid #e2e8f0',
            background: activeFilter === 'with_products' ? '#C75B00' : '#ffffff',
            color: activeFilter === 'with_products' ? '#ffffff' : '#475569',
            fontSize: 12,
            fontWeight: 800,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <ShoppingBag size={13} />
          <span>Liés au catalogue ({posts.filter(p => p.produits_associes?.length > 0).length})</span>
        </button>

        {['tiktok', 'instagram', 'facebook'].map(platKey => {
          const conf = PLATFORM_CONFIG[platKey as keyof typeof PLATFORM_CONFIG]
          const count = posts.filter(p => p.plateforme === platKey).length
          if (count === 0) return null
          const isActive = activeFilter === platKey

          return (
            <button
              key={platKey}
              onClick={() => setActiveFilter(platKey)}
              style={{
                padding: '7px 14px',
                borderRadius: 20,
                border: isActive ? `1.5px solid ${conf.color}` : '1px solid #e2e8f0',
                background: isActive ? conf.color : '#ffffff',
                color: isActive ? '#ffffff' : '#475569',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>{conf.icon}</span>
              <span>{conf.label} ({count})</span>
            </button>
          )
        })}
      </div>

      {/* ── ÉTATS DE CHARGEMENT & EMPTY STATE ── */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px, 100%), 1fr))', gap: 16 }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} style={{ height: 380, borderRadius: 16, background: '#f1f5f9', animation: 'pulse 1.5s infinite ease-in-out' }} />
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div style={{
          background: '#ffffff',
          borderRadius: 20,
          border: '1.5px dashed #cbd5e1',
          padding: '48px 24px',
          textAlign: 'center',
          maxWidth: 480,
          margin: '30px auto',
        }}>
          <div style={{ fontSize: 42, marginBottom: 12 }}>🎬</div>
          <h3 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 900, color: '#0f172a' }}>
            Aucune publication dans cette sélection
          </h3>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>
            {activeFilter === 'all'
              ? 'Le marchand n\'a pas encore connecté de publication sur son Social Shop.'
              : 'Aucune publication ne correspond à ce filtre pour le moment.'}
          </p>
          {activeFilter !== 'all' && (
            <button
              onClick={() => setActiveFilter('all')}
              style={{
                background: '#0f172a',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Voir toutes les publications
            </button>
          )}
        </div>
      ) : (
        /* ── GRILLE DE PUBLICATIONS SOCIAL SHOP (MOBILE-FIRST) ── */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px, 100%), 1fr))',
          gap: 16,
        }}>
          {filteredPosts.map(post => {
            const conf = PLATFORM_CONFIG[post.plateforme as keyof typeof PLATFORM_CONFIG] || PLATFORM_CONFIG.tiktok
            const hasProducts = post.produits_associes && post.produits_associes.length > 0
            const firstProduct = hasProducts ? post.produits_associes[0] : null

            return (
              <div
                key={post.id}
                onClick={() => setSelectedPost(post)}
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
                        <div style={{
                          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
                          alignItems: 'center', justifyContent: 'center',
                          background: post.plateforme === 'instagram'
                            ? 'linear-gradient(135deg, #405DE6 0%, #833AB4 50%, #E1306C 100%)'
                            : 'linear-gradient(135deg, #1e293b, #0f172a)',
                          color: '#ffffff', padding: 16, textAlign: 'center',
                        }}>
                          <span style={{ fontSize: 32, marginBottom: 6 }}>{conf.icon}</span>
                          <span style={{ fontSize: 12, fontWeight: 800 }}>{formatHandle(post.auteur) || conf.label}</span>
                        </div>
                      }
                    />
                  ) : (
                    <div style={{
                      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      background: post.plateforme === 'instagram'
                        ? 'linear-gradient(135deg, #405DE6 0%, #5851DB 25%, #833AB4 50%, #C13584 75%, #E1306C 100%)'
                        : post.plateforme === 'tiktok'
                        ? 'linear-gradient(135deg, #000000 0%, #161823 100%)'
                        : 'linear-gradient(135deg, #1877F2 0%, #0c4a9e 100%)',
                      color: '#ffffff', padding: 20, textAlign: 'center',
                    }}>
                      <div style={{
                        width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.2)',
                        backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 24, marginBottom: 10, border: '1.5px solid rgba(255,255,255,0.35)',
                      }}>
                        {conf.icon}
                      </div>
                      <p style={{ margin: 0, fontWeight: 900, fontSize: 13, color: '#ffffff', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                        {formatHandle(post.auteur) || `@${boutiqueNom}`}
                      </p>
                      <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.85)', marginTop: 4, fontWeight: 700 }}>
                        Profil officiel connecté
                      </span>
                    </div>
                  )}

                  {/* Gradient sombre pour lisibilité des textes */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, transparent 40%, rgba(0,0,0,0.85) 100%)',
                  }} />

                  {/* Badge Plateforme en haut à gauche */}
                  <div style={{
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
                  }}>
                    <span>{conf.icon}</span>
                    <span>{conf.label}</span>
                  </div>

                  {/* Badge Articles Associés en haut à droite */}
                  {hasProducts && (
                    <div style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      background: '#C75B00',
                      color: '#ffffff',
                      padding: '4px 10px',
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 900,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      boxShadow: '0 2px 8px rgba(199,91,0,0.4)',
                    }}>
                      <ShoppingBag size={12} />
                      <span>{post.produits_associes.length} {post.produits_associes.length > 1 ? 'articles' : 'article'}</span>
                    </div>
                  )}

                  {/* Icône Centrale Play */}
                  <div style={{
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
                  }}>
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
                      <p style={{
                        margin: 0,
                        fontSize: 12,
                        color: '#cbd5e1',
                        lineHeight: 1.35,
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}>
                        {post.caption}
                      </p>
                    )}
                  </div>
                </div>

                {/* 🛍️ SECTION ACCROCHE PRODUIT ATTACHÉ SOUS LA CARTE */}
                {firstProduct ? (
                  <div style={{ padding: '10px 12px', background: '#fafaf9', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
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
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 900, color: '#C75B00' }}>
                          {firstProduct.prix ? fcfa(firstProduct.prix) : 'Prix sur demande'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleAddProductToCart(firstProduct, e)}
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
                          <Check size={12} /> Ajouté
                        </>
                      ) : (
                        <>
                          <ShoppingCart size={12} /> + Panier
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
                        href={getWhatsAppUrlForPost(post) || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
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
                        <MessageCircle size={12} /> Commander
                      </a>
                    ) : (
                      <span style={{ fontSize: 11, color: '#C75B00', fontWeight: 800, display: 'flex', alignItems: 'center' }}>
                        Voir <ChevronRight size={12} />
                      </span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ============================================================================
          🎬 MODAL IMMERSIF « ACHETER CE QUE VOUS VOYEZ » (SHOPPABLE CONTENT VIEWER)
          ============================================================================ */}
      {selectedPost && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px',
          }}
          onClick={() => setSelectedPost(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 20,
              width: '100%',
              maxWidth: 920,
              maxHeight: '92vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'wrap',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              position: 'relative',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Bouton Fermer */}
            <button
              onClick={() => setSelectedPost(null)}
              style={{
                position: 'absolute',
                top: 14,
                right: 14,
                zIndex: 10,
                background: 'rgba(15, 23, 42, 0.75)',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>

            {/* COLONNE GAUCHE : LECTEUR / EMBED VIDÉO DU CONTENU SOCIAL */}
            <div style={{
              flex: '1 1 420px',
              background: '#090d16',
              minHeight: 380,
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflowY: 'auto',
            }}>
              {selectedPost.embed_html ? (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 8 }}>
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      minHeight: 460,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: (selectedPost.plateforme === 'tiktok' || selectedPost.plateforme === 'facebook') ? '#ffffff' : 'transparent',
                      borderRadius: (selectedPost.plateforme === 'tiktok' || selectedPost.plateforme === 'facebook') ? 12 : 0,
                      overflow: 'hidden',
                      padding: (selectedPost.plateforme === 'tiktok' || selectedPost.plateforme === 'facebook') ? '8px 4px' : 0,
                    }}
                    dangerouslySetInnerHTML={{ __html: getRenderableEmbedHtml(selectedPost) }}
                  />
                  <div style={{ padding: '8px 12px', textAlign: 'center' }}>
                    <a
                      href={selectedPost.post_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        color: selectedPost.plateforme === 'tiktok' ? '#38bdf8' : '#94a3b8',
                        fontSize: 12.5,
                        fontWeight: 700,
                        textDecoration: 'none',
                      }}
                    >
                      <span>Ouvrir sur {selectedPost.plateforme === 'instagram' ? 'Instagram' : selectedPost.plateforme === 'tiktok' ? 'TikTok' : selectedPost.plateforme === 'facebook' ? 'Facebook' : 'YouTube'}</span>
                      <ExternalLink size={13} />
                    </a>
                  </div>
                </div>
              ) : selectedPost.thumbnail_url ? (
                <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 400 }}>
                  <ExternalImg
                    src={selectedPost.thumbnail_url}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                  <a
                    href={selectedPost.post_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      position: 'absolute',
                      bottom: 20,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'rgba(255,255,255,0.92)',
                      color: '#0f172a',
                      padding: '10px 18px',
                      borderRadius: 24,
                      fontSize: 13,
                      fontWeight: 800,
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                    }}
                  >
                    <span>Ouvrir sur {selectedPost.plateforme}</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              ) : (
                <div style={{
                  padding: 36,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  color: '#fff',
                  width: '100%',
                  height: '100%',
                  minHeight: 380,
                  background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
                }}>
                  <div style={{
                    width: 68,
                    height: 68,
                    borderRadius: '50%',
                    background: selectedPost.plateforme === 'instagram'
                      ? 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)'
                      : selectedPost.plateforme === 'tiktok'
                      ? '#000000'
                      : '#1877f2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 28,
                    marginBottom: 16,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                    border: '2px solid rgba(255,255,255,0.2)',
                  }}>
                    {selectedPost.plateforme === 'instagram' ? '📸' : selectedPost.plateforme === 'tiktok' ? '🎵' : '📘'}
                  </div>
                  <h4 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 900, color: '#ffffff' }}>
                    {selectedPost.auteur || `@${boutiqueNom}`}
                  </h4>
                  <p style={{ margin: '0 0 20px', fontSize: 12.5, color: '#94a3b8', maxWidth: 280, lineHeight: 1.4 }}>
                    {selectedPost.caption || `Découvrez nos publications officielles sur ${selectedPost.plateforme.toUpperCase()}.`}
                  </p>
                  <a
                    href={selectedPost.post_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: selectedPost.plateforme === 'instagram'
                        ? 'linear-gradient(45deg, #f09433, #dc2743, #bc1888)'
                        : '#2563eb',
                      color: '#ffffff',
                      padding: '10px 20px',
                      borderRadius: 24,
                      fontWeight: 800,
                      fontSize: 13,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                    }}
                  >
                    <span>Voir sur {selectedPost.plateforme}</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              )}
            </div>

            {/* COLONNE DROITE : « ACHETER CE QUE VOUS VOYEZ » & ACTIONS */}
            <div style={{
              flex: '1 1 360px',
              maxHeight: '92vh',
              overflowY: 'auto',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              background: '#ffffff',
            }}>
              {/* Header Publication */}
              <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: 14, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#C75B00', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {selectedPost.plateforme} · {boutiqueNom}
                  </span>
                  <BoutonPartager
                    variant="unified"
                    lien={typeof window !== 'undefined' ? `${window.location.origin}/boutiques/${boutiqueKey}?post=${selectedPost.id}` : selectedPost.post_url}
                    message={`Regardez cette publication de ${boutiqueNom} sur Nopalou :\n${selectedPost.post_url}`}
                  />
                </div>
                {selectedPost.caption && (
                  <p style={{ margin: 0, fontSize: 13.5, color: '#334155', lineHeight: 1.5 }}>
                    {selectedPost.caption}
                  </p>
                )}
              </div>

              {/* SECTION ARTICLES PRÉSENTÉS DANS CETTE VIDÉO */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ShoppingBag size={18} style={{ color: '#C75B00' }} />
                    Produits de cette publication
                  </h3>
                  {selectedPost.produits_associes.length > 0 && (
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>
                      {selectedPost.produits_associes.length} article(s)
                    </span>
                  )}
                </div>

                {selectedPost.produits_associes.length === 0 ? (
                  <div style={{
                    background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                    borderRadius: 16,
                    padding: '20px 18px',
                    border: '1.5px solid #86efac',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 12,
                    boxShadow: '0 4px 14px rgba(34,197,94,0.08)',
                  }}>
                    <div style={{
                      width: 46,
                      height: 46,
                      borderRadius: '50%',
                      background: '#25d366',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(37,211,102,0.3)',
                    }}>
                      <MessageCircle size={24} />
                    </div>

                    <div>
                      <h4 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 900, color: '#14532d' }}>
                        Commander cet article directement
                      </h4>
                      <p style={{ margin: 0, fontSize: 12.5, color: '#166534', lineHeight: 1.45 }}>
                        Cet article n&apos;est pas encore lié au catalogue, mais vous pouvez le <strong>commander immédiatement par WhatsApp</strong> auprès de la boutique !
                      </p>
                    </div>

                    {whatsappNumber ? (
                      <a
                        href={getWhatsAppUrlForPost(selectedPost) || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          background: '#25d366',
                          color: '#ffffff',
                          padding: '12px 20px',
                          borderRadius: 12,
                          fontSize: 13.5,
                          fontWeight: 900,
                          textDecoration: 'none',
                          boxShadow: '0 4px 14px rgba(37,211,102,0.35)',
                          width: '100%',
                        }}
                      >
                        <MessageCircle size={18} /> Commander par WhatsApp Direct
                      </a>
                    ) : (
                      <span style={{ fontSize: 12, color: '#64748b' }}>Numéro WhatsApp non renseigné</span>
                    )}

                    <Link
                      href={`/boutiques/${boutiqueKey}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        color: '#15803d',
                        fontSize: 12,
                        fontWeight: 700,
                        textDecoration: 'underline',
                        marginTop: 2,
                      }}
                    >
                      <Store size={13} /> Ou explorer le catalogue complet
                    </Link>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {selectedPost.produits_associes.map(prod => (
                      <div
                        key={prod.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '10px 12px',
                          borderRadius: 12,
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        <div style={{ width: 60, height: 60, borderRadius: 8, background: '#fff', overflow: 'hidden', flexShrink: 0, border: '1px solid #cbd5e1' }}>
                          {prod.images?.[0] ? (
                            <ExternalImg src={cloudinaryHQ(prod.images[0], { width: 140 })} alt={prod.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <ShoppingBag size={20} style={{ color: '#94a3b8' }} />
                            </div>
                          )}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Link href={`/boutiques/${boutiqueKey}/produits/${prod.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                            <p style={{ margin: '0 0 2px', fontSize: 13.5, fontWeight: 800, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {prod.nom}
                            </p>
                          </Link>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                            <span style={{ fontSize: 14, fontWeight: 900, color: '#C75B00' }}>
                              {prod.prix ? fcfa(prod.prix) : 'Sur demande'}
                            </span>
                            {prod.prix_barre && (
                              <span style={{ fontSize: 11, color: '#94a3b8', textDecoration: 'line-through' }}>
                                {fcfa(prod.prix_barre)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                          <button
                            type="button"
                            onClick={() => handleAddProductToCart(prod)}
                            disabled={prod.en_stock === false}
                            style={{
                              background: addedProductId === prod.id ? '#16a34a' : '#0f172a',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 8,
                              padding: '6px 12px',
                              fontSize: 11.5,
                              fontWeight: 800,
                              cursor: prod.en_stock === false ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                            }}
                          >
                            {addedProductId === prod.id ? (
                              <>
                                <Check size={13} /> Ajouté !
                              </>
                            ) : (
                              <>
                                <ShoppingCart size={13} /> Panier
                              </>
                            )}
                          </button>

                          {whatsappNumber && (
                            <a
                              href={getWhatsAppUrlForPost(selectedPost, prod) || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                background: '#25d366',
                                color: '#fff',
                                textDecoration: 'none',
                                borderRadius: 8,
                                padding: '5px 10px',
                                fontSize: 11,
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                justifyContent: 'center',
                              }}
                            >
                              <MessageCircle size={12} /> WhatsApp
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* FOOTER MODAL : ACTIONS DIRECTES WHATSAPP BOUTIQUE & PANIER */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 16, marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {whatsappNumber && (
                  <a
                    href={getWhatsAppUrlForPost(selectedPost) || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: selectedPost.produits_associes.length === 0 ? '#25d366' : '#f0fdf4',
                      color: selectedPost.produits_associes.length === 0 ? '#ffffff' : '#16a34a',
                      border: selectedPost.produits_associes.length === 0 ? 'none' : '1.5px solid #bbf7d0',
                      borderRadius: 12,
                      padding: '12px 16px',
                      textDecoration: 'none',
                      fontSize: 13.5,
                      fontWeight: 900,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      boxShadow: selectedPost.produits_associes.length === 0 ? '0 4px 14px rgba(37,211,102,0.3)' : 'none',
                    }}
                  >
                    <MessageCircle size={18} /> {selectedPost.produits_associes.length === 0 ? 'Commander cet article par WhatsApp Direct' : 'Discuter de cette publication sur WhatsApp'}
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => {
                    openCart(boutiqueKey, boutiqueId)
                    setSelectedPost(null)
                  }}
                  style={{
                    background: selectedPost.produits_associes.length === 0 ? '#f8fafc' : '#C75B00',
                    color: selectedPost.produits_associes.length === 0 ? '#475569' : '#fff',
                    border: selectedPost.produits_associes.length === 0 ? '1px solid #cbd5e1' : 'none',
                    borderRadius: 12,
                    padding: '11px 16px',
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: selectedPost.produits_associes.length === 0 ? 'none' : '0 4px 14px rgba(199,91,0,0.25)',
                  }}
                >
                  <ShoppingCart size={15} /> Voir mon Panier d&apos;Achats
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
