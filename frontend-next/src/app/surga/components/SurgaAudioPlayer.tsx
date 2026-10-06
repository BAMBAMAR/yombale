'use client'

import React, { useState, useEffect } from 'react'
import { Play, Pause, Square, Volume2 } from 'lucide-react'
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

export default function SurgaAudioPlayer({ script }: SurgaAudioPlayerProps) {
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

  const enLecture = playerState.statut !== 'arrete'

  return (
    <div
      style={{
        marginTop: 10,
        padding: enLecture ? '10px 12px' : '8px 12px',
        backgroundColor: 'var(--surga-surface, #FFFFFF)',
        borderRadius: 10,
        border: '1px solid var(--surga-border, #E2E8F0)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {/* Ligne principale : Action d'écoute contextuelle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          {/* Bouton Play / Pause compact */}
          <button
            type="button"
            onClick={handleTogglePlay}
            aria-label={playerState.statut === 'lecture' ? 'Mettre en pause' : 'Écouter le briefing'}
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              backgroundColor: 'var(--surga-accent, #D97706)',
              color: '#0F172A',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'transform 0.15s ease',
            }}
          >
            {playerState.statut === 'lecture' ? <Pause size={15} /> : <Play size={15} style={{ marginLeft: 2 }} />}
          </button>

          {/* Bouton Stop conditionnel (seulement en cours de lecture) */}
          {enLecture && (
            <button
              type="button"
              onClick={handleStop}
              aria-label="Arrêter la lecture"
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                backgroundColor: 'var(--surga-bg, #F8FAFC)',
                border: '1px solid var(--surga-border, #E2E8F0)',
                color: 'var(--surga-primary, #0F172A)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <Square size={11} />
            </button>
          )}

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--surga-primary, #0F172A)',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                whiteSpace: 'nowrap',
              }}
            >
              <Volume2 size={13} color="var(--surga-accent, #D97706)" />
              <span>
                {playerState.statut === 'lecture'
                  ? 'Lecture en cours...'
                  : playerState.statut === 'pause'
                  ? 'En pause'
                  : 'Écouter le briefing'}
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--surga-text2, #475569)', fontWeight: 500 }}>
              Synthèse vocale locale (0 Mo)
            </div>
          </div>
        </div>

        {/* Sélecteur de vitesse : STRICTEMENT CONDITIONNEL (n'apparaît que pendant la lecture) */}
        {enLecture && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'var(--surga-bg, #F8FAFC)',
              borderRadius: 6,
              padding: 2,
              border: '1px solid var(--surga-border, #E2E8F0)',
              flexShrink: 0,
            }}
          >
            {[1.0, 1.25, 1.5].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => handleChangerVitesse(v)}
                style={{
                  background: vitesseChoisie === v ? 'var(--surga-primary, #0F172A)' : 'transparent',
                  color: vitesseChoisie === v ? '#FFFFFF' : 'var(--surga-text2, #475569)',
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
        )}
      </div>

      {/* Barre de progression fluide en cours de lecture */}
      {enLecture && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
          <div
            style={{
              flex: 1,
              height: 5,
              backgroundColor: 'var(--surga-bg, #F8FAFC)',
              borderRadius: 3,
              overflow: 'hidden',
              position: 'relative',
              border: '1px solid var(--surga-border, #E2E8F0)',
            }}
          >
            <div
              style={{
                width: `${playerState.progression}%`,
                height: '100%',
                backgroundColor: 'var(--surga-accent, #D97706)',
                transition: 'width 0.3s linear',
              }}
            />
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--surga-text2, #475569)', minWidth: 50, textAlign: 'right' }}>
            {formaterTemps(playerState.tempsEcouleSec)} / {formaterTemps(playerState.tempsTotalEstimeSec)}
          </div>
        </div>
      )}
    </div>
  )
}
