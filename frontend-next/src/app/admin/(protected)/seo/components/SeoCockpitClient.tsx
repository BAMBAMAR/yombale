// frontend-next/src/app/admin/(protected)/seo/components/SeoCockpitClient.tsx
'use client'

import React, { useState } from 'react'
import {
  BarChart3,
  Search,
  Layers,
  ShieldCheck,
  DollarSign,
  AlertTriangle,
  Radio,
  ExternalLink,
  Activity,
  FileCode,
  Compass
} from 'lucide-react'
import { PeriodeSeo } from '../types'
import SeoTabVisibilite from './SeoTabVisibilite'
import SeoTabGroupes from './SeoTabGroupes'
import SeoTabPages from './SeoTabPages'
import SeoTabBacklog from './SeoTabBacklog'
import SeoTabConversions from './SeoTabConversions'
import SeoTabAlertes from './SeoTabAlertes'
import SeoTabSources from './SeoTabSources'

interface SeoCockpitClientProps {
  stats: {
    produits: number
    immo: number
    annonces: number
  }
}

type TabType = 'visibilite' | 'groupes' | 'pages' | 'backlog' | 'conversions' | 'alertes' | 'sources'

export default function SeoCockpitClient({ stats }: SeoCockpitClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>('visibilite')
  const [periode, setPeriode] = useState<PeriodeSeo>('28d')

  const totalPagesIndexables = 17 + stats.produits + Math.min(stats.immo, 200) + Math.min(stats.annonces, 200)

  const TABS = [
    { id: 'visibilite' as TabType, label: '1. Visibilité Globale', icon: BarChart3 },
    { id: 'groupes' as TabType, label: '2. Suivi 1 000 Groupes', icon: Search },
    { id: 'pages' as TabType, label: '3. Pages & URLs', icon: Layers },
    { id: 'backlog' as TabType, label: '4. Registre Audit & Corrections', icon: ShieldCheck },
    { id: 'conversions' as TabType, label: '5. Tunnels & MRR Organique', icon: DollarSign },
    { id: 'alertes' as TabType, label: '6. Alertes & Régressions', icon: AlertTriangle },
    { id: 'sources' as TabType, label: '7. Sources & Télémétrie GA4', icon: Radio },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Barre d'outils externes et validateurs rapides */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        background: '#ffffff',
        padding: '12px 18px',
        borderRadius: 10,
        border: '1px solid var(--border, #E8DDD2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>Outils officiels :</span>
          <a
            href="https://search.google.com/search-console"
            target="_blank"
            rel="noopener noreferrer"
            className="admin-action-btn"
            style={{ fontSize: 12, padding: '5px 10px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            Google Search Console <ExternalLink size={11} />
          </a>
          <a
            href="https://analytics.google.com/analytics/web/#/realtime"
            target="_blank"
            rel="noopener noreferrer"
            className="admin-action-btn"
            style={{ fontSize: 12, padding: '5px 10px', display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--navy, #1C2B4A)' }}
          >
            GA4 Temps Réel <ExternalLink size={11} />
          </a>
          <a
            href="https://pagespeed.web.dev/report?url=https%3A%2F%2Fnopalou.com"
            target="_blank"
            rel="noopener noreferrer"
            className="admin-action-btn"
            style={{ fontSize: 12, padding: '5px 10px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            PageSpeed Insights <ExternalLink size={11} />
          </a>
          <a
            href="https://nopalou.com/sitemap.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="admin-action-btn"
            style={{ fontSize: 12, padding: '5px 10px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            Sitemap XML <ExternalLink size={11} />
          </a>
          <a
            href="https://nopalou.com/robots.txt"
            target="_blank"
            rel="noopener noreferrer"
            className="admin-action-btn"
            style={{ fontSize: 12, padding: '5px 10px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            Robots.txt <ExternalLink size={11} />
          </a>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#059669', fontWeight: 700 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
          Audit SEO Tranche 1 Validé
        </div>
      </div>

      {/* Barre d'onglets de navigation */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        overflowX: 'auto',
        paddingBottom: 4,
        borderBottom: '2px solid #e2e8f0'
      }}>
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                borderRadius: '8px 8px 0 0',
                fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                border: 'none',
                background: isActive ? 'var(--navy, #1C2B4A)' : 'transparent',
                color: isActive ? '#ffffff' : '#64748b',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                marginBottom: -2,
                borderBottom: isActive ? '2px solid var(--navy, #1C2B4A)' : 'none'
              }}
            >
              <Icon size={15} style={{ color: isActive ? '#ffffff' : '#94a3b8' }} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Contenu de l'onglet actif */}
      <div>
        {activeTab === 'visibilite' && (
          <SeoTabVisibilite
            periode={periode}
            onSelectPeriode={setPeriode}
            totalIndexables={totalPagesIndexables}
          />
        )}

        {activeTab === 'groupes' && <SeoTabGroupes />}

        {activeTab === 'pages' && <SeoTabPages />}

        {activeTab === 'backlog' && <SeoTabBacklog />}

        {activeTab === 'conversions' && <SeoTabConversions />}

        {activeTab === 'alertes' && <SeoTabAlertes />}

        {activeTab === 'sources' && <SeoTabSources />}
      </div>
    </div>
  )
}
