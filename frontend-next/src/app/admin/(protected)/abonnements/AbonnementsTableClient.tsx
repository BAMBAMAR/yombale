'use client'

import React, { useState, useTransition } from 'react'
import AbonnementRowActions from './AbonnementRowActions'
import { annulerAbonnement, prolongerAbonnement } from './actions'
import BatchActionBar, { BatchActionConfig } from '@/components/admin/BatchActionBar'

export interface Abonnement {
  id: string
  plan: 'pro' | 'business'
  statut: 'actif' | 'expire' | 'annule'
  prix_mensuel: string
  debut: string
  fin: string
  commande_ref: string | null
  created_at: string
  utilisateur_nom: string
  utilisateur_email: string
  telephone: string | null
}

function fcfa(v: string | number) {
  const n = typeof v === 'string' ? parseFloat(v) : v
  return (n || 0).toLocaleString('fr-SN') + ' FCFA'
}

function dateF(d: string) {
  return new Date(d).toLocaleDateString('fr-FR')
}

const badge = (plan: string) => plan === 'business'
  ? <span style={{ background: '#1e3a5f', color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>BUSINESS</span>
  : <span style={{ background: '#C75B00', color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>PRO</span>

const statutColor = (s: string) => s === 'actif' ? '#16a34a' : s === 'annule' ? '#dc2626' : '#94a3b8'

export default function AbonnementsTableClient({ abonnements }: { abonnements: Abonnement[] }) {
  const [, startTransition] = useTransition()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loadingBatch, setLoadingBatch] = useState(false)

  function refresh() {
    startTransition(() => { window.location.reload() })
  }

  const allIds = abonnements.map(a => a.id)
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

  return (
    <div>
      <BatchActionBar
        selectedCount={selectedIds.length}
        totalCount={abonnements.length}
        allSelected={allSelected}
        onToggleSelectAll={toggleSelectAll}
        onClearSelection={() => setSelectedIds([])}
        actions={batchActions}
        loading={loadingBatch}
        itemLabel="abonnement(s)"
      />

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 850 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '10px 14px', width: 40, textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    style={{ width: 16, height: 16, accentColor: '#3b82f6', cursor: 'pointer' }}
                  />
                </th>
                {['Utilisateur', 'Plan', 'Statut', 'Prix', 'Début', 'Fin', 'Réf. paiement', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {abonnements.length === 0 && (
                <tr><td colSpan={9} style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>Aucun abonnement pour le moment</td></tr>
              )}
              {abonnements.map((a, i) => {
                const isSel = selectedIds.includes(a.id)
                return (
                  <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9', background: isSel ? '#eff6ff' : i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={isSel}
                        onChange={() => toggleSelect(a.id)}
                        style={{ width: 16, height: 16, accentColor: '#3b82f6', cursor: 'pointer' }}
                      />
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontWeight: 600 }}>{a.utilisateur_nom}</div>
                      <div style={{ color: '#64748b', fontSize: 12 }}>{a.utilisateur_email}</div>
                      {a.telephone && <div style={{ color: '#94a3b8', fontSize: 11 }}>{a.telephone}</div>}
                    </td>
                    <td style={{ padding: '10px 14px' }}>{badge(a.plan)}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ color: statutColor(a.statut), fontWeight: 600 }}>{a.statut}</span>
                    </td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>{fcfa(a.prix_mensuel)}</td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', color: '#64748b' }}>{dateF(a.debut)}</td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', color: a.statut === 'actif' ? '#16a34a' : '#94a3b8', fontWeight: a.statut === 'actif' ? 600 : 400 }}>{dateF(a.fin)}</td>
                    <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: 12, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.commande_ref ?? '—'}</td>
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
