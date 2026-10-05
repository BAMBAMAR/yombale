'use client'

import React from 'react'
import { Play, Pause, Volume2, VolumeX, X, Radio, ChevronUp } from 'lucide-react'
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
      style={{
        position: 'fixed',
        bottom: 64,
        left: 0,
        right: 0,
        zIndex: 48,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          height: 52,
          backgroundColor: 'var(--navy, #1C2B4A)',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          boxShadow: '0 -4px 18px rgba(0, 0, 0, 0.22)',
          borderTop: '2px solid var(--accent, #C75B00)',
          pointerEvents: 'auto',
          boxSizing: 'border-box',
        }}
      >
        {/* Zone cliquable ouvrant la modale complète */}
        <button
          type="button"
          onClick={openRadioModal}
          title="Ouvrir la liste des radios sénégalaises"
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
              width: 34,
              height: 34,
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
                  height: 14,
                  width: 14,
                }}
              >
                <span className="surga-eq-bar surga-eq-1" />
                <span className="surga-eq-bar surga-eq-2" />
                <span className="surga-eq-bar surga-eq-3" />
              </div>
            ) : (
              <Radio size={16} color={isPlaying ? 'var(--accent, #C75B00)' : '#FFFFFF'} />
            )}
          </div>

          {/* Informations station & statut */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
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
                  fontSize: 9,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {isBuffering ? 'Connexion...' : 'DIRECT'}
              </span>
            </div>
            <div
              style={{
                fontSize: 10,
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
              <span style={{ color: 'var(--accent, #C75B00)', fontWeight: 600 }}>Changer</span>
              <ChevronUp size={10} color="var(--accent, #C75B00)" />
            </div>
          </div>
        </button>

        {/* Contrôles de lecture rapides */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 8 }}>
          {/* Lecture / Pause */}
          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? 'Mettre en pause' : 'Reprendre la lecture'}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: 'var(--accent, #C75B00)',
              color: '#FFFFFF',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
            }}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} style={{ marginLeft: 2 }} />}
          </button>

          {/* Sourdine */}
          <button
            type="button"
            onClick={toggleMute}
            aria-label={isMuted ? 'Rétablir le son' : 'Couper le son'}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#FFFFFF',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>

          {/* Arrêter définitivement la radio */}
          <button
            type="button"
            onClick={arreter}
            title="Arrêter et fermer la radio"
            aria-label="Arrêter la radio"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}
