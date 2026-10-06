'use client'

import React from 'react'
import { Wind, Droplets, Waves, ShieldAlert } from 'lucide-react'
import SurgaMeteoPrevisions from './SurgaMeteoPrevisions'
import type { MeteoData } from '@/lib/surga-meteo'

interface SurgaMeteoDetailBlocProps {
  meteo: MeteoData
  showPrevisions: boolean
  onTogglePrevisions: () => void
}

export default function SurgaMeteoDetailBloc({
  meteo,
  showPrevisions,
  onTogglePrevisions,
}: SurgaMeteoDetailBlocProps) {
  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          gap: 16,
          alignItems: 'center',
          padding: '12px 14px',
          backgroundColor: 'var(--surga-bg, #F8FAFC)',
          borderRadius: 10,
          border: '1px solid var(--surga-border, #E2E8F0)',
          marginBottom: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontSize: 32, fontWeight: 900, color: 'var(--surga-primary, #0F172A)', lineHeight: 1 }}>
            {meteo.temperature ?? '--'}°
          </span>
          <span style={{ fontSize: 13, color: 'var(--surga-text2, #475569)', fontWeight: 600 }}>C</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--surga-text1, #0F172A)' }}>
            Ressenti {meteo.ressenti ?? '--'}°C • Min {meteo.temp_min ?? '--'}° / Max {meteo.temp_max ?? '--'}°
          </div>
          <div style={{ fontSize: 12, color: 'var(--surga-text2, #475569)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Wind size={12} color="var(--surga-accent, #D97706)" />
              {meteo.vent_vitesse_kmh ?? 0} km/h ({meteo.vent_direction || 'Alizé'})
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Droplets size={12} color="var(--surga-primary, #0F172A)" />
              {meteo.humidite ?? '--'}%
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
        {meteo.maree && (
          <div
            style={{
              padding: '8px 10px',
              borderRadius: 8,
              backgroundColor: 'var(--surga-surface, #FFFFFF)',
              border: '1px solid var(--surga-border, #E2E8F0)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
              <Waves size={13} color="var(--surga-primary, #0F172A)" />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--surga-primary, #0F172A)' }}>
                {meteo.maree.etat}
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--surga-text2, #475569)' }}>
              Prochaine : {meteo.maree.prochaine_heure} ({meteo.maree.spot_reference})
            </div>
          </div>
        )}

        {meteo.qualite_air && (
          <div
            style={{
              padding: '8px 10px',
              borderRadius: 8,
              backgroundColor: 'var(--surga-surface, #FFFFFF)',
              border: '1px solid var(--surga-border, #E2E8F0)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
              <ShieldAlert size={13} color={meteo.qualite_air.aqi > 70 ? 'var(--surga-accent, #D97706)' : 'var(--surga-emerald, #059669)'} />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--surga-text1, #0F172A)' }}>
                Air : {meteo.qualite_air.niveau}
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--surga-text2, #475569)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              AQI {meteo.qualite_air.aqi} • {meteo.qualite_air.niveau}
            </div>
          </div>
        )}
      </div>

      {meteo.previsions_3j && (
        <SurgaMeteoPrevisions
          previsions={meteo.previsions_3j}
          showPrevisions={showPrevisions}
          onToggle={onTogglePrevisions}
        />
      )}
    </>
  )
}
