'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from '@/i18n/context'

export interface ClientOption {
  id: string
  prenom?: string
  nom?: string
  telephone?: string
  entreprise?: string
  ninea?: string
  [key: string]: any
}

interface SearchableClientSelectProps {
  clients: ClientOption[]
  value: string
  onChange: (clientId: string, clientObj?: ClientOption | null) => void
  placeholder?: string
  disabled?: boolean
}

export default function SearchableClientSelect({
  clients,
  value,
  onChange,
  placeholder,
  disabled = false
}: SearchableClientSelectProps) {
  const { t } = useTranslation()
  const displayPlaceholder = placeholder || t('shop.anonymousWalkInClient')
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputSearchRef = useRef<HTMLInputElement>(null)

  const selectedClient = clients.find(c => c.id === value)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (isOpen && inputSearchRef.current) {
      inputSearchRef.current.focus()
    }
  }, [isOpen])

  const q = searchTerm.trim().toLowerCase()
  const clientsFiltres = clients.filter(c => {
    if (!q) return true
    const fullName = `${c.prenom || ''} ${c.nom || ''}`.toLowerCase()
    const tel = (c.telephone || '').toLowerCase()
    const ent = (c.entreprise || '').toLowerCase()
    const nin = (c.ninea || '').toLowerCase()
    return fullName.includes(q) || tel.includes(q) || ent.includes(q) || nin.includes(q)
  })

  const handleSelect = (cId: string, cObj?: ClientOption | null) => {
    onChange(cId, cObj)
    setIsOpen(false)
    setSearchTerm('')
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Trigger */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '8px 12px',
          borderRadius: 8,
          border: isOpen ? '2px solid #0284c7' : '1px solid #cbd5e1',
          background: disabled ? '#f1f5f9' : '#ffffff',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 40,
          boxSizing: 'border-box',
          fontSize: 13,
          fontWeight: 600,
          color: '#0f172a',
          transition: 'all 0.15s ease',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
          {!value || !selectedClient ? (
            <span style={{ color: '#64748b', fontWeight: 500 }}>{displayPlaceholder}</span>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
              <span style={{ fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                👤 {selectedClient.prenom} {selectedClient.nom}
              </span>
              {selectedClient.telephone && (
                <span style={{ fontSize: 11, color: '#64748b', background: '#f1f5f9', padding: '1px 6px', borderRadius: 4, flexShrink: 0 }}>
                  {selectedClient.telephone}
                </span>
              )}
              {selectedClient.entreprise && (
                <span style={{ fontSize: 11, color: '#0284c7', background: '#e0f2fe', padding: '1px 6px', borderRadius: 4, flexShrink: 0 }}>
                  🏢 {selectedClient.entreprise}
                </span>
              )}
            </div>
          )}
        </div>

        <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }}>
          ▼
        </span>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 9999,
            background: '#ffffff',
            borderRadius: 12,
            border: '1px solid #cbd5e1',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            padding: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            maxHeight: 320
          }}
        >
          {/* Recherche */}
          <div style={{ position: 'relative' }}>
            <input
              ref={inputSearchRef}
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={t('shop.searchClientPlaceholder')}
              style={{
                width: '100%',
                padding: '8px 30px 8px 12px',
                borderRadius: 6,
                border: '1px solid #94a3b8',
                fontSize: 13,
                outline: 'none',
                boxSizing: 'border-box',
                fontWeight: 600
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: 14,
                  padding: 2
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Option Client Passant (Anonyme) */}
          <div
            onClick={() => handleSelect('', null)}
            style={{
              padding: '8px 10px',
              borderRadius: 6,
              background: !value ? '#e0f2fe' : '#f8fafc',
              border: '1px dashed #cbd5e1',
              cursor: 'pointer',
              fontSize: 12.5,
              fontWeight: 700,
              color: '#475569',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span>{displayPlaceholder}</span>
            <span style={{ fontSize: 10, background: '#cbd5e1', color: '#334155', padding: '1px 5px', borderRadius: 4 }}>
              {t('shop.byDefault')}
            </span>
          </div>

          {/* Liste Scrollable */}
          <div style={{ overflowY: 'auto', maxHeight: 200, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {clientsFiltres.length === 0 ? (
              <div style={{ padding: '14px 10px', textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
                {t('shop.noClientFoundSearch')}
              </div>
            ) : (
              clientsFiltres.map(c => {
                const isSelected = c.id === value
                return (
                  <div
                    key={c.id}
                    onClick={() => handleSelect(c.id, c)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 6,
                      background: isSelected ? '#f0f9ff' : 'transparent',
                      borderLeft: isSelected ? '3px solid #0284c7' : '3px solid transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'background 0.1s ease'
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) e.currentTarget.style.background = '#f8fafc'
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <div style={{ fontSize: 12.5, fontWeight: isSelected ? 800 : 700, color: isSelected ? '#0369a1' : '#0f172a' }}>
                        {c.prenom} {c.nom}
                      </div>
                      {c.entreprise && (
                        <div style={{ fontSize: 10.5, color: '#64748b' }}>
                          🏢 {c.entreprise} {c.ninea ? `(NINEA: ${c.ninea})` : ''}
                        </div>
                      )}
                    </div>

                    {c.telephone && (
                      <span style={{ fontSize: 11, fontWeight: 700, background: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: 4, flexShrink: 0 }}>
                        📞 {c.telephone}
                      </span>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
