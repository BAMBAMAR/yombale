'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { ShoppingCart, X, Check, ArrowRight } from 'lucide-react'
import { cloudinaryHQ } from '@/lib/cloudinary'
import { fcfa } from '@/lib/format'
import { useCart } from '@/context/CartContext'
import { Produit } from './types'

interface BoutiqueQuickViewModalProps {
  quickViewProduct: Produit | null
  onClose: () => void
  boutiqueKey: string
  boutiqueNom: string
  whatsapp?: string | null
  couleurTheme: string
  contrastBtnText: string
  currentRadius: string
}

export default function BoutiqueQuickViewModal({
  quickViewProduct,
  onClose,
  boutiqueKey,
  boutiqueNom,
  whatsapp,
  couleurTheme,
  contrastBtnText,
  currentRadius,
}: BoutiqueQuickViewModalProps) {
  const { addToCart } = useCart()
  const [selection, setSelection] = useState<Record<string, string>>({})
  const [addedCart, setAddedCart] = useState(false)

  // Extraction sécurisée des variantes déclarées
  const variantesList = useMemo(() => {
    if (!quickViewProduct?.variantes) return []
    const raw = quickViewProduct.variantes
    let list: Array<{ nom: string; valeurs: string[]; typeId?: string }> = []
    if (Array.isArray(raw)) {
      list = raw
    } else if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) list = parsed
      } catch {
        list = []
      }
    }
    return list.filter(v => v && v.nom && Array.isArray(v.valeurs) && v.valeurs.length > 0)
  }, [quickViewProduct?.variantes])

  // Extraction sécurisée des SKUs de variantes
  const skusList = useMemo(() => {
    if (!quickViewProduct?.variantes_skus) return []
    const raw = quickViewProduct.variantes_skus
    if (Array.isArray(raw)) return raw
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) return parsed
      } catch {
        return []
      }
    }
    return []
  }, [quickViewProduct?.variantes_skus])

  // Pré-sélectionner automatiquement la 1ère option disponible de chaque variante à l'ouverture
  useEffect(() => {
    if (!quickViewProduct) {
      setSelection({})
      setAddedCart(false)
      return
    }

    const initial: Record<string, string> = {}
    for (const v of variantesList) {
      if (v.valeurs && v.valeurs.length > 0) {
        initial[v.nom] = v.valeurs[0]
      }
    }
    setSelection(initial)
    setAddedCart(false)
  }, [quickViewProduct, variantesList])

  // Verrouillage du scroll arrière-plan et écoute de la touche Échap
  useEffect(() => {
    if (!quickViewProduct) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [quickViewProduct, onClose])

  if (!quickViewProduct) return null

  const hasVariantes = variantesList.length > 0
  const selectionComplete = !hasVariantes || variantesList.every(v => Boolean(selection[v.nom]))

  // Résolution du SKU correspondant si des SKUs existent
  const matchingSku =
    selectionComplete && skusList.length > 0
      ? skusList.find(sku => {
          if (!sku || !sku.attributs) return false
          return Object.entries(selection).every(([k, v]) => sku.attributs[k] === v)
        }) || null
      : null

  const prixActuel = matchingSku?.prix ?? quickViewProduct.prix ?? 0
  const prixBarreActuel = matchingSku?.prix_barre ?? quickViewProduct.prix_barre ?? null
  const stockActuel =
    matchingSku?.stock_quantite !== undefined
      ? matchingSku.stock_quantite
      : (quickViewProduct.quantite_stock ?? quickViewProduct.stock_quantite)

  const isEnStock =
    stockActuel != null ? Number(stockActuel) > 0 : quickViewProduct.en_stock !== false
  const peutCommander = isEnStock && selectionComplete

  const detailsVarianteText =
    hasVariantes && selectionComplete
      ? Object.entries(selection)
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ')
      : null

  const activeImage = matchingSku?.image_url || quickViewProduct.images?.[0] || null

  const discountPercent =
    prixBarreActuel && prixActuel && prixBarreActuel > prixActuel
      ? Math.round(((prixBarreActuel - prixActuel) / prixBarreActuel) * 100)
      : null

  function handleAddToCart() {
    if (!quickViewProduct || !peutCommander) return

    addToCart(
      boutiqueKey,
      boutiqueNom,
      {
        id: quickViewProduct.id,
        nom: quickViewProduct.nom,
        prix: prixActuel,
        images: activeImage
          ? [activeImage, ...(quickViewProduct.images || []).filter(img => img !== activeImage)]
          : quickViewProduct.images,
        varianteId: matchingSku?.id || null,
        detailsVariante: detailsVarianteText,
        uniteVente: quickViewProduct.unite_vente,
      },
      whatsapp,
      true
    )

    setAddedCart(true)
    setTimeout(() => {
      setAddedCart(false)
      onClose()
    }, 1200)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-quickview-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1050,
        background: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        boxSizing: 'border-box',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          maxHeight: 'min(90vh, 700px)',
          display: 'flex',
          flexDirection: 'column',
          background: '#ffffff',
          borderRadius: currentRadius === '9999px' ? '20px' : currentRadius || '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0,0,0,0.06)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
          position: 'relative',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* En-tête Image */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 220,
            flexShrink: 0,
            background: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {activeImage ? (
            <img
              src={cloudinaryHQ(activeImage, { width: 800 })}
              alt={quickViewProduct.nom}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
              <ShoppingCart size={48} />
            </div>
          )}

          {/* Badge réduction */}
          {discountPercent !== null && discountPercent > 0 && (
            <div
              style={{
                position: 'absolute',
                top: 12,
                left: 12,
                background: '#0A5C36',
                color: '#ffffff',
                padding: '4px 9px',
                borderRadius: 6,
                fontWeight: 800,
                fontSize: 12,
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                letterSpacing: '-0.01em',
              }}
            >
              -{discountPercent}%
            </div>
          )}

          {/* Bouton fermeture */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              background: 'rgba(0, 0, 0, 0.55)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0, 0, 0, 0.75)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0, 0, 0, 0.55)')}
          >
            <X size={16} />
          </button>
        </div>

        {/* Corps défilable */}
        <div
          style={{
            padding: '18px 22px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <h3
            id="modal-quickview-title"
            style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#0f172a', lineHeight: 1.35 }}
          >
            {quickViewProduct.nom}
          </h3>

          {/* Prix et statut de stock */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 22, fontWeight: 900, color: couleurTheme, letterSpacing: '-0.02em' }}>
              {prixActuel ? fcfa(prixActuel) : 'Prix sur demande'}
            </span>
            {prixBarreActuel && (
              <span style={{ fontSize: 14, color: '#94a3b8', textDecoration: 'line-through', fontWeight: 500 }}>
                {fcfa(prixBarreActuel)}
              </span>
            )}
            <span
              style={{
                marginLeft: 'auto',
                fontSize: 11.5,
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 6,
                background: isEnStock ? '#f0fdf4' : '#fef2f2',
                color: isEnStock ? '#166534' : '#991b1b',
                border: isEnStock ? '1px solid #bbf7d0' : '1px solid #fecaca',
              }}
            >
              {isEnStock ? 'En stock' : 'Rupture de stock'}
            </span>
          </div>

          {/* Sélecteur d'options / variantes */}
          {hasVariantes && (
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: 14,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div
                style={{
                  fontSize: 11.5,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#64748b',
                }}
              >
                Choisir vos options
              </div>
              {variantesList.map(v => (
                <div key={v.nom}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      marginBottom: 6,
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>
                      {v.nom} : <strong style={{ color: '#0f172a' }}>{selection[v.nom] || '—'}</strong>
                    </span>
                    {!selection[v.nom] && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#dc2626' }}>
                        Sélection requise
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {v.valeurs.map(val => {
                      const isSelected = selection[v.nom] === val
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setSelection(prev => ({ ...prev, [v.nom]: val }))}
                          style={{
                            padding: '8px 14px',
                            fontSize: 13,
                            fontWeight: isSelected ? 800 : 600,
                            borderRadius: currentRadius === '9999px' ? '9999px' : '8px',
                            border: isSelected ? `2px solid ${couleurTheme}` : '1.5px solid #cbd5e1',
                            background: isSelected ? couleurTheme : '#ffffff',
                            color: isSelected ? contrastBtnText : '#1e293b',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            boxShadow: isSelected ? '0 2px 6px rgba(0,0,0,0.1)' : 'none',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {isSelected && <Check size={13} strokeWidth={3} />}
                          <span>{val}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Description */}
          {quickViewProduct.description && (
            <div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: 6,
                }}
              >
                Description
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: '#4b5563',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-line',
                }}
              >
                {quickViewProduct.description}
              </p>
            </div>
          )}
        </div>

        {/* Pied de page d'action fixe */}
        <div
          style={{
            padding: '14px 22px',
            borderTop: '1px solid #f1f5f9',
            background: '#ffffff',
            flexShrink: 0,
            display: 'flex',
            gap: 10,
          }}
        >
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!peutCommander || addedCart}
            style={{
              flex: 1,
              background: addedCart ? '#f0fdf4' : couleurTheme,
              color: addedCart ? '#166534' : contrastBtnText,
              border: addedCart ? '1px solid #bbf7d0' : 'none',
              borderRadius: currentRadius,
              height: 44,
              padding: '0 16px',
              fontWeight: 800,
              fontSize: 13.5,
              cursor: peutCommander ? 'pointer' : 'not-allowed',
              opacity: peutCommander ? 1 : 0.6,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.15s ease',
            }}
          >
            {addedCart ? (
              <>
                <Check size={16} strokeWidth={3} />
                <span>Ajouté au panier !</span>
              </>
            ) : !selectionComplete ? (
              <span>Choisir une option</span>
            ) : isEnStock ? (
              <>
                <ShoppingCart size={16} />
                <span>Ajouter au panier</span>
              </>
            ) : (
              <span>Rupture de stock</span>
            )}
          </button>

          <Link
            href={`/boutiques/${boutiqueKey}/produits/${quickViewProduct.id}`}
            style={{
              background: '#f1f5f9',
              color: '#1e3a5f',
              padding: '0 16px',
              height: 44,
              borderRadius: currentRadius,
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: 13,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              whiteSpace: 'nowrap',
              gap: 6,
            }}
          >
            <span>Fiche produit</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}

