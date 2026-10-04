'use client'

import React from 'react'
import { RotateCcw, Volume2, Radio, Navigation, Building } from 'lucide-react'

interface SurgaParametresTabProps {
  preferences: any
  onToggleAudio: () => void
  onOpenRadio: () => void
  onOpenTrafic: () => void
  onOpenImmo: () => void
  onOpenConcours: () => void
  onReinitialiser: () => void
}

export default function SurgaParametresTab({
  preferences,
  onToggleAudio,
  onOpenRadio,
  onOpenTrafic,
  onOpenImmo,
  onOpenConcours,
  onReinitialiser,
}: SurgaParametresTabProps) {
  return (
    <div className="surga-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
        Paramètres Surga
      </div>
      <p style={{ fontSize: 13, color: 'var(--text2, #5A4E42)', margin: 0 }}>
        Heure du briefing : <strong>{preferences?.heure_briefing || '07:30'}</strong> &bull; Quartier :{' '}
        <strong>{preferences?.quartiers?.[0] || 'Dakar'}</strong>
      </p>

      {/* Option Audio */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 10,
          borderTop: '1px solid var(--border, #E8DDD2)',
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
            Option Audio du briefing
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3, #73675E)' }}>
            Synthèse vocale et flux podcast privé (0 Mo)
          </div>
        </div>
        <button
          type="button"
          onClick={onToggleAudio}
          className={preferences?.audio_actif ? 'surga-btn-primary' : 'surga-btn-secondary'}
          style={{ fontSize: 11, padding: '5px 12px' }}
        >
          {preferences?.audio_actif ? 'Activée' : 'Désactivée'}
        </button>
      </div>

      {/* Radios locales */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 10,
          borderTop: '1px solid var(--border, #E8DDD2)',
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
            Radios Locales du Sénégal
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3, #73675E)' }}>
            Directs FM &amp; revues de presse matinales
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenRadio}
          className="surga-btn-secondary"
          style={{ fontSize: 11, padding: '5px 12px' }}
        >
          Écouter
        </button>
      </div>

      {/* Trafic Dakar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 10,
          borderTop: '1px solid var(--border, #E8DDD2)',
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
            Trafic &amp; Corridors Dakar
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3, #73675E)' }}>
            État A1, VDN, Corniche, TER &amp; BRT
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenTrafic}
          className="surga-btn-secondary"
          style={{ fontSize: 11, padding: '5px 12px' }}
        >
          Consulter
        </button>
      </div>

      {/* Immobilier Dakar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 10,
          borderTop: '1px solid var(--border, #E8DDD2)',
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
            Immobilier &amp; Alertes Logement
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3, #73675E)' }}>
            Recherche de biens et notifications d alertes
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenImmo}
          className="surga-btn-secondary"
          style={{ fontSize: 11, padding: '5px 12px' }}
        >
          Ouvrir
        </button>
      </div>

      {/* Concours & Examens du Sénégal */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 10,
          borderTop: '1px solid var(--border, #E8DDD2)',
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
            Concours &amp; Examens Nationaux
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3, #73675E)' }}>
            Suivi des dossiers et rappels J-30 / J-7 / J-1
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenConcours}
          className="surga-btn-secondary"
          style={{ fontSize: 11, padding: '5px 12px' }}
        >
          Consulter
        </button>
      </div>

      {/* Bouton de réinitialisation */}
      <button
        type="button"
        onClick={onReinitialiser}
        className="surga-btn-secondary"
        style={{ fontSize: 13, padding: '8px 14px', alignSelf: 'flex-start', marginTop: 4 }}
      >
        <RotateCcw size={14} />
        <span>Modifier mes préférences</span>
      </button>
    </div>
  )
}
