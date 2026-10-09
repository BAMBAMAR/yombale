'use client'

import React, { useState, useEffect } from 'react'
import {
  Radio,
  Play,
  Pause,
  RefreshCw,
  ExternalLink,
  Volume2,
  Headphones,
  Signal,
  CheckCircle2,
} from 'lucide-react'

interface RadioStation {
  id: string
  nom: string
  slogan: string
  frequence: string
  region: string
  categorie: string
  langues: string[]
  url: string
  bitrateKbps?: number
  description?: string
}

export default function AdminRadiosTab() {
  const [stations, setStations] = useState<RadioStation[]>([])
  const [chargement, setChargement] = useState(true)
  const [stationActive, setStationActive] = useState<RadioStation | null>(null)
  const [audioEnLecture, setAudioEnLecture] = useState(false)
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)

  useEffect(() => {
    fetch('/api/surga/radios')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.stations)) {
          setStations(d.stations)
        }
      })
      .catch(() => {})
      .finally(() => setChargement(false))

    return () => {
      if (audioElement) {
        audioElement.pause()
        audioElement.src = ''
      }
    }
  }, [audioElement])

  const toggleRadio = (station: RadioStation) => {
    if (stationActive?.id === station.id && audioEnLecture) {
      if (audioElement) {
        audioElement.pause()
      }
      setAudioEnLecture(false)
      return
    }

    if (audioElement) {
      audioElement.pause()
    }

    const audio = new Audio(station.url)
    audio.play().then(() => {
      setStationActive(station)
      setAudioEnLecture(true)
      setAudioElement(audio)
    }).catch((err) => {
      console.warn('Erreur lecture flux radio:', err)
      setAudioEnLecture(false)
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Lecteur de test actif en haut */}
      {stationActive && (
        <div
          style={{
            backgroundColor: 'var(--surga-navy)',
            color: '#FFFFFF',
            borderRadius: 12,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 12px rgba(28, 43, 74, 0.15)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                backgroundColor: 'rgba(199, 91, 0, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--surga-accent)',
              }}
            >
              <Volume2 size={24} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--surga-accent)', fontWeight: 800, textTransform: 'uppercase' }}>
                Test Flux Audio en Direct
              </div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>{stationActive.nom}</div>
              <div style={{ fontSize: 12, color: '#D1D5DB' }}>{stationActive.frequence} &bull; {stationActive.slogan}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => toggleRadio(stationActive)}
            style={{
              padding: '10px 18px',
              borderRadius: 8,
              border: 'none',
              backgroundColor: 'var(--surga-accent)',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {audioEnLecture ? <Pause size={16} /> : <Play size={16} />}
            <span>{audioEnLecture ? 'Arrêter' : 'Reprendre'}</span>
          </button>
        </div>
      )}

      {/* Grille des stations */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 12, border: '1px solid var(--surga-border)', padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--surga-navy)' }}>
              Bouquet des Radios Locales du Sénégal
            </div>
            <div style={{ fontSize: 12, color: 'var(--surga-text3)', marginTop: 2 }}>
              Stations directes vérifiées et intégrées dans le mini-lecteur Surga.
            </div>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--surga-price)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle2 size={15} />
            {stations.length} stations enregistrées
          </span>
        </div>

        {chargement ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--surga-text3)' }}>
            Chargement des stations...
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
            {stations.map((st) => {
              const isPlaying = stationActive?.id === st.id && audioEnLecture
              return (
                <div
                  key={st.id}
                  style={{
                    borderRadius: 10,
                    border: `1px solid ${isPlaying ? 'var(--surga-accent)' : 'var(--surga-border)'}`,
                    backgroundColor: isPlaying ? 'rgba(199, 91, 0, 0.04)' : 'var(--surga-bg)',
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--surga-accent)' }}>
                        {st.frequence}
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, backgroundColor: 'rgba(28, 43, 74, 0.08)', color: 'var(--surga-navy)' }}>
                        {st.region}
                      </span>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--surga-navy)', marginTop: 4 }}>
                      {st.nom}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--surga-text3)', marginTop: 4, lineHeight: 1.4 }}>
                      {st.slogan}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--surga-border)' }}>
                    <span style={{ fontSize: 11, color: 'var(--surga-text3)' }}>
                      {st.bitrateKbps ? `${st.bitrateKbps} kbps MP3` : 'Direct Stream'}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleRadio(st)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 6,
                        border: 'none',
                        backgroundColor: isPlaying ? '#DC2626' : 'var(--surga-navy)',
                        color: '#FFFFFF',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      {isPlaying ? <Pause size={13} /> : <Play size={13} />}
                      <span>{isPlaying ? 'Stop' : 'Tester'}</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Configuration du Podcast Privé */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 12, border: '1px solid var(--surga-border)', padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <Headphones size={20} color="var(--surga-navy)" />
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--surga-navy)' }}>
            Flux Podcast Privé Surga
          </div>
        </div>
        <p style={{ fontSize: 13, color: 'var(--surga-text3)', margin: '0 0 14px' }}>
          Flux audio RSS sécurisé générant automatiquement les briefings audio et revues de presse matinales pour les abonnés Premium.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <code style={{ padding: '8px 12px', backgroundColor: 'var(--surga-bg)', borderRadius: 6, border: '1px solid var(--surga-border)', fontSize: 12, color: 'var(--surga-navy)', fontFamily: 'monospace' }}>
            GET /api/surga/audio/feed.xml?token=...
          </code>
          <span style={{ fontSize: 12, color: 'var(--surga-price)', fontWeight: 700 }}>
            Flux actif &bull; Format Podcast Apple / AntennaPod certifié
          </span>
        </div>
      </div>
    </div>
  )
}
