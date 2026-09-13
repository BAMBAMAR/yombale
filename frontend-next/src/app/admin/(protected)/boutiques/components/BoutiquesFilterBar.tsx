import React from 'react'
import { Search, X, Bot, Clock } from 'lucide-react'

interface BoutiquesFilterBarProps {
  zeroProduitCount: number
  max1ProduitCount: number
  cronActif: boolean
  onOpenConfigCron: () => void
  q: string
  onQChange: (val: string) => void
  seuilProduits: 'tous' | '0' | '1' | '2' | '3' | '5'
  onSeuilChange: (val: 'tous' | '0' | '1' | '2' | '3' | '5') => void
  activeTab: 'toutes' | 'abonnees' | 'sponsorisees' | 'inactives'
  onTabChange: (tab: 'toutes' | 'abonnees' | 'sponsorisees' | 'inactives') => void
  counts: {
    toutes: number
    abonnees: number
    sponsorisees: number
    inactives: number
  }
}

export default function BoutiquesFilterBar({
  zeroProduitCount,
  max1ProduitCount,
  cronActif,
  onOpenConfigCron,
  q,
  onQChange,
  seuilProduits,
  onSeuilChange,
  activeTab,
  onTabChange,
  counts,
}: BoutiquesFilterBarProps) {
  const tabs: { key: 'toutes' | 'abonnees' | 'sponsorisees' | 'inactives'; label: string; count: number; color: string }[] = [
    { key: 'toutes', label: 'Toutes', count: counts.toutes, color: '#1e3a5f' },
    { key: 'abonnees', label: 'Abonnées Pro/Business', count: counts.abonnees, color: 'var(--accent, #C75B00)' },
    { key: 'sponsorisees', label: 'Sponsorisées', count: counts.sponsorisees, color: '#D97706' },
    { key: 'inactives', label: 'Inactives', count: counts.inactives, color: '#dc2626' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Barre d'outils supérieure avec configuration d'automatisation */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          background: '#fff',
          border: '1px solid var(--border, #e2e8f0)',
          borderRadius: 14,
          padding: '12px 18px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>Onboarding Catalogue :</span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 800,
              padding: '3px 10px',
              borderRadius: 12,
              background: zeroProduitCount > 0 ? '#fee2e2' : '#f1f5f9',
              color: zeroProduitCount > 0 ? '#991b1b' : '#64748b',
            }}
          >
            {zeroProduitCount} boutique(s) à 0 produit
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
            {max1ProduitCount} boutique(s) ≤ 1 produit
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenConfigCron}
          style={{
            background: 'var(--navy, #1e3a5f)',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 2px 4px rgba(30,58,95,0.2)',
          }}
        >
          <Bot size={15} />
          <span>Automatisation Relances (Cron)</span>
          <span
            style={{
              background: cronActif ? '#22c55e' : '#64748b',
              color: '#fff',
              fontSize: 10,
              padding: '2px 6px',
              borderRadius: 10,
              fontWeight: 800,
            }}
          >
            {cronActif ? 'ACTIF' : 'OFF'}
          </span>
        </button>
      </div>

      {/* Barre de recherche et Filtre de Seuil Catalogue */}
      <div
        style={{
          background: '#fff',
          border: '1px solid var(--border, #e2e8f0)',
          borderRadius: 14,
          padding: 16,
          boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
          <span
            style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
              display: 'flex',
            }}
          >
            <Search size={16} />
          </span>
          <input
            type="text"
            value={q}
            onChange={e => onQChange(e.target.value)}
            placeholder="Rechercher une boutique par nom, propriétaire, e-mail, téléphone, ville, catégorie..."
            style={{
              width: '100%',
              padding: '10px 40px 10px 42px',
              borderRadius: 10,
              border: '1px solid #cbd5e1',
              fontSize: 14,
              outline: 'none',
              fontFamily: 'var(--font-inter), system-ui, -apple-system, sans-serif',
            }}
          />
          {q && (
            <button
              type="button"
              onClick={() => onQChange('')}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Sélecteur de Seuil Catalogue */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>Catalogue :</label>
          <select
            value={seuilProduits}
            onChange={e => onSeuilChange(e.target.value as 'tous' | '0' | '1' | '2' | '3' | '5')}
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              border: '1px solid #cbd5e1',
              fontSize: 13,
              fontWeight: 700,
              background: '#fff',
              color: '#1e293b',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="tous">Tous les volumes</option>
            <option value="0">0 produit (Boutique vide)</option>
            <option value="1">≤ 1 produit</option>
            <option value="2">≤ 2 produits</option>
            <option value="3">≤ 3 produits</option>
            <option value="5">≤ 5 produits</option>
          </select>
        </div>
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', borderBottom: '2px solid var(--border, #e2e8f0)', paddingBottom: 4 }}>
        {tabs.map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => onTabChange(t.key)}
            style={{
              padding: '9px 16px',
              borderRadius: '10px 10px 0 0',
              border: 'none',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              background: activeTab === t.key ? t.color : '#f8fafc',
              color: activeTab === t.key ? '#fff' : '#475569',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {t.label}
            <span
              style={{
                background: activeTab === t.key ? 'rgba(255,255,255,0.3)' : '#e2e8f0',
                padding: '2px 7px',
                borderRadius: 10,
                fontSize: 11,
              }}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
