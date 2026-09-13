'use client'

import React from 'react'
import { CheckSquare, ShoppingBag, Eye, EyeOff, Star, Trash2, X } from 'lucide-react'

interface SocialBatchActionsBarProps {
  selectedCount: number
  batchLoading: boolean
  onOpenBatchProductModal: () => void
  onBatchToggleVisibility: (visible: boolean) => Promise<void>
  onBatchToggleFeatured: (featured: boolean) => Promise<void>
  onBatchDelete: () => Promise<void>
  onClearSelection: () => void
}

export function SocialBatchActionsBar({
  selectedCount,
  batchLoading,
  onOpenBatchProductModal,
  onBatchToggleVisibility,
  onBatchToggleFeatured,
  onBatchDelete,
  onClearSelection,
}: SocialBatchActionsBarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="saas-floating-batch-bar">
      <span className="saas-batch-counter">
        <CheckSquare size={14} />
        <span>{selectedCount}</span>
      </span>

      <button
        type="button"
        onClick={onOpenBatchProductModal}
        disabled={batchLoading}
        className="saas-batch-btn saas-batch-btn-primary"
        title="Associer un produit du catalogue à toutes les publications sélectionnées"
      >
        <ShoppingBag size={13} />
        <span>Associer</span>
      </button>

      <button
        type="button"
        onClick={() => onBatchToggleVisibility(true)}
        disabled={batchLoading}
        className="saas-batch-btn saas-batch-btn-ghost"
        title="Rendre visible en boutique"
      >
        <Eye size={13} />
        <span>Afficher</span>
      </button>

      <button
        type="button"
        onClick={() => onBatchToggleVisibility(false)}
        disabled={batchLoading}
        className="saas-batch-btn saas-batch-btn-ghost"
        title="Masquer de la boutique"
      >
        <EyeOff size={13} />
        <span>Masquer</span>
      </button>

      <button
        type="button"
        onClick={() => onBatchToggleFeatured(true)}
        disabled={batchLoading}
        className="saas-batch-btn saas-batch-btn-ghost"
        title="Mettre en vedette"
      >
        <Star size={13} />
        <span>À la une</span>
      </button>

      <button
        type="button"
        onClick={onBatchDelete}
        disabled={batchLoading}
        className="saas-batch-btn saas-batch-btn-danger"
        title="Supprimer définitivement"
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
