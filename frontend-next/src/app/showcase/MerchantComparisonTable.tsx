'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, X, SlidersHorizontal, Table2 } from 'lucide-react'

type CompetitorKey = 'whatsapp' | 'cahier' | 'shopify' | 'table'

interface CriterionData {
  id: string
  label: string
  nopalou: { val: string; positive: boolean }
  whatsapp: { val: string; positive: boolean }
  cahier: { val: string; positive: boolean }
  shopify: { val: string; positive: boolean }
}

const CRITERIA: CriterionData[] = [
  {
    id: 'commission',
    label: 'Commission sur vos ventes',
    nopalou: { val: '0% (Direct Wave/OM)', positive: true },
    whatsapp: { val: '0%', positive: true },
    cahier: { val: '0%', positive: true },
    shopify: { val: '2% + Frais passerelle', positive: false },
  },
  {
    id: 'caisse',
    label: 'Caisse POS Hors-Ligne (Sans Net)',
    nopalou: { val: '100% Hors-Ligne (PWA)', positive: true },
    whatsapp: { val: "Dépend d'Internet", positive: false },
    cahier: { val: 'Manuel', positive: true },
    shopify: { val: 'Connexion requise', positive: false },
  },
  {
    id: 'dettes',
    label: 'Carnet Dettes & Relance Wave',
    nopalou: { val: 'Relances 1-Clic Wave', positive: true },
    whatsapp: { val: 'Messages manuels', positive: false },
    cahier: { val: 'Oublis fréquents', positive: false },
    shopify: { val: 'Non adapté Sénégal', positive: false },
  },
  {
    id: 'materiel',
    label: 'Matériel supplémentaire requis',
    nopalou: { val: '0 F (Votre smartphone)', positive: true },
    whatsapp: { val: 'Smartphone', positive: true },
    cahier: { val: "Cahier d'écolier", positive: true },
    shopify: { val: 'PC obligatoire', positive: false },
  },
  {
    id: 'prix',
    label: "Prix d'accès",
    nopalou: { val: 'Dès 2 500 F/mois (30j offerts)', positive: true },
    whatsapp: { val: 'Gratuit (3h perdues/j)', positive: false },
    cahier: { val: 'Cahier (~1 000 F)', positive: true },
    shopify: { val: '29 $ (~18 000 F) + Visa', positive: false },
  },
]

const COMPETITORS: { key: CompetitorKey; label: string; shortLabel: string }[] = [
  { key: 'whatsapp', label: 'vs WhatsApp Seul', shortLabel: 'WhatsApp' },
  { key: 'cahier', label: 'vs Cahier Papier', shortLabel: 'Cahier Papier' },
  { key: 'shopify', label: 'vs Shopify ($29/m)', shortLabel: 'Shopify' },
  { key: 'table', label: 'Vue Complète 360°', shortLabel: 'Tout le tableau' },
]

