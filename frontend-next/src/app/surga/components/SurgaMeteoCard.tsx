// frontend-next/src/app/surga/components/SurgaMeteoCard.tsx
'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  RefreshCw,
  ChevronDown,
  ChevronUp,
  LocateFixed,
} from 'lucide-react'
import SurgaMeteoLocaliteModal from './SurgaMeteoLocaliteModal'
import SurgaMeteoDetailBloc from './SurgaMeteoDetailBloc'
import { renderMeteoIcon } from './SurgaMeteoPrevisions'
import {
  LOCALITES_SENEGAL_LIST,
  trouverLocaliteParNom,
  estLocaliteMaritime,
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
  const [estDeplie, setEstDeplie] = useState(false)
  // Localité demandée, affichée pendant le chargement et quand la météo manque.
  const [villeDemandee, setVilleDemandee] = useState<string | null>(null)

  // Numéro de la dernière demande : une réponse plus ancienne (la localité d'avant, arrivée en retard) est ignorée.
  const derniereDemande = useRef(0)

  const chargerMeteo = useCallback(
    async (params?: { ville?: string; lat?: number; lon?: number }) => {
      const numero = ++derniereDemande.current
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

        const res = await fetch(url, { signal: AbortSignal.timeout(20000) })
        const data = await res.json()
        if (numero !== derniereDemande.current) return
        if (data.success && data.meteo) {
          setMeteo(data.meteo)
          setEstGpsActif(Boolean(data.meteo.est_gps))
          if (Array.isArray(data.localites) && data.localites.length > 0) {
            setLocalitesList(data.localites)
          }
        } else {
          // SRG-A2-009 / D43 : pas de valeur de remplacement. L'ancien repli affichait 28 °C et « Ensoleillé ».
          setMeteo(null)
        }
      } catch (err) {
        console.warn('[SURGA METEO FETCH ERR]:', err)
        if (numero === derniereDemande.current) setMeteo(null)
      } finally {
        if (numero === derniereDemande.current) setLoading(false)
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
    // Le relevé de l'ancienne localité n'est pas montré sous le nom de la nouvelle : la carte attend la réponse.
    setVilleDemandee(nomCanonique)
    setMeteo(null)
    setLoading(true)
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

  const villeAffichee = meteo?.ville || villeDemandee || ville
  const estMaritime = estLocaliteMaritime(villeAffichee)

  return (
    <div className="surga-card" style={{ marginBottom: 16 }}>
      {/* En-tête de carte avec bouton sélecteur de localité & GPS */}
      <div className="surga-card-header" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
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
            gap: 6,
            textAlign: 'left',
            color: 'var(--surga-primary, #0F172A)',
            minHeight: 38,
            minWidth: 0,
            flex: 1,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            {renderMeteoIcon(meteo?.condition_code || 'nuageux', 18)}
            <span
              className="surga-card-title"
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: 'var(--surga-primary, #0F172A)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {`Météo · ${villeAffichee}`}
            </span>
            <ChevronDown size={14} color="var(--surga-accent, #D97706)" style={{ flexShrink: 0 }} />
          </div>

          {estGpsActif && (
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--surga-emerald-ink, #047857)',
                backgroundColor: 'var(--surga-emerald-soft, rgba(5, 150, 105, 0.1))',
                padding: '2px 6px',
                borderRadius: 6,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                flexShrink: 0,
              }}
            >
              <LocateFixed size={10} />
              GPS
            </span>
          )}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => chargerMeteo()}
            disabled={loading}
            aria-label="Actualiser la météo"
            title="Actualiser les données météo"
            style={{
              background: 'var(--surga-bg, #F8FAFC)',
              border: '1px solid var(--surga-border, #E2E8F0)',
              borderRadius: 8,
              width: 32,
              height: 32,
              padding: 0,
              cursor: loading ? 'wait' : 'pointer',
              color: 'var(--surga-text2, #475569)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Ligne d'aperçu : température et ciel reçus de la source, ou l'état « indisponible » */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          padding: '8px 12px',
          backgroundColor: 'var(--surga-bg, #F8FAFC)',
          borderRadius: 8,
          border: '1px solid var(--surga-border, #E2E8F0)',
          marginBottom: estDeplie ? 10 : 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flexWrap: 'wrap' }}>
          {meteo ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {renderMeteoIcon(meteo.condition_code, 18)}
              <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--surga-primary, #0F172A)' }}>
                {meteo.temperature}°C
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--surga-text1, #0F172A)' }}>
                {meteo.condition_texte}
              </span>
              {meteo.non_actualise && (
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--surga-accent-text, #92400E)' }}>non actualisé</span>
              )}
            </div>
          ) : (
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--surga-text2, #475569)' }}>
              {loading ? `Chargement de la météo de ${villeAffichee}…` : `Météo de ${villeAffichee} indisponible pour le moment.`}
            </span>
          )}
        </div>

        {!meteo && !loading && (
          <button
            type="button"
            onClick={() => chargerMeteo(villeDemandee ? { ville: villeDemandee } : undefined)}
            style={{ background: 'none', border: 'none', padding: '8px 6px', minHeight: 32, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: 'var(--surga-accent-ink, #A64B08)', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, whiteSpace: 'nowrap' }}
          >
            <RefreshCw size={13} />
            <span>Réessayer</span>
          </button>
        )}
        {meteo && (
        <button
          type="button"
          onClick={() => setEstDeplie(!estDeplie)}
          style={{
            background: 'none',
            border: 'none',
            padding: '4px 6px',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--surga-accent-ink, #A64B08)',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
        >
          <span>{estDeplie ? 'Moins' : 'Détails'}</span>
          {estDeplie ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
        )}
      </div>

      {/* Détails complets repliables via sous-composant modulaire */}
      {estDeplie && meteo && (
        <SurgaMeteoDetailBloc
          meteo={meteo}
          estMaritime={estMaritime}
          showPrevisions={showPrevisions}
          onTogglePrevisions={() => setShowPrevisions(!showPrevisions)}
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
