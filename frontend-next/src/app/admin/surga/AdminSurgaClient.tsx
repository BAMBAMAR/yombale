'use client'

import React, { useState, useEffect } from 'react'
import {
  Sparkles,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react'
import AdminSurgaSidebar, { SurgaAdminTab } from './components/AdminSurgaSidebar'
import AdminOverviewTab from './components/AdminOverviewTab'
import AdminAbonnementsTab from './components/AdminAbonnementsTab'
import AdminPlacesTab from './components/AdminPlacesTab'
import AdminConcoursTab from './components/AdminConcoursTab'
import AdminUnesTab from './components/AdminUnesTab'
import AdminTraficTab from './components/AdminTraficTab'
import AdminRadiosTab from './components/AdminRadiosTab'
import AdminConfigTab from './components/AdminConfigTab'

interface AdminSurgaStats {
  nb_places: number
  nb_concours: number
  nb_unes: number
  nb_signalements_attente: number
}

interface AdminSurgaClientProps {
  initialStats?: AdminSurgaStats | null
  adminEmail?: string
  adminRole?: string
  logoutAction?: () => Promise<void>
}

const TAB_TITLES: Record<SurgaAdminTab, { title: string; subtitle: string }> = {
  overview: {
    title: 'Tableau de Bord & Supervision',
    subtitle: 'Vue d\'ensemble 360° des services, métriques territoriales et état des passerelles.',
  },
  abonnements: {
    title: 'Abonnements & Gestion du MRR',
    subtitle: 'Suivi des formules Premium B2C, partenariats B2B et encaissements Wave / Orange Money.',
  },
  places: {
    title: 'Bonnes Adresses Dakaroises',
    subtitle: 'Gestion du carnet des 42 adresses certifiées, restaurants, dibiteries et cafés.',
  },
  concours: {
    title: 'Concours & Examens Nationaux',
    subtitle: 'Calendrier officiel ENA, FASTEF, Douanes, quittances Trésor et alertes candidats.',
  },
  unes: {
    title: 'Kiosque des Unes de Presse',
    subtitle: 'Publication quotidienne des Unes des quotidiens nationaux sénégalais.',
  },
  trafic: {
    title: 'Modération du Trafic Citoyen',
    subtitle: 'Validation en temps réel des signalements sur les corridors routiers dakarois.',
  },
  radios: {
    title: 'Radios Locales & Podcasts',
    subtitle: 'Gestion des flux audio en direct RFM, Zik FM, Walf, Lamp Fall et flux RSS privé.',
  },
  config: {
    title: 'Configuration Système & IA',
    subtitle: 'Directives de persona, directives déterministes, quotas vocaux et état des clés API.',
  },
}

export default function AdminSurgaClient({
  initialStats,
  adminEmail,
  adminRole,
  logoutAction,
}: AdminSurgaClientProps) {
  const [activeTab, setActiveTab] = useState<SurgaAdminTab>('overview')
  const [stats, setStats] = useState<AdminSurgaStats>(
    initialStats || {
      nb_places: 42,
      nb_concours: 8,
      nb_unes: 6,
      nb_signalements_attente: 0,
    }
  )
  const [actualisationEnCours, setActualisationEnCours] = useState(false)

  const actualiserStats = () => {
    setActualisationEnCours(true)
    fetch('/api/admin/surga/stats')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.stats) {
          setStats(data.stats)
        }
      })
      .catch(() => {})
      .finally(() => {
        setTimeout(() => setActualisationEnCours(false), 400)
      })
  }

  useEffect(() => {
    actualiserStats()
  }, [])

  const currentTabInfo = TAB_TITLES[activeTab] || TAB_TITLES.overview

  return (
    <div className="surga-admin-container">
      {/* Sidebar 100% dédiée Surga */}
      <AdminSurgaSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        stats={stats}
        adminEmail={adminEmail}
        adminRole={adminRole}
        logoutAction={logoutAction}
      />

      {/* Zone de contenu principale */}
      <div className="surga-admin-main">
        {/* Topbar supérieure autonome */}
        <header className="surga-admin-topbar">
          <div>
            <h1 className="surga-topbar-title">
              <Sparkles size={20} color="var(--surga-accent)" />
              <span>{currentTabInfo.title}</span>
            </h1>
            <p className="surga-topbar-subtitle">{currentTabInfo.subtitle}</p>
          </div>

          <div className="surga-topbar-actions">
            <button
              type="button"
              onClick={actualiserStats}
              disabled={actualisationEnCours}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: '1px solid var(--surga-border)',
                backgroundColor: '#FFFFFF',
                color: 'var(--surga-navy)',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <RefreshCw size={14} className={actualisationEnCours ? 'animate-spin' : ''} />
              <span>Actualiser</span>
            </button>

            <a
              href="/surga"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: 'var(--surga-accent)',
                color: '#FFFFFF',
                fontSize: 12,
                fontWeight: 800,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>Surga App</span>
              <ExternalLink size={13} />
            </a>
          </div>
        </header>

        {/* Corps de la page */}
        <main className="surga-admin-content">
          {activeTab === 'overview' && (
            <AdminOverviewTab stats={stats} onNavigateTab={setActiveTab} />
          )}
          {activeTab === 'abonnements' && <AdminAbonnementsTab />}
          {activeTab === 'places' && <AdminPlacesTab />}
          {activeTab === 'concours' && <AdminConcoursTab />}
          {activeTab === 'unes' && <AdminUnesTab />}
          {activeTab === 'trafic' && <AdminTraficTab />}
          {activeTab === 'radios' && <AdminRadiosTab />}
          {activeTab === 'config' && <AdminConfigTab />}
        </main>
      </div>
    </div>
  )
}
