'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Calendar,
  Wallet,
  Navigation,
  Sun,
  Bookmark,
  Eye,
  EyeOff,
  Lock,
} from 'lucide-react'
import type { SurgaTab } from './SurgaBottomNav'
import type { SurgaDepensesStats } from '@/lib/surga-offline-sync'
import {
  isXaalisMasque,
  toggleXaalisMasque,
  hasXaalisPin,
  isXaalisVerrouille,
} from '@/lib/surga-xaalis-security'
import SurgaXaalisPinModal from './SurgaXaalisPinModal'

interface SurgaDesktopRightRailProps {
  statsApercu: SurgaDepensesStats | null
  soldeKalpeFormate: string
  nbNotes: number
  nbAgenda: number
  derniereNoteTitre?: string
  prochainRdvTitre?: string
  meteoTemp?: string
  meteoMaree?: string
  onNavigateTab: (tab: SurgaTab) => void
  onOpenTrafic: () => void
}

export default function SurgaDesktopRightRail({
  statsApercu,
  soldeKalpeFormate,
  nbNotes,
  nbAgenda,
  derniereNoteTitre,
  prochainRdvTitre,
  meteoTemp = '28°C',
  meteoMaree = '17h45',
  onNavigateTab,
  onOpenTrafic,
}: SurgaDesktopRightRailProps) {
  const moisActuelNom = new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(new Date())
  const moisCapitalise = moisActuelNom.charAt(0).toUpperCase() + moisActuelNom.slice(1)
  const totalMoisFormate = statsApercu?.total_formate || '0 FCFA'

  // États de confidentialité & sécurité
  const [masque, setMasque] = useState(false)
  const [protegeParPin, setProtegeParPin] = useState(false)
  const [isPinModalOpen, setIsPinModalOpen] = useState(false)

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

  // Bascule afficher / masquer
  const handleToggleMasque = (e: React.MouseEvent) => {
    e.stopPropagation()
    // Si masqué et protégé par PIN actuellement verrouillé, demander le PIN pour afficher
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

  const valeurMoisAffichee = masque ? '•••••• FCFA' : totalMoisFormate
  const valeurSoldeAffichee = masque ? '•••••• FCFA' : soldeKalpeFormate

  return (
    <>
      <aside className="surga-desktop-right-rail" aria-label="Aperçus et contexte quotidien">
        {/* 1. Votre journée & Agenda */}
        <div
          className="surga-desktop-widget"
          role="button"
          tabIndex={0}
          onClick={() => onNavigateTab('agenda')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onNavigateTab('agenda') }}
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

        {/* 2. Sama Xaalis (Finances perso FCFA avec bouton Afficher/Masquer & PIN) */}
        <div
          className="surga-desktop-widget"
          role="button"
          tabIndex={0}
          onClick={handleClicWidgetXaalis}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClicWidgetXaalis() }}
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
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text3, #73675E)',
                  cursor: 'pointer',
                  padding: 2,
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                {masque ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
              <Wallet size={14} className="surga-widget-icon" />
            </div>
          </div>
          <div className="surga-widget-value-strong">{valeurMoisAffichee}</div>
          <div className="surga-widget-desc">
            Solde Kalpé restant : <strong>{valeurSoldeAffichee}</strong>
          </div>
        </div>

        {/* 3. Trafic Dakar direct */}
        <div
          className="surga-desktop-widget"
          role="button"
          tabIndex={0}
          onClick={onOpenTrafic}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onOpenTrafic() }}
          title="Ouvrir le suivi du trafic de Dakar"
        >
          <div className="surga-widget-header">
            <span className="surga-widget-label">Trafic Dakar direct</span>
            <Navigation size={14} className="surga-widget-icon" />
          </div>
          <div className="surga-trafic-indicators">
            <div className="surga-trafic-row">
              <span className="surga-trafic-axis">
                <span className="surga-trafic-dot green" />
                <span>VDN Dégagement</span>
              </span>
              <span className="surga-trafic-time">14 min</span>
            </div>
            <div className="surga-trafic-row">
              <span className="surga-trafic-axis">
                <span className="surga-trafic-dot orange" />
                <span>Corniche Ouest</span>
              </span>
              <span className="surga-trafic-time">28 min</span>
            </div>
          </div>
        </div>

        {/* 4. Météo & Marée Dakar */}
        <div
          className="surga-desktop-widget"
          role="button"
          tabIndex={0}
          onClick={() => onNavigateTab('aujourdhui')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onNavigateTab('aujourdhui') }}
          title="Voir les détails météo"
        >
          <div className="surga-widget-header">
            <span className="surga-widget-label">Météo Dakar</span>
            <Sun size={14} className="surga-widget-icon" />
          </div>
          <div className="surga-widget-highlight">{meteoTemp} • Ensoleillé</div>
          <div className="surga-widget-desc">
            Marée haute : {meteoMaree} • Air : Bonne (AQI 45)
          </div>
        </div>

        {/* 5. Mémo épinglé */}
        <div
          className="surga-desktop-widget"
          role="button"
          tabIndex={0}
          onClick={() => onNavigateTab('notes')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onNavigateTab('notes') }}
          title="Ouvrir mes notes"
        >
          <div className="surga-widget-header">
            <span className="surga-widget-label">Mémo épinglé</span>
            <Bookmark size={14} className="surga-widget-icon" />
          </div>
          <div className="surga-note-memo">
            {derniereNoteTitre || (nbNotes > 0 ? `Consulter vos ${nbNotes} note${nbNotes > 1 ? 's' : ''} et listes actives` : 'Noter une idée ou une course urgente')}
          </div>
        </div>
      </aside>

      {/* Modale de déverrouillage PIN au clic sur le widget ou au démasquage */}
      <SurgaXaalisPinModal
        isOpen={isPinModalOpen}
        mode="unlock"
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={() => {
          setIsPinModalOpen(false)
          setMasque(false)
          onNavigateTab('depenses')
        }}
      />
    </>
  )
}
