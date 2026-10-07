'use client'

import React from 'react'
import {
  Sun,
  FileText,
  Wallet,
  Calendar,
  Navigation,
  Newspaper,
  Radio,
  GraduationCap,
  Home,
  MapPin,
  Settings,
  User,
} from 'lucide-react'
import type { SurgaTab } from './SurgaBottomNav'

interface SurgaDesktopSidebarProps {
  activeTab: SurgaTab
  onTabChange: (tab: SurgaTab) => void
  nbNotes?: number
  nbAgenda?: number
  quartier?: string
  onOpenTrafic: () => void
  onOpenPresse: () => void
  onOpenRadios: () => void
  onOpenConcours: () => void
  onOpenImmo: () => void
  onOpenPlaces: () => void
  onOpenCompte: () => void
}

export default function SurgaDesktopSidebar({
  activeTab,
  onTabChange,
  nbNotes = 0,
  nbAgenda = 0,
  quartier = 'Dakar Plateau',
  onOpenTrafic,
  onOpenPresse,
  onOpenRadios,
  onOpenConcours,
  onOpenImmo,
  onOpenPlaces,
  onOpenCompte,
}: SurgaDesktopSidebarProps) {
  return (
    <aside className="surga-desktop-sidebar">
      <div>
        {/* En-tête Logo SURGA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px 18px 8px' }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: 'var(--surga-primary, #0F172A)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontWeight: 900,
              fontSize: 16,
            }}
          >
            S
          </div>
          <div style={{ fontSize: 19, fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--surga-primary, #0F172A)' }}>
            SUR<span style={{ color: 'var(--surga-accent, #D97706)' }}>GA</span>
          </div>
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
            onClick={onOpenRadios}
            className="surga-sidebar-btn"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Radio size={17} />
              <span>Radios FM direct</span>
            </div>
          </button>

          <button
            type="button"
            onClick={onOpenConcours}
            className="surga-sidebar-btn"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <GraduationCap size={17} />
              <span>Concours &amp; ENA</span>
            </div>
            <span className="surga-sidebar-badge">J-7</span>
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
