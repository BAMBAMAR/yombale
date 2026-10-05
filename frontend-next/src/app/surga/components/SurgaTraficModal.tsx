'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Navigation,
  X,
  CheckCircle2,
  RefreshCw,
  Plus,
  Activity,
  AlertTriangle,
  MapPin,
  ExternalLink,
} from 'lucide-react'
import SurgaTraficItemCard from './SurgaTraficItemCard'
import SurgaTraficReportForm from './SurgaTraficReportForm'

export interface AxeTraficDetail {
  id: string
  nom: string
  origine: string
  destination: string
  type: string
  sens: string
  niveau: 'fluide' | 'dense' | 'bouche'
  tempsEstimeMin: number
  tempsHabituelMin: number
  distanceKm: number
  pointsChauds: string[]
  cause: string
  incident?: string | null
  source?: 'tomtom_live' | 'previsionnel'
  vitesseReelleKmH?: number | null
  vitesseNormaleKmH?: number | null
  signalementRecent?: {
    type: string
    commentaire?: string
    date: string
  } | null
}

interface IncidentTrafic {
  id: string
  description: string
  delaySec: number
  from?: string
  to?: string
}

interface SurgaTraficModalProps {
  isOpen: boolean
  onClose: () => void
}

const ONGLETS_FILTRE = [
  { key: 'tous', label: 'Tous les axes' },
  { key: 'autoroute', label: 'Autoroute & VDN' },
  { key: 'corniche', label: 'Corniche & Ville' },
  { key: 'transports', label: 'TER & BRT' },
]

