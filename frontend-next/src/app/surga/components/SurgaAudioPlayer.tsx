'use client'

import React, { useState, useEffect } from 'react'
import { Play, Pause, Square, Volume2 } from 'lucide-react'
import {
  demarrerLecture,
  pauseLecture,
  reprendreLecture,
  arreterLecture,
  changerVitesseLecture,
  estSyntheseDisponible,
  prechargerVoix,
  voixRetenueEstEnLigne,
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
  // Une voix diffusée par le réseau consomme des données : la mention « sans connexion » ne s'affiche pas avec elle.
  const [voixEnLigne, setVoixEnLigne] = useState<boolean>(false)

  useEffect(() => {
    const oublier = prechargerVoix(() => setVoixEnLigne(voixRetenueEstEnLigne()))
    return () => {
      oublier()
      arreterLecture()
    }
  }, [])

  const handleTogglePlay = () => {
    if (playerState.statut === 'arrete') {
      demarrerLecture(script, vitesseChoisie, setPlayerState)
    } else if (playerState.statut === 'lecture') {
      pauseLecture()
    } else if (playerState.statut === 'pause') {
      reprendreLecture()
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
    changerVitesseLecture(nouvelleVitesse)
  }

  const formaterTemps = (sec: number) => {
    const min = Math.floor(sec / 60)
    const reste = sec % 60
    return `${min}:${reste < 10 ? '0' : ''}${reste}`
  }

  // Navigateur sans synthèse vocale : le dire, plutôt que de ne rien afficher alors que l'audio est activé.
  if (!isAvailable) {
    return (
      <div role="status" style={{ marginTop: 8, padding: '8px 10px', backgroundColor: 'var(--surga-bg, #F8FAFC)', borderRadius: 8, border: '1px solid var(--surga-border, #E2E8F0)', fontSize: 12, color: 'var(--surga-text2, #475569)' }}>
        Ce navigateur ne propose pas la lecture à voix haute. Ouvrez Surga dans Chrome ou Safari pour écouter le briefing.
      </div>
    )
  }

  const enLecture = playerState.statut !== 'arrete'

  const nbMots = script ? script.trim().split(/\s+/).length : 0
  const dureeEstimeeSec = Math.max(30, Math.round((nbMots / 130) * 60))
  const dureeTexte = dureeEstimeeSec >= 60 ? `${Math.round(dureeEstimeeSec / 60)} min` : `${dureeEstimeeSec} s`

  return (
    <div
      style={{
        marginTop: 8,
        padding: enLecture ? '8px 12px' : '6px 10px',
        backgroundColor: 'var(--surga-bg, #F8FAFC)',
        borderRadius: 8,
        border: '1px solid var(--surga-border, #E2E8F0)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      {/* Ligne discrète d'écoute (SRG-UI-08) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          {/* Bouton Play / Pause discret (neutre, sans bouton orange plein) */}
          <button
            type="button"
            onClick={handleTogglePlay}
            aria-label={playerState.statut === 'lecture' ? 'Mettre en pause' : `Écouter le briefing (${dureeTexte})`}
            style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              backgroundColor: enLecture ? 'var(--surga-primary, #0F172A)' : '#FFFFFF',
              color: enLecture ? '#FFFFFF' : 'var(--surga-primary, #0F172A)',
              border: '1px solid var(--surga-border, #E2E8F0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'background 0.15s ease',
            }}
          >
            {playerState.statut === 'lecture' ? <Pause size={13} /> : <Play size={13} style={{ marginLeft: 2 }} />}
          </button>

          {/* Bouton Stop conditionnel (seulement en cours de lecture) */}
          {enLecture && (
            <button
              type="button"
              onClick={handleStop}
              aria-label="Arrêter la lecture"
              style={{
                width: 26,
                height: 26,
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
              <Square size={10} />
            </button>
          )}

          <div style={{ minWidth: 0, display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--surga-primary, #0F172A)',
                whiteSpace: 'nowrap',
              }}
            >
              {playerState.statut === 'lecture'
                ? 'Lecture en cours...'
                : playerState.statut === 'pause'
                ? 'En pause'
                : `Écouter (${dureeTexte})`}
            </span>
            {!voixEnLigne && (
              <span style={{ fontSize: 12, color: 'var(--surga-text2, #475569)', fontWeight: 500 }}>
                · Lecture sans connexion
              </span>
            )}
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
                  fontSize: 12,
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
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--surga-text2, #475569)', minWidth: 50, textAlign: 'right' }}>
            {formaterTemps(playerState.tempsEcouleSec)} / {formaterTemps(playerState.tempsTotalEstimeSec)}
          </div>
        </div>
      )}
    </div>
  )
}
