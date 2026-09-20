'use client'

import React from 'react'
import { PlusCircle, MinusCircle, BookOpen, PiggyBank, Zap } from 'lucide-react'

interface KalpeQuickActionsProps {
  onOpenSaisie: (mode: 'revenu' | 'depense' | 'dette' | 'epargne' | 'vente_express') => void
  hasBoutique: boolean
}

export default function KalpeQuickActions({ onOpenSaisie, hasBoutique }: KalpeQuickActionsProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontSize: 12,
            fontWeight: 800,
            color: 'var(--navy, #1C2B4A)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          Saisie Rapide 1-Tap
        </span>
        <span style={{ fontSize: 11.5, color: '#78716C', fontWeight: 600 }}>Moins de 5 secondes</span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 10,
        }}
      >
        {/* 1. J'ai reçu */}
        <button
          type="button"
          onClick={() => onOpenSaisie('revenu')}
          style={{
            background: '#FFFFFF',
            borderRadius: 14,
            padding: '14px 12px',
            border: '1px solid var(--border, #E8DDD2)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            minHeight: 90,
            boxShadow: '0 2px 6px rgba(28, 43, 74, 0.04)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 6px 14px rgba(28, 43, 74, 0.08)'
            e.currentTarget.style.borderColor = 'var(--price, #0A5C36)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 2px 6px rgba(28, 43, 74, 0.04)'
            e.currentTarget.style.borderColor = 'var(--border, #E8DDD2)'
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: '#ECFDF5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--price, #0A5C36)',
            }}
          >
            <PlusCircle size={20} strokeWidth={2.4} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy, #1C2B4A)', lineHeight: 1.2 }}>
              J'ai reçu
            </div>
            <div style={{ fontSize: 11, color: '#78716C', fontWeight: 500, marginTop: 2 }}>
              Revenu / Entrée
            </div>
          </div>
        </button>

        {/* 2. J'ai dépensé */}
        <button
          type="button"
          onClick={() => onOpenSaisie('depense')}
          style={{
            background: '#FFFFFF',
            borderRadius: 14,
            padding: '14px 12px',
            border: '1px solid var(--border, #E8DDD2)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            minHeight: 90,
            boxShadow: '0 2px 6px rgba(28, 43, 74, 0.04)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 6px 14px rgba(28, 43, 74, 0.08)'
            e.currentTarget.style.borderColor = 'var(--accent, #C75B00)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 2px 6px rgba(28, 43, 74, 0.04)'
            e.currentTarget.style.borderColor = 'var(--border, #E8DDD2)'
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: '#FFF7ED',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent, #C75B00)',
            }}
          >
            <MinusCircle size={20} strokeWidth={2.4} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy, #1C2B4A)', lineHeight: 1.2 }}>
              J'ai dépensé
            </div>
            <div style={{ fontSize: 11, color: '#78716C', fontWeight: 500, marginTop: 2 }}>
              Courses / Facture
            </div>
          </div>
        </button>

        {/* 3. On me doit */}
        <button
          type="button"
          onClick={() => onOpenSaisie('dette')}
          style={{
            background: '#FFFFFF',
            borderRadius: 14,
            padding: '14px 12px',
            border: '1px solid var(--border, #E8DDD2)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            minHeight: 90,
            boxShadow: '0 2px 6px rgba(28, 43, 74, 0.04)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 6px 14px rgba(28, 43, 74, 0.08)'
            e.currentTarget.style.borderColor = 'var(--navy, #1C2B4A)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 2px 6px rgba(28, 43, 74, 0.04)'
            e.currentTarget.style.borderColor = 'var(--border, #E8DDD2)'
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: '#F1F5F9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--navy, #1C2B4A)',
            }}
          >
            <BookOpen size={20} strokeWidth={2.4} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy, #1C2B4A)', lineHeight: 1.2 }}>
              On me doit
            </div>
            <div style={{ fontSize: 11, color: '#78716C', fontWeight: 500, marginTop: 2 }}>
              Dette client / Prêt
            </div>
          </div>
        </button>

        {/* 4. J'ai épargné OU Vente Express si commerçant */}
        {hasBoutique ? (
          <button
            type="button"
            onClick={() => onOpenSaisie('vente_express')}
            style={{
              background: '#FFFFFF',
              borderRadius: 14,
              padding: '14px 12px',
              border: '1px solid var(--border, #E8DDD2)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              minHeight: 90,
              boxShadow: '0 2px 6px rgba(28, 43, 74, 0.04)',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 6px 14px rgba(28, 43, 74, 0.08)'
              e.currentTarget.style.borderColor = '#6B21A8'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(28, 43, 74, 0.04)'
              e.currentTarget.style.borderColor = 'var(--border, #E8DDD2)'
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: '#FAF5FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6B21A8',
              }}
            >
              <Zap size={20} strokeWidth={2.4} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy, #1C2B4A)', lineHeight: 1.2 }}>
                Vente Express
              </div>
              <div style={{ fontSize: 11, color: '#78716C', fontWeight: 500, marginTop: 2 }}>
                Boutique & Scan
              </div>
            </div>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onOpenSaisie('epargne')}
            style={{
              background: '#FFFFFF',
              borderRadius: 14,
              padding: '14px 12px',
              border: '1px solid var(--border, #E8DDD2)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              minHeight: 90,
              boxShadow: '0 2px 6px rgba(28, 43, 74, 0.04)',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 6px 14px rgba(28, 43, 74, 0.08)'
              e.currentTarget.style.borderColor = '#0369A1'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(28, 43, 74, 0.04)'
              e.currentTarget.style.borderColor = 'var(--border, #E8DDD2)'
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: '#F0F9FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0369A1',
              }}
            >
              <PiggyBank size={20} strokeWidth={2.4} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy, #1C2B4A)', lineHeight: 1.2 }}>
                J'ai épargné
              </div>
              <div style={{ fontSize: 11, color: '#78716C', fontWeight: 500, marginTop: 2 }}>
                Verser sur un but
              </div>
            </div>
          </button>
        )}
      </div>
    </div>
  )
}
