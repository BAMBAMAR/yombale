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

export const DEFAUT_RAIL_WIDGETS = ['agenda', 'depenses', 'trafic', 'meteo', 'notes']

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
  meteoMaree = '17h45', ville = 'Dakar Plateau', widgetsActifs,
  onNavigateTab, onOpenTrafic, onOpenRadios,
}: SurgaDesktopRightRailProps) {
  const moisActuelNom = new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(new Date())
  const moisCapitalise = moisActuelNom.charAt(0).toUpperCase() + moisActuelNom.slice(1)
  const totalMoisFormate = statsApercu?.total_formate || '0\u202FFCFA'

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

  const valeurMoisAffichee = masque ? '••••••\u202FFCFA' : totalMoisFormate
  const valeurSoldeAffichee = masque ? '••••••\u202FFCFA' : soldeKalpeFormate

  return (
    <>
      <aside className="surga-desktop-right-rail" aria-label="Aperçus et contexte quotidien">
        {/* 1. Votre journée & Agenda (SRG-UI-20 : cohérence absolue, zéro contradiction) */}
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
              {prochainRdvTitre || (nbAgenda > 0 ? (nbAgenda === 1 ? '1 rappel au planning' : `${nbAgenda} rappels au planning`) : 'Journée libre')}
            </div>
            <div className="surga-widget-desc">
              {nbAgenda > 0
                ? (nbAgenda === 1 ? 'Aucun rendez-vous · 1 rappel' : `Aucun rendez-vous · ${nbAgenda} rappels`)
                : 'Aucun rendez-vous ni rappel'}
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

        {/* 3. Trafic en direct (SRG-UI-01 & SRG-UI-15) */}
        {estActif('trafic') && (
          <div
            className="surga-desktop-widget"
            role="button"
            tabIndex={0}
            onClick={onOpenTrafic}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpenTrafic()}
            title={couvreTrafic ? "Ouvrir le suivi du trafic" : `Trafic indisponible pour ${ville}. Disponible pour Dakar.`}
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
                Trafic indisponible pour {ville}. Disponible pour Dakar.
              </div>
            )}
          </div>
        )}

        {/* 4. Météo (SRG-UI-01 & SRG-UI-02 : nom de ville toujours affiché, marées seulement si maritime) */}
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
              <span className="surga-widget-label">
                {estMaritime ? `Météo et marées · ${ville}` : `Météo · ${ville}`}
              </span>
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
