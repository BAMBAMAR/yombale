'use client'

import React from 'react'
import type { LucideIcon } from 'lucide-react'
import { PackageOpen } from 'lucide-react'

export interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  icon: Icon = PackageOpen,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`empty-state-npl ${className}`.trim()}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '48px 24px',
        backgroundColor: 'var(--card, #ffffff)',
        borderRadius: 'var(--r-lg, 12px)',
        border: '1px dashed var(--border, #E8DDD2)',
      }}
    >
      <div
        style={{
          width: '54px',
          height: '54px',
          borderRadius: '50%',
          backgroundColor: 'var(--surface-subtle, #F8F5F0)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--accent, #C75B00)',
          marginBottom: '16px',
        }}
      >
        <Icon size={26} strokeWidth={1.75} />
      </div>

      <h3
        style={{
          margin: '0 0 6px',
          fontSize: '16px',
          fontWeight: 700,
          color: 'var(--navy, #1C2B4A)',
        }}
      >
        {title}
      </h3>

      {description && (
        <p
          style={{
            margin: '0 0 20px',
            fontSize: '13.5px',
            color: 'var(--text2, #555)',
            maxWidth: '380px',
            lineHeight: 1.5,
          }}
        >
          {description}
        </p>
      )}

      {action && (
        <div style={{ display: 'inline-flex', alignItems: 'center' }}>
          {action}
        </div>
      )}
    </div>
  )
}
