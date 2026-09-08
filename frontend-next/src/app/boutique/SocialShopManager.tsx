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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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

                    {acc && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px dashed #bbf7d0', paddingTop: 8 }}>
                        <button
                          type="button"
                          onClick={() => handleToggleAutoSync(acc)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            background: 'transparent',
                            border: 'none',
                            fontSize: 11.5,
                            fontWeight: 700,
                            color: acc.auto_sync ? '#15803d' : '#94a3b8',
                            cursor: 'pointer',
                            padding: 0,
                          }}
                          title="Activer/Désactiver la synchronisation automatique en arrière-plan"
                        >
                          <span style={{ fontSize: 13 }}>{acc.auto_sync ? '🟢' : '⚪'}</span>
                          <span>{acc.auto_sync ? 'Auto-Sync Actif' : 'Auto-Sync Inactif'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSyncAccount(acc)}
                          disabled={syncingAccountId === acc.id}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            background: '#dcfce7',
                            color: '#15803d',
                            border: '1.5px solid #86efac',
                            borderRadius: 8,
                            padding: '4px 10px',
                            fontSize: 11.5,
                            fontWeight: 800,
                            cursor: syncingAccountId === acc.id ? 'not-allowed' : 'pointer',
                            boxShadow: '0 1px 3px rgba(21,128,61,0.1)',
                          }}
                          title="Découvrir les publications de ce compte et choisir lesquelles ajouter"
                        >
                          <RefreshCw size={11} className={syncingAccountId === acc.id ? 'spin' : ''} />
                          <span>{syncingAccountId === acc.id ? 'Recherche…' : '🔄 Synchroniser & Choisir'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── SECTION 2 : ACQUISITION DE PUBLICATIONS (3 MODES AU CHOIX) ── */}
      <div
        id="social-selection-section"
        style={{
          background: '#ffffff',
          borderRadius: 16,
          padding: '24px',
          border: '1px solid #e2e8f0',
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 900, color: '#0f172a' }}>
            2. Ajouter du contenu à votre Social Shop
          </h3>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
            Sélectionnez la méthode qui vous convient le mieux : aspiration par profil, import d&apos;une liste de liens ou ajout unitaire.
          </p>
        </div>

        {/* Barre de navigation des 3 Modes */}
        <div style={{
          display: 'flex',
          gap: 8,
          marginBottom: 20,
          borderBottom: '2px solid #f1f5f9',
          paddingBottom: 8,
          overflowX: 'auto',
        }}>
          <button
            type="button"
            onClick={() => setImportMode('profile')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              border: 'none',
              background: importMode === 'profile' ? '#C75B00' : '#f8fafc',
              color: importMode === 'profile' ? '#ffffff' : '#475569',
              boxShadow: importMode === 'profile' ? '0 2px 8px rgba(199,91,0,0.2)' : 'none',
            }}
          >
            <Sparkles size={15} />
            <span>🔍 Aspirateur par @pseudo (Zéro lien)</span>
          </button>

          <button
            type="button"
            onClick={() => setImportMode('batch')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              border: 'none',
              background: importMode === 'batch' ? '#C75B00' : '#f8fafc',
              color: importMode === 'batch' ? '#ffffff' : '#475569',
              boxShadow: importMode === 'batch' ? '0 2px 8px rgba(199,91,0,0.2)' : 'none',
            }}
          >
            <Layers size={15} />
            <span>📋 Coller plusieurs liens (En lot)</span>
          </button>

          <button
            type="button"
            onClick={() => setImportMode('single')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              border: 'none',
              background: importMode === 'single' ? '#C75B00' : '#f8fafc',
              color: importMode === 'single' ? '#ffffff' : '#475569',
              boxShadow: importMode === 'single' ? '0 2px 8px rgba(199,91,0,0.2)' : 'none',
            }}
          >
            <Link2 size={15} />
            <span>🔗 Lien unique rapide</span>
          </button>
        </div>

        {/* ── MODE 1 : ASPIRATEUR DE PROFIL PAR @PSEUDO ── */}
        {importMode === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#9a3412', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={18} style={{ flexShrink: 0 }} />
              <span>
                <strong>Zéro copier-coller :</strong> Renseignez votre identifiant public. Nopalou explore votre compte et affiche vos vidéos dans une grille prête à cocher.
              </span>
            </div>

            <form onSubmit={handleExploreProfile} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <select
                value={profilePlatform}
                onChange={e => setProfilePlatform(e.target.value as any)}
                style={{
                  padding: '11px 14px',
                  borderRadius: 10,
                  border: '1.5px solid #cbd5e1',
                  fontSize: 13.5,
                  fontWeight: 700,
                  background: '#ffffff',
                  outline: 'none',
                }}
              >
                <option value="tiktok">🎵 TikTok</option>
                <option value="instagram">📸 Instagram</option>
                <option value="facebook">📘 Facebook</option>
              </select>

              <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Ex: wax_dakar_chic ou @votre_boutique"
                  value={profileUsername}
                  onChange={e => setProfileUsername(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '11px 14px',
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
                disabled={exploringProfile || !profileUsername.trim()}
                style={{
                  background: exploringProfile ? '#94a3b8' : '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '11px 22px',
                  fontSize: 13.5,
                  fontWeight: 900,
                  cursor: exploringProfile ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {exploringProfile ? (
                  <>
                    <RefreshCw size={15} className="spin" />
                    <span>Exploration…</span>
                  </>
                ) : (
                  <>
                    <Search size={15} />
                    <span>Aspirer les publications</span>
                  </>
                )}
              </button>
            </form>

            {/* Raccourcis profils connectés */}
            {accounts.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: '#64748b' }}>Comptes de votre boutique :</span>
                {accounts.map(acc => (
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
                      padding: '3px 10px',
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#334155',
                      cursor: 'pointer',
                    }}
                  >
                    @{acc.nom_compte} ({acc.plateforme})
                  </button>
                ))}
              </div>
            )}

            {/* Grille des publications découvertes à cocher */}
            {discoveredPosts.length > 0 && (
              <div style={{ border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '16px', background: '#f8fafc' }}>
                {/* Bandeau d'aide et raccourci Multi-liens */}
                <div style={{
                  background: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: 10,
                  padding: '10px 14px',
                  marginBottom: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 10,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#0369a1' }}>
                    <Sparkles size={16} style={{ flexShrink: 0 }} />
                    <span>
                      <strong>Cochez les publications</strong> ci-dessous que vous voulez ajouter à votre boutique. Vous pouvez aussi coller directement les liens de vos vidéos TikTok/Instagram/Facebook :
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setImportMode('batch')}
                    style={{
                      background: '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '6px 12px',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    📋 Coller des liens de vidéos
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                      {discoveredPosts.length} publication(s) trouvée(s)
                    </span>
                    <span style={{ fontSize: 12, color: '#C75B00', background: '#fff7ed', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                      {selectedDiscoveredUrls.size} sélectionnée(s)
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => {
                        const all = new Set<string>()
                        discoveredPosts.forEach(p => all.add(p.url))
                        setSelectedDiscoveredUrls(all)
                      }}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: 6,
                        padding: '4px 10px',
                        fontSize: 12,
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
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: 6,
                        padding: '4px 10px',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Tout décocher
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, maxHeight: 380, overflowY: 'auto', paddingRight: 4 }}>
                  {discoveredPosts.map((post, idx) => {
                    const isSelected = selectedDiscoveredUrls.has(post.url)
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          const next = new Set(selectedDiscoveredUrls)
                          if (next.has(post.url)) {
                            next.delete(post.url)
                          } else {
                            next.add(post.url)
                          }
                          setSelectedDiscoveredUrls(next)
                        }}
                        style={{
                          background: '#ffffff',
                          borderRadius: 10,
                          border: isSelected ? '2px solid #C75B00' : '1px solid #e2e8f0',
                          padding: '10px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8,
                          position: 'relative',
                          boxShadow: isSelected ? '0 4px 12px rgba(199,91,0,0.15)' : 'none',
                        }}
                      >
                        <div style={{ position: 'relative', height: 120, borderRadius: 8, overflow: 'hidden', background: '#0f172a' }}>
                          {post.thumbnailUrl ? (
                            <ExternalImg
                              src={cloudinaryHQ(post.thumbnailUrl, { width: 300 })}
                              alt=""
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                              <Video size={32} />
                            </div>
                          )}
                          <div style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(0,0,0,0.7)', color: '#fff', borderRadius: 6, padding: '2px 6px', fontSize: 11, fontWeight: 800 }}>
                            {post.platform.toUpperCase()}
                          </div>
                          {post.is_already_imported && (
                            <div style={{ position: 'absolute', bottom: 6, left: 6, right: 6, background: '#16a34a', color: '#fff', textAlign: 'center', borderRadius: 4, padding: '2px', fontSize: 10, fontWeight: 800 }}>
                              Déjà dans la boutique
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            style={{ accentColor: '#C75B00', marginTop: 3 }}
                          />
                          <p style={{ margin: 0, fontSize: 12, color: '#334155', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.3 }}>
                            {post.caption || 'Sans légende'}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={handleImportDiscovered}
                    disabled={importingDiscovered || selectedDiscoveredUrls.size === 0}
                    style={{
                      background: importingDiscovered || selectedDiscoveredUrls.size === 0 ? '#94a3b8' : '#C75B00',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 10,
                      padding: '11px 24px',
                      fontSize: 13.5,
                      fontWeight: 900,
                      cursor: importingDiscovered || selectedDiscoveredUrls.size === 0 ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: '0 4px 14px rgba(199,91,0,0.25)',
                    }}
                  >
                    {importingDiscovered ? (
                      <>
                        <RefreshCw size={16} className="spin" />
                        <span>Importation du lot en cours…</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        <span>🚀 Importer les ({selectedDiscoveredUrls.size}) publications sélectionnées</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── MODE 2 : IMPORT EN LOT MULTI-LIENS ── */}
        {importMode === 'batch' && (
          <form onSubmit={handleImportBatch} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#334155' }}>
              Collez <strong>plusieurs liens à la fois</strong> (TikTok, Instagram, Facebook ou YouTube). Séparez chaque lien par un retour à la ligne.
            </div>

            <div style={{ position: 'relative' }}>
              <textarea
                rows={5}
                placeholder={`Collez vos liens ici (un par ligne) :\nhttps://www.tiktok.com/@boutique/video/123...\nhttps://www.instagram.com/reel/abc...\nhttps://www.facebook.com/watch/?v=456...`}
                value={batchUrlsText}
                onChange={e => setBatchUrlsText(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: '1.5px solid #cbd5e1',
                  fontSize: 13,
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'monospace',
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: (batchUrlsText.match(/https?:\/\/[^\s]+/g) || []).length > 0 ? '#C75B00' : '#64748b' }}>
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
                  padding: '11px 24px',
                  fontSize: 13.5,
                  fontWeight: 900,
                  cursor: batchImporting ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 4px 14px rgba(199,91,0,0.25)',
                }}
              >
                {batchImporting ? (
                  <>
                    <RefreshCw size={16} className="spin" />
                    <span>Traitement du lot en cours…</span>
                  </>
                ) : (
                  <>
                    <Layers size={16} />
                    <span>⚡ Importer tout le lot en 1 clic</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ── MODE 3 : LIEN UNIQUE RAPIDE ── */}
        {importMode === 'single' && (
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
          </form>
        )}

        {/* Option Partagée : Smart Matching */}
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#334155', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={autoMatch}
              onChange={e => setAutoMatch(e.target.checked)}
              style={{ accentColor: '#C75B00' }}
            />
            <span>Activer le <strong>Smart Matching</strong> automatique (associe automatiquement les produits correspondant au texte à +85%)</span>
          </label>
        </div>

        {/* Notification Toast */}
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
