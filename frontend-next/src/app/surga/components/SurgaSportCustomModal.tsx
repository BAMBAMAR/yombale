'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Search, Check, Plus, Trophy, RefreshCw } from 'lucide-react'

export interface EquipeItem {
  id: string
  nom: string
  categorie: string
  championnat?: string
  pays: string
}

interface SurgaSportCustomModalProps {
  isOpen: boolean
  onClose: () => void
  equipesSelectionnees: string[]
  onEnregistrer: (nouvellesEquipes: string[]) => void
}

const DEFAULT_EQUIPES: EquipeItem[] = [
  { id: 'senegal', nom: 'Sénégal (Lions de la Teranga)', categorie: 'nationale', championnat: 'Sélections CAF', pays: 'Sénégal' },
  { id: 'real_madrid', nom: 'Real Madrid', categorie: 'laliga', championnat: 'LaLiga & UCL', pays: 'Espagne' },
  { id: 'barcelona', nom: 'FC Barcelone', categorie: 'laliga', championnat: 'LaLiga & UCL', pays: 'Espagne' },
  { id: 'atletico', nom: 'Atlético de Madrid', categorie: 'laliga', championnat: 'LaLiga & UCL', pays: 'Espagne' },
  { id: 'man_city', nom: 'Manchester City', categorie: 'premier_league', championnat: 'Premier League & UCL', pays: 'Angleterre' },
  { id: 'arsenal', nom: 'Arsenal FC', categorie: 'premier_league', championnat: 'Premier League & UCL', pays: 'Angleterre' },
  { id: 'liverpool', nom: 'Liverpool FC', categorie: 'premier_league', championnat: 'Premier League & UCL', pays: 'Angleterre' },
  { id: 'chelsea', nom: 'Chelsea FC (Nicolas Jackson)', categorie: 'premier_league', championnat: 'Premier League', pays: 'Angleterre' },
  { id: 'tottenham', nom: 'Tottenham (Pape Matar Sarr)', categorie: 'premier_league', championnat: 'Premier League', pays: 'Angleterre' },
  { id: 'man_united', nom: 'Manchester United', categorie: 'premier_league', championnat: 'Premier League', pays: 'Angleterre' },
  { id: 'everton', nom: 'Everton (Iliman Ndiaye, I. Gueye)', categorie: 'premier_league', championnat: 'Premier League', pays: 'Angleterre' },
  { id: 'crystal_palace', nom: 'Crystal Palace (Ismaïla Sarr)', categorie: 'premier_league', championnat: 'Premier League', pays: 'Angleterre' },
  { id: 'psg', nom: 'Paris Saint-Germain', categorie: 'ligue1_fr', championnat: 'Ligue 1 & UCL', pays: 'France' },
  { id: 'marseille', nom: 'Olympique de Marseille', categorie: 'ligue1_fr', championnat: 'Ligue 1', pays: 'France' },
  { id: 'monaco', nom: 'AS Monaco', categorie: 'ligue1_fr', championnat: 'Ligue 1 & UCL', pays: 'France' },
  { id: 'lyon', nom: 'Olympique Lyonnais', categorie: 'ligue1_fr', championnat: 'Ligue 1', pays: 'France' },
  { id: 'bayern', nom: 'Bayern Munich', categorie: 'ucl', championnat: 'Bundesliga & UCL', pays: 'Allemagne' },
  { id: 'inter_milan', nom: 'Inter Milan', categorie: 'serie_a', championnat: 'Serie A & UCL', pays: 'Italie' },
  { id: 'juventus', nom: 'Juventus Turin', categorie: 'serie_a', championnat: 'Serie A & UCL', pays: 'Italie' },
  { id: 'milan_ac', nom: 'AC Milan', categorie: 'serie_a', championnat: 'Serie A & UCL', pays: 'Italie' },
  { id: 'al_nassr', nom: 'Al Nassr (Sadio Mané)', categorie: 'saudi_pro', championnat: 'Saudi Pro League', pays: 'Arabie Saoudite' },
  { id: 'al_hilal', nom: 'Al Hilal (Kalidou Koulibaly)', categorie: 'saudi_pro', championnat: 'Saudi Pro League', pays: 'Arabie Saoudite' },
  { id: 'jaraaf', nom: 'ASC Jaraaf de Dakar', categorie: 'ligue1_sn', championnat: 'Ligue 1 Sénégal', pays: 'Sénégal' },
  { id: 'teungueth', nom: 'Teungueth FC', categorie: 'ligue1_sn', championnat: 'Ligue 1 Sénégal', pays: 'Sénégal' },
  { id: 'generation_foot', nom: 'Génération Foot', categorie: 'ligue1_sn', championnat: 'Ligue 1 Sénégal', pays: 'Sénégal' },
  { id: 'guediawaye', nom: 'Guédiawaye FC', categorie: 'ligue1_sn', championnat: 'Ligue 1 Sénégal', pays: 'Sénégal' },
  { id: 'casa_sports', nom: 'Casa Sports de Ziguinchor', categorie: 'ligue1_sn', championnat: 'Ligue 1 Sénégal', pays: 'Sénégal' },
  { id: 'as_pikine', nom: 'AS Pikine', categorie: 'ligue1_sn', championnat: 'Ligue 1 Sénégal', pays: 'Sénégal' },
]

