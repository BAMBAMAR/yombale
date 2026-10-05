'use client'

import React, { useState, useMemo } from 'react'
import { Radio as RadioIcon, X, Search } from 'lucide-react'
import SurgaRadioCard from './SurgaRadioCard'
import SurgaRadioMiniPlayer from './SurgaRadioMiniPlayer'
import { useSurgaRadio, type StationRadio } from '@/lib/surga-radio-context'

export type { StationRadio }

interface SurgaRadioModalProps {
  isOpen: boolean
  onClose: () => void
}

const ONGLETS_FILTRE = [
  { key: 'toutes', label: 'Toutes' },
  { key: 'information', label: 'Information' },
  { key: 'religieux', label: 'Religieux' },
  { key: 'dakar', label: 'Dakar & Banlieue' },
  { key: 'terroir', label: 'Régions & Terroirs' },
]

export default function SurgaRadioModal({ isOpen, onClose }: SurgaRadioModalProps) {
  const {
    stations,
    loadingStations,
    stationActive,
    isPlaying,
    isBuffering,
    isMuted,
    erreurLecture,
    lancerStation,
    toggleMute,
    arreter,
  } = useSurgaRadio()

  const [recherche, setRecherche] = useState<string>('')
  const [filtreActif, setFiltreActif] = useState<string>('toutes')

  const stationsFiltrees = useMemo(() => {
    return stations.filter((st) => {
      if (filtreActif === 'dakar') {
        const match = st.region.toLowerCase().includes('dakar') || st.region.toLowerCase().includes('pikine')
        if (!match) return false
      } else if (filtreActif === 'terroir') {
        if (st.categorie !== 'terroir') return false
      } else if (filtreActif === 'information') {
        if (st.categorie !== 'information') return false
      } else if (filtreActif === 'religieux') {
        if (st.categorie !== 'religieux' && st.id !== 'al-fayda') return false
      }

      if (recherche.trim()) {
        const q = recherche.toLowerCase().trim()
        const matchText =
          st.nom.toLowerCase().includes(q) ||
          st.slogan.toLowerCase().includes(q) ||
          st.region.toLowerCase().includes(q) ||
          st.frequence.toLowerCase().includes(q)
        if (!matchText) return false
      }

      return true
    })
  }, [stations, filtreActif, recherche])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(28, 43, 74, 0.65)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        backdropFilter: 'blur(3px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          maxHeight: '90vh',
          backgroundColor: '#FFFFFF',
          borderRadius: 14,
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div
          style={{
            padding: '14px 16px',
            backgroundColor: 'var(--navy, #1C2B4A)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <RadioIcon size={18} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>
                Radios Locales du Sénégal
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.75)' }}>
                Écoute en direct & Navigation libre dans Surga
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer et continuer de naviguer"
            title="Fermer la liste (la radio continue en arrière-plan)"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#FFFFFF',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Mini Lecteur en direct s'il y a une station active */}
        {stationActive && (
          <SurgaRadioMiniPlayer
            station={stationActive}
            isPlaying={isPlaying}
            isBuffering={isBuffering}
            isMuted={isMuted}
            onTogglePlay={lancerStation}
            onToggleMute={toggleMute}
            onArreter={arreter}
          />
        )}

        {erreurLecture && (
          <div
            style={{
              padding: '6px 14px',
              backgroundColor: '#FEF2F2',
              color: '#991B1B',
              fontSize: 11,
              borderBottom: '1px solid #FCA5A5',
            }}
          >
            {erreurLecture}
          </div>
        )}

        {/* Barre de recherche et filtres */}
        <div style={{ padding: '10px 14px 6px', borderBottom: '1px solid var(--border, #E8DDD2)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              backgroundColor: '#F8F5F0',
              borderRadius: 8,
              padding: '6px 10px',
              border: '1px solid var(--border, #E8DDD2)',
              marginBottom: 8,
            }}
          >
            <Search size={14} color="var(--text3, #73675E)" />
            <input
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher une radio, fréquence, région..."
              style={{
                border: 'none',
                background: 'transparent',
                fontSize: 12,
                color: 'var(--navy, #1C2B4A)',
                outline: 'none',
                width: '100%',
              }}
            />
            {recherche && (
              <button
                type="button"
                onClick={() => setRecherche('')}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <X size={14} color="var(--text3, #73675E)" />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
            {ONGLETS_FILTRE.map((onglet) => {
              const estActif = filtreActif === onglet.key
              return (
                <button
                  key={onglet.key}
                  type="button"
                  onClick={() => setFiltreActif(onglet.key)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 20,
                    border: '1px solid',
                    borderColor: estActif ? 'var(--navy, #1C2B4A)' : 'var(--border, #E8DDD2)',
                    backgroundColor: estActif ? 'var(--navy, #1C2B4A)' : '#FFFFFF',
                    color: estActif ? '#FFFFFF' : 'var(--navy, #1C2B4A)',
                    fontSize: 11,
                    fontWeight: estActif ? 700 : 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {onglet.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Liste des stations */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px' }}>
          {loadingStations ? (
            <div style={{ padding: 24, textAlign: 'center', fontSize: 12, color: 'var(--text3, #73675E)' }}>
              Chargement des stations sénégalaises...
            </div>
          ) : stationsFiltrees.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', fontSize: 12, color: 'var(--text3, #73675E)' }}>
              Aucune station trouvée pour cette recherche.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {stationsFiltrees.map((st) => (
                <SurgaRadioCard
                  key={st.id}
                  station={st}
                  isEnLecture={stationActive?.id === st.id && isPlaying}
                  onTogglePlay={lancerStation}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pied de page Low-Data avec bouton Fermer & Continuer */}
        <div
          style={{
            padding: '8px 14px',
            backgroundColor: '#F8F5F0',
            borderTop: '1px solid var(--border, #E8DDD2)',
            fontSize: 10,
            color: 'var(--text3, #73675E)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>Flux audio légers (Navigation continue active)</span>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--navy, #1C2B4A)',
              cursor: 'pointer',
            }}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
