'use client'

import React from 'react'
import {
  Sun,
  FileText,
  Wallet,
  Calendar,
  Navigation,
  Newspaper,
  Home,
  MapPin,
  ShoppingBag,
  LayoutGrid,
  Settings,
  User,
  UserCheck,
  Radio,
  Award,
  FileCheck,
  Briefcase,
  Tv,
  type LucideIcon,
} from 'lucide-react'
import SurgaBrandLogo from './SurgaBrandLogo'
import type { SurgaTab } from './SurgaBottomNav'

export const DEFAUT_SIDEBAR_SERVICES = ['trafic', 'presse', 'immo', 'shopping', 'places']

interface SurgaDesktopSidebarProps {
  activeTab: SurgaTab
  onTabChange: (tab: SurgaTab) => void
  user?: {
    id: string
    nom?: string
    telephone?: string
    email?: string
  } | null
  nbNotes?: number
  nbAgenda?: number
  quartier?: string
  servicesActifs?: string[]
  onOpenTrafic: () => void
  onOpenPresse: () => void
  onOpenImmo: () => void
  onOpenShopping?: () => void
  onOpenPlaces: () => void
  onOpenPlusServices?: () => void
  onOpenCompte: () => void
  onOpenRadios?: () => void
  onOpenConcours?: () => void
  onOpenDemarches?: () => void
  onOpenEmploi?: () => void
  onOpenVideos?: () => void
}

export default function SurgaDesktopSidebar({
  activeTab,
  onTabChange,
  user,
  nbNotes = 0,
  nbAgenda = 0,
  quartier = 'Dakar Plateau',
  servicesActifs,
  onOpenTrafic,
  onOpenPresse,
  onOpenImmo,
  onOpenShopping,
  onOpenPlaces,
  onOpenPlusServices,
  onOpenCompte,
  onOpenRadios,
  onOpenConcours,
  onOpenDemarches,
  onOpenEmploi,
  onOpenVideos,
}: SurgaDesktopSidebarProps) {
  const listeServices = Array.isArray(servicesActifs) && servicesActifs.length > 0
    ? servicesActifs
    : DEFAUT_SIDEBAR_SERVICES

  const tableServices: Record<string, { titre: string; icone: LucideIcon; action?: () => void }> = {
    trafic: { titre: 'Trafic', icone: Navigation, action: onOpenTrafic },
    presse: { titre: 'Kiosque des Unes', icone: Newspaper, action: onOpenPresse },
    immo: { titre: 'Pôle Immobilier', icone: Home, action: onOpenImmo },
    shopping: { titre: 'Shopping Nopalou', icone: ShoppingBag, action: onOpenShopping },
    places: { titre: 'Bonnes Adresses', icone: MapPin, action: onOpenPlaces },
    radios: { titre: 'Radios FM', icone: Radio, action: onOpenRadios },
    concours: { titre: 'Concours', icone: Award, action: onOpenConcours },
    demarches: { titre: 'Démarches', icone: FileCheck, action: onOpenDemarches },
    emploi: { titre: 'Emploi & Stages', icone: Briefcase, action: onOpenEmploi },
    videos: { titre: 'Séries & Vidéos', icone: Tv, action: onOpenVideos },
  }
  return (
    <aside className="surga-desktop-sidebar">
      <div>
        {/* En-tête Logo Officiel SURGA */}
        <div style={{ padding: '4px 8px 18px 8px' }}>
          <SurgaBrandLogo taille={34} afficherTexte={true} onClick={() => onTabChange('aujourdhui')} />
        </div>

        {/* GROUPE 1 : NAVIGATION COMMUNE (Même ordre et noms que barre mobile) */}
        <div className="surga-sidebar-section-title">Quotidien</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <button
            type="button"
            onClick={() => onTabChange('aujourdhui')}
            className={`surga-sidebar-btn${activeTab === 'aujourdhui' ? ' active' : ''}`}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Sun size={17} />
              <span>Aujourd&apos;hui</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('notes')}
            className={`surga-sidebar-btn${activeTab === 'notes' ? ' active' : ''}`}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FileText size={17} />
              <span>Notes</span>
            </div>
            {nbNotes > 0 && <span className="surga-sidebar-badge">{nbNotes}</span>}
          </button>

          <button
            type="button"
            onClick={() => onTabChange('depenses')}
            className={`surga-sidebar-btn${activeTab === 'depenses' ? ' active' : ''}`}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Wallet size={17} />
              <span>Sama Xaalis</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('agenda')}
            className={`surga-sidebar-btn${activeTab === 'agenda' ? ' active' : ''}`}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Calendar size={17} />
              <span>Agenda</span>
            </div>
          </button>
        </nav>

        {/* GROUPE 2 : SERVICES DAKAR ÉCLATÉS (PERSONNALISABLES) */}
        <div className="surga-sidebar-section-title" style={{ marginTop: 14 }}>Services</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {listeServices.map((idService) => {
            const def = tableServices[idService]
            if (!def || !def.action) return null
            const Icon = def.icone
            return (
              <button
                key={idService}
                type="button"
                onClick={def.action}
                className="surga-sidebar-btn"
                title={`Ouvrir ${def.titre}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Icon size={17} />
                  <span>{def.titre}</span>
                </div>
              </button>
            )
          })}

          {/* BOUTON PLUS DE SERVICES (STYLE NEUTRE SANS BADGE AGRESSIF) */}
          {onOpenPlusServices && (
            <button
              type="button"
              onClick={onOpenPlusServices}
              className="surga-sidebar-btn"
              title="Accéder aux autres services"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <LayoutGrid size={17} />
                <span>Plus de services</span>
              </div>
            </button>
          )}
        </nav>
      </div>

      {/* FOOTER : RÉGLAGES & COMPTE */}
      <div className="surga-sidebar-footer">
        <button
          type="button"
          onClick={() => onTabChange('services')}
          className={`surga-sidebar-btn${activeTab === 'services' || activeTab === 'plus' ? ' active' : ''}`}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Settings size={16} />
            <span>Réglages</span>
          </div>
        </button>

        <button
          type="button"
          onClick={onOpenCompte}
          className="surga-sidebar-btn"
          title={user ? (user.nom ? `Mon Compte (${user.nom})` : 'Mon Compte (Connecté)') : 'Mon Compte (Mode invité)'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {user ? <UserCheck size={16} /> : <User size={16} />}
            <span>Compte</span>
          </div>
        </button>
      </div>
    </aside>
  )
}
