'use client'

import React from 'react'
import { Calendar, Filter, Download, RotateCcw, Package } from 'lucide-react'

interface ProduitOption {
  id: string
  nom: string
}

interface AnalyticsFilterBarProps {
  dateDebut: string
  dateFin: string
  onDateDebutChange: (val: string) => void
  onDateFinChange: (val: string) => void
  selectedProduitId: string
  onProduitChange: (val: string) => void
  produits: ProduitOption[]
  activePreset: '7j' | '30j' | 'mois' | 'libre'
  onPresetSelect: (preset: '7j' | '30j' | 'mois' | 'libre') => void
  onReset: () => void
  onExportCSV: () => void
}

export default function AnalyticsFilterBar({
  dateDebut,
  dateFin,
  onDateDebutChange,
  onDateFinChange,
  selectedProduitId,
  onProduitChange,
  produits,
  activePreset,
  onPresetSelect,
  onReset,
  onExportCSV,
}: AnalyticsFilterBarProps) {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid var(--border, #E8DDD2)',
        borderRadius: 14,
        padding: '14px 18px',
        marginBottom: 20,
        boxShadow: 'var(--shadow-xs, 0 1px 3px rgba(0,0,0,0.05))',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'var(--bg, #F8F5F0)',
              border: '1px solid var(--border, #E8DDD2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Filter size={16} style={{ color: 'var(--accent, #C75B00)' }} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: 13.5, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
              Période &amp; Filtres d&apos;Analyse Ad-Hoc
            </h4>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--text2, #6B5E52)' }}>
              Filtrez librement les ventes par tranche de dates et par produit spécifique
            </p>
          </div>
        </div>

        {/* Boutons de presets rapides */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {[
            { id: '7j', label: '7 derniers jours' },
            { id: '30j', label: '30 derniers jours' },
            { id: 'mois', label: 'Ce mois-ci' },
            { id: 'libre', label: 'Période libre' },
          ].map(p => {
            const isSelected = activePreset === p.id
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onPresetSelect(p.id as any)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: isSelected ? '1.5px solid var(--navy, #1C2B4A)' : '1px solid var(--border, #E8DDD2)',
                  background: isSelected ? 'var(--navy, #1C2B4A)' : '#ffffff',
                  color: isSelected ? '#ffffff' : 'var(--text2, #6B5E52)',
                  transition: 'all 0.15s ease',
                }}
              >
                {p.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Barre de contrôles fins (Date début, Date fin, Produit, Export CSV) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 10,
          alignItems: 'end',
          paddingTop: 8,
          borderTop: '1px solid #F1F5F9',
        }}
      >
        {/* Date Début */}
        <div>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--text2, #6B5E52)',
              marginBottom: 4,
            }}
          >
            <Calendar size={12} /> Date de début
          </label>
          <input
            type="date"
            value={dateDebut}
            onChange={e => onDateDebutChange(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid #CBD5E1',
              fontSize: 12.5,
              color: 'var(--navy, #1C2B4A)',
              background: '#FFFFFF',
              outline: 'none',
            }}
          />
        </div>

        {/* Date Fin */}
        <div>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--text2, #6B5E52)',
              marginBottom: 4,
            }}
          >
            <Calendar size={12} /> Date de fin
          </label>
          <input
            type="date"
            value={dateFin}
            onChange={e => onDateFinChange(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid #CBD5E1',
              fontSize: 12.5,
              color: 'var(--navy, #1C2B4A)',
              background: '#FFFFFF',
              outline: 'none',
            }}
          />
        </div>

        {/* Filtre par Produit */}
        <div>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--text2, #6B5E52)',
              marginBottom: 4,
            }}
          >
            <Package size={12} /> Produit spécifique
          </label>
          <select
            value={selectedProduitId}
            onChange={e => onProduitChange(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid #CBD5E1',
              fontSize: 12.5,
              color: 'var(--navy, #1C2B4A)',
              background: '#FFFFFF',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="">Tous les produits</option>
            {produits.map(p => (
              <option key={p.id} value={p.id}>
                {p.nom}
              </option>
            ))}
          </select>
        </div>

        {/* Boutons d'action (Réinitialiser & Export CSV) */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button
            type="button"
            onClick={onReset}
            title="Réinitialiser les filtres"
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #CBD5E1',
              background: '#F8FAFC',
              color: '#64748B',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 38,
            }}
          >
            <RotateCcw size={14} />
          </button>

          <button
            type="button"
            onClick={onExportCSV}
            style={{
              flex: 1,
              padding: '8px 14px',
              borderRadius: 8,
              border: 'none',
              background: 'var(--navy, #1C2B4A)',
              color: '#ffffff',
              fontWeight: 750,
              fontSize: 12,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              height: 38,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>
    </div>
  )
}
