'use client'

import React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  MapPin, DollarSign, ArrowUpDown, ChevronDown,
  Tag, Camera, MessageCircle, ShieldCheck, Clock, Star, Award, X
} from 'lucide-react'

export interface BoutiquesFilterBarProps {
  ville: string
  villes: string[]
  budget: string
  budgets: { val: string; label: string }[]
  tri: string
  promo: string
  avecProds: string
  whatsapp: string
  certifie: string
  ouvert: string
  noteMin: string
  vedette: string
  plan: string
  q: string
  cat: string
}

export default function BoutiquesFilterBar({
  ville,
  villes,
  budget,
  budgets,
  tri,
  promo,
  avecProds,
  whatsapp,
  certifie,
  ouvert,
  noteMin,
  vedette,
  plan,
  q,
  cat,
}: BoutiquesFilterBarProps) {
  const router = useRouter()
  const pathname = usePathname()

  function updateFilter(updates: Record<string, string>) {
    const p = new URLSearchParams()
    if (q) p.set('q', q)
    if (cat) p.set('cat', cat)
    if (ville) p.set('ville', ville)
    if (budget) p.set('budget', budget)
    if (tri) p.set('tri', tri)
    if (promo) p.set('promo', promo)
    if (avecProds) p.set('avec_prods', avecProds)
    if (whatsapp) p.set('whatsapp', whatsapp)
    if (certifie) p.set('certifie', certifie)
    if (ouvert) p.set('ouvert', ouvert)
    if (noteMin) p.set('note_min', noteMin)
    if (vedette) p.set('vedette', vedette)
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
    if (q) p.set('q', q)
    if (cat) p.set('cat', cat)
    p.set('page', '1')
    router.push(`${pathname}${p.toString() ? `?${p.toString()}` : ''}#resultats`)
  }

  const aDesFiltres = Boolean(
    ville || budget || promo || avecProds || whatsapp || certifie ||
    ouvert || noteMin || vedette || plan || (tri && tri !== 'recommande')
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
      <style>{`
        .boutiques-filter-row-1 {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          flex-wrap: wrap;
        }
        .boutiques-filter-ville {
          flex: 1 1 125px;
        }
        .boutiques-filter-budget {
          flex: 1 1 145px;
        }
        .boutiques-filter-tri {
          flex: 1 1 155px;
        }
        .boutiques-filter-badges-row {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          align-items: center;
        }
        @media (max-width: 768px) {
          .boutiques-filter-row-1 {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 6px !important;
          }
          .boutiques-filter-ville,
          .boutiques-filter-budget {
            width: 100% !important;
            flex: none !important;
          }
          .boutiques-filter-tri-container {
            grid-column: span 2 !important;
            display: flex !important;
            gap: 6px !important;
            width: 100% !important;
          }
          .boutiques-filter-tri {
            width: 100% !important;
            flex: 1 !important;
            min-width: 0 !important;
          }
          .boutiques-filter-select {
            padding-left: 20px !important;
            padding-right: 17px !important;
            font-size: 11px !important;
            font-weight: 600 !important;
            letter-spacing: -0.25px !important;
            height: 32px !important;
          }
          .boutiques-filter-icon-left {
            left: 5px !important;
          }
          .boutiques-filter-icon-right {
            right: 5px !important;
          }
          .boutiques-filter-badges-row {
            overflow-x: auto !important;
            flex-wrap: nowrap !important;
            scrollbar-width: none !important;
            -webkit-overflow-scrolling: touch !important;
            padding-bottom: 2px !important;
          }
          .boutiques-filter-badges-row::-webkit-scrollbar {
            display: none !important;
          }
        }
      `}</style>
      
      {/* ── LIGNE 1 : CONTRÔLES PRINCIPAUX (VILLE, PRIX, TRIER) SANS CHEVAUCHEMENT ── */}
      <div className="boutiques-filter-row-1">
        {/* DROPDOWN VILLE */}
        <div className="boutiques-filter-ville" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
          <MapPin
            size={13}
            className="boutiques-filter-icon-left"
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
            className="boutiques-filter-select"
            style={{
              width: '100%',
              appearance: 'none',
              WebkitAppearance: 'none',
              paddingLeft: 28,
              paddingRight: 24,
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
            className="boutiques-filter-icon-right"
            style={{
              position: 'absolute',
              right: 10,
              color: ville ? '#C75B00' : '#94a3b8',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* DROPDOWN PRIX (BUDGET) */}
        <div className="boutiques-filter-budget" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
          <DollarSign
            size={13}
            className="boutiques-filter-icon-left"
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
            className="boutiques-filter-select"
            style={{
              width: '100%',
              appearance: 'none',
              WebkitAppearance: 'none',
              paddingLeft: 28,
              paddingRight: 24,
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
            <option value="">Tous les prix</option>
            {budgets.filter(b => b.val).map(b => (
              <option key={b.val} value={b.val}>
                {b.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={12}
            className="boutiques-filter-icon-right"
            style={{
              position: 'absolute',
              right: 10,
              color: budget ? 'var(--price, #0A5C36)' : '#94a3b8',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* CONTENEUR TRI & EFFACER (SUR MOBILE : LIGNE 2 COMPLÈTE) */}
        <div className="boutiques-filter-tri-container" style={{ display: 'contents' }}>
          {/* DROPDOWN TRIER */}
          <div className="boutiques-filter-tri" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
            <ArrowUpDown
              size={13}
              className="boutiques-filter-icon-left"
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
              className="boutiques-filter-select"
              style={{
                width: '100%',
                appearance: 'none',
                WebkitAppearance: 'none',
                paddingLeft: 28,
                paddingRight: 24,
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
              <option value="prix_asc">Trier : Prix croissant (F ↗)</option>
              <option value="prix_desc">Trier : Prix décroissant (F ↘)</option>
              <option value="recent">Trier : Plus récents</option>
              <option value="nom_asc">Trier : Nom A-Z</option>
            </select>
            <ChevronDown
              size={12}
              className="boutiques-filter-icon-right"
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

      {/* ── LIGNE 2 : BADGES D'ACTION RAPIDE & AVANTAGES MARCHANDS ── */}
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
        {/* PILL EN PROMO */}
        <button
          type="button"
          onClick={() => updateFilter({ promo: promo === '1' ? '' : '1' })}
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
            background: promo === '1' ? '#fef2f2' : '#f8fafc',
            color: promo === '1' ? '#dc2626' : '#475569',
            border: promo === '1' ? '1.5px solid #ef4444' : '1px solid #e2e8f0',
            transition: 'all 0.15s ease',
          }}
        >
          <Tag size={12} style={{ color: promo === '1' ? '#dc2626' : '#64748b' }} />
          <span>En promo</span>
        </button>

        {/* PILL AVEC PHOTOS */}
        <button
          type="button"
          onClick={() => updateFilter({ avec_prods: avecProds === '1' ? '' : '1' })}
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
            background: avecProds === '1' ? '#ecfdf5' : '#f8fafc',
            color: avecProds === '1' ? '#047857' : '#475569',
            border: avecProds === '1' ? '1.5px solid #10b981' : '1px solid #e2e8f0',
            transition: 'all 0.15s ease',
          }}
        >
          <Camera size={12} style={{ color: avecProds === '1' ? '#047857' : '#64748b' }} />
          <span>Avec photos</span>
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

        {/* PILL VÉRIFIÉE / CERTIFIÉE */}
        <button
          type="button"
          onClick={() => updateFilter({ certifie: certifie === '1' ? '' : '1' })}
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
            background: certifie === '1' ? '#eff6ff' : '#f8fafc',
            color: certifie === '1' ? '#2563eb' : '#475569',
            border: certifie === '1' ? '1.5px solid #3b82f6' : '1px solid #e2e8f0',
            transition: 'all 0.15s ease',
          }}
        >
          <ShieldCheck size={12} style={{ color: certifie === '1' ? '#2563eb' : '#64748b' }} />
          <span>Vérifiée</span>
        </button>

        {/* PILL OUVERT MAINTENANT */}
        <button
          type="button"
          onClick={() => updateFilter({ ouvert: ouvert === '1' ? '' : '1' })}
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
            background: ouvert === '1' ? '#f0fdf4' : '#f8fafc',
            color: ouvert === '1' ? '#15803d' : '#475569',
            border: ouvert === '1' ? '1.5px solid #22c55e' : '1px solid #e2e8f0',
            transition: 'all 0.15s ease',
          }}
        >
          <Clock size={12} style={{ color: ouvert === '1' ? '#15803d' : '#64748b' }} />
          <span>Ouvert</span>
        </button>

        {/* PILL 4 ETOILES ET PLUS */}
        <button
          type="button"
          onClick={() => updateFilter({ note_min: noteMin === '4' ? '' : '4' })}
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
            background: noteMin === '4' ? '#fffbeb' : '#f8fafc',
            color: noteMin === '4' ? '#b45309' : '#475569',
            border: noteMin === '4' ? '1.5px solid #f59e0b' : '1px solid #e2e8f0',
            transition: 'all 0.15s ease',
          }}
        >
          <Star
            size={12}
            style={{
              color: noteMin === '4' ? '#b45309' : '#64748b',
              fill: noteMin === '4' ? '#f59e0b' : 'none',
            }}
          />
          <span>4★ et +</span>
        </button>

        {/* PILL COUP DE COEUR */}
        <button
          type="button"
          onClick={() => updateFilter({ vedette: vedette === '1' ? '' : '1' })}
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
            background: vedette === '1' ? '#fffbeb' : '#f8fafc',
            color: vedette === '1' ? '#b45309' : '#475569',
            border: vedette === '1' ? '1.5px solid #f59e0b' : '1px solid #e2e8f0',
            transition: 'all 0.15s ease',
          }}
        >
          <Award size={12} style={{ color: vedette === '1' ? '#b45309' : '#64748b' }} />
          <span>Coup de cœur</span>
        </button>

        {/* PILL PLAN PRO */}
        <button
          type="button"
          onClick={() => updateFilter({ plan: plan === 'pro' ? '' : 'pro' })}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            height: 28,
            padding: '0 9px',
            borderRadius: 14,
            fontSize: 11.5,
            fontWeight: 700,
            cursor: 'pointer',
            flexShrink: 0,
            background: plan === 'pro' ? '#C75B00' : '#f1f5f9',
            color: plan === 'pro' ? '#fff' : '#C75B00',
            border: '1px solid #cbd5e1',
            transition: 'all 0.15s ease',
          }}
        >
          <span>Vendeur Pro</span>
        </button>

        {/* PILL PLAN BUSINESS */}
        <button
          type="button"
          onClick={() => updateFilter({ plan: plan === 'business' ? '' : 'business' })}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            height: 28,
            padding: '0 9px',
            borderRadius: 14,
            fontSize: 11.5,
            fontWeight: 700,
            cursor: 'pointer',
            flexShrink: 0,
            background: plan === 'business' ? '#1e3a5f' : '#f1f5f9',
            color: plan === 'business' ? '#fff' : '#1e3a5f',
            border: '1px solid #cbd5e1',
            transition: 'all 0.15s ease',
          }}
        >
          <span>Business</span>
        </button>
      </div>

    </div>
  )
}
