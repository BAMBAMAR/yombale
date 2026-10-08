'use client'

import React from 'react'
import { Wallet, ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import type { KalpeSyntheseSurga } from '@/lib/surga-kalpe'

interface SurgaXaalisSummaryCardsProps {
  synthese: KalpeSyntheseSurga | null
  masque: boolean
}

export default function SurgaXaalisSummaryCards({
  synthese,
  masque,
}: SurgaXaalisSummaryCardsProps) {
  const soldeFormate = masque
    ? '•••••• FCFA'
    : `${(synthese?.solde_disponible || 0).toLocaleString('fr-FR')} FCFA`

  const epargneFormatee = masque
    ? '•••••• FCFA'
    : `${(synthese?.total_epargne || 0).toLocaleString('fr-FR')} FCFA`

  const entreesFormatees = masque
    ? '+ •••••• F'
    : `+${(synthese?.total_entrees_mois || 0).toLocaleString('fr-FR')} F`

  const depensesFormatees = masque
    ? '- •••••• F'
    : `-${(synthese?.total_depenses_mois || 0).toLocaleString('fr-FR')} F`

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 10,
        marginBottom: 14,
      }}
    >
      {/* Solde Disponible */}
      <div
        style={{
          gridColumn: '1 / -1',
          padding: '16px 18px',
          borderRadius: 14,
          background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
          color: '#FFFFFF',
          boxShadow: '0 4px 14px rgba(15, 23, 42, 0.15)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.85, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Solde Kalpé Disponible
          </span>
          <Wallet size={18} color="var(--surga-accent-glow, #F59E0B)" />
        </div>
        <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: -0.5 }}>
          {soldeFormate}
        </div>
        <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
          Total épargne cumulée : {epargneFormatee}
        </div>
      </div>

      {/* Entrées du mois */}
      <div
        style={{
          padding: '12px 14px',
          borderRadius: 10,
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--surga-border, #E2E8F0)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
          <ArrowDownLeft size={14} color="var(--price, #0A5C36)" />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--price, #0A5C36)' }}>
            Entrées du mois
          </span>
        </div>
        <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
          {entreesFormatees}
        </div>
      </div>

      {/* Dépenses du mois */}
      <div
        style={{
          padding: '12px 14px',
          borderRadius: 10,
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--surga-border, #E2E8F0)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
          <ArrowUpRight size={14} color="var(--accent, #C75B00)" />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--surga-accent-ink, #A64B08)' }}>
            Dépenses du mois
          </span>
        </div>
        <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
          {depensesFormatees}
        </div>
      </div>
    </div>
  )
}
