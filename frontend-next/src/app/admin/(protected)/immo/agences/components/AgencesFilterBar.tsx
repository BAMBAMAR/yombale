'use client'

import React from 'react'
import { Search, X, Building2, Send, SlidersHorizontal, Sparkles } from 'lucide-react'
import { AgencesFilterCounts } from './types'

interface AgencesFilterBarProps {
  q: string
  onQChange: (val: string) => void
  activeTab: 'toutes' | 'abonnees' | 'sponsorisees' | 'suspendues'
  onTabChange: (tab: 'toutes' | 'abonnees' | 'sponsorisees' | 'suspendues') => void
  seuilBiens: 'tous' | '0' | '1-2' | '3-5' | '5+'
  onSeuilChange: (val: 'tous' | '0' | '1-2' | '3-5' | '5+') => void
  villeFilter: string
  onVilleChange: (ville: string) => void
  villesDisponibles: string[]
  counts: AgencesFilterCounts
  onRelancerVides: () => void
}

export default function AgencesFilterBar({
  q,
  onQChange,
  activeTab,
  onTabChange,
  seuilBiens,
  onSeuilChange,
  villeFilter,
  onVilleChange,
  villesDisponibles,
  counts,
  onRelancerVides,
}: AgencesFilterBarProps) {
  const tabs: {
    key: 'toutes' | 'abonnees' | 'sponsorisees' | 'suspendues'
    label: string
    count: number
    color: string
    activeBg: string
  }[] = [
    { key: 'toutes', label: 'Toutes les agences', count: counts.toutes, color: 'var(--navy, #1C2B4A)', activeBg: '#f1f5f9' },
    { key: 'abonnees', label: 'Abonnées Pro / Multi', count: counts.abonnees, color: '#7c3aed', activeBg: '#ede9fe' },
    { key: 'sponsorisees', label: 'En Vedette', count: counts.sponsorisees, color: '#b45309', activeBg: '#fef3c7' },
    { key: 'suspendues', label: 'Suspendues', count: counts.suspendues, color: '#dc2626', activeBg: '#fee2e2' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Barre d'alerte et relance rapide */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          background: '#ffffff',
          border: '1px solid var(--border, #E8DDD2)',
          borderRadius: 12,
          padding: '12px 18px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
            Supervision du Parc Agences :
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 800,
              padding: '3px 10px',
              borderRadius: 12,
              background: counts.zeroBien > 0 ? '#fee2e2' : '#f1f5f9',
              color: counts.zeroBien > 0 ? '#991b1b' : '#64748b',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {counts.zeroBien} agence(s) à 0 bien (à relancer)
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 800,
              padding: '3px 10px',
              borderRadius: 12,
              background: '#ffedd5',
              color: '#9a3412',
            }}
          >
            {counts.max2Biens} agence(s) ≤ 2 biens
          </span>
        </div>

        {counts.zeroBien > 0 && (
          <button
            type="button"
            onClick={onRelancerVides}
            style={{
              background: 'var(--accent, #C75B00)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              padding: '8px 14px',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 2px 4px rgba(199,91,0,0.2)',
            }}
            title="Relancer les agences sans aucun bien enregistré"
          >
            <Send size={13} />
            <span>Relancer les {counts.zeroBien} agences vides (Guide WhatsApp)</span>
          </button>
        )}
      </div>

      {/* Barre de filtres et de recherche */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid var(--border, #E8DDD2)',
          borderRadius: 12,
          padding: 16,
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        {/* Champ de recherche plein texte */}
        <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
          <Search
            size={15}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text3, #94a3b8)',
            }}
          />
          <input
            type="text"
            value={q}
            onChange={(e) => onQChange(e.target.value)}
            placeholder="Rechercher par nom agence, gérant, email, téléphone, ville..."
            style={{
              width: '100%',
              padding: '9px 36px 9px 36px',
              fontSize: 13,
              borderRadius: 8,
              border: '1px solid var(--border, #E8DDD2)',
              outline: 'none',
              background: '#f8fafc',
            }}
          />
          {q && (
            <button
              type="button"
              onClick={() => onQChange('')}
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Sélecteur de seuil de biens */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <SlidersHorizontal size={14} color="#64748b" />
          <select
            value={seuilBiens}
            onChange={(e) => onSeuilChange(e.target.value as any)}
            style={{
              padding: '9px 12px',
              borderRadius: 8,
              border: '1px solid var(--border, #E8DDD2)',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--navy, #1C2B4A)',
              background: '#ffffff',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="tous">Tous volumes de biens</option>
            <option value="0">0 bien (Vide / À relancer)</option>
            <option value="1-2">1 à 2 biens</option>
            <option value="3-5">3 à 5 biens</option>
            <option value="5+">Plus de 5 biens</option>
          </select>
        </div>

        {/* Sélecteur de ville */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <select
            value={villeFilter}
            onChange={(e) => onVilleChange(e.target.value)}
            style={{
              padding: '9px 12px',
              borderRadius: 8,
              border: '1px solid var(--border, #E8DDD2)',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--navy, #1C2B4A)',
              background: '#ffffff',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="toutes">Toutes les villes</option>
            {villesDisponibles.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Onglets Métier */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          borderBottom: '1px solid var(--border, #E8DDD2)',
          paddingBottom: 8,
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 14px',
                borderRadius: 8,
                border: isActive ? `1px solid ${tab.color}` : '1px solid transparent',
                background: isActive ? tab.activeBg : 'transparent',
                color: isActive ? tab.color : 'var(--text2, #64748b)',
                fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{tab.label}</span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: 12,
                  background: isActive ? tab.color : '#e2e8f0',
                  color: isActive ? '#ffffff' : '#475569',
                }}
              >
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
