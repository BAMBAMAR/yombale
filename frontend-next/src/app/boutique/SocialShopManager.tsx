'use client'

import React, { useState, useEffect } from 'react'
import ExternalImg from '@/components/ExternalImg'
import { cloudinaryHQ } from '@/lib/cloudinary'
import { fcfa } from '@/lib/format'
import {
  Sparkles, Link2, Plus, Trash2, Eye, EyeOff, Star, Check, 
  ExternalLink, Search, RefreshCw, AlertCircle, ShoppingBag, 
  Share2, ArrowUpRight, CheckCircle2, X, Layers, Video, Wand2,
  CheckSquare, Square
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
  derniere_sync_at?: string | null
  auto_sync?: boolean
}

interface DiscoveredPost {
  externalPostId?: string
  url: string
  platform: string
  mediaType: string
  thumbnailUrl?: string | null
  caption?: string
  author?: string
  is_already_imported?: boolean
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

  // Navigation par onglets segmentés anti-longueur
  const [activeMainTab, setActiveMainTab] = useState<'posts' | 'import' | 'accounts'>('posts')
  const [postFilter, setPostFilter] = useState<'all' | 'unlinked' | 'featured' | 'hidden'>('all')

  // 3 Modes d'importation : 'profile' (Aspirateur @pseudo) | 'batch' (Multi-liens) | 'single' (Lien unique)
  const [importMode, setImportMode] = useState<'profile' | 'batch' | 'single'>('profile')

  // Mode 1 : Aspirateur de profil (@pseudo)
  const [profilePlatform, setProfilePlatform] = useState<'tiktok' | 'instagram' | 'facebook'>('tiktok')
  const [profileUsername, setProfileUsername] = useState('')
  const [exploringProfile, setExploringProfile] = useState(false)
  const [discoveredPosts, setDiscoveredPosts] = useState<DiscoveredPost[]>([])
  const [selectedDiscoveredUrls, setSelectedDiscoveredUrls] = useState<Set<string>>(new Set())
  const [importingDiscovered, setImportingDiscovered] = useState(false)

  // Mode 2 : Import en lot (Multi-liens)
  const [batchUrlsText, setBatchUrlsText] = useState('')
  const [batchImporting, setBatchImporting] = useState(false)

