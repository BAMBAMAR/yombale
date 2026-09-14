'use client'

import React from 'react'
import { ChevronDown } from 'lucide-react'

interface PosHeaderBoutiqueSelectorProps {
  boutiques: any[]
  boutiqueActiveId: string
  activeBoutiqueObj?: any
  initialToken?: string | null
  isDarkMode: boolean
  onDemanderChangementBoutique: (newId: string) => void
}

export default function PosHeaderBoutiqueSelector({
  boutiques,
  boutiqueActiveId,
  activeBoutiqueObj,
  initialToken,
  isDarkMode,
  onDemanderChangementBoutique,
}: PosHeaderBoutiqueSelectorProps) {
  if (!boutiques || boutiques.length === 0) return null

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: isDarkMode ? '#1e293b' : 'var(--pos-primary-bg)',
        border: isDarkMode ? '1px solid #334155' : '1px solid var(--pos-border)',
        borderRadius: 8,
        padding: '3px 8px 3px 4px',
        height: 34,
        flexShrink: 1,
        minWidth: 0,
      }}
      title={boutiques.length > 1 ? 'Boutique active (cliquez pour changer de boutique)' : 'Boutique active'}
    >
      {activeBoutiqueObj?.logo ? (
        <img
          src={activeBoutiqueObj.logo}
          alt={activeBoutiqueObj.nom}
          style={{
            width: 26,
            height: 26,
            borderRadius: 6,
            objectFit: 'cover',
            flexShrink: 0,
            border: isDarkMode ? '1px solid #475569' : '1px solid var(--pos-border)',
          }}
        />
      ) : (
        <span
          style={{
            width: 26,
            height: 26,
            borderRadius: 6,
            background: 'linear-gradient(135deg, var(--pos-primary, #C75B00) 0%, #ea580c 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12.5,
            fontWeight: 900,
            flexShrink: 0,
          }}
        >
          {activeBoutiqueObj?.nom ? activeBoutiqueObj.nom.charAt(0).toUpperCase() : ''}
        </span>
      )}

      <span
        style={{
          fontSize: 12,
          fontWeight: 800,
          color: isDarkMode ? '#f8fafc' : '#1e3a5f',
          maxWidth: 110,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {activeBoutiqueObj?.nom || boutiques[0]?.nom}
      </span>

      {boutiques.length > 1 && !initialToken && (
        <>
          <ChevronDown size={12} style={{ color: isDarkMode ? '#94a3b8' : '#64748b', flexShrink: 0 }} />
          <select
            value={boutiqueActiveId}
            onChange={(e) => onDemanderChangementBoutique(e.target.value)}
            style={{
              position: 'absolute',
              inset: 0,
              opacity: 0,
              width: '100%',
              height: '100%',
              cursor: 'pointer',
            }}
            title="Changer de boutique (sécurisé par PIN Superviseur)"
          >
            {boutiques.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nom}
              </option>
            ))}
          </select>
        </>
      )}
    </div>
  )
}
