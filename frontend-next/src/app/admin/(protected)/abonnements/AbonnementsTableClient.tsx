'use client'

import React, { useState, useTransition, useMemo } from 'react'
import Link from 'next/link'
import AbonnementRowActions from './AbonnementRowActions'
import { annulerAbonnement, prolongerAbonnement } from './actions'
import BatchActionBar, { BatchActionConfig } from '@/components/admin/BatchActionBar'

export interface Abonnement {
  id: string
  plan: 'pro' | 'business' | 'decouverte' | string
  statut: 'actif' | 'expire' | 'annule'
  prix_mensuel: string
  debut: string
  fin: string
  commande_ref: string | null
  created_at: string
  utilisateur_nom: string
  utilisateur_email: string
  telephone: string | null
  boutique_id?: string | null
  boutique_nom?: string | null
  boutique_slug?: string | null
}

function fcfa(v: string | number) {
  const n = typeof v === 'string' ? parseFloat(v) : v
  return (n || 0).toLocaleString('fr-SN') + ' FCFA'
}

function dateF(d: string) {
  try {
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return d
  }
}

function getRemainingDays(fin: string) {
  const now = new Date().getTime()
  const end = new Date(fin).getTime()
  return Math.ceil((end - now) / (1000 * 3600 * 24))
}

const badge = (plan: string) => {
  if (plan === 'business') {
    return <span style={{ background: '#7E22CE', color: '#fff', borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 800 }}>👑 BUSINESS</span>
  }
  if (plan === 'pro') {
    return <span style={{ background: '#C75B00', color: '#fff', borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 800 }}>⭐ PRO</span>
  }
  return <span style={{ background: '#1D4ED8', color: '#fff', borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 800 }}>⚡ TAF TAF</span>
}