  // Synchronisation des comptes
  const [syncingAccountId, setSyncingAccountId] = useState<string | null>(null)

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
        const ct = overviewRes.headers.get('content-type') || ''
        if (ct.includes('application/json')) {
          const d = await overviewRes.json()
          setAccounts(d.comptes || [])
          setStats(d.stats || {})
          setAnalytics(d.analytics_30j || {})
        }
      }

      if (postsRes.ok) {
        const ct = postsRes.headers.get('content-type') || ''
        if (ct.includes('application/json')) {
          const d = await postsRes.json()
          setPosts(d.posts || [])
        }
      }

      if (prodsRes.ok) {
        const ct = prodsRes.headers.get('content-type') || ''
        if (ct.includes('application/json')) {
          const d = await prodsRes.json()
          setCatalogue(d.produits || [])
        }
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

  // 1.B. Explorer un profil social (@pseudo)
  async function handleExploreProfile(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!profileUsername.trim()) return

    try {
      setExploringProfile(true)
      setMessage(null)
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const token = localStorage.getItem('nopalou_token') || ''

      const res = await fetch(`${backendUrl}/api/boutiques/${boutiqueId}/social/admin/explore-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          plateforme: profilePlatform,
          username: profileUsername.trim(),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Impossible d\'explorer ce profil' })
        return
      }

      const found: DiscoveredPost[] = data.posts || []
      setDiscoveredPosts(found)

      const initialSelected = new Set<string>()
      found.forEach(p => {
        if (!p.is_already_imported) {
          initialSelected.add(p.url)
        }
      })
      setSelectedDiscoveredUrls(initialSelected)

      setMessage({
        type: 'success',
        text: `✨ ${found.length} publication(s) détectée(s) pour @${data.username} (${initialSelected.size} nouvelle(s)).`,
      })
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erreur de connexion' })
    } finally {
      setExploringProfile(false)
    }
  }

  // 1.C. Importer les publications sélectionnées de l'aspirateur
  async function handleImportDiscovered() {
    if (selectedDiscoveredUrls.size === 0) return

    try {
      setImportingDiscovered(true)
      setMessage(null)
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const token = localStorage.getItem('nopalou_token') || ''

      const res = await fetch(`${backendUrl}/api/boutiques/${boutiqueId}/social/admin/import-batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          raw_urls: Array.from(selectedDiscoveredUrls),
          auto_link_best_match: autoMatch,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Erreur lors de l\'importation groupée' })
        return
      }

      setMessage({
        type: 'success',
        text: `🚀 ${data.imported_count} publication(s) importée(s) avec succès ! (${data.auto_linked_count || 0} produit(s) auto-associé(s)).`,
      })
      setDiscoveredPosts([])
      setSelectedDiscoveredUrls(new Set())
      await loadAdminData()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erreur lors de l\'importation' })
    } finally {
      setImportingDiscovered(false)
    }
  }

  // 1.D. Importer un lot d'URLs collées dans la zone texte
  async function handleImportBatch(e: React.FormEvent) {
    e.preventDefault()
    if (!batchUrlsText.trim()) return

    try {
      setBatchImporting(true)
      setMessage(null)
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const token = localStorage.getItem('nopalou_token') || ''

      const res = await fetch(`${backendUrl}/api/boutiques/${boutiqueId}/social/admin/import-batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          raw_urls: batchUrlsText,
          auto_link_best_match: autoMatch,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Erreur lors de l\'importation du lot' })
        return
      }

      setMessage({
        type: 'success',
        text: `⚡ ${data.imported_count} publication(s) importée(s) sur ${data.total_detected} lien(s) valide(s) ! (${data.auto_linked_count || 0} produit(s) auto-associé(s)).`,
      })
      setBatchUrlsText('')
      await loadAdminData()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erreur serveur' })
    } finally {
      setBatchImporting(false)
    }
  }

  // 1.E. Synchroniser un compte officiel -> Déclenche l'exploration et permet de SÉLECTIONNER les publications à importer
  async function handleSyncAccount(acc: SocialAccountAdmin) {
    try {
      setSyncingAccountId(acc.id)
      setMessage(null)
      setImportMode('profile')
      setActiveMainTab('import')
      setProfilePlatform(acc.plateforme as any)
      setProfileUsername(acc.nom_compte)

      // Scroll doux automatique vers la section de sélection
      setTimeout(() => {
        document.getElementById('social-selection-section')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)

      setExploringProfile(true)
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const token = localStorage.getItem('nopalou_token') || ''

      const res = await fetch(`${backendUrl}/api/boutiques/${boutiqueId}/social/admin/explore-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          plateforme: acc.plateforme,
          username: acc.nom_compte.trim(),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Impossible d\'explorer ce profil' })
        return
      }

      const found: DiscoveredPost[] = data.posts || []
      setDiscoveredPosts(found)

      const initialSelected = new Set<string>()
      found.forEach(p => {
        if (!p.is_already_imported) {
          initialSelected.add(p.url)
        }
      })
      setSelectedDiscoveredUrls(initialSelected)

      if (found.length > 0) {
        setMessage({
          type: 'success',
          text: `✨ Synchronisation pour @${acc.nom_compte} : ${found.length} publication(s) trouvée(s). Cochez celles que vous souhaitez ajouter à votre boutique ci-dessous :`,
        })
      } else {
        setMessage({
          type: 'error',
          text: `Aucune publication trouvée automatiquement pour @${acc.nom_compte}. Vous pouvez coller directement les liens de vos vidéos dans l'onglet "Coller plusieurs liens".`,
        })
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erreur lors de la synchronisation' })
    } finally {
      setSyncingAccountId(null)
      setExploringProfile(false)
    }
  }

  // 1.F. Activer/Désactiver l'Auto-Sync d'un compte
  async function handleToggleAutoSync(acc: SocialAccountAdmin) {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const token = localStorage.getItem('nopalou_token') || ''

      const res = await fetch(`${backendUrl}/api/boutiques/${boutiqueId}/social/admin/accounts/${acc.id}/toggle-sync`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        setAccounts(prev => prev.map(a => a.id === acc.id ? { ...a, auto_sync: data.account.auto_sync } : a))
      }
    } catch (err) {
      console.error(err)
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

  const postsWithoutProducts = posts.filter(p => !p.produits || p.produits.length === 0)
  const featuredPosts = posts.filter(p => p.is_featured)
  const hiddenPosts = posts.filter(p => !p.visible)

  const displayedPosts = posts.filter(post => {
    if (postFilter === 'unlinked') return !post.produits || post.produits.length === 0
    if (postFilter === 'featured') return post.is_featured
    if (postFilter === 'hidden') return !post.visible
    return true
  })

  return (
    <div className="social-shop-manager-wrap" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* ── HEADER COMPACT & SEGMENTED CONTROLS ANTI-LONGUEUR ── */}
      <div className="social-shop-compact-card">
        {/* Ligne Titre & CTA Vitrine */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #ea580c 0%, #C75B00 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 18,
              boxShadow: '0 2px 8px rgba(199,91,0,0.25)',
              flexShrink: 0,
            }}>
              📱
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#0f172a' }}>
                  Social Shop
                </h2>
                <span style={{ fontSize: 10.5, background: '#dcfce7', color: '#15803d', padding: '1px 6px', borderRadius: 10, fontWeight: 800 }}>
                  ● En direct
                </span>
              </div>
              <p style={{ margin: '1px 0 0', fontSize: 11.5, color: '#64748b' }}>
                Vitrine interactive TikTok, Instagram & Facebook
              </p>
            </div>
          </div>

          <a
            href={`/boutiques/${boutiqueSlug || boutiqueId}?tab=social`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 20,
              background: '#0f172a',
              color: '#ffffff',
              fontSize: 12,
              fontWeight: 800,
              textDecoration: 'none',
              flexShrink: 0,
              boxShadow: '0 2px 6px rgba(15,23,42,0.15)',
            }}
          >
            <span>Voir ma vitrine</span>
            <ExternalLink size={12} />
          </a>
        </div>

        {/* Barre de Micro-KPIs en 1 seule ligne compacte */}
        <div className="social-micro-kpi-bar" style={{ marginTop: 12 }}>
          <div
            className="social-micro-kpi-item"
            onClick={() => { setActiveMainTab('posts'); setPostFilter('all') }}
            style={{ cursor: 'pointer' }}
            title="Voir toutes les publications"
          >
            <span className="social-micro-kpi-val" style={{ color: '#0f172a' }}>
              {stats.posts_affiches || 0}
              <span style={{ fontSize: 10.5, fontWeight: 600, color: '#94a3b8' }}>/{stats.total_posts || 0}</span>
            </span>
            <span className="social-micro-kpi-lbl">en ligne</span>
          </div>

          <div className="social-micro-kpi-divider" />

          <div
            className="social-micro-kpi-item"
            onClick={() => { setActiveMainTab('posts'); setPostFilter('unlinked') }}
            style={{ cursor: 'pointer' }}
            title="Filtrer les publications sans produit"
          >
            <span className="social-micro-kpi-val" style={{ color: (stats.posts_sans_produits || 0) > 0 ? '#ea580c' : '#16a34a' }}>
              {(stats.posts_sans_produits || 0) > 0 ? `⚠️ ${stats.posts_sans_produits}` : '0'}
            </span>
            <span className="social-micro-kpi-lbl">à associer</span>
          </div>

          <div className="social-micro-kpi-divider" />

          <div className="social-micro-kpi-item">
            <span className="social-micro-kpi-val" style={{ color: '#2563eb' }}>
              {analytics.vues_sociales || 0}
            </span>
            <span className="social-micro-kpi-lbl">vues (30j)</span>
          </div>

          <div className="social-micro-kpi-divider" />

          <div className="social-micro-kpi-item">
            <span className="social-micro-kpi-val" style={{ color: '#16a34a' }}>
              {analytics.clics_whatsapp || 0}
            </span>
            <span className="social-micro-kpi-lbl">clics WA</span>
          </div>
        </div>

        {/* Ruban de navigation par onglets segmentés (Segmented Control) */}
        <div className="social-segmented-nav" style={{ marginTop: 12 }}>
          <button
            type="button"
            onClick={() => setActiveMainTab('posts')}
            className={`social-segment-btn ${activeMainTab === 'posts' ? 'active' : ''}`}
          >
            <span>🎬 Mes Publications</span>
            <span className="social-segment-badge">{posts.length}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('import')}
            className={`social-segment-btn ${activeMainTab === 'import' ? 'active' : ''}`}
          >
            <span>➕ Ajouter</span>
            {discoveredPosts.length > 0 && (
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ea580c' }} />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('accounts')}
            className={`social-segment-btn ${activeMainTab === 'accounts' ? 'active' : ''}`}
          >
            <span>⚙️ Profils</span>
            <span className="social-segment-badge">
              {accounts.filter(a => a.nom_compte).length}/3
            </span>
          </button>
        </div>
      </div>

      {/* Notification Toast Globale */}
      {message && (
        <div style={{
          padding: '10px 14px',
          borderRadius: 10,
          background: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          color: message.type === 'success' ? '#15803d' : '#b91c1c',
          fontSize: 12.5,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            {message.type === 'success' ? <CheckCircle2 size={16} style={{ flexShrink: 0 }} /> : <AlertCircle size={16} style={{ flexShrink: 0 }} />}
            <span style={{ wordBreak: 'break-word' }}>{message.text}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, opacity: 0.7, flexShrink: 0 }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* ── ONGLET 1 : GESTION DES PUBLICATIONS ── */}
      {activeMainTab === 'posts' && (
        <div className="social-shop-compact-card">
          {/* Barre d'outils et filtres rapides */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <div className="social-filter-pills">
              <button
                type="button"
                onClick={() => setPostFilter('all')}
                className={`social-filter-pill ${postFilter === 'all' ? 'active' : ''}`}
              >
                Toutes ({posts.length})
              </button>

              <button
                type="button"
                onClick={() => setPostFilter('unlinked')}
                className={`social-filter-pill ${postFilter === 'unlinked' ? (postsWithoutProducts.length > 0 ? 'warning-active' : 'active') : ''}`}
                style={{
                  color: postFilter !== 'unlinked' && postsWithoutProducts.length > 0 ? '#ea580c' : undefined,
                  borderColor: postFilter !== 'unlinked' && postsWithoutProducts.length > 0 ? '#fed7aa' : undefined,
                  background: postFilter !== 'unlinked' && postsWithoutProducts.length > 0 ? '#fff7ed' : undefined,
                }}
              >
                ⚠️ À associer ({postsWithoutProducts.length})
              </button>

              <button
                type="button"
                onClick={() => setPostFilter('featured')}
                className={`social-filter-pill ${postFilter === 'featured' ? 'active' : ''}`}
              >
                ⭐ À la une ({featuredPosts.length})
              </button>

              <button
                type="button"
                onClick={() => setPostFilter('hidden')}
                className={`social-filter-pill ${postFilter === 'hidden' ? 'active' : ''}`}
              >
                Masquées ({hiddenPosts.length})
              </button>
            </div>

            <button
              type="button"
              onClick={() => setActiveMainTab('import')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: '#fff7ed',
                color: '#C75B00',
                border: '1px solid #fed7aa',
                borderRadius: 20,
                padding: '5px 12px',
                fontSize: 11.5,
                fontWeight: 800,
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <Plus size={12} />
              <span>Ajouter</span>
            </button>
          </div>

          {/* Liste des publications compactes */}
          {displayedPosts.length === 0 ? (
            <div style={{
              padding: '32px 16px',
              textAlign: 'center',
              background: '#f8fafc',
              borderRadius: 12,
              border: '1px dashed #cbd5e1',
            }}>
              <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 800, color: '#334155' }}>
                {posts.length === 0 ? 'Aucune publication pour le moment' : 'Aucune publication dans ce filtre'}
              </p>
              <p style={{ margin: '0 0 14px', fontSize: 12.5, color: '#64748b' }}>
                {posts.length === 0
                  ? 'Importez une vidéo TikTok, Instagram ou Facebook pour commencer.'
                  : 'Essayez de sélectionner un autre filtre ci-dessus.'}
              </p>
              {posts.length === 0 ? (
                <button
                  type="button"
                  onClick={() => setActiveMainTab('import')}
                  style={{
                    background: '#C75B00',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontSize: 12.5,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  ➕ Ajouter une vidéo
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setPostFilter('all')}
                  style={{
                    background: '#f1f5f9',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    borderRadius: 8,
                    padding: '6px 12px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Afficher toutes les publications
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {displayedPosts.map(post => (
                <div
                  key={post.id}
                  className="social-compact-post-card"
                  style={{
                    border: post.is_featured ? '1.5px solid #fdba74' : undefined,
                    background: !post.visible ? '#f8fafc' : '#ffffff',
                    opacity: !post.visible ? 0.75 : 1,
                  }}
                >
                  {/* Miniature vidéo */}
                  <div className="social-compact-thumb">
                    {post.thumbnail_url ? (
                      <ExternalImg src={post.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 18 }}>
                        🎬
                      </div>
                    )}
                    <span style={{
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
                    }}>
                      {post.plateforme === 'instagram' ? 'IG' : post.plateforme === 'tiktok' ? 'TT' : 'FB'}
                    </span>
                  </div>

                  {/* Infos & Produit */}
                  <div className="social-compact-info">
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
                        <span style={{ fontSize: 9.5, background: '#fff7ed', color: '#C75B00', border: '1px solid #fed7aa', padding: '0 5px', borderRadius: 8, fontWeight: 800 }}>
                          ⭐ À la une
                        </span>
                      )}
                      {!post.visible && (
                        <span style={{ fontSize: 9.5, background: '#f1f5f9', color: '#64748b', padding: '0 5px', borderRadius: 8, fontWeight: 700 }}>
                          ⚪ Masqué
                        </span>
                      )}
                    </div>

                    <p style={{
                      margin: 0,
                      fontSize: 12.5,
                      color: '#0f172a',
                      fontWeight: 600,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {post.caption || 'Publication sans légende'}
                    </p>

                    {/* Pastilles de Produits associés */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', marginTop: 2 }}>
                      {post.produits && post.produits.length > 0 ? (
                        <>
                          {post.produits.map(prod => (
                            <span key={prod.id} className="social-prod-pill">
                              <ShoppingBag size={10} style={{ color: '#C75B00', flexShrink: 0 }} />
                              <span style={{ maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {prod.nom} ({prod.prix ? fcfa(prod.prix) : '—'})
                              </span>
                              <button
                                onClick={() => handleDissociateProduct(post.id, prod.id)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, fontSize: 12, lineHeight: 1, marginLeft: 2 }}
                                title="Dissocier ce produit"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                          <button
                            onClick={() => setSelectedPostForProduct(post)}
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
                      ) : (
                        <button
                          onClick={() => setSelectedPostForProduct(post)}
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
                  </div>

                  {/* Actions d'administration compactes */}
                  <div className="social-compact-actions">
                    <button
                      onClick={() => handleToggleVisible(post)}
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
                      onClick={() => handleToggleFeatured(post)}
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
                      onClick={() => handleDeletePost(post.id)}
                      className="social-compact-action-btn"
                      style={{ color: '#ef4444' }}
                      title="Supprimer la publication"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ONGLET 2 : AJOUTER & IMPORTER DU CONTENU ── */}
      {activeMainTab === 'import' && (
        <div id="social-selection-section" className="social-shop-compact-card">
          <div style={{ marginBottom: 14 }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 900, color: '#0f172a' }}>
              ➕ Ajouter des Publications
            </h3>
            <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
              Importez vos vidéos Instagram, TikTok et Facebook par profil ou par lien direct.
            </p>
          </div>

          {/* Barre de navigation des 3 Sous-Modes */}
          <div className="social-tabs-nav">
            <button
              type="button"
              onClick={() => setImportMode('profile')}
              className="social-tab-btn"
              style={{
                background: importMode === 'profile' ? '#C75B00' : '#f8fafc',
                color: importMode === 'profile' ? '#ffffff' : '#475569',
                boxShadow: importMode === 'profile' ? '0 2px 8px rgba(199,91,0,0.2)' : 'none',
              }}
            >
              <Sparkles size={14} />
              <span>🔍 Aspirateur @pseudo</span>
            </button>

            <button
              type="button"
              onClick={() => setImportMode('batch')}
              className="social-tab-btn"
              style={{
                background: importMode === 'batch' ? '#C75B00' : '#f8fafc',
                color: importMode === 'batch' ? '#ffffff' : '#475569',
                boxShadow: importMode === 'batch' ? '0 2px 8px rgba(199,91,0,0.2)' : 'none',
              }}
            >
              <Layers size={14} />
              <span>📋 Liens en lot</span>
            </button>

            <button
              type="button"
              onClick={() => setImportMode('single')}
              className="social-tab-btn"
              style={{
                background: importMode === 'single' ? '#C75B00' : '#f8fafc',
                color: importMode === 'single' ? '#ffffff' : '#475569',
                boxShadow: importMode === 'single' ? '0 2px 8px rgba(199,91,0,0.2)' : 'none',
              }}
            >
              <Link2 size={14} />
              <span>🔗 Lien unique</span>
            </button>
          </div>

          {/* Mode 1 : Aspirateur de profil (@pseudo) */}
          {importMode === 'profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: '10px 14px', fontSize: 12.5, color: '#9a3412', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={16} style={{ flexShrink: 0 }} />
                <span>
                  <strong>Zéro copier-coller :</strong> Renseignez votre pseudo public. Nopalou explore votre compte et affiche vos vidéos dans une grille prête à cocher.
                </span>
              </div>

              <form onSubmit={handleExploreProfile} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <select
                  value={profilePlatform}
                  onChange={e => setProfilePlatform(e.target.value as any)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1.5px solid #cbd5e1',
                    fontSize: 13,
                    fontWeight: 700,
                    background: '#ffffff',
                    outline: 'none',
                    flex: '0 0 auto',
                  }}
                >
                  <option value="tiktok">🎵 TikTok</option>
                  <option value="instagram">📸 Instagram</option>
                  <option value="facebook">📘 Facebook</option>
                </select>

                <div style={{ flex: '1 1 180px', minWidth: 0, position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Ex: @votre_boutique"
                    value={profileUsername}
                    onChange={e => setProfileUsername(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1.5px solid #cbd5e1',
                      fontSize: 13,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={exploringProfile || !profileUsername.trim()}
                  style={{
                    background: exploringProfile ? '#94a3b8' : '#0f172a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 10,
                    padding: '10px 18px',
                    fontSize: 13,
                    fontWeight: 900,
                    cursor: exploringProfile ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    flex: '1 1 auto',
                  }}
                >
                  {exploringProfile ? (
                    <>
                      <RefreshCw size={14} className="spin" />
                      <span>Exploration…</span>
                    </>
                  ) : (
                    <>
                      <Search size={14} />
                      <span>Aspirer les vidéos</span>
                    </>
                  )}
                </button>
              </form>

              {/* Raccourcis profils connectés */}
              {accounts.filter(a => a.nom_compte).length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11.5, color: '#64748b' }}>Raccourcis :</span>
                  {accounts.filter(a => a.nom_compte).map(acc => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => {
                        setProfilePlatform(acc.plateforme as any)
                        setProfileUsername(acc.nom_compte)
                      }}
                      style={{
                        background: '#f1f5f9',
                        border: '1px solid #e2e8f0',
                        borderRadius: 20,
                        padding: '2px 8px',
                        fontSize: 11.5,
                        fontWeight: 700,
                        color: '#334155',
                        cursor: 'pointer',
                      }}
                    >
                      @{acc.nom_compte.replace(/^@/, '')} ({acc.plateforme})
                    </button>
                  ))}
                </div>
              )}

              {/* Grille des publications découvertes à cocher */}
              {discoveredPosts.length > 0 && (
                <div style={{ border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '14px', background: '#f8fafc' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>
                        {discoveredPosts.length} trouvée(s)
                      </span>
                      <span style={{ fontSize: 11.5, color: '#C75B00', background: '#fff7ed', padding: '1px 6px', borderRadius: 8, fontWeight: 700 }}>
                        {selectedDiscoveredUrls.size} cochée(s)
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => {
                          const all = new Set<string>()
                          discoveredPosts.forEach(p => all.add(p.url))
                          setSelectedDiscoveredUrls(all)
                        }}
                        style={{
                          background: '#fff',
                          border: '1px solid #cbd5e1',
                          borderRadius: 6,
                          padding: '3px 8px',
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Tout cocher
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedDiscoveredUrls(new Set())}
                        style={{
                          background: '#fff',
                          border: '1px solid #cbd5e1',
                          borderRadius: 6,
                          padding: '3px 8px',
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Décocher
                      </button>
                    </div>
                  </div>

                  {/* Grille 2 colonnes ultra-compacte */}
                  <div className="social-discovered-grid">
                    {discoveredPosts.map((p, idx) => {
                      const isSelected = selectedDiscoveredUrls.has(p.url)
                      return (
                        <div
                          key={p.url || idx}
                          onClick={() => {
                            if (p.is_already_imported) return
                            const next = new Set(selectedDiscoveredUrls)
                            if (next.has(p.url)) next.delete(p.url)
                            else next.add(p.url)
                            setSelectedDiscoveredUrls(next)
                          }}
                          style={{
                            display: 'flex',
                            gap: 8,
                            padding: 8,
                            borderRadius: 10,
                            background: isSelected ? '#fff7ed' : '#ffffff',
                            border: `1.5px solid ${isSelected ? '#C75B00' : '#e2e8f0'}`,
                            cursor: p.is_already_imported ? 'default' : 'pointer',
                            opacity: p.is_already_imported ? 0.6 : 1,
                            position: 'relative',
                            boxSizing: 'border-box',
                          }}
                        >
                          <div style={{ width: 44, height: 58, borderRadius: 6, background: '#0f172a', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                            {p.thumbnailUrl ? (
                              <ExternalImg src={p.thumbnailUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 16 }}>
                                🎬
                              </div>
                            )}
                          </div>

                          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <p style={{ margin: 0, fontSize: 11.5, color: '#1e293b', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.3 }}>
                              {p.caption || 'Sans légende'}
                            </p>
                            <span style={{ fontSize: 10, color: p.is_already_imported ? '#16a34a' : isSelected ? '#C75B00' : '#64748b', fontWeight: 800 }}>
                              {p.is_already_imported ? '✓ Déjà importé' : isSelected ? '✓ Sélectionné' : '+ Sélectionner'}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={handleImportDiscovered}
                    disabled={importingDiscovered || selectedDiscoveredUrls.size === 0}
                    style={{
                      marginTop: 12,
                      width: '100%',
                      background: selectedDiscoveredUrls.size === 0 ? '#cbd5e1' : '#C75B00',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 10,
                      padding: '11px',
                      fontSize: 13,
                      fontWeight: 900,
                      cursor: selectedDiscoveredUrls.size === 0 || importingDiscovered ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    {importingDiscovered ? (
                      <>
                        <RefreshCw size={15} className="spin" />
                        <span>Importation en cours…</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={15} />
                        <span>Importer les {selectedDiscoveredUrls.size} publications sélectionnées</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mode 2 : Import en lot (Multi-liens) */}
          {importMode === 'batch' && (
            <form onSubmit={handleImportBatch} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: '10px 14px', fontSize: 12.5, color: '#0369a1', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Layers size={16} style={{ flexShrink: 0 }} />
                <span>
                  Collez un ou plusieurs liens (un par ligne ou séparés par des espaces). TikTok, Instagram Reels ou Facebook Vidéos.
                </span>
              </div>

              <textarea
                rows={4}
                placeholder="https://www.tiktok.com/@.../video/...&#10;https://www.instagram.com/reel/...&#10;https://www.facebook.com/watch/..."
                value={batchUrlsText}
                onChange={e => setBatchUrlsText(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1.5px solid #cbd5e1',
                  fontSize: 12.5,
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'monospace',
                }}
              />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: (batchUrlsText.match(/https?:\/\/[^\s]+/g) || []).length > 0 ? '#C75B00' : '#64748b' }}>
                  {(batchUrlsText.match(/https?:\/\/[^\s]+/g) || []).length} lien(s) détecté(s)
                </span>

                <button
                  type="submit"
                  disabled={batchImporting || !batchUrlsText.trim()}
                  style={{
                    background: batchImporting ? '#94a3b8' : '#C75B00',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 10,
                    padding: '10px 20px',
                    fontSize: 13,
                    fontWeight: 900,
                    cursor: batchImporting ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    flex: '1 1 auto',
                  }}
                >
                  {batchImporting ? (
                    <>
                      <RefreshCw size={14} className="spin" />
                      <span>Traitement en cours…</span>
                    </>
                  ) : (
                    <>
                      <Layers size={14} />
                      <span>⚡ Importer le lot en 1 clic</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Mode 3 : Lien unique rapide */}
          {importMode === 'single' && (
            <form onSubmit={handleImportUrl} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 180px', minWidth: 0, position: 'relative' }}>
                  <Link2 size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="url"
                    placeholder="https://www.tiktok.com/@... ou instagram.com/reel/..."
                    value={importUrl}
                    onChange={e => setImportUrl(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 36px',
                      borderRadius: 10,
                      border: '1.5px solid #cbd5e1',
                      fontSize: 13,
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
                    padding: '10px 20px',
                    fontSize: 13,
                    fontWeight: 900,
                    cursor: importing ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    flex: '1 1 auto',
                  }}
                >
                  {importing ? (
                    <>
                      <RefreshCw size={14} className="spin" />
                      <span>Analyse…</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      <span>Importer & Associer</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Option partagée : Smart Matching */}
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#334155', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={autoMatch}
                onChange={e => setAutoMatch(e.target.checked)}
                style={{ accentColor: '#C75B00' }}
              />
              <span>Activer le <strong>Smart Matching</strong> automatique (+85% similarité nom/légende)</span>
            </label>
          </div>
        </div>
      )}

      {/* ── ONGLET 3 : PROFILS SOCIAUX CONNECTÉS ── */}
      {activeMainTab === 'accounts' && (
        <div className="social-shop-compact-card">
          <div style={{ marginBottom: 14 }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 900, color: '#0f172a' }}>
              ⚙️ Profils Sociaux Connectés
            </h3>
            <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
              Renseignez vos identifiants officiels pour aspirer vos publications en 1 clic et synchroniser votre catalogue.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
                  className={`social-account-row-compact ${acc ? 'connected' : ''}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                    <span style={{ fontSize: 22, flexShrink: 0 }}>{plat.icon}</span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, fontSize: 13.5, color: '#0f172a' }}>{plat.label}</span>
                        {acc ? (
                          <span style={{ fontSize: 10.5, background: '#16a34a', color: '#fff', padding: '1px 6px', borderRadius: 10, fontWeight: 800 }}>
                            🟢 Connecté
                          </span>
                        ) : (
                          <span style={{ fontSize: 10.5, background: '#e2e8f0', color: '#64748b', padding: '1px 6px', borderRadius: 10, fontWeight: 700 }}>
                            Non configuré
                          </span>
                        )}
                      </div>

                      {isEditing ? (
                        <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                          <input
                            type="text"
                            placeholder={plat.placeholder}
                            value={accountInput}
                            onChange={e => setAccountInput(e.target.value)}
                            style={{
                              padding: '6px 10px',
                              borderRadius: 8,
                              border: '1.5px solid #C75B00',
                              fontSize: 12.5,
                              outline: 'none',
                              flex: '1 1 180px',
                              minWidth: 0,
                            }}
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveAccount(plat.key)}
                            style={{
                              background: '#C75B00',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 8,
                              padding: '6px 12px',
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
                              padding: '6px 10px',
                              fontWeight: 700,
                              fontSize: 12,
                              cursor: 'pointer',
                            }}
                          >
                            Annuler
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          <span style={{ fontSize: 12.5, fontWeight: 700, color: acc ? '#15803d' : '#64748b' }}>
                            {acc ? `@${acc.nom_compte.replace(/^@/, '')}` : 'Aucun compte associé'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {!isEditing && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      {acc && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleToggleAutoSync(acc)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              background: acc.auto_sync ? '#dcfce7' : '#f1f5f9',
                              border: `1px solid ${acc.auto_sync ? '#86efac' : '#cbd5e1'}`,
                              borderRadius: 8,
                              padding: '5px 8px',
                              fontSize: 11,
                              fontWeight: 700,
                              color: acc.auto_sync ? '#15803d' : '#64748b',
                              cursor: 'pointer',
                            }}
                            title="Activer/Désactiver la synchronisation automatique en arrière-plan"
                          >
                            <span>{acc.auto_sync ? '🟢 Auto-Sync ON' : '⚪ Auto-Sync OFF'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSyncAccount(acc)}
                            disabled={syncingAccountId === acc.id}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              background: '#dcfce7',
                              color: '#15803d',
                              border: '1.5px solid #86efac',
                              borderRadius: 8,
                              padding: '5px 10px',
                              fontSize: 11.5,
                              fontWeight: 800,
                              cursor: syncingAccountId === acc.id ? 'not-allowed' : 'pointer',
                            }}
                          >
                            <RefreshCw size={11} className={syncingAccountId === acc.id ? 'spin' : ''} />
                            <span>{syncingAccountId === acc.id ? 'Recherche…' : '🔄 Sync & Choisir'}</span>
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => {
                          setEditingPlatform(plat.key)
                          setAccountInput(acc ? acc.nom_compte : '')
                        }}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: 8,
                          padding: '5px 10px',
                          fontSize: 11.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                          color: '#334155',
                        }}
                      >
                        {acc ? 'Modifier' : '+ Configurer'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

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
