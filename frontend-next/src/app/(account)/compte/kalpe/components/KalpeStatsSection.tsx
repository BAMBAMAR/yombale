'use client'

import React, { useState, useEffect } from 'react'
import {
  ArrowUpRight,
  ArrowDownLeft,
  User,
  Store,
} from 'lucide-react'
import type { KalpeStats } from '../types'
import { getKalpeStats } from '../actions'
import KalpeAlertsBanner from './KalpeAlertsBanner'
import KalpeContexteBreakdown from './KalpeContexteBreakdown'
import KalpeConseilsSection from './KalpeConseilsSection'

interface KalpeStatsSectionProps {
  initialContexte?: 'all' | 'personnel' | 'activite'
  onNavigateTab?: (tab: 'apercu' | 'journal' | 'dettes' | 'epargne' | 'stats') => void
}

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n)
}

export default function KalpeStatsSection({
  initialContexte = 'all',
  onNavigateTab,
}: KalpeStatsSectionProps) {
  const [periode, setPeriode] = useState<'jour' | 'semaine' | 'mois' | 'annee'>('mois')
  const [contexte, setContexte] = useState<'all' | 'personnel' | 'activite'>(initialContexte)
  const [stats, setStats] = useState<KalpeStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    getKalpeStats(periode, contexte)
      .then((res) => {
        if (isMounted) {
          setStats(res)
          setLoading(false)
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [periode, contexte])

  const entrees = stats?.entrees || 0
  const sorties = stats?.sorties || 0
  const soldeNet = stats?.solde_net || 0
  const categories = stats?.categories || []
  const ratioPerso = stats?.ratio?.personnel_pct || 100
  const ratioAct = stats?.ratio?.activite_pct || 0
  const alertes = stats?.alertes || []
  const conseils = stats?.conseils || []
  const tendances = stats?.tendances
  const details = stats?.details_contexte

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* ── 1. Filtres Période & Contexte (Personnel vs Activité) ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: 'var(--navy, #1C2B4A)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Statistiques & Analyses Financières
          </span>

          {/* Sélecteur Période */}
          <div style={{ display: 'flex', gap: 4, background: '#F1F5F9', padding: 3, borderRadius: 10 }}>
            {[
              { key: 'jour', label: "Aujourd'hui" },
              { key: 'semaine', label: 'Semaine' },
              { key: 'mois', label: 'Mois' },
              { key: 'annee', label: 'Année' },
            ].map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setPeriode(p.key as any)}
                style={{
                  padding: '5px 10px',
                  fontSize: 11.5,
                  fontWeight: 700,
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  background: periode === p.key ? 'var(--navy, #1C2B4A)' : 'transparent',
                  color: periode === p.key ? '#ffffff' : '#64748B',
                  transition: 'all 0.15s ease',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sélecteur Contexte : Vue Globale vs Personnel vs Activité */}
        <div
          style={{
            display: 'flex',
            gap: 6,
            background: '#FAF8F5',
            border: '1px solid var(--border, #E8DDD2)',
            padding: 4,
            borderRadius: 10,
            width: 'fit-content',
          }}
        >
          <button
            type="button"
            onClick={() => setContexte('all')}
            style={{
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 700,
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              background: contexte === 'all' ? 'var(--navy, #1C2B4A)' : 'transparent',
              color: contexte === 'all' ? '#ffffff' : '#64748B',
              transition: 'all 0.15s ease',
            }}
          >
            Vue d'ensemble
          </button>
          <button
            type="button"
            onClick={() => setContexte('personnel')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 700,
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              background: contexte === 'personnel' ? 'var(--navy, #1C2B4A)' : 'transparent',
              color: contexte === 'personnel' ? '#ffffff' : '#64748B',
              transition: 'all 0.15s ease',
            }}
          >
            <User size={13} />
            Personnel
          </button>
          <button
            type="button"
            onClick={() => setContexte('activite')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 700,
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              background: contexte === 'activite' ? 'var(--accent, #C75B00)' : 'transparent',
              color: contexte === 'activite' ? '#ffffff' : '#64748B',
              transition: 'all 0.15s ease',
            }}
          >
            <Store size={13} />
            Activité Pro
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '28px', textAlign: 'center', color: '#94A3B8', fontSize: 13, fontWeight: 600 }}>
          Calcul des statistiques et analyse des tendances...
        </div>
      ) : (
        <>
          {/* ── 2. Alertes Actives & Relances Automatiques ── */}
          <KalpeAlertsBanner alertes={alertes} onNavigateTab={onNavigateTab} />

          {/* ── 3. Carte Bilan Net selon contexte ── */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: 14,
              border: '1px solid var(--border, #E8DDD2)',
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#64748B',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Bilan net {contexte === 'personnel' ? 'Personnel' : contexte === 'activite' ? 'Activité' : 'Global'}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: 6,
                  background: soldeNet >= 0 ? '#ECFDF5' : '#FEF2F2',
                  color: soldeNet >= 0 ? 'var(--price, #0A5C36)' : '#DC2626',
                  border: `1px solid ${soldeNet >= 0 ? '#A7F3D0' : '#FECACA'}`,
                }}
              >
                {soldeNet >= 0 ? '+ Excédent net' : '- Déficit'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span
                style={{
                  fontSize: 28,
                  fontWeight: 900,
                  color: soldeNet >= 0 ? 'var(--price, #0A5C36)' : '#DC2626',
                }}
              >
                {soldeNet >= 0 ? '+' : ''}
                {fmt(soldeNet)}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#64748B' }}>FCFA</span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
                paddingTop: 12,
                borderTop: '1px solid #F1F5F9',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: '#ECFDF5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--price, #0A5C36)',
                  }}
                >
                  <ArrowUpRight size={16} strokeWidth={2.4} />
                </div>
                <div>
                  <div style={{ fontSize: 10.5, color: '#64748B', fontWeight: 600 }}>Total Entrées</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--price, #0A5C36)' }}>
                    +{fmt(entrees)} F
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: '#FFF7ED',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent, #C75B00)',
                  }}
                >
                  <ArrowDownLeft size={16} strokeWidth={2.4} />
                </div>
                <div>
                  <div style={{ fontSize: 10.5, color: '#64748B', fontWeight: 600 }}>Total Sorties</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent, #C75B00)' }}>
                    -{fmt(sorties)} F
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── 4. Comparatif Côte à Côte : Personnel vs Activité (quand vue globale) ── */}
          {contexte === 'all' && details && (
            <KalpeContexteBreakdown
              details={details}
              ratioPerso={ratioPerso}
              ratioAct={ratioAct}
              formatFn={fmt}
            />
          )}

          {/* ── 5. Répartition des Dépenses par Catégorie ── */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: 14,
              border: '1px solid var(--border, #E8DDD2)',
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: 'var(--navy, #1C2B4A)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Postes de Dépense ({categories.length})
              </div>
              {tendances?.top_depense && (
                <span style={{ fontSize: 11, color: '#64748B' }}>
                  Top : <strong>{tendances.top_depense.categorie}</strong> ({tendances.top_depense.pourcentage}%)
                </span>
              )}
            </div>

            {categories.length === 0 ? (
              <div style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center', padding: '16px 0' }}>
                Aucune dépense enregistrée sur cette période
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {categories.map((c, idx) => {
                  const colors = ['#C75B00', '#1C2B4A', '#0284C7', '#0A5C36', '#9333EA', '#64748B']
                  const barColor = colors[idx % colors.length]

                  return (
                    <div key={c.categorie} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700 }}>
                        <span style={{ textTransform: 'capitalize', color: 'var(--navy, #1C2B4A)' }}>
                          {c.categorie}
                        </span>
                        <span style={{ color: '#475569' }}>
                          {c.pourcentage} % • {fmt(c.montant)} F
                        </span>
                      </div>
                      <div
                        style={{
                          width: '100%',
                          height: 6,
                          borderRadius: 6,
                          background: '#F1F5F9',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${c.pourcentage}%`,
                            height: '100%',
                            borderRadius: 6,
                            background: barColor,
                            transition: 'width 0.4s ease',
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── 6. Conseils Financiers & Ce qu'il faut surveiller / éviter ── */}
          <KalpeConseilsSection conseils={conseils} tendances={tendances} />
        </>
      )}
    </div>
  )
}
