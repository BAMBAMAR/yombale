'use client'

import React, { useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Trash2, Search, Calendar, Wallet } from 'lucide-react'
import {
  type KalpeOperationLocal,
  deleteKalpeOperation,
} from '@/lib/surga-kalpe'
import { isXaalisMasque } from '@/lib/surga-xaalis-security'

interface SurgaKalpeJournalTabProps {
  operations: KalpeOperationLocal[]
  onRefresh: () => void
}

function getModeBadge(mode?: string) {
  if (!mode) return null
  const labels: Record<string, { label: string; bg: string; color: string }> = {
    wave: { label: 'Wave', bg: '#E0F2FE', color: '#0369A1' },
    om: { label: 'Orange Money', bg: '#FFEDD5', color: '#C2410C' },
    cash: { label: 'Cash', bg: '#F3F4F6', color: '#374151' },
    virement: { label: 'Virement', bg: '#F1F5F9', color: '#475569' },
  }
  const config = labels[mode] || { label: mode, bg: '#F3F4F6', color: '#374151' }
  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 800,
        padding: '2px 6px',
        borderRadius: 4,
        backgroundColor: config.bg,
        color: config.color,
      }}
    >
      {config.label}
    </span>
  )
}

export default function SurgaKalpeJournalTab({
  operations,
  onRefresh,
}: SurgaKalpeJournalTabProps) {
  const [filtreType, setFiltreType] = useState<'all' | 'entree' | 'sortie'>('all')
  const [recherche, setRecherche] = useState('')
  const [masque, setMasque] = useState(false)

  React.useEffect(() => {
    setMasque(isXaalisMasque())
    const handlePrivacy = () => setMasque(isXaalisMasque())
    window.addEventListener('surga-xaalis-privacy-change', handlePrivacy)
    return () => window.removeEventListener('surga-xaalis-privacy-change', handlePrivacy)
  }, [])

  const handleSupprimer = (id: string) => {
    if (confirm('Supprimer cette opération ?')) {
      deleteKalpeOperation(id)
      onRefresh()
    }
  }

  const operationsFiltrees = operations.filter((op) => {
    if (filtreType === 'entree' && op.direction !== 'entree') return false
    if (filtreType === 'sortie' && op.direction !== 'sortie') return false
    if (recherche) {
      const q = recherche.toLowerCase()
      return (
        op.libelle.toLowerCase().includes(q) ||
        op.categorie.toLowerCase().includes(q)
      )
    }
    return true
  })

  return (
    <div>
      {/* Barre de filtres & recherche */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { id: 'all', label: 'Toutes' },
            { id: 'entree', label: 'Entrées' },
            { id: 'sortie', label: 'Dépenses' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFiltreType(tab.id as any)}
              style={{
                flex: 1,
                padding: '6px 10px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: filtreType === tab.id ? 'var(--navy, #1C2B4A)' : 'var(--bg, #F8F5F0)',
                color: filtreType === tab.id ? '#FFFFFF' : 'var(--text2, #5A4E42)',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            borderRadius: 8,
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border, #E8DDD2)',
          }}
        >
          <Search size={15} color="var(--text3, #73675E)" />
          <input
            type="text"
            placeholder="Rechercher une opération..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            style={{
              border: 'none',
              background: 'transparent',
              width: '100%',
              outline: 'none',
              fontSize: 13,
              color: 'var(--text1, #1A1612)',
            }}
          />
        </div>
      </div>

      {/* Liste des opérations */}
      {operationsFiltrees.length === 0 ? (
        <div
          style={{
            padding: '32px 16px',
            textAlign: 'center',
            borderRadius: 12,
            backgroundColor: 'var(--bg, #F8F5F0)',
            border: '1px dashed var(--border, #E8DDD2)',
          }}
        >
          <Wallet size={24} color="var(--text3, #73675E)" style={{ margin: '0 auto 8px auto' }} />
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2, #5A4E42)' }}>
            Aucune opération trouvée
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3, #73675E)', marginTop: 2 }}>
            Utilisez les boutons d’action en haut pour saisir une transaction.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {operationsFiltrees.map((op) => {
            const isEntree = op.direction === 'entree'
            return (
              <div
                key={op.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: 10,
                  backgroundColor: '#FFFFFF',
                  border: '1px solid var(--border, #E8DDD2)',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isEntree ? 'rgba(10,92,54,0.1)' : 'rgba(28,43,74,0.08)',
                      color: isEntree ? 'var(--price, #0A5C36)' : 'var(--navy, #1C2B4A)',
                      flexShrink: 0,
                    }}
                  >
                    {isEntree ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: 'var(--text1, #1A1612)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {op.libelle}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: 'var(--text3, #73675E)' }}>
                        {op.categorie}
                      </span>
                      {getModeBadge(op.mode_paiement)}
                      <span style={{ fontSize: 12, color: 'var(--text3, #73675E)' }}>
                        • {op.date_operation}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: isEntree ? 'var(--price, #0A5C36)' : 'var(--navy, #1C2B4A)',
                      textAlign: 'right',
                    }}
                  >
                    {isEntree ? '+' : '-'} {masque ? '•••••• F' : `${op.montant.toLocaleString('fr-FR')} F`}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSupprimer(op.id)}
                    aria-label="Supprimer"
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 4,
                      cursor: 'pointer',
                      color: 'var(--text3, #73675E)',
                    }}
                  >
                    <Trash2 size={14} />
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
