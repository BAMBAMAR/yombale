'use client'

import React from 'react'
import {
  UtensilsCrossed,
  GraduationCap,
  Newspaper,
  Navigation,
  CreditCard,
  TrendingUp,
  Radio,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  Server,
  Zap,
} from 'lucide-react'
import type { SurgaAdminTab } from './AdminSurgaSidebar'

interface AdminOverviewTabProps {
  stats: {
    nb_places: number
    nb_concours: number
    nb_unes: number
    nb_signalements_attente: number
  }
  onNavigateTab: (tab: SurgaAdminTab) => void
}

export default function AdminOverviewTab({ stats, onNavigateTab }: AdminOverviewTabProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Les statistiques d'usage ont leur rubrique dans le menu : un seul endroit, nommé. */}
      <button
        type="button"
        onClick={() => onNavigateTab('statistiques')}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, width: '100%', padding: '16px 20px', borderRadius: 12, border: '1px solid var(--surga-border)', backgroundColor: '#FFFFFF', cursor: 'pointer', textAlign: 'left' }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <span style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(28, 43, 74, 0.08)', color: 'var(--surga-navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} aria-hidden="true">
            <TrendingUp size={20} />
          </span>
          <span style={{ minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 15, fontWeight: 800, color: 'var(--surga-navy)' }}>Statistiques d’usage</span>
            <span style={{ display: 'block', fontSize: 13, color: 'var(--surga-text3)', marginTop: 2 }}>Comptes actifs, nouveaux comptes, payants, contenus créés, rubriques et quartiers.</span>
          </span>
        </span>
        <ArrowRight size={16} color="var(--surga-text3)" style={{ flexShrink: 0 }} />
      </button>

      {/* 4 KPIs Métiers Principaux */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--surga-text3)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Indicateurs Territoriaux
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
          }}
        >
          {/* KPI 1 : Bonnes Adresses */}
          <div
            onClick={() => onNavigateTab('places')}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              border: '1px solid var(--surga-border)',
              padding: '18px 20px',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.15s ease',
            }}
          >
            <div>
              <div style={{ fontSize: 12, color: 'var(--surga-text3)', fontWeight: 600 }}>
                Bonnes Adresses
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--surga-navy)', marginTop: 4 }}>
                {stats.nb_places}
              </div>
              <span style={{ fontSize: 11, color: 'var(--surga-accent)', fontWeight: 700 }}>
                Dakar &amp; Régions
              </span>
            </div>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                backgroundColor: 'rgba(199, 91, 0, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--surga-accent)',
              }}
            >
              <UtensilsCrossed size={22} />
            </div>
          </div>

          {/* KPI 2 : Concours Nationaux */}
          <div
            onClick={() => onNavigateTab('concours')}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              border: '1px solid var(--surga-border)',
              padding: '18px 20px',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.15s ease',
            }}
          >
            <div>
              <div style={{ fontSize: 12, color: 'var(--surga-text3)', fontWeight: 600 }}>
                Concours &amp; Examens
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--surga-navy)', marginTop: 4 }}>
                {stats.nb_concours}
              </div>
              <span style={{ fontSize: 11, color: 'var(--surga-price)', fontWeight: 700 }}>
                Sessions ouvertes
              </span>
            </div>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                backgroundColor: 'rgba(28, 43, 74, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--surga-navy)',
              }}
            >
              <GraduationCap size={22} />
            </div>
          </div>

          {/* KPI 3 : Kiosque des Unes */}
          <div
            onClick={() => onNavigateTab('unes')}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              border: '1px solid var(--surga-border)',
              padding: '18px 20px',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.15s ease',
            }}
          >
            <div>
              <div style={{ fontSize: 12, color: 'var(--surga-text3)', fontWeight: 600 }}>
                Kiosque des Unes
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--surga-navy)', marginTop: 4 }}>
                {stats.nb_unes}
              </div>
              <span style={{ fontSize: 11, color: 'var(--surga-text2)', fontWeight: 700 }}>
                Quotidiens du jour
              </span>
            </div>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                backgroundColor: 'rgba(199, 91, 0, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--surga-accent)',
              }}
            >
              <Newspaper size={22} />
            </div>
          </div>

          {/* KPI 4 : Signalements Trafic */}
          <div
            onClick={() => onNavigateTab('trafic')}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              border: `1px solid ${stats.nb_signalements_attente > 0 ? '#FCA5A5' : 'var(--surga-border)'}`,
              padding: '18px 20px',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.15s ease',
            }}
          >
            <div>
              <div style={{ fontSize: 12, color: 'var(--surga-text3)', fontWeight: 600 }}>
                Modération Trafic
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: stats.nb_signalements_attente > 0 ? '#DC2626' : 'var(--surga-navy)', marginTop: 4 }}>
                {stats.nb_signalements_attente}
              </div>
              <span style={{ fontSize: 11, color: stats.nb_signalements_attente > 0 ? '#DC2626' : 'var(--surga-price)', fontWeight: 700 }}>
                {stats.nb_signalements_attente > 0 ? 'En attente de modération' : 'Aucun incident en attente'}
              </span>
            </div>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                backgroundColor: stats.nb_signalements_attente > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(10, 92, 54, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: stats.nb_signalements_attente > 0 ? '#DC2626' : 'var(--surga-price)',
              }}
            >
              <Navigation size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* Raccourcis d'actions opérationnelles */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 12, padding: '20px 24px', border: '1px solid var(--surga-border)' }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--surga-navy)', marginBottom: 6 }}>
          Actions Rapides d&apos;Exploitation
        </div>
        <p style={{ fontSize: 13, color: 'var(--surga-text3)', margin: '0 0 16px' }}>
          Interventions directes sans friction sur les services en direct de l&apos;assistant Surga.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <button
            type="button"
            onClick={() => onNavigateTab('places')}
            style={{
              padding: '12px 16px',
              borderRadius: 8,
              border: '1px solid var(--surga-border)',
              backgroundColor: 'var(--surga-bg)',
              color: 'var(--surga-navy)',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Plus size={16} color="var(--surga-accent)" />
              Ajouter une Bonne Adresse
            </span>
            <ArrowRight size={14} color="var(--surga-text3)" />
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('unes')}
            style={{
              padding: '12px 16px',
              borderRadius: 8,
              border: '1px solid var(--surga-border)',
              backgroundColor: 'var(--surga-bg)',
              color: 'var(--surga-navy)',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Plus size={16} color="var(--surga-accent)" />
              Publier une Une du Jour
            </span>
            <ArrowRight size={14} color="var(--surga-text3)" />
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('abonnements')}
            style={{
              padding: '12px 16px',
              borderRadius: 8,
              border: '1px solid var(--surga-border)',
              backgroundColor: 'var(--surga-bg)',
              color: 'var(--surga-navy)',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CreditCard size={16} color="var(--surga-price)" />
              Consulter le MRR &amp; Souscriptions
            </span>
            <ArrowRight size={14} color="var(--surga-text3)" />
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('radios')}
            style={{
              padding: '12px 16px',
              borderRadius: 8,
              border: '1px solid var(--surga-border)',
              backgroundColor: 'var(--surga-bg)',
              color: 'var(--surga-navy)',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Radio size={16} color="var(--surga-navy)" />
              Tester les Radios &amp; Podcasts
            </span>
            <ArrowRight size={14} color="var(--surga-text3)" />
          </button>
        </div>
      </div>
    </div>
  )
}
