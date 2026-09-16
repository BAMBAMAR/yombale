'use client'

import { useState } from 'react'
import { DiscoveredPost, ImportMode, MainTab } from '../types'
import { authFetch } from '../utils'

interface UseSocialImportsProps {
  boutiqueId: string
  reloadData: () => Promise<void>
  setMessage: (msg: { type: 'success' | 'error' | 'info'; text: string } | null) => void
}

export function useSocialImports({
  boutiqueId,
  reloadData,
  setMessage,
}: UseSocialImportsProps) {
  const [importMode, setImportMode] = useState<ImportMode>('profile')
  const [autoMatch, setAutoMatch] = useState(true)

  // Mode 1 : Aspirateur de profil (@pseudo)
  const [profilePlatform, setProfilePlatform] = useState<'tiktok' | 'instagram' | 'facebook' | 'youtube'>('tiktok')
  const [profileUsername, setProfileUsername] = useState('')
  const [exploringProfile, setExploringProfile] = useState(false)
  const [discoveredPosts, setDiscoveredPosts] = useState<DiscoveredPost[]>([])
  const [selectedDiscoveredUrls, setSelectedDiscoveredUrls] = useState<Set<string>>(new Set())
  const [importingDiscovered, setImportingDiscovered] = useState(false)

  // Mode 2 : Import en lot (Multi-liens)
  const [batchUrlsText, setBatchUrlsText] = useState('')
  const [batchImporting, setBatchImporting] = useState(false)

  // Mode 3 : Lien unique rapide
  const [importUrl, setImportUrl] = useState('')
  const [importing, setImporting] = useState(false)

  // Mode 4 : Import direct médias (WhatsApp Status / Galerie)
  const [mediaUploading, setMediaUploading] = useState(false)

  // 1. Import d'une publication par URL
  async function handleImportUrl(e: React.FormEvent) {
    e.preventDefault()
    if (!importUrl.trim()) return

    try {
      setImporting(true)
      setMessage(null)
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const token = localStorage.getItem('nopalou_token') || ''

      const res = await authFetch(`${backendUrl}/api/boutiques/${boutiqueId}/social/admin/import-url`, {
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
        setMessage({ type: 'error', text: data.error || "Erreur lors de l'importation" })
        return
      }

      let successMsg = `Publication ${data.post.plateforme.toUpperCase()} importée avec succès !`
      if (data.auto_linked_product) {
        successMsg += ` Produit "${data.auto_linked_product.nom}" associé automatiquement.`
      } else if (data.suggestions && data.suggestions.length > 0) {
        successMsg += ` ${data.suggestions.length} suggestion(s) de produits détectée(s).`
      }

      setMessage({ type: 'success', text: successMsg })
      setImportUrl('')
      await reloadData()
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

      const res = await authFetch(`${backendUrl}/api/boutiques/${boutiqueId}/social/admin/explore-profile`, {
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
      if (!res.ok || data.success === false) {
        setMessage({ type: 'error', text: data.error || "Impossible d'explorer ce profil" })
        return
      }

      const found: DiscoveredPost[] = data.posts || []
      setDiscoveredPosts(found)

      const initialSelected = new Set<string>()
      found.forEach(p => {
        if (!p.is_already_imported && !p.isProfilePlaceholder) {
          initialSelected.add(p.url)
        }
      })
      setSelectedDiscoveredUrls(initialSelected)

      if (data.notice) {
        setMessage({
          type: 'info',
          text: data.notice,
        })
      } else {
        setMessage({
          type: 'success',
          text: `${found.length} publication(s) détectée(s) pour @${data.username} (${initialSelected.size} nouvelle(s)).`,
        })
      }
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

      const res = await authFetch(`${backendUrl}/api/boutiques/${boutiqueId}/social/admin/import-batch`, {
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
        setMessage({ type: 'error', text: data.error || "Erreur lors de l'importation groupée" })
        return
      }

      setMessage({
        type: 'success',
        text: `${data.imported_count} publication(s) importée(s) avec succès ! (${data.auto_linked_count || 0} produit(s) auto-associé(s)).`,
      })
      setDiscoveredPosts([])
      setSelectedDiscoveredUrls(new Set())
      await reloadData()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || "Erreur lors de l'importation" })
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

      const res = await authFetch(`${backendUrl}/api/boutiques/${boutiqueId}/social/admin/import-batch`, {
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
        setMessage({ type: 'error', text: data.error || "Erreur lors de l'importation du lot" })
        return
      }

      setMessage({
        type: 'success',
        text: `${data.imported_count} publication(s) importée(s) sur ${data.total_detected} lien(s) valide(s) ! (${data.auto_linked_count || 0} produit(s) auto-associé(s)).`,
      })
      setBatchUrlsText('')
      await reloadData()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erreur serveur' })
    } finally {
      setBatchImporting(false)
    }
  }

  // 4. Import direct médias & WhatsApp Status (avec OCR et Smart Matching)
  async function handleImportMedia(files: File[], caption = '') {
    if (!files || files.length === 0) return

    try {
      setMediaUploading(true)
      setMessage(null)
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const token = localStorage.getItem('nopalou_token') || ''

      const formData = new FormData()
      for (const file of files) {
        formData.append('files', file)
      }
      formData.append('caption', caption)
      formData.append('auto_link_best_match', String(autoMatch))

      const res = await authFetch(`${backendUrl}/api/boutiques/${boutiqueId}/social/admin/import-media`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setMessage({
          type: 'success',
          text: `Succès : ${data.imported_count} publication(s) WhatsApp / média importée(s) avec analyse OCR.`,
        })
        await reloadData()
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Erreur lors de l\'importation des médias.',
        })
      }
    } catch (err: any) {
      console.error(err)
      setMessage({ type: 'error', text: err.message || 'Erreur réseau lors de l\'importation.' })
    } finally {
      setMediaUploading(false)
    }
  }

  return {
    importMode,
    setImportMode,
    autoMatch,
    setAutoMatch,
    profilePlatform,
    setProfilePlatform,
    profileUsername,
    setProfileUsername,
    exploringProfile,
    setExploringProfile,
    discoveredPosts,
    setDiscoveredPosts,
    selectedDiscoveredUrls,
    setSelectedDiscoveredUrls,
    importingDiscovered,
    handleImportUrl,
    handleExploreProfile,
    handleImportDiscovered,
    handleImportBatch,
    handleImportMedia,
    mediaUploading,
    batchUrlsText,
    setBatchUrlsText,
    batchImporting,
    importUrl,
    setImportUrl,
    importing,
  }
}
