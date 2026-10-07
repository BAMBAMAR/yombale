'use client'

import React from 'react'
import SurgaHeader from './SurgaHeader'
import SurgaBottomNav, { type SurgaTab } from './SurgaBottomNav'
import SurgaDesktopSidebar from './SurgaDesktopSidebar'
import SurgaDesktopRightRail from './SurgaDesktopRightRail'
import SurgaDesktopCommandBar from './SurgaDesktopCommandBar'
import type { SurgaUser } from '../page'
import type { SurgaDepensesStats } from '@/lib/surga-offline-sync'
import { Mic } from 'lucide-react'

interface SurgaLayoutShellProps {
  activeTab: SurgaTab
  onTabChange: (tab: SurgaTab) => void
  user: SurgaUser | null
  briefingDate?: string
  nbNotes: number
  nbAgenda: number
  statsApercu: SurgaDepensesStats | null
  soldeKalpeFormate: string
  quartier?: string
  isFabHidden: boolean
  children: React.ReactNode
  onOpenVoice: () => void
  onOpenTrafic: () => void
  onOpenPresse: () => void
  onOpenRadios: () => void
  onOpenConcours: () => void
  onOpenImmo: () => void
  onOpenPlaces: () => void
  onOpenCompte: () => void
  onOpenAuth: () => void
}

export default function SurgaLayoutShell({
  activeTab,
  onTabChange,
  user,
  briefingDate,
  nbNotes,
  nbAgenda,
  statsApercu,
  soldeKalpeFormate,
  quartier,
  isFabHidden,
  children,
  onOpenVoice,
  onOpenTrafic,
  onOpenPresse,
  onOpenRadios,
  onOpenConcours,
  onOpenImmo,
  onOpenPlaces,
  onOpenCompte,
  onOpenAuth,
}: SurgaLayoutShellProps) {
  const getTitreMobile = () => {
    switch (activeTab) {
      case 'notes':
        return 'Mes Notes'
      case 'depenses':
        return 'Sama Xaalis'
      case 'agenda':
        return 'Mon Agenda'
      case 'services':
      case 'plus':
        return 'Services'
      default:
        return 'Surga'
    }
  }

  return (
    <div className="surga-app-shell">
      {/* Header mobile classique (masqué sur desktop via CSS) */}
      <div className="surga-mobile-header-wrap">
        <SurgaHeader
          titre={getTitreMobile()}
          sousTitre={activeTab === 'aujourdhui' ? briefingDate : undefined}
          afficherRetour={activeTab !== 'aujourdhui'}
          onRetour={() => onTabChange('aujourdhui')}
          user={user}
          onOpenAuth={onOpenAuth}
          onOpenCompte={onOpenCompte}
        />
      </div>

      {/* Grille Principale (Responsive : 1 colonne mobile / 3 colonnes desktop) */}
      <div className="surga-main-grid">
        {/* Colonne 1 : Sidebar Gauche Desktop */}
        <SurgaDesktopSidebar
          activeTab={activeTab}
          onTabChange={onTabChange}
          nbNotes={nbNotes}
          nbAgenda={nbAgenda}
          quartier={quartier}
          onOpenTrafic={onOpenTrafic}
          onOpenPresse={onOpenPresse}
          onOpenRadios={onOpenRadios}
          onOpenConcours={onOpenConcours}
          onOpenImmo={onOpenImmo}
          onOpenPlaces={onOpenPlaces}
          onOpenCompte={onOpenCompte}
        />

        {/* Colonne 2 : Flux Central (Onglet actif + Command Bar) */}
        <main className="surga-center-feed">
          <div className="surga-container">
            {children}
          </div>

          <div className="surga-desktop-command-wrapper">
            <SurgaDesktopCommandBar onOpenVoice={onOpenVoice} />
          </div>
        </main>

        {/* Colonne 3 : Rail Droit Contextuel Desktop */}
        <SurgaDesktopRightRail
          statsApercu={statsApercu}
          soldeKalpeFormate={soldeKalpeFormate}
          nbNotes={nbNotes}
          nbAgenda={nbAgenda}
          onNavigateTab={onTabChange}
          onOpenTrafic={onOpenTrafic}
        />
      </div>

      {/* Bouton micro flottant FAB (mobile uniquement) */}
      <button
        type="button"
        className={`surga-fab-mic${isFabHidden ? ' surga-fab-hidden' : ''}`}
        aria-label="Commande vocale Surga"
        title="Parler à Surga"
        onClick={onOpenVoice}
      >
        <Mic size={22} />
      </button>

      {/* Navigation basse (mobile uniquement) */}
      <SurgaBottomNav activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  )
}
