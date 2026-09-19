'use client'

import React from 'react'
import { ArrowUpRight, ArrowDownLeft, BookOpen, PiggyBank } from 'lucide-react'
import type { KalpeSynthese } from '../types'

interface KalpeSituationCardsProps {
  synthese: KalpeSynthese | null
  loading: boolean
}

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n)
}

export default function KalpeSituationCards({ synthese, loading }: KalpeSituationCardsProps) {
  const dispo = synthese?.disponible || 0
  const entrees = synthese?.entrees_mois || 0
  const sorties = synthese?.sorties_mois || 0
  const aRecevoir = synthese?.a_recevoir || 0
  const epargne = synthese?.epargne_totale || 0

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {/* ── Carte Centrale : Disponible Estimé ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1C2B4A 0%, #152238 100%)',
          borderRadius: 16,
          padding: '20px 18px',
          color: '#ffffff',
          boxShadow: '0 4px 14px rgba(28, 43, 74, 0.12)',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span
            style={{
              fontSize: 11.5,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: '#94A3B8',
            }}
          >
            Disponible sous la main
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '3px 9px',
              borderRadius: 8,
              background: 'rgba(255, 255, 255, 0.08)',
              color: dispo >= 0 ? '#E2E8F0' : '#FCA5A5',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            {dispo >= 0 ? 'Solde positif' : 'Déficit'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 16 }}>
          <span style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.1, color: '#FFFFFF' }}>
            {loading ? '—' : fmt(dispo)}
          </span>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#94A3B8' }}>FCFA</span>
        </div>

        {/* 4 Métriques Secondaires d'un Coup d'Œil */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: 10,
            paddingTop: 14,
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {/* Entrées du mois */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: 'rgba(16, 185, 129, 0.14)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6EE7B7',
                flexShrink: 0,
              }}
            >
              <ArrowUpRight size={16} strokeWidth={2.2} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 10.5, color: '#94A3B8', fontWeight: 600 }}>Entrées mois</div>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: '#FFFFFF', whiteSpace: 'nowrap' }}>
                +{fmt(entrees)} F
              </div>
            </div>
          </div>

          {/* Dépenses du mois */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: 'rgba(239, 68, 68, 0.14)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FCA5A5',
                flexShrink: 0,
              }}
            >
              <ArrowDownLeft size={16} strokeWidth={2.2} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 10.5, color: '#94A3B8', fontWeight: 600 }}>Sorties mois</div>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: '#FFFFFF', whiteSpace: 'nowrap' }}>
                -{fmt(sorties)} F
              </div>
            </div>
          </div>

          {/* À recevoir (Créances) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: 'rgba(245, 158, 11, 0.14)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FCD34D',
                flexShrink: 0,
              }}
            >
              <BookOpen size={15} strokeWidth={2.2} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 10.5, color: '#94A3B8', fontWeight: 600 }}>À recevoir</div>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: '#FFFFFF', whiteSpace: 'nowrap' }}>
                {fmt(aRecevoir)} F
              </div>
            </div>
          </div>

          {/* Épargne totale */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: 'rgba(56, 189, 248, 0.14)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#93C5FD',
                flexShrink: 0,
              }}
            >
              <PiggyBank size={15} strokeWidth={2.2} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 10.5, color: '#94A3B8', fontWeight: 600 }}>Épargne totale</div>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: '#FFFFFF', whiteSpace: 'nowrap' }}>
                {fmt(epargne)} F
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