export default function MerchantComparisonTable() {
  const [activeCompetitor, setActiveCompetitor] = useState<CompetitorKey>('whatsapp')

  return (
    <section style={{ marginBottom: 48, width: '100%', boxSizing: 'border-box' }}>
      <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 20px', padding: '0 12px' }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 900,
            color: 'var(--accent, #C75B00)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          Comparatif Objectif
        </span>
        <h2
          style={{
            fontSize: 'clamp(20px, 2.4vw, 28px)',
            fontWeight: 900,
            color: 'var(--navy, #1C2B4A)',
            margin: '4px 0 6px',
            lineHeight: 1.25,
          }}
        >
          Pourquoi Choisir Nopalou face aux Alternatives ?
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text2, #5A4E42)', lineHeight: 1.5 }}>
          Comparez en un coup d&apos;œil ce qui fait la différence pour votre rentabilité au quotidien à Dakar.
        </p>
      </div>

      <div
        style={{
          background: '#ffffff',
          borderRadius: 20,
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          overflow: 'hidden',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* ── SÉLECTEUR MOBILE RESPONSIVE TABS (< 768px) ── */}
        <div className="comparison-mobile-selector" style={{ padding: '12px 14px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <SlidersHorizontal size={14} style={{ color: 'var(--accent, #C75B00)' }} />
            <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
              Comparer Nopalou face à :
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 6,
              overflowX: 'auto',
              scrollbarWidth: 'none',
              paddingBottom: 2,
            }}
          >
            {COMPETITORS.map(comp => {
              const isActive = activeCompetitor === comp.key
              return (
                <button
                  key={comp.key}
                  type="button"
                  onClick={() => setActiveCompetitor(comp.key)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '6px 12px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: isActive ? 850 : 650,
                    border: isActive ? '1.5px solid var(--accent, #C75B00)' : '1px solid #E2E8F0',
                    background: isActive ? 'var(--accent, #C75B00)' : '#ffffff',
                    color: isActive ? '#ffffff' : 'var(--navy, #1C2B4A)',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    boxShadow: isActive ? '0 2px 6px rgba(199,91,0,0.2)' : 'none',
                    transition: 'all 0.15s ease',
                    flexShrink: 0,
                  }}
                >
                  {comp.key === 'table' ? <Table2 size={13} /> : null}
                  <span>{comp.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── AFFICHAGE MOBILE DÉDIÉ : CARTE PAR CARTE SANS DÉBORDEMENT (< 768px) ── */}
        {activeCompetitor !== 'table' && (
          <div className="comparison-mobile-cards" style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {CRITERIA.map(c => {
              const compData = c[activeCompetitor as 'whatsapp' | 'cahier' | 'shopify']
              const compLabel = COMPETITORS.find(comp => comp.key === activeCompetitor)?.shortLabel || 'Alternative'

              return (
                <div
                  key={c.id}
                  style={{
                    background: '#FAFAF9',
                    borderRadius: 14,
                    border: '1px solid #E8DDD2',
                    padding: '12px 14px',
                    boxSizing: 'border-box',
                  }}
                >
                  <div style={{ fontSize: 12.5, fontWeight: 900, color: 'var(--navy, #1C2B4A)', marginBottom: 8 }}>
                    {c.label}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {/* Bloc Nopalou */}
                    <div
                      style={{
                        background: '#FFF7ED',
                        border: '1.5px solid rgba(199,91,0,0.2)',
                        borderRadius: 10,
                        padding: '8px 10px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--accent, #C75B00)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Nopalou
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 900, color: '#16A34A', marginTop: 4, lineHeight: 1.3 }}>
                        {c.nopalou.val}
                      </span>
                    </div>

                    {/* Bloc Concurrent Choisi */}
                    <div
                      style={{
                        background: '#ffffff',
                        border: '1px solid #E2E8F0',
                        borderRadius: 10,
                        padding: '8px 10px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span style={{ fontSize: 10, fontWeight: 750, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {compLabel}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 750,
                          color: compData.positive ? '#334155' : '#DC2626',
                          marginTop: 4,
                          lineHeight: 1.3,
                        }}
                      >
                        {compData.val}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── TABLEAU COMPLET DESKTOP & VUE SCROLLABLE MOBILE AVEC PREMIÈRE COLONNE STICKY ── */}
        <div
          className={`comparison-desktop-table ${activeCompetitor === 'table' ? 'comparison-mobile-table-forced' : ''}`}
          style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}
        >
          {activeCompetitor === 'table' && (
            <div
              className="comparison-swipe-hint"
              style={{
                padding: '8px 14px',
                background: '#FFF3E8',
                color: 'var(--accent, #C75B00)',
                fontSize: 11.5,
                fontWeight: 750,
                textAlign: 'center',
                borderBottom: '1px solid #FED7AA',
              }}
            >
              Faites glisser horizontalement pour voir les 5 colonnes
            </div>
          )}

          <table style={{ width: '100%', minWidth: 620, borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <th
                  style={{
                    padding: '14px 16px',
                    fontWeight: 900,
                    color: 'var(--navy, #1C2B4A)',
                    width: '28%',
                    position: 'sticky',
                    left: 0,
                    background: '#F8FAFC',
                    zIndex: 2,
                    boxShadow: '2px 0 5px rgba(0,0,0,0.02)',
                  }}
                >
                  Critère Clé
                </th>
                <th style={{ padding: '14px 16px', fontWeight: 900, color: 'var(--accent, #C75B00)', background: '#FFF7ED', width: '26%' }}>
                  Nopalou Retail &amp; POS
                </th>
                <th style={{ padding: '14px 16px', fontWeight: 800, color: '#64748B', width: '15%' }}>WhatsApp Seul</th>
                <th style={{ padding: '14px 16px', fontWeight: 800, color: '#64748B', width: '15%' }}>Cahier Papier</th>
                <th style={{ padding: '14px 16px', fontWeight: 800, color: '#64748B', width: '16%' }}>Shopify ($29/m)</th>
              </tr>
            </thead>
            <tbody>
              {CRITERIA.map((c, idx) => (
                <tr key={c.id} style={{ borderBottom: idx === CRITERIA.length - 1 ? 'none' : '1px solid #F1F5F9' }}>
                  <td
                    style={{
                      padding: '12px 16px',
                      fontWeight: 800,
                      color: 'var(--navy, #1C2B4A)',
                      position: 'sticky',
                      left: 0,
                      background: '#ffffff',
                      zIndex: 1,
                      boxShadow: '2px 0 5px rgba(0,0,0,0.02)',
                    }}
                  >
                    {c.label}
                  </td>
                  <td
                    style={{
                      padding: '12px 16px',
                      background: '#FFF7ED',
                      fontWeight: 900,
                      color: c.id === 'prix' ? 'var(--accent, #C75B00)' : '#16A34A',
                    }}
                  >
                    {c.nopalou.val}
                  </td>
                  <td style={{ padding: '12px 16px', color: c.whatsapp.positive ? '#64748B' : '#DC2626', fontWeight: c.whatsapp.positive ? 500 : 700 }}>
                    {c.whatsapp.val}
                  </td>
                  <td style={{ padding: '12px 16px', color: c.cahier.positive ? '#64748B' : '#DC2626', fontWeight: c.cahier.positive ? 500 : 700 }}>
                    {c.cahier.val}
                  </td>
                  <td style={{ padding: '12px 16px', color: c.shopify.positive ? '#64748B' : '#DC2626', fontWeight: c.shopify.positive ? 500 : 700 }}>
                    {c.shopify.val}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── LIEN DU BAS VERS LA PAGE D'ANALYSE DÉTAILLÉE ── */}
        <div
          style={{
            padding: '12px 18px',
            background: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <span style={{ fontSize: 12, color: 'var(--text2, #5A4E42)' }}>
            Consulter l&apos;analyse complète et les études de cas détaillées :
          </span>
          <Link
            href="/pourquoi-nopalou"
            style={{
              color: 'var(--accent, #C75B00)',
              fontWeight: 800,
              fontSize: 12.5,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span>Lire le comparatif complet Pourquoi Choisir Nopalou ?</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      <style jsx>{`
        @media (min-width: 769px) {
          .comparison-mobile-selector {
            display: none !important;
          }
          .comparison-mobile-cards {
            display: none !important;
          }
          .comparison-desktop-table {
            display: block !important;
          }
          .comparison-swipe-hint {
            display: none !important;
          }
        }
        @media (max-width: 768px) {
          .comparison-desktop-table:not(.comparison-mobile-table-forced) {
            display: none !important;
          }
        }
      `}</style>
    </section>
  )
}
