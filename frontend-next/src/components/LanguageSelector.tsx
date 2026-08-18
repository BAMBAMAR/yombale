'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useLocale } from '@/i18n/context'
import { LOCALES, LOCALES_META, type Locale } from '@/i18n/config'

interface LanguageSelectorProps {
  variant?: 'pill' | 'dropdown' | 'compact' | 'inline'
  className?: string
  align?: 'start' | 'end' | 'center'
}

export default function LanguageSelector({
  variant = 'dropdown',
  className = '',
  align = 'end',
}: LanguageSelectorProps) {
  const { locale, setLocale, meta, isRtl } = useLocale()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  if (variant === 'pill') {
    return (
      <div
        className={`lang-selector-pill-group ${className}`}
        role="radiogroup"
        aria-label="Sélection de la langue"
        style={{
          display: 'inline-flex',
          background: 'rgba(0, 0, 0, 0.04)',
          padding: 3,
          borderRadius: 10,
          border: '1px solid rgba(0, 0, 0, 0.08)',
          gap: 2,
        }}
      >
        {LOCALES.map((loc) => {
          const m = LOCALES_META[loc]
          const isSelected = locale === loc
          return (
            <button
              key={loc}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setLocale(loc)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                border: 'none',
                borderRadius: 8,
                background: isSelected ? '#FFFFFF' : 'transparent',
                color: isSelected ? 'var(--navy, #1C2B4A)' : '#64748B',
                fontWeight: isSelected ? 700 : 500,
                fontSize: 13,
                cursor: 'pointer',
                boxShadow: isSelected ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ fontSize: 14 }}>{m.flag}</span>
              <span>{m.nativeLabel}</span>
            </button>
          )
        })}
      </div>
    )
  }

  if (variant === 'inline') {
    return (
      <div
        className={`lang-selector-inline ${className}`}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
      >
        {LOCALES.map((loc) => {
          const m = LOCALES_META[loc]
          const isSelected = locale === loc
          return (
            <button
              key={loc}
              type="button"
              onClick={() => setLocale(loc)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 8px',
                border: isSelected ? '1px solid var(--orange, #C75B00)' : '1px solid transparent',
                borderRadius: 6,
                background: isSelected ? 'rgba(199,91,0,0.08)' : 'transparent',
                color: isSelected ? 'var(--orange, #C75B00)' : '#64748B',
                fontWeight: isSelected ? 700 : 500,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              <span>{m.flag}</span>
              <span>{m.code.toUpperCase()}</span>
            </button>
          )
        })}
      </div>
    )
  }

  // Variant Dropdown & Compact
  return (
    <div
      ref={dropdownRef}
      className={`lang-selector-container ${className}`}
      style={{ position: 'relative', display: 'inline-block' }}
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`Langue actuelle : ${meta.nativeLabel}. Cliquer pour modifier.`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: variant === 'compact' ? '6px 10px' : '8px 14px',
          background: 'rgba(255, 255, 255, 0.9)',
          border: '1px solid rgba(0, 0, 0, 0.12)',
          borderRadius: 8,
          color: 'var(--navy, #1C2B4A)',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          transition: 'background 0.15s, border-color 0.15s',
        }}
      >
        <span style={{ fontSize: 15 }}>{meta.flag}</span>
        {variant !== 'compact' && <span>{meta.nativeLabel}</span>}
        <span
          style={{
            fontSize: 10,
            color: '#64748B',
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s ease',
          }}
        >
          ▼
        </span>
      </button>

      {isOpen && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            [align === 'start' ? 'left' : 'right']: 0,
            background: '#FFFFFF',
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.04)',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            padding: 4,
            minWidth: 150,
            zIndex: 9999,
          }}
        >
          {LOCALES.map((loc) => {
            const m = LOCALES_META[loc]
            const isSelected = locale === loc
            return (
              <button
                key={loc}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  setLocale(loc)
                  setIsOpen(false)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '8px 12px',
                  border: 'none',
                  borderRadius: 6,
                  background: isSelected ? 'rgba(199, 91, 0, 0.08)' : 'transparent',
                  color: isSelected ? 'var(--orange, #C75B00)' : '#1E293B',
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: 13,
                  cursor: 'pointer',
                  textAlign: isRtl ? 'right' : 'left',
                  transition: 'background 0.12s',
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>{m.flag}</span>
                  <span>{m.nativeLabel}</span>
                </span>
                {isSelected && <span style={{ color: 'var(--orange, #C75B00)', fontSize: 12 }}>✓</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
