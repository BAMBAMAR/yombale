'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Clock,
  Radio,
  ShieldAlert,
  Terminal,
} from 'lucide-react'
import { adminHeaders } from '@/app/actions/admin/admin-common'

interface CronError {
  nom_cron: string
  started_at: string
  ended_at: string
  statut: string
  erreur?: string
  stats?: any
}

interface InactiveWebhook {
  id: string
  url: string
  events: string[]
  created_at: string
  boutique_nom: string
}

interface CriticalLog {
  id: string
  admin_email: string
  action: string
  cible_type: string
  cible_id: string
  details?: string
  created_at: string
}

interface IncidentsResponse {
  cronsEnErreur: CronError[]
  webhooksInactifs: InactiveWebhook[]
  logsCritiques: CriticalLog[]
}

export default function SystemIncidentsCard({ secret }: { secret: string }) {
  const [data, setData] = useState<IncidentsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchIncidents = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/system/incidents', {
        headers: adminHeaders(secret),
        cache: 'no-store',
      })
      if (!res.ok) {
        throw new Error(`Statut HTTP ${res.status}`)
      }
      const json = await res.json()
      if (json.incidents) {
        setData(json.incidents)
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des incidents')
    } finally {
      setLoading(false)
    }
  }, [secret])

  useEffect(() => {
    fetchIncidents()
  }, [fetchIncidents])

  const crons = data?.cronsEnErreur || []
  const webhooks = data?.webhooksInactifs || []
  const logs = data?.logsCritiques || []
  const totalAnomalies = crons.length + webhooks.length + logs.length

  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: 22, border: '1px solid #e2e8f0', marginBottom: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldAlert size={18} color={totalAnomalies > 0 ? '#ef4444' : '#16a34a'} />
            Journal des Incidents & Alertes Système
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
            Supervision temps-réel des échecs de crons, webhooks marchands défaillants et logs critiques.
          </p>
        </div>

        <button
          onClick={fetchIncidents}
          disabled={loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: 8,
            padding: '7px 12px',
            fontSize: 12,
            fontWeight: 600,
            color: '#334155',
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Actualiser
        </button>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        {/* 1. Crons en Erreur */}
        <div style={{ border: '1px solid #f1f5f9', borderRadius: 10, padding: 14, background: '#fafafa' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={15} color="#64748b" />
              Tâches Cron en Échec
            </span>
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 999,
              background: crons.length === 0 ? '#dcfce7' : '#fee2e2',
              color: crons.length === 0 ? '#15803d' : '#b91c1c',
            }}>
              {crons.length} incident{crons.length > 1 ? 's' : ''}
            </span>
          </div>

          {crons.length === 0 ? (
            <div style={{ fontSize: 12, color: '#15803d', display: 'flex', alignItems: 'center', gap: 6, padding: '12px 0' }}>
              <CheckCircle2 size={15} />
              Toutes les tâches planifiées fonctionnent normalement.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
              {crons.map((c, idx) => (
                <div key={idx} style={{ background: '#fff', border: '1px solid #fecaca', borderRadius: 6, padding: '8px 10px', fontSize: 12 }}>
                  <div style={{ fontWeight: 700, color: '#b91c1c' }}>{c.nom_cron}</div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>{new Date(c.started_at).toLocaleString('fr-FR')}</div>
                  {c.erreur && <div style={{ color: '#dc2626', marginTop: 4, fontFamily: 'monospace', fontSize: 11, wordBreak: 'break-word' }}>{c.erreur}</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2. Webhooks Inactifs */}
        <div style={{ border: '1px solid #f1f5f9', borderRadius: 10, padding: 14, background: '#fafafa' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Radio size={15} color="#ea580c" />
              Webhooks Marchands Inactifs
            </span>
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 999,
              background: webhooks.length === 0 ? '#dcfce7' : '#fef3c7',
              color: webhooks.length === 0 ? '#15803d' : '#b45309',
            }}>
              {webhooks.length} inactif{webhooks.length > 1 ? 's' : ''}
            </span>
          </div>

          {webhooks.length === 0 ? (
            <div style={{ fontSize: 12, color: '#15803d', display: 'flex', alignItems: 'center', gap: 6, padding: '12px 0' }}>
              <CheckCircle2 size={15} />
              Tous les webhooks déclarés sont opérationnels.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
              {webhooks.map((w) => (
                <div key={w.id} style={{ background: '#fff', border: '1px solid #fed7aa', borderRadius: 6, padding: '8px 10px', fontSize: 12 }}>
                  <div style={{ fontWeight: 700, color: '#9a3412' }}>{w.boutique_nom}</div>
                  <div style={{ color: '#475569', fontSize: 11, wordBreak: 'break-all' }}>{w.url}</div>
                  <div style={{ color: '#94a3b8', fontSize: 10, marginTop: 2 }}>{new Date(w.created_at).toLocaleDateString('fr-FR')}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. Logs Critiques */}
        <div style={{ border: '1px solid #f1f5f9', borderRadius: 10, padding: 14, background: '#fafafa' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Terminal size={15} color="#6366f1" />
              Audits Critiques Récents
            </span>
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 999,
              background: '#f1f5f9',
              color: '#475569',
            }}>
              {logs.length} log{logs.length > 1 ? 's' : ''}
            </span>
          </div>

          {logs.length === 0 ? (
            <div style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6, padding: '12px 0' }}>
              <CheckCircle2 size={15} />
              Aucun incident critique consigné dans les logs.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
              {logs.map((l) => (
                <div key={l.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 10px', fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{l.action}</span>
                    <span style={{ color: '#94a3b8', fontSize: 10 }}>{new Date(l.created_at).toLocaleTimeString('fr-FR')}</span>
                  </div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>{l.admin_email} &bull; {l.cible_type}</div>
                  {l.details && <div style={{ color: '#334155', fontSize: 11, marginTop: 2 }}>{l.details}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
