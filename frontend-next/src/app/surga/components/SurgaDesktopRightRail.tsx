'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Calendar, Wallet, Navigation, Sun, Bookmark,
  Eye, EyeOff, Lock, Radio, Play, Pause, SkipBack, SkipForward,
} from 'lucide-react'
import type { SurgaTab } from './SurgaBottomNav'
import type { SurgaDepensesStats } from '@/lib/surga-offline-sync'
import { getLocalNotes } from '@/lib/surga-offline-sync'
import { estLocaliteMaritime, estZoneCouverteParTrafic } from '@/lib/surga-meteo'
import {
  isXaalisMasque,
  toggleXaalisMasque,
  hasXaalisPin,
  isXaalisVerrouille,
} from '@/lib/surga-xaalis-security'
import { useSurgaRadio } from '@/lib/surga-radio-context'
import SurgaXaalisPinModal from './SurgaXaalisPinModal'

export const DEFAUT_RAIL_WIDGETS = ['agenda', 'depenses', 'trafic', 'meteo', 'notes', 'radios']

interface SurgaDesktopRightRailProps {
  statsApercu: SurgaDepensesStats | null
  soldeKalpeFormate: string
  nbNotes: number
  nbAgenda: number
  derniereNoteTitre?: string
  prochainRdvTitre?: string
  meteoTemp?: string
  meteoMaree?: string
  ville?: string
  widgetsActifs?: string[]
  onNavigateTab: (tab: SurgaTab) => void
  onOpenTrafic: () => void
  onOpenRadios?: () => void
}

