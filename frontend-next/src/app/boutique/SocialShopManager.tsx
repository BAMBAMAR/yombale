'use client'

import '@/styles/social-shop.css'
import React, { useState, useEffect } from 'react'
import {
  MainTab,
  ProduitCatalogue,
  SocialAccountAdmin,
  SocialAnalytics,
  SocialPostAdmin,
  SocialShopManagerProps,
  SocialStats,
} from './social-commerce/types'
import { authFetch } from './social-commerce/utils'
import { useSocialImports } from './social-commerce/hooks/useSocialImports'
import { useSocialPostsManagement } from './social-commerce/hooks/useSocialPostsManagement'
import { SocialHeaderCard } from './social-commerce/components/SocialHeaderCard'
import { SocialPostsView } from './social-commerce/components/SocialPostsView'
import { SocialImportView } from './social-commerce/components/SocialImportView'
import { SocialAccountsView } from './social-commerce/components/SocialAccountsView'
import { SocialAssociateProductModal } from './social-commerce/components/SocialAssociateProductModal'
import { SocialBatchActionsBar } from './social-commerce/components/SocialBatchActionsBar'
import { SocialBatchProductModal } from './social-commerce/components/SocialBatchProductModal'

export default function SocialShopManager({
  boutiqueId,
  boutiqueNom,
  boutiqueSlug,
}: SocialShopManagerProps) {
  const [, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('posts')

  const [posts, setPosts] = useState<SocialPostAdmin[]>([])
  const [accounts, setAccounts] = useState<SocialAccountAdmin[]>([])
  const [stats, setStats] = useState<SocialStats>({})
  const [analytics, setAnalytics] = useState<SocialAnalytics>({})
  const [catalogue, setCatalogue] = useState<ProduitCatalogue[]>([])

  const [syncingAccountId, setSyncingAccountId] = useState<string | null>(null)
  const [editingPlatform, setEditingPlatform] = useState<string | null>(null)
  const [accountInput, setAccountInput] = useState('')

  // Chargement des données d'administration
  async function loadAdminData() {
    try {
      setLoading(true)
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const token = localStorage.getItem('nopalou_token') || ''

      const [overviewRes, postsRes, prodsRes] = await Promise.all([
        authFetch(`${backendUrl}/api/boutiques/${boutiqueId}/social/admin/overview`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        authFetch(`${backendUrl}/api/boutiques/${boutiqueId}/social/admin/posts`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        authFetch(`${backendUrl}/api/boutiques/${boutiqueId}/produits`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      if (overviewRes.ok && (overviewRes.headers.get('content-type') || '').includes('application/json')) {
        const d = await overviewRes.json()
        setAccounts(d.comptes || [])
        setStats(d.stats || {})
        setAnalytics(d.analytics_30j || {})
      }

      if (postsRes.ok && (postsRes.headers.get('content-type') || '').includes('application/json')) {
        const d = await postsRes.json()
        setPosts(d.posts || [])
      }

      if (prodsRes.ok && (prodsRes.headers.get('content-type') || '').includes('application/json')) {
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

  // Hook d'importation
  const importsState = useSocialImports({
    boutiqueId,
    reloadData: loadAdminData,
    setMessage,
  })

  // Hook de gestion des publications
  const postsMgmt = useSocialPostsManagement({
    boutiqueId,
    posts,
    setPosts,
    reloadData: loadAdminData,
    setMessage,
  })

  // Synchronisation d'un compte officiel
  async function handleSyncAccount(acc: SocialAccountAdmin) {
    try {
      setSyncingAccountId(acc.id)
      setMessage(null)
      importsState.setImportMode('profile')
      setActiveMainTab('import')
      importsState.setProfilePlatform(acc.plateforme as any)
      importsState.setProfileUsername(acc.nom_compte)

      setTimeout(() => {
        document.getElementById('social-selection-section')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)

      importsState.setExploringProfile(true)
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const token = localStorage.getItem('nopalou_token') || ''

      const res = await authFetch(`${backendUrl}/api/boutiques/${boutiqueId}/social/admin/explore-profile`, {
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
      if (!res.ok || data.success === false) {
        setMessage({ type: 'error', text: data.error || "Impossible d'explorer ce profil" })
        return
      }

      const found = data.posts || []
      importsState.setDiscoveredPosts(found)

      const initialSelected = new Set<string>()
      found.forEach((p: any) => {
        if (!p.is_already_imported && !p.isProfilePlaceholder) {
          initialSelected.add(p.url)
        }
      })
      importsState.setSelectedDiscoveredUrls(initialSelected)

      if (data.notice) {
        setMessage({
          type: 'info',
          text: data.notice,
        })
      } else if (found.length > 0) {
        setMessage({
          type: 'success',
          text: `Synchronisation pour @${acc.nom_compte} : ${found.length} publication(s) trouvée(s). Cochez celles que vous souhaitez ajouter :`,
        })
      } else {
        setMessage({
          type: 'error',
          text: `Aucune publication trouvée automatiquement pour @${acc.nom_compte}. Vous pouvez coller les liens dans "Liens en lot".`,
        })
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erreur lors de la synchronisation' })
    } finally {
      setSyncingAccountId(null)
      importsState.setExploringProfile(false)
    }
  }

  // Activer/Désactiver l'Auto-Sync d'un compte
  async function handleToggleAutoSync(acc: SocialAccountAdmin) {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const token = localStorage.getItem('nopalou_token') || ''

      const res = await authFetch(`${backendUrl}/api/boutiques/${boutiqueId}/social/admin/accounts/${acc.id}/toggle-sync`, {
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

  // Enregistrement compte officiel
  async function handleSaveAccount(platform: string) {
    if (!accountInput.trim()) return

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const token = localStorage.getItem('nopalou_token') || ''

      const res = await authFetch(`${backendUrl}/api/boutiques/${boutiqueId}/social/admin/accounts`, {
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

  return (
    <div className="social-shop-manager-wrap" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SocialHeaderCard
        boutiqueId={boutiqueId}
        boutiqueSlug={boutiqueSlug}
        posts={posts}
        accounts={accounts}
        stats={stats}
        analytics={analytics}
        discoveredCount={importsState.discoveredPosts.length}
        activeMainTab={activeMainTab}
        setActiveMainTab={setActiveMainTab}
        setPostFilter={postsMgmt.setPostFilter}
        message={message}
        setMessage={setMessage}
      />

      {activeMainTab === 'posts' && (
        <SocialPostsView
          posts={posts}
          displayedPosts={postsMgmt.displayedPosts}
          postsWithoutProducts={postsMgmt.postsWithoutProducts}
          featuredPosts={postsMgmt.featuredPosts}
          hiddenPosts={postsMgmt.hiddenPosts}
          selectedPostIds={postsMgmt.selectedPostIds}
          postFilter={postsMgmt.postFilter}
          setPostFilter={postsMgmt.setPostFilter}
          rechercheTexte={postsMgmt.rechercheTexte}
          setRechercheTexte={postsMgmt.setRechercheTexte}
          filtrePlatform={postsMgmt.filtrePlatform}
          setFiltrePlatform={postsMgmt.setFiltrePlatform}
          triOption={postsMgmt.triOption}
          setTriOption={postsMgmt.setTriOption}
          onAddClick={() => setActiveMainTab('import')}
          toggleSelectPost={postsMgmt.toggleSelectPost}
          toggleSelectAllPosts={postsMgmt.toggleSelectAllPosts}
          handleToggleVisible={postsMgmt.handleToggleVisible}
          handleToggleFeatured={postsMgmt.handleToggleFeatured}
          handleDeletePost={postsMgmt.handleDeletePost}
          handleDissociateProduct={postsMgmt.handleDissociateProduct}
          setSelectedPostForProduct={postsMgmt.setSelectedPostForProduct}
        />
      )}

      {activeMainTab === 'import' && (
        <SocialImportView
          importMode={importsState.importMode}
          setImportMode={importsState.setImportMode}
          autoMatch={importsState.autoMatch}
          setAutoMatch={importsState.setAutoMatch}
          profilePlatform={importsState.profilePlatform}
          setProfilePlatform={importsState.setProfilePlatform}
          profileUsername={importsState.profileUsername}
          setProfileUsername={importsState.setProfileUsername}
          exploringProfile={importsState.exploringProfile}
          handleExploreProfile={importsState.handleExploreProfile}
          accounts={accounts}
          discoveredPosts={importsState.discoveredPosts}
          selectedDiscoveredUrls={importsState.selectedDiscoveredUrls}
          setSelectedDiscoveredUrls={importsState.setSelectedDiscoveredUrls}
          importingDiscovered={importsState.importingDiscovered}
          handleImportDiscovered={importsState.handleImportDiscovered}
          batchUrlsText={importsState.batchUrlsText}
          setBatchUrlsText={importsState.setBatchUrlsText}
          batchImporting={importsState.batchImporting}
          handleImportBatch={importsState.handleImportBatch}
          importUrl={importsState.importUrl}
          setImportUrl={importsState.setImportUrl}
          importing={importsState.importing}
          handleImportUrl={importsState.handleImportUrl}
        />
      )}

      {activeMainTab === 'accounts' && (
        <SocialAccountsView
          accounts={accounts}
          editingPlatform={editingPlatform}
          setEditingPlatform={setEditingPlatform}
          accountInput={accountInput}
          setAccountInput={setAccountInput}
          handleSaveAccount={handleSaveAccount}
          handleToggleAutoSync={handleToggleAutoSync}
          handleSyncAccount={handleSyncAccount}
          syncingAccountId={syncingAccountId}
        />
      )}

      {postsMgmt.selectedPostForProduct && (
        <SocialAssociateProductModal
          post={postsMgmt.selectedPostForProduct}
          onClose={() => postsMgmt.setSelectedPostForProduct(null)}
          catalogue={catalogue}
          onAssociateProduct={postsMgmt.handleAssociateProduct}
        />
      )}

      <SocialBatchActionsBar
        selectedCount={postsMgmt.selectedPostIds.size}
        batchLoading={postsMgmt.batchLoading}
        onOpenBatchProductModal={() => postsMgmt.setShowBatchProductModal(true)}
        onBatchToggleVisibility={postsMgmt.handleBatchToggleVisibility}
        onBatchToggleFeatured={postsMgmt.handleBatchToggleFeatured}
        onBatchDelete={postsMgmt.handleBatchDelete}
        onClearSelection={postsMgmt.clearSelection}
      />

      {postsMgmt.showBatchProductModal && (
        <SocialBatchProductModal
          selectedCount={postsMgmt.selectedPostIds.size}
          catalogue={catalogue}
          batchLoading={postsMgmt.batchLoading}
          onClose={() => postsMgmt.setShowBatchProductModal(false)}
          onBatchAssociate={postsMgmt.handleBatchAssociateProduct}
        />
      )}
    </div>
  )
}
