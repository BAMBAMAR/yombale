'use client'

import React, { useState, useEffect } from 'react'
import ExternalImg from '@/components/ExternalImg'
import { cloudinaryHQ } from '@/lib/cloudinary'
import { fcfa } from '@/lib/format'
import {
  Sparkles, Link2, Plus, Trash2, Eye, EyeOff, Star, Check, 
  ExternalLink, Search, RefreshCw, AlertCircle, ShoppingBag, 
  Share2, ArrowUpRight, CheckCircle2, X
} from 'lucide-react'

interface ProduitCatalogue {
  id: string
  nom: string
  prix: number | null
  images: string[]
  en_stock: boolean
  categorie?: string | null
}

interface SocialPostAdmin {
  id: string
  plateforme: 'instagram' | 'tiktok' | 'facebook' | 'youtube'
  external_post_id?: string | null
  post_url: string
  media_type: string
  thumbnail_url?: string | null
  caption?: string | null
  auteur?: string | null
  visible: boolean
  is_featured: boolean
  ordre: number
  created_at: string
  produits: Array<{
    id: string
    nom: string
    prix: number | null
    images: string[]
    en_stock: boolean
    confidence_score?: number
  }>
}

interface SocialAccountAdmin {
  id: string
  plateforme: string
  nom_compte: string
  profil_url: string | null
  statut: string
}

interface SocialShopManagerProps {
  boutiqueId: string
  boutiqueNom: string
  boutiqueSlug?: string | null
}

