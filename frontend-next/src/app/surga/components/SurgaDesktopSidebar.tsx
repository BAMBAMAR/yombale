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
} from 'lucide-react'
import SurgaBrandLogo from './SurgaBrandLogo'
import type { SurgaTab } from './SurgaBottomNav'

interface SurgaDesktopSidebarProps {
  activeTab: SurgaTab
  onTabChange: (tab: SurgaTab) => void
  nbNotes?: number
  nbAgenda?: number
  quartier?: string
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
  nbNotes = 0,
  nbAgenda = 0,
  quartier = 'Dakar Plateau',
  onOpenTrafic,
  onOpenPresse,
  onOpenImmo,
  onOpenShopping,
  onOpenPlaces,
  onOpenPlusServices,
  onOpenCompte,
}: SurgaDesktopSidebarProps) {
  return (
    <aside className="surga-desktop-sidebar">
      <div>
        {/* En-tête Logo Officiel SURGA */}
        <div style={{ padding: '4px 8px 18px 8px' }}>
          <SurgaBrandLogo taille={34} afficherTexte={true} onClick={() => onTabChange('aujourdhui')} />
        </div>

        {/* GROUPE 1 : QUOTIDIEN */}
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
              <span>Notes &amp; Listes</span>
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
              <span>Agenda &amp; Rappels</span>
            </div>
            {nbAgenda > 0 && <span className="surga-sidebar-badge">{nbAgenda} rdv</span>}
          </button>
        </nav>

        {/* GROUPE 2 : SERVICES DAKAR ÉCLATÉS */}
        <div className="surga-sidebar-section-title" style={{ marginTop: 14 }}>Services Dakar</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <button
            type="button"
            onClick={onOpenTrafic}
            className="surga-sidebar-btn"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Navigation size={17} />
              <span>Trafic Dakar</span>
            </div>
            <span className="surga-sidebar-badge live">Live</span>
          </button>

          <button
            type="button"
            onClick={onOpenPresse}
            className="surga-sidebar-btn"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Newspaper size={17} />
              <span>Kiosque des Unes</span>
            </div>
          </button>

          <button
            type="button"
            onClick={onOpenImmo}
            className="surga-sidebar-btn"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Home size={17} />
              <span>Pôle Immobilier</span>
            </div>
          </button>

          {/* SERVICE SHOPPING NOPALOU (AU-DESSUS DE BONNES ADRESSES) */}
          {onOpenShopping && (
            <button
              type="button"
              onClick={onOpenShopping}
              className="surga-sidebar-btn"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ShoppingBag size={17} />
                <span>Shopping Nopalou</span>
              </div>
              <span className="surga-sidebar-badge promo">Boutiques</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenPlaces}
            className="surga-sidebar-btn"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <MapPin size={17} />
              <span>Bonnes Adresses</span>
            </div>
          </button>

          {/* BOUTON PLUS DE SERVICES (CENTRALISE LES AUTRES SERVICES SANS DÉFILEMENT DU MENU) */}
          {onOpenPlusServices && (
            <button
              type="button"
              onClick={onOpenPlusServices}
              className="surga-sidebar-btn surga-sidebar-btn-more"
              title="Accéder aux autres services sénégalais"
              style={{
                marginTop: 4,
                border: '1px dashed #D9CFC4',
                backgroundColor: '#F7F3EE',
                color: '#1C2B4A',
                fontWeight: 600,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <LayoutGrid size={17} style={{ color: '#C75B00' }} />
                <span>Plus de services</span>
              </div>
              <span
                className="surga-sidebar-badge"
                style={{
                  backgroundColor: 'rgba(199, 91, 0, 0.12)',
                  color: '#C75B00',
                  fontWeight: 700,
                }}
              >
                +7
              </span>
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
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <User size={16} />
            <span>Compte ({quartier})</span>
          </div>
        </button>
      </div>
    </aside>
  )
}
