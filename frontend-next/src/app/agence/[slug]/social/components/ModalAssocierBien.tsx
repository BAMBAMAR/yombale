'use client'

import React, { useState } from 'react'
import { X, Search, Sparkles, Home, Check } from 'lucide-react'
import { BienItem, SocialPostItem } from '../types'
import { matchBiensClient } from '../matching-immo-client'

interface ModalAssocierBienProps {
  post: SocialPostItem
  biens: BienItem[]
  onClose: () => void
  onSave: (bien: BienItem | null) => void
}

export function ModalAssocierBien({
  post,
  biens,
  onClose,
  onSave,
}: ModalAssocierBienProps) {
  const currentBienId = post.biens_associes?.[0]?.id || ''
  const [selectedBienId, setSelectedBienId] = useState<string>(currentBienId)
  const [search, setSearch] = useState<string>('')

  // Calcul des suggestions intelligentes
  const suggestions = post.caption ? matchBiensClient(post.caption, biens) : []
  const suggestedIds = new Set(suggestions.map(s => s.bien.id))

  const filteredBiens = biens.filter(b => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      b.titre?.toLowerCase().includes(q) ||
      b.quartier?.toLowerCase().includes(q) ||
      b.type_bien?.toLowerCase().includes(q)
    )
  })

  function handleConfirm() {
    if (!selectedBienId) {
      onSave(null)
    } else {
      const chosen = biens.find(b => b.id === selectedBienId) || null
      onSave(chosen)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 12,
          padding: 22,
          maxWidth: 480,
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
            Associer un bien immobilier
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: 12.5, color: '#64748B', margin: '0 0 14px' }}>
          Liez le bien présenté dans la vidéo pour permettre aux clients de réserver une visite en 1 clic.
        </p>

        {/* Barre de recherche */}
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Rechercher par titre, quartier, type..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '7px 10px 7px 32px',
              borderRadius: 8,
              border: '1px solid var(--border, #E8DDD2)',
              fontSize: 12.5,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Liste des biens */}
        <div
          style={{
            overflowY: 'auto',
            maxHeight: 280,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            marginBottom: 16,
          }}
        >
          {/* Option Aucun bien */}
          <div
            onClick={() => setSelectedBienId('')}
            style={{
              padding: '8px 10px',
              borderRadius: 8,
              border: selectedBienId === '' ? '2px solid var(--navy, #1C2B4A)' : '1px solid var(--border, #E8DDD2)',
              background: selectedBienId === '' ? '#F8FAFC' : '#FFFFFF',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 700,
              color: '#64748B',
            }}
          >
            -- Aucun bien associé --
          </div>

          {filteredBiens.map(b => {
            const isSelected = selectedBienId === b.id
            const isSuggested = suggestedIds.has(b.id)
            const prix = b.prix_location || b.prix_vente || 0

            return (
              <div
                key={b.id}
                onClick={() => setSelectedBienId(b.id)}
                style={{
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: isSelected ? '2px solid var(--navy, #1C2B4A)' : '1px solid var(--border, #E8DDD2)',
                  background: isSelected ? '#F0F9FF' : '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                {b.images?.[0] ? (
                  <img
                    src={b.images[0]}
                    alt=""
                    style={{ width: 42, height: 42, borderRadius: 6, objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 6,
                      background: '#F1F5F9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#94A3B8',
                    }}
                  >
                    <Home size={18} />
                  </div>
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 750,
                        color: 'var(--navy, #1C2B4A)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {b.titre}
                    </span>
                    {isSuggested && (
                      <span
                        style={{
                          background: '#DBEAFE',
                          color: '#1D4ED8',
                          fontSize: 9.5,
                          fontWeight: 800,
                          padding: '1px 5px',
                          borderRadius: 4,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                        }}
                      >
                        <Sparkles size={9} /> Match IA
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: '#166534', fontWeight: 800 }}>
                    {Number(prix).toLocaleString('fr-FR')} FCFA {b.prix_location ? '/ mois' : ''}
                    {b.quartier ? ` • ${b.quartier}` : ''}
                  </div>
                </div>

                {isSelected && <Check size={16} style={{ color: 'var(--navy, #1C2B4A)' }} />}
              </div>
            )
          })}
        </div>

        {/* Boutons d'action */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 'auto' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              background: '#F1F5F9',
              color: '#64748B',
              border: 'none',
              fontWeight: 700,
              fontSize: 12.5,
              cursor: 'pointer',
            }}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              background: 'var(--accent, #C75B00)',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 800,
              fontSize: 12.5,
              cursor: 'pointer',
            }}
          >
            Valider
          </button>
        </div>
      </div>
    </div>
  )
}
