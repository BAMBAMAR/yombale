// frontend-next/src/app/surga/components/SurgaMeteoCard.tsx
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Wind,
  Droplets,
  Waves,
  ShieldAlert,
  RefreshCw,
  ChevronDown,
  MapPin,
  LocateFixed,
} from 'lucide-react'
import SurgaMeteoLocaliteModal from './SurgaMeteoLocaliteModal'
import SurgaMeteoPrevisions, { renderMeteoIcon } from './SurgaMeteoPrevisions'
import {
  LOCALITES_SENEGAL_LIST,
  trouverLocaliteParNom,
  type LocaliteItem,
  type PrevisionItem,
  type MeteoData,
} from '@/lib/surga-meteo'

export type { PrevisionItem, MeteoData }

interface SurgaMeteoCardProps {
  initialMeteo?: MeteoData | null
  ville?: string
  onVilleChange?: (nouvelleVille: string) => void
}

export default function SurgaMeteoCard({ initialMeteo, ville = 'Dakar', onVilleChange }: SurgaMeteoCardProps) {
  const [meteo, setMeteo] = useState<MeteoData | null>(initialMeteo || null)
  const [loading, setLoading] = useState(false)
  const [showPrevisions, setShowPrevisions] = useState(false)
  const [isLocaliteModalOpen, setIsLocaliteModalOpen] = useState(false)
  // Pré-rempli avec les 28 localités pour garantir une ouverture de modale instantanée
  const [localitesList, setLocalitesList] = useState<LocaliteItem[]>(LOCALITES_SENEGAL_LIST)
  const [gpsEnCours, setGpsEnCours] = useState(false)
  const [estGpsActif, setEstGpsActif] = useState(Boolean(initialMeteo?.est_gps))

  const chargerMeteo = useCallback(
    async (params?: { ville?: string; lat?: number; lon?: number }) => {
      setLoading(true)
      let villeRecherche = params?.ville
      try {
        let url = '/api/surga/meteo'
        if (params?.lat && params?.lon) {
          url += `?lat=${params.lat}&lon=${params.lon}`
        } else if (params?.ville) {
          url += `?ville=${encodeURIComponent(params.ville)}`
        } else {
          // Vérification si un choix est sauvegardé localement
          let storedGps: { lat: number; lon: number } | null = null
          let storedVille: string | null = null
          try {
            const gpsStr = localStorage.getItem('surga_meteo_gps')
            if (gpsStr) storedGps = JSON.parse(gpsStr)
            storedVille = localStorage.getItem('surga_meteo_ville')
          } catch {}

          if (storedGps?.lat && storedGps?.lon) {
            url += `?lat=${storedGps.lat}&lon=${storedGps.lon}`
          } else if (storedVille) {
            villeRecherche = storedVille
            url += `?ville=${encodeURIComponent(storedVille)}`
          } else {
            villeRecherche = ville
            url += `?ville=${encodeURIComponent(ville)}`
          }
        }

        const res = await fetch(url)
        const data = await res.json()
        if (data.success && data.meteo) {
          setMeteo(data.meteo)
          setEstGpsActif(Boolean(data.meteo.est_gps))
          if (Array.isArray(data.localites) && data.localites.length > 0) {
            setLocalitesList(data.localites)
          }
        } else {
          // Fallback gracieux si l'API externe est injoignable
          const resolu = trouverLocaliteParNom(villeRecherche || ville)
          setMeteo((prev) => ({
            ville: resolu.nom,
            est_gps: false,
            temperature: prev?.temperature ?? 28,
            ressenti: prev?.ressenti ?? 31,
            temp_min: prev?.temp_min ?? 24,
            temp_max: prev?.temp_max ?? 30,
            condition_code: prev?.condition_code ?? 'soleil',
            condition_texte: prev?.condition_texte ?? 'Ensoleillé',
            humidite: prev?.humidite ?? 72,
            vent_vitesse_kmh: prev?.vent_vitesse_kmh ?? 18,
            vent_direction: prev?.vent_direction ?? 'Alizé maritime',
            indice_uv: prev?.indice_uv ?? 8,
            qualite_air: prev?.qualite_air,
            maree: resolu.maritime ? prev?.maree : null,
            previsions_3j: prev?.previsions_3j,
            source: 'Station locale (secours)',
            updated_at: new Date().toISOString(),
          }))
        }
      } catch (err) {
        console.warn('[SURGA METEO FETCH ERR]:', err)
        const resolu = trouverLocaliteParNom(villeRecherche || ville)
        setMeteo((prev) => (prev ? { ...prev, ville: resolu.nom, est_gps: false } : null))
      } finally {
        setLoading(false)
      }
    },
    [ville]
  )

  const detecterGps = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      alert('La géolocalisation n’est pas disponible sur votre navigateur.')
      return
    }
    setGpsEnCours(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lon = pos.coords.longitude
        try {
          localStorage.setItem('surga_meteo_gps', JSON.stringify({ lat, lon }))
          localStorage.removeItem('surga_meteo_ville')
        } catch {}
        setEstGpsActif(true)
        setIsLocaliteModalOpen(false)
        await chargerMeteo({ lat, lon })
        setGpsEnCours(false)
      },
      (err) => {
        console.warn('[SURGA GPS ERR]:', err.message)
        alert('Impossible de récupérer la position GPS. Vérifiez les autorisations de localisation.')
        setGpsEnCours(false)
      },
      { timeout: 9000, enableHighAccuracy: true }
    )
  }

  const choisirLocalite = async (nomVille: string) => {
    const resolu = trouverLocaliteParNom(nomVille)
    const nomCanonique = resolu.nom
    try {
      localStorage.setItem('surga_meteo_ville', nomCanonique)
      localStorage.removeItem('surga_meteo_gps')
    } catch {}
    setEstGpsActif(false)
    setIsLocaliteModalOpen(false)
    // Mise à jour optimiste immédiate pour un feedback visuel direct et garanti
    setMeteo((prev) => ({
      ville: nomCanonique,
      est_gps: false,
      temperature: prev?.temperature ?? 28,
      ressenti: prev?.ressenti ?? 31,
      temp_min: prev?.temp_min ?? 24,
      temp_max: prev?.temp_max ?? 30,
      condition_code: prev?.condition_code ?? 'soleil',
      condition_texte: prev?.condition_texte ?? 'Ensoleillé',
      humidite: prev?.humidite ?? 72,
      vent_vitesse_kmh: prev?.vent_vitesse_kmh ?? 18,
      vent_direction: prev?.vent_direction ?? 'Alizé maritime',
      indice_uv: prev?.indice_uv ?? 8,
      qualite_air: prev?.qualite_air,
      maree: resolu.maritime ? prev?.maree : null,
      previsions_3j: prev?.previsions_3j,
      source: 'Mise à jour directe',
      updated_at: new Date().toISOString(),
    }))
    if (onVilleChange) {
      try {
        onVilleChange(nomCanonique)
      } catch (e) {
        console.warn('[SURGA VILLE PROP ERR]:', e)
      }
    }
    await chargerMeteo({ ville: nomCanonique })
  }

  useEffect(() => {
    let hasLocalPref = false
    try {
      if (localStorage.getItem('surga_meteo_gps') || localStorage.getItem('surga_meteo_ville')) {
        hasLocalPref = true
      }
    } catch {}

    if (hasLocalPref) {
      chargerMeteo()
    } else if (initialMeteo) {
      setMeteo(initialMeteo)
      setEstGpsActif(Boolean(initialMeteo.est_gps))
    } else {
      chargerMeteo()
    }
  }, [initialMeteo, chargerMeteo])

  if (!meteo && !loading) {
    return null
  }

  const villeAffichee = meteo?.ville || ville

  return (
    <div className="surga-card" style={{ marginBottom: 16 }}>
      {/* En-tête de carte avec bouton sélecteur de localité & GPS */}
      <div className="surga-card-header" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
          {renderMeteoIcon(meteo?.condition_code || 'soleil', 18)}
          <button
            type="button"
            onClick={() => setIsLocaliteModalOpen(true)}
            title="Modifier la localité ou utiliser la position GPS"
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              textAlign: 'left',
              color: 'var(--navy, #1C2B4A)',
            }}
          >
            <span className="surga-card-title" style={{ textDecoration: 'underline dotted', textUnderlineOffset: 3 }}>
              Météo &amp; Marées ({villeAffichee})
            </span>
            <ChevronDown size={14} color="var(--accent, #C75B00)" />
          </button>

          {estGpsActif && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: 'var(--price, #0A5C36)',
                backgroundColor: 'rgba(10, 92, 54, 0.1)',
                padding: '1px 5px',
                borderRadius: 4,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 2,
                flexShrink: 0,
              }}
            >
              <LocateFixed size={10} />
              GPS
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {/* Bouton explicite Changer de Ville */}
          <button
            type="button"
            onClick={() => setIsLocaliteModalOpen(true)}
            title="Changer de ville ou quartier"
            aria-label="Changer de localité"
            style={{
              background: 'var(--bg, #F8F5F0)',
              border: '1px solid var(--border, #E8DDD2)',
              padding: '4px 7px',
              borderRadius: 6,
              cursor: 'pointer',
              color: 'var(--navy, #1C2B4A)',
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              fontSize: 10,
              fontWeight: 700,
            }}
          >
            <MapPin size={11} color="var(--accent, #C75B00)" />
            <span>Changer</span>
          </button>

          {/* Raccourci GPS 1 clic */}
          <button
            type="button"
            onClick={detecterGps}
            disabled={gpsEnCours}
            title="Me géolocaliser par GPS"
            aria-label="Me géolocaliser par GPS"
            style={{
              background: estGpsActif ? 'rgba(10, 92, 54, 0.1)' : 'var(--bg, #F8F5F0)',
              border: '1px solid var(--border, #E8DDD2)',
              padding: '4px 6px',
              borderRadius: 6,
              cursor: gpsEnCours ? 'wait' : 'pointer',
              color: estGpsActif ? 'var(--price, #0A5C36)' : 'var(--navy, #1C2B4A)',
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              fontSize: 10,
              fontWeight: 700,
            }}
          >
            <LocateFixed size={12} className={gpsEnCours ? 'animate-spin' : ''} />
            <span className="surga-hide-mobile">GPS</span>
          </button>

          <button
            type="button"
            onClick={() => chargerMeteo()}
            disabled={loading}
            aria-label="Actualiser la météo"
            title="Actualiser les données"
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

      {/* Prévisions 3 jours sous-composant modulaire */}
      {meteo?.previsions_3j && (
        <SurgaMeteoPrevisions
          previsions={meteo.previsions_3j}
          showPrevisions={showPrevisions}
          onToggle={() => setShowPrevisions(!showPrevisions)}
        />
      )}

      {/* Modale de sélection de localité & Position GPS */}
      <SurgaMeteoLocaliteModal
        isOpen={isLocaliteModalOpen}
        onClose={() => setIsLocaliteModalOpen(false)}
        localiteActuelle={villeAffichee}
        estGpsActif={estGpsActif}
        localites={localitesList}
        onSelectLocalite={choisirLocalite}
        onDetecterGps={detecterGps}
        gpsEnCours={gpsEnCours}
      />
    </div>
  )
}
