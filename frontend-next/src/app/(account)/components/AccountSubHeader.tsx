'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowLeft, LucideIcon } from 'lucide-react'

interface AccountSubHeaderProps {
  title: string
  subtitle?: string
  icon?: LucideIcon
  iconColor?: string
  backHref?: string
  backLabel?: string
  actionLabel?: string
  actionHref?: string
  onActionClick?: () => void
  countBadge?: string | number
}

export default function AccountSubHeader({
  title,
  subtitle,
  icon: Icon,
  iconColor = 'var(--accent, #C75B00)',
  backHref = '/compte',
  backLabel = 'Tableau de bord',
  actionLabel,
  actionHref,
  onActionClick,
  countBadge,
}: AccountSubHeaderProps) {
  return (
    <div
      className="account-sub-header"
      style={{
        marginBottom: 20,
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Bouton Retour Fil d'Ariane */}
      <div style={{ marginBottom: 12 }}>
        <Link
          href={backHref}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12.5,
            fontWeight: 750,
            color: 'var(--navy, #1C2B4A)',
            background: '#FFFFFF',
            border: '1px solid var(--border, #E8DDD2)',
            padding: '6px 14px',
            borderRadius: 20,
            textDecoration: 'none',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            transition: 'all 0.15s ease',
          }}
        >
          <ArrowLeft size={14} style={{ color: 'var(--accent, #C75B00)' }} />
          <span>{backLabel}</span>
        </Link>
      </div>

      {/* Titre & Action */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          padding: '14px 18px',
          background: '#FFFFFF',
          borderRadius: 14,
          border: '1px solid var(--border, #E8DDD2)',
          boxShadow: '0 2px 6px rgba(26,22,18,0.02)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          {Icon && (
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: '#FAF8F5',
                border: '1px solid #E8DDD2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: iconColor,
                flexShrink: 0,
              }}
            >
              <Icon size={20} />
            </div>
          )}

          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: 'clamp(16px, 3.5vw, 19px)',
                  fontWeight: 900,
                  color: 'var(--navy, #1C2B4A)',
                  letterSpacing: '-0.01em',
                }}
              >
                {title}
              </h1>

              {countBadge !== undefined && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 10,
                    background: '#FAF8F5',
                    color: 'var(--navy, #1C2B4A)',
                    border: '1px solid #E8DDD2',
                  }}
                >
                  {countBadge}
                </span>
              )}
            </div>

            {subtitle && (
              <p
                style={{
                  margin: '3px 0 0',
                  fontSize: 12.5,
                  color: '#64748B',
                  lineHeight: 1.4,
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Bouton d'Action Contextuel */}
        {actionLabel && actionHref && (
          <Link
            href={actionHref}
            className="btn-npl"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 800,
              background: 'var(--accent, #C75B00)',
              color: '#FFFFFF',
              textDecoration: 'none',
              boxShadow: '0 2px 6px rgba(199,91,0,0.2)',
            }}
          >
            <span>{actionLabel}</span>
          </Link>
        )}

        {actionLabel && onActionClick && !actionHref && (
          <button
            type="button"
            onClick={onActionClick}
            className="btn-npl"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 800,
              background: 'var(--accent, #C75B00)',
              color: '#FFFFFF',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(199,91,0,0.2)',
            }}
          >
            <span>{actionLabel}</span>
          </button>
        )}
      </div>
    </div>
  )
}