export default function SurgaTraficModal({ isOpen, onClose }: SurgaTraficModalProps) {
  const [axes, setAxes] = useState<AxeTraficDetail[]>([])
  const [incidents, setIncidents] = useState<IncidentTrafic[]>([])
  const [source, setSource] = useState<string>('previsionnel')
  const [derniereMaj, setDerniereMaj] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [filtreActif, setFiltreActif] = useState<string>('tous')
  const [afficherFormulaire, setAfficherFormulaire] = useState<boolean>(false)

  // Champs de signalement
  const [axeSelectionne, setAxeSelectionne] = useState<string>('a1-entrant')
  const [typeSignalement, setTypeSignalement] = useState<string>('dense')
  const [commentaire, setCommentaire] = useState<string>('')
  const [envoiEnCours, setEnvoiEnCours] = useState<boolean>(false)
  const [messageSucces, setMessageSucces] = useState<string | null>(null)

  const chargerTrafic = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/surga/trafic')
      const data = await res.json()
      if (data.success && Array.isArray(data.axes)) {
        setAxes(data.axes)
        setSource(data.source || 'previsionnel')
        setIncidents(data.incidents || [])
        setDerniereMaj(data.derniereMiseAJour || new Date().toISOString())
      }
    } catch (err) {
      console.error('Erreur chargement trafic modal:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      chargerTrafic()
    }
  }, [isOpen])

  const handleEnvoyerSignalement = async (e: React.FormEvent) => {
    e.preventDefault()
    setEnvoiEnCours(true)
    try {
      const res = await fetch('/api/surga/trafic/signalements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ axeId: axeSelectionne, typeSignalement, commentaire }),
      })
      const data = await res.json()
      if (data.success) {
        setMessageSucces('Signalement partagé avec les usagers de Dakar.')
        setCommentaire('')
        setAfficherFormulaire(false)
        await chargerTrafic()
        setTimeout(() => setMessageSucces(null), 3500)
      }
    } catch {
      console.error('Erreur envoi signalement')
    } finally {
      setEnvoiEnCours(false)
    }
  }

  const axesFiltres = useMemo(() => {
    return axes.filter((a) => {
      if (filtreActif === 'autoroute') return a.type === 'autoroute' || a.type === 'voie_express'
      if (filtreActif === 'corniche') return a.type === 'corniche' || a.type === 'nationale' || a.type === 'echangeur'
      if (filtreActif === 'transports') return a.type === 'ferroviaire' || a.type === 'bus_site_propre'
      return true
    })
  }, [axes, filtreActif])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(28, 43, 74, 0.65)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        backdropFilter: 'blur(3px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          maxHeight: '90vh',
          backgroundColor: '#FFFFFF',
          borderRadius: 14,
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div
          style={{
            padding: '14px 16px',
            backgroundColor: 'var(--navy, #1C2B4A)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Navigation size={18} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>
                Trafic en Direct • Dakar
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.75)' }}>
                {source === 'tomtom_live'
                  ? 'Sondes TomTom Traffic en direct • TER & BRT'
                  : 'Modèle trafic calibré Dakar • TER & BRT'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              type="button"
              onClick={chargerTrafic}
              disabled={loading}
              title="Actualiser les conditions"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#FFFFFF',
                cursor: 'pointer',
                padding: 4,
              }}
            >
              <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#FFFFFF',
                cursor: 'pointer',
                padding: 4,
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Indicateur de source & statut temps réel */}
        <div
          style={{
            padding: '7px 14px',
            backgroundColor: source === 'tomtom_live' ? 'rgba(10, 92, 54, 0.08)' : 'rgba(199, 91, 0, 0.08)',
            fontSize: 11,
            color: source === 'tomtom_live' ? 'var(--price, #0A5C36)' : 'var(--navy, #1C2B4A)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border, #E8DDD2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Activity size={12} color={source === 'tomtom_live' ? 'var(--price, #0A5C36)' : 'var(--accent, #C75B00)'} />
            <span>
              {source === 'tomtom_live'
                ? 'Sondes TomTom en direct (vitesse et retards réels)'
                : 'Modèle calibré Dakar (pointes, sorties de bureaux & TER/BRT)'}
            </span>
          </div>
          {derniereMaj && (
            <span style={{ fontSize: 10, color: 'var(--text3, #73675E)' }}>
              {new Date(derniereMaj).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        {/* Passerelle directe Carte Trafic Google Maps Live */}
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: '#FFF8F0',
            borderBottom: '1px solid var(--border, #E8DDD2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <MapPin size={16} color="var(--accent, #C75B00)" style={{ flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                Carte Trafic Temps Réel (Google Maps)
              </div>
              <div style={{ fontSize: 10, color: 'var(--text3, #73675E)' }}>
                Bouchons et flux capteurs en direct sur la presqu'île
              </div>
            </div>
          </div>
          <a
            href="https://www.google.com/maps/@14.7300,-17.4480,13z/data=!5m1!1e1"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              backgroundColor: 'var(--accent, #C75B00)',
              color: '#FFFFFF',
              fontSize: 11,
              fontWeight: 700,
              padding: '6px 10px',
              borderRadius: 6,
              textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            <span>Voir la carte</span>
            <ExternalLink size={12} />
          </a>
        </div>

        {/* Message de succès */}
        {messageSucces && (
          <div
            style={{
              padding: '8px 14px',
              backgroundColor: 'rgba(10, 92, 54, 0.1)',
              color: 'var(--price, #0A5C36)',
              fontSize: 12,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              borderBottom: '1px solid var(--border, #E8DDD2)',
            }}
          >
            <CheckCircle2 size={15} />
            <span>{messageSucces}</span>
          </div>
        )}

        {/* Alertes incidents en direct (si TomTom) */}
        {incidents.length > 0 && (
          <div
            style={{
              margin: '8px 14px 0',
              padding: '8px 10px',
              backgroundColor: 'rgba(185, 28, 28, 0.08)',
              borderRadius: 8,
              border: '1px solid rgba(185, 28, 28, 0.2)',
              fontSize: 11,
              color: '#B91C1C',
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
              <AlertTriangle size={13} />
              <span>{incidents.length} incident(s) signalé(s) en direct à Dakar</span>
            </div>
            {incidents.map((inc) => (
              <div key={inc.id} style={{ fontSize: 10 }}>• {inc.description}</div>
            ))}
          </div>
        )}

        {/* Barre de commande : Onglets et Bouton Signaler */}
        <div style={{ padding: '10px 14px 6px', borderBottom: '1px solid var(--border, #E8DDD2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', flex: 1, paddingBottom: 2 }}>
              {ONGLETS_FILTRE.map((onglet) => {
                const estActif = filtreActif === onglet.key
                return (
                  <button
                    key={onglet.key}
                    type="button"
                    onClick={() => setFiltreActif(onglet.key)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 20,
                      border: '1px solid',
                      borderColor: estActif ? 'var(--navy, #1C2B4A)' : 'var(--border, #E8DDD2)',
                      backgroundColor: estActif ? 'var(--navy, #1C2B4A)' : 'transparent',
                      color: estActif ? '#FFFFFF' : 'var(--text2, #5A4E42)',
                      fontSize: 11,
                      fontWeight: estActif ? 700 : 500,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {onglet.label}
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              onClick={() => setAfficherFormulaire(!afficherFormulaire)}
              className="surga-btn-secondary"
              style={{
                fontSize: 11,
                padding: '4px 10px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                flexShrink: 0,
              }}
            >
              <Plus size={13} />
              <span>{afficherFormulaire ? 'Masquer' : 'Signaler'}</span>
            </button>
          </div>

          {afficherFormulaire && (
            <SurgaTraficReportForm
              axeSelectionne={axeSelectionne}
              typeSignalement={typeSignalement}
              commentaire={commentaire}
              envoiEnCours={envoiEnCours}
              axes={axes}
              onAxeChange={setAxeSelectionne}
              onTypeChange={setTypeSignalement}
              onCommentaireChange={setCommentaire}
              onSubmit={handleEnvoyerSignalement}
              onAnnuler={() => setAfficherFormulaire(false)}
            />
          )}
        </div>

        {/* Liste des axes */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {loading && axes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text3, #73675E)', fontSize: 13 }}>
              Interrogation des sondes de circulation...
            </div>
          ) : axesFiltres.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text3, #73675E)', fontSize: 13 }}>
              Aucun axe dans cette catégorie.
            </div>
          ) : (
            axesFiltres.map((axe) => (
              <SurgaTraficItemCard key={axe.id} axe={axe} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