export default function SurgaSportCustomModal({
  isOpen,
  onClose,
  equipesSelectionnees,
  onEnregistrer,
}: SurgaSportCustomModalProps) {
  const [catalogue, setCatalogue] = useState<EquipeItem[]>(DEFAULT_EQUIPES)
  const [selection, setSelection] = useState<string[]>([])
  const [recherche, setRecherche] = useState('')
  const [filtreLigue, setFiltreLigue] = useState<string>('tous')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      setSelection(Array.isArray(equipesSelectionnees) ? [...equipesSelectionnees] : [])
      setRecherche('')
      setFiltreLigue('tous')
      setLoading(true)

      fetch('/api/surga/sport/equipes')
        .then((r) => r.json())
        .then((data) => {
          if (data.success && Array.isArray(data.equipes) && data.equipes.length > 0) {
            setCatalogue(data.equipes)
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [isOpen])

  if (!isOpen || !mounted || typeof document === 'undefined') return null

  const isEquipeSelectionnee = (eq: EquipeItem) => {
    return selection.some((item) => {
      const lower = item.toLowerCase().trim()
      return (
        lower === eq.nom.toLowerCase().trim() ||
        lower === eq.id.toLowerCase().trim() ||
        eq.nom.toLowerCase().includes(lower)
      )
    })
  }

  const toggleEquipe = (eq: EquipeItem) => {
    if (isEquipeSelectionnee(eq)) {
      setSelection((prev) =>
        prev.filter((item) => {
          const lower = item.toLowerCase().trim()
          return (
            lower !== eq.nom.toLowerCase().trim() &&
            lower !== eq.id.toLowerCase().trim() &&
            !eq.nom.toLowerCase().includes(lower)
          )
        })
      )
    } else {
      setSelection((prev) => [...prev, eq.nom])
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

  const catalogueFiltre = catalogue.filter((eq) => {
    if (filtreLigue === 'europe' && !['laliga', 'premier_league', 'ligue1_fr', 'serie_a', 'ucl'].includes(eq.categorie)) return false
    if (filtreLigue === 'ligue1_sn' && eq.categorie !== 'ligue1_sn') return false
    if (filtreLigue === 'nationale' && eq.categorie !== 'nationale') return false
    if (filtreLigue === 'saudi_pro' && eq.categorie !== 'saudi_pro') return false

    if (recherche.trim()) {
      const q = recherche.toLowerCase().trim()
      return (
        eq.nom.toLowerCase().includes(q) ||
        eq.pays.toLowerCase().includes(q) ||
        (eq.championnat && eq.championnat.toLowerCase().includes(q))
      )
    }
    return true
  })

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.55)',
        zIndex: 99999,
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
        onClick={(e) => e.stopPropagation()}
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

        {/* Barre de recherche & filtres de ligues */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border, #E8DDD2)', display: 'flex', flexDirection: 'column', gap: 8 }}>
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
              placeholder="Rechercher Real, Chelsea, Jaraaf, Barça, PSG..."
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

          {/* Onglets de ligues */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', whiteSpace: 'nowrap' }}>
            {[
              { id: 'tous', label: 'Toutes' },
              { id: 'europe', label: 'Europe (UCL, PL, LaLiga...)' },
              { id: 'ligue1_sn', label: 'Ligue 1 Sénégal' },
              { id: 'saudi_pro', label: 'Saudi Pro' },
              { id: 'nationale', label: 'Sélection SN' },
            ].map((lig) => (
              <button
                key={lig.id}
                type="button"
                onClick={() => setFiltreLigue(lig.id)}
                style={{
                  padding: '4px 8px',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: filtreLigue === lig.id ? 'var(--navy, #1C2B4A)' : 'var(--bg, #F8F5F0)',
                  color: filtreLigue === lig.id ? '#FFFFFF' : 'var(--text2, #5A4E42)',
                }}
              >
                {lig.label}
              </button>
            ))}
          </div>
        </div>

        {/* Liste des équipes à cocher */}
        <div className="surga-liste-fixe" style={{ padding: '12px 20px', overflowY: 'auto', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {loading && catalogue.length === 0 ? (
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
              const isSelected = isEquipeSelectionnee(eq)
              return (
                <button
                  key={eq.id}
                  type="button"
                  onClick={() => toggleEquipe(eq)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: 10,
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'rgba(199,91,0,0.08)' : 'var(--bg, #F8F5F0)',
                    border: `1.5px solid ${isSelected ? 'var(--accent, #C75B00)' : 'var(--border, #E8DDD2)'}`,
                    textAlign: 'left',
                    transition: 'background-color 0.15s ease, border-color 0.15s ease',
                    fontFamily: 'inherit',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0, paddingRight: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1, #1A1612)' }}>
                      {eq.nom}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text3, #73675E)', marginTop: 2 }}>
                      {eq.championnat || eq.pays} • {eq.pays}
                    </div>
                  </div>

                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isSelected ? 'var(--accent, #C75B00)' : '#FFFFFF',
                      border: `1px solid ${isSelected ? 'var(--accent, #C75B00)' : 'var(--border, #E8DDD2)'}`,
                      color: '#FFFFFF',
                      flexShrink: 0,
                      pointerEvents: 'none',
                    }}
                  >
                    {isSelected ? <Check size={15} strokeWidth={3} /> : <Plus size={15} color="var(--text3, #73675E)" strokeWidth={2.5} />}
                  </div>
                </button>
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
    </div>,
    document.body
  )
}
