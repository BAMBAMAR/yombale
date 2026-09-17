'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Wallet,
  ArrowDownLeft,
  Receipt,
  Search,
  RefreshCw,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  CreditCard,
} from 'lucide-react'
import { fcfa } from '@/lib/format'

interface PaiementsSupervisionClientProps {
  initialStats: any
  initialFlux: any[]
}

export default function PaiementsSupervisionClient({ initialStats, initialFlux }: PaiementsSupervisionClientProps) {
  const [flux, setFlux] = useState(initialFlux)
  const [filterMethode, setFilterMethode] = useState<string>('tous')
  const [search, setSearch] = useState('')

  const stats = initialStats || {}
  const methodes = stats.methodesVolume || {}
  const manuels = stats.manuels || {}
  const abonnements = stats.abonnements || {}

  const filtered = flux.filter((item) => {
    if (filterMethode !== 'tous' && item.methode !== filterMethode) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return (
        item.reference?.toLowerCase().includes(q) ||
        item.source?.toLowerCase().includes(q) ||
        item.client?.toLowerCase().includes(q)
      )
    }
    return true
  })

  return (
    <div className="admin-page-container">
      {/* En-tête Métier */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--navy)', margin: '0 0 6px' }}>
            Flux Financiers & Rapprochement
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text2)', margin: 0 }}>
            Supervision consolidée des passerelles Wave, Orange Money, encaissements POS et validation manuelle.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link
            href="/admin/reversements"
            className="btn-npl"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 14px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}
          >
            <ArrowDownLeft size={14} />
            <span>Reversements Wave 1-Clic</span>
          </Link>
          <Link
            href="/admin/paiements-manuels"
            className="btn-npl"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 14px', background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}
          >
            <Receipt size={14} />
            <span>Paiements Manuels ({manuels.manuels_en_attente || 0})</span>
          </Link>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn-npl"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 14px' }}
          >
            <RefreshCw size={14} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* Cartes KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="admin-stat-card" style={{ background: '#ffffff', padding: 18, borderRadius: 10, border: '1px solid var(--border)' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Volume Wave (30j)</span>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#1d4ed8', margin: '8px 0 4px' }}>
            {fcfa(methodes.total_wave || 0)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>
            Passerelle automatisée Wave API
          </div>
        </div>

        <div className="admin-stat-card" style={{ background: '#ffffff', padding: 18, borderRadius: 10, border: '1px solid var(--border)' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Volume Orange Money (30j)</span>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#ea580c', margin: '8px 0 4px' }}>
            {fcfa(methodes.total_orange || 0)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>
            Encaissements Orange Money
          </div>
        </div>

        <div className="admin-stat-card" style={{ background: '#ffffff', padding: 18, borderRadius: 10, border: '1px solid var(--border)' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Espèces / POS</span>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#059669', margin: '8px 0 4px' }}>
            {fcfa(methodes.total_cash || 0)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>
            Encaissements comptoir caisse physique
          </div>
        </div>

        <div className="admin-stat-card" style={{ background: '#ffffff', padding: 18, borderRadius: 10, border: '1px solid var(--border)' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Abonnements SaaS</span>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--navy)', margin: '8px 0 4px' }}>
            {fcfa(abonnements.ca_abonnements_periode || 0)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>
            {abonnements.abonnements_payes_periode || 0} forfaits actifs
          </div>
        </div>
      </div>

      {/* Barre de Recherche & Filtres */}
      <div style={{ background: '#ffffff', padding: 16, borderRadius: 10, border: '1px solid var(--border)', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['tous', 'wave', 'orange', 'cash', 'manuel'].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setFilterMethode(m)}
              style={{
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: filterMethode === m ? 'var(--navy)' : '#ffffff',
                color: filterMethode === m ? '#ffffff' : 'var(--text1)',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {m === 'tous' ? 'Toutes les méthodes' : m}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', minWidth: 260 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
          <input
            type="text"
            placeholder="Rechercher par référence, client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 32px',
              fontSize: 13,
              borderRadius: 6,
              border: '1px solid var(--border)',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Tableau du Journal Consolidé */}
      <div style={{ background: '#ffffff', borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)', color: 'var(--text3)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                <th style={{ padding: '12px 16px' }}>Date & Réf</th>
                <th style={{ padding: '12px 16px' }}>Méthode</th>
                <th style={{ padding: '12px 16px' }}>Source / Boutique</th>
                <th style={{ padding: '12px 16px' }}>Montant</th>
                <th style={{ padding: '12px 16px' }}>Statut</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text3)' }}>
                    Aucune transaction financière récente dans le journal.
                  </td>
                </tr>
              ) : (
                filtered.map((item, idx) => (
                  <tr key={item.id || idx} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--navy)' }}>{item.reference || 'TRX-' + idx}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                        {item.date ? new Date(item.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 6,
                          textTransform: 'uppercase',
                          background: item.methode === 'wave' ? '#eff6ff' : item.methode === 'orange' ? '#fff7ed' : '#f1f5f9',
                          color: item.methode === 'wave' ? '#1d4ed8' : item.methode === 'orange' ? '#c2410c' : 'var(--text1)',
                        }}
                      >
                        {item.methode || 'Autre'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text1)', fontWeight: 500 }}>
                      {item.source || 'Plateforme'}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--price)' }}>
                      {fcfa(item.montant || 0)}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#10b981', background: '#ecfdf5', padding: '3px 8px', borderRadius: 12 }}>
                        <CheckCircle2 size={12} />
                        Succès
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
