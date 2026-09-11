'use client'
import React, { useState, useEffect, useTransition, useRef, useCallback } from 'react'
import ExternalImg from '@/components/ExternalImg'
import {
  getBoutiqueProduits,
  deleteProduit,
  updateStock,
  duplicateProduit,
  publierProduitAnnonce,
  marquerProduitPartage
} from './actions'
import { fcfa } from '@/lib/format'
import { useTranslation } from '@/i18n/context'
import { sauvegarderProduitsLocaux, obtenirProduitsLocaux } from '@/lib/db-offline'
import { useOnlineStatus } from '@/lib/useOnlineStatus'
import { genererSVGCodeBarresEAN13 } from './boutiqueHelpers'
import type { Boutique, Produit, Variante } from './boutiqueTypes'
import ModalPartageProduit from '@/components/ModalPartageProduit'
import BatchImportModal from './BatchImportModal'
import ProduitForm from './ProduitForm'
import {
  Settings, Edit, Trash2, Tag, AlertTriangle, CheckCircle2,
  Copy, MessageCircle, CheckSquare, Square, Megaphone,
  ChevronDown, Menu, X, Package, Plus, Search, Printer
} from 'lucide-react'

function CatalogueProduits({ boutique, planActif, prixPro, filtreInitial, userId: userIdProp }: { boutique: Boutique; planActif: 'pro' | 'business' | 'decouverte' | 'taf_taf' | null; prixPro: number; filtreInitial?: 'jamais_partage'; userId?: string }) {
  const { t, isRtl, formatNumber, formatPrice } = useTranslation()
  const userId = userIdProp || 'anonymous'
  const [produits, setProduits] = useState<Produit[]>([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<'list' | { creating: 'rapide' | 'detaille' } | { editing: Produit }>('list')
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [rechercheTexte, setRechercheTexte] = useState('')
  const [filtreStatut, setFiltreStatut] = useState<'tous' | 'synchronise' | 'en_attente' | 'echec' | 'jamais_partage'>(filtreInitial ?? 'tous')
  const [filtreCategorie, setFiltreCategorie] = useState<string>('toutes')
  const [, startTransition] = useTransition()
  const [editingStockId, setEditingStockId] = useState<string | null>(null)
  const [stockInputVal, setStockInputVal] = useState<string>('')
  const [produitADupliquer, setProduitADupliquer] = useState<Produit | null>(null)
  const [dupNom, setDupNom] = useState<string>('')
  const [dupPrix, setDupPrix] = useState<string>('')
  const [dupStock, setDupStock] = useState<string>('')
  const [menuActionsOuvertId, setMenuActionsOuvertId] = useState<string | null>(null)
  const [partageModalData, setPartageModalData] = useState<{ produit: Produit; isNew?: boolean } | null>(null)
  const [selectedProdIds, setSelectedProdIds] = useState<Set<string>>(new Set())
  const [showMenuOptionsCatalogue, setShowMenuOptionsCatalogue] = useState(false)
  const [batchLoading, setBatchLoading] = useState(false)
  const [triOption, setTriOption] = useState<'recent' | 'ancien' | 'prix_asc' | 'prix_desc' | 'stock_rupture' | 'stock_dispo' | 'alpha'>('recent')
  const [filtreStock, setFiltreStock] = useState<'tous' | 'en_stock' | 'rupture'>('tous')

  async function handleBatchStock(enStock: boolean) {
    if (selectedProdIds.size === 0) return
    try {
      setBatchLoading(true)
      const ids = Array.from(selectedProdIds)
      const targetQty = enStock ? 10 : 0

      setProduits(prev => prev.map(p => {
        if (!selectedProdIds.has(p.id)) return p
        return {
          ...p,
          en_stock: enStock,
          stock_quantite: targetQty,
          quantite_stock: targetQty,
        }
      }))

      await Promise.all(
        ids.map(id => updateStock(boutique.id, id, targetQty))
      )

      setSuccessMsg(`${ids.length} produit(s) marqué(s) comme ${enStock ? 'en stock' : 'en rupture'}.`)
      setSelectedProdIds(new Set())
      loadProduits()
    } catch (err) {
      console.error(err)
      setDeleteError('Erreur lors de la mise à jour du stock par lot')
    } finally {
      setBatchLoading(false)
    }
  }

  async function handleBatchDelete() {
    if (selectedProdIds.size === 0) return
    if (!confirm(`Supprimer définitivement les ${selectedProdIds.size} produits sélectionnés ?`)) return
    try {
      setBatchLoading(true)
      setDeleteError(null)
      const ids = Array.from(selectedProdIds)

      await Promise.all(
        ids.map(id => deleteProduit(boutique.id, id))
      )

      setProduits(prev => prev.filter(p => !selectedProdIds.has(p.id)))
      setSuccessMsg(`${ids.length} produit(s) supprimé(s) avec succès.`)
      setSelectedProdIds(new Set())
      loadProduits()
    } catch (err) {
      console.error(err)
      setDeleteError('Erreur lors de la suppression par lot')
    } finally {
      setBatchLoading(false)
    }
  }

  function handleBatchShareWhatsApp() {
    const prods = produits.filter(p => selectedProdIds.has(p.id))
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'
    const contact = boutique.whatsapp || boutique.telephone || ''
    const msg = `🛍️ *Découvrez notre sélection chez ${boutique.nom} !*\n\n` +
      prods.map((p, i) => `${i + 1}. *${p.nom}* — ${p.prix ? fcfa(p.prix) : 'Prix sur demande'}\n👉 ${siteUrl}/boutiques/${boutique.slug || boutique.id}/produits/${p.id}`).join('\n\n') +
      `\n\n🚚 Livraison disponible à ${boutique.ville || 'Dakar'}\n${contact ? `💬 Commandez directement au ${contact} !` : ''}`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

  function handleBatchCopyList() {
    const prods = produits.filter(p => selectedProdIds.has(p.id))
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'
    const msg = `🛍️ *Sélection ${boutique.nom}* :\n\n` +
      prods.map((p, i) => `• ${p.nom} : ${p.prix ? fcfa(p.prix) : 'Prix sur demande'} (${siteUrl}/boutiques/${boutique.slug || boutique.id}/produits/${p.id})`).join('\n')
    navigator.clipboard.writeText(msg)
    setSuccessMsg('Liste des produits copiée dans le presse-papier !')
  }

  const toggleSelectAll = () => {
    if (selectedProdIds.size === produitsFiltres.length && produitsFiltres.length > 0) {
      setSelectedProdIds(new Set())
    } else {
      setSelectedProdIds(new Set(produitsFiltres.map(p => p.id)))
    }
  }

  async function saveStock(produitId: string) {
    const val = Number(stockInputVal)
    if (isNaN(val) || val < 0) return
    setProduits(prev => prev.map(item => item.id === produitId ? { ...item, stock_quantite: val, quantite_stock: val, en_stock: val > 0 } : item))
    startTransition(async () => {
      const res = await updateStock(boutique.id, produitId, val)
      if (res.error) {
        alert(res.error)
        loadProduits()
      } else {
        setEditingStockId(null)
        loadProduits()
      }
    })
  }

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || ''

  async function loadProduits() {
    setLoading(true)
    try {
      const prods = await getBoutiqueProduits(boutique.id)
      if (prods && Array.isArray(prods) && prods.length > 0) {
        setProduits(prods)
        if (typeof window !== 'undefined') {
          localStorage.setItem(`nopalou_pos_produits_${boutique.id}`, JSON.stringify(prods))
        }
        sauvegarderProduitsLocaux(prods, boutique.id, userId).catch(() => {})
      } else if (prods && Array.isArray(prods) && prods.length === 0 && typeof window !== 'undefined') {
        // Vérifier la connectivité réelle par un ping rapide
        const pingOk = await fetch('/api/ping', { cache: 'no-store', signal: AbortSignal.timeout(3000) }).then(r => r.ok).catch(() => false)
        if (pingOk) {
          // En ligne confirmé : la boutique est vraiment vide, vérifier le cache avant d'effacer
          const cachedExistants = await obtenirProduitsLocaux(boutique.id, userId).catch(() => [])
          if (!cachedExistants || cachedExistants.length === 0) {
            setProduits([])
          } else {
            setProduits(cachedExistants)
          }
        } else {
          // Hors-ligne : restaurer depuis le cache local
          const cached = await obtenirProduitsLocaux(boutique.id, userId).catch(() => [])
          if (cached && cached.length > 0) {
            setProduits(cached)
          } else {
            const localProds = typeof window !== 'undefined' ? localStorage.getItem(`nopalou_pos_produits_${boutique.id}`) : null
            if (localProds) {
              try {
                const parsed = JSON.parse(localProds)
                if (Array.isArray(parsed)) setProduits(parsed)
              } catch {}
            }
          }
        }
      } else {
        const cached = await obtenirProduitsLocaux(boutique.id, userId).catch(() => [])
        if (cached && cached.length > 0) {
          setProduits(cached)
        } else {
          const localProds = typeof window !== 'undefined' ? localStorage.getItem(`nopalou_pos_produits_${boutique.id}`) : null
          if (localProds) {
            try {
              const parsed = JSON.parse(localProds)
              if (Array.isArray(parsed) && parsed.length > 0) setProduits(parsed)
              else setProduits([])
            } catch {
              setProduits([])
            }
          } else {
            setProduits([])
          }
        }
      }
    } catch {
      const cached = await obtenirProduitsLocaux(boutique.id, userId).catch(() => [])
      if (cached && cached.length > 0) {
        setProduits(cached)
      } else {
        const localProds = typeof window !== 'undefined' ? localStorage.getItem(`nopalou_pos_produits_${boutique.id}`) : null
        if (localProds) {
          try {
            const parsed = JSON.parse(localProds)
            if (Array.isArray(parsed) && parsed.length > 0) setProduits(parsed)
            else setProduits([])
          } catch {
            setProduits([])
          }
        } else {
          setProduits([])
        }
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadProduits() }, [boutique.id])

  if (!planActif && !boutique.is_trial) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 20px', background: '#fffbeb', borderRadius: 12, border: '1px solid #fcd34d' }}>
        <span style={{ fontSize: 36, display: 'block', marginBottom: 12 }}>⭐</span>
        <p style={{ fontWeight: 700, marginBottom: 6 }}>Catalogue disponible en Boutique Pro</p>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
          Ajoutez vos produits avec photos et prix. Vos clients peuvent parcourir votre catalogue directement sur Nopalou.
        </p>
        <Link href="/boutique/abonnement" style={{
          display: 'inline-block', background: '#C75B00', color: '#fff',
          padding: '10px 24px', borderRadius: 10, textDecoration: 'none', fontWeight: 700,
        }}>
          Passer en Pro — {prixPro.toLocaleString('fr-FR')} FCFA/mois
        </Link>
      </div>
    )
  }

  const quota = (planActif === 'business' || boutique.is_trial) ? '∞' : '50'

  const categoriesDisponibles = Array.from(new Set(produits.map(p => p.categorie).filter(Boolean))) as string[]

  const produitsFiltres = produits
    .filter(p => {
      // 1. Recherche omni-champ (nom, description, categorie, code-barre, prix)
      if (rechercheTexte.trim()) {
        const q = rechercheTexte.toLowerCase().trim()
        const matchNom = p.nom?.toLowerCase().includes(q) || false
        const matchDesc = p.description?.toLowerCase().includes(q) || false
        const matchCat = p.categorie?.toLowerCase().includes(q) || false
        const matchCode = (p as any).code_barre ? String((p as any).code_barre).toLowerCase().includes(q) : false
        const matchPrix = p.prix ? String(p.prix).includes(q) : false
        if (!matchNom && !matchDesc && !matchCat && !matchCode && !matchPrix) return false
      }

      // 2. Filtre statut WhatsApp
      if (filtreStatut === 'jamais_partage') {
        if (p.partage_le) return false
      } else if (filtreStatut !== 'tous' && (p.whatsapp_sync_statut || 'en_attente') !== filtreStatut) {
        return false
      }

      // 3. Filtre catégorie
      if (filtreCategorie !== 'toutes' && p.categorie !== filtreCategorie) return false

      // 4. Filtre stock
      if (filtreStock === 'en_stock') {
        const qty = p.quantite_stock ?? p.stock_quantite
        if (qty != null ? qty <= 0 : p.en_stock === false) return false
      } else if (filtreStock === 'rupture') {
        const qty = p.quantite_stock ?? p.stock_quantite
        if (qty != null ? qty > 0 : p.en_stock !== false) return false
      }

      return true
    })
    .sort((a, b) => {
      if (triOption === 'recent') {
        return new Date((b as any).created_at || 0).getTime() - new Date((a as any).created_at || 0).getTime()
      }
      if (triOption === 'ancien') {
        return new Date((a as any).created_at || 0).getTime() - new Date((b as any).created_at || 0).getTime()
      }
      if (triOption === 'prix_asc') {
        return (a.prix || 0) - (b.prix || 0)
      }
      if (triOption === 'prix_desc') {
        return (b.prix || 0) - (a.prix || 0)
      }
      if (triOption === 'stock_rupture') {
        const aStock = (a.quantite_stock ?? a.stock_quantite ?? (a.en_stock !== false ? 1 : 0))
        const bStock = (b.quantite_stock ?? b.stock_quantite ?? (b.en_stock !== false ? 1 : 0))
        return aStock - bStock
      }
      if (triOption === 'stock_dispo') {
        const aStock = (a.quantite_stock ?? a.stock_quantite ?? (a.en_stock !== false ? 1 : 0))
        const bStock = (b.quantite_stock ?? b.stock_quantite ?? (b.en_stock !== false ? 1 : 0))
        return bStock - aStock
      }
      if (triOption === 'alpha') {
        return a.nom.localeCompare(b.nom)
      }
      return 0
    })

  if (typeof mode === 'object' && ('creating' in mode || 'editing' in mode)) {
    const editing = 'editing' in mode ? mode.editing : undefined
    return (
      <div style={{ maxWidth: 560 }}>
        <ProduitForm
          boutiqueId={boutique.id}
          boutiqueCat={boutique.categorie}
          produit={editing}
          modeInitial={'creating' in mode ? mode.creating : 'detaille'}
          onCancel={() => setMode('list')}
          onSuccess={(produitCree) => {
            setMode('list')
            setSuccessMsg(editing ? '✅ Produit modifié !' : '✅ Produit ajouté au catalogue !')
            loadProduits()
            if (!editing && produitCree) {
              setPartageModalData({ produit: produitCree, isNew: true })
            }
          }}
        />
      </div>
    )
  }

  return (
    <div>
      {showBatchModal && (
        <BatchImportModal
          boutiqueId={boutique.id}
          onClose={() => setShowBatchModal(false)}
          onSuccess={() => loadProduits()}
        />
      )}

      {produitADupliquer && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#ffffff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 440, border: '1px solid #e2e8f0', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <h2 style={{ margin: '0 0 6px', fontSize: 18, color: '#0f172a', fontWeight: 800 }}>📄 Dupliquer le produit</h2>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>Personnalisez le nouveau produit avant de le créer.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Nom du produit</label>
                <input
                  type="text"
                  value={dupNom}
                  onChange={e => setDupNom(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, color: '#0f172a', boxSizing: 'border-box' }}
                  placeholder="Ex: Sac de Ciment Sococim (Copie)"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Prix unitaire (FCFA)</label>
                  <input
                    type="number"
                    value={dupPrix}
                    onChange={e => setDupPrix(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, color: '#0f172a', boxSizing: 'border-box' }}
                    placeholder="Ex: 3500"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Stock initial</label>
                  <input
                    type="number"
                    value={dupStock}
                    onChange={e => setDupStock(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, color: '#0f172a', boxSizing: 'border-box' }}
                    placeholder="Ex: 10"
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setProduitADupliquer(null)}
                style={{ flex: 1, padding: '10px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  if (!dupNom.trim()) return alert('Le nom est requis')
                  startTransition(async () => {
                    const res = await duplicateProduit(boutique.id, produitADupliquer.id, {
                      nom: dupNom,
                      prix: dupPrix !== '' ? Number(dupPrix) : undefined,
                      stock_quantite: dupStock !== '' ? Number(dupStock) : undefined
                    })
                    if (res.error) alert(res.error)
                    else {
                      setSuccessMsg('Produit dupliqué avec succès !')
                      setProduitADupliquer(null)
                      loadProduits()
                    }
                  })
                }}
                style={{ flex: 1.5, padding: '10px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}
              >
                🚀 Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BARRE D'ACTIONS DU CATALOGUE UNIFIÉE ET COMPACTE (SAAS TOOLBAR) ── */}
      <div className="bq-toolbar-compact" style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Ligne 1 : Bouton principal dominant + Menu d'options compact [⋯ Plus ▾] */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <button
            type="button"
            onClick={() => setMode({ creating: 'rapide' })}
            className="btn-npl btn-npl-primary"
            style={{
              flex: 1,
              height: 36,
              padding: '0 14px',
              fontSize: 12.5,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              borderRadius: 8,
              boxShadow: '0 2px 6px rgba(199,91,0,0.2)',
              background: 'linear-gradient(135deg, var(--accent, #C75B00) 0%, #ea580c 100%)',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>Ajouter un produit</span>
          </button>

          {/* Menu déroulant compact pour les options secondaires */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => setShowMenuOptionsCatalogue(!showMenuOptionsCatalogue)}
              className="btn-npl btn-npl-secondary"
              style={{
                height: 36,
                padding: '0 10px',
                fontSize: 12,
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                borderRadius: 8,
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                color: 'var(--navy, #1C2B4A)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
              title="Plus d'actions (Import CSV, ajout détaillé)"
            >
              <span>⋯ Plus</span>
              <ChevronDown size={13} />
            </button>

            {showMenuOptionsCatalogue && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                  onClick={() => setShowMenuOptionsCatalogue(false)}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    right: 0,
                    zIndex: 50,
                    minWidth: 240,
                    background: '#ffffff',
                    border: '1px solid var(--border, #E8DDD2)',
                    borderRadius: 12,
                    boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
                    padding: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenuOptionsCatalogue(false)
                      setShowBatchModal(true)
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: 'none',
                      background: 'none',
                      color: 'var(--navy, #1C2B4A)',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                    }}
                  >
                    <Package size={16} style={{ color: 'var(--accent, #C75B00)' }} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span>Importer CSV / Excel</span>
                      <span style={{ fontSize: 11, color: '#64748B', fontWeight: 500 }}>Ajout par lot de produits</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowMenuOptionsCatalogue(false)
                      setMode({ creating: 'detaille' })
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: 'none',
                      background: 'none',
                      color: 'var(--navy, #1C2B4A)',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                    }}
                  >
                    <Settings size={16} style={{ color: 'var(--accent, #C75B00)' }} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span>Ajout détaillé & Variantes</span>
                      <span style={{ fontSize: 11, color: '#64748B', fontWeight: 500 }}>Tailles, couleurs, fiches complètes</span>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Ligne 2 : Omni-Recherche & Filtres intégrés SaaS responsive */}
        {produits.length > 0 && (
          <div className="saas-toolbar-container">
            {/* Pilules de filtres rapides (anti-troncature, harmonisé avec Réseau) */}
            <div className="saas-filter-pills" style={{ marginBottom: 6 }}>
              <button
                type="button"
                onClick={() => { setFiltreStock('tous'); setFiltreStatut('tous') }}
                className={`saas-filter-pill ${filtreStock === 'tous' && filtreStatut === 'tous' ? 'active' : ''}`}
              >
                Tous ({produits.length})
              </button>

              <button
                type="button"
                onClick={() => setFiltreStock(filtreStock === 'en_stock' ? 'tous' : 'en_stock')}
                className={`saas-filter-pill ${filtreStock === 'en_stock' ? 'active' : ''}`}
              >
                ✅ En stock ({produits.filter(p => { const q = p.quantite_stock ?? p.stock_quantite; return q != null ? q > 0 : p.en_stock !== false }).length})
              </button>

              <button
                type="button"
                onClick={() => setFiltreStock(filtreStock === 'rupture' ? 'tous' : 'rupture')}
                className={`saas-filter-pill ${filtreStock === 'rupture' ? 'warning-active' : ''}`}
                style={{
                  color: filtreStock !== 'rupture' && produits.some(p => { const q = p.quantite_stock ?? p.stock_quantite; return q != null ? q <= 0 : p.en_stock === false }) ? '#ea580c' : undefined,
                  borderColor: filtreStock !== 'rupture' && produits.some(p => { const q = p.quantite_stock ?? p.stock_quantite; return q != null ? q <= 0 : p.en_stock === false }) ? '#fed7aa' : undefined,
                  background: filtreStock !== 'rupture' && produits.some(p => { const q = p.quantite_stock ?? p.stock_quantite; return q != null ? q <= 0 : p.en_stock === false }) ? '#fff7ed' : undefined,
                }}
              >
                ⚠️ Ruptures ({produits.filter(p => { const q = p.quantite_stock ?? p.stock_quantite; return q != null ? q <= 0 : p.en_stock === false }).length})
              </button>

              <button
                type="button"
                onClick={() => setFiltreStatut(filtreStatut === 'synchronise' ? 'tous' : 'synchronise')}
                className={`saas-filter-pill ${filtreStatut === 'synchronise' ? 'active' : ''}`}
              >
                💬 WhatsApp ({produits.filter(p => p.whatsapp_sync_statut === 'synchronise').length})
              </button>
            </div>
            <div className="saas-search-wrap saas-toolbar-full">
              <Search size={14} className="saas-search-icon" />
              <input
                type="text"
                placeholder={`Rechercher parmi ${produits.length} produit${produits.length > 1 ? 's' : ''}…`}
                value={rechercheTexte}
                onChange={e => setRechercheTexte(e.target.value)}
                className="saas-search-input"
              />
              {rechercheTexte && (
                <button
                  type="button"
                  onClick={() => setRechercheTexte('')}
                  className="saas-search-clear"
                  title="Effacer la recherche"
                >
                  ×
                </button>
              )}
            </div>

            <div className="saas-toolbar-grid">
              {/* Tri multi-critères */}
              <select
                value={triOption}
                onChange={e => setTriOption(e.target.value as any)}
                className="saas-select-control"
                title="Trier les produits"
              >
                <option value="recent">🕒 Plus récents</option>
                <option value="ancien">⏳ Plus anciens</option>
                <option value="prix_asc">💰 Prix croissant</option>
                <option value="prix_desc">💎 Prix décroissant</option>
                <option value="stock_rupture">⚠️ Ruptures d&apos;abord</option>
                <option value="stock_dispo">📦 En stock d&apos;abord</option>
                <option value="alpha">🔤 Nom (A-Z)</option>
              </select>

              {/* Filtre Stock */}
              <select
                value={filtreStock}
                onChange={e => setFiltreStock(e.target.value as any)}
                className="saas-select-control"
                title="Filtrer par disponibilité stock"
              >
                <option value="tous">📦 Tous stocks</option>
                <option value="en_stock">✅ En stock</option>
                <option value="rupture">❌ Rupture</option>
              </select>

              {/* Statut WhatsApp */}
              <select
                value={filtreStatut}
                onChange={e => setFiltreStatut(e.target.value as typeof filtreStatut)}
                className="saas-select-control"
                title="Filtrer par statut WhatsApp"
              >
                <option value="tous">🌐 Statut: Tous</option>
                <option value="synchronise">💬 Sur WhatsApp</option>
                <option value="en_attente">⏳ En attente</option>
                <option value="echec">⚠️ Échec synchro</option>
                <option value="jamais_partage">🚫 Non partagés</option>
              </select>

              {/* Catégories */}
              {categoriesDisponibles.length > 1 && (
                <select
                  value={filtreCategorie}
                  onChange={e => setFiltreCategorie(e.target.value)}
                  className="saas-select-control"
                  title="Filtrer par catégorie"
                >
                  <option value="toutes">Catégories: Toutes</option>
                  {categoriesDisponibles.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              )}

              {/* Bouton Tout cocher */}
              {produitsFiltres.length > 0 && (
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className={`saas-toolbar-btn ${selectedProdIds.size > 0 ? 'selected' : ''}`}
                  title={selectedProdIds.size === produitsFiltres.length ? 'Tout désélectionner' : 'Tout cocher'}
                >
                  {selectedProdIds.size === produitsFiltres.length ? <CheckSquare size={13} /> : <Square size={13} />}
                  <span>{selectedProdIds.size === produitsFiltres.length ? 'Désélectionner' : 'Tout cocher'}</span>
                </button>
              )}
            </div>
          </div>
        )}

      </div>

      {successMsg && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', color: '#16a34a', fontSize: 13.5, marginBottom: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}
      {deleteError && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 13.5, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertTriangle size={16} />
          <span>{deleteError}</span>
        </div>
      )}

      {/* ── BARRE D'ACTIONS GROUPÉES PAR LOT FLOTTANTE (SAAS FLOATING BATCH BAR) ── */}
      {selectedProdIds.size > 0 && (
        <div className="saas-floating-batch-bar">
          <span className="saas-batch-counter">
            <CheckSquare size={14} />
            <span>{selectedProdIds.size}</span>
          </span>

          <button
            type="button"
            onClick={handleBatchShareWhatsApp}
            disabled={batchLoading}
            className="saas-batch-btn saas-batch-btn-primary"
            title="Partager les produits sélectionnés sur WhatsApp"
          >
            <MessageCircle size={13} />
            <span>Partager</span>
          </button>

          <button
            type="button"
            onClick={() => handleBatchStock(true)}
            disabled={batchLoading}
            className="saas-batch-btn saas-batch-btn-ghost"
            title="Marquer comme disponible en stock"
          >
            <Package size={13} />
            <span>En stock</span>
          </button>

          <button
            type="button"
            onClick={() => handleBatchStock(false)}
            disabled={batchLoading}
            className="saas-batch-btn saas-batch-btn-ghost"
            title="Marquer en rupture de stock"
          >
            <Package size={13} />
            <span>Rupture</span>
          </button>

          <button
            type="button"
            onClick={handleBatchCopyList}
            disabled={batchLoading}
            className="saas-batch-btn saas-batch-btn-ghost"
            title="Copier les liens et informations"
          >
            <Copy size={13} />
            <span>Copier</span>
          </button>

          <button
            type="button"
            onClick={handleBatchDelete}
            disabled={batchLoading}
            className="saas-batch-btn saas-batch-btn-danger"
            title="Supprimer les produits sélectionnés"
          >
            <Trash2 size={13} />
            <span>Supprimer</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedProdIds(new Set())}
            disabled={batchLoading}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
            }}
            title="Désélectionner tout"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {loading ? (
        <p style={{ color: '#9ca3af', fontSize: 14 }}>Chargement…</p>
      ) : produits.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 20px', background: '#f8fafc', borderRadius: 12, border: '1px dashed #d1d5db' }}>
          <span style={{ fontSize: 36, display: 'block', marginBottom: 12 }}>📦</span>
          <p style={{ color: '#6b7280', margin: '0 0 16px' }}>Aucun produit dans votre catalogue.</p>
          <button
            onClick={() => setMode({ creating: 'rapide' })}
            style={{ background: '#C75B00', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, cursor: 'pointer' }}
          >
            Ajouter mon premier produit
          </button>
        </div>
      ) : produitsFiltres.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 20px', background: '#f8fafc', borderRadius: 12, border: '1px dashed #d1d5db' }}>
          <p style={{ color: '#0f172a', fontWeight: 800, margin: '0 0 6px' }}>Aucun produit ne correspond à vos filtres</p>
          <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 14px' }}>Essayez de modifier votre recherche ou réinitialisez les critères.</p>
          <button
            type="button"
            onClick={() => {
              setRechercheTexte('')
              setFiltreStock('tous')
              setFiltreStatut('tous')
              setFiltreCategorie('toutes')
            }}
            style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {produitsFiltres.map(p => {
            const isSelected = selectedProdIds.has(p.id)
            const qty = p.quantite_stock ?? p.stock_quantite
            const inStock = qty != null ? qty > 0 : p.en_stock !== false
            return (
              <div
                key={p.id}
                className={`saas-compact-product-card ${isSelected ? 'selected' : ''}`}
              >
                {/* Zone supérieure / principale du produit */}
                <div className="saas-card-top">
                  {/* Case à cocher pour sélection groupée */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      const next = new Set(selectedProdIds)
                      if (next.has(p.id)) next.delete(p.id)
                      else next.add(p.id)
                      setSelectedProdIds(next)
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0 2px',
                      color: isSelected ? '#C75B00' : '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      flexShrink: 0,
                    }}
                    title="Sélectionner pour action par lot"
                  >
                    {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                  </button>

                  {/* Miniature Image 50x50 */}
                  <div style={{
                    width: 50,
                    height: 50,
                    borderRadius: 8,
                    overflow: 'hidden',
                    flexShrink: 0,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {p.images?.[0] ? (
                      <ExternalImg src={p.images[0]} alt={p.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Package size={20} style={{ color: '#94a3b8' }} />
                    )}
                  </div>

                  {/* Contenu principal */}
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                      <h4 style={{
                        margin: 0,
                        fontWeight: 800,
                        fontSize: 14,
                        color: '#0f172a',
                        lineHeight: 1.3,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        maxWidth: '100%',
                      }}>
                        {p.nom}
                      </h4>
                      <span style={{ fontSize: 14, color: '#C75B00', fontWeight: 900, whiteSpace: 'nowrap' }}>
                        {p.prix ? fcfa(p.prix) : 'Sur demande'}
                      </span>
                    </div>

                    {/* Badges statut & stock */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      {/* Stock pill */}
                      {editingStockId === p.id ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }} onClick={e => e.stopPropagation()}>
                          <input
                            type="number"
                            value={stockInputVal}
                            onChange={e => setStockInputVal(e.target.value)}
                            style={{ width: 55, padding: '2px 6px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 11, height: 22 }}
                            autoFocus
                          />
                          <button onClick={() => saveStock(p.id)} style={{ padding: '2px 8px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 4, fontSize: 10, cursor: 'pointer', fontWeight: 700 }}>OK</button>
                          <button onClick={() => setEditingStockId(null)} style={{ padding: '2px 8px', background: '#9ca3af', color: '#fff', border: 'none', borderRadius: 4, fontSize: 10, cursor: 'pointer', fontWeight: 700 }}>✕</button>
                        </div>
                      ) : (
                        <span
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingStockId(p.id)
                            setStockInputVal(String(p.quantite_stock ?? p.stock_quantite ?? 0))
                          }}
                          className={`saas-badge-pill ${inStock ? 'saas-badge-success' : 'saas-badge-danger'}`}
                          style={{ cursor: 'pointer' }}
                          title="Cliquer pour ajuster le stock"
                        >
                          <Package size={11} />
                          <span>{inStock ? `Stock: ${formatNumber(qty ?? 0)}` : 'Rupture'}</span>
                        </span>
                      )}

                      {/* Catégorie */}
                      {p.categorie && (
                        <span className="saas-badge-pill saas-badge-neutral">
                          <Tag size={10} />
                          <span>{p.categorie}</span>
                        </span>
                      )}

                      {/* Code-barres EAN */}
                      {(p as any).code_barre && (
                        <span className="saas-badge-pill saas-badge-info">
                          <span>EAN: {(p as any).code_barre}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions Droite / Footer Mobile */}
                <div className="saas-card-actions">
                  <button
                    type="button"
                    onClick={() => setMode({ editing: p })}
                    className="saas-card-btn-action"
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      color: '#334155',
                    }}
                    title="Modifier ce produit"
                  >
                    <Edit size={12} />
                    <span>Modifier</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPartageModalData({ produit: p, isNew: false })}
                    className="saas-card-btn-action"
                    style={{
                      background: '#25D366',
                      border: 'none',
                      color: '#ffffff',
                    }}
                    title="Partager ce produit sur WhatsApp ou réseaux sociaux"
                  >
                    <MessageCircle size={13} />
                    <span>Partager</span>
                  </button>

                  {/* Menu déroulant actions 3-points */}
                  <div style={{ position: 'relative' }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setMenuActionsOuvertId(menuActionsOuvertId === p.id ? null : p.id)
                      }}
                      className="saas-card-btn-more"
                      title="Plus d'actions"
                    >
                      <span>⋯</span>
                    </button>

                    {menuActionsOuvertId === p.id && (
                      <>
                        <div
                          onClick={() => setMenuActionsOuvertId(null)}
                          style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 9998,
                            background: 'rgba(15, 23, 42, 0.45)',
                            backdropFilter: 'blur(2px)',
                            WebkitBackdropFilter: 'blur(2px)',
                          }}
                        />
                        <div className="bq-actions-dropdown">
                          {/* En-tête mobile de l'Action Sheet */}
                          <div className="bq-dropdown-mobile-header" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: 12, marginBottom: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '85%' }}>
                                {p.nom}
                              </span>
                              <button
                                type="button"
                                onClick={() => setMenuActionsOuvertId(null)}
                                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', cursor: 'pointer', fontSize: 14 }}
                              >
                                ✕
                              </button>
                            </div>
                          </div>

                          <button
                            type="button"
                            className="bq-actions-item"
                            onClick={(e) => {
                              setMenuActionsOuvertId(null)
                              e.stopPropagation()
                              const ean = (p as any).code_barre || '2001234567891'
                              const svgBarcode = genererSVGCodeBarresEAN13(ean)
                              const printWin = window.open('', '_blank', 'width=480,height=400')
                              if (!printWin) return
                              printWin.document.write(`
                                <!DOCTYPE html>
                                <html>
                                <head>
                                  <title>Étiquette ${p.nom}</title>
                                  <style>
                                    @page { size: 50mm 30mm; margin: 0; }
                                    body {
                                      font-family: Arial, sans-serif; margin: 0; padding: 4px 6px;
                                      text-align: center; width: 50mm; height: 30mm; box-sizing: border-box;
                                      display: flex; flex-direction: column; justify-content: center; align-items: center;
                                    }
                                    .title { font-size: 11px; font-weight: 800; color: #000; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 46mm; margin-bottom: 2px; }
                                    .price { font-size: 13px; font-weight: 900; color: #000; margin-bottom: 4px; }
                                    .barcode-num { font-family: monospace; font-size: 12px; font-weight: bold; letter-spacing: 2px; margin-top: 2px; }
                                    svg { display: block; margin: 0 auto; max-width: 44mm; height: auto; }
                                  </style>
                                </head>
                                <body>
                                  <div class="title">${p.nom}</div>
                                  <div class="price">${p.prix ? `${new Intl.NumberFormat('fr-FR').format(p.prix)} FCFA` : ''}</div>
                                  <div class="barcode-svg">${svgBarcode}</div>
                                  <div class="barcode-num">${ean}</div>
                                  <script>window.onload = () => { window.print(); window.close(); }</script>
                                </body>
                                </html>
                              `)
                              printWin.document.close()
                            }}
                            style={{ color: '#0284c7' }}
                          >
                            <Printer size={15} />
                            <span>Imprimer code-barres</span>
                          </button>

                          <button
                            type="button"
                            className="bq-actions-item"
                            onClick={() => {
                              setMenuActionsOuvertId(null)
                              setProduitADupliquer(p)
                              setDupNom(`${p.nom} (Copie)`)
                              setDupPrix(p.prix?.toString() || '')
                              setDupStock(p.stock_quantite?.toString() || '')
                            }}
                            style={{ color: '#334155' }}
                          >
                            <Copy size={15} />
                            <span>Dupliquer</span>
                          </button>

                          <button
                            type="button"
                            className="bq-actions-item"
                            onClick={() => {
                              setMenuActionsOuvertId(null)
                              if (!confirm('Publier ce produit comme annonce classifiée ?')) return
                              startTransition(async () => {
                                const res = await publierProduitAnnonce(boutique.id, p.id)
                                if (res.error) alert(res.error)
                                else if (res.besoin_paiement) alert(res.message)
                                else { setSuccessMsg(res.message || 'Publié avec succès en annonce !') }
                              })
                            }}
                            style={{ color: '#b45309' }}
                          >
                            <Megaphone size={15} />
                            <span>Publier en annonce</span>
                          </button>

                          <div style={{ height: 1, background: '#f1f5f9', margin: '4px 0' }} />

                          <button
                            type="button"
                            className="bq-actions-item"
                            onClick={() => {
                              setMenuActionsOuvertId(null)
                              if (!confirm('Supprimer ce produit ?')) return
                              setDeleteError(null)
                              startTransition(async () => {
                                const res = await deleteProduit(boutique.id, p.id)
                                if (res.error) setDeleteError(res.error)
                                else { setSuccessMsg('Produit supprimé.'); loadProduits() }
                              })
                            }}
                            style={{ color: '#dc2626', fontWeight: 700 }}
                          >
                            <Trash2 size={15} />
                            <span>Supprimer</span>
                          </button>

                          <button
                            type="button"
                            className="bq-dropdown-close-mobile"
                            onClick={() => setMenuActionsOuvertId(null)}
                            style={{
                              marginTop: 8,
                              height: 42,
                              borderRadius: 10,
                              background: '#f1f5f9',
                              border: 'none',
                              color: '#64748b',
                              fontSize: 14,
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Fermer
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── MODALE DE PARTAGE PRODUIT 1-CLIC (100% MARQUE BLANCHE) ── */}
      {partageModalData && (
        <ModalPartageProduit
          isOpen={!!partageModalData}
          onClose={() => setPartageModalData(null)}
          produit={partageModalData.produit}
          boutique={boutique}
          isNewlyCreated={partageModalData.isNew}
        />
      )}
    </div>

  )
}

export default CatalogueProduits
export { CatalogueProduits }
