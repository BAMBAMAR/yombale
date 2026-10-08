'use client'

import React, { useState, useEffect } from 'react'
import {
  Sparkles,
  RefreshCw,
  ExternalLink,
} from 'lucide-react'
import AdminSurgaSidebar, { SurgaAdminTab } from './components/AdminSurgaSidebar'
import AdminOverviewTab from './components/AdminOverviewTab'
import AdminPlansTab from './components/AdminPlansTab'
import AdminAbonnementsTab from './components/AdminAbonnementsTab'
import AdminComptesTab from './components/AdminComptesTab'
import AdminReseauxTab from './components/AdminReseauxTab'
import AdminPlacesTab from './components/AdminPlacesTab'
import AdminConcoursTab from './components/AdminConcoursTab'
import AdminDemarchesTab from './components/AdminDemarchesTab'
import AdminVideosTab from './components/AdminVideosTab'
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
    title: 'Tableau de Bord 360° & Supervision',
    subtitle: 'Centre de commandement unifié : métriques territoriales, santé des passerelles et activité temps réel.',
  },
  plans: {
    title: 'Tarifs & Formules d\'Abonnement',
    subtitle: 'Fixez librement les montants mensuels et annuels en FCFA, remises promotionnelles et avantages inclus.',
  },
  abonnements: {
    title: 'Souscriptions & Gestion du MRR',
    subtitle: 'Suivi des paiements Wave, régularisations manuelles et volume financier encaissé.',
  },
  comptes: {
    title: 'Gestion des Comptes & Droits VIP',
    subtitle: 'Annuaire des utilisateurs Surga, attribution directe d’un abonnement offert et état des comptes.',
  },
  reseaux: {
    title: 'Réseaux Sociaux & Canaux de Diffusion',
    subtitle: 'Passerelle WhatsApp, bot de notification, canaux Telegram et modèles de messages automatiques.',
  },
  places: {
    title: 'Bonnes Adresses Dakaroises',
    subtitle: 'Pilotage du carnet des 42 adresses certifiées, restaurants, dibiteries et cafés.',
  },
  concours: {
    title: 'Concours & Examens Nationaux',
    subtitle: 'Calendrier officiel ENA, FASTEF, Douanes, quittances Trésor et alertes candidats.',
  },
  demarches: {
    title: 'Démarches Administratives Vérifiées',
    subtitle: 'Fiches officielles certifiées de l État sénégalais, re-vérification 90 jours et modération des signalements.',
  },
  videos: {
    title: 'Séries TV & Lutte Sénégalaise',
    subtitle: 'Supervision des flux officiels YouTube, alertes sorties d épisodes et dédoublonnage automatique.',
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
    subtitle: 'Directives de persona D19, vouvoiement strict, directives déterministes et clés API.',
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
      {/* Sidebar Dédiée Pro */}
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
        {/* Topbar Pro */}
        <header className="surga-admin-topbar">
          <div>
            <h1 className="surga-topbar-title">
              <Sparkles size={20} color="#F59E0B" />
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
                border: '1px solid #E2E8F0',
                backgroundColor: '#FFFFFF',
                color: '#0F172A',
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
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: '#0B132B',
                color: '#FFFFFF',
                fontSize: 12,
                fontWeight: 800,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span style={{ color: '#F59E0B' }}>Surga App</span>
              <ExternalLink size={13} color="#F59E0B" />
            </a>
          </div>
        </header>

        {/* Corps de la page */}
        <main className="surga-admin-content">
          {activeTab === 'overview' && (
            <AdminOverviewTab stats={stats} onNavigateTab={setActiveTab} />
          )}
          {activeTab === 'plans' && <AdminPlansTab />}
          {activeTab === 'abonnements' && <AdminAbonnementsTab />}
          {activeTab === 'comptes' && <AdminComptesTab />}
          {activeTab === 'reseaux' && <AdminReseauxTab />}
          {activeTab === 'places' && <AdminPlacesTab />}
          {activeTab === 'concours' && <AdminConcoursTab />}
          {activeTab === 'demarches' && <AdminDemarchesTab />}
          {activeTab === 'videos' && <AdminVideosTab />}
          {activeTab === 'unes' && <AdminUnesTab />}
          {activeTab === 'trafic' && <AdminTraficTab />}
          {activeTab === 'radios' && <AdminRadiosTab />}
          {activeTab === 'config' && <AdminConfigTab />}
        </main>
      </div>
    </div>
  )
}
