'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Rocket, Zap, FileSpreadsheet, Wand2, Users, QrCode, Copy, CheckCircle2, XCircle,
  ArrowRight, Download, Upload, Store, Layers, Sparkles, RefreshCw, Printer, MessageCircle, ExternalLink, HelpCircle
} from 'lucide-react'
import { fcfa } from '@/lib/format'

interface Boutique {
  id: string
  nom: string
  slug: string
  telephone: string
  logo?: string | null
  plan?: string | null
  nb_produits: number
}

interface Categorie {
  id: string
  nom: string
  slug: string
  icone: string
}

interface InitialData {
  boutiques: Boutique[]
  categories: Categorie[]
  totalMigres: number
}

export default function AdminMigrationClient({
  initialData,
  secret,
}: {
  initialData: InitialData | null
  secret: string
}) {
  const [data, setData] = useState<InitialData | null>(initialData)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'shopify' | 'csv' | 'magic' | 'dettes' | 'kit'>('shopify')
  const [notification, setNotification] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // Champs partagés
  const [selectedBoutiqueId, setSelectedBoutiqueId] = useState<string>(initialData?.boutiques?.[0]?.id || '')
  const [selectedCategorieId, setSelectedCategorieId] = useState<string>('')
  const [margePct, setMargePct] = useState<number>(0)
  const [arrondi, setArrondi] = useState<number>(500)

  // Tab 1 : Shopify
  const [shopifyUrl, setShopifyUrl] = useState('')
  const [shopifyResult, setShopifyResult] = useState<any>(null)

  // Tab 2 : CSV
  const [csvText, setCsvText] = useState('')
  const [csvResult, setCsvResult] = useState<any>(null)

  // Tab 3 : Magic URL
  const [magicUrl, setMagicUrl] = useState('')
  const [magicResult, setMagicResult] = useState<any>(null)

  // Tab 4 : Dettes
  const [dettesText, setDettesText] = useState('')
  const [dettesResult, setDettesResult] = useState<any>(null)

  // Tab 5 : Kit Onboarding
  const [kitResult, setKitResult] = useState<any>(null)
  const [copie, setCopie] = useState(false)

  const showToast = (type: 'ok' | 'err', text: string) => {
    setNotification({ type, text })
    setTimeout(() => setNotification(null), 4500)
  }

  const [loadingBoutiques, setLoadingBoutiques] = useState(false)

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
      showToast('err', 'Veuillez saisir l\'URL du site Shopify et choisir la boutique cible.')
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
        showToast('ok', `🎉 ${result.ajoutes} produits importés avec succès depuis Shopify !`)
        reloadData()
      } else {
        showToast('err', result.error || 'Erreur lors de l\'aspiration Shopify.')
      }
    } catch (err: any) {
      showToast('err', err.message || 'Erreur réseau.')
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
      // Parser simple CSV (séparateurs virgule ou point-virgule)
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
        const obj: any = {}
        headers.forEach((h, idx) => {
          obj[h] = parts[idx] || ''
        })
        if (obj.nom || obj.title || obj.name || obj.titre) {
          items.push({
            nom: obj.nom || obj.title || obj.name || obj.titre,
            prix: parseFloat(obj.prix || obj.price || obj.prix_vente || 0) || 0,
            stock: parseInt(obj.stock || obj.qty || obj.quantite || 10, 10),
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
        showToast('ok', `✅ ${result.ajoutes} produits importés par lot CSV !`)
        reloadData()
      } else {
        showToast('err', result.error || 'Erreur lors de l\'import CSV.')
      }
    } catch (err: any) {
      showToast('err', err.message || 'Erreur d\'analyse CSV.')
    } finally {
      setLoading(false)
    }
  }

  // 3. Action Baguette Magique URL
  const handleMagicUrl = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!magicUrl.trim() || !selectedBoutiqueId) {
      showToast('err', 'Entrez l\'URL du produit à aspirer.')
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
        showToast('ok', `🪄 Produit "${result.produit?.nom}" extrait et importé avec succès !`)
        setMagicUrl('')
        reloadData()
      } else {
        showToast('err', result.error || 'Impossible d\'importer depuis ce lien.')
      }
    } catch (err: any) {
      showToast('err', err.message || 'Erreur réseau.')
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
        // format attendu : "Nom Client | 771234567 | 15000" ou "Nom, 771234567, 15000"
        const parts = line.split(/[|;,]/).map(p => p.trim())
        if (parts.length >= 1 && parts[0]) {
          clients.push({
            nom: parts[0],
            telephone: parts[1] || '',
            solde_dette: parseFloat(parts[2] || 0) || 0,
            plafond_credit: parseFloat(parts[3] || 50000) || 50000,
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
        showToast('ok', `👥 ${result.ajoutes} clients et dettes migrés vers la Caisse POS !`)
        setDettesText('')
      } else {
        showToast('err', result.error || 'Erreur lors de la migration des clients.')
      }
    } catch (err: any) {
      showToast('err', err.message || 'Erreur réseau.')
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
        showToast('ok', 'Kit d\'onboarding généré avec succès !')
      } else {
        showToast('err', result.error || 'Erreur de génération du kit.')
      }
    } catch (err: any) {
      showToast('err', err.message || 'Erreur réseau.')
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

  const selectedBoutique = data?.boutiques?.find(b => b.id === selectedBoutiqueId)

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
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 99, background: '#eff6ff', color: '#2563eb', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
            <Rocket size={14} /> Hub Concierge Onboarding
          </div>
          <h1 className="admin-page-titre" style={{ margin: 0 }}>
            🚀 Centre de Migration & Onboarding Marchand 360°
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
            Aspirez des catalogues Shopify en 1 clic, importez des fichiers CSV universels, convertissez les prix en FCFA et générez les kits d'accueil.
          </p>
        </div>

        <button
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
      <div
        style={{
          background: '#ffffff',
          borderRadius: 12,
          padding: '16px 20px',
          border: '1px solid #e2e8f0',
          marginBottom: 24,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
            🏪 1. Boutique Cible Nopalou
          </label>
          <select
            value={selectedBoutiqueId}
            onChange={e => {
              setSelectedBoutiqueId(e.target.value)
              setKitResult(null)
            }}
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              fontSize: 14,
              fontWeight: 600,
              background: '#f8fafc',
            }}
          >
            {loadingBoutiques && !data?.boutiques?.length && (
              <option value="">Chargement des boutiques...</option>
            )}
            {!loadingBoutiques && (!data?.boutiques || data.boutiques.length === 0) && (
              <option value="">Aucune boutique trouvée</option>
            )}
            {data?.boutiques?.map(b => (
              <option key={b.id} value={b.id}>
                {b.nom} ({b.nb_produits} produits) {b.telephone ? `— ${b.telephone}` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
            📁 2. Rayon / Catégorie par défaut
          </label>
          <select
            value={selectedCategorieId}
            onChange={e => setSelectedCategorieId(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              fontSize: 14,
              background: '#ffffff',
            }}
          >
            <option value="">-- Détection automatique / Sans catégorie --</option>
            {data?.categories?.map(c => (
              <option key={c.id} value={c.id}>
                {c.icone} {c.nom}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
            🏷️ 3. Majoration / Marge (%)
          </label>
          <input
            type="number"
            value={margePct}
            onChange={e => setMargePct(parseFloat(e.target.value) || 0)}
            placeholder="0% (prix d'origine)"
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              fontSize: 14,
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
            ✨ 4. Arrondi Psychologique (FCFA)
          </label>
          <select
            value={arrondi}
            onChange={e => setArrondi(parseInt(e.target.value, 10))}
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              fontSize: 14,
            }}
          >
            <option value={0}>Aucun (prix exact)</option>
            <option value={100}>100 FCFA (ex: 4 820 ➔ 4 900)</option>
            <option value={500}>500 FCFA (ex: 4 820 ➔ 5 000)</option>
            <option value={1000}>1 000 FCFA (ex: 14 300 ➔ 15 000)</option>
          </select>
        </div>
      </div>

      {/* Barre d'Onglets */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          borderBottom: '2px solid #e2e8f0',
          marginBottom: 24,
          overflowX: 'auto',
          paddingBottom: 4,
        }}
      >
        <button
          onClick={() => setActiveTab('shopify')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: '8px 8px 0 0',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
            border: 'none',
            background: activeTab === 'shopify' ? '#0284c7' : 'transparent',
            color: activeTab === 'shopify' ? '#ffffff' : '#64748b',
          }}
        >
          <Zap size={16} /> ⚡ Aspirateur Shopify (1-Clic)
        </button>

        <button
          onClick={() => setActiveTab('csv')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: '8px 8px 0 0',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
            border: 'none',
            background: activeTab === 'csv' ? '#0284c7' : 'transparent',
            color: activeTab === 'csv' ? '#ffffff' : '#64748b',
          }}
        >
          <FileSpreadsheet size={16} /> 📊 Import CSV / Excel Universel
        </button>

        <button
          onClick={() => setActiveTab('magic')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: '8px 8px 0 0',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
            border: 'none',
            background: activeTab === 'magic' ? '#0284c7' : 'transparent',
            color: activeTab === 'magic' ? '#ffffff' : '#64748b',
          }}
        >
          <Wand2 size={16} /> 🪄 Baguette Magique par Lien
        </button>

        <button
          onClick={() => setActiveTab('dettes')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: '8px 8px 0 0',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
            border: 'none',
            background: activeTab === 'dettes' ? '#0284c7' : 'transparent',
            color: activeTab === 'dettes' ? '#ffffff' : '#64748b',
          }}
        >
          <Users size={16} /> 👥 Carnet de Dettes & Clients POS
        </button>

        <button
          onClick={() => {
            setActiveTab('kit')
            if (!kitResult) handleGenerateKit()
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: '8px 8px 0 0',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
            border: 'none',
            background: activeTab === 'kit' ? '#0284c7' : 'transparent',
            color: activeTab === 'kit' ? '#ffffff' : '#64748b',
          }}
        >
          <QrCode size={16} /> 🖨️ Kit Vitrine & WhatsApp
        </button>
      </div>

      {/* CONTENU ONGLET 1 : SHOPIFY MIRRORING */}
      {activeTab === 'shopify' && (
        <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ padding: 8, borderRadius: 8, background: '#f0fdf4', color: '#16a34a' }}>
              <Zap size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, color: '#0f172a' }}>
                Aspiration Intégrale de Catalogue Shopify
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>
                Collez l'URL de n'importe quel site Shopify (ex: <code>maboutique.com</code> ou <code>maboutique.myshopify.com</code>). Nopalou extrait automatiquement jusqu'à 250 produits avec descriptions, photos HD et prix convertis en FCFA.
              </p>
            </div>
          </div>

          <form onSubmit={handleShopifyMirror}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
                Lien du Site Shopify :
              </label>
              <input
                type="text"
                value={shopifyUrl}
                onChange={e => setShopifyUrl(e.target.value)}
                placeholder="https://exempleshop.myshopify.com ou mondomaine.com"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: 15,
                  fontWeight: 500,
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !shopifyUrl.trim()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                padding: '12px 24px',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {loading ? <RefreshCw size={18} className="animate-spin" /> : <Rocket size={18} />}
              {loading ? 'Aspiration du catalogue en cours…' : 'Lancer l\'Aspiration Shopify ➔'}
            </button>
          </form>

          {shopifyResult && (
            <div style={{ marginTop: 24, padding: 16, borderRadius: 8, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#16a34a', fontWeight: 700, fontSize: 15 }}>
                <CheckCircle2 size={20} />
                Aspiration Réussie ! {shopifyResult.ajoutes} produits injectés dans la boutique.
              </div>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: '#15803d' }}>
                Source analysée : <code>{shopifyResult.source}</code> ({shopifyResult.totalDetectes} produits détectés)
              </p>
            </div>
          )}
        </div>
      )}

      {/* CONTENU ONGLET 2 : CSV UNIVERSAL */}
      {activeTab === 'csv' && (
        <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ padding: 8, borderRadius: 8, background: '#eff6ff', color: '#2563eb' }}>
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, color: '#0f172a' }}>
                Import Universel CSV / Excel
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>
                Compatible avec les exports Shopify, WooCommerce, PrestaShop ou votre tableur Excel (colonnes reconnues : <code>nom/title</code>, <code>prix/price</code>, <code>stock/qty</code>, <code>description</code>, <code>image/photo</code>).
              </p>
            </div>
          </div>

          <form onSubmit={handleCsvImport}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
                Collez les données CSV ou le contenu de votre tableur :
              </label>
              <textarea
                value={csvText}
                onChange={e => setCsvText(e.target.value)}
                placeholder={"nom;prix;stock;description;image\nSmartphone Galaxy S23;450000;5;Superbe état 128Go;https://image.url/1.jpg\nRobe Soie Dakar;25000;12;Taille unique;https://image.url/2.jpg"}
                rows={8}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: 13,
                  fontFamily: 'monospace',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !csvText.trim()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                padding: '12px 24px',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {loading ? <RefreshCw size={18} className="animate-spin" /> : <Upload size={18} />}
              {loading ? 'Importation en cours…' : 'Importer le Catalogue CSV ➔'}
            </button>
          </form>

          {csvResult && (
            <div style={{ marginTop: 24, padding: 16, borderRadius: 8, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#16a34a', fontWeight: 700, fontSize: 15 }}>
                <CheckCircle2 size={20} />
                {csvResult.ajoutes} / {csvResult.totalSoumis} produits ajoutés avec succès !
              </div>
            </div>
          )}
        </div>
      )}

      {/* CONTENU ONGLET 3 : BAGUETTE MAGIQUE URL */}
      {activeTab === 'magic' && (
        <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ padding: 8, borderRadius: 8, background: '#faf5ff', color: '#9333ea' }}>
              <Wand2 size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, color: '#0f172a' }}>
                Baguette Magique par Lien (AliExpress, Amazon, SHEIN, Jumia, CoinAfrique)
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>
                Extrait automatiquement les photos HD, traduit en français et convertit les devises en FCFA.
              </p>
            </div>
          </div>

          <form onSubmit={handleMagicUrl}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
                URL du Produit :
              </label>
              <input
                type="text"
                value={magicUrl}
                onChange={e => setMagicUrl(e.target.value)}
                placeholder="https://fr.aliexpress.com/item/... ou https://www.jumia.sn/..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: 15,
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !magicUrl.trim()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: '#9333ea',
                color: '#ffffff',
                border: 'none',
                padding: '12px 24px',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {loading ? <RefreshCw size={18} className="animate-spin" /> : <Sparkles size={18} />}
              {loading ? 'Extraction IA en cours…' : 'Extraire & Ajouter le Produit ➔'}
            </button>
          </form>

          {magicResult && (
            <div style={{ marginTop: 24, padding: 16, borderRadius: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', gap: 16 }}>
              {magicResult.scraped?.image && (
                <img
                  src={magicResult.scraped.image}
                  alt={magicResult.produit?.nom}
                  style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }}
                />
              )}
              <div>
                <div style={{ color: '#16a34a', fontWeight: 700, fontSize: 15 }}>
                  🎉 {magicResult.produit?.nom}
                </div>
                <div style={{ fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
                  Prix calculé : {fcfa(magicResult.produit?.prix)}
                </div>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
                  Enregistré dans la boutique cible.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CONTENU ONGLET 4 : DETTES & CLIENTS */}
      {activeTab === 'dettes' && (
        <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ padding: 8, borderRadius: 8, background: '#fef3c7', color: '#d97706' }}>
              <Users size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, color: '#0f172a' }}>
                Migration du Carnet de Dettes & Clients Fidèles (POS)
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>
                Permet au marchand physique de basculer son cahier de dettes vers sa caisse tactile Nopalou.
              </p>
            </div>
          </div>

          <form onSubmit={handleDettesImport}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
                Format : <code>Nom | Téléphone | Dette Actuelle FCFA | Plafond Crédit</code> (un par ligne)
              </label>
              <textarea
                value={dettesText}
                onChange={e => setDettesText(e.target.value)}
                placeholder={"Moussa Diop | 77 123 45 67 | 15000 | 50000\nFatou Ndiaye | 76 987 65 43 | 0 | 100000\nIbrahima Ba | 70 555 44 33 | 35000 | 50000"}
                rows={6}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: 13,
                  fontFamily: 'monospace',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !dettesText.trim()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: '#d97706',
                color: '#ffffff',
                border: 'none',
                padding: '12px 24px',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {loading ? <RefreshCw size={18} className="animate-spin" /> : <Users size={18} />}
              {loading ? 'Migration des créances…' : 'Migrer les Clients & Créances ➔'}
            </button>
          </form>

          {dettesResult && (
            <div style={{ marginTop: 24, padding: 16, borderRadius: 8, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#16a34a', fontWeight: 700, fontSize: 15 }}>
                <CheckCircle2 size={20} />
                {dettesResult.ajoutes} clients enregistrés dans la Caisse POS du marchand !
              </div>
            </div>
          )}
        </div>
      )}

      {/* CONTENU ONGLET 5 : KIT ONBOARDING WHATSAPP & QR CODE */}
      {activeTab === 'kit' && (
        <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ padding: 8, borderRadius: 8, background: '#f0fdf4', color: '#16a34a' }}>
              <QrCode size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, color: '#0f172a' }}>
                Kit Vitrine & Message d'Accueil Marchand
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>
                Générez le kit d'onboarding complet pour la boutique sélectionnée : QR code vitrine prêt à imprimer et message WhatsApp officiel d'accueil.
              </p>
            </div>
          </div>

          {kitResult ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
              {/* Carte Message WhatsApp */}
              <div style={{ background: '#f8fafc', padding: 20, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#15803d', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MessageCircle size={16} /> Message WhatsApp Prêt à Envoyer
                  </span>
                  <button
                    onClick={handleCopyWhatsApp}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '6px 12px',
                      borderRadius: 6,
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      fontWeight: 600,
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    {copie ? <CheckCircle2 size={14} color="#16a34a" /> : <Copy size={14} />}
                    {copie ? 'Copié !' : 'Copier'}
                  </button>
                </div>
                <textarea
                  readOnly
                  value={kitResult.messageWhatsApp}
                  rows={12}
                  style={{
                    width: '100%',
                    padding: 12,
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: 13,
                    background: '#ffffff',
                    color: '#1e293b',
                    lineHeight: 1.5,
                  }}
                />
              </div>

              {/* Carte Flyer & QR Code Vitrine */}
              <div style={{ background: '#f8fafc', padding: 20, borderRadius: 10, border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', display: 'block', marginBottom: 12 }}>
                  📱 Vitrine & QR Code Comptoir
                </span>

                <div style={{ background: '#ffffff', padding: 20, borderRadius: 12, border: '2px dashed #cbd5e1', display: 'inline-block', marginBottom: 16 }}>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(kitResult.storeUrl)}`}
                    alt="QR Code Boutique"
                    style={{ width: 160, height: 160, display: 'block', margin: '0 auto' }}
                  />
                  <div style={{ fontWeight: 800, fontSize: 16, marginTop: 8, color: '#0f172a' }}>
                    {kitResult.boutique?.nom}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    Scannez pour commander en ligne
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <a
                    href={kitResult.storeUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 16px',
                      borderRadius: 8,
                      background: '#0284c7',
                      color: '#ffffff',
                      textDecoration: 'none',
                      fontWeight: 600,
                      fontSize: 13,
                    }}
                  >
                    <ExternalLink size={14} /> Voir la Vitrine
                  </a>

                  <button
                    onClick={() => window.print()}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 16px',
                      borderRadius: 8,
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    <Printer size={14} /> Imprimer le Flyer
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 32 }}>
              <button
                onClick={handleGenerateKit}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: 8,
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <QrCode size={18} /> Générer le Kit d'Onboarding de cette boutique
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
