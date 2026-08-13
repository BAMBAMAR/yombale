'use client'

import React, { useState, useTransition } from 'react'
import Link from 'next/link'
import { batchModererComptes } from '@/app/actions/admin'
import BatchActionBar, { BatchActionConfig } from '@/components/admin/BatchActionBar'

export interface Utilisateur {
  id: string
  nom: string
  email: string
  telephone: string | null
  email_verifie: boolean
  suspendu: boolean
  supprime_le: string | null
  created_at: string
}

function dateF(d: string) {
  return new Date(d).toLocaleDateString('fr-FR')
}

function badge(u: Utilisateur) {
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {u.email_verifie
        ? <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a' }}>✓ vérifié</span>
        : <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>non vérifié</span>}
      {u.suspendu && <span style={{ fontSize: 11, fontWeight: 700, color: '#dc2626' }}>🚫 suspendu</span>}
      {u.supprime_le && <span style={{ fontSize: 11, fontWeight: 700, color: '#d97706' }}>⏳ en suppression</span>}
    </div>
  )
}

export default function ComptesTableClient({ utilisateurs }: { utilisateurs: Utilisateur[] }) {
  const [, startTransition] = useTransition()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loadingBatch, setLoadingBatch] = useState(false)

  function refresh() {
    startTransition(() => { window.location.reload() })
  }

  const allIds = utilisateurs.map(u => u.id)
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

  const handleBatchSuspendre = async () => {
    setLoadingBatch(true)
    try {
      await batchModererComptes(selectedIds, 'suspendre')
      setSelectedIds([])
      refresh()
    } finally {
      setLoadingBatch(false)
    }
  }

  const handleBatchReactiver = async () => {
    setLoadingBatch(true)
    try {
      await batchModererComptes(selectedIds, 'reactiver')
      setSelectedIds([])
      refresh()
    } finally {
      setLoadingBatch(false)
    }
  }

  const handleBatchSupprimer = async () => {
    setLoadingBatch(true)
    try {
      await batchModererComptes(selectedIds, 'supprimer')
      setSelectedIds([])
      refresh()
    } finally {
      setLoadingBatch(false)
    }
  }

  const batchActions: BatchActionConfig[] = [
    {
      key: 'reactiver',
      label: 'Réactiver les comptes',
      icon: '✅',
      color: 'green',
      onClick: handleBatchReactiver,
    },
    {
      key: 'suspendre',
      label: 'Suspendre les comptes',
      icon: '🚫',
      color: 'amber',
      onClick: handleBatchSuspendre,
    },
    {
      key: 'supprimer',
      label: 'Supprimer (En suppression)',
      icon: '🗑️',
      color: 'red',
      confirmMsg: 'Êtes-vous sûr de vouloir passer ces comptes en état de suppression ?',
      onClick: handleBatchSupprimer,
    },
  ]

  return (
    <div>
      <BatchActionBar
        selectedCount={selectedIds.length}
        totalCount={utilisateurs.length}
        allSelected={allSelected}
        onToggleSelectAll={toggleSelectAll}
        onClearSelection={() => setSelectedIds([])}
        actions={batchActions}
        loading={loadingBatch}
        itemLabel="compte(s)"
      />

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 650 }}>
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
                {['Nom / Email', 'Téléphone', 'Statuts', 'Inscrit le', 'Action'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {utilisateurs.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>Aucun compte trouvé</td></tr>
              )}
              {utilisateurs.map((u, i) => {
                const isSel = selectedIds.includes(u.id)
                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9', background: isSel ? '#eff6ff' : i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={isSel}
                        onChange={() => toggleSelect(u.id)}
                        style={{ width: 16, height: 16, accentColor: '#3b82f6', cursor: 'pointer' }}
                      />
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontWeight: 600 }}>{u.nom}</div>
                      <div style={{ color: '#64748b', fontSize: 12 }}>{u.email}</div>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#64748b' }}>{u.telephone ?? '—'}</td>
                    <td style={{ padding: '10px 14px' }}>{badge(u)}</td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', color: '#64748b' }}>{dateF(u.created_at)}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <Link href={`/admin/comptes/${u.id}`} style={{ fontSize: 13, fontWeight: 700, color: '#1d4ed8', textDecoration: 'none' }}>
                        Voir →
                      </Link>
                    </td>
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
