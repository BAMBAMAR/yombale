'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Rocket, RefreshCw, CheckCircle2, XCircle } from 'lucide-react'
import {
  InitialData,
  MigrationTab,
  ShopifyResult,
  CsvResult,
  MagicResult,
  DettesResult,
  KitResult,
  MigrationTargetSelector,
  MigrationTabBar,
  MigrationShopifyTab,
  MigrationCsvTab,
  MigrationMagicUrlTab,
  MigrationDettesTab,
  MigrationKitTab,
} from './components'

export default function AdminMigrationClient({
  initialData,
  secret,
}: {
  initialData: InitialData | null
  secret: string
}) {
  const [data, setData] = useState<InitialData | null>(initialData)
  const [loading, setLoading] = useState(false)
  const [loadingBoutiques, setLoadingBoutiques] = useState(false)
  const [activeTab, setActiveTab] = useState<MigrationTab>('shopify')
  const [notification, setNotification] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // Champs partagés
  const [selectedBoutiqueId, setSelectedBoutiqueId] = useState<string>(initialData?.boutiques?.[0]?.id || '')
  const [selectedCategorieId, setSelectedCategorieId] = useState<string>('')
  const [margePct, setMargePct] = useState<number>(0)
  const [arrondi, setArrondi] = useState<number>(500)

  // Tab 1 : Shopify
  const [shopifyUrl, setShopifyUrl] = useState('')
  const [shopifyResult, setShopifyResult] = useState<ShopifyResult | null>(null)

  // Tab 2 : CSV
  const [csvText, setCsvText] = useState('')
  const [csvResult, setCsvResult] = useState<CsvResult | null>(null)

  // Tab 3 : Magic URL
  const [magicUrl, setMagicUrl] = useState('')
  const [magicResult, setMagicResult] = useState<MagicResult | null>(null)

  // Tab 4 : Dettes
  const [dettesText, setDettesText] = useState('')
  const [dettesResult, setDettesResult] = useState<DettesResult | null>(null)

  // Tab 5 : Kit Onboarding
  const [kitResult, setKitResult] = useState<KitResult | null>(null)
  const [copie, setCopie] = useState(false)

  const showToast = (type: 'ok' | 'err', text: string) => {
    setNotification({ type, text })
    setTimeout(() => setNotification(null), 4500)
  }

  const reloadData = useCallback(async () => {
    setLoadingBoutiques(true)
    try {
      const res = await fetch('/api/admin/migration/stats', {
        headers: { 'X-Admin-Secret': secret },
        cache: 'no-store',
      })
      if (res.ok) {
        const d = await res.json()
        setData(d)
        if (d.boutiques && d.boutiques.length > 0) {
          setSelectedBoutiqueId(prev => (prev && d.boutiques.some((b: any) => b.id === prev) ? prev : d.boutiques[0].id))
        }
      }
    } catch (e) {
      console.warn('[RELOAD_MIGRATION_ERR]', e)
    } finally {
      setLoadingBoutiques(false)
    }
  }, [secret])

  useEffect(() => {
    reloadData()
  }, [reloadData])

  // 1. Action Aspiration Shopify
  const handleShopifyMirror = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!shopifyUrl.trim() || !selectedBoutiqueId) {
      showToast('err', "Veuillez saisir l'URL du site Shopify et choisir la boutique cible.")
      return
    }
    setLoading(true)
    setShopifyResult(null)
    try {
      const res = await fetch('/api/admin/migration/shopify-mirror', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': secret },
        body: JSON.stringify({
          storeUrl: shopifyUrl.trim(),
          boutiqueId: selectedBoutiqueId,
          margePct,
          arrondi,
          categorieId: selectedCategorieId || null,
        }),
      })
      const result = await res.json()
      if (res.ok) {
        setShopifyResult(result)
        showToast('ok', `${result.ajoutes} produits importés avec succès depuis Shopify !`)
        reloadData()
      } else {
        showToast('err', result.error || "Erreur lors de l'aspiration Shopify.")
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur réseau.'
      showToast('err', msg)
    } finally {
      setLoading(false)
    }
  }

  // 2. Action Import CSV
  const handleCsvImport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!csvText.trim() || !selectedBoutiqueId) {
      showToast('err', 'Collez les données CSV ou choisissez un fichier.')
      return
    }
    setLoading(true)
    setCsvResult(null)
    try {
      const lines = csvText.trim().split('\n').map(l => l.trim()).filter(Boolean)
      if (lines.length < 2) {
        showToast('err', 'Le CSV doit contenir au moins un en-tête et une ligne de produit.')
        setLoading(false)
        return
      }

      const delimiter = lines[0].includes(';') ? ';' : ','
      const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase().replace(/^["']|["']$/g, ''))

      const items = []
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(delimiter).map(p => p.trim().replace(/^["']|["']$/g, ''))
        const obj: Record<string, string> = {}
        headers.forEach((h, idx) => {
          obj[h] = parts[idx] || ''
        })
        if (obj.nom || obj.title || obj.name || obj.titre) {
          items.push({
            nom: obj.nom || obj.title || obj.name || obj.titre,
            prix: parseFloat(obj.prix || obj.price || obj.prix_vente || '0') || 0,
            stock: parseInt(obj.stock || obj.qty || obj.quantite || '10', 10),
            description: obj.description || obj.desc || '',
            image: obj.image || obj.photo || obj.photos || '',
          })
        }
      }

      const res = await fetch('/api/admin/migration/csv-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': secret },
        body: JSON.stringify({
          boutiqueId: selectedBoutiqueId,
          categorieId: selectedCategorieId || null,
          items,
          margePct,
          arrondi,
        }),
      })
      const result = await res.json()
      if (res.ok) {
        setCsvResult(result)
        showToast('ok', `${result.ajoutes} produits importés par lot CSV !`)
        reloadData()
      } else {
        showToast('err', result.error || "Erreur lors de l'import CSV.")
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur d'analyse CSV."
      showToast('err', msg)
    } finally {
      setLoading(false)
    }
  }

  // 3. Action Baguette Magique URL
  const handleMagicUrl = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!magicUrl.trim() || !selectedBoutiqueId) {
      showToast('err', "Entrez l'URL du produit à aspirer.")
      return
    }
    setLoading(true)
    setMagicResult(null)
    try {
      const res = await fetch('/api/admin/migration/url-magic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': secret },
        body: JSON.stringify({
          url: magicUrl.trim(),
          boutiqueId: selectedBoutiqueId,
          categorieId: selectedCategorieId || null,
          margePct,
          arrondi,
        }),
      })
      const result = await res.json()
      if (res.ok) {
        setMagicResult(result)
        showToast('ok', `Produit "${result.produit?.nom}" extrait et importé avec succès !`)
        setMagicUrl('')
        reloadData()
      } else {
        showToast('err', result.error || "Impossible d'importer depuis ce lien.")
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur réseau.'
      showToast('err', msg)
    } finally {
      setLoading(false)
    }
  }

  // 4. Action Dettes & Clients
  const handleDettesImport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!dettesText.trim() || !selectedBoutiqueId) {
      showToast('err', 'Collez la liste des clients et créances.')
      return
    }
    setLoading(true)
    setDettesResult(null)
    try {
      const lines = dettesText.trim().split('\n').map(l => l.trim()).filter(Boolean)
      const clients = []

      for (const line of lines) {
        const parts = line.split(/[|;,]/).map(p => p.trim())
        if (parts.length >= 1 && parts[0]) {
          clients.push({
            nom: parts[0],
            telephone: parts[1] || '',
            solde_dette: parseFloat(parts[2] || '0') || 0,
            plafond_credit: parseFloat(parts[3] || '50000') || 50000,
          })
        }
      }

      const res = await fetch('/api/admin/migration/clients-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': secret },
        body: JSON.stringify({
          boutiqueId: selectedBoutiqueId,
          clients,
        }),
      })
      const result = await res.json()
      if (res.ok) {
        setDettesResult(result)
        showToast('ok', `${result.ajoutes} clients et dettes migrés vers la Caisse POS !`)
        setDettesText('')
      } else {
        showToast('err', result.error || 'Erreur lors de la migration des clients.')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur réseau.'
      showToast('err', msg)
    } finally {
      setLoading(false)
    }
  }

  // 5. Action Kit Vitrine & WhatsApp
  const handleGenerateKit = async () => {
    if (!selectedBoutiqueId) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/migration/welcome-kit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': secret },
        body: JSON.stringify({ boutiqueId: selectedBoutiqueId }),
      })
      const result = await res.json()
      if (res.ok) {
        setKitResult(result)
        showToast('ok', "Kit d'onboarding généré avec succès !")
      } else {
        showToast('err', result.error || 'Erreur de génération du kit.')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur réseau.'
      showToast('err', msg)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyWhatsApp = () => {
    if (!kitResult?.messageWhatsApp) return
    navigator.clipboard.writeText(kitResult.messageWhatsApp)
    setCopie(true)
    setTimeout(() => setCopie(false), 3000)
    showToast('ok', 'Message WhatsApp copié dans le presse-papier !')
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 60 }}>
      {/* Toast Notification */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 9999,
            padding: '12px 20px',
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 14,
            color: '#fff',
            backgroundColor: notification.type === 'ok' ? '#16a34a' : '#dc2626',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {notification.type === 'ok' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          {notification.text}
        </div>
      )}

      {/* En-tête Page */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 99,
              background: '#eff6ff',
              color: '#2563eb',
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 8,
            }}
          >
            <Rocket size={14} /> Hub Concierge Onboarding
          </div>
          <h1 className="admin-page-titre" style={{ margin: 0 }}>
            Centre de Migration &amp; Onboarding Marchand 360°
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
            Aspirez des catalogues Shopify en 1 clic, importez des fichiers CSV universels, convertissez les prix en FCFA et générez les kits d&apos;accueil.
          </p>
        </div>

        <button
          type="button"
          onClick={reloadData}
          disabled={loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            padding: '8px 16px',
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Actualiser les boutiques
        </button>
      </div>

      {/* Sélecteur Global de la Boutique Cible & Paramètres de Marge */}
      <MigrationTargetSelector
        boutiques={data?.boutiques}
        categories={data?.categories}
        loadingBoutiques={loadingBoutiques}
        selectedBoutiqueId={selectedBoutiqueId}
        onSelectBoutiqueId={id => {
          setSelectedBoutiqueId(id)
          setKitResult(null)
        }}
        selectedCategorieId={selectedCategorieId}
        onSelectCategorieId={setSelectedCategorieId}
        margePct={margePct}
        onMargePctChange={setMargePct}
        arrondi={arrondi}
        onArrondiChange={setArrondi}
      />

      {/* Barre d'Onglets */}
      <MigrationTabBar
        activeTab={activeTab}
        onSelectTab={tab => {
          setActiveTab(tab)
          if (tab === 'kit' && !kitResult) {
            handleGenerateKit()
          }
        }}
      />

      {/* Contenu des Onglets */}
      {activeTab === 'shopify' && (
        <MigrationShopifyTab
          shopifyUrl={shopifyUrl}
          onShopifyUrlChange={setShopifyUrl}
          onSubmit={handleShopifyMirror}
          loading={loading}
          shopifyResult={shopifyResult}
        />
      )}

      {activeTab === 'csv' && (
        <MigrationCsvTab
          csvText={csvText}
          onCsvTextChange={setCsvText}
          onSubmit={handleCsvImport}
          loading={loading}
          csvResult={csvResult}
        />
      )}

      {activeTab === 'magic' && (
        <MigrationMagicUrlTab
          magicUrl={magicUrl}
          onMagicUrlChange={setMagicUrl}
          onSubmit={handleMagicUrl}
          loading={loading}
          magicResult={magicResult}
        />
      )}

      {activeTab === 'dettes' && (
        <MigrationDettesTab
          dettesText={dettesText}
          onDettesTextChange={setDettesText}
          onSubmit={handleDettesImport}
          loading={loading}
          dettesResult={dettesResult}
        />
      )}

      {activeTab === 'kit' && (
        <MigrationKitTab
          kitResult={kitResult}
          onGenerateKit={handleGenerateKit}
          onCopyWhatsApp={handleCopyWhatsApp}
          copie={copie}
        />
      )}
    </div>
  )
}
