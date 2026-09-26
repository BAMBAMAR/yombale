'use client'

import React from 'react'
import Link from 'next/link'
import { Store, Tag, Package, Users, ArrowRight, Building2 } from 'lucide-react'

interface AccountHubKpisProps {
  hasBoutique: boolean
  boutiques: any[]
  annonces: any[]
  annoncesActives: number
  locations?: any[]
  agences?: any[]
  onNavigateTab: (tabKey: string) => void
}

export default function AccountHubKpis({
  hasBoutique,
  boutiques,
  annonces,
  annoncesActives,
  locations = [],
  agences = [],
  onNavigateTab,
}: AccountHubKpisProps) {
  return (
    <div className="account-kpis-grid">
      {/* KPI 1 : Ma Boutique */}
      <Link
        href={hasBoutique ? '/boutique' : '/creer-boutique'}
        style={{
          background: '#ffffff',
          borderRadius: 14,
          padding: '14px 16px',
          border: '1px solid var(--border, #E8DDD2)',
          textDecoration: 'none',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: 114,
          boxShadow: '0 2px 6px rgba(26,22,18,0.02)',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Mes Boutiques
          </span>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: '#FFF3E8', color: 'var(--accent, #C75B00)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Store size={15} />
          </div>
        </div>
        <div style={{ margin: '8px 0 4px' }}>
          <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
            {hasBoutique ? boutiques.length : '0'}
          </span>
          <span style={{ fontSize: 12, color: '#64748B', marginLeft: 6 }}>
            {hasBoutique ? (boutiques.length > 1 ? 'boutiques actives' : 'boutique active') : 'boutique active'}
          </span>
        </div>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--accent, #C75B00)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span>{hasBoutique ? 'Gérer ma boutique' : 'Créer ma boutique'}</span>
          <ArrowRight size={12} />
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
          borderRadius: 14,
          padding: '14px 16px',
          border: '1px solid var(--border, #E8DDD2)',
          textDecoration: 'none',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: 114,
          boxShadow: '0 2px 6px rgba(26,22,18,0.02)',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Mes Annonces
          </span>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Tag size={15} />
          </div>
        </div>
        <div style={{ margin: '8px 0 4px' }}>
          <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
            {annoncesActives}
          </span>
          <span style={{ fontSize: 12, color: '#64748B', marginLeft: 6 }}>
            / {annonces.length} en ligne
          </span>
        </div>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: '#16A34A', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span>Gérer mes annonces</span>
          <ArrowRight size={12} />
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
          borderRadius: 14,
          padding: '14px 16px',
          border: '1px solid var(--border, #E8DDD2)',
          textDecoration: 'none',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: 114,
          boxShadow: '0 2px 6px rgba(26,22,18,0.02)',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Mes Commandes
          </span>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={15} />
          </div>
        </div>
        <div style={{ margin: '8px 0 4px' }}>
          <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
            Suivi
          </span>
          <span style={{ fontSize: 12, color: '#64748B', marginLeft: 6 }}>
            en temps réel
          </span>
        </div>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: '#2563EB', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span>Suivre mes achats</span>
          <ArrowRight size={12} />
        </span>
      </Link>

      {/* KPI 4 : Affiliation & Commissions */}
      <Link
        href="/compte?tab=apporteur"
        onClick={e => {
          e.preventDefault()
          onNavigateTab('apporteur')
        }}
        style={{
          background: '#ffffff',
          borderRadius: 14,
          padding: '14px 16px',
          border: '1px solid var(--border, #E8DDD2)',
          textDecoration: 'none',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: 114,
          boxShadow: '0 2px 6px rgba(26,22,18,0.02)',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Commissions
          </span>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={15} />
          </div>
        </div>
        <div style={{ margin: '8px 0 4px' }}>
          <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
            20%
          </span>
          <span style={{ fontSize: 12, color: '#64748B', marginLeft: 6 }}>
            parrainage à vie
          </span>
        </div>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: '#D97706', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span>Espace apporteur</span>
          <ArrowRight size={12} />
        </span>
      </Link>

      {/* KPI 5 : Mes Locations & Quittances */}
      <Link
        href="/compte?tab=mes-locations"
        onClick={e => {
          e.preventDefault()
          onNavigateTab('mes-locations')
        }}
        style={{
          background: '#ffffff',
          borderRadius: 14,
          padding: '14px 16px',
          border: '1px solid var(--border, #E8DDD2)',
          textDecoration: 'none',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: 114,
          boxShadow: '0 2px 6px rgba(26,22,18,0.02)',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Mes Locations
          </span>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: '#F8F5F0', color: 'var(--navy, #1C2B4A)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={15} />
          </div>
        </div>
        <div style={{ margin: '8px 0 4px' }}>
          <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
            {locations && locations.length > 0 ? locations.length : 'Baux'}
          </span>
          <span style={{ fontSize: 12, color: '#64748B', marginLeft: 6 }}>
            {locations && locations.length > 0 ? (locations.length > 1 ? 'locations actives' : 'location active') : 'et quittances'}
          </span>
        </div>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--accent, #C75B00)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span>Gérer mes locations & quittances</span>
          <ArrowRight size={12} />
        </span>
      </Link>

      {/* KPI 6 : Mon Agence Immobilière & Gestion Locative */}
      {agences && agences.length > 0 && (
        <Link
          href={`/agence/${agences[0].slug || ''}`}
          style={{
            background: '#ffffff',
            borderRadius: 14,
            padding: '14px 16px',
            border: '1px solid var(--border, #E8DDD2)',
            textDecoration: 'none',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: 114,
            boxShadow: '0 2px 6px rgba(26,22,18,0.02)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Mon Agence
            </span>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: '#EFF6FF', color: 'var(--navy, #1C2B4A)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={15} />
            </div>
          </div>
          <div style={{ margin: '8px 0 4px' }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
              {agences.length}
            </span>
            <span style={{ fontSize: 12, color: '#64748B', marginLeft: 6 }}>
              {agences.length > 1 ? 'agences immo' : (agences[0].nom || 'agence active')}
            </span>
          </div>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--accent, #C75B00)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span>Tableau de bord agence</span>
            <ArrowRight size={12} />
          </span>
        </Link>
      )}
    </div>
  )
}
