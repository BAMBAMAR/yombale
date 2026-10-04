'use client'

import React, { useState, useEffect } from 'react'
import { Play, Pause, Square, Radio, Volume2, Headphones } from 'lucide-react'
import {
  demarrerLecture,
  pauseLecture,
  reprendreLecture,
  arreterLecture,
  estSyntheseDisponible,
  type AudioPlayerState,
} from '@/lib/surga-audio'

interface SurgaAudioPlayerProps {
  script: string
  onOpenPodcastModal?: () => void
  onOpenRadiosModal?: () => void
}

export default function SurgaAudioPlayer({
  script,
  onOpenPodcastModal,
  onOpenRadiosModal,
}: SurgaAudioPlayerProps) {
  const [playerState, setPlayerState] = useState<AudioPlayerState>({
    statut: 'arrete',
    progression: 0,
    tempsEcouleSec: 0,
    tempsTotalEstimeSec: 0,
    vitesse: 1.0,
  })

  const [vitesseChoisie, setVitesseChoisie] = useState<number>(1.0)
  const isAvailable = estSyntheseDisponible()

  useEffect(() => {
    return () => {
      arreterLecture()
    }
  }, [])

  const handleTogglePlay = () => {
    if (playerState.statut === 'arrete') {
      demarrerLecture(script, vitesseChoisie, setPlayerState)
    } else if (playerState.statut === 'lecture') {
      pauseLecture()
      setPlayerState((prev) => ({ ...prev, statut: 'pause' }))
    } else if (playerState.statut === 'pause') {
      reprendreLecture()
      setPlayerState((prev) => ({ ...prev, statut: 'lecture' }))
    }
  }

  const handleStop = () => {
    arreterLecture()
    setPlayerState({
      statut: 'arrete',
      progression: 0,
      tempsEcouleSec: 0,
      tempsTotalEstimeSec: playerState.tempsTotalEstimeSec,
      vitesse: vitesseChoisie,
    })
  }

  const handleChangerVitesse = (nouvelleVitesse: number) => {
    setVitesseChoisie(nouvelleVitesse)
    if (playerState.statut === 'lecture' || playerState.statut === 'pause') {
      demarrerLecture(script, nouvelleVitesse, setPlayerState)
    }
  }

  const formaterTemps = (sec: number) => {
    const min = Math.floor(sec / 60)
    const reste = sec % 60
    return `${min}:${reste < 10 ? '0' : ''}${reste}`
  }

  if (!isAvailable) {
    return null
  }

  return (
    <div
      style={{
        marginTop: 10,
        padding: '10px 12px',
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        border: '1px solid var(--border, #E8DDD2)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {/* Ligne 1 : Contrôles principaux */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Bouton Play / Pause */}
          <button
            type="button"
            onClick={handleTogglePlay}
            aria-label={playerState.statut === 'lecture' ? 'Mettre en pause' : 'Écouter le briefing'}
            className="surga-btn-primary"
            style={{
              width: 34,
              height: 34,
              padding: 0,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {playerState.statut === 'lecture' ? <Pause size={15} /> : <Play size={15} style={{ marginLeft: 2 }} />}
          </button>

          {/* Bouton Stop si lecture en cours */}
          {playerState.statut !== 'arrete' && (
            <button
              type="button"
              onClick={handleStop}
              aria-label="Arrêter la lecture"
              className="surga-btn-secondary"
              style={{
                width: 30,
                height: 30,
                padding: 0,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Square size={12} />
            </button>
          )}

          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy, #1C2B4A)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Volume2 size={14} color="var(--accent, #C75B00)" />
              <span>
                {playerState.statut === 'lecture'
                  ? 'Lecture en cours...'
                  : playerState.statut === 'pause'
                  ? 'En pause'
                  : 'Écouter le briefing'}
              </span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text3, #73675E)' }}>
              Synthèse vocale locale (0 Mo)
            </div>
          </div>
        </div>

        {/* Sélecteur de vitesse & Bouton Podcast */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Sélecteur de vitesse */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'var(--bg, #F8F5F0)',
              borderRadius: 6,
              padding: 2,
              border: '1px solid var(--border, #E8DDD2)',
            }}
          >
            {[1.0, 1.25, 1.5].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => handleChangerVitesse(v)}
                style={{
                  background: vitesseChoisie === v ? 'var(--navy, #1C2B4A)' : 'transparent',
                  color: vitesseChoisie === v ? '#FFFFFF' : 'var(--text2, #5A4E42)',
                  border: 'none',
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '2px 5px',
                  cursor: 'pointer',
                }}
              >
                {v}x
              </button>
            ))}
          </div>

          {/* Bouton Radios Locales FM */}
          {onOpenRadiosModal && (
            <button
              type="button"
              onClick={onOpenRadiosModal}
              title="Écouter les radios sénégalaises en direct"
              className="surga-btn-secondary"
              style={{
                padding: '4px 8px',
                fontSize: 11,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                borderRadius: 6,
              }}
            >
              <Radio size={12} color="var(--accent, #C75B00)" />
              <span>Radios FM</span>
            </button>
          )}

          {/* Bouton Flux Podcast */}
          {onOpenPodcastModal && (
            <button
              type="button"
              onClick={onOpenPodcastModal}
              title="Obtenir le flux Podcast privé"
              className="surga-btn-secondary"
              style={{
                padding: '4px 8px',
                fontSize: 11,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                borderRadius: 6,
              }}
            >
              <Headphones size={12} color="var(--navy, #1C2B4A)" />
              <span>Podcast</span>
            </button>
          )}
        </div>
      </div>

      {/* Ligne 2 : Barre de progression */}
      {playerState.statut !== 'arrete' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
          <div
            style={{
              flex: 1,
              height: 5,
              backgroundColor: '#EDE8E1',
              borderRadius: 3,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div
              style={{
                width: `${playerState.progression}%`,
                height: '100%',
                backgroundColor: 'var(--accent, #C75B00)',
                transition: 'width 0.3s linear',
              }}
            />
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3, #73675E)', minWidth: 50, textAlign: 'right' }}>
            {formaterTemps(playerState.tempsEcouleSec)} / {formaterTemps(playerState.tempsTotalEstimeSec)}
          </div>
        </div>
      )}
    </div>
  )
}
