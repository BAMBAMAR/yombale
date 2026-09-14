'use client'

import React from 'react'
import Link from 'next/link'
import { Store, Tag, Package, Users } from 'lucide-react'

interface AccountHubKpisProps {
  hasBoutique: boolean
  boutiques: any[]
  annonces: any[]
  annoncesActives: number
  onNavigateTab: (tabKey: string) => void
}

export default function AccountHubKpis({
  hasBoutique,
  boutiques,
  annonces,
  annoncesActives,
  onNavigateTab,
}: AccountHubKpisProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(145px, 100%), 1fr))',
        gap: 10,
      }}
    >
      {/* KPI 1 : Ma Boutique */}
      <Link
        href={hasBoutique ? '/boutique' : '/creer-boutique'}
        style={{
          background: '#ffffff',
          borderRadius: 12,
          padding: '12px 14px',
          border: '1.5px solid #E8DDD2',
          textDecoration: 'none',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 2px 6px rgba(26,22,18,0.02)',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Ma Boutique
          </span>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: '#FFF3E8', color: 'var(--accent, #C75B00)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Store size={14} />
          </div>
        </div>
        <div style={{ margin: '8px 0 2px' }}>
          <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
            {hasBoutique ? boutiques.length : '0'}
          </span>
          <span style={{ fontSize: 12, color: '#64748B', marginLeft: 4 }}>
            {hasBoutique ? (boutiques.length > 1 ? 'boutiques' : 'boutique') : 'boutique'}
          </span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent, #C75B00)', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
          {hasBoutique ? 'Ouvrir le tableau ➔' : 'Créer ma boutique ➔'}
        </span>
      </Link>

      {/* KPI 2 : Mes Annonces */}
      <Link
        href="/compte?tab=mes-annonces"
        onClick={e => {
          e.preventDefault()
          onNavigateTab('mes-annonces')
        }}
        style={{
          background: '#ffffff',
          borderRadius: 12,
          padding: '12px 14px',
          border: '1.5px solid #E8DDD2',
          textDecoration: 'none',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 2px 6px rgba(26,22,18,0.02)',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Mes Annonces
          </span>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Tag size={14} />
          </div>
        </div>
        <div style={{ margin: '8px 0 2px' }}>
          <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
            {annoncesActives}
          </span>
          <span style={{ fontSize: 12, color: '#64748B', marginLeft: 4 }}>
            / {annonces.length} actives
          </span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#16A34A', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
          Gérer mes annonces ➔
        </span>
      </Link>

      {/* KPI 3 : Mes Commandes */}
      <Link
        href="/compte?tab=suivi-commande"
        onClick={e => {
          e.preventDefault()
          onNavigateTab('suivi-commande')
        }}
        style={{
          background: '#ffffff',
          borderRadius: 12,
          padding: '12px 14px',
          border: '1.5px solid #E8DDD2',
          textDecoration: 'none',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 2px 6px rgba(26,22,18,0.02)',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Commandes
          </span>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={14} />
          </div>
        </div>
        <div style={{ margin: '8px 0 2px' }}>
          <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
            Suivi
          </span>
          <span style={{ fontSize: 12, color: '#64748B', marginLeft: 4 }}>
            en direct
          </span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#2563EB', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
          Voir mes achats ➔
        </span>
      </Link>

      {/* KPI 4 : Affiliation 20% */}
      <Link
        href="/compte?tab=apporteur"
        onClick={e => {
          e.preventDefault()
          onNavigateTab('apporteur')
        }}
        style={{
          background: '#ffffff',
          borderRadius: 12,
          padding: '12px 14px',
          border: '1.5px solid #E8DDD2',
          textDecoration: 'none',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 2px 6px rgba(26,22,18,0.02)',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Commissions
          </span>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={14} />
          </div>
        </div>
        <div style={{ margin: '8px 0 2px' }}>
          <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
            20%
          </span>
          <span style={{ fontSize: 12, color: '#64748B', marginLeft: 4 }}>
            parrainage
          </span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#D97706', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
          Espace apporteur ➔
        </span>
      </Link>
    </div>
  )
}
