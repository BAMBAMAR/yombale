'use client'

import React, { useState } from 'react'
import { PlatformFilter, PostFilter, SocialPostAdmin, TriOption } from '../types'
import { authFetch } from '../utils'

interface UseSocialPostsManagementProps {
  boutiqueId: string
  posts: SocialPostAdmin[]
  setPosts: React.Dispatch<React.SetStateAction<SocialPostAdmin[]>>
  reloadData: () => Promise<void>
  setMessage: (msg: { type: 'success' | 'error'; text: string } | null) => void
}

export function useSocialPostsManagement({
  boutiqueId,
  posts,
  setPosts,
  reloadData,
  setMessage,
}: UseSocialPostsManagementProps) {
  const [postFilter, setPostFilter] = useState<PostFilter>('all')
  const [rechercheTexte, setRechercheTexte] = useState('')
  const [triOption, setTriOption] = useState<TriOption>('date_desc')
  const [filtrePlatform, setFiltrePlatform] = useState<PlatformFilter>('all')

  const [selectedPostIds, setSelectedPostIds] = useState<Set<string>>(new Set())
  const [batchLoading, setBatchLoading] = useState(false)
  const [showBatchProductModal, setShowBatchProductModal] = useState(false)

  const [selectedPostForProduct, setSelectedPostForProduct] = useState<SocialPostAdmin | null>(null)

  // 1. Bascule visibilité (Afficher / Masquer)
  async function handleToggleVisible(post: SocialPostAdmin) {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const token = localStorage.getItem('nopalou_token') || ''

      const res = await authFetch(`${backendUrl}/api/boutiques/${boutiqueId}/social/admin/posts/${post.id}`, {
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

  // 2. Bascule mise à la une
  async function handleToggleFeatured(post: SocialPostAdmin) {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const token = localStorage.getItem('nopalou_token') || ''

      const res = await authFetch(`${backendUrl}/api/boutiques/${boutiqueId}/social/admin/posts/${post.id}`, {
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

  // 3. Suppression de publication
  async function handleDeletePost(postId: string) {
    if (!confirm('Supprimer définitivement cette publication de votre Social Shop ?')) return

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const token = localStorage.getItem('nopalou_token') || ''

      const res = await authFetch(`${backendUrl}/api/boutiques/${boutiqueId}/social/admin/posts/${postId}`, {
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

  // 3b. Mise à jour de la légende ou de la miniature
  async function handleUpdatePost(postId: string, data: { caption?: string; thumbnail_url?: string }) {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const token = localStorage.getItem('nopalou_token') || ''

      const res = await authFetch(`${backendUrl}/api/boutiques/${boutiqueId}/social/admin/posts/${postId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        setPosts(prev => prev.map(p => (p.id === postId ? { ...p, ...data } : p)))
        setMessage({ type: 'success', text: 'Publication mise à jour avec succès' })
      }
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: 'Erreur lors de la mise à jour' })
    }
  }

  // 4. Association produit
  async function handleAssociateProduct(productId: string) {
    if (!selectedPostForProduct) return

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const token = localStorage.getItem('nopalou_token') || ''

      const res = await authFetch(`${backendUrl}/api/boutiques/${boutiqueId}/social/admin/posts/${selectedPostForProduct.id}/produits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ produit_id: productId, confidence_score: 1.0 }),
      })

      if (res.ok) {
        await reloadData()
        setSelectedPostForProduct(null)
      }
    } catch (err) {
      console.error(err)
    }
  }

  // 4b. Association directe 1-clic (Smart Matching)
  async function handleDirectAssociateProduct(postId: string, productId: string, confidenceScore = 1.0) {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const token = localStorage.getItem('nopalou_token') || ''

      const res = await authFetch(`${backendUrl}/api/boutiques/${boutiqueId}/social/admin/posts/${postId}/produits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ produit_id: productId, confidence_score: confidenceScore }),
      })

      if (res.ok) {
        await reloadData()
      }
    } catch (err) {
      console.error(err)
    }
  }

  // 5. Dissociation produit
  async function handleDissociateProduct(postId: string, productId: string) {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const token = localStorage.getItem('nopalou_token') || ''

      const res = await authFetch(`${backendUrl}/api/boutiques/${boutiqueId}/social/admin/posts/${postId}/produits/${productId}`, {
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

  // 6. Gestion sélection
  const toggleSelectPost = (id: string) => {
    setSelectedPostIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAllPosts = () => {
    if (selectedPostIds.size === displayedPosts.length && displayedPosts.length > 0) {
      setSelectedPostIds(new Set())
    } else {
      setSelectedPostIds(new Set(displayedPosts.map(p => p.id)))
    }
  }

  const clearSelection = () => {
    setSelectedPostIds(new Set())
  }

  // 7. Actions par lot
  async function handleBatchToggleVisibility(visible: boolean) {
    if (selectedPostIds.size === 0) return
    try {
      setBatchLoading(true)
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const token = localStorage.getItem('nopalou_token') || ''
      const ids = Array.from(selectedPostIds)

      await Promise.all(
        ids.map(id =>
          authFetch(`${backendUrl}/api/boutiques/${boutiqueId}/social/admin/posts/${id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ visible }),
          })
        )
      )

      setPosts(prev => prev.map(p => selectedPostIds.has(p.id) ? { ...p, visible } : p))
      setMessage({
        type: 'success',
        text: `${ids.length} publication(s) ${visible ? 'affichée(s)' : 'masquée(s)'} avec succès.`,
      })
      clearSelection()
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: 'Erreur lors de la mise à jour par lot' })
    } finally {
      setBatchLoading(false)
    }
  }

  async function handleBatchToggleFeatured(is_featured: boolean) {
    if (selectedPostIds.size === 0) return
    try {
      setBatchLoading(true)
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const token = localStorage.getItem('nopalou_token') || ''
      const ids = Array.from(selectedPostIds)

      await Promise.all(
        ids.map(id =>
          authFetch(`${backendUrl}/api/boutiques/${boutiqueId}/social/admin/posts/${id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ is_featured }),
          })
        )
      )

      setPosts(prev => prev.map(p => selectedPostIds.has(p.id) ? { ...p, is_featured } : p))
      setMessage({
        type: 'success',
        text: `${ids.length} publication(s) ${is_featured ? 'mises à la une' : 'retirées de la une'}.`,
      })
      clearSelection()
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: 'Erreur lors de la mise à jour par lot' })
    } finally {
      setBatchLoading(false)
    }
  }

  async function handleBatchDelete() {
    if (selectedPostIds.size === 0) return
    if (!confirm(`Supprimer définitivement les ${selectedPostIds.size} publications sélectionnées ?`)) return

    try {
      setBatchLoading(true)
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const token = localStorage.getItem('nopalou_token') || ''
      const ids = Array.from(selectedPostIds)

      await Promise.all(
        ids.map(id =>
          authFetch(`${backendUrl}/api/boutiques/${boutiqueId}/social/admin/posts/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      )

      setPosts(prev => prev.filter(p => !selectedPostIds.has(p.id)))
      setMessage({
        type: 'success',
        text: `${ids.length} publication(s) supprimée(s).`,
      })
      clearSelection()
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: 'Erreur lors de la suppression par lot' })
    } finally {
      setBatchLoading(false)
    }
  }

  async function handleBatchAssociateProduct(productId: string) {
    if (selectedPostIds.size === 0) return
    try {
      setBatchLoading(true)
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const token = localStorage.getItem('nopalou_token') || ''
      const ids = Array.from(selectedPostIds)

      await Promise.all(
        ids.map(postId =>
          authFetch(`${backendUrl}/api/boutiques/${boutiqueId}/social/admin/posts/${postId}/produits`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ produit_id: productId, confidence_score: 1.0 }),
          })
        )
      )

      await reloadData()
      setMessage({
        type: 'success',
        text: `Produit associé avec succès aux ${ids.length} publications.`,
      })
      setShowBatchProductModal(false)
      clearSelection()
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: "Erreur lors de l'association par lot" })
    } finally {
      setBatchLoading(false)
    }
  }

  // Filtrage et Tri
  const postsWithoutProducts = posts.filter(p => !p.produits || p.produits.length === 0)
  const featuredPosts = posts.filter(p => p.is_featured)
  const hiddenPosts = posts.filter(p => !p.visible)

  const displayedPosts = posts
    .filter(post => {
      if (postFilter === 'unlinked' && post.produits && post.produits.length > 0) return false
      if (postFilter === 'featured' && !post.is_featured) return false
      if (postFilter === 'hidden' && post.visible) return false

      if (filtrePlatform !== 'all' && post.plateforme !== filtrePlatform) return false

      if (rechercheTexte.trim()) {
        const q = rechercheTexte.toLowerCase().trim()
        const matchCaption = post.caption?.toLowerCase().includes(q) || false
        const matchAuteur = post.auteur?.toLowerCase().includes(q) || false
        const matchPlateforme = post.plateforme?.toLowerCase().includes(q) || false
        const matchProduit = post.produits?.some(p => p.nom.toLowerCase().includes(q)) || false
        if (!matchCaption && !matchAuteur && !matchPlateforme && !matchProduit) return false
      }
      return true
    })
    .sort((a, b) => {
      if (triOption === 'date_desc') {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      }
      if (triOption === 'date_asc') {
        return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
      }
      if (triOption === 'unlinked_first') {
        const aUnlinked = !a.produits || a.produits.length === 0 ? 0 : 1
        const bUnlinked = !b.produits || b.produits.length === 0 ? 0 : 1
        return aUnlinked - bUnlinked
      }
      if (triOption === 'linked_first') {
        const aLinked = a.produits && a.produits.length > 0 ? 0 : 1
        const bLinked = b.produits && b.produits.length > 0 ? 0 : 1
        return aLinked - bLinked
      }
      if (triOption === 'featured_first') {
        return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0)
      }
      if (triOption === 'platform') {
        return a.plateforme.localeCompare(b.plateforme)
      }
      return 0
    })

  return {
    postFilter,
    setPostFilter,
    rechercheTexte,
    setRechercheTexte,
    triOption,
    setTriOption,
    filtrePlatform,
    setFiltrePlatform,
    selectedPostIds,
    batchLoading,
    showBatchProductModal,
    setShowBatchProductModal,
    selectedPostForProduct,
    setSelectedPostForProduct,
    toggleSelectPost,
    toggleSelectAllPosts,
    clearSelection,
    handleToggleVisible,
    handleToggleFeatured,
    handleDeletePost,
    handleUpdatePost,
    handleAssociateProduct,
    handleDirectAssociateProduct,
    handleDissociateProduct,
    handleBatchToggleVisibility,
    handleBatchToggleFeatured,
    handleBatchDelete,
    handleBatchAssociateProduct,
    postsWithoutProducts,
    featuredPosts,
    hiddenPosts,
    displayedPosts,
  }
}