export default function AbonnementsTableClient({ abonnements }: { abonnements: Abonnement[] }) {
  const [, startTransition] = useTransition()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loadingBatch, setLoadingBatch] = useState(false)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'tous' | 'actifs' | 'bientot' | 'expires' | 'annules'>('tous')
  const [planFilter, setPlanFilter] = useState<'tous' | 'pro' | 'business' | 'decouverte'>('tous')
  const [sortBy, setSortBy] = useState<'fin_asc' | 'fin_desc' | 'created_desc' | 'prix_desc'>('fin_asc')

  function refresh() {
    startTransition(() => { window.location.reload() })
  }

  // Filtrage et Recherche
  const filteredAbonnements = useMemo(() => {
    return abonnements.filter(a => {
      const q = search.trim().toLowerCase()
      const matchSearch = !q || (
        (a.utilisateur_nom && a.utilisateur_nom.toLowerCase().includes(q)) ||
        (a.utilisateur_email && a.utilisateur_email.toLowerCase().includes(q)) ||
        (a.telephone && a.telephone.toLowerCase().includes(q)) ||
        (a.commande_ref && a.commande_ref.toLowerCase().includes(q)) ||
        (a.boutique_nom && a.boutique_nom.toLowerCase().includes(q)) ||
        (a.plan && a.plan.toLowerCase().includes(q))
      )

      if (!matchSearch) return false

      // Filtre Plan
      if (planFilter !== 'tous' && a.plan !== planFilter) return false

      // Filtre Statut / Tab
      const days = getRemainingDays(a.fin)
      const isActif = a.statut === 'actif' && days > 0
      const isBientot = isActif && days <= 7
      const isExpire = a.statut === 'expire' || (a.statut === 'actif' && days <= 0)
      const isAnnule = a.statut === 'annule'

      if (activeTab === 'actifs') return isActif
      if (activeTab === 'bientot') return isBientot
      if (activeTab === 'expires') return isExpire
      if (activeTab === 'annules') return isAnnule

      return true
    }).sort((a, b) => {
      if (sortBy === 'fin_asc') {
        return new Date(a.fin).getTime() - new Date(b.fin).getTime()
      }
      if (sortBy === 'fin_desc') {
        return new Date(b.fin).getTime() - new Date(a.fin).getTime()
      }
      if (sortBy === 'created_desc') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
      if (sortBy === 'prix_desc') {
        return parseFloat(b.prix_mensuel || '0') - parseFloat(a.prix_mensuel || '0')
      }
      return 0
    })
  }, [abonnements, search, activeTab, planFilter, sortBy])

  // Compteurs
  const counts = useMemo(() => {
    let actifs = 0
    let bientot = 0
    let expires = 0
    let annules = 0

    abonnements.forEach(a => {
      const days = getRemainingDays(a.fin)
      if (a.statut === 'annule') {
        annules++
      } else if (a.statut === 'expire' || days <= 0) {
        expires++
      } else if (a.statut === 'actif') {
        actifs++
        if (days <= 7) bientot++
      }
    })

    return { tous: abonnements.length, actifs, bientot, expires, annules }
  }, [abonnements])

  const allIds = filteredAbonnements.map(a => a.id)
  const allSelected = allIds.length > 0 && selectedIds.length === allIds.length

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([])
    } else {
      setSelectedIds(allIds)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleBatchProlonger = async () => {
    setLoadingBatch(true)
    for (const id of selectedIds) {
      try {
        await prolongerAbonnement(id, 30)
      } catch {}
    }
    setSelectedIds([])
    setLoadingBatch(false)
    refresh()
  }

  const handleBatchAnnuler = async () => {
    setLoadingBatch(true)
    for (const id of selectedIds) {
      try {
        await annulerAbonnement(id)
      } catch {}
    }
    setSelectedIds([])
    setLoadingBatch(false)
    refresh()
  }

  const batchActions: BatchActionConfig[] = [
    {
      key: 'prolongation',
      label: 'Prolonger 30 jours',
      icon: '⏱️',
      color: 'blue',
      onClick: handleBatchProlonger,
    },
    {
      key: 'annuler',
      label: 'Annuler les abonnements',
      icon: '🚫',
      color: 'red',
      confirmMsg: 'Annuler les abonnements sélectionnés ?',
      onClick: handleBatchAnnuler,
    },
  ]

  // Export CSV
  const exportCSV = () => {
    const headers = ['ID', 'Utilisateur', 'Email', 'Telephone', 'Boutique', 'Plan', 'Statut', 'Prix Mensuel', 'Debut', 'Fin', 'Reference']
    const rows = filteredAbonnements.map(a => [
      a.id,
      `"${(a.utilisateur_nom || '').replace(/"/g, '""')}"`,
      `"${(a.utilisateur_email || '').replace(/"/g, '""')}"`,
      `"${(a.telephone || '').replace(/"/g, '""')}"`,
      `"${(a.boutique_nom || '').replace(/"/g, '""')}"`,
      a.plan,
      a.statut,
      a.prix_mensuel,
      a.debut,
      a.fin,
      `"${(a.commande_ref || '').replace(/"/g, '""')}"`,
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `abonnements-nopalou-${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── BARRE D'OUTILS ET RECHERCHE ── */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Champ Recherche */}
          <div style={{ position: 'relative', flex: '1 1 300px', minWidth: 260 }}>
            <input
              type="text"
              placeholder="🔍 Rechercher par nom, email, téléphone, boutique, réf..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px 10px 38px',
                border: '1.5px solid #cbd5e1',
                borderRadius: 8,
                fontSize: 14,
                outline: 'none',
              }}
            />
            <span style={{ position: 'absolute', left: 12, top: 11, color: '#94a3b8', fontSize: 15 }}>🔍</span>
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{ position: 'absolute', right: 10, top: 10, background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 14 }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Filtres Sélecteurs */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              value={planFilter}
              onChange={e => setPlanFilter(e.target.value as any)}
              style={{ padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13, background: '#fff', fontWeight: 600, color: '#334155' }}
            >
              <option value="tous">📦 Tous les plans</option>
              <option value="pro">⭐ Boutique Pro</option>
              <option value="business">👑 Boutique Business</option>
              <option value="decouverte">⚡ Boutique Taf Taf</option>
            </select>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              style={{ padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13, background: '#fff', color: '#334155' }}
            >
              <option value="fin_asc">⏳ Échéance (plus proche)</option>
              <option value="fin_desc">⏳ Échéance (plus lointaine)</option>
              <option value="created_desc">📅 Inscription récente</option>
              <option value="prix_desc">💰 Montant décroissant</option>
            </select>

            <button
              onClick={exportCSV}
              style={{ padding: '9px 14px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13, fontWeight: 700, color: '#1e293b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              📥 Exporter CSV
            </button>
          </div>
        </div>

        {/* Onglets Filtres Statut */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', borderTop: '1px solid #f1f5f9', paddingTop: 14 }}>
          {[
            { key: 'tous', label: 'Tous', count: counts.tous, color: '#64748b' },
            { key: 'actifs', label: '🟢 Actifs', count: counts.actifs, color: '#16a34a' },
            { key: 'bientot', label: '⏳ Expire bientôt (< 7j)', count: counts.bientot, color: '#d97706' },
            { key: 'expires', label: '⚫ Expirés', count: counts.expires, color: '#64748b' },
            { key: 'annules', label: '🚫 Annulés', count: counts.annules, color: '#dc2626' },
          ].map(t => {
            const isActive = activeTab === t.key
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key as any)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: isActive ? 800 : 600,
                  border: isActive ? `2px solid ${t.color}` : '1px solid #e2e8f0',
                  background: isActive ? (t.key === 'actifs' ? '#f0fdf4' : t.key === 'bientot' ? '#fffbeb' : t.key === 'annules' ? '#fef2f2' : '#f8fafc') : '#fff',
                  color: isActive ? t.color : '#64748b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>{t.label}</span>
                <span style={{
                  background: isActive ? t.color : '#f1f5f9',
                  color: isActive ? '#fff' : '#64748b',
                  padding: '2px 7px',
                  borderRadius: 10,
                  fontSize: 11,
                  fontWeight: 800,
                }}>
                  {t.count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <BatchActionBar
        selectedCount={selectedIds.length}
        totalCount={filteredAbonnements.length}
        allSelected={allSelected}
        onToggleSelectAll={toggleSelectAll}
        onClearSelection={() => setSelectedIds([])}
        actions={batchActions}
        loading={loadingBatch}
        itemLabel="abonnement(s)"
      />

      {/* ── TABLE DES ABONNEMENTS ── */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 950 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 14px', width: 40, textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    style={{ width: 16, height: 16, accentColor: '#3b82f6', cursor: 'pointer' }}
                  />
                </th>
                {['Utilisateur', 'Boutique reliée', 'Formule', 'Statut / Échéance', 'Prix', 'Validité', 'Réf. Paiement', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#334155', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredAbonnements.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                    Aucun abonnement ne correspond à vos critères de recherche.
                  </td>
                </tr>
              )}
              {filteredAbonnements.map((a, i) => {
                const isSel = selectedIds.includes(a.id)
                const days = getRemainingDays(a.fin)
                const isActif = a.statut === 'actif' && days > 0
                const isBientot = isActif && days <= 7

                return (
                  <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9', background: isSel ? '#eff6ff' : i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={isSel}
                        onChange={() => toggleSelect(a.id)}
                        style={{ width: 16, height: 16, accentColor: '#3b82f6', cursor: 'pointer' }}
                      />
                    </td>

                    {/* Utilisateur */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 700, color: '#1e293b' }}>{a.utilisateur_nom || 'Sans nom'}</div>
                      <div style={{ color: '#64748b', fontSize: 12 }}>{a.utilisateur_email}</div>
                      {a.telephone && <div style={{ color: '#0284c7', fontSize: 12, fontWeight: 600 }}>📞 {a.telephone}</div>}
                    </td>

                    {/* Boutique reliée */}
                    <td style={{ padding: '12px 14px' }}>
                      {a.boutique_nom ? (
                        <div>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>🏪 {a.boutique_nom}</div>
                          {a.boutique_slug && (
                            <Link
                              href={`/boutiques/${a.boutique_slug}`}
                              target="_blank"
                              style={{ fontSize: 11, color: '#2563eb', textDecoration: 'underline' }}
                            >
                              Voir la vitrine ↗
                            </Link>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: 12, fontStyle: 'italic' }}>Aucune boutique</span>
                      )}
                    </td>

                    {/* Plan */}
                    <td style={{ padding: '12px 14px' }}>{badge(a.plan)}</td>

                    {/* Statut & Échéance */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {isActif ? (
                          isBientot ? (
                            <span style={{ background: '#fef3c7', color: '#b45309', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800, width: 'fit-content' }}>
                              ⏳ Expire dans {days} j
                            </span>
                          ) : (
                            <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800, width: 'fit-content' }}>
                              🟢 Actif ({days} j restants)
                            </span>
                          )
                        ) : a.statut === 'annule' ? (
                          <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800, width: 'fit-content' }}>
                            🚫 Annulé
                          </span>
                        ) : (
                          <span style={{ background: '#f1f5f9', color: '#64748b', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800, width: 'fit-content' }}>
                            ⚫ Expiré
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Prix */}
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', fontWeight: 700, color: '#1e293b' }}>
                      {fcfa(a.prix_mensuel)}
                    </td>

                    {/* Validité */}
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', fontSize: 12 }}>
                      <div style={{ color: '#64748b' }}>Du : {dateF(a.debut)}</div>
                      <div style={{ fontWeight: 700, color: isActif ? '#16a34a' : '#64748b' }}>Au : {dateF(a.fin)}</div>
                    </td>

                    {/* Référence Paiement */}
                    <td style={{ padding: '12px 14px', color: '#64748b', fontSize: 11, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <code style={{ background: '#f1f5f9', padding: '2px 5px', borderRadius: 4 }}>{a.commande_ref ?? '—'}</code>
                    </td>

                    {/* Actions */}
                    <AbonnementRowActions id={a.id} statut={a.statut} plan={a.plan} />
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
