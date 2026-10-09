'use client'

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'

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

export interface SurgaRadioContextType {
  stations: StationRadio[]
  loadingStations: boolean
  echecStations: boolean
  rechargerStations: () => void
  stationActive: StationRadio | null
  isPlaying: boolean
  isBuffering: boolean
  isMuted: boolean
  erreurLecture: string | null
  isRadioModalOpen: boolean
  openRadioModal: () => void
  closeRadioModal: () => void
  lancerStation: (station: StationRadio) => void
  togglePlay: () => void
  toggleMute: () => void
  passerSuivante: () => void
  passerPrecedente: () => void
  arreter: () => void
}

const SurgaRadioContext = createContext<SurgaRadioContextType | undefined>(undefined)

export function SurgaRadioProvider({ children }: { children: React.ReactNode }) {
  const [stations, setStations] = useState<StationRadio[]>([])
  const [loadingStations, setLoadingStations] = useState<boolean>(false)
  const [echecStations, setEchecStations] = useState<boolean>(false)
  const [stationActive, setStationActive] = useState<StationRadio | null>(null)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [isBuffering, setIsBuffering] = useState<boolean>(false)
  const [isMuted, setIsMuted] = useState<boolean>(false)
  const [erreurLecture, setErreurLecture] = useState<string | null>(null)
  const [isRadioModalOpen, setIsRadioModalOpen] = useState<boolean>(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const proxyTriedRef = useRef<boolean>(false)

  // Chargement des stations au montage, puis à la demande (« Réessayer »). SRG-A3-006 : un échec se dit, au lieu
  // de laisser la fenêtre afficher « Aucune station trouvée ». Les stations déjà chargées restent à l'écran.
  const monteRef = useRef<boolean>(true)
  const rechargerStations = useCallback(async () => {
    setLoadingStations(true)
    setEchecStations(false)
    try {
      const res = await fetch('/api/surga/radios')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (!data?.success || !Array.isArray(data.stations)) throw new Error('réponse en échec')
      if (monteRef.current) setStations(data.stations)
    } catch {
      if (monteRef.current) setEchecStations(true)
    } finally {
      if (monteRef.current) setLoadingStations(false)
    }
  }, [])

  useEffect(() => {
    monteRef.current = true
    rechargerStations()
    return () => {
      monteRef.current = false
    }
  }, [rechargerStations])

  // Synchronisation MediaSession API pour contrôles natifs mobile / écran de verrouillage
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return

    if (stationActive) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: stationActive.nom,
          artist: `${stationActive.frequence} • ${stationActive.region}`,
          album: 'Surga Radios du Sénégal',
          artwork: [
            { src: 'https://nopalou.com/icons/icon-192.png?v=19', sizes: '192x192', type: 'image/png' },
            { src: 'https://nopalou.com/icons/icon-512.png?v=19', sizes: '512x512', type: 'image/png' },
          ],
        })

        navigator.mediaSession.setActionHandler('play', () => {
          if (audioRef.current && !isPlaying) {
            audioRef.current.play().catch(() => {})
          }
        })
        navigator.mediaSession.setActionHandler('pause', () => {
          if (audioRef.current && isPlaying) {
            audioRef.current.pause()
          }
        })
        navigator.mediaSession.setActionHandler('stop', () => {
          arreter()
        })
      } catch {}
    } else {
      try {
        navigator.mediaSession.metadata = null
      } catch {}
    }
  }, [stationActive, isPlaying])

  const openRadioModal = useCallback(() => setIsRadioModalOpen(true), [])
  const closeRadioModal = useCallback(() => setIsRadioModalOpen(false), [])

  const arreter = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
    }
    setIsPlaying(false)
    setIsBuffering(false)
    setStationActive(null)
    setErreurLecture(null)
    proxyTriedRef.current = false
  }, [])

  const lancerStation = useCallback((station: StationRadio) => {
    setErreurLecture(null)

    // Si on clique sur la station déjà en cours de lecture
    if (stationActive?.id === station.id && isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      setIsPlaying(false)
      setIsBuffering(false)
      return
    }

    // Si on clique sur la station déjà active mais en pause
    if (stationActive?.id === station.id && !isPlaying && audioRef.current?.src) {
      setIsBuffering(true)
      audioRef.current
        .play()
        .then(() => {
          setIsBuffering(false)
          setIsPlaying(true)
        })
        .catch(() => {
          setIsBuffering(false)
          setIsPlaying(false)
        })
      return
    }

    // Nouvelle station
    setStationActive(station)
    setIsBuffering(true)
    setIsPlaying(true)
    proxyTriedRef.current = false

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
          console.warn('Erreur lecture directe radio, essai proxy:', err)
          if (audioRef.current && fluxAUtiliser !== station.streamUrlProxy) {
            proxyTriedRef.current = true
            audioRef.current.src = station.streamUrlProxy
            audioRef.current
              .play()
              .then(() => {
                setIsBuffering(false)
                setIsPlaying(true)
              })
              .catch((errProxy) => {
                console.error('Échec flux proxy radio:', errProxy)
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
  }, [stationActive, isPlaying])

  const togglePlay = useCallback(() => {
    if (!stationActive) return
    if (isPlaying) {
      if (audioRef.current) audioRef.current.pause()
      setIsPlaying(false)
      setIsBuffering(false)
    } else {
      if (audioRef.current) {
        setIsBuffering(true)
        audioRef.current
          .play()
          .then(() => {
            setIsBuffering(false)
            setIsPlaying(true)
          })
          .catch(() => {
            setIsBuffering(false)
            setIsPlaying(false)
          })
      }
    }
  }, [stationActive, isPlaying])

  const toggleMute = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }, [isMuted])

  const passerSuivante = useCallback(() => {
    if (!stations.length) return
    const currentIndex = stationActive ? stations.findIndex((s) => s.id === stationActive.id) : -1
    const nextIndex = (currentIndex + 1) % stations.length
    lancerStation(stations[nextIndex])
  }, [stations, stationActive, lancerStation])

  const passerPrecedente = useCallback(() => {
    if (!stations.length) return
    const currentIndex = stationActive ? stations.findIndex((s) => s.id === stationActive.id) : 0
    const prevIndex = (currentIndex - 1 + stations.length) % stations.length
    lancerStation(stations[prevIndex])
  }, [stations, stationActive, lancerStation])

  return (
    <SurgaRadioContext.Provider
      value={{
        stations,
        loadingStations,
        echecStations,
        rechargerStations,
        stationActive,
        isPlaying,
        isBuffering,
        isMuted,
        erreurLecture,
        isRadioModalOpen,
        openRadioModal,
        closeRadioModal,
        lancerStation,
        togglePlay,
        toggleMute,
        passerSuivante,
        passerPrecedente,
        arreter,
      }}
    >
      {/* Élément audio persistant dans tout Surga */}
      <audio
        ref={audioRef}
        preload="none"
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => {
          setIsBuffering(false)
          setIsPlaying(true)
          setErreurLecture(null)
        }}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false)
          setIsBuffering(false)
        }}
        onError={() => {
          if (!proxyTriedRef.current && stationActive && audioRef.current?.src !== stationActive.streamUrlProxy) {
            proxyTriedRef.current = true
            if (audioRef.current) {
              audioRef.current.src = stationActive.streamUrlProxy
              audioRef.current.play().catch(() => {
                setIsBuffering(false)
                setIsPlaying(false)
                setErreurLecture(`Flux indisponible pour ${stationActive?.nom || 'cette radio'}`)
              })
            }
          } else {
            setIsBuffering(false)
            setIsPlaying(false)
            setErreurLecture(`Flux indisponible pour ${stationActive?.nom || 'cette radio'}`)
          }
        }}
      />
      {children}
    </SurgaRadioContext.Provider>
  )
}

export function useSurgaRadio() {
  const context = useContext(SurgaRadioContext)
  if (!context) {
    throw new Error('useSurgaRadio doit être utilisé au sein d’un SurgaRadioProvider')
  }
  return context
}
