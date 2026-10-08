'use client'

// Colonne de droite du bureau : trafic et météo.
// SRG-A3-005 : ces deux blocs affichaient du texte fixe (« VDN fluide 14 min », « 28°C • Ensoleillé », « Marée haute :
// 17h45 », « Mis à jour il y a 4 min »), quelle que soit la réponse du serveur. Ils lisent désormais les mêmes routes
// que les cartes du téléphone, et disent « indisponible » quand la donnée manque (D43, D53).

import React, { useEffect, useState } from 'react'
import { Navigation, Sun } from 'lucide-react'
import { estLocaliteMaritime, estZoneCouverteParTrafic, libelleReleveMeteo } from '@/lib/surga-meteo'
import type { MeteoData } from '@/lib/surga-meteo'
import { axeRenseigne, libelleNiveau, origineAxe, MESSAGE_TRAFIC_INDISPONIBLE } from '@/lib/surga-trafic'
import type { AxeTrafic } from '@/lib/surga-trafic'

interface RailProps {
  ville: string
  onOuvrir: () => void
}

const clavier = (action: () => void) => (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') action()
}

const TEXTE_ETAT: React.CSSProperties = { fontSize: 12, color: 'var(--surga-text2, #475569)', padding: '4px 0', lineHeight: 1.4 }
const TEXTE_ORIGINE: React.CSSProperties = { fontSize: 11, color: 'var(--surga-text3, #64748B)', marginTop: 4 }

const COULEUR_NIVEAU: Record<string, string> = {
  bouche: '#B91C1C',
  dense: 'var(--surga-accent-text, #92400E)',
  fluide: 'var(--surga-emerald, #059669)',
}
const PASTILLE_NIVEAU: Record<string, string> = { bouche: 'red', dense: 'orange', fluide: 'green' }

export function SurgaRailTrafic({ ville, onOuvrir }: RailProps) {
  const couvreTrafic = estZoneCouverteParTrafic(ville)
  const [chargement, setChargement] = useState(true)
  const [axes, setAxes] = useState<AxeTrafic[]>([])

  useEffect(() => {
    if (!couvreTrafic) return
    let actif = true
    setChargement(true)
    fetch('/api/surga/trafic')
      .then((r) => r.json())
      .then((d) => { if (actif) setAxes(d?.success && Array.isArray(d.axes) ? d.axes.filter(axeRenseigne) : []) })
      .catch(() => { if (actif) setAxes([]) })
      .finally(() => { if (actif) setChargement(false) })
    return () => { actif = false }
  }, [couvreTrafic])

  const visibles = axes.slice(0, 2)

  return (
    <div
      className="surga-desktop-widget"
      role="button"
      tabIndex={0}
      onClick={onOuvrir}
      onKeyDown={clavier(onOuvrir)}
      title="Ouvrir le suivi du trafic"
    >
      <div className="surga-widget-header">
        <span className="surga-widget-label">Trafic</span>
        <Navigation size={14} className="surga-widget-icon" />
      </div>

      {!couvreTrafic ? (
        <div style={TEXTE_ETAT}>Trafic indisponible pour {ville}. Disponible pour Dakar.</div>
      ) : chargement ? (
        <div style={TEXTE_ETAT}>Chargement du trafic…</div>
      ) : visibles.length === 0 ? (
        <div style={TEXTE_ETAT}>{MESSAGE_TRAFIC_INDISPONIBLE}</div>
      ) : (
        <>
          <div className="surga-trafic-indicators">
            {visibles.map((axe) => (
              <div className="surga-trafic-row" key={axe.id}>
                <span className="surga-trafic-axis">
                  <span className={`surga-trafic-dot ${PASTILLE_NIVEAU[axe.niveau] || ''}`} />
                  <span>{axe.nom.split('(')[0].trim()}</span>
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, color: COULEUR_NIVEAU[axe.niveau] || 'var(--surga-text2, #475569)' }}>
                  {libelleNiveau(axe).toLowerCase()}
                </span>
                {axe.tempsEstimeMin !== null && <span className="surga-trafic-time">{axe.tempsEstimeMin} min</span>}
              </div>
            ))}
          </div>
          <div style={TEXTE_ORIGINE}>{origineAxe(visibles[0])}</div>
        </>
      )}
    </div>
  )
}

export function SurgaRailMeteo({ ville, onOuvrir }: RailProps) {
  const estMaritime = estLocaliteMaritime(ville)
  const [chargement, setChargement] = useState(true)
  const [meteo, setMeteo] = useState<MeteoData | null>(null)

  useEffect(() => {
    let actif = true
    setChargement(true)
    setMeteo(null)
    fetch(`/api/surga/meteo?ville=${encodeURIComponent(ville)}`)
      .then((r) => r.json())
      .then((d) => { if (actif) setMeteo(d?.success && d.meteo ? d.meteo : null) })
      .catch(() => { if (actif) setMeteo(null) })
      .finally(() => { if (actif) setChargement(false) })
    return () => { actif = false }
  }, [ville])

  return (
    <div
      className="surga-desktop-widget"
      role="button"
      tabIndex={0}
      onClick={onOuvrir}
      onKeyDown={clavier(onOuvrir)}
      title="Voir les détails météo"
    >
      <div className="surga-widget-header">
        <span className="surga-widget-label">Météo · {meteo?.ville || ville}</span>
        <Sun size={14} className="surga-widget-icon" />
      </div>

      {meteo ? (
        <>
          <div className="surga-widget-highlight">{meteo.temperature}°C • {meteo.condition_texte}</div>
          <div className="surga-widget-desc">
            {estMaritime ? 'Marées et qualité de l’air : indisponibles' : 'Qualité de l’air : indisponible'}
          </div>
          <div style={TEXTE_ORIGINE}>{libelleReleveMeteo(meteo)}</div>
        </>
      ) : (
        <div style={TEXTE_ETAT}>{chargement ? 'Chargement de la météo…' : 'Météo indisponible pour le moment.'}</div>
      )}
    </div>
  )
}
