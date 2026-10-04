'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Radio as RadioIcon, X, Search } from 'lucide-react'
import SurgaRadioCard from './SurgaRadioCard'
import SurgaRadioMiniPlayer from './SurgaRadioMiniPlayer'

export interface StationRadio {
  id: string
  nom: string
  slogan: string
  frequence: string
  region: string
  categorie: string
  langues: string[]
  url: string
  directMp3: boolean
  bitrateKbps: number
  description: string
  streamUrlProxy: string
}

interface SurgaRadioModalProps {
  isOpen: boolean
  onClose: () => void
}

const ONGLETS_FILTRE = [
  { key: 'toutes', label: 'Toutes' },
  { key: 'dakar', label: 'Dakar & Banlieue' },
  { key: 'terroir', label: 'Régions & Terroirs' },
  { key: 'information', label: 'Information' },
]

export default function SurgaRadioModal({ isOpen, onClose }: SurgaRadioModalProps) {
  const [stations, setStations] = useState<StationRadio[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [recherche, setRecherche] = useState<string>('')
  const [filtreActif, setFiltreActif] = useState<string>('toutes')

  const [stationActive, setStationActive] = useState<StationRadio | null>(null)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [isBuffering, setIsBuffering] = useState<boolean>(false)
  const [isMuted, setIsMuted] = useState<boolean>(false)
  const [erreurLecture, setErreurLecture] = useState<string | null>(null)

  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (!isOpen) return
    let isMounted = true
    async function chargerStations() {
      setLoading(true)
      try {
        const res = await fetch('/api/surga/radios')
        const data = await res.json()
        if (isMounted && data.success && Array.isArray(data.stations)) {
          setStations(data.stations)
        }
      } catch (err) {
        console.error('Erreur chargement radios:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    chargerStations()
    return () => {
      isMounted = false
    }
  }, [isOpen])

  const handleLancerStation = (station: StationRadio) => {
    setErreurLecture(null)
    if (stationActive?.id === station.id && isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
      }
      setIsPlaying(false)
      setIsBuffering(false)
      return
    }

    setStationActive(station)
    setIsBuffering(true)
    setIsPlaying(true)

    if (audioRef.current) {
      audioRef.current.pause()
      const fluxAUtiliser = station.url.startsWith('https') ? station.url : station.streamUrlProxy
      audioRef.current.src = fluxAUtiliser
      audioRef.current
        .play()
        .then(() => {
          setIsBuffering(false)
          setIsPlaying(true)
        })
        .catch((err) => {
          console.warn('Erreur direct, essai proxy:', err)
          if (audioRef.current && fluxAUtiliser !== station.streamUrlProxy) {
            audioRef.current.src = station.streamUrlProxy
            audioRef.current
              .play()
              .then(() => {
                setIsBuffering(false)
                setIsPlaying(true)
              })
              .catch((errProxy) => {
                console.error('Échec radio:', errProxy)
                setIsBuffering(false)
                setIsPlaying(false)
                setErreurLecture(`Flux temporairement indisponible pour ${station.nom}`)
              })
          } else {
            setIsBuffering(false)
            setIsPlaying(false)
            setErreurLecture(`Flux indisponible pour ${station.nom}`)
          }
        })
    }
  }

  const handleArreter = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
    }
    setIsPlaying(false)
    setIsBuffering(false)
    setStationActive(null)
  }

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const stationsFiltrees = useMemo(() => {
    return stations.filter((st) => {
      if (filtreActif === 'dakar') {
        const match = st.region.toLowerCase().includes('dakar') || st.region.toLowerCase().includes('pikine')
        if (!match) return false
      } else if (filtreActif === 'terroir') {
        if (st.categorie !== 'terroir') return false
      } else if (filtreActif === 'information') {
        if (st.categorie !== 'information') return false
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
        <audio
          ref={audioRef}
          preload="none"
          onEnded={() => setIsPlaying(false)}
          onError={() => {
            setIsBuffering(false)
            setIsPlaying(false)
          }}
        />

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
                Directs FM & Low-Data (64-128 kbps)
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
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

        {/* Mini Lecteur en direct */}
        {stationActive && (
          <SurgaRadioMiniPlayer
            station={stationActive}
            isPlaying={isPlaying}
            isBuffering={isBuffering}
            isMuted={isMuted}
            onTogglePlay={handleLancerStation}
            onToggleMute={toggleMute}
            onArreter={handleArreter}
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
          {loading ? (
            <div style={{ padding: 24, textAlign: 'center', fontSize: 12, color: 'var(--text3, #73675E)' }}>
              Chargement des stations...
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
                  onTogglePlay={handleLancerStation}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pied de page Low-Data */}
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
          <span>Flux audio légers (0 vidéo • Faible consommation data)</span>
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
