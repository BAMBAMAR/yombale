'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Activity, RefreshCw, Play, CheckCircle2, AlertTriangle, XCircle,
  Database, Clock, Filter, Server, Layers, ShieldCheck, ChevronRight
} from 'lucide-react'

interface RunItem {
  id: number
  source: string
  systeme: string
  statut: 'ok' | 'degrade' | 'echec'
  started_at: string
  ended_at: string
  pages_cibles: number
  pages_ok: number
  pages_erreur: number
  http_codes: Record<string, number>
  items_extraits: number
  items_inseres: number
  items_maj: number
  items_filtres: number
  items_doublons: number
  couverture: number | null
  duree_ms: number
  erreur_msg: string | null
}

interface SourceV2 {
  id: string
  nom: string
  domaine: string
  baseUrl: string
  systeme: string
  type_methode: string
  categories: string[]
  cadence: string
  actif: boolean
  nb_offres: number
  nb_stock: number
  derniere_sync: string | null
  dernier_run: {
    statut: string
    started_at: string
    items_extraits: number
    items_inseres: number
    erreur: string | null
  } | null
}

export default function AdminScrapingClient({ secret }: { secret: string }) {
  const [runs, setRuns] = useState<RunItem[]>([])
  const [sources, setSources] = useState<SourceV2[]>([])
  const [kpis, setKpis] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [actionEnCours, setActionEnCours] = useState<string | null>(null)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [tab, setTab] = useState<'sources' | 'runs' | 'alertes'>('sources')
  const [filtreStatut, setFiltreStatut] = useState<string>('all')
  const [filtreSource, setFiltreSource] = useState<string>('')

  const chargerDonnees = useCallback(async () => {
    try {
      setLoading(true)
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'X-Admin-Secret': secret,
      }

      const [resRuns, resSources] = await Promise.all([
        fetch(`/api/scraper/runs?statut=${filtreStatut}${filtreSource ? `&source=${encodeURIComponent(filtreSource)}` : ''}`, { headers }),
        fetch('/api/scraper/v2/sources', { headers }),
      ])

      if (resRuns.ok) {
        const dataRuns = await resRuns.json()
        setRuns(dataRuns.runs || [])
        setKpis(dataRuns.kpis || {})
      }
      if (resSources.ok) {
        const dataSources = await resSources.json()
        setSources(dataSources.sources || [])
      }
    } catch (e: any) {
      console.error('Erreur chargement scraping:', e)
    } finally {
      setLoading(false)
    }
  }, [secret, filtreStatut, filtreSource])

  useEffect(() => {
    chargerDonnees()
  }, [chargerDonnees])

  async function declencherCollecte(sourceId: string, nomSource: string) {
    if (actionEnCours) return
    try {
      setActionEnCours(sourceId)
      const res = await fetch(`/api/scraper/v2/run/${sourceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Secret': secret,
        },
      })
      const data = await res.json()
      if (res.ok) {
        setMessage({ text: `Collecte lancée pour ${nomSource}. Suivi dans les runs récents.`, type: 'success' })
        setTimeout(() => chargerDonnees(), 3000)
      } else {
        setMessage({ text: data.error || 'Erreur déclenchement', type: 'error' })
      }
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' })
    } finally {
      setActionEnCours(null)
      setTimeout(() => setMessage(null), 5000)
    }
  }

  const badgeStatut = (st: string) => {
    if (st === 'ok') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: '#e6f4ea', color: '#0A5C36' }}>
          <CheckCircle2 size={12} /> OK
        </span>
      )
    }
    if (st === 'degrade') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: '#fef3e2', color: '#C75B00' }}>
          <AlertTriangle size={12} /> Dégradé
        </span>
      )
    }
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: '#fce8e6', color: '#c5221f' }}>
        <XCircle size={12} /> Échec
      </span>
    )
  }

  return (
    <div style={{ width: '100%', maxWidth: 1280, margin: '0 auto', padding: '24px 16px' }}>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={22} color="#C75B00" />
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#1C2B4A' }}>
              Supervision Scraping & Ingestion
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: '#64748b' }}>
            Observabilité en cascade V2, contrôle des collectes et diagnostic des sources marchandes.
          </p>
        </div>

        <button
          onClick={() => chargerDonnees()}
          disabled={loading}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: '#1C2B4A', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Actualiser
        </button>
      </div>

      {/* Message de confirmation */}
      {message && (
        <div style={{ padding: '10px 16px', borderRadius: 8, marginBottom: 20, fontSize: 13, fontWeight: 500, background: message.type === 'success' ? '#e6f4ea' : '#fce8e6', color: message.type === 'success' ? '#0A5C36' : '#c5221f' }}>
          {message.text}
        </div>
      )}

      {/* Cartes KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
        <div style={{ padding: 16, background: '#fff', borderRadius: 10, border: '1px solid #E8DDD2' }}>
          <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Runs 30 Jours</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#1C2B4A', marginTop: 4 }}>{kpis.total_runs ?? 0}</div>
          <div style={{ fontSize: 12, color: '#0A5C36', marginTop: 2 }}>{kpis.runs_ok ?? 0} réussis ({kpis.total_runs ? Math.round(((kpis.runs_ok || 0) / kpis.total_runs) * 100) : 0}%)</div>
        </div>

        <div style={{ padding: 16, background: '#fff', borderRadius: 10, border: '1px solid #E8DDD2' }}>
          <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Alertes & Échecs</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: kpis.runs_echec > 0 ? '#c5221f' : '#1C2B4A', marginTop: 4 }}>{kpis.runs_echec ?? 0}</div>
          <div style={{ fontSize: 12, color: '#C75B00', marginTop: 2 }}>{kpis.runs_degrade ?? 0} passages dégradés</div>
        </div>

        <div style={{ padding: 16, background: '#fff', borderRadius: 10, border: '1px solid #E8DDD2' }}>
          <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Offres Extraites</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#1C2B4A', marginTop: 4 }}>{Number(kpis.total_extraits ?? 0).toLocaleString()}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{Number(kpis.total_inseres ?? 0).toLocaleString()} nouvelles créées</div>
        </div>

        <div style={{ padding: 16, background: '#fff', borderRadius: 10, border: '1px solid #E8DDD2' }}>
          <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Mises à Jour</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#0A5C36', marginTop: 4 }}>{Number(kpis.total_maj ?? 0).toLocaleString()}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Fraîcheur & synchronisation</div>
        </div>
      </div>

      {/* Onglets navigation */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #E8DDD2', marginBottom: 20 }}>
        <button
          onClick={() => setTab('sources')}
          style={{ padding: '8px 16px', background: 'none', border: 'none', borderBottom: tab === 'sources' ? '2px solid #C75B00' : '2px solid transparent', color: tab === 'sources' ? '#1C2B4A' : '#64748b', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
        >
          Sources V2 ({sources.length})
        </button>
        <button
          onClick={() => setTab('runs')}
          style={{ padding: '8px 16px', background: 'none', border: 'none', borderBottom: tab === 'runs' ? '2px solid #C75B00' : '2px solid transparent', color: tab === 'runs' ? '#1C2B4A' : '#64748b', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
        >
          Historique des Runs ({runs.length})
        </button>
      </div>

      {/* CONTENU ONGLET 1 : SOURCES V2 */}
      {tab === 'sources' && (
        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #E8DDD2', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F8F5F0', borderBottom: '1px solid #E8DDD2', color: '#1C2B4A' }}>
                <th style={{ padding: '12px 16px' }}>Source & Domaine</th>
                <th style={{ padding: '12px 16px' }}>Méthode V2</th>
                <th style={{ padding: '12px 16px' }}>Offres Actives</th>
                <th style={{ padding: '12px 16px' }}>Dernière Synchronisation</th>
                <th style={{ padding: '12px 16px' }}>Dernier Run</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {sources.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600, color: '#1C2B4A' }}>{s.nom}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{s.domaine}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 4, background: '#f1f5f9', fontSize: 12, color: '#334155', fontFamily: 'monospace' }}>
                      {s.type_methode}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontWeight: 600, color: '#1C2B4A' }}>{s.nb_offres.toLocaleString()}</span>
                    <span style={{ fontSize: 11, color: '#64748b', marginLeft: 4 }}>({s.nb_stock} en stock)</span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#475569' }}>
                    {s.derniere_sync ? new Date(s.derniere_sync).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Jamais'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {s.dernier_run ? (
                      <div>
                        {badgeStatut(s.dernier_run.statut)}
                        <span style={{ fontSize: 11, color: '#64748b', marginLeft: 6 }}>{s.dernier_run.items_extraits} items</span>
                      </div>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: 12 }}>Aucun run</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button
                      onClick={() => declencherCollecte(s.id, s.nom)}
                      disabled={actionEnCours === s.id}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 6, background: '#C75B00', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                    >
                      <Play size={12} />
                      {actionEnCours === s.id ? 'En cours...' : 'Lancer'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CONTENU ONGLET 2 : HISTORIQUE DES RUNS */}
      {tab === 'runs' && (
        <div>
          {/* Filtres */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#475569' }}>
              <Filter size={14} /> Filtre Statut :
            </div>
            {(['all', 'ok', 'degrade', 'echec'] as const).map(st => (
              <button
                key={st}
                onClick={() => setFiltreStatut(st)}
                style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #E8DDD2', background: filtreStatut === st ? '#1C2B4A' : '#fff', color: filtreStatut === st ? '#fff' : '#1C2B4A', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                {st === 'all' ? 'Tous' : st.toUpperCase()}
              </button>
            ))}
          </div>

          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #E8DDD2', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8F5F0', borderBottom: '1px solid #E8DDD2', color: '#1C2B4A' }}>
                  <th style={{ padding: '12px 16px' }}>Source</th>
                  <th style={{ padding: '12px 16px' }}>Date & Durée</th>
                  <th style={{ padding: '12px 16px' }}>Statut</th>
                  <th style={{ padding: '12px 16px' }}>Extraits</th>
                  <th style={{ padding: '12px 16px' }}>Insérés / Màj</th>
                  <th style={{ padding: '12px 16px' }}>Codes HTTP & Motifs</th>
                </tr>
              </thead>
              <tbody>
                {runs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>
                      Aucun passage de collecte trouvé.
                    </td>
                  </tr>
                ) : (
                  runs.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1C2B4A' }}>
                        {r.source}
                        <div style={{ fontSize: 11, color: '#64748b' }}>{r.systeme}</div>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#475569' }}>
                        <div>{new Date(r.started_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{Math.round((r.duree_ms || 0) / 1000)} s</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {badgeStatut(r.statut)}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1C2B4A' }}>
                        {r.items_extraits}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ color: '#0A5C36', fontWeight: 600 }}>+{r.items_inseres}</span>
                        <span style={{ color: '#64748b', marginLeft: 6 }}>/ {r.items_maj}</span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: '#475569' }}>
                        {r.erreur_msg ? (
                          <div style={{ color: '#c5221f' }}>{r.erreur_msg}</div>
                        ) : null}
                        {r.http_codes ? (
                          <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#64748b' }}>
                            {Object.entries(r.http_codes).map(([k, v]) => `${k}:${v}`).join(' ')}
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
