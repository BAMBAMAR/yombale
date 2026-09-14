'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Video } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { fcfa } from '@/lib/format'
import {
  SocialPost,
  SocialAccount,
  SocialProduct,
  SocialShopFeedProps,
} from './social/types'
import SocialFeedHeader from './social/SocialFeedHeader'
import SocialPostCard from './social/SocialPostCard'
import SocialPostModal from './social/SocialPostModal'

export type { SocialPost, SocialAccount, SocialProduct }

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

    return () => {
      isCancelled = true
    }
  }, [boutiqueId, posts.length])

  // Gestion de l'ouverture automatique d'une publication par Deep Link (?post=id)
  useEffect(() => {
    if (activePostId && posts.length > 0) {
      const match = posts.find(p => p.id === activePostId)
      if (match) setSelectedPost(match)
    }
  }, [activePostId, posts])

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

    let msg = `Bonjour ${boutiqueNom} ! \n`
    if (produit) {
      msg += `Je souhaite commander cet article vu sur votre publication ${post.plateforme.toUpperCase()} :\n`
      msg += `Produit : *${produit.nom}*\n`
      if (produit.prix) msg += `Prix : *${fcfa(produit.prix)}*\n`
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

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Bannière et filtres */}
      <SocialFeedHeader
        accounts={accounts}
        posts={posts}
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        boutiqueNom={boutiqueNom}
      />

      {/* États de chargement & Empty State */}
      {loading ? (
        <div className="social-feed-grid-public">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div
              key={i}
              style={{
                height: 320,
                borderRadius: 16,
                background: '#f1f5f9',
                animation: 'pulse 1.5s infinite ease-in-out',
              }}
            />
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div
          style={{
            background: '#ffffff',
            borderRadius: 20,
            border: '1.5px dashed #cbd5e1',
            padding: '48px 24px',
            textAlign: 'center',
            maxWidth: 480,
            margin: '30px auto',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: '#f1f5f9',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
            }}
          >
            <Video size={28} />
          </div>
          <h3 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 900, color: '#0f172a' }}>
            Aucune publication dans cette sélection
          </h3>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>
            {activeFilter === 'all'
              ? "Le marchand n'a pas encore connecté de publication sur son Social Shop."
              : 'Aucune publication ne correspond à ce filtre pour le moment.'}
          </p>
          {activeFilter !== 'all' && (
            <button
              type="button"
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
        /* Grille des publications */
        <div className="social-feed-grid-public">
          {filteredPosts.map(post => (
            <SocialPostCard
              key={post.id}
              post={post}
              boutiqueNom={boutiqueNom}
              whatsappNumber={whatsappNumber}
              addedProductId={addedProductId}
              onSelect={setSelectedPost}
              onAddToCart={handleAddProductToCart}
              getWhatsAppUrl={getWhatsAppUrlForPost}
            />
          ))}
        </div>
      )}

      {/* Modal Shoppable Content Viewer */}
      <SocialPostModal
        selectedPost={selectedPost}
        onClose={() => setSelectedPost(null)}
        boutiqueNom={boutiqueNom}
        boutiqueKey={boutiqueKey}
        boutiqueId={boutiqueId}
        whatsappNumber={whatsappNumber}
        addedProductId={addedProductId}
        onAddToCart={handleAddProductToCart}
        onOpenCart={() => {
          openCart(boutiqueKey, boutiqueId)
          setSelectedPost(null)
        }}
        getWhatsAppUrl={getWhatsAppUrlForPost}
      />
    </div>
  )
}
