'use client'

import React, { useState } from 'react'
import ExternalImg from '@/components/ExternalImg'
import { fcfa } from '@/lib/format'
import { genererSVGCodeBarresEAN13 } from '../boutiqueHelpers'
import type { Boutique, Produit } from '../boutiqueTypes'
import {
  Package,
  Tag,
  Edit,
  MessageCircle,
  Copy,
  Printer,
  Megaphone,
  Trash2,
  CheckSquare,
  Square,
  X,
} from 'lucide-react'

interface CatalogueProductCardProps {
  produit: Produit
  boutique: Boutique
  isSelected: boolean
  onToggleSelect: (id: string) => void
  editingStockId: string | null
  stockInputVal: string
  onSetEditingStockId: (id: string | null) => void
  onSetStockInputVal: (val: string) => void
  onSaveStock: (id: string) => void
  onEdit: (p: Produit) => void
  onShare: (p: Produit) => void
  onDuplicate: (p: Produit) => void
  onDelete: (id: string) => void
  onPublishAd: (id: string) => void
  formatNumber: (n: number) => string
}

export default function CatalogueProductCard({
  produit: p,
  boutique,
  isSelected,
  onToggleSelect,
  editingStockId,
  stockInputVal,
  onSetEditingStockId,
  onSetStockInputVal,
  onSaveStock,
  onEdit,
  onShare,
  onDuplicate,
  onDelete,
  onPublishAd,
  formatNumber,
}: CatalogueProductCardProps) {
  const [menuActionsOuvert, setMenuActionsOuvert] = useState(false)

  const qty = p.quantite_stock ?? p.stock_quantite
  const inStock = qty != null ? qty > 0 : p.en_stock !== false

  const handlePrintBarcode = (e: React.MouseEvent) => {
    e.stopPropagation()
    setMenuActionsOuvert(false)
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
  }

  return (
    <div className={`saas-compact-product-card ${isSelected ? 'selected' : ''}`}>
      {/* Zone principale du produit */}
      <div className="saas-card-top">
        {/* Case à cocher */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onToggleSelect(p.id)
          }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0 2px',
            color: isSelected ? 'var(--accent, #C75B00)' : '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
          }}
          title="Sélectionner pour action par lot"
        >
          {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
        </button>

        {/* Miniature Image 50x50 */}
        <div
          style={{
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
          }}
        >
          {p.images?.[0] ? (
            <ExternalImg
              src={p.images[0]}
              alt={p.nom}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <Package size={20} style={{ color: '#94a3b8' }} />
          )}
        </div>

        {/* Contenu principal */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            <h4
              style={{
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
              }}
            >
              {p.nom}
            </h4>
            <span
              style={{
                fontSize: 14,
                color: 'var(--accent, #C75B00)',
                fontWeight: 900,
                whiteSpace: 'nowrap',
              }}
            >
              {p.prix ? fcfa(p.prix) : 'Sur demande'}
            </span>
          </div>

          {/* Badges statut & stock */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Stock pill */}
            {editingStockId === p.id ? (
              <div
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="number"
                  value={stockInputVal}
                  onChange={(e) => onSetStockInputVal(e.target.value)}
                  style={{
                    width: 55,
                    padding: '2px 6px',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    fontSize: 11,
                    height: 22,
                  }}
                  autoFocus
                />
                <button
                  onClick={() => onSaveStock(p.id)}
                  style={{
                    padding: '2px 8px',
                    background: '#16a34a',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    fontSize: 10,
                    cursor: 'pointer',
                    fontWeight: 700,
                  }}
                >
                  OK
                </button>
                <button
                  onClick={() => onSetEditingStockId(null)}
                  style={{
                    padding: '2px 8px',
                    background: '#9ca3af',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    fontSize: 10,
                    cursor: 'pointer',
                    fontWeight: 700,
                  }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <span
                onClick={(e) => {
                  e.stopPropagation()
                  onSetEditingStockId(p.id)
                  onSetStockInputVal(String(p.quantite_stock ?? p.stock_quantite ?? 0))
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
          onClick={() => onEdit(p)}
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
          onClick={() => onShare(p)}
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
              setMenuActionsOuvert(!menuActionsOuvert)
            }}
            className="saas-card-btn-more"
            title="Plus d'actions"
          >
            <span>⋯</span>
          </button>

          {menuActionsOuvert && (
            <>
              <div
                onClick={() => setMenuActionsOuvert(false)}
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
                <div
                  className="bq-dropdown-mobile-header"
                  style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: 12, marginBottom: 8 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: '#0f172a',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '85%',
                      }}
                    >
                      {p.nom}
                    </span>
                    <button
                      type="button"
                      onClick={() => setMenuActionsOuvert(false)}
                      style={{
                        background: '#f1f5f9',
                        border: 'none',
                        borderRadius: '50%',
                        width: 28,
                        height: 28,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#64748b',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  className="bq-actions-item"
                  onClick={handlePrintBarcode}
                  style={{ color: '#0284c7' }}
                >
                  <Printer size={15} />
                  <span>Imprimer code-barres</span>
                </button>

                <button
                  type="button"
                  className="bq-actions-item"
                  onClick={() => {
                    setMenuActionsOuvert(false)
                    onDuplicate(p)
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
                    setMenuActionsOuvert(false)
                    onPublishAd(p.id)
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
                    setMenuActionsOuvert(false)
                    onDelete(p.id)
                  }}
                  style={{ color: '#dc2626', fontWeight: 700 }}
                >
                  <Trash2 size={15} />
                  <span>Supprimer</span>
                </button>

                <button
                  type="button"
                  className="bq-dropdown-close-mobile"
                  onClick={() => setMenuActionsOuvert(false)}
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
}
