'use client'

import React from 'react'
import { CheckSquare, MessageCircle, Package, Copy, Trash2, X, Tag } from 'lucide-react'

interface CatalogueBatchBarProps {
  count: number
  batchLoading: boolean
  onShareWhatsApp: () => void
  onBatchStock: (enStock: boolean) => void
  onCopyList: () => void
  onBatchDelete: () => void
  onClearSelection: () => void
  onPrintLabels?: () => void
}

export default function CatalogueBatchBar({
  count,
  batchLoading,
  onShareWhatsApp,
  onBatchStock,
  onCopyList,
  onBatchDelete,
  onClearSelection,
  onPrintLabels,
}: CatalogueBatchBarProps) {
  if (count === 0) return null

  return (
    <div className="saas-floating-batch-bar">
      <span className="saas-batch-counter">
        <CheckSquare size={14} />
        <span>{count}</span>
      </span>

      <button
        type="button"
        onClick={onShareWhatsApp}
        disabled={batchLoading}
        className="saas-batch-btn saas-batch-btn-primary"
        title="Partager les produits sélectionnés sur WhatsApp"
      >
        <MessageCircle size={13} />
        <span>Partager</span>
      </button>

      {onPrintLabels && (
        <button
          type="button"
          onClick={onPrintLabels}
          disabled={batchLoading}
          className="saas-batch-btn saas-batch-btn-ghost"
          title="Imprimer les étiquettes codes-barres (A4 ou thermique)"
        >
          <Tag size={13} />
          <span>Étiquettes</span>
        </button>
      )}

      <button
        type="button"
        onClick={() => onBatchStock(true)}
        disabled={batchLoading}
        className="saas-batch-btn saas-batch-btn-ghost"
        title="Marquer comme disponible en stock"
      >
        <Package size={13} />
        <span>En stock</span>
      </button>

      <button
        type="button"
        onClick={() => onBatchStock(false)}
        disabled={batchLoading}
        className="saas-batch-btn saas-batch-btn-ghost"
        title="Marquer en rupture de stock"
      >
        <Package size={13} />
        <span>Rupture</span>
      </button>

      <button
        type="button"
        onClick={onCopyList}
        disabled={batchLoading}
        className="saas-batch-btn saas-batch-btn-ghost"
        title="Copier les liens et informations"
      >
        <Copy size={13} />
        <span>Copier</span>
      </button>

      <button
        type="button"
        onClick={onBatchDelete}
        disabled={batchLoading}
        className="saas-batch-btn saas-batch-btn-danger"
        title="Supprimer les produits sélectionnés"
      >
        <Trash2 size={13} />
        <span>Supprimer</span>
      </button>

      <button
        type="button"
        onClick={onClearSelection}
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
  )
}
