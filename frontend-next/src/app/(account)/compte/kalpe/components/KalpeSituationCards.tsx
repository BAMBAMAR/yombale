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
        width: '100%',
      }}
    >
      {/* ── Carte Centrale : Disponible Estimé (Design Premium Lumineux) ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #FFFFFF 0%, #FCFBF9 50%, #F6EFE5 100%)',
          borderRadius: 20,
          padding: '22px 20px',
          color: 'var(--navy, #1C2B4A)',
          boxShadow: '0 8px 24px -4px rgba(28, 43, 74, 0.07), 0 2px 6px -1px rgba(28, 43, 74, 0.03)',
          position: 'relative',
          overflow: 'hidden',
          border: '1.5px solid var(--border, #E8DDD2)',
        }}
      >
        {/* Halo décoratif discret en arrière-plan */}
        <div
          style={{
            position: 'absolute',
            top: -30,
            right: -30,
            width: 140,
            height: 140,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(199, 91, 0, 0.06) 0%, rgba(28, 43, 74, 0.02) 70%, transparent 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Ligne En-tête : Titre & Badge de statut */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: dispo >= 0 ? 'var(--price, #0A5C36)' : '#DC2626',
                boxShadow: dispo >= 0 ? '0 0 0 3px rgba(10, 92, 54, 0.15)' : '0 0 0 3px rgba(220, 38, 38, 0.15)',
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: 11.5,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                color: '#64748B',
              }}
            >
              Disponible sous la main
            </span>
          </div>

          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: 20,
              background: dispo >= 0 ? 'rgba(10, 92, 54, 0.08)' : '#FEE2E2',
              color: dispo >= 0 ? 'var(--price, #0A5C36)' : '#B91C1C',
              border: dispo >= 0 ? '1px solid rgba(10, 92, 54, 0.2)' : '1px solid #FCA5A5',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            {dispo >= 0 ? 'Solde positif' : 'Déficit'}
          </span>
        </div>

        {/* Montant Principal */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 18, position: 'relative' }}>
          <span
            style={{
              fontSize: 34,
              fontWeight: 900,
              letterSpacing: '-0.025em',
              lineHeight: 1.1,
              color: 'var(--navy, #1C2B4A)',
            }}
          >
            {loading ? '—' : fmt(dispo)}
          </span>
          <span
            style={{
              fontSize: 12.5,
              fontWeight: 800,
              color: 'var(--accent, #C75B00)',
              background: 'rgba(199, 91, 0, 0.08)',
              padding: '3px 8px',
              borderRadius: 8,
              border: '1px solid rgba(199, 91, 0, 0.18)',
              letterSpacing: '0.04em',
            }}
          >
            FCFA
          </span>
        </div>

        {/* 4 Métriques Secondaires en Micro-Cartes Élégantes */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: 10,
            paddingTop: 16,
            borderTop: '1px solid var(--border, #E8DDD2)',
            position: 'relative',
          }}
        >
          {/* Entrées du mois */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 12,
              padding: '10px 12px',
              border: '1px solid var(--border, #E8DDD2)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              boxShadow: '0 1px 3px rgba(28, 43, 74, 0.03)',
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'rgba(10, 92, 54, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--price, #0A5C36)',
                flexShrink: 0,
              }}
            >
              <ArrowUpRight size={17} strokeWidth={2.4} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 10.5, color: '#64748B', fontWeight: 600 }}>Entrées mois</div>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--price, #0A5C36)', whiteSpace: 'nowrap' }}>
                +{fmt(entrees)} F
              </div>
            </div>
          </div>

          {/* Dépenses du mois */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 12,
              padding: '10px 12px',
              border: '1px solid var(--border, #E8DDD2)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              boxShadow: '0 1px 3px rgba(28, 43, 74, 0.03)',
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'rgba(225, 29, 72, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#E11D48',
                flexShrink: 0,
              }}
            >
              <ArrowDownLeft size={17} strokeWidth={2.4} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 10.5, color: '#64748B', fontWeight: 600 }}>Sorties mois</div>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: '#BE123C', whiteSpace: 'nowrap' }}>
                -{fmt(sorties)} F
              </div>
            </div>
          </div>

          {/* À recevoir (Créances) */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 12,
              padding: '10px 12px',
              border: '1px solid var(--border, #E8DDD2)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              boxShadow: '0 1px 3px rgba(28, 43, 74, 0.03)',
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'rgba(199, 91, 0, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent, #C75B00)',
                flexShrink: 0,
              }}
            >
              <BookOpen size={16} strokeWidth={2.4} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 10.5, color: '#64748B', fontWeight: 600 }}>À recevoir</div>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--navy, #1C2B4A)', whiteSpace: 'nowrap' }}>
                {fmt(aRecevoir)} F
              </div>
            </div>
          </div>

          {/* Épargne totale */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 12,
              padding: '10px 12px',
              border: '1px solid var(--border, #E8DDD2)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              boxShadow: '0 1px 3px rgba(28, 43, 74, 0.03)',
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'rgba(2, 132, 199, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0284C7',
                flexShrink: 0,
              }}
            >
              <PiggyBank size={16} strokeWidth={2.4} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 10.5, color: '#64748B', fontWeight: 600 }}>Épargne totale</div>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0369A1', whiteSpace: 'nowrap' }}>
                {fmt(epargne)} F
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
