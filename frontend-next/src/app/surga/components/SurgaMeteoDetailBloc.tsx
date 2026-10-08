'use client'

import React from 'react'
import { Wind, Droplets, Waves, ShieldAlert } from 'lucide-react'
import SurgaMeteoPrevisions from './SurgaMeteoPrevisions'
import { libelleReleveMeteo } from '@/lib/surga-meteo'
import type { MeteoData } from '@/lib/surga-meteo'

interface SurgaMeteoDetailBlocProps {
  meteo: MeteoData
  estMaritime?: boolean
  showPrevisions: boolean
  onTogglePrevisions: () => void
}

export default function SurgaMeteoDetailBloc({
  meteo,
  estMaritime = true,
  showPrevisions,
  onTogglePrevisions,
}: SurgaMeteoDetailBlocProps) {
  // Une marée dont l'heure est passée n'est plus « la prochaine » : elle n'est pas affichée.
  const maree = meteo.maree && (!meteo.maree.prochaine_le || new Date(meteo.maree.prochaine_le).getTime() > Date.now()) ? meteo.maree : null
  const afficherMaree = estMaritime && Boolean(maree)
  const air = meteo.qualite_air || null
  // La source ne publie pas toujours le ressenti ni les extrêmes du jour : seuls les chiffres reçus sont écrits.
  const resume = [
    meteo.ressenti != null ? `Ressenti ${meteo.ressenti}°C` : null,
    meteo.temp_min != null && meteo.temp_max != null ? `Min ${meteo.temp_min}° / Max ${meteo.temp_max}°` : null,
  ].filter(Boolean).join(' • ') || meteo.condition_texte
  const estimations = [afficherMaree ? 'marée' : null, air ? 'qualité de l’air' : null].filter(Boolean).join(' et ')

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
            {resume}
          </div>
          <div style={{ fontSize: 12, color: 'var(--surga-text2, #475569)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Wind size={12} color="var(--surga-accent, #D97706)" />
              {meteo.vent_vitesse_kmh ?? '--'} km/h{meteo.vent_direction ? ` (${meteo.vent_direction})` : ''}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Droplets size={12} color="var(--surga-primary, #0F172A)" />
              {meteo.humidite ?? '--'}%
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: afficherMaree ? '1fr 1fr' : '1fr', gap: 8, marginBottom: 10 }}>
        {afficherMaree && maree && (
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
                {maree.etat}
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--surga-text2, #475569)' }}>
              {maree.prochaine_type || 'Prochaine'} vers {maree.prochaine_heure}
            </div>
          </div>
        )}

        {air && (
          <div
            style={{
              padding: '8px 10px',
              borderRadius: 8,
              backgroundColor: 'var(--surga-surface, #FFFFFF)',
              border: '1px solid var(--surga-border, #E2E8F0)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
              <ShieldAlert size={13} color={air.aqi > 100 ? 'var(--surga-accent, #D97706)' : 'var(--surga-emerald, #059669)'} />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--surga-text1, #0F172A)' }}>
                Air : {air.niveau}
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--surga-text2, #475569)' }}>
              {air.indice || 'AQI'} {air.aqi}{air.particules ? ` • ${air.particules}` : ''}
            </div>
          </div>
        )}
      </div>

      {/* D53 : une brique sans source, ou dont la source se tait, est dite « indisponible ». */}
      {(!air || (estMaritime && !maree)) && (
        <div style={{ fontSize: 11, color: 'var(--surga-text2, #475569)', marginBottom: 10 }}>
          {estMaritime && !maree && !air
            ? 'Marées et qualité de l’air : indisponibles pour le moment.'
            : estMaritime && !maree
              ? 'Marées : indisponibles pour le moment.'
              : 'Qualité de l’air : indisponible pour le moment.'}
        </div>
      )}

      <div style={{ fontSize: 11, color: 'var(--surga-text3, #64748B)', marginBottom: 10 }}>
        Source : {libelleReleveMeteo(meteo)}
        {estimations && ` ; ${estimations} : Open-Meteo, estimation par modèle${afficherMaree ? ', à ne pas utiliser pour naviguer' : ''}.`}
      </div>

      {meteo.previsions_3j && meteo.previsions_3j.length > 0 && (
        <SurgaMeteoPrevisions
          previsions={meteo.previsions_3j}
          showPrevisions={showPrevisions}
          onToggle={onTogglePrevisions}
        />
      )}
    </>
  )
}
