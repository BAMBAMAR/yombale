'use client'

import React from 'react'
import {
  ExternalLink,
  Film,
  Sparkles,
  Users,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react'
import { MainTab, PostFilter, SocialAccountAdmin, SocialAnalytics, SocialPostAdmin, SocialStats } from '../types'

interface SocialHeaderCardProps {
  boutiqueId: string
  boutiqueSlug?: string | null
  posts: SocialPostAdmin[]
  accounts: SocialAccountAdmin[]
  stats: SocialStats
  analytics: SocialAnalytics
  discoveredCount: number
  activeMainTab: MainTab
  setActiveMainTab: (tab: MainTab) => void
  setPostFilter: (filter: PostFilter) => void
  message: { type: 'success' | 'error' | 'info'; text: string } | null
  setMessage: (msg: { type: 'success' | 'error' | 'info'; text: string } | null) => void
}

export function SocialHeaderCard({
  boutiqueId,
  boutiqueSlug,
  posts,
  accounts,
  stats,
  analytics,
  discoveredCount,
  activeMainTab,
  setActiveMainTab,
  setPostFilter,
  message,
  setMessage,
}: SocialHeaderCardProps) {
  return (
    <>
      {/* ── HEADER COMPACT & SEGMENTED CONTROLS ANTI-LONGUEUR ── */}
      <div className="social-shop-compact-card">
        {/* Ligne Titre & CTA Vitrine */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #ea580c 0%, #C75B00 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 2px 8px rgba(199,91,0,0.25)',
                flexShrink: 0,
              }}
            >
              <Film size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#0f172a' }}>
                  Social Shop
                </h2>
                <span
                  style={{
                    fontSize: 10.5,
                    background: '#dcfce7',
                    color: '#15803d',
                    padding: '1px 6px',
                    borderRadius: 10,
                    fontWeight: 800,
                  }}
                >
                  En direct
                </span>
              </div>
              <p style={{ margin: '1px 0 0', fontSize: 11.5, color: '#64748b' }}>
                Vitrine interactive TikTok, Instagram &amp; Facebook
              </p>
            </div>
          </div>

          <a
            href={`/boutiques/${boutiqueSlug || boutiqueId}?tab=social`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 20,
              background: '#0f172a',
              color: '#ffffff',
              fontSize: 12,
              fontWeight: 800,
              textDecoration: 'none',
              flexShrink: 0,
              boxShadow: '0 2px 6px rgba(15,23,42,0.15)',
            }}
          >
            <span>Voir ma vitrine</span>
            <ExternalLink size={12} />
          </a>
        </div>

        {/* Barre de Micro-KPIs en 1 seule ligne compacte */}
        <div className="social-micro-kpi-bar" style={{ marginTop: 12 }}>
          <div
            className="social-micro-kpi-item"
            onClick={() => {
              setActiveMainTab('posts')
              setPostFilter('all')
            }}
            style={{ cursor: 'pointer' }}
            title="Voir toutes les publications"
          >
            <span className="social-micro-kpi-val" style={{ color: '#0f172a' }}>
              {stats.posts_affiches || 0}
              <span style={{ fontSize: 10.5, fontWeight: 600, color: '#94a3b8' }}>/{stats.total_posts || 0}</span>
            </span>
            <span className="social-micro-kpi-lbl">en ligne</span>
          </div>

          <div className="social-micro-kpi-divider" />

          <div
            className="social-micro-kpi-item"
            onClick={() => {
              setActiveMainTab('posts')
              setPostFilter('unlinked')
            }}
            style={{ cursor: 'pointer' }}
            title="Filtrer les publications sans produit"
          >
            <span
              className="social-micro-kpi-val"
              style={{ color: (stats.posts_sans_produits || 0) > 0 ? '#ea580c' : '#16a34a' }}
            >
              {(stats.posts_sans_produits || 0) > 0 ? `${stats.posts_sans_produits}` : '0'}
            </span>
            <span className="social-micro-kpi-lbl">à associer</span>
          </div>

          <div className="social-micro-kpi-divider" />

          <div className="social-micro-kpi-item">
            <span className="social-micro-kpi-val" style={{ color: '#2563eb' }}>
              {analytics.vues_sociales || 0}
            </span>
            <span className="social-micro-kpi-lbl">vues (30j)</span>
          </div>

          <div className="social-micro-kpi-divider" />

          <div className="social-micro-kpi-item">
            <span className="social-micro-kpi-val" style={{ color: '#16a34a' }}>
              {analytics.clics_whatsapp || 0}
            </span>
            <span className="social-micro-kpi-lbl">clics WA</span>
          </div>
        </div>

        {/* Ruban de navigation par onglets segmentés (Segmented Control) */}
        <div className="social-segmented-nav" style={{ marginTop: 12 }}>
          <button
            type="button"
            onClick={() => setActiveMainTab('posts')}
            className={`social-segment-btn ${activeMainTab === 'posts' ? 'active' : ''}`}
          >
            <Film size={13} />
            <span>Mes Publications</span>
            <span className="social-segment-badge">{posts.length}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('import')}
            className={`social-segment-btn ${activeMainTab === 'import' ? 'active' : ''}`}
          >
            <Sparkles size={13} />
            <span>Ajouter</span>
            {discoveredCount > 0 && (
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ea580c' }} />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('accounts')}
            className={`social-segment-btn ${activeMainTab === 'accounts' ? 'active' : ''}`}
          >
            <Users size={13} />
            <span>Profils</span>
            <span className="social-segment-badge">
              {accounts.filter(a => a.nom_compte).length}/3
            </span>
          </button>
        </div>
      </div>

      {/* Notification Toast Globale */}
      {message && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            background: message.type === 'success' ? '#f0fdf4' : message.type === 'info' ? '#f0f9ff' : '#fef2f2',
            border: `1px solid ${message.type === 'success' ? '#bbf7d0' : message.type === 'info' ? '#bae6fd' : '#fecaca'}`,
            color: message.type === 'success' ? '#15803d' : message.type === 'info' ? '#0369a1' : '#b91c1c',
            fontSize: 12.5,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            {message.type === 'success' ? (
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            ) : (
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
            )}
            <span style={{ wordBreak: 'break-word' }}>{message.text}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'inherit',
              padding: 0,
              opacity: 0.7,
              flexShrink: 0,
            }}
          >
            <X size={15} />
          </button>
        </div>
      )}
    </>
  )
}
