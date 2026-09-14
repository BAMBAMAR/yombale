'use client'

import React from 'react'
import { CATEGORIES } from '@/lib/categories'
import { Search } from 'lucide-react'
import type { TemplateProduit, SaisieProduit } from './types'

interface BatchImportCatalogViewProps {
  loading: boolean
  categorieActive: string
  setCategorieActive: (cat: string) => void
  rechercheCatalogue: string
  setRechercheCatalogue: (q: string) => void
  templatesAffiches: TemplateProduit[]
  saisies: Record<string, SaisieProduit>
  toggleSelection: (id: string) => void
  updatePrix: (id: string, val: string) => void
  updateQuantite: (id: string, val: number) => void
}

export default function BatchImportCatalogView({
  loading,
  categorieActive,
  setCategorieActive,
  rechercheCatalogue,
  setRechercheCatalogue,
  templatesAffiches,
  saisies,
  toggleSelection,
  updatePrix,
  updateQuantite,
}: BatchImportCatalogViewProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Navigation des catégories */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          padding: '4px 0 12px',
          overflowX: 'auto',
          flexShrink: 0,
          borderBottom: '1px solid #e5e7eb',
          alignItems: 'center',
        }}
      >
        <button
          key="tous"
          type="button"
          onClick={() => setCategorieActive('tous')}
          style={{
            padding: '8px 14px',
            borderRadius: 20,
            border: 'none',
            whiteSpace: 'nowrap',
            background: categorieActive === 'tous' ? 'var(--accent, #C75B00)' : '#f1f5f9',
            color: categorieActive === 'tous' ? '#fff' : '#475569',
            fontWeight: categorieActive === 'tous' ? 800 : 600,
            fontSize: 12.5,
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'all 0.15s ease',
          }}
        >
          Tous les rayons
        </button>
        {CATEGORIES.filter((c) => c.value !== 'mixte').map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => setCategorieActive(c.value)}
            style={{
              padding: '8px 14px',
              borderRadius: 20,
              border: 'none',
              whiteSpace: 'nowrap',
              background: categorieActive === c.value ? 'var(--accent, #C75B00)' : '#f1f5f9',
              color: categorieActive === c.value ? '#fff' : '#475569',
              fontWeight: categorieActive === c.value ? 800 : 600,
              fontSize: 12.5,
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'all 0.15s ease',
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#64748B' }}>
          Chargement des modèles de catalogue...
        </div>
      ) : (
        <>
          {/* Barre de Recherche dans le catalogue */}
          <div style={{ position: 'relative' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              placeholder="Rechercher un modèle de produit (ex: Riz, iPhone, Robe, Savon...)"
              value={rechercheCatalogue}
              onChange={(e) => setRechercheCatalogue(e.target.value)}
              style={{
                width: '100%',
                padding: '11px 16px 11px 40px',
                borderRadius: 12,
                border: '1.5px solid #D1D5DB',
                fontSize: 14,
                background: '#fff',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))',
              gap: 12,
            }}
          >
            {templatesAffiches.map((tItem) => {
              const item = saisies[tItem.id]
              if (!item) return null
              return (
                <div
                  key={tItem.id}
                  style={{
                    background: '#fff',
                    border: item.selectionne
                      ? '2px solid var(--accent, #C75B00)'
                      : '1px solid #E2E8F0',
                    borderRadius: 14,
                    padding: 12,
                    display: 'flex',
                    gap: 12,
                    alignItems: 'center',
                    boxShadow: item.selectionne ? '0 4px 14px rgba(199,91,0,.15)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={item.selectionne}
                    onChange={() => toggleSelection(tItem.id)}
                    style={{ width: 18, height: 18, accentColor: 'var(--accent, #C75B00)', cursor: 'pointer' }}
                  />

                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={tItem.photo_defaut}
                    alt={tItem.nom}
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 10,
                      objectFit: 'cover',
                      background: '#F1F5F9',
                    }}
                  />

                  <div
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                      minWidth: 0,
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontWeight: 750,
                        fontSize: 13.5,
                        color: '#0F172A',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {tItem.nom}
                    </p>

                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <input
                          type="number"
                          placeholder="Prix FCFA (ex: 2500)"
                          value={item.prix}
                          onChange={(e) => updatePrix(tItem.id, e.target.value)}
                          style={{
                            width: '100%',
                            padding: '6px 8px',
                            border: '1px solid #D1D5DB',
                            borderRadius: 8,
                            fontSize: 12.5,
                            fontWeight: 700,
                            boxSizing: 'border-box',
                            outline: 'none',
                          }}
                        />
                      </div>

                      <div style={{ width: 65 }}>
                        <input
                          type="number"
                          min={1}
                          title="Quantité en stock"
                          value={item.quantite}
                          onChange={(e) => updateQuantite(tItem.id, Number(e.target.value))}
                          style={{
                            width: '100%',
                            padding: '6px 8px',
                            border: '1px solid #D1D5DB',
                            borderRadius: 8,
                            fontSize: 12.5,
                            textAlign: 'center',
                            boxSizing: 'border-box',
                            outline: 'none',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
