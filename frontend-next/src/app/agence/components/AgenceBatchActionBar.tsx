'use client'

import React from 'react'
import { CheckSquare, X, Loader2, type LucideIcon } from 'lucide-react'

export interface BatchActionItem {
  id: string
  label: string
  icon: LucideIcon | React.ReactNode
  onClick: () => void | Promise<void>
  variant?: 'primary' | 'secondary' | 'danger' | 'success'
  disabled?: boolean
  loading?: boolean
}

export type BatchAction = BatchActionItem

interface AgenceBatchActionBarProps {
  selectedCount: number
  totalCount?: number
  onClearSelection: () => void
  actions: BatchActionItem[]
  isExecuting?: boolean
  loading?: boolean
  labelSingulier?: string
  labelPluriel?: string
}

export function AgenceBatchActionBar({
  selectedCount,
  totalCount,
  onClearSelection,
  actions,
  isExecuting = false,
  loading = false,
  labelSingulier = 'élément sélectionné',
  labelPluriel = 'éléments sélectionnés',
}: AgenceBatchActionBarProps) {
  if (selectedCount <= 0) return null

  const isBusy = Boolean(isExecuting || loading)
  const libelleSelection = selectedCount === 1 ? labelSingulier : labelPluriel

  return (
    <div
      className="agence-batch-bar"
      role="toolbar"
      aria-label="Actions par lot"
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 90,
        width: 'calc(100% - 32px)',
        maxWidth: 900,
        background: 'var(--navy, #1C2B4A)',
        color: '#FFFFFF',
        borderRadius: 14,
        padding: '10px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        boxShadow: '0 10px 30px rgba(28, 43, 74, 0.25), 0 4px 12px rgba(0, 0, 0, 0.15)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        backdropFilter: 'blur(8px)',
        animation: 'slideUpBatch 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* ── Compteur de sélection ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: 7,
            background: 'var(--accent, #C75B00)',
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: 13,
          }}
        >
          {selectedCount}
        </div>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 700, lineHeight: 1.2 }}>
            {selectedCount} {libelleSelection}
          </div>
          {typeof totalCount === 'number' && (
            <div style={{ fontSize: 11.5, opacity: 0.75, marginTop: 1 }}>
              sur {totalCount} au total
            </div>
          )}
        </div>
      </div>

      {/* ── Boutons d'actions contextuelles ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        {actions.map((act) => {
          const isLoading = isBusy || act.loading

          // Variantes visuelles
          let bg = 'rgba(255, 255, 255, 0.12)'
          let textCol = '#FFFFFF'
          let borderCol = 'rgba(255, 255, 255, 0.2)'

          if (act.variant === 'primary') {
            bg = 'var(--accent, #C75B00)'
            textCol = '#FFFFFF'
            borderCol = 'transparent'
          } else if (act.variant === 'success') {
            bg = '#166534'
            textCol = '#FFFFFF'
            borderCol = 'transparent'
          } else if (act.variant === 'danger') {
            bg = '#991B1B'
            textCol = '#FFFFFF'
            borderCol = 'transparent'
          }

          const renderIcon = () => {
            if (React.isValidElement(act.icon)) return act.icon
            if (typeof act.icon === 'function') {
              const IconComp = act.icon as LucideIcon
              return <IconComp size={14} />
            }
            return null
          }

          return (
            <button
              key={act.id}
              type="button"
              onClick={act.onClick}
              disabled={act.disabled || isLoading}
              className="btn-batch-action"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 8,
                background: bg,
                color: textCol,
                border: `1px solid ${borderCol}`,
                fontSize: 12.5,
                fontWeight: 700,
                cursor: act.disabled || isLoading ? 'not-allowed' : 'pointer',
                opacity: act.disabled ? 0.5 : 1,
                transition: 'all 0.15s ease',
              }}
            >
              {isLoading ? (
                <Loader2 size={14} className="spin-animate" />
              ) : (
                renderIcon()
              )}
              <span>{act.label}</span>
            </button>
          )
        })}

        {/* ── Bouton Désélectionner ── */}
        <button
          type="button"
          onClick={onClearSelection}
          title="Annuler la sélection"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'rgba(255, 255, 255, 0.08)',
            color: '#FFFFFF',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            cursor: 'pointer',
            marginLeft: 4,
          }}
        >
          <X size={15} />
        </button>
      </div>
    </div>
  )
}

export default AgenceBatchActionBar
