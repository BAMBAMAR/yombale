'use client'

import React from 'react'
import { User, Store } from 'lucide-react'
import type { KalpeStats } from '../types'

interface KalpeContexteBreakdownProps {
  details: NonNullable<KalpeStats['details_contexte']>
  ratioPerso: number
  ratioAct: number
  formatFn: (n: number) => string
}

export default function KalpeContexteBreakdown({
  details,
  ratioPerso,
  ratioAct,
  formatFn,
}: KalpeContexteBreakdownProps) {
  return (
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 800,
            color: 'var(--navy, #1C2B4A)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          Séparation : Personnel vs Activité
        </div>
        <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>
          Dépenses : Perso {ratioPerso}% · Activité {ratioAct}%
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12,
        }}
      >
        {/* Colonne Personnel */}
        <div
          style={{
            background: '#F8FAFC',
            borderRadius: 10,
            padding: '12px 14px',
            border: '1px solid #E2E8F0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <User size={14} color="var(--navy, #1C2B4A)" />
            <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
              Côté Personnel
            </span>
          </div>
          <div style={{ fontSize: 11, color: '#64748B', display: 'flex', justifyContent: 'space-between' }}>
            <span>Entrées perso :</span>
            <strong style={{ color: 'var(--price, #0A5C36)' }}>
              +{formatFn(details.personnel.entrees)} F
            </strong>
          </div>
          <div
            style={{
              fontSize: 11,
              color: '#64748B',
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 3,
            }}
          >
            <span>Dépenses perso :</span>
            <strong style={{ color: 'var(--accent, #C75B00)' }}>
              -{formatFn(details.personnel.sorties)} F
            </strong>
          </div>
          <div
            style={{
              fontSize: 11.5,
              fontWeight: 800,
              color: details.personnel.solde >= 0 ? 'var(--price, #0A5C36)' : '#DC2626',
              borderTop: '1px solid #CBD5E1',
              paddingTop: 6,
              marginTop: 6,
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>Solde perso :</span>
            <span>
              {details.personnel.solde >= 0 ? '+' : ''}
              {formatFn(details.personnel.solde)} F
            </span>
          </div>
        </div>

        {/* Colonne Activité Pro */}
        <div
          style={{
            background: '#FFFDF9',
            borderRadius: 10,
            padding: '12px 14px',
            border: '1px solid #FED7AA',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Store size={14} color="var(--accent, #C75B00)" />
            <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent, #C75B00)' }}>
              Côté Activité Pro
            </span>
          </div>
          <div style={{ fontSize: 11, color: '#64748B', display: 'flex', justifyContent: 'space-between' }}>
            <span>Ventes / Recettes :</span>
            <strong style={{ color: 'var(--price, #0A5C36)' }}>
              +{formatFn(details.activite.entrees)} F
            </strong>
          </div>
          <div
            style={{
              fontSize: 11,
              color: '#64748B',
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 3,
            }}
          >
            <span>Charges pro / Stock :</span>
            <strong style={{ color: 'var(--accent, #C75B00)' }}>
              -{formatFn(details.activite.sorties)} F
            </strong>
          </div>
          <div
            style={{
              fontSize: 11.5,
              fontWeight: 800,
              color: details.activite.solde >= 0 ? 'var(--price, #0A5C36)' : '#DC2626',
              borderTop: '1px solid #FED7AA',
              paddingTop: 6,
              marginTop: 6,
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>Marge nette pro :</span>
            <span>
              {details.activite.solde >= 0 ? '+' : ''}
              {formatFn(details.activite.solde)} F
            </span>
          </div>
        </div>
      </div>

      {/* Jauge horizontale de proportion */}
      <div
        style={{
          width: '100%',
          height: 6,
          borderRadius: 6,
          overflow: 'hidden',
          background: '#E2E8F0',
          display: 'flex',
        }}
      >
        <div
          style={{
            width: `${ratioPerso}%`,
            background: 'var(--navy, #1C2B4A)',
            height: '100%',
          }}
        />
        <div
          style={{
            width: `${ratioAct}%`,
            background: 'var(--accent, #C75B00)',
            height: '100%',
          }}
        />
      </div>
    </div>
  )
}
