'use client'

import React, { useState } from 'react'
import { ArrowUpRight, ArrowDownLeft, Trash2, Search, Filter } from 'lucide-react'
import type { KalpeOperation } from '../types'

interface KalpeOperationsJournalProps {
  operations: KalpeOperation[]
  total: number
  loading: boolean
  onDeleteOperation: (id: string) => Promise<void>
  onFilterType: (t: string) => void
  activeTypeFilter: string
  onSearch: (q: string) => void
}

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n)
}

export default function KalpeOperationsJournal({
  operations,
  total,
  loading,
  onDeleteOperation,
  onFilterType,
  activeTypeFilter,
  onSearch,
}: KalpeOperationsJournalProps) {
  const [searchVal, setSearchVal] = useState('')

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setSearchVal(val)
    onSearch(val)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy, #1C2B4A)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Journal des Opérations
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, background: '#F1F5F9', color: '#475569', padding: '2px 8px', borderRadius: 10 }}>
            {total}
          </span>
        </div>

        {/* Filtres types rapides */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto', maxWidth: '100%' }}>
          {[
            { key: '', label: 'Tous' },
            { key: 'revenu', label: 'Revenus' },
            { key: 'depense', label: 'Dépenses' },
            { key: 'vente_express', label: 'Ventes' },
          ].map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => onFilterType(f.key)}
              style={{
                padding: '5px 10px',
                fontSize: 11.5,
                fontWeight: 700,
                borderRadius: 8,
                border: activeTypeFilter === f.key ? '1px solid var(--navy, #1C2B4A)' : '1px solid var(--border, #E8DDD2)',
                background: activeTypeFilter === f.key ? 'var(--navy, #1C2B4A)' : '#ffffff',
                color: activeTypeFilter === f.key ? '#ffffff' : '#64748B',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Barre de recherche */}
      <div style={{ position: 'relative', width: '100%' }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
        <input
          type="text"
          value={searchVal}
          onChange={handleSearchChange}
          placeholder="Rechercher une opération, un tiers, une catégorie..."
          style={{
            width: '100%',
            padding: '9px 12px 9px 36px',
            fontSize: 13,
            borderRadius: 10,
            border: '1px solid var(--border, #E8DDD2)',
            background: '#ffffff',
            color: 'var(--navy, #1C2B4A)',
            boxSizing: 'border-box',
            outline: 'none',
          }}
        />
      </div>

      {/* Liste des opérations */}
      {loading ? (
        <div style={{ padding: '24px', textAlign: 'center', color: '#94A3B8', fontSize: 13, fontWeight: 600 }}>
          Chargement du journal...
        </div>
      ) : operations.length === 0 ? (
        <div
          style={{
            padding: '32px 16px',
            textAlign: 'center',
            background: '#ffffff',
            borderRadius: 14,
            border: '1px dashed var(--border, #E8DDD2)',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: '#64748B', marginBottom: 4 }}>
            Aucune opération enregistrée
          </div>
          <div style={{ fontSize: 11.5, color: '#94A3B8' }}>
            Utilisez les boutons rapides ci-dessus pour noter votre première rentrée ou sortie d'argent.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {operations.map((op) => {
            const isEntree = op.direction === 'entree'
            const dateFmt = new Date(op.date_operation).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
            })

            return (
              <div
                key={op.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: '#ffffff',
                  border: '1px solid var(--border, #E8DDD2)',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 9,
                      background: isEntree ? 'rgba(10, 92, 54, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isEntree ? 'var(--price, #0A5C36)' : '#DC2626',
                      flexShrink: 0,
                    }}
                  >
                    {isEntree ? <ArrowUpRight size={18} strokeWidth={2.4} /> : <ArrowDownLeft size={18} strokeWidth={2.4} />}
                  </div>

                  <div style={{ minWidth: 0 }}>
                    {/* Ligne 1 : Libellé + Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy, #1C2B4A)', lineHeight: 1.2 }}>
                        {op.libelle}
                      </span>
                      {op.contexte === 'activite' && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 6, background: '#FFF7ED', color: 'var(--accent, #C75B00)', border: '1px solid #FFEDD5' }}>
                          Activité
                        </span>
                      )}
                    </div>

                    {/* Ligne 2 : Date & Tiers */}
                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 3 }}>
                      {dateFmt} • <span style={{ textTransform: 'capitalize' }}>{op.categorie}</span>
                      {op.tiers_nom && ` • ${op.tiers_nom}`}
                    </div>
                  </div>
                </div>

                {/* Montant & Suppression */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <span
                    style={{
                      fontSize: 13.5,
                      fontWeight: 900,
                      color: isEntree ? 'var(--price, #0A5C36)' : '#DC2626',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {isEntree ? '+' : '-'}{fmt(op.montant)} F
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Voulez-vous supprimer cette opération ?')) {
                        onDeleteOperation(op.id)
                      }
                    }}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#94A3B8',
                      cursor: 'pointer',
                      padding: 4,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title="Supprimer"
                    aria-label="Supprimer opération"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
