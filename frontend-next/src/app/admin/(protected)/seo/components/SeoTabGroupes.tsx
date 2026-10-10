// frontend-next/src/app/admin/(protected)/seo/components/SeoTabGroupes.tsx
'use client'

import React, { useState, useMemo } from 'react'
import {
  Search,
  Download,
  Filter,
  ArrowUpDown,
  Tag,
  AlertCircle,
  HelpCircle,
  Clock,
  ExternalLink
} from 'lucide-react'
import { RequeteCluster, PrioriteCluster, IntentionRecherche, StatutSuiviCluster } from '../types'
import { CLUSTERS_SEO_INITIAUX } from '../data/seo-clusters'

export default function SeoTabGroupes() {
  const [clusters] = useState<RequeteCluster[]>(CLUSTERS_SEO_INITIAUX)
  const [recherche, setRecherche] = useState('')
  const [filtrePriorite, setFiltrePriorite] = useState<string>('TOUS')
  const [filtreIntention, setFiltreIntention] = useState<string>('TOUTES')
  const [filtreStatut, setFiltreStatut] = useState<string>('TOUS')

  const clustersFiltres = useMemo(() => {
    return clusters.filter((c) => {
      if (recherche) {
        const q = recherche.toLowerCase()
        const match =
          c.id.toLowerCase().includes(q) ||
          c.requete.toLowerCase().includes(q) ||
          c.pageCible.toLowerCase().includes(q) ||
          c.categorie.toLowerCase().includes(q)
        if (!match) return false
      }
      if (filtrePriorite !== 'TOUS' && c.priorite !== filtrePriorite) return false
      if (filtreIntention !== 'TOUTES' && c.intention !== filtreIntention) return false
      if (filtreStatut !== 'TOUS' && c.statut !== filtreStatut) return false
      return true
    })
  }, [clusters, recherche, filtrePriorite, filtreIntention, filtreStatut])

  const exporterCsv = () => {
    const headers = [
      'Cluster ID',
      'Requete',
      'Intention',
      'Priorite',
      'Categorie',
      'Page Cible',
      'Volume Estime',
      'Position Observee',
      'Clics GSC',
      'Impressions GSC',
      'CTR GSC',
      'Source',
      'Statut Suivi',
      'Derniere Observation',
      'Action Recommandee'
    ]

    const rows = clustersFiltres.map((c) => [
      c.id,
      `"${c.requete.replace(/"/g, '""')}"`,
      c.intention,
      c.priorite,
      `"${c.categorie.replace(/"/g, '""')}"`,
      c.pageCible,
      `"${c.volumeEstime}"`,
      c.positionObservee !== null ? c.positionObservee : 'N/A',
      c.clicsGsc,
      c.impressionsGsc,
      `${c.ctrGsc}%`,
      c.source,
      c.statut,
      c.derniereObservation,
      `"${c.actionRecommandee.replace(/"/g, '""')}"`
    ])

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `nopalou_clusters_seo_${filtrePriorite}_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const badgeStatutColor = (statut: StatutSuiviCluster) => {
    switch (statut) {
      case 'SUIVI ACTIF':
        return { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' }
      case 'DONNÉES INSUFFISANTES':
        return { bg: '#fffbeb', text: '#92400e', border: '#fde68a' }
      case 'SOURCE NON CONNECTÉE':
        return { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' }
      case 'À VÉRIFIER':
        return { bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe' }
      case 'SUSPENDU':
        return { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* En-tête avec métriques globales */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        background: '#ffffff',
        padding: '16px 20px',
        borderRadius: 10,
        border: '1px solid var(--border, #E8DDD2)'
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
            Portefeuille des 1 000 Groupes de Requêtes Prioritaires
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
            Suivi unitaire des clusters d'intentions marché du Sénégal sans extrapolation aveugle.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={exporterCsv}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--navy, #1C2B4A)',
              color: '#ffffff',
              padding: '8px 14px',
              borderRadius: 6,
              border: 'none',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Download size={14} /> Exporter CSV ({clustersFiltres.length})
          </button>
        </div>
      </div>

      {/* Barre de filtrage avancée */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 12,
        background: '#ffffff',
        padding: '14px 18px',
        borderRadius: 10,
        border: '1px solid var(--border, #E8DDD2)'
      }}>
        {/* Champ recherche */}
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: 11, color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Rechercher par mot-clé, ID..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px 8px 32px',
              borderRadius: 6,
              border: '1px solid #cbd5e1',
              fontSize: 13,
              outline: 'none'
            }}
          />
        </div>

        {/* Filtre Priorité */}
        <div>
          <select
            value={filtrePriorite}
            onChange={(e) => setFiltrePriorite(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 6,
              border: '1px solid #cbd5e1',
              fontSize: 13,
              background: '#ffffff',
              outline: 'none'
            }}
          >
            <option value="TOUS">Toutes les priorités (P0 - P3)</option>
            <option value="P0">P0 (Stratégique - 50)</option>
            <option value="P1">P1 (Majeur - 150)</option>
            <option value="P2">P2 (Important - 300)</option>
            <option value="P3">P3 (Secondaire - 500)</option>
          </select>
        </div>

        {/* Filtre Intention */}
        <div>
          <select
            value={filtreIntention}
            onChange={(e) => setFiltreIntention(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 6,
              border: '1px solid #cbd5e1',
              fontSize: 13,
              background: '#ffffff',
              outline: 'none'
            }}
          >
            <option value="TOUTES">Toutes les intentions</option>
            <option value="Commerciale">Commerciale</option>
            <option value="Transactionnelle">Transactionnelle</option>
            <option value="Informationnelle">Informationnelle</option>
            <option value="Navigationnelle">Navigationnelle</option>
          </select>
        </div>

        {/* Filtre Statut du suivi */}
        <div>
          <select
            value={filtreStatut}
            onChange={(e) => setFiltreStatut(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 6,
              border: '1px solid #cbd5e1',
              fontSize: 13,
              background: '#ffffff',
              outline: 'none'
            }}
          >
            <option value="TOUS">Tous les statuts de suivi</option>
            <option value="SUIVI ACTIF">SUIVI ACTIF</option>
            <option value="DONNÉES INSUFFISANTES">DONNÉES INSUFFISANTES</option>
            <option value="SOURCE NON CONNECTÉE">SOURCE NON CONNECTÉE</option>
            <option value="À VÉRIFIER">À VÉRIFIER</option>
            <option value="SUSPENDU">SUSPENDU</option>
          </select>
        </div>
      </div>

      {/* Tableau des clusters */}
      <div style={{
        background: '#ffffff',
        border: '1px solid var(--border, #E8DDD2)',
        borderRadius: 10,
        overflow: 'hidden'
      }}>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID Cluster</th>
                <th>Requête type</th>
                <th>Intention</th>
                <th>Prio</th>
                <th>Catégorie</th>
                <th>Page Cible</th>
                <th>Rang SERP</th>
                <th>Source</th>
                <th>Statut du Suivi</th>
                <th>Action Recommandée</th>
              </tr>
            </thead>
            <tbody>
              {clustersFiltres.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '32px 16px', color: '#64748b' }}>
                    Aucun groupe de requêtes ne correspond aux critères de recherche.
                  </td>
                </tr>
              ) : (
                clustersFiltres.map((c) => {
                  const sStyle = badgeStatutColor(c.statut)
                  return (
                    <tr key={c.id}>
                      <td><code style={{ fontSize: 12, fontWeight: 700 }}>{c.id}</code></td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--navy, #1C2B4A)' }}>{c.requete}</div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Vol. estimé : {c.volumeEstime}</div>
                      </td>
                      <td>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: 6,
                          background: '#f1f5f9',
                          color: '#334155'
                        }}>
                          {c.intention}
                        </span>
                      </td>
                      <td>
                        <span className={`admin-badge ${c.priorite === 'P0' ? 'admin-badge--orange' : c.priorite === 'P1' ? 'admin-badge--blue' : 'admin-badge--gray'}`}>
                          {c.priorite}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, fontWeight: 500 }}>{c.categorie}</td>
                      <td>
                        <code style={{ fontSize: 11, color: 'var(--navy, #1C2B4A)' }}>{c.pageCible}</code>
                      </td>
                      <td>
                        {c.positionObservee !== null ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span className="admin-badge admin-badge--green" style={{ fontWeight: 700 }}>
                              {c.positionObservee}e
                            </span>
                            {c.positionPrecedente !== null && c.positionPrecedente > c.positionObservee && (
                              <span style={{ fontSize: 11, color: '#059669', fontWeight: 700 }}>
                                ↑{c.positionPrecedente - c.positionObservee}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>
                            Non mesuré
                          </span>
                        )}
                      </td>
                      <td>
                        <span style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: c.source === 'SERP-SN' ? '#ecfdf5' : '#f1f5f9',
                          color: c.source === 'SERP-SN' ? '#047857' : '#475569'
                        }}>
                          [{c.source}]
                        </span>
                      </td>
                      <td>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 12,
                          background: sStyle.bg,
                          color: sStyle.text,
                          border: `1px solid ${sStyle.border}`
                        }}>
                          {c.statut}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, maxWidth: 260, color: '#334155' }}>
                        {c.actionRecommandee}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
