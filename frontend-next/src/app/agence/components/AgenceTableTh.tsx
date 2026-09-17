'use client'

import React from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

interface AgenceTableThProps {
  label: string
  sortKey?: string
  field?: string
  currentSort?: string
  currentSortField?: string
  sortDirection?: 'asc' | 'desc'
  sortOrder?: 'asc' | 'desc'
  onSort?: (key: string) => void
  align?: 'left' | 'center' | 'right'
  style?: React.CSSProperties
  className?: string
  children?: React.ReactNode
}

export function AgenceTableTh({
  label,
  sortKey,
  field,
  currentSort,
  currentSortField,
  sortDirection,
  sortOrder,
  onSort,
  align = 'left',
  style = {},
  className = '',
  children,
}: AgenceTableThProps) {
  const activeSortKey = sortKey ?? field
  const activeCurrentSort = currentSort ?? currentSortField
  const activeSortDir = sortDirection ?? sortOrder ?? 'desc'
  const isSortable = Boolean(activeSortKey && onSort)
  const isActive = isSortable && activeCurrentSort === activeSortKey

  function handleClick() {
    if (isSortable && onSort && activeSortKey) {
      onSort(activeSortKey)
    }
  }

  return (
    <th
      onClick={handleClick}
      className={className}
      style={{
        textAlign: align,
        cursor: isSortable ? 'pointer' : 'default',
        userSelect: isSortable ? 'none' : 'auto',
        transition: 'background 0.15s ease',
        ...style,
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          justifyContent: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start',
          width: '100%',
          color: isActive ? 'var(--navy, #1C2B4A)' : undefined,
          fontWeight: isActive ? 800 : undefined,
        }}
      >
        <span>{children || label}</span>
        {isSortable && (
          <span style={{ display: 'inline-flex', opacity: isActive ? 1 : 0.4 }}>
            {isActive ? (
              activeSortDir === 'asc' ? (
                <ArrowUp size={13} color="var(--accent, #C75B00)" />
              ) : (
                <ArrowDown size={13} color="var(--accent, #C75B00)" />
              )
            ) : (
              <ArrowUpDown size={13} />
            )}
          </span>
        )}
      </div>
    </th>
  )
}

export default AgenceTableTh