export default function SurgaDesktopRightRail({
  statsApercu, soldeKalpeFormate, nbNotes, nbAgenda,
  derniereNoteTitre, prochainRdvTitre, meteoTemp = '28°C',
  meteoMaree = '17h45', ville = 'Dakar', widgetsActifs,
  onNavigateTab, onOpenTrafic, onOpenRadios,
}: SurgaDesktopRightRailProps) {
  const moisActuelNom = new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(new Date())
  const moisCapitalise = moisActuelNom.charAt(0).toUpperCase() + moisActuelNom.slice(1)
  const totalMoisFormate = statsApercu?.total_formate || '0 FCFA'

  // Contexte Radio FM
  const {
    stationActive, isPlaying, togglePlay, passerSuivante, passerPrecedente,
    openRadioModal, stations, lancerStation,
  } = useSurgaRadio()

  // États de confidentialité & sécurité
  const [masque, setMasque] = useState(false)
  const [protegeParPin, setProtegeParPin] = useState(false)
  const [isPinModalOpen, setIsPinModalOpen] = useState(false)
  const [noteEpingleeTexte, setNoteEpingleeTexte] = useState<string>('')

  const estMaritime = estLocaliteMaritime(ville)
  const couvreTrafic = estZoneCouverteParTrafic(ville)

  const widgetsVisibles = Array.isArray(widgetsActifs) && widgetsActifs.length > 0 ? widgetsActifs : DEFAUT_RAIL_WIDGETS
  const estActif = (id: string) => widgetsVisibles.includes(id)

  const actualiserNote = useCallback(() => {
    try {
      const notes = getLocalNotes()
      const ep = notes.find((n) => n.epingle)
      if (ep) {
        const brut = ep.contenu || ep.titre || ''
        const deuxLignes = brut.split('\n').filter(Boolean).slice(0, 2).join('\n')
        setNoteEpingleeTexte(deuxLignes || ep.titre)
      } else {
        setNoteEpingleeTexte('')
      }
    } catch {
      setNoteEpingleeTexte('')
    }
  }, [])

  useEffect(() => {
    actualiserNote()
    const handleDataChange = () => actualiserNote()
    window.addEventListener('surga-data-change', handleDataChange)
    window.addEventListener('storage', handleDataChange)
    return () => {
      window.removeEventListener('surga-data-change', handleDataChange)
      window.removeEventListener('storage', handleDataChange)
    }
  }, [actualiserNote])

  const synchroniserSecurite = useCallback(() => {
    setMasque(isXaalisMasque())
    setProtegeParPin(hasXaalisPin())
  }, [])

  useEffect(() => {
    synchroniserSecurite()
    const handlePrivacyChange = () => synchroniserSecurite()
    window.addEventListener('surga-xaalis-privacy-change', handlePrivacyChange)
    return () => window.removeEventListener('surga-xaalis-privacy-change', handlePrivacyChange)
  }, [synchroniserSecurite])

  // Bascule afficher / masquer Sama Xaalis
  const handleToggleMasque = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (masque && isXaalisVerrouille()) {
      setIsPinModalOpen(true)
      return
    }
    toggleXaalisMasque()
  }

  // Clic sur le widget pour ouvrir Sama Xaalis
  const handleClicWidgetXaalis = () => {
    if (isXaalisVerrouille()) {
      setIsPinModalOpen(true)
      return
    }
    onNavigateTab('depenses')
  }

  // Contrôles Radio FM
  const handleToggleRadio = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isPlaying || stationActive) {
      togglePlay()
    } else if (stations && stations.length > 0) {
      lancerStation(stations[0])
    } else if (onOpenRadios) {
      onOpenRadios()
    } else {
      openRadioModal()
    }
  }

  const handleClicWidgetRadio = () => {
    if (onOpenRadios) onOpenRadios()
    else openRadioModal()
  }

  const valeurMoisAffichee = masque ? '•••••• FCFA' : totalMoisFormate
  const valeurSoldeAffichee = masque ? '•••••• FCFA' : soldeKalpeFormate

  return (
    <>
      <aside className="surga-desktop-right-rail" aria-label="Aperçus et contexte quotidien">
        {/* 1. Votre journée & Agenda */}
        {estActif('agenda') && (
          <div
            className="surga-desktop-widget"
            role="button"
            tabIndex={0}
            onClick={() => onNavigateTab('agenda')}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onNavigateTab('agenda')}
            title="Ouvrir l'agenda Surga"
          >
            <div className="surga-widget-header">
              <span className="surga-widget-label">Votre journée</span>
              <Calendar size={14} className="surga-widget-icon" />
            </div>
            <div className="surga-widget-highlight">
              {prochainRdvTitre || (nbAgenda > 0 ? `${nbAgenda} rappel${nbAgenda > 1 ? 's' : ''} au planning` : 'Journée libre')}
            </div>
            <div className="surga-widget-desc">
              {nbAgenda > 0 ? `${nbAgenda} événement${nbAgenda > 1 ? 's' : ''} aujourd'hui` : 'Aucun rendez-vous bloquant'}
            </div>
          </div>
        )}

        {/* 2. Sama Xaalis (Finances perso FCFA avec bouton Afficher/Masquer & PIN) */}
        {estActif('depenses') && (
          <div
            className="surga-desktop-widget"
            role="button"
            tabIndex={0}
            onClick={handleClicWidgetXaalis}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClicWidgetXaalis()}
            title="Consulter Sama Xaalis"
          >
            <div className="surga-widget-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="surga-widget-label">Sama Xaalis ({moisCapitalise})</span>
                {protegeParPin && (
                  <span title="Protection par Code PIN active" style={{ display: 'inline-flex', color: 'var(--accent, #C75B00)' }}>
                    <Lock size={11} />
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  type="button"
                  onClick={handleToggleMasque}
                  title={masque ? 'Afficher les montants' : 'Masquer les montants (confidentialité)'}
                  aria-label={masque ? 'Afficher les montants' : 'Masquer les montants'}
                  style={{ background: 'none', border: 'none', color: 'var(--text3, #73675E)', cursor: 'pointer', padding: 2, display: 'inline-flex', alignItems: 'center' }}
                >
                  {masque ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
                <Wallet size={14} className="surga-widget-icon" />
              </div>
            </div>
            <div className="surga-widget-value-strong">{valeurMoisAffichee}</div>
            <div className="surga-widget-desc">
              Solde Kalpé : <strong>{valeurSoldeAffichee}</strong>
              <span title="Kalpé : votre portefeuille et budget personnel en FCFA" style={{ marginLeft: 4, cursor: 'help', fontSize: 11, color: 'var(--surga-text3, #94A3B8)' }}>
                (portefeuille)
              </span>
            </div>
          </div>
        )}

        {/* 3. Trafic en direct */}
        {estActif('trafic') && (
          <div
            className="surga-desktop-widget"
            role="button"
            tabIndex={0}
            onClick={onOpenTrafic}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpenTrafic()}
            title={couvreTrafic ? "Ouvrir le suivi du trafic" : "Trafic disponible pour Dakar uniquement"}
          >
            <div className="surga-widget-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="surga-widget-label">Trafic en direct</span>
              </div>
              <Navigation size={14} className="surga-widget-icon" />
            </div>

            {couvreTrafic ? (
              <>
                <div className="surga-trafic-indicators">
                  <div className="surga-trafic-row">
                    <span className="surga-trafic-axis">
                      <span className="surga-trafic-dot green" />
                      <span>VDN Dégagement</span>
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--surga-emerald, #059669)' }}>fluide</span>
                    <span className="surga-trafic-time">14 min</span>
                  </div>
                  <div className="surga-trafic-row">
                    <span className="surga-trafic-axis">
                      <span className="surga-trafic-dot orange" />
                      <span>Corniche Ouest</span>
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#B45309' }}>dense</span>
                    <span className="surga-trafic-time">28 min</span>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--surga-text3, #94A3B8)', marginTop: 4 }}>
                  Mis à jour il y a 4 min
                </div>
              </>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--surga-text2, #475569)', padding: '4px 0', lineHeight: 1.4 }}>
                Trafic disponible pour Dakar uniquement
              </div>
            )}
          </div>
        )}

        {/* 4. Météo & Marées (ou Météo seule si intérieur) */}
        {estActif('meteo') && (
          <div
            className="surga-desktop-widget"
            role="button"
            tabIndex={0}
            onClick={() => onNavigateTab('aujourdhui')}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onNavigateTab('aujourdhui')}
            title="Voir les détails météo"
          >
            <div className="surga-widget-header">
              <span className="surga-widget-label">{estMaritime ? 'Météo et marées' : 'Météo'}</span>
              <Sun size={14} className="surga-widget-icon" />
            </div>
            <div className="surga-widget-highlight">{meteoTemp} • Ensoleillé</div>
            <div className="surga-widget-desc">
              {estMaritime
                ? `Marée haute : ${meteoMaree} • Air : Bonne (AQI 45)`
                : 'Air : Bonne (AQI 45) • Vent modéré'}
            </div>
          </div>
        )}

        {/* 5. Mémo épinglé */}
        {estActif('notes') && (
          <div
            className="surga-desktop-widget"
            role="button"
            tabIndex={0}
            onClick={() => onNavigateTab('notes')}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onNavigateTab('notes')}
            title="Ouvrir mes notes"
          >
            <div className="surga-widget-header">
              <span className="surga-widget-label">Mémo épinglé</span>
              <Bookmark size={14} className="surga-widget-icon" />
            </div>
            <div className="surga-note-memo" style={{ whiteSpace: 'pre-line' }}>
              {noteEpingleeTexte || derniereNoteTitre || 'Épinglez une note pour la garder ici'}
            </div>
            <div className="surga-widget-desc">
              {nbNotes > 0
                ? `${nbNotes} note${nbNotes > 1 ? 's' : ''} active${nbNotes > 1 ? 's' : ''}`
                : 'Aucune note active'}
            </div>
          </div>
        )}

        {/* 6. Radios FM direct (Comble le vide en bas de Mémo épinglé) */}
        {estActif('radios') && (
          <div
            className="surga-desktop-widget"
            role="button"
            tabIndex={0}
            onClick={handleClicWidgetRadio}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClicWidgetRadio()}
            title={stationActive ? `Radio active : ${stationActive.nom} (Cliquer pour ouvrir le bouquet)` : 'Ouvrir les radios FM'}
          >
            <div className="surga-widget-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="surga-widget-label">Radios FM direct</span>
                {isPlaying && (
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      backgroundColor: '#10B981',
                      display: 'inline-block',
                      boxShadow: '0 0 6px rgba(16, 185, 129, 0.7)',
                    }}
                    title="En direct"
                  />
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    passerPrecedente()
                  }}
                  title="Station précédente"
                  aria-label="Station précédente"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--navy, #1C2B4A)',
                    cursor: 'pointer',
                    padding: 2,
                    display: 'inline-flex',
                    alignItems: 'center',
                    opacity: 0.8,
                  }}
                >
                  <SkipBack size={12} />
                </button>
                <button
                  type="button"
                  onClick={handleToggleRadio}
                  title={isPlaying ? 'Mettre en pause' : 'Lancer la radio'}
                  aria-label={isPlaying ? 'Mettre en pause' : 'Lancer la radio'}
                  style={{
                    background: isPlaying ? 'rgba(10, 92, 54, 0.12)' : 'rgba(28, 43, 74, 0.08)',
                    border: 'none',
                    color: isPlaying ? 'var(--price, #0A5C36)' : 'var(--navy, #1C2B4A)',
                    cursor: 'pointer',
                    padding: '3px 6px',
                    borderRadius: 5,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                    fontSize: 10.5,
                    fontWeight: 700,
                  }}
                >
                  {isPlaying ? <Pause size={10} /> : <Play size={10} />}
                  <span>{isPlaying ? 'Pause' : 'Écouter'}</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    passerSuivante()
                  }}
                  title="Station suivante"
                  aria-label="Station suivante"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--navy, #1C2B4A)',
                    cursor: 'pointer',
                    padding: 2,
                    display: 'inline-flex',
                    alignItems: 'center',
                    opacity: 0.8,
                  }}
                >
                  <SkipForward size={12} />
                </button>
                <Radio size={13} className="surga-widget-icon" style={{ marginLeft: 2 }} />
              </div>
            </div>

            <div className="surga-widget-highlight" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {stationActive ? stationActive.nom : 'Bouquet national FM'}
              </span>
              {stationActive?.frequence && (
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    padding: '1px 5px',
                    borderRadius: 4,
                    backgroundColor: 'rgba(28, 43, 74, 0.08)',
                    color: 'var(--navy, #1C2B4A)',
                    flexShrink: 0,
                  }}
                >
                  {stationActive.frequence}
                </span>
              )}
            </div>

            <div className="surga-widget-desc">
              {isPlaying
                ? (stationActive?.slogan || 'Diffusion en direct • Zéro décalage')
                : 'Zik FM, RFM, Sud FM, RFI Dakar, RTS...'}
            </div>
          </div>
        )}
      </aside>

      {/* Modale de déverrouillage PIN au clic sur le widget ou au démasquage */}
      <SurgaXaalisPinModal
        isOpen={isPinModalOpen}
        mode="unlock"
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={() => { setIsPinModalOpen(false); setMasque(false); onNavigateTab('depenses'); }}
      />
    </>
  )
}
