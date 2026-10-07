'use client'

import React, { useState } from 'react'
import SurgaHeader from './SurgaHeader'
import SurgaBottomNav, { type SurgaTab } from './SurgaBottomNav'
import SurgaDesktopSidebar from './SurgaDesktopSidebar'
import SurgaDesktopRightRail from './SurgaDesktopRightRail'
import SurgaDesktopCommandBar from './SurgaDesktopCommandBar'
import SurgaAssistantModal, { type SurgaAssistantResultat } from './SurgaAssistantModal'
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
  onOpenShopping?: () => void
  onOpenPlaces: () => void
  onOpenPlusServices?: () => void
  onOpenDemarches?: () => void
  onOpenEmploi?: () => void
  onOpenVideos?: () => void
  onOpenCompte: () => void
  onOpenAuth: () => void
  onConfirmerDepense?: (depense: { montant: number; categorie: string; note: string }) => Promise<void>
  onConfirmerNote?: (note: { titre: string; contenu: string }) => Promise<void>
  onConfirmerRappel?: (rappel: { titre: string; date: string; heure: string }) => Promise<void>
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
  onOpenShopping,
  onOpenPlaces,
  onOpenPlusServices,
  onOpenDemarches,
  onOpenEmploi,
  onOpenVideos,
  onOpenCompte,
  onOpenAuth,
  onConfirmerDepense,
  onConfirmerNote,
  onConfirmerRappel,
}: SurgaLayoutShellProps) {
  // État de l'Assistant IA Unifié (Omnibar LLM & Actions)
  const [isAssistantOpen, setIsAssistantOpen] = useState(false)
  const [assistantQuery, setAssistantQuery] = useState('')
  const [assistantResultat, setAssistantResultat] = useState<SurgaAssistantResultat | null>(null)
  const [isAssistantLoading, setIsAssistantLoading] = useState(false)

  const handleExecuteAssistantQuery = async (queryText: string): Promise<SurgaAssistantResultat | null> => {
    setIsAssistantOpen(true)
    setAssistantQuery(queryText)
    setIsAssistantLoading(true)

    try {
      const res = await fetch('/api/surga/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText, userId: user?.id }),
      })

      const data = await res.json()
      if (data?.success && data?.resultat) {
        setAssistantResultat(data.resultat)
        return data.resultat
      }
      const replFallback: SurgaAssistantResultat = {
        type: 'LLM_REPLY',
        texte: 'Désolé, une erreur est survenue lors du traitement de votre demande.',
      }
      setAssistantResultat(replFallback)
      return replFallback
    } catch (err) {
      const replFallback: SurgaAssistantResultat = {
        type: 'LLM_REPLY',
        texte: 'Service temporairement indisponible. Vérifiez votre connexion internet.',
      }
      setAssistantResultat(replFallback)
      return replFallback
    } finally {
      setIsAssistantLoading(false)
    }
  }

  const handleOpenModal = (modalName: string) => {
    switch (modalName) {
      case 'trafic':
        onOpenTrafic()
        break
      case 'kiosque':
        onOpenPresse()
        break
      case 'radio':
        onOpenRadios()
        break
      case 'concours':
        onOpenConcours()
        break
      case 'immo':
        onOpenImmo()
        break
      case 'shopping':
        onOpenShopping?.()
        break
      case 'places':
        onOpenPlaces()
        break
      case 'demarches':
        onOpenDemarches?.()
        break
      case 'emploi':
        onOpenEmploi?.()
        break
      case 'videos':
        onOpenVideos?.()
        break
      case 'compte':
        onOpenCompte()
        break
      default:
        break
    }
  }

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
          user={user}
          nbNotes={nbNotes}
          nbAgenda={nbAgenda}
          quartier={quartier}
          onOpenTrafic={onOpenTrafic}
          onOpenPresse={onOpenPresse}
          onOpenRadios={onOpenRadios}
          onOpenConcours={onOpenConcours}
          onOpenImmo={onOpenImmo}
          onOpenShopping={onOpenShopping}
          onOpenPlaces={onOpenPlaces}
          onOpenPlusServices={onOpenPlusServices}
          onOpenDemarches={onOpenDemarches}
          onOpenEmploi={onOpenEmploi}
          onOpenVideos={onOpenVideos}
          onOpenCompte={onOpenCompte}
        />

        {/* Colonne 2 : Flux Central (Onglet actif + Command Bar) */}
        <div className="surga-center-feed" role="region" aria-label="Flux central Surga">
          <div className="surga-container">
            {children}
          </div>

          <div className="surga-desktop-command-wrapper">
            <SurgaDesktopCommandBar
              onOpenVoice={onOpenVoice}
              onSubmitQuery={handleExecuteAssistantQuery}
            />
          </div>
        </div>

        {/* Colonne 3 : Rail Droit Contextuel Desktop */}
        <SurgaDesktopRightRail
          statsApercu={statsApercu}
          soldeKalpeFormate={soldeKalpeFormate}
          nbNotes={nbNotes}
          nbAgenda={nbAgenda}
          ville={quartier}
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

      {/* Modale d'interaction de l'Assistant IA Unifié Surga */}
      <SurgaAssistantModal
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        initialQuery={assistantQuery}
        initialResultat={assistantResultat}
        isLoading={isAssistantLoading}
        onExecuterQuery={handleExecuteAssistantQuery}
        onConfirmerDepense={onConfirmerDepense}
        onConfirmerNote={onConfirmerNote}
        onConfirmerRappel={onConfirmerRappel}
        onNavigateTab={onTabChange}
        onOpenModal={handleOpenModal}
      />
    </div>
  )
}
