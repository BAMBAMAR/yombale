'use client'
import { useState, useEffect } from 'react'
import { Download, Search, RefreshCw, User } from 'lucide-react'

interface LogEntry {
  id: string
  auteur_nom: string
  type_action: string
  description: string
  metadonnees?: any
  ip_adresse?: string
  created_at: string
}

export default function BoutiqueLogs({ boutiqueId }: { boutiqueId: string }) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recherche, setRecherche] = useState('')
  const [filtreType, setFiltreType] = useState('tous')

  async function fetchLogs() {
    setLoading(true)
    setError(null)
    try {
      let url = `/api/boutiques/${boutiqueId}/logs?limit=150`
      if (filtreType !== 'tous') url += `&type=${encodeURIComponent(filtreType)}`
      if (recherche.trim()) url += `&q=${encodeURIComponent(recherche.trim())}`

      const res = await fetch(url)
      if (!res.ok) throw new Error('Impossible de charger le journal d\'audit')
      const data = await res.json()
      setLogs(data.logs || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [boutiqueId, filtreType])

  const [downloadingCsv, setDownloadingCsv] = useState(false)

  async function handleExportCSV(e: React.MouseEvent) {
    e.preventDefault()
    setDownloadingCsv(true)
    try {
      const res = await fetch(`/api/boutiques/${boutiqueId}/logs/export.csv`)
      if (!res.ok) throw new Error('Impossible de générer le fichier CSV')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `journal_audit_${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err: any) {
      alert(err.message || 'Erreur d\'exportation CSV')
    } finally {
      setDownloadingCsv(false)
    }
  }

  function getBadgeColor(type: string) {
    if (type.includes('produit')) return { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' }
    if (type.includes('vente') || type.includes('pos')) return { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' }
    if (type.includes('admin') || type.includes('caissier') || type.includes('equipe')) return { bg: '#faf5ff', color: '#7e22ce', border: '#e9d5ff' }
    if (type.includes('token') || type.includes('supprime')) return { bg: '#fff1f2', color: '#be123c', border: '#fecdd3' }
    return { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' }
  }

  return (
    <div style={{ padding: 24, background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 10 }}>
            📜 Journal d&apos;Audit &amp; Historique des Actions
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
            Registre chronologique inaltérable pour enquêtes, contrôle interne et traçabilité des opérations.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={downloadingCsv}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 10,
            background: '#1e3a5f',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: 13,
            border: 'none',
            cursor: downloadingCsv ? 'wait' : 'pointer',
            boxShadow: '0 2px 8px rgba(30, 58, 95, 0.2)'
          }}
        >
          <Download size={16} /> {downloadingCsv ? 'Génération du CSV...' : 'Exporter le Journal (CSV / Excel)'}
        </button>
      </div>

      {/* Barre de recherche et filtres */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Rechercher par auteur, action ou mot-clé..."
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchLogs()}
            style={{
              width: '100%',
              padding: '10px 12px 10px 38px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              fontSize: 14,
              boxSizing: 'border-box'
            }}
          />
        </div>

        <select
          value={filtreType}
          onChange={e => setFiltreType(e.target.value)}
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px solid #cbd5e1',
            fontSize: 13,
            fontWeight: 600,
            color: '#334155',
            background: '#fff'
          }}
        >
          <option value="tous">Toutes les actions</option>
          <option value="produit_cree">Produit créé</option>
          <option value="produit_modifie">Produit modifié</option>
          <option value="produit_supprime">Produit supprimé</option>
          <option value="vente_pos">Vente POS / Caisse</option>
          <option value="admin_ajoute">Admin ajouté</option>
          <option value="caissier_cree">Caissier créé</option>
          <option value="token_regenere">Régénération Clé POS</option>
        </select>

        <button
          onClick={fetchLogs}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px solid #cbd5e1',
            background: '#f8fafc',
            color: '#475569',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={14} /> Actualiser
        </button>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: 12, borderRadius: 8, fontSize: 14, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* Tableau des logs */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Chargement du journal d&apos;audit...</div>
      ) : logs.length === 0 ? (
        <div style={{ padding: 48, textAlign: 'center', background: '#f8fafc', borderRadius: 12, border: '1px dashed #cbd5e1' }}>
          <p style={{ fontSize: 32, margin: '0 0 8px' }}>📜</p>
          <p style={{ margin: 0, fontWeight: 700, color: '#334155' }}>Aucun événement enregistré dans ce filtre</p>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>Les actions menées sur la boutique apparaîtront ici automatiquement.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #e2e8f0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Horodatage</th>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Auteur</th>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Type d&apos;action</th>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Description de l&apos;événement</th>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Adresse IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => {
                const badge = getBadgeColor(log.type_action)
                const dateObj = new Date(log.created_at)
                return (
                  <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', color: '#64748b', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{dateObj.toLocaleDateString('fr-FR')}</div>
                      <div style={{ fontSize: 11 }}>{dateObj.toLocaleTimeString('fr-FR')}</div>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#1e293b' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <User size={14} style={{ color: '#94a3b8' }} />
                        {log.auteur_nom || 'Système'}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 10px',
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 700,
                        background: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.border}`,
                        whiteSpace: 'nowrap'
                      }}>
                        {log.type_action}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#334155', maxWidth: 360 }}>
                      <div style={{ fontWeight: 600 }}>{log.description}</div>
                      {log.metadonnees && Object.keys(log.metadonnees).length > 0 && (
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, fontFamily: 'monospace' }}>
                          {JSON.stringify(log.metadonnees)}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}>
                      {log.ip_adresse || '—'}
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
