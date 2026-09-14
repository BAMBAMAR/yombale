'use client'

import React, { useState } from 'react'
import type { TypeVarianteId } from '../boutiqueHelpers'
import type { Variante, VarianteSku } from '../boutiqueTypes'
import { COULEURS_PALETTE, inputStyle, TypeVariante } from './constants'
import { ProduitFormVariantesSkusTable } from './ProduitFormVariantesSkusTable'

export function ValeursLibres({
  valeurs,
  onAjouter,
  onRetirer,
}: {
  valeurs: string[]
  onAjouter: (v: string) => void
  onRetirer: (v: string) => void
}) {
  const [saisie, setSaisie] = useState('')

  function ajouter() {
    const val = saisie.trim()
    if (!val || valeurs.includes(val)) return
    onAjouter(val)
    setSaisie('')
  }

  return (
    <div>
      {valeurs.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {valeurs.map(val => (
            <span
              key={val}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: '#eff6ff',
                color: '#1d4ed8',
                border: '1px solid #bfdbfe',
                borderRadius: 20,
                padding: '4px 10px',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {val}
              <button
                type="button"
                onClick={() => onRetirer(val)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#1d4ed8',
                  cursor: 'pointer',
                  fontSize: 12,
                  padding: 0,
                }}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={saisie}
          onChange={e => setSaisie(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault()
              ajouter()
            }
          }}
          style={{ ...inputStyle, flex: 1 }}
          placeholder="Valeur, Entrée pour ajouter"
        />
        <button
          type="button"
          onClick={ajouter}
          style={{
            background: '#eff6ff',
            color: '#1d4ed8',
            border: '1px solid #bfdbfe',
            borderRadius: 6,
            padding: '8px 14px',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Ajouter
        </button>
      </div>
    </div>
  )
}

interface ProduitFormVariantesSectionProps {
  variantes: Variante[]
  typesDisponibles: TypeVariante[]
  nomsPersonnalises: Record<number, string>
  ajouterOption: (typeId: TypeVarianteId) => void
  renommerOptionPersonnalisee: (index: number, nom: string) => void
  retirerOption: (index: number) => void
  toggleValeur: (index: number, valeur: string) => void
  variantesSkus: VarianteSku[]
  prixForm: string
  stockQuantiteForm: string
  alignerTousLesPrix: () => void
  alignerTousLesStocks: () => void
  regenererTousLesSkus: () => void
  updateVarianteSku: (index: number, champ: keyof VarianteSku, val: any) => void
  genererEanPourVariante: (index: number) => void
}

export function ProduitFormVariantesSection({
  variantes,
  typesDisponibles,
  nomsPersonnalises,
  ajouterOption,
  renommerOptionPersonnalisee,
  retirerOption,
  toggleValeur,
  variantesSkus,
  prixForm,
  stockQuantiteForm,
  alignerTousLesPrix,
  alignerTousLesStocks,
  regenererTousLesSkus,
  updateVarianteSku,
  genererEanPourVariante,
}: ProduitFormVariantesSectionProps) {
  return (
    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14 }}>
      <p
        style={{
          margin: '0 0 4px',
          fontSize: 12,
          fontWeight: 800,
          color: '#64748b',
          textTransform: 'uppercase',
          letterSpacing: '.05em',
        }}
      >
        Variantes (optionnel)
      </p>
      <p style={{ margin: '0 0 12px', fontSize: 12, color: '#9ca3af' }}>
        Ajoutez une option (ex: Couleur, Taille) puis choisissez les valeurs.
      </p>

      {variantes.map((v, i) => {
        const type = typesDisponibles.find(t => t.id === v.typeId) || TYPES_VARIANTE_FIND(v.typeId as TypeVarianteId)
        const estCouleur = v.typeId === 'couleur'
        const estPersonnalise = !type || v.typeId === 'autre'

        return (
          <div
            key={i}
            style={{
              marginBottom: 12,
              paddingBottom: 12,
              borderBottom: i < variantes.length - 1 ? '1px solid #e2e8f0' : 'none',
            }}
          >
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
              {estPersonnalise ? (
                <input
                  type="text"
                  value={nomsPersonnalises[i] ?? v.nom}
                  onChange={e => renommerOptionPersonnalisee(i, e.target.value)}
                  className="npl-input-airy"
                  style={{ flex: 1, minHeight: 40 }}
                  placeholder="Nom de l'option (ex: Matière)"
                />
              ) : (
                <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#374151' }}>{type?.label}</span>
              )}
              <button
                type="button"
                onClick={() => retirerOption(i)}
                style={{
                  background: '#fef2f2',
                  color: '#dc2626',
                  border: '1px solid #fecaca',
                  borderRadius: 8,
                  padding: '8px 12px',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            {estCouleur ? (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {COULEURS_PALETTE.map(c => {
                  const selectionnee = v.valeurs.includes(c.nom)
                  return (
                    <button
                      key={c.nom}
                      type="button"
                      onClick={() => toggleValeur(i, c.nom)}
                      title={c.nom}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 2,
                      }}
                    >
                      <span
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: c.hex,
                          border: selectionnee ? '3px solid #C75B00' : '2px solid #d1d5db',
                          boxShadow: c.hex === '#ffffff' ? 'inset 0 0 0 1px #e5e7eb' : undefined,
                          display: 'block',
                        }}
                      />
                      <span
                        style={{
                          fontSize: 10,
                          color: selectionnee ? '#C75B00' : '#6b7280',
                          fontWeight: selectionnee ? 700 : 500,
                        }}
                      >
                        {c.nom}
                      </span>
                    </button>
                  )
                })}
              </div>
            ) : type ? (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {type.suggestions.map(val => {
                  const selectionnee = v.valeurs.includes(val)
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => toggleValeur(i, val)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: selectionnee ? '2px solid #C75B00' : '1px solid #d1d5db',
                        background: selectionnee ? '#fff7f0' : '#fff',
                        color: selectionnee ? '#C75B00' : '#374151',
                      }}
                    >
                      {val}
                    </button>
                  )
                })}
              </div>
            ) : (
              <ValeursLibres
                valeurs={v.valeurs}
                onAjouter={val => toggleValeur(i, val)}
                onRetirer={val => toggleValeur(i, val)}
              />
            )}
          </div>
        )
      })}

      {typesDisponibles.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: variantes.length > 0 ? 12 : 0 }}>
          {typesDisponibles.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => ajouterOption(t.id)}
              style={{
                background: '#f1f5f9',
                border: '1px dashed #cbd5e1',
                borderRadius: 10,
                padding: '8px 14px',
                fontSize: 12.5,
                fontWeight: 700,
                color: '#334155',
                cursor: 'pointer',
              }}
            >
              + {t.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Matrice 3D des Combinaisons ── */}
      <ProduitFormVariantesSkusTable
        variantesSkus={variantesSkus}
        prixForm={prixForm}
        stockQuantiteForm={stockQuantiteForm}
        alignerTousLesPrix={alignerTousLesPrix}
        alignerTousLesStocks={alignerTousLesStocks}
        regenererTousLesSkus={regenererTousLesSkus}
        updateVarianteSku={updateVarianteSku}
        genererEanPourVariante={genererEanPourVariante}
      />
    </div>
  )
}

function TYPES_VARIANTE_FIND(id?: TypeVarianteId) {
  if (!id) return undefined
  return { id, label: id, nomVariante: id, suggestions: [], repetable: false }
}
