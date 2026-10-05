'use client'

import React from 'react'
import Link from 'next/link'
import {
  Sparkles,
  LayoutDashboard,
  CreditCard,
  UtensilsCrossed,
  GraduationCap,
  Newspaper,
  Navigation,
  Radio,
  Sliders,
  ExternalLink,
  ArrowLeftRight,
  LogOut,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react'

export type SurgaAdminTab =
  | 'overview'
  | 'abonnements'
  | 'places'
  | 'concours'
  | 'unes'
  | 'trafic'
  | 'radios'
  | 'config'

interface AdminSurgaSidebarProps {
  activeTab: SurgaAdminTab
  onSelectTab: (tab: SurgaAdminTab) => void
  stats?: {
    nb_places: number
    nb_concours: number
    nb_unes: number
    nb_signalements_attente: number
    abonnementsActifs?: number
  }
  adminEmail?: string
  adminRole?: string
  logoutAction?: () => Promise<void>
}

export default function AdminSurgaSidebar({
  activeTab,
  onSelectTab,
  stats,
  adminEmail,
  adminRole,
  logoutAction,
}: AdminSurgaSidebarProps) {
  return (
    <aside className="surga-admin-sidebar">
      {/* En-tête de marque Surga Admin */}
      <div className="surga-admin-brand">
        <div className="surga-brand-logo">
          <div className="surga-logo-icon">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="surga-brand-title">SURGA</div>
            <div className="surga-brand-sub">Console Admin</div>
          </div>
        </div>
        <div className="surga-status-pill">
          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#34D399' }} />
          <span>Live Dakar</span>
        </div>
      </div>

      {/* Navigation Principale */}
      <div className="surga-nav-section">
        <div className="surga-section-label">Pilotage &amp; Finances</div>

        <button
          type="button"
          onClick={() => onSelectTab('overview')}
          className={`surga-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
        >
          <div className="surga-nav-item-left">
            <LayoutDashboard size={16} />
            <span>Tableau de Bord</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('abonnements')}
          className={`surga-nav-item ${activeTab === 'abonnements' ? 'active' : ''}`}
        >
          <div className="surga-nav-item-left">
            <CreditCard size={16} />
            <span>Abonnements &amp; MRR</span>
          </div>
          <span className="surga-nav-badge success">XOF</span>
        </button>
      </div>

      <div className="surga-nav-section">
        <div className="surga-section-label">Contenus Territoriaux</div>

        <button
          type="button"
          onClick={() => onSelectTab('places')}
          className={`surga-nav-item ${activeTab === 'places' ? 'active' : ''}`}
        >
          <div className="surga-nav-item-left">
            <UtensilsCrossed size={16} />
            <span>Bonnes Adresses</span>
          </div>
          {stats && stats.nb_places > 0 && (
            <span className="surga-nav-badge">{stats.nb_places}</span>
          )}
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('concours')}
          className={`surga-nav-item ${activeTab === 'concours' ? 'active' : ''}`}
        >
          <div className="surga-nav-item-left">
            <GraduationCap size={16} />
            <span>Concours Nationaux</span>
          </div>
          {stats && stats.nb_concours > 0 && (
            <span className="surga-nav-badge">{stats.nb_concours}</span>
          )}
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('unes')}
          className={`surga-nav-item ${activeTab === 'unes' ? 'active' : ''}`}
        >
          <div className="surga-nav-item-left">
            <Newspaper size={16} />
            <span>Kiosque des Unes</span>
          </div>
          {stats && stats.nb_unes > 0 && (
            <span className="surga-nav-badge">{stats.nb_unes}</span>
          )}
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('trafic')}
          className={`surga-nav-item ${activeTab === 'trafic' ? 'active' : ''}`}
        >
          <div className="surga-nav-item-left">
            <Navigation size={16} />
            <span>Modération Trafic</span>
          </div>
          {stats && stats.nb_signalements_attente > 0 && (
            <span className="surga-nav-badge danger">
              {stats.nb_signalements_attente}
            </span>
          )}
        </button>
      </div>

      <div className="surga-nav-section">
        <div className="surga-section-label">Audio &amp; Système</div>

        <button
          type="button"
          onClick={() => onSelectTab('radios')}
          className={`surga-nav-item ${activeTab === 'radios' ? 'active' : ''}`}
        >
          <div className="surga-nav-item-left">
            <Radio size={16} />
            <span>Radios &amp; Podcasts</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('config')}
          className={`surga-nav-item ${activeTab === 'config' ? 'active' : ''}`}
        >
          <div className="surga-nav-item-left">
            <Sliders size={16} />
            <span>Configuration &amp; IA</span>
          </div>
        </button>
      </div>

      {/* Pied de Sidebar avec raccourcis et session */}
      <div className="surga-sidebar-footer">
        <Link
          href="/surga"
          target="_blank"
          rel="noopener noreferrer"
          className="surga-footer-link"
          style={{ color: 'var(--surga-accent)' }}
        >
          <ExternalLink size={14} />
          <span>Ouvrir Surga App</span>
        </Link>

        <Link
          href="/admin"
          className="surga-footer-link"
        >
          <ArrowLeftRight size={14} />
          <span>Accès Nopalou Admin</span>
        </Link>

        <div style={{ padding: '8px 10px', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 8, marginTop: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#D1D5DB' }}>
            <ShieldCheck size={13} color="var(--surga-accent)" />
            <span style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {adminEmail || 'Administrateur Surga'}
            </span>
          </div>
          <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2, textTransform: 'capitalize' }}>
            Rôle : {adminRole || 'Super Admin'}
          </div>
        </div>

        {logoutAction && (
          <form action={logoutAction}>
            <button
              type="submit"
              className="surga-footer-link"
              style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', color: '#F87171' }}
            >
              <LogOut size={14} />
              <span>Déconnexion</span>
            </button>
          </form>
        )}
      </div>
    </aside>
  )
}
