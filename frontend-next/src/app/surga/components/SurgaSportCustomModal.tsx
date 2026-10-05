'use client'

import React, { useState, useEffect } from 'react'
import { X, Search, Check, Plus, Trophy, RefreshCw } from 'lucide-react'

export interface EquipeItem {
  id: string
  nom: string
  categorie: string
  pays: string
}

interface SurgaSportCustomModalProps {
  isOpen: boolean
  onClose: () => void
  equipesSelectionnees: string[]
  onEnregistrer: (nouvellesEquipes: string[]) => void
}

export default function SurgaSportCustomModal({
  isOpen,
  onClose,
  equipesSelectionnees,
  onEnregistrer,
}: SurgaSportCustomModalProps) {
  const [catalogue, setCatalogue] = useState<EquipeItem[]>([])
  const [selection, setSelection] = useState<string[]>(equipesSelectionnees)
  const [recherche, setRecherche] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setSelection(equipesSelectionnees)
      setLoading(true)
      fetch('/api/surga/sport/equipes')
        .then((r) => r.json())
        .then((data) => {
          if (data.success && Array.isArray(data.equipes)) {
            setCatalogue(data.equipes)
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [isOpen, equipesSelectionnees])

  if (!isOpen) return null

  const toggleEquipe = (nomEquipe: string) => {
    if (selection.includes(nomEquipe)) {
      setSelection(selection.filter((e) => e !== nomEquipe))
    } else {
      setSelection([...selection, nomEquipe])
    }
  }

  const handleValider = async () => {
    setSaving(true)
    try {
      localStorage.setItem('surga_equipes_favorites', JSON.stringify(selection))
      await fetch('/api/surga/sport/mes-equipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ equipes: selection }),
      })
    } catch {}
    setSaving(false)
    onEnregistrer(selection)
    onClose()
  }

  const catalogueFiltre = catalogue.filter((eq) =>
    eq.nom.toLowerCase().includes(recherche.toLowerCase()) ||
    eq.pays.toLowerCase().includes(recherche.toLowerCase())
  )

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.55)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Personnaliser mes équipes sportives"
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          overflow: 'hidden',
        }}
      >
        {/* En-tête */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border, #E8DDD2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Trophy size={18} color="var(--accent, #C75B00)" />
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
              Mes Équipes Favorites
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            style={{
              background: 'none',
              border: 'none',
              padding: 4,
              cursor: 'pointer',
              color: 'var(--text3, #73675E)',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Barre de recherche */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border, #E8DDD2)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              borderRadius: 8,
              backgroundColor: 'var(--bg, #F8F5F0)',
              border: '1px solid var(--border, #E8DDD2)',
            }}
          >
            <Search size={16} color="var(--text3, #73675E)" />
            <input
              type="text"
              placeholder="Rechercher un club ou une sélection..."
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

        {/* Liste des équipes à cocher */}
        <div style={{ padding: '12px 20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {loading ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text3, #73675E)' }}>
              <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 8px auto' }} />
              Chargement des équipes...
            </div>
          ) : catalogueFiltre.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text3, #73675E)', fontSize: 13 }}>
              Aucune équipe trouvée pour cette recherche.
            </div>
          ) : (
            catalogueFiltre.map((eq) => {
              const isSelected = selection.includes(eq.nom) || selection.includes(eq.id)
              return (
                <div
                  key={eq.id}
                  onClick={() => toggleEquipe(eq.nom)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'rgba(199,91,0,0.08)' : 'var(--bg, #F8F5F0)',
                    border: `1px solid ${isSelected ? 'var(--accent, #C75B00)' : 'var(--border, #E8DDD2)'}`,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1, #1A1612)' }}>
                      {eq.nom}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3, #73675E)' }}>
                      {eq.pays} • {eq.categorie === 'nationale' ? 'Sélection nationale' : eq.categorie === 'ligue1_sn' ? 'Ligue 1 Sénégal' : 'International'}
                    </div>
                  </div>

                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isSelected ? 'var(--accent, #C75B00)' : '#FFFFFF',
                      border: `1px solid ${isSelected ? 'var(--accent, #C75B00)' : 'var(--border, #E8DDD2)'}`,
                      color: '#FFFFFF',
                    }}
                  >
                    {isSelected ? <Check size={14} /> : <Plus size={14} color="var(--text3, #73675E)" />}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Pied de page avec actions */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--border, #E8DDD2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#FFFFFF',
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2, #5A4E42)' }}>
            {selection.length} sélectionnée{selection.length > 1 ? 's' : ''}
          </span>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: '1px solid var(--border, #E8DDD2)',
                background: 'transparent',
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--text2, #5A4E42)',
                cursor: 'pointer',
              }}
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleValider}
              disabled={saving}
              style={{
                padding: '8px 18px',
                borderRadius: 8,
                border: 'none',
                background: 'var(--accent, #C75B00)',
                color: '#FFFFFF',
                fontSize: 13,
                fontWeight: 800,
                cursor: saving ? 'wait' : 'pointer',
              }}
            >
              {saving ? 'Enregistrement...' : 'Enregistrer mes équipes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
