'use client'

import React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  MapPin, DollarSign, ArrowUpDown, ChevronDown,
  Home, ShieldCheck, MessageCircle, Key, FileCheck, Armchair, Award, X
} from 'lucide-react'

export interface AgenceFilterBarProps {
  ville: string
  villes: string[]
  budget: string
  budgets: { val: string; label: string }[]
  tri: string
  transaction: string
  avecBiens: string
  agree: string
  whatsapp: string
  meuble: string
  plan: string
  recherche: string
}

export default function AgenceFilterBar({
  ville,
  villes,
  budget,
  budgets,
  tri,
  transaction,
  avecBiens,
  agree,
  whatsapp,
  meuble,
  plan,
  recherche,
}: AgenceFilterBarProps) {
  const router = useRouter()
  const pathname = usePathname()

  function updateFilter(updates: Record<string, string>) {
    const p = new URLSearchParams()
    if (recherche) p.set('recherche', recherche)
    if (ville) p.set('ville', ville)
    if (budget) p.set('budget', budget)
    if (tri) p.set('tri', tri)
    if (transaction) p.set('transaction', transaction)
    if (avecBiens) p.set('avec_biens', avecBiens)
    if (agree) p.set('agree', agree)
    if (whatsapp) p.set('whatsapp', whatsapp)
    if (meuble) p.set('meuble', meuble)
    if (plan) p.set('plan', plan)

    Object.entries(updates).forEach(([k, v]) => {
      if (v) p.set(k, v)
      else p.delete(k)
    })
    p.set('page', '1')
    router.push(`${pathname}?${p.toString()}#resultats`)
  }

  function handleResetAll() {
    const p = new URLSearchParams()
    if (recherche) p.set('recherche', recherche)
    p.set('page', '1')
    router.push(`${pathname}${p.toString() ? `?${p.toString()}` : ''}#resultats`)
  }

  const aDesFiltres = Boolean(
    ville || budget || transaction || avecBiens || agree || whatsapp ||
    meuble || plan || (tri && tri !== 'recommande')
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
      <style>{`
        .agences-filter-row-1 {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          flex-wrap: wrap;
        }
        .agences-filter-ville {
          flex: 1 1 125px;
        }
        .agences-filter-budget {
          flex: 1 1 155px;
        }
        .agences-filter-tri {
          flex: 1 1 160px;
        }
        @media (max-width: 768px) {
          .agences-filter-row-1 {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 6px !important;
          }
          .agences-filter-ville,
          .agences-filter-budget {
            width: 100% !important;
            flex: none !important;
          }
          .agences-filter-tri {
            width: 100% !important;
            flex: 1 !important;
            min-width: 0 !important;
          }
          .agences-filter-tri-container {
            grid-column: span 2 !important;
            display: flex !important;
            gap: 6px !important;
            width: 100% !important;
          }
          .agences-filter-select {
            padding-left: 20px !important;
            padding-right: 17px !important;
            font-size: 11px !important;
            font-weight: 600 !important;
            letter-spacing: -0.25px !important;
            height: 32px !important;
          }
          .agences-filter-icon-left {
            left: 5px !important;
          }
          .agences-filter-icon-right {
            right: 5px !important;
          }
        }
      `}</style>
      
      {/* ── LIGNE 1 : SÉLECTEURS PRINCIPAUX (VILLE, BUDGET FCFA, TRI) SANS CHEVAUCHEMENT ── */}
      <div className="agences-filter-row-1">
        {/* DROPDOWN VILLE */}
        <div className="agences-filter-ville" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
          <MapPin
            size={13}
            className="agences-filter-icon-left"
            style={{
              position: 'absolute',
              left: 10,
              color: ville ? '#C75B00' : '#64748b',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />
          <select
            value={ville}
            onChange={e => updateFilter({ ville: e.target.value })}
            className="agences-filter-select"
            style={{
              width: '100%',
              appearance: 'none',
              WebkitAppearance: 'none',
              paddingLeft: 30,
              paddingRight: 28,
              height: 32,
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              outline: 'none',
              background: ville ? '#fff7f0' : '#f8fafc',
              color: ville ? '#C75B00' : '#334155',
              border: ville ? '1.5px solid #C75B00' : '1px solid #e2e8f0',
              boxShadow: ville ? '0 2px 6px rgba(199,91,0,0.08)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <option value="">Toutes les villes</option>
            {villes.map(v => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
          <ChevronDown
            size={12}
            className="agences-filter-icon-right"
            style={{
              position: 'absolute',
              right: 10,
              color: ville ? '#C75B00' : '#94a3b8',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* DROPDOWN BUDGET FCFA */}
        <div className="agences-filter-budget" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
          <DollarSign
            size={13}
            className="agences-filter-icon-left"
            style={{
              position: 'absolute',
              left: 10,
              color: budget ? 'var(--price, #0A5C36)' : '#64748b',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />
          <select
            value={budget}
            onChange={e => updateFilter({ budget: e.target.value })}
            className="agences-filter-select"
            style={{
              width: '100%',
              appearance: 'none',
              WebkitAppearance: 'none',
              paddingLeft: 30,
              paddingRight: 28,
              height: 32,
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              outline: 'none',
              background: budget ? '#f0fdf4' : '#f8fafc',
              color: budget ? 'var(--price, #0A5C36)' : '#334155',
              border: budget ? '1.5px solid #16a34a' : '1px solid #e2e8f0',
              boxShadow: budget ? '0 2px 6px rgba(10,92,54,0.08)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <option value="">Tous les budgets</option>
            {budgets.filter(b => b.val).map(b => (
              <option key={b.val} value={b.val}>
                {b.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={12}
            className="agences-filter-icon-right"
            style={{
              position: 'absolute',
              right: 10,
              color: budget ? 'var(--price, #0A5C36)' : '#94a3b8',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* DROPDOWN TRIER & EFFACER */}
        <div className="agences-filter-tri-container">
          <div className="agences-filter-tri" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
            <ArrowUpDown
              size={13}
              className="agences-filter-icon-left"
              style={{
                position: 'absolute',
                left: 10,
                color: tri && tri !== 'recommande' ? '#0f172a' : '#64748b',
                pointerEvents: 'none',
                zIndex: 1,
              }}
            />
            <select
              value={tri || 'recommande'}
              onChange={e => updateFilter({ tri: e.target.value === 'recommande' ? '' : e.target.value })}
              className="agences-filter-select"
              style={{
                width: '100%',
                appearance: 'none',
                WebkitAppearance: 'none',
                paddingLeft: 30,
                paddingRight: 28,
                height: 32,
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                outline: 'none',
                background: tri && tri !== 'recommande' ? '#f1f5f9' : '#f8fafc',
                color: tri && tri !== 'recommande' ? '#0f172a' : '#334155',
                border: tri && tri !== 'recommande' ? '1.5px solid #1e293b' : '1px solid #e2e8f0',
                transition: 'all 0.15s ease',
              }}
            >
              <option value="recommande">Trier : Recommandé</option>
              <option value="biens_desc">Trier : Biens disponibles (↘)</option>
              <option value="prix_asc">Trier : Loyer croissant (F ↗)</option>
              <option value="prix_desc">Trier : Loyer décroissant (F ↘)</option>
              <option value="nom_asc">Trier : Nom A-Z</option>
              <option value="recent">Trier : Plus récentes</option>
            </select>
            <ChevronDown
              size={12}
              style={{
                position: 'absolute',
                right: 10,
                color: tri && tri !== 'recommande' ? '#0f172a' : '#94a3b8',
                pointerEvents: 'none',
              }}
            />
          </div>

          {/* BOUTON RÉINITIALISER SI FILTRES ACTIFS */}
          {aDesFiltres && (
            <button
              type="button"
              onClick={handleResetAll}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                height: 32,
                padding: '0 11px',
                borderRadius: 12,
                fontSize: 11.5,
                fontWeight: 800,
                cursor: 'pointer',
                flexShrink: 0,
                background: '#fee2e2',
                color: '#b91c1c',
                border: '1px solid #fca5a5',
                transition: 'all 0.15s ease',
              }}
              title="Réinitialiser tous les filtres"
            >
              <X size={12} strokeWidth={2.5} />
              <span>Effacer</span>
            </button>
          )}
        </div>
      </div>

      {/* ── LIGNE 2 : BADGES D'ACTION RAPIDE IMMOBILIER (1-CLICK PILLS) ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          flexWrap: 'nowrap',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          padding: '2px 0',
          width: '100%',
        }}
      >
        {/* PILL BIENS DISPONIBLES */}
        <button
          type="button"
          onClick={() => updateFilter({ avec_biens: avecBiens === '1' ? '' : '1' })}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            height: 28,
            padding: '0 10px',
            borderRadius: 14,
            fontSize: 11.5,
            fontWeight: 700,
            cursor: 'pointer',
            flexShrink: 0,
            background: avecBiens === '1' ? '#ecfdf5' : '#f8fafc',
            color: avecBiens === '1' ? '#047857' : '#475569',
            border: avecBiens === '1' ? '1.5px solid #10b981' : '1px solid #e2e8f0',
            transition: 'all 0.15s ease',
          }}
        >
          <Home size={12} style={{ color: avecBiens === '1' ? '#047857' : '#64748b' }} />
          <span>Biens dispo</span>
        </button>

        {/* PILL AGRÉÉE ÉTAT */}
        <button
          type="button"
          onClick={() => updateFilter({ agree: agree === '1' ? '' : '1' })}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            height: 28,
            padding: '0 10px',
            borderRadius: 14,
            fontSize: 11.5,
            fontWeight: 700,
            cursor: 'pointer',
            flexShrink: 0,
            background: agree === '1' ? '#eff6ff' : '#f8fafc',
            color: agree === '1' ? '#1d4ed8' : '#475569',
            border: agree === '1' ? '1.5px solid #3b82f6' : '1px solid #e2e8f0',
            transition: 'all 0.15s ease',
          }}
        >
          <ShieldCheck size={12} style={{ color: agree === '1' ? '#1d4ed8' : '#64748b' }} />
          <span>Agréée État</span>
        </button>

        {/* PILL WHATSAPP DIRECT */}
        <button
          type="button"
          onClick={() => updateFilter({ whatsapp: whatsapp === '1' ? '' : '1' })}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            height: 28,
            padding: '0 10px',
            borderRadius: 14,
            fontSize: 11.5,
            fontWeight: 700,
            cursor: 'pointer',
            flexShrink: 0,
            background: whatsapp === '1' ? '#f0fdf4' : '#f8fafc',
            color: whatsapp === '1' ? '#16a34a' : '#475569',
            border: whatsapp === '1' ? '1.5px solid #22c55e' : '1px solid #e2e8f0',
            transition: 'all 0.15s ease',
          }}
        >
          <MessageCircle size={12} style={{ color: whatsapp === '1' ? '#16a34a' : '#64748b' }} />
          <span>WhatsApp</span>
        </button>

        {/* PILL TRANSACTION LOCATION */}
        <button
          type="button"
          onClick={() => updateFilter({ transaction: transaction === 'location' ? '' : 'location' })}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            height: 28,
            padding: '0 10px',
            borderRadius: 14,
            fontSize: 11.5,
            fontWeight: 700,
            cursor: 'pointer',
            flexShrink: 0,
            background: transaction === 'location' ? '#fff7ed' : '#f8fafc',
            color: transaction === 'location' ? '#c2410c' : '#475569',
            border: transaction === 'location' ? '1.5px solid #f97316' : '1px solid #e2e8f0',
            transition: 'all 0.15s ease',
          }}
        >
          <Key size={12} style={{ color: transaction === 'location' ? '#c2410c' : '#64748b' }} />
          <span>Location</span>
        </button>

        {/* PILL TRANSACTION VENTE */}
        <button
          type="button"
          onClick={() => updateFilter({ transaction: transaction === 'vente' ? '' : 'vente' })}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            height: 28,
            padding: '0 10px',
            borderRadius: 14,
            fontSize: 11.5,
            fontWeight: 700,
            cursor: 'pointer',
            flexShrink: 0,
            background: transaction === 'vente' ? '#fdf4ff' : '#f8fafc',
            color: transaction === 'vente' ? '#9333ea' : '#475569',
            border: transaction === 'vente' ? '1.5px solid #c084fc' : '1px solid #e2e8f0',
            transition: 'all 0.15s ease',
          }}
        >
          <FileCheck size={12} style={{ color: transaction === 'vente' ? '#9333ea' : '#64748b' }} />
          <span>Vente</span>
        </button>

        {/* PILL MEUBLÉ */}
        <button
          type="button"
          onClick={() => updateFilter({ meuble: meuble === '1' ? '' : '1' })}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            height: 28,
            padding: '0 10px',
            borderRadius: 14,
            fontSize: 11.5,
            fontWeight: 700,
            cursor: 'pointer',
            flexShrink: 0,
            background: meuble === '1' ? '#faf5ff' : '#f8fafc',
            color: meuble === '1' ? '#7e22ce' : '#475569',
            border: meuble === '1' ? '1.5px solid #a855f7' : '1px solid #e2e8f0',
            transition: 'all 0.15s ease',
          }}
        >
          <Armchair size={12} style={{ color: meuble === '1' ? '#7e22ce' : '#64748b' }} />
          <span>Meublé</span>
        </button>

        {/* PILL PARTENAIRE PRO */}
        <button
          type="button"
          onClick={() => updateFilter({ plan: plan === 'pro' ? '' : 'pro' })}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            height: 28,
            padding: '0 10px',
            borderRadius: 14,
            fontSize: 11.5,
            fontWeight: 700,
            cursor: 'pointer',
            flexShrink: 0,
            background: plan === 'pro' ? '#f8fafc' : '#f8fafc',
            color: plan === 'pro' ? '#0f172a' : '#475569',
            border: plan === 'pro' ? '1.5px solid #1e293b' : '1px solid #e2e8f0',
            transition: 'all 0.15s ease',
          }}
        >
          <Award size={12} style={{ color: plan === 'pro' ? '#0f172a' : '#64748b' }} />
          <span>Partenaire Pro</span>
        </button>
      </div>

    </div>
  )
}
