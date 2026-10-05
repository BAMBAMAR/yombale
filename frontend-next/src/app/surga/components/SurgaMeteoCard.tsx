'use client'

import React, { useState, useEffect } from 'react'
import {
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  Wind,
  Droplets,
  Waves,
  ShieldAlert,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

export interface PrevisionItem {
  jour: string
  date?: string
  temp_min: number
  temp_max: number
  condition_code: string
  condition_texte: string
}

export interface MeteoData {
  ville: string
  temperature: number
  ressenti: number
  temp_min: number
  temp_max: number
  condition_code: string
  condition_texte: string
  humidite: number
  vent_vitesse_kmh: number
  vent_direction: string
  indice_uv: number
  qualite_air?: {
    aqi: number
    niveau: string
    particules: string
    conseil: string
  }
  maree?: {
    etat: string
    prochaine_heure: string
    hauteur_m: string
    spot_reference: string
  } | null
  previsions_3j?: PrevisionItem[]
  source: string
  updated_at: string
}

interface SurgaMeteoCardProps {
  initialMeteo?: MeteoData | null
  ville?: string
}

function renderMeteoIcon(code: string, size = 20) {
  switch (code) {
    case 'soleil':
      return <Sun size={size} color="var(--accent, #C75B00)" />
    case 'nuageux':
    case 'partiellement_nuageux':
    case 'poussiere':
      return <Cloud size={size} color="var(--navy, #1C2B4A)" />
    case 'pluie':
    case 'averse':
      return <CloudRain size={size} color="var(--navy, #1C2B4A)" />
    case 'orage':
      return <CloudLightning size={size} color="var(--accent, #C75B00)" />
    default:
      return <Sun size={size} color="var(--accent, #C75B00)" />
  }
}

export default function SurgaMeteoCard({ initialMeteo, ville = 'Dakar' }: SurgaMeteoCardProps) {
  const [meteo, setMeteo] = useState<MeteoData | null>(initialMeteo || null)
  const [loading, setLoading] = useState(false)
  const [showPrevisions, setShowPrevisions] = useState(false)

  const chargerMeteo = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/surga/meteo?ville=${encodeURIComponent(ville)}`)
      const data = await res.json()
      if (data.success && data.meteo) {
        setMeteo(data.meteo)
      }
    } catch (err) {
      console.warn('[SURGA METEO FETCH ERR]:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!initialMeteo) {
      chargerMeteo()
    }
  }, [initialMeteo, ville])

  if (!meteo && !loading) {
    return null
  }

  return (
    <div className="surga-card" style={{ marginBottom: 16 }}>
      {/* En-tête de carte */}
      <div className="surga-card-header" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {renderMeteoIcon(meteo?.condition_code || 'soleil', 18)}
          <span className="surga-card-title">Météo &amp; Marées ({meteo?.ville || ville})</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={chargerMeteo}
            disabled={loading}
            aria-label="Actualiser la météo"
            style={{
              background: 'none',
              border: 'none',
              padding: 4,
              cursor: loading ? 'wait' : 'pointer',
              color: 'var(--text3, #73675E)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3, #73675E)' }}>
            {meteo?.condition_texte || 'En direct'}
          </span>
        </div>
      </div>

      {/* Température principale & Conditions directes */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          gap: 16,
          alignItems: 'center',
          padding: '12px 14px',
          backgroundColor: 'var(--bg, #F8F5F0)',
          borderRadius: 10,
          border: '1px solid var(--border, #E8DDD2)',
          marginBottom: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontSize: 32, fontWeight: 900, color: 'var(--navy, #1C2B4A)', lineHeight: 1 }}>
            {meteo?.temperature ?? '--'}°
          </span>
          <span style={{ fontSize: 13, color: 'var(--text3, #73675E)', fontWeight: 600 }}>C</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1, #1A1612)' }}>
            Ressenti {meteo?.ressenti ?? '--'}°C • Min {meteo?.temp_min ?? '--'}° / Max {meteo?.temp_max ?? '--'}°
          </div>
          <div style={{ fontSize: 12, color: 'var(--text2, #5A4E42)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Wind size={12} color="var(--accent, #C75B00)" />
              {meteo?.vent_vitesse_kmh ?? 0} km/h ({meteo?.vent_direction || 'Alizé'})
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Droplets size={12} color="var(--navy, #1C2B4A)" />
              {meteo?.humidite ?? '--'}%
            </span>
          </div>
        </div>
      </div>

      {/* Marées et Qualité de l'Air */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
        {meteo?.maree && (
          <div
            style={{
              padding: '8px 10px',
              borderRadius: 8,
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border, #E8DDD2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
              <Waves size={13} color="var(--navy, #1C2B4A)" />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
                {meteo.maree.etat}
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text2, #5A4E42)' }}>
              Prochaine : {meteo.maree.prochaine_heure} ({meteo.maree.spot_reference})
            </div>
          </div>
        )}

        {meteo?.qualite_air && (
          <div
            style={{
              padding: '8px 10px',
              borderRadius: 8,
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border, #E8DDD2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
              <ShieldAlert size={13} color={meteo.qualite_air.aqi > 70 ? 'var(--accent, #C75B00)' : 'var(--price, #0A5C36)'} />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text1, #1A1612)' }}>
                Air : {meteo.qualite_air.niveau}
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3, #73675E)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              AQI {meteo.qualite_air.aqi} • {meteo.qualite_air.particules}
            </div>
          </div>
        )}
      </div>

      {/* Bouton pour dérouler les prévisions 3 jours */}
      {meteo?.previsions_3j && meteo.previsions_3j.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowPrevisions(!showPrevisions)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 8px',
              background: 'none',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              color: 'var(--accent, #C75B00)',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <span>{showPrevisions ? 'Masquer les prévisions' : 'Voir les prévisions à 3 jours'}</span>
            {showPrevisions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showPrevisions && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
              {meteo.previsions_3j.map((prev, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 6,
                    backgroundColor: 'var(--bg, #F8F5F0)',
                    border: '1px solid var(--border, #E8DDD2)',
                    fontSize: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {renderMeteoIcon(prev.condition_code, 15)}
                    <span style={{ fontWeight: 700, color: 'var(--text1, #1A1612)' }}>{prev.jour}</span>
                    <span style={{ color: 'var(--text3, #73675E)' }}>• {prev.condition_texte}</span>
                  </div>
                  <div style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                    {prev.temp_min}° / {prev.temp_max}°C
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
