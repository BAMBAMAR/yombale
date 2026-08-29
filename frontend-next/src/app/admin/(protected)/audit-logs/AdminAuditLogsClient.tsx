'use client'

import { useState, useEffect, useTransition } from 'react'
import { ShieldCheck, Search, Filter, Clock, User, ArrowRight, Eye, RefreshCw, Terminal, Globe } from 'lucide-react'

interface AuditLog {
  id: string
  admin_nom: string
  admin_role: string
  action: string
  cible_type: string
  cible_id: string | null
  description: string
  ancienne_valeur: any
  nouvelle_valeur: any
  ip_adresse: string | null
  created_at: string
}

export default function AdminAuditLogsClient({
  initialLogs,
  initialTotal,
  secret,
}: {
  initialLogs: AuditLog[]
  initialTotal: number
  secret: string
}) {
  const [logs, setLogs] = useState<AuditLog[]>(initialLogs)
  const [total, setTotal] = useState(initialTotal)
  const [q, setQ] = useState('')
  const [cibleType, setCibleType] = useState('')
  const [page, setPage] = useState(1)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!initialLogs || initialLogs.length === 0) {
      fetchLogs(1)
    }
  }, [secret])

  const fetchLogs = (targetPage = 1, searchQuery = q, targetCible = cibleType) => {
    startTransition(async () => {
      try {
        const params = new URLSearchParams()
        params.set('page', String(targetPage))
        if (searchQuery.trim()) params.set('q', searchQuery.trim())
        if (targetCible) params.set('cible_type', targetCible)

        const res = await fetch(`/api/admin/audit-logs?${params.toString()}`, {
          headers: { 'X-Admin-Secret': secret },
          cache: 'no-store',
        })
        if (res.ok) {
          const data = await res.json()
          setLogs(data.logs || [])
          setTotal(data.total || 0)
          setPage(targetPage)
        }
      } catch (err) {
        console.error('[FETCH_AUDIT_LOGS_ERR]', err)
      }
    })
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchLogs(1, q, cibleType)
  }

  const handleCibleChange = (newCible: string) => {
    setCibleType(newCible)
    fetchLogs(1, q, newCible)
  }

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr)
      return d.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    } catch {
      return isoStr
    }
  }

  const getActionBadge = (action: string) => {
    if (action.includes('cree') || action.includes('ajoute')) {
      return { bg: '#dcfce7', color: '#15803d', label: action }
    }
    if (action.includes('modifie') || action.includes('accorde')) {
      return { bg: '#e0f2fe', color: '#0369a1', label: action }
    }
    if (action.includes('supprime') || action.includes('suspendu')) {
      return { bg: '#fee2e2', color: '#b91c1c', label: action }
    }
    return { bg: '#f1f5f9', color: '#475569', label: action }
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 60 }}>
      {/* En-tête Page */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <h1 className="admin-page-titre" style={{ margin: 0 }}>
            🛡️ Audit Logs & Traçabilité
            <span className="admin-page-count">{total}</span>
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
            Journal immuable de toutes les actions administratives (modifications de prix, activation de plans, modérations, etc.).
          </p>
        </div>

        <button
          onClick={() => fetchLogs(page, q, cibleType)}
          disabled={isPending}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: 8,
            padding: '8px 14px',
            fontSize: 13,
            fontWeight: 600,
            color: '#334155',
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={15} className={isPending ? 'animate-spin' : ''} /> Actualiser
        </button>
      </div>

      {/* Barre de Recherche et Filtres */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '16px', border: '1px solid #e2e8f0', marginBottom: 20 }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Rechercher par description, administrateur ou identifiant..."
              value={q}
              onChange={e => setQ(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 38px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 14,
                boxSizing: 'border-box',
              }}
            />
          </div>

          <select
            value={cibleType}
            onChange={e => handleCibleChange(e.target.value)}
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              fontSize: 14,
              background: '#fff',
              color: '#334155',
            }}
          >
            <option value="">Tous les types d'entités</option>
            <option value="plan">Forfaits & Plans</option>
            <option value="boutique">Boutiques</option>
            <option value="utilisateur">Utilisateurs / Marchands</option>
            <option value="feature_flag">Feature Flags</option>
            <option value="categorie">Catégories</option>
            <option value="paiement">Paiements</option>
            <option value="setting">Paramètres Système</option>
          </select>

          <button
            type="submit"
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: 'none',
              background: '#1e293b',
              color: '#fff',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Filtrer
          </button>
        </form>
      </div>

      {/* Tableau des Logs */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
              <th style={{ padding: '12px 16px', width: 170 }}>Date & Heure</th>
              <th style={{ padding: '12px 16px', width: 140 }}>Auteur</th>
              <th style={{ padding: '12px 16px', width: 140 }}>Action</th>
              <th style={{ padding: '12px 16px' }}>Description</th>
              <th style={{ padding: '12px 16px', width: 110 }}>IP</th>
              <th style={{ padding: '12px 16px', width: 70, textAlign: 'right' }}>Détails</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                  Aucun log d'audit trouvé pour ces critères.
                </td>
              </tr>
            ) : (
              logs.map(log => {
                const badge = getActionBadge(log.action)

                return (
                  <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', color: '#64748b', whiteSpace: 'nowrap' }}>
                      <Clock size={13} style={{ display: 'inline', marginRight: 5 }} />
                      {formatDate(log.created_at)}
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 700, color: '#1e293b' }}>{log.admin_nom}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{log.admin_role}</div>
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          backgroundColor: badge.bg,
                          color: badge.color,
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          fontFamily: 'monospace',
                        }}
                      >
                        {log.action}
                      </span>
                    </td>

                    <td style={{ padding: '12px 16px', color: '#334155' }}>
                      {log.description}
                    </td>

                    <td style={{ padding: '12px 16px', color: '#64748b', fontSize: 12, fontFamily: 'monospace' }}>
                      {log.ip_adresse || '—'}
                    </td>

                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      {(log.ancienne_valeur || log.nouvelle_valeur) && (
                        <button
                          onClick={() => setSelectedLog(log)}
                          title="Inspecter le diff"
                          style={{
                            background: '#f1f5f9',
                            border: 'none',
                            borderRadius: 6,
                            padding: '6px',
                            cursor: 'pointer',
                            color: '#475569',
                          }}
                        >
                          <Eye size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Détails & Diff JSON */}
      {selectedLog && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: 16,
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 14,
              padding: 24,
              maxWidth: 680,
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#1e293b' }}>
                🔍 Détail de l'Action & Diff
              </h2>
              <button
                onClick={() => setSelectedLog(null)}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }}
              >
                ✕
              </button>
            </div>

            <p style={{ margin: '0 0 16px', fontSize: 14, color: '#334155', fontWeight: 600 }}>
              {selectedLog.description}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 12, fontWeight: 700, color: '#b91c1c', textTransform: 'uppercase', marginBottom: 6 }}>
                  Ancienne Valeur
                </h3>
                <pre
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fee2e2',
                    padding: 12,
                    borderRadius: 8,
                    fontSize: 12,
                    maxHeight: 250,
                    overflowY: 'auto',
                    fontFamily: 'monospace',
                  }}
                >
                  {selectedLog.ancienne_valeur ? JSON.stringify(selectedLog.ancienne_valeur, null, 2) : 'null'}
                </pre>
              </div>

              <div>
                <h3 style={{ fontSize: 12, fontWeight: 700, color: '#15803d', textTransform: 'uppercase', marginBottom: 6 }}>
                  Nouvelle Valeur
                </h3>
                <pre
                  style={{
                    background: '#f0fdf4',
                    border: '1px solid #dcfce7',
                    padding: 12,
                    borderRadius: 8,
                    fontSize: 12,
                    maxHeight: 250,
                    overflowY: 'auto',
                    fontFamily: 'monospace',
                  }}
                >
                  {selectedLog.nouvelle_valeur ? JSON.stringify(selectedLog.nouvelle_valeur, null, 2) : 'null'}
                </pre>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedLog(null)}
                style={{
                  padding: '8px 20px',
                  borderRadius: 6,
                  border: 'none',
                  background: '#1e293b',
                  color: '#fff',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
