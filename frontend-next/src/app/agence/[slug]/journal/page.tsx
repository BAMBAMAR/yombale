'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  History,
  Search,
  RefreshCw,
  ShieldCheck,
  Calendar,
  User,
  Filter
} from 'lucide-react'
import ExportCsvButton from '../../components/ExportCsvButton'

interface AuditLogItem {
  id: string
  auteur_nom: string
  type_action: string
  description: string
  metadonnees?: Record<string, any>
  ip_adresse?: string
  created_at: string
}

export default function AgenceJournalPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [logs, setLogs] = useState<AuditLogItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filtreType, setFiltreType] = useState('tous')
  const [recherche, setRecherche] = useState('')

  async function chargerLogs() {
    try {
      setLoading(true)
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}

      let url = `/api/agences/agence/${slug}/logs?limit=100`
      if (filtreType !== 'tous') url += `&type=${encodeURIComponent(filtreType)}`
      if (recherche.trim()) url += `&q=${encodeURIComponent(recherche.trim())}`

      const res = await fetch(url, { headers })
      const data = await res.json()

      if (data.success) {
        setLogs(data.logs || [])
        setTotal(data.total || 0)
      }
    } catch (err) {
      console.error('[LOAD_AGENCE_LOGS_ERR]', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (slug) chargerLogs()
  }, [slug, filtreType])

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    chargerLogs()
  }

  function getBadgeColor(type: string): { bg: string; color: string } {
    const t = type.toLowerCase()
    if (t.includes('encaiss') || t.includes('loyer') || t.includes('paiement')) {
      return { bg: '#DCFCE7', color: '#166534' }
    }
    if (t.includes('quittance') || t.includes('bail') || t.includes('mandat')) {
      return { bg: '#E0F2FE', color: '#0369A1' }
    }
    if (t.includes('facture') || t.includes('commission')) {
      return { bg: '#FEF3C7', color: '#92400E' }
    }
    if (t.includes('suppress') || t.includes('resili')) {
      return { bg: '#FEE2E2', color: '#991B1B' }
    }
    return { bg: '#F1F5F9', color: '#475569' }
  }

  return (
    <div>
      {/* ── En-tête ── */}
      <div className="agence-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="agence-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <History size={22} color="var(--accent, #C75B00)" />
            <span>Journal d'Activité &amp; Audit Agence</span>
          </h1>
          <p className="agence-subtitle">
            Traçabilité intégrale et horodatage certifié des opérations immobilières, encaissements et quittances.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            type="button"
            onClick={chargerLogs}
            disabled={loading}
            className="agence-btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            title="Rafraîchir les logs"
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Actualiser</span>
          </button>
          <ExportCsvButton slug={slug} type="logs" label="Exporter Journal CSV" />
        </div>
      </div>

      {/* ── Filtres & Recherche ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 8, flex: 1, minWidth: 260 }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: 12, top: 11 }} />
            <input
              type="text"
              placeholder="Rechercher par opérateur, bien, locataire..."
              value={recherche}
              onChange={e => setRecherche(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: 8,
                border: '1px solid var(--border, #E8DDD2)',
                fontSize: 13,
                background: '#FFFFFF',
              }}
            />
          </div>
          <button
            type="submit"
            className="agence-btn-secondary"
            style={{ padding: '8px 14px', fontSize: 13, fontWeight: 700 }}
          >
            Filtrer
          </button>
        </form>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Filter size={15} color="#64748B" />
          <select
            value={filtreType}
            onChange={e => setFiltreType(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid var(--border, #E8DDD2)',
              fontSize: 13,
              fontWeight: 650,
              background: '#FFFFFF',
            }}
          >
            <option value="tous">Toutes les actions ({total})</option>
            <option value="loyer">Encaissements &amp; Loyers</option>
            <option value="quittance">Quittances PDF</option>
            <option value="bail">Baux de location</option>
            <option value="mandat">Mandats de gestion</option>
            <option value="facture">Factures d'honoraires</option>
            <option value="bien">Gestion du patrimoine</option>
          </select>
        </div>
      </div>

      {/* ── Table des Logs ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px 0', color: '#64748B' }}>
          <p>Chargement du journal d'audit...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="agence-card" style={{ textAlign: 'center', padding: '50px 20px', color: '#64748B' }}>
          <ShieldCheck size={36} style={{ margin: '0 auto 12px', opacity: 0.5, color: 'var(--accent, #C75B00)' }} />
          <p style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)', fontSize: 17 }}>Aucune activité enregistrée</p>
          <p style={{ fontSize: 13.5, maxWidth: 450, margin: '6px auto 0' }}>
            Les prochaines actions (création de bail, quittance de loyer, émission de facture d'honoraires) seront automatiquement consignées ici.
          </p>
        </div>
      ) : (
        <div className="agence-table-wrapper">
          <table className="agence-table">
            <thead>
              <tr>
                <th style={{ width: 170 }}>Date &amp; Heure</th>
                <th style={{ width: 160 }}>Opérateur</th>
                <th style={{ width: 180 }}>Type d'Action</th>
                <th>Description de l'Événement</th>
                <th style={{ width: 130, textAlign: 'right' }}>Adresse IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => {
                const bCol = getBadgeColor(log.type_action)
                return (
                  <tr key={log.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
                        <Calendar size={13} color="#94A3B8" />
                        <span>{new Date(log.created_at).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B', marginLeft: 19 }}>
                        {new Date(log.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <User size={14} color="#64748B" />
                        <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--navy, #1C2B4A)' }}>
                          {log.auteur_nom || 'Système'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span
                        className="badge-npl"
                        style={{
                          background: bCol.bg,
                          color: bCol.color,
                          fontSize: 11.5,
                          fontWeight: 700,
                          padding: '4px 8px',
                          borderRadius: 6,
                          display: 'inline-block',
                        }}
                      >
                        {log.type_action}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: 13, color: '#1F2937', lineHeight: 1.4 }}>
                        {log.description}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', fontSize: 11.5, color: '#94A3B8', fontFamily: 'monospace' }}>
                      {log.ip_adresse || '127.0.0.1'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
