'use client'

import React, { useState } from 'react'

export interface BatchActionConfig {
  key: string
  label: string
  icon?: string
  color: 'green' | 'amber' | 'red' | 'blue' | 'slate'
  confirmMsg?: string
  onClick: () => void | Promise<void>
}

interface BatchActionBarProps {
  selectedCount: number
  totalCount: number
  allSelected: boolean
  onToggleSelectAll: () => void
  onClearSelection: () => void
  actions: BatchActionConfig[]
  loading?: boolean
  itemLabel?: string
}

export default function BatchActionBar({
  selectedCount,
  totalCount,
  allSelected,
  onToggleSelectAll,
  onClearSelection,
  actions,
  loading = false,
  itemLabel = 'élément(s)'
}: BatchActionBarProps) {
  const [activeConfirmKey, setActiveConfirmKey] = useState<string | null>(null)
  const [executingKey, setExecutingKey] = useState<string | null>(null)

  if (selectedCount === 0 && totalCount === 0) return null

  const getButtonStyle = (color: BatchActionConfig['color']) => {
    switch (color) {
      case 'green':
        return { bg: '#10b981', hoverBg: '#059669', color: '#ffffff' }
      case 'amber':
        return { bg: '#f59e0b', hoverBg: '#d97706', color: '#ffffff' }
      case 'red':
        return { bg: '#ef4444', hoverBg: '#dc2626', color: '#ffffff' }
      case 'blue':
        return { bg: '#3b82f6', hoverBg: '#2563eb', color: '#ffffff' }
      case 'slate':
      default:
        return { bg: '#64748b', hoverBg: '#475569', color: '#ffffff' }
    }
  }

  const handleActionClick = async (act: BatchActionConfig) => {
    if (act.confirmMsg && activeConfirmKey !== act.key) {
      setActiveConfirmKey(act.key)
      return
    }
    setActiveConfirmKey(null)
    setExecutingKey(act.key)
    try {
      await act.onClick()
    } finally {
      setExecutingKey(null)
    }
  }

  return (
    <div style={{
      marginBottom: 16,
      background: selectedCount > 0 ? '#1e293b' : '#f8fafc',
      color: selectedCount > 0 ? '#f8fafc' : '#334155',
      border: `1px solid ${selectedCount > 0 ? '#334155' : '#e2e8f0'}`,
      borderRadius: 12,
      padding: '12px 18px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 12,
      boxShadow: selectedCount > 0 ? '0 10px 25px -5px rgba(15, 23, 42, 0.25)' : 'none',
      transition: 'all 0.2s ease-in-out',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Côté gauche : Sélecteur tout + Compteur */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none', fontWeight: 600, fontSize: 13 }}>
          <input
            type="checkbox"
            checked={allSelected}
            onChange={onToggleSelectAll}
            style={{ width: 18, height: 18, accentColor: '#3b82f6', cursor: 'pointer' }}
          />
          <span>{allSelected ? 'Tout désélectionner' : `Tout sélectionner (${totalCount})`}</span>
        </label>

        {selectedCount > 0 && (
          <span style={{
            background: '#3b82f6',
            color: '#ffffff',
            padding: '3px 10px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '0.02em'
          }}>
            {selectedCount} {itemLabel} sélectionné(s)
          </span>
        )}
      </div>

      {/* Côté droit : Actions en masse quand sélection non vide */}
      {selectedCount > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {actions.map((act) => {
            const isConfirming = activeConfirmKey === act.key
            const isExecuting = executingKey === act.key || loading
            const style = getButtonStyle(act.color)

            return (
              <div key={act.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <button
                  type="button"
                  disabled={isExecuting}
                  onClick={() => handleActionClick(act)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 14px',
                    borderRadius: 8,
                    border: 'none',
                    background: isConfirming ? '#b91c1c' : style.bg,
                    color: style.color,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: isExecuting ? 'not-allowed' : 'pointer',
                    opacity: isExecuting ? 0.6 : 1,
                    transition: 'all 0.15s ease',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  {isExecuting ? '⏳' : act.icon ? act.icon : null}
                  <span>{isConfirming ? `⚠️ Confirmer ${act.label} ?` : act.label}</span>
                </button>

                {isConfirming && (
                  <button
                    type="button"
                    onClick={() => setActiveConfirmKey(null)}
                    style={{
                      padding: '7px 10px',
                      borderRadius: 8,
                      border: '1px solid #475569',
                      background: '#334155',
                      color: '#94a3b8',
                      fontSize: 12,
                      cursor: 'pointer'
                    }}
                  >
                    Annuler
                  </button>
                )}
              </div>
            )
          })}

          <button
            type="button"
            onClick={onClearSelection}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              marginLeft: 4,
              textDecoration: 'underline'
            }}
          >
            Effacer
          </button>
        </div>
      )}
    </div>
  )
}
