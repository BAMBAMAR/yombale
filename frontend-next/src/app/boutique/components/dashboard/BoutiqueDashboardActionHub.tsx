'use client'

import React from 'react'
import type { Boutique, ManageTab } from '../../types'
import {
  Zap,
  ShoppingCart,
  ClipboardList,
  PlusCircle,
  BookOpen,
  FileText,
  Receipt,
  BarChart3,
  Users,
  Wallet,
} from 'lucide-react'

interface BoutiqueDashboardActionHubProps {
  boutique: Boutique
  onNavigate: (tab: ManageTab) => void
}

export default function BoutiqueDashboardActionHub({
  boutique,
  onNavigate,
}: BoutiqueDashboardActionHubProps) {
  return (
    <div
      style={{
        background: 'var(--card, #ffffff)',
        border: '1px solid var(--border, #E8DDD2)',
        borderRadius: 'var(--r-xl, 16px)',
        padding: '18px 20px',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Zap size={18} style={{ color: 'var(--accent, #C75B00)', flexShrink: 0 }} />
          <h3
            style={{
              margin: 0,
              fontSize: 15,
              fontWeight: 800,
              color: 'var(--navy, #1C2B4A)',
              letterSpacing: '-0.01em',
            }}
          >
            Actions rapides
          </h3>
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-subtle, #8C7E74)', fontWeight: 600 }}>1-Tap direct</span>
      </div>

      {/* Grille 4 tuiles tactiles */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))',
          gap: 12,
        }}
      >
        {/* Tuile 1 : Vente Express */}
        <button
          type="button"
          onClick={() => onNavigate('express')}
          className="bq-action-tile"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px 12px',
            borderRadius: 14,
            background: '#F0FDF4',
            border: '1.5px solid #BBF7D0',
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'all 0.15s ease',
            gap: 8,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: '#DCFCE7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#16A34A',
            }}
          >
            <Zap size={22} />
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 800, fontSize: 13, color: 'var(--navy, #1C2B4A)' }}>
              Vente Express
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: '#15803D', fontWeight: 600 }}>Scan & Comptoir</p>
          </div>
        </button>

        {/* Tuile 2 : Caisse POS */}
        {boutique.mode_fonctionnement !== 'pure_player' ? (
          <a
            href={`/boutique/caisse?b=${boutique.id}`}
            className="bq-action-tile"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px 12px',
              borderRadius: 14,
              background: '#FFF3E8',
              border: '1.5px solid #FED7AA',
              cursor: 'pointer',
              textAlign: 'center',
              textDecoration: 'none',
              transition: 'all 0.15s ease',
              gap: 8,
            }}
            onClick={() =>
              typeof window !== 'undefined' &&
              localStorage.setItem('nopalou_pos_active_boutique_id', boutique.id)
            }
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: '#FFEDD5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent, #C75B00)',
              }}
            >
              <ShoppingCart size={22} />
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 13, color: 'var(--navy, #1C2B4A)' }}>
                Caisse POS
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--accent, #C75B00)', fontWeight: 600 }}>
                Plein écran
              </p>
            </div>
          </a>
        ) : (
          <button
            type="button"
            onClick={() => onNavigate('commandes')}
            className="bq-action-tile"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px 12px',
              borderRadius: 14,
              background: '#EFF6FF',
              border: '1.5px solid #BFDBFE',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.15s ease',
              gap: 8,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: '#DBEAFE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563EB',
              }}
            >
              <ClipboardList size={22} />
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 13, color: 'var(--navy, #1C2B4A)' }}>
                Commandes
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: '#1D4ED8', fontWeight: 600 }}>
                Web & WhatsApp
              </p>
            </div>
          </button>
        )}

        {/* Tuile 3 : Nouveau Produit */}
        <button
          type="button"
          onClick={() => onNavigate('produits')}
          className="bq-action-tile"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px 12px',
            borderRadius: 14,
            background: '#FAF8F5',
            border: '1.5px solid #E8DDD2',
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'all 0.15s ease',
            gap: 8,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'var(--surface-muted, #F1F5F9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--navy, #1C2B4A)',
            }}
          >
            <PlusCircle size={22} />
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 800, fontSize: 13, color: 'var(--navy, #1C2B4A)' }}>
              Ajouter Produit
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-subtle, #8C7E74)', fontWeight: 600 }}>
              Photo & Prix
            </p>
          </div>
        </button>

        {/* Tuile 4 : Carnet de Dettes */}
        <button
          type="button"
          onClick={() => onNavigate('carnet')}
          className="bq-action-tile"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px 12px',
            borderRadius: 14,
            background: '#FEF2F2',
            border: '1.5px solid #FECACA',
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'all 0.15s ease',
            gap: 8,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: '#FEE2E2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#DC2626',
            }}
          >
            <BookOpen size={22} />
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 800, fontSize: 13, color: 'var(--navy, #1C2B4A)' }}>
              Carnet Dettes
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: '#B91C1C', fontWeight: 600 }}>Crédit & Relance</p>
          </div>
        </button>
      </div>

      {/* Puces secondaires compactes */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          marginTop: 14,
          flexWrap: 'wrap',
          paddingTop: 12,
          borderTop: '1px solid var(--border-light, #F1E9E0)',
        }}
      >
        <a
          href="/compte?tab=kalpe&contexte=activite"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 20,
            background: '#FFF3EB',
            border: '1px solid #FED7AA',
            fontSize: 12,
            fontWeight: 700,
            color: '#C75B00',
            textDecoration: 'none',
          }}
        >
          <Wallet size={13} />
          <span>Sama Xaalis (Finances)</span>
        </a>

        <button
          type="button"
          onClick={() => onNavigate('documents')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 20,
            background: '#ffffff',
            border: '1px solid var(--border, #E8DDD2)',
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--navy, #1C2B4A)',
            cursor: 'pointer',
          }}
        >
          <FileText size={13} style={{ color: 'var(--navy)' }} />
          <span>Factures & Devis</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('compta')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 20,
            background: '#ffffff',
            border: '1px solid var(--border, #E8DDD2)',
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--navy, #1C2B4A)',
            cursor: 'pointer',
          }}
        >
          <Receipt size={13} style={{ color: '#16A34A' }} />
          <span>Comptabilité</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('analytics')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 20,
            background: '#ffffff',
            border: '1px solid var(--border, #E8DDD2)',
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--navy, #1C2B4A)',
            cursor: 'pointer',
          }}
        >
          <BarChart3 size={13} style={{ color: 'var(--accent, #C75B00)' }} />
          <span>Statistiques</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('equipe')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 20,
            background: '#ffffff',
            border: '1px solid var(--border, #E8DDD2)',
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--navy, #1C2B4A)',
            cursor: 'pointer',
          }}
        >
          <Users size={13} style={{ color: '#6366F1' }} />
          <span>Équipe</span>
        </button>
      </div>
    </div>
  )
}
