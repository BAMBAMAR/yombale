'use client'

import React from 'react'
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, X, Radio, ChevronUp } from 'lucide-react'
import { useSurgaRadio } from '@/lib/surga-radio-context'

export default function SurgaPersistentRadioBar() {
  const {
    stationActive,
    isPlaying,
    isBuffering,
    isMuted,
    isRadioModalOpen,
    openRadioModal,
    togglePlay,
    toggleMute,
    passerSuivante,
    passerPrecedente,
    arreter,
  } = useSurgaRadio()

  // N'afficher la barre persistante que si une station est sélectionnée et que la modale complète n'est pas déjà ouverte
  if (!stationActive || isRadioModalOpen) {
    return null
  }

  return (
    <aside
      className="surga-persistent-radio-bar"
      role="region"
      aria-label={`Lecteur radio en direct : ${stationActive.nom}`}
    >
      <div className="surga-persistent-radio-inner">
        {/* Zone cliquable ouvrant le catalogue complet des radios */}
        <button
          type="button"
          onClick={openRadioModal}
          title="Ouvrir la liste complète des radios sénégalaises"
          aria-label={`Radio ${stationActive.nom}, cliquer pour ouvrir le catalogue`}
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'transparent',
            border: 'none',
            color: '#FFFFFF',
            textAlign: 'left',
            cursor: 'pointer',
            padding: 0,
            margin: 0,
          }}
        >
          {/* Égaliseur animé / Icône Radio */}
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: isPlaying ? 'rgba(199, 91, 0, 0.25)' : 'rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              border: isPlaying ? '1px solid var(--accent, #C75B00)' : '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            {isPlaying && !isBuffering ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  gap: 2,
                  height: 13,
                  width: 13,
                }}
              >
                <span className="surga-eq-bar surga-eq-1" />
                <span className="surga-eq-bar surga-eq-2" />
                <span className="surga-eq-bar surga-eq-3" />
              </div>
            ) : (
              <Radio size={15} color={isPlaying ? 'var(--accent, #C75B00)' : '#FFFFFF'} />
            )}
          </div>

          {/* Informations station & statut en direct */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                className="surga-radio-station-nom"
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  color: '#FFFFFF',
                }}
              >
                {stationActive.nom}
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  padding: '1px 5px',
                  borderRadius: 4,
                  backgroundColor: isBuffering ? 'var(--accent, #C75B00)' : 'var(--price, #0A5C36)',
                  color: '#FFFFFF',
                  fontSize: 12,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {isBuffering ? 'Connexion...' : 'DIRECT'}
              </span>
            </div>
            <div
              style={{
                fontSize: 12,
                color: 'rgba(255, 255, 255, 0.75)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span>{stationActive.frequence}</span>
              <span>•</span>
              <span>{stationActive.region}</span>
              <span>•</span>
              <span style={{ color: 'var(--surga-accent-ink, #A64B08)', fontWeight: 600 }}>Changer</span>
              <ChevronUp size={10} color="var(--accent, #C75B00)" />
            </div>
          </div>
        </button>

        {/* Contrôles de lecture complets avec Zapping Précédent & Suivant */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, marginLeft: 6 }}>
          {/* Station précédente */}
          <button
            type="button"
            onClick={passerPrecedente}
            title="Station précédente"
            aria-label="Passer à la station radio précédente"
            className="surga-radio-ctrl-btn"
          >
            <SkipBack size={15} />
          </button>

          {/* Lecture / Pause */}
          <button
            type="button"
            onClick={togglePlay}
            title={isPlaying ? 'Mettre en pause' : 'Reprendre la lecture'}
            aria-label={isPlaying ? 'Mettre en pause' : 'Reprendre la lecture'}
            style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              backgroundColor: 'var(--accent, #C75B00)',
              color: '#FFFFFF',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
              flexShrink: 0,
            }}
          >
            {isPlaying ? <Pause size={13} /> : <Play size={13} style={{ marginLeft: 2 }} />}
          </button>

          {/* Station suivante */}
          <button
            type="button"
            onClick={passerSuivante}
            title="Station suivante"
            aria-label="Passer à la station radio suivante"
            className="surga-radio-ctrl-btn"
          >
            <SkipForward size={15} />
          </button>

          {/* Sourdine / Volume */}
          <button
            type="button"
            onClick={toggleMute}
            title={isMuted ? 'Rétablir le son' : 'Couper le son'}
            aria-label={isMuted ? 'Rétablir le son' : 'Couper le son'}
            className="surga-radio-ctrl-btn"
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>

          {/* Arrêter définitivement la radio */}
          <button
            type="button"
            onClick={arreter}
            title="Arrêter et fermer le lecteur"
            aria-label="Arrêter la radio"
            className="surga-radio-ctrl-btn"
            style={{ color: 'rgba(255, 255, 255, 0.6)' }}
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </aside>
  )
}