export default function SocialShopManager({
  boutiqueId,
  boutiqueNom,
  boutiqueSlug,
}: SocialShopManagerProps) {
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [importUrl, setImportUrl] = useState('')
  const [autoMatch, setAutoMatch] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [posts, setPosts] = useState<SocialPostAdmin[]>([])
  const [accounts, setAccounts] = useState<SocialAccountAdmin[]>([])
  const [stats, setStats] = useState<any>({})
  const [analytics, setAnalytics] = useState<any>({})
  const [catalogue, setCatalogue] = useState<ProduitCatalogue[]>([])

  // Modal d'association manuelle de produit
  const [selectedPostForProduct, setSelectedPostForProduct] = useState<SocialPostAdmin | null>(null)
  const [productSearch, setProductSearch] = useState('')

  // Formulaire d'édition de compte officiel
  const [editingPlatform, setEditingPlatform] = useState<string | null>(null)
  const [accountInput, setAccountInput] = useState('')

  // Chargement des données d'administration
  async function loadAdminData() {
    try {
      setLoading(true)
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const token = localStorage.getItem('nopalou_token') || ''

      const [overviewRes, postsRes, prodsRes] = await Promise.all([
        fetch(`${backendUrl}/api/boutiques/${boutiqueId}/social/admin/overview`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${backendUrl}/api/boutiques/${boutiqueId}/social/admin/posts`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${backendUrl}/api/boutiques/${boutiqueId}/produits`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      if (overviewRes.ok) {
        const d = await overviewRes.json()
        setAccounts(d.comptes || [])
        setStats(d.stats || {})
        setAnalytics(d.analytics_30j || {})
      }

      if (postsRes.ok) {
        const d = await postsRes.json()
        setPosts(d.posts || [])
      }

      if (prodsRes.ok) {
        const d = await prodsRes.json()
        setCatalogue(d.produits || [])
      }
    } catch (err) {
      console.error('[LOAD_SOCIAL_ADMIN_ERR]', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAdminData()
  }, [boutiqueId])

  // 1. Import d'une publication par URL
  async function handleImportUrl(e: React.FormEvent) {
    e.preventDefault()
    if (!importUrl.trim()) return

    try {
      setImporting(true)
      setMessage(null)
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const token = localStorage.getItem('nopalou_token') || ''

      const res = await fetch(`${backendUrl}/api/boutiques/${boutiqueId}/social/admin/import-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          url: importUrl.trim(),
          auto_link_best_match: autoMatch,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Erreur lors de l\'importation' })
        return
      }

      let successMsg = `Publication ${data.post.plateforme.toUpperCase()} importée avec succès !`
      if (data.auto_linked_product) {
        successMsg += ` ✨ Produit "${data.auto_linked_product.nom}" associé automatiquement.`
      } else if (data.suggestions && data.suggestions.length > 0) {
        successMsg += ` 💡 ${data.suggestions.length} suggestion(s) de produits détectée(s).`
      }

      setMessage({ type: 'success', text: successMsg })
      setImportUrl('')
      await loadAdminData()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Impossible de joindre le serveur' })
    } finally {
      setImporting(false)
    }
  }

  // 2. Bascule visibilité (Afficher / Masquer)
  async function handleToggleVisible(post: SocialPostAdmin) {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const token = localStorage.getItem('nopalou_token') || ''

      const res = await fetch(`${backendUrl}/api/boutiques/${boutiqueId}/social/admin/posts/${post.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ visible: !post.visible }),
      })

      if (res.ok) {
        setPosts(prev => prev.map(p => p.id === post.id ? { ...p, visible: !p.visible } : p))
      }
    } catch (err) {
      console.error(err)
    }
  }

  // 3. Bascule mise à la une
  async function handleToggleFeatured(post: SocialPostAdmin) {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const token = localStorage.getItem('nopalou_token') || ''

      const res = await fetch(`${backendUrl}/api/boutiques/${boutiqueId}/social/admin/posts/${post.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_featured: !post.is_featured }),
      })

      if (res.ok) {
        setPosts(prev => prev.map(p => p.id === post.id ? { ...p, is_featured: !p.is_featured } : p))
      }
    } catch (err) {
      console.error(err)
    }
  }

  // 4. Suppression de publication
  async function handleDeletePost(postId: string) {
    if (!confirm('Supprimer définitivement cette publication de votre Social Shop ?')) return

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const token = localStorage.getItem('nopalou_token') || ''

      const res = await fetch(`${backendUrl}/api/boutiques/${boutiqueId}/social/admin/posts/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        setPosts(prev => prev.filter(p => p.id !== postId))
      }
    } catch (err) {
      console.error(err)
    }
  }

  // 5. Association produit
  async function handleAssociateProduct(productId: string) {
    if (!selectedPostForProduct) return

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const token = localStorage.getItem('nopalou_token') || ''

      const res = await fetch(`${backendUrl}/api/boutiques/${boutiqueId}/social/admin/posts/${selectedPostForProduct.id}/produits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ produit_id: productId, confidence_score: 1.0 }),
      })

      if (res.ok) {
        await loadAdminData()
        setSelectedPostForProduct(null)
      }
    } catch (err) {
      console.error(err)
    }
  }

  // 6. Dissociation produit
  async function handleDissociateProduct(postId: string, productId: string) {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const token = localStorage.getItem('nopalou_token') || ''

      const res = await fetch(`${backendUrl}/api/boutiques/${boutiqueId}/social/admin/posts/${postId}/produits/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        setPosts(prev => prev.map(p => {
          if (p.id !== postId) return p
          return {
            ...p,
            produits: p.produits.filter(pr => pr.id !== productId),
          }
        }))
      }
    } catch (err) {
      console.error(err)
    }
  }

  // 7. Enregistrement compte officiel
  async function handleSaveAccount(platform: string) {
    if (!accountInput.trim()) return

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const token = localStorage.getItem('nopalou_token') || ''

      const res = await fetch(`${backendUrl}/api/boutiques/${boutiqueId}/social/admin/accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          plateforme: platform,
          nom_compte: accountInput.trim(),
        }),
      })

      if (res.ok) {
        setEditingPlatform(null)
        setAccountInput('')
        await loadAdminData()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const filteredCatalogue = catalogue.filter(p =>
    p.nom.toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.categorie && p.categorie.toLowerCase().includes(productSearch.toLowerCase()))
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── HEADER ET STATS DE CONVERSION SOCIAL SHOP ── */}
      <div style={{
        background: '#ffffff',
        borderRadius: 16,
        padding: '24px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff7f0', color: '#C75B00', padding: '3px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
              <Sparkles size={13} /> Vitrine Social Commerce
            </div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#0f172a' }}>
              📱 Réseaux Sociaux & Social Shop
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
              Transformez vos publications Instagram, TikTok et Facebook en catalogue interactif pour vos clients.
            </p>
          </div>

          <a
            href={`/boutiques/${boutiqueSlug || boutiqueId}?tab=social`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: '#0f172a',
              color: '#ffffff',
              padding: '10px 18px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 800,
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(15,23,42,0.15)',
            }}
          >
            <span>Voir mon Social Shop en direct</span>
            <ExternalLink size={14} />
          </a>
        </div>

        {/* 4 KPIs Clés */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: 12, border: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: 11.5, color: '#64748b', fontWeight: 700 }}>Publications en ligne</span>
            <p style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 900, color: '#0f172a' }}>
              {stats.posts_affiches || 0}
              <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}> / {stats.total_posts || 0}</span>
            </p>
          </div>

          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: 12, border: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: 11.5, color: '#64748b', fontWeight: 700 }}>À associer à un produit</span>
            <p style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 900, color: (stats.posts_sans_produits || 0) > 0 ? '#ea580c' : '#16a34a' }}>
              {stats.posts_sans_produits || 0}
            </p>
          </div>

          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: 12, border: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: 11.5, color: '#64748b', fontWeight: 700 }}>Vues sociales (30j)</span>
            <p style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 900, color: '#2563eb' }}>
              {analytics.vues_sociales || 0}
            </p>
          </div>

          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: 12, border: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: 11.5, color: '#64748b', fontWeight: 700 }}>Clics WhatsApp générés</span>
            <p style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 900, color: '#16a34a' }}>
              {analytics.clics_whatsapp || 0}
            </p>
          </div>
        </div>
      </div>

      {/* ── SECTION 1 : COMPTES SOCIAUX OFFICIELS MARCHAND ── */}
      <div style={{
        background: '#ffffff',
        borderRadius: 16,
        padding: '24px',
        border: '1px solid #e2e8f0',
      }}>
        <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 900, color: '#0f172a' }}>
          1. Connecter mes profils officiels
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          {[
            { key: 'instagram', label: 'Instagram', icon: '📸', placeholder: '@maboutique ou lien profil' },
            { key: 'tiktok', label: 'TikTok', icon: '🎵', placeholder: '@maboutique ou lien profil' },
            { key: 'facebook', label: 'Facebook', icon: '📘', placeholder: 'Page ou profil Facebook' },
          ].map(plat => {
            const acc = accounts.find(a => a.plateforme === plat.key)
            const isEditing = editingPlatform === plat.key

            return (
              <div
                key={plat.key}
                style={{
                  background: acc ? '#f0fdf4' : '#f8fafc',
                  border: acc ? '1.5px solid #bbf7d0' : '1px solid #e2e8f0',
                  borderRadius: 14,
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 20 }}>{plat.icon}</span>
                    <span style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>{plat.label}</span>
                  </div>
                  {acc ? (
                    <span style={{ fontSize: 11, background: '#16a34a', color: '#fff', padding: '2px 8px', borderRadius: 12, fontWeight: 800 }}>
                      🟢 Connecté
                    </span>
                  ) : (
                    <span style={{ fontSize: 11, background: '#e2e8f0', color: '#64748b', padding: '2px 8px', borderRadius: 12, fontWeight: 700 }}>
                      Non renseigné
                    </span>
                  )}
                </div>

                {isEditing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <input
                      type="text"
                      placeholder={plat.placeholder}
                      value={accountInput}
                      onChange={e => setAccountInput(e.target.value)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: '1.5px solid #C75B00',
                        fontSize: 13,
                        outline: 'none',
                      }}
                      autoFocus
                    />
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => handleSaveAccount(plat.key)}
                        style={{
                          flex: 1,
                          background: '#C75B00',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 8,
                          padding: '6px',
                          fontWeight: 800,
                          fontSize: 12,
                          cursor: 'pointer',
                        }}
                      >
                        Enregistrer
                      </button>
                      <button
                        onClick={() => { setEditingPlatform(null); setAccountInput('') }}
                        style={{
                          background: '#e2e8f0',
                          color: '#475569',
                          border: 'none',
                          borderRadius: 8,
                          padding: '6px 12px',
                          fontWeight: 700,
                          fontSize: 12,
                          cursor: 'pointer',
                        }}
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: acc ? '#15803d' : '#64748b' }}>
                      {acc ? acc.nom_compte : 'Aucun compte lié'}
                    </span>
                    <button
                      onClick={() => {
                        setEditingPlatform(plat.key)
                        setAccountInput(acc ? acc.nom_compte : '')
                      }}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: 8,
                        padding: '4px 10px',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {acc ? 'Modifier' : '+ Connecter'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── SECTION 2 : FORMULAIRE D'IMPORTATION 1-CLIC PAR URL ── */}
      <div style={{
        background: '#ffffff',
        borderRadius: 16,
        padding: '24px',
        border: '1px solid #e2e8f0',
      }}>
        <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 900, color: '#0f172a' }}>
          2. Importer une publication (Reel, TikTok, Post)
        </h3>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>
          Collez le lien public d&apos;une vidéo ou publication. Nopalou récupère automatiquement la miniature, la légende et identifie vos produits !
        </p>

        <form onSubmit={handleImportUrl} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 280, position: 'relative' }}>
              <Link2 size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="url"
                placeholder="Ex: https://www.tiktok.com/@boutique/video/123... ou https://www.instagram.com/reel/..."
                value={importUrl}
                onChange={e => setImportUrl(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 42px',
                  borderRadius: 10,
                  border: '1.5px solid #cbd5e1',
                  fontSize: 13.5,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={importing || !importUrl.trim()}
              style={{
                background: importing ? '#94a3b8' : '#C75B00',
                color: '#ffffff',
                border: 'none',
                borderRadius: 10,
                padding: '12px 24px',
                fontSize: 14,
                fontWeight: 900,
                cursor: importing ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 14px rgba(199,91,0,0.25)',
              }}
            >
              {importing ? (
                <>
                  <RefreshCw size={16} className="spin" />
                  <span>Analyse en cours...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Importer & Associer</span>
                </>
              )}
            </button>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#334155', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={autoMatch}
              onChange={e => setAutoMatch(e.target.checked)}
              style={{ accentColor: '#C75B00' }}
            />
            <span>Activer le <strong>Smart Matching</strong> automatique (associe les produits correspondant au texte à +85%)</span>
          </label>
        </form>

        {message && (
          <div style={{
            marginTop: 14,
            padding: '12px 16px',
            borderRadius: 10,
            background: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            color: message.type === 'success' ? '#15803d' : '#b91c1c',
            fontSize: 13,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{message.text}</span>
          </div>
        )}
      </div>

      {/* ── SECTION 3 : GESTION DES CONTENUS DU SOCIAL SHOP ── */}
      <div style={{
        background: '#ffffff',
        borderRadius: 16,
        padding: '24px',
        border: '1px solid #e2e8f0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#0f172a' }}>
            3. Gestion & Curation des publications ({posts.length})
          </h3>
          <span style={{ fontSize: 12, color: '#64748b' }}>
            {posts.filter(p => p.visible).length} affichée(s) sur votre boutique publique
          </span>
        </div>

        {posts.length === 0 ? (
          <div style={{
            padding: '40px 20px',
            textAlign: 'center',
            background: '#f8fafc',
            borderRadius: 12,
            border: '1px dashed #cbd5e1',
          }}>
            <p style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 800, color: '#334155' }}>
              Aucune publication importée pour l&apos;instant
            </p>
            <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
              Collez un lien TikTok, Instagram ou Facebook dans le formulaire ci-dessus pour lancer votre Social Shop !
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {posts.map(post => (
              <div
                key={post.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '14px',
                  borderRadius: 14,
                  background: post.visible ? '#ffffff' : '#f8fafc',
                  border: post.is_featured ? '2px solid #C75B00' : '1px solid #e2e8f0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  flexWrap: 'wrap',
                }}
              >
                {/* Miniature Vidéo / Photo */}
                <div style={{ width: 70, height: 95, borderRadius: 10, background: '#0f172a', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                  {post.thumbnail_url ? (
                    <ExternalImg src={post.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20 }}>
                      🎬
                    </div>
                  )}
                  <span style={{ position: 'absolute', top: 4, left: 4, fontSize: 10, background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '1px 5px', borderRadius: 4, fontWeight: 800 }}>
                    {post.plateforme.slice(0, 2).toUpperCase()}
                  </span>
                </div>

                {/* Métadonnées & Légende */}
                <div style={{ flex: '1 1 240px', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#C75B00', textTransform: 'uppercase' }}>
                      {post.plateforme}
                    </span>
                    {post.auteur && (
                      <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
                        par {post.auteur}
                      </span>
                    )}
                    {post.is_featured && (
                      <span style={{ fontSize: 10.5, background: '#fff7f0', color: '#C75B00', border: '1px solid #fed7aa', padding: '1px 6px', borderRadius: 10, fontWeight: 800 }}>
                        ⭐ À la une
                      </span>
                    )}
                  </div>

                  <p style={{ margin: '0 0 8px', fontSize: 13, color: '#1e293b', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {post.caption || 'Publication sans légende'}
                  </p>

                  {/* Produits Associés à cette publication */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    {post.produits && post.produits.length > 0 ? (
                      post.produits.map(prod => (
                        <span
                          key={prod.id}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            background: '#f1f5f9',
                            border: '1px solid #cbd5e1',
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: 11.5,
                            fontWeight: 700,
                            color: '#0f172a',
                          }}
                        >
                          <ShoppingBag size={11} style={{ color: '#C75B00' }} />
                          <span>{prod.nom} ({prod.prix ? fcfa(prod.prix) : '—'})</span>
                          <button
                            onClick={() => handleDissociateProduct(post.id, prod.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, marginLeft: 2 }}
                            title="Dissocier ce produit"
                          >
                            ×
                          </button>
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: 11.5, color: '#ea580c', fontWeight: 700 }}>
                        ⚠️ Aucun produit associé
                      </span>
                    )}

                    <button
                      onClick={() => setSelectedPostForProduct(post)}
                      style={{
                        background: '#fff',
                        border: '1px dashed #C75B00',
                        color: '#C75B00',
                        borderRadius: 6,
                        padding: '3px 8px',
                        fontSize: 11,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Plus size={12} /> Associer un produit
                    </button>
                  </div>
                </div>

                {/* Actions Marchand */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={() => handleToggleVisible(post)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      background: post.visible ? '#f0fdf4' : '#f8fafc',
                      color: post.visible ? '#15803d' : '#64748b',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    {post.visible ? <><Eye size={13} /> Affiché</> : <><EyeOff size={13} /> Masqué</>}
                  </button>

                  <button
                    onClick={() => handleToggleFeatured(post)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      background: post.is_featured ? '#fff7f0' : '#ffffff',
                      color: post.is_featured ? '#C75B00' : '#64748b',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                    title="Mettre en avant"
                  >
                    <Star size={14} fill={post.is_featured ? '#C75B00' : 'none'} />
                  </button>

                  <a
                    href={post.post_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#334155',
                      display: 'flex',
                      alignItems: 'center',
                      textDecoration: 'none',
                    }}
                    title="Voir l'original"
                  >
                    <ExternalLink size={14} />
                  </a>

                  <button
                    onClick={() => handleDeletePost(post.id)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: '1px solid #fecaca',
                      background: '#fff',
                      color: '#dc2626',
                      cursor: 'pointer',
                    }}
                    title="Supprimer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── MODAL DE SÉLECTION D'UN PRODUIT À ASSOCIER ── */}
      {selectedPostForProduct && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setSelectedPostForProduct(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 20,
              width: '100%',
              maxWidth: 540,
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              overflow: 'hidden',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '18px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#0f172a' }}>
                  Associer un produit à cette publication
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                  Les acheteurs pourront l&apos;ajouter au panier ou le commander sur WhatsApp directement.
                </p>
              </div>
              <button
                onClick={() => setSelectedPostForProduct(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Barre de recherche produit */}
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Rechercher par nom d'article ou catégorie..."
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 38px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: 13,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  autoFocus
                />
              </div>
            </div>

            {/* Liste scrollable des produits */}
            <div style={{ padding: '12px 20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredCatalogue.length === 0 ? (
                <p style={{ textAlign: 'center', padding: 20, color: '#94a3b8', fontSize: 13 }}>
                  Aucun produit trouvé dans votre catalogue.
                </p>
              ) : (
                filteredCatalogue.map(prod => {
                  const alreadyLinked = selectedPostForProduct.produits?.some(p => p.id === prod.id)
                  return (
                    <div
                      key={prod.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        padding: '10px 12px',
                        borderRadius: 10,
                        background: alreadyLinked ? '#f0fdf4' : '#f8fafc',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <div style={{ width: 42, height: 42, borderRadius: 6, background: '#fff', overflow: 'hidden', flexShrink: 0, border: '1px solid #cbd5e1' }}>
                          {prod.images?.[0] ? (
                            <ExternalImg src={cloudinaryHQ(prod.images[0], { width: 90 })} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <ShoppingBag size={16} style={{ color: '#94a3b8' }} />
                            </div>
                          )}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {prod.nom}
                          </p>
                          <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: '#C75B00' }}>
                            {prod.prix ? fcfa(prod.prix) : 'Sur demande'}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAssociateProduct(prod.id)}
                        disabled={alreadyLinked}
                        style={{
                          background: alreadyLinked ? '#16a34a' : '#0f172a',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 8,
                          padding: '6px 12px',
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: alreadyLinked ? 'default' : 'pointer',
                          flexShrink: 0,
                        }}
                      >
                        {alreadyLinked ? '✓ Déjà lié' : 'Associer'}
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
