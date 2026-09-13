'use client'

import React, { useState, useEffect } from 'react'
import { getBilanComptable } from '../../actions'
import { fcfa } from '@/lib/format'
import { exportToCSV } from '@/lib/export'
import { useTranslation } from '@/i18n/context'
import type { BilanData, DatePreset } from '../types'
import { getDateRangeForPreset } from '../utils'
import { Award, Trophy } from 'lucide-react'

export default function ComptaPerformancesCaissiersView({
  boutiqueId,
  boutiqueNom = 'Ma Boutique',
}: {
  boutiqueId: string
  boutiqueNom?: string
}) {
  const { t } = useTranslation()
  const [preset, setPreset] = useState<DatePreset>('this_month')
  const [bilan, setBilan] = useState<BilanData | null>(null)
  const [loading, setLoading] = useState(true)

  const activeRange = getDateRangeForPreset(preset)

  useEffect(() => {
    setLoading(true)
    const cacheKey = `nopalou_caissiers_bilan_${boutiqueId}_${preset}`
    const cached = typeof window !== 'undefined' ? localStorage.getItem(cacheKey) : null
    if (cached) {
      try {
        setBilan(JSON.parse(cached))
        setLoading(false)
      } catch (e) {
        console.warn('[Nopalou:ComptaPerformancesCaissiersView:cache]', e)
      }
    }

    getBilanComptable(boutiqueId, { from: activeRange.from, to: activeRange.to })
      .then((data) => {
        if (data && !data.error) {
          setBilan(data)
          if (typeof window !== 'undefined') {
            localStorage.setItem(cacheKey, JSON.stringify(data))
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [boutiqueId, preset, activeRange.from, activeRange.to])

  const handleExportCaissiers = () => {
    if (!bilan) return
    const headers = [
      'Caissier / Vendeur',
      'Tickets Encaissés',
      "Chiffre d'Affaires Total",
      'Panier Moyen',
      'Part du CA Global',
      'Encaissements Espèces',
      'Encaissements Digitaux',
    ]
    const rows = bilan.caissiers.map((c) => [
      c.nom,
      c.nb_ventes,
      c.ca_total,
      c.panier_moyen,
      `${c.part_ca_pct}%`,
      c.ca_especes,
      c.ca_digital,
    ])
    exportToCSV(`performances_caissiers_${boutiqueNom.replace(/\s+/g, '_')}_${preset}`, headers, rows)
  }

  const presetsList: { id: DatePreset; label: string }[] = [
    { id: 'today', label: "Aujourd'hui" },
    { id: 'yesterday', label: 'Hier' },
    { id: '7d', label: '7 jours' },
    { id: '30d', label: '30 jours' },
    { id: 'this_month', label: 'Ce mois-ci' },
    { id: 'this_year', label: 'Cette année' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Barre de sélection période */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 14,
          padding: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {presetsList.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPreset(p.id)}
              style={{
                padding: '6px 12px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: preset === p.id ? 800 : 600,
                border: preset === p.id ? '1px solid #1e3a8a' : '1px solid #e2e8f0',
                background: preset === p.id ? '#eff6ff' : '#f8fafc',
                color: preset === p.id ? '#1e3a8a' : '#475569',
                cursor: 'pointer',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleExportCaissiers}
          disabled={loading || !bilan}
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            border: '1px solid #16a34a',
            background: '#f0fdf4',
            color: '#15803d',
            fontSize: 12.5,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span>Export Classement CSV</span>
        </button>
      </div>

      {/* Tableau comparatif des caissiers */}
      {loading && !bilan ? (
        <p style={{ color: '#94a3b8' }}>Chargement des statistiques caissiers…</p>
      ) : !bilan || bilan.caissiers.length === 0 ? (
        <div
          style={{
            background: '#f8fafc',
            border: '1px dashed #cbd5e1',
            borderRadius: 12,
            padding: 32,
            textAlign: 'center',
            color: '#64748b',
          }}
        >
          <p style={{ margin: 0, fontWeight: 700 }}>Aucune vente enregistrée par un caissier sur cette période.</p>
        </div>
      ) : (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left', minWidth: 540 }}>
              <thead>
                <tr
                  style={{
                    background: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                    color: '#475569',
                    fontSize: 11.5,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  <th style={{ padding: '12px 16px' }}>Rang & Caissier</th>
                  <th style={{ padding: '12px 12px', textAlign: 'right' }}>Tickets Ventes</th>
                  <th style={{ padding: '12px 12px', textAlign: 'right' }}>CA Encaissé</th>
                  <th style={{ padding: '12px 12px', textAlign: 'right' }}>Panier Moyen</th>
                  <th style={{ padding: '12px 12px', textAlign: 'right' }}>Part Boutique</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Espèces vs Digital</th>
                </tr>
              </thead>
              <tbody>
                {bilan.caissiers.map((c, idx) => (
                  <tr key={c.nom} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 800, color: '#0f172a' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {idx === 0 ? (
                          <Trophy size={16} color="#d97706" />
                        ) : idx === 1 ? (
                          <Award size={16} color="#64748b" />
                        ) : idx === 2 ? (
                          <Award size={16} color="#b45309" />
                        ) : (
                          <span style={{ fontSize: 12, color: '#94a3b8' }}>#{idx + 1}</span>
                        )}
                        <span>{c.nom}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 12px', textAlign: 'right', fontWeight: 700, color: '#334155' }}>
                      {c.nb_ventes} tickets
                    </td>
                    <td style={{ padding: '12px 12px', textAlign: 'right', fontWeight: 900, color: '#1e3a8a' }}>
                      {fcfa(c.ca_total)}
                    </td>
                    <td style={{ padding: '12px 12px', textAlign: 'right', color: '#475569' }}>
                      {fcfa(c.panier_moyen)}
                    </td>
                    <td style={{ padding: '12px 12px', textAlign: 'right', fontWeight: 800, color: '#15803d' }}>
                      {c.part_ca_pct}%
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, color: '#64748b' }}>
                      <span>{fcfa(c.ca_especes)}</span> · <span style={{ color: '#0284c7' }}>{fcfa(c.ca_digital)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
