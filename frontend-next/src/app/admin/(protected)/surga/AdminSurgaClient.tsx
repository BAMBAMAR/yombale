'use client'

import React, { useState, useEffect } from 'react'
import {
  Sparkles,
  UtensilsCrossed,
  GraduationCap,
  Newspaper,
  Navigation,
  ArrowUpRight,
  RefreshCw,
  Building,
} from 'lucide-react'
import AdminPlacesTab from './components/AdminPlacesTab'
import AdminConcoursTab from './components/AdminConcoursTab'
import AdminUnesTab from './components/AdminUnesTab'
import AdminTraficTab from './components/AdminTraficTab'

interface AdminSurgaStats {
  nb_places: number
  nb_concours: number
  nb_unes: number
  nb_signalements_attente: number
}

interface AdminSurgaClientProps {
  initialStats?: AdminSurgaStats | null
}

type TabType = 'places' | 'concours' | 'unes' | 'trafic'

export default function AdminSurgaClient({ initialStats }: AdminSurgaClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>('places')
  const [stats, setStats] = useState<AdminSurgaStats>(
    initialStats || {
      nb_places: 10,
      nb_concours: 8,
      nb_unes: 6,
      nb_signalements_attente: 0,
    }
  )

  useEffect(() => {
    fetch('/api/admin/surga/stats')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.stats) {
          setStats(data.stats)
        }
      })
      .catch(() => {})
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 4 Cartes KPI au standard Nopalou */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
        }}
      >
        {/* KPI 1 : Bonnes Adresses */}
        <div
          onClick={() => setActiveTab('places')}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            border: `1px solid ${activeTab === 'places' ? 'var(--accent, #C75B00)' : 'var(--border, #E8DDD2)'}`,
            padding: '16px 18px',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'all 0.15s ease',
          }}
        >
          <div>
            <div style={{ fontSize: 12, color: 'var(--text3, #73675E)', fontWeight: 600 }}>
              Bonnes Adresses Actives
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--navy, #1C2B4A)', marginTop: 4 }}>
              {stats.nb_places}
            </div>
            <span style={{ fontSize: 11, color: 'var(--accent, #C75B00)', fontWeight: 700 }}>
              Dakar &amp; Régions
            </span>
          </div>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              backgroundColor: 'rgba(199, 91, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent, #C75B00)',
            }}
          >
            <UtensilsCrossed size={20} />
          </div>
        </div>

        {/* KPI 2 : Concours Nationaux */}
        <div
          onClick={() => setActiveTab('concours')}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            border: `1px solid ${activeTab === 'concours' ? 'var(--navy, #1C2B4A)' : 'var(--border, #E8DDD2)'}`,
            padding: '16px 18px',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'all 0.15s ease',
          }}
        >
          <div>
            <div style={{ fontSize: 12, color: 'var(--text3, #73675E)', fontWeight: 600 }}>
              Concours &amp; Examens
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--navy, #1C2B4A)', marginTop: 4 }}>
              {stats.nb_concours}
            </div>
            <span style={{ fontSize: 11, color: 'var(--price, #0A5C36)', fontWeight: 700 }}>
              Sessions ouvertes
            </span>
          </div>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              backgroundColor: 'rgba(28, 43, 74, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--navy, #1C2B4A)',
            }}
          >
            <GraduationCap size={20} />
          </div>
        </div>

        {/* KPI 3 : Kiosque des Unes */}
        <div
          onClick={() => setActiveTab('unes')}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            border: `1px solid ${activeTab === 'unes' ? 'var(--accent, #C75B00)' : 'var(--border, #E8DDD2)'}`,
            padding: '16px 18px',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'all 0.15s ease',
          }}
        >
          <div>
            <div style={{ fontSize: 12, color: 'var(--text3, #73675E)', fontWeight: 600 }}>
              Kiosque des Unes
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--navy, #1C2B4A)', marginTop: 4 }}>
              {stats.nb_unes}
            </div>
            <span style={{ fontSize: 11, color: 'var(--text2, #5A4E42)', fontWeight: 700 }}>
              Quotidiens du jour
            </span>
          </div>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              backgroundColor: 'rgba(199, 91, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent, #C75B00)',
            }}
          >
            <Newspaper size={20} />
          </div>
        </div>

        {/* KPI 4 : Signalements Trafic */}
        <div
          onClick={() => setActiveTab('trafic')}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            border: `1px solid ${activeTab === 'trafic' ? '#DC2626' : 'var(--border, #E8DDD2)'}`,
            padding: '16px 18px',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'all 0.15s ease',
          }}
        >
          <div>
            <div style={{ fontSize: 12, color: 'var(--text3, #73675E)', fontWeight: 600 }}>
              Modération Trafic
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: stats.nb_signalements_attente > 0 ? '#DC2626' : 'var(--navy, #1C2B4A)', marginTop: 4 }}>
              {stats.nb_signalements_attente}
            </div>
            <span style={{ fontSize: 11, color: stats.nb_signalements_attente > 0 ? '#DC2626' : 'var(--price, #0A5C36)', fontWeight: 700 }}>
              {stats.nb_signalements_attente > 0 ? 'En attente d approbation' : 'Tout est modéré'}
            </span>
          </div>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              backgroundColor: stats.nb_signalements_attente > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(10, 92, 54, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: stats.nb_signalements_attente > 0 ? '#DC2626' : 'var(--price, #0A5C36)',
            }}
          >
            <Navigation size={20} />
          </div>
        </div>
      </div>

      {/* Barre d'onglets au design Nopalou */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          borderBottom: '1px solid var(--border, #E8DDD2)',
          paddingBottom: 2,
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('places')}
          style={{
            padding: '10px 16px',
            borderRadius: '8px 8px 0 0',
            border: 'none',
            borderBottom: activeTab === 'places' ? '3px solid var(--accent, #C75B00)' : '3px solid transparent',
            backgroundColor: activeTab === 'places' ? '#FFFFFF' : 'transparent',
            color: activeTab === 'places' ? 'var(--navy, #1C2B4A)' : 'var(--text3, #73675E)',
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <UtensilsCrossed size={15} color={activeTab === 'places' ? 'var(--accent, #C75B00)' : undefined} />
          <span>Bonnes Adresses ({stats.nb_places})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('concours')}
          style={{
            padding: '10px 16px',
            borderRadius: '8px 8px 0 0',
            border: 'none',
            borderBottom: activeTab === 'concours' ? '3px solid var(--navy, #1C2B4A)' : '3px solid transparent',
            backgroundColor: activeTab === 'concours' ? '#FFFFFF' : 'transparent',
            color: activeTab === 'concours' ? 'var(--navy, #1C2B4A)' : 'var(--text3, #73675E)',
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <GraduationCap size={15} color={activeTab === 'concours' ? 'var(--navy, #1C2B4A)' : undefined} />
          <span>Concours &amp; Examens ({stats.nb_concours})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('unes')}
          style={{
            padding: '10px 16px',
            borderRadius: '8px 8px 0 0',
            border: 'none',
            borderBottom: activeTab === 'unes' ? '3px solid var(--accent, #C75B00)' : '3px solid transparent',
            backgroundColor: activeTab === 'unes' ? '#FFFFFF' : 'transparent',
            color: activeTab === 'unes' ? 'var(--navy, #1C2B4A)' : 'var(--text3, #73675E)',
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Newspaper size={15} color={activeTab === 'unes' ? 'var(--accent, #C75B00)' : undefined} />
          <span>Kiosque des Unes ({stats.nb_unes})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('trafic')}
          style={{
            padding: '10px 16px',
            borderRadius: '8px 8px 0 0',
            border: 'none',
            borderBottom: activeTab === 'trafic' ? '3px solid #DC2626' : '3px solid transparent',
            backgroundColor: activeTab === 'trafic' ? '#FFFFFF' : 'transparent',
            color: activeTab === 'trafic' ? 'var(--navy, #1C2B4A)' : 'var(--text3, #73675E)',
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Navigation size={15} color={activeTab === 'trafic' ? '#DC2626' : undefined} />
          <span>Modération Trafic</span>
          {stats.nb_signalements_attente > 0 && (
            <span
              style={{
                backgroundColor: '#DC2626',
                color: '#FFFFFF',
                fontSize: 10,
                fontWeight: 800,
                padding: '1px 5px',
                borderRadius: 10,
              }}
            >
              {stats.nb_signalements_attente}
            </span>
          )}
        </button>
      </div>

      {/* Contenu dynamique de l'onglet actif */}
      <div>
        {activeTab === 'places' && <AdminPlacesTab />}
        {activeTab === 'concours' && <AdminConcoursTab />}
        {activeTab === 'unes' && <AdminUnesTab />}
        {activeTab === 'trafic' && <AdminTraficTab />}
      </div>
    </div>
  )
}
