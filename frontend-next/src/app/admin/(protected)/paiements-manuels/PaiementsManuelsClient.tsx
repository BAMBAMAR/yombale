'use client'

import { useState } from 'react'
import BatchActionBar, { BatchActionConfig } from '@/components/admin/BatchActionBar'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'

interface Paiement {
  id: string
  reference: string
  montant: string
  methode: 'wave' | 'orange'
  telephone_expediteur: string
  transaction_id_client: string | null
  preuve_url: string | null
  statut: string
  created_at: string
  utilisateur_nom: string
  utilisateur_email: string
  utilisateur_telephone: string | null
}

export default function PaiementsManuelsClient({
  initialPaiements, secret,
}: { initialPaiements: Paiement[]; secret: string }) {
  const [paiements, setPaiements] = useState(initialPaiements)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [enCours, setEnCours] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loadingBatch, setLoadingBatch] = useState(false)

  const allIds = paiements.map(p => p.id)
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

  async function valider(id: string) {
    setEnCours(id)
    setMsg(null)
    try {
      const r = await fetch(`${BACKEND}/api/paiement/manuel/${id}/valider`, {
        method: 'POST', headers: { 'X-Admin-Secret': secret },
      })
      const data = await r.json()
      if (!r.ok) { setMsg({ type: 'err', text: data.error || 'Erreur' }); return }
      setPaiements(ps => ps.filter(p => p.id !== id))
      setMsg({ type: 'ok', text: 'Paiement validé et activé ✓' })
    } catch {
      setMsg({ type: 'err', text: 'Erreur réseau' })
    } finally { setEnCours(null) }
  }

  async function rejeter(id: string) {
    const motif = prompt('Motif du rejet (optionnel) :') ?? ''
    setEnCours(id)
    setMsg(null)
    try {
      const r = await fetch(`${BACKEND}/api/paiement/manuel/${id}/rejeter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': secret },
        body: JSON.stringify({ motif }),
      })
      const data = await r.json()
      if (!r.ok) { setMsg({ type: 'err', text: data.error || 'Erreur' }); return }
      setPaiements(ps => ps.filter(p => p.id !== id))
      setMsg({ type: 'ok', text: 'Déclaration rejetée' })
    } catch {
      setMsg({ type: 'err', text: 'Erreur réseau' })
    } finally { setEnCours(null) }
  }

  const handleBatchValider = async () => {
    setLoadingBatch(true)
    setMsg(null)
    let okCount = 0
    for (const id of selectedIds) {
      try {
        const r = await fetch(`${BACKEND}/api/paiement/manuel/${id}/valider`, {
          method: 'POST', headers: { 'X-Admin-Secret': secret },
        })
        if (r.ok) okCount++
      } catch {}
    }
    setPaiements(ps => ps.filter(p => !selectedIds.includes(p.id)))
    setSelectedIds([])
    setLoadingBatch(false)
    setMsg({ type: 'ok', text: `${okCount} paiement(s) validé(s) avec succès !` })
  }

  const handleBatchRejeter = async () => {
    setLoadingBatch(true)
    setMsg(null)
    let okCount = 0
    for (const id of selectedIds) {
      try {
        const r = await fetch(`${BACKEND}/api/paiement/manuel/${id}/rejeter`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': secret },
          body: JSON.stringify({ motif: 'Rejet en masse' }),
        })
        if (r.ok) okCount++
      } catch {}
    }
    setPaiements(ps => ps.filter(p => !selectedIds.includes(p.id)))
    setSelectedIds([])
    setLoadingBatch(false)
    setMsg({ type: 'ok', text: `${okCount} paiement(s) rejeté(s)` })
  }

  const batchActions: BatchActionConfig[] = [
    {
      key: 'valider',
      label: 'Valider les paiements',
      icon: '🟢',
      color: 'green',
      onClick: handleBatchValider,
    },
    {
      key: 'rejeter',
      label: 'Rejeter les paiements',
      icon: '🔴',
      color: 'amber',
      confirmMsg: 'Rejeter les paiements sélectionnés ?',
      onClick: handleBatchRejeter,
    },
  ]

  return (
    <div style={{ maxWidth: 1100 }}>
      {msg && (
        <div style={{ padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontSize: 14, fontWeight: 600,
          background: msg.type === 'ok' ? '#dcfce7' : '#fee2e2',
          color: msg.type === 'ok' ? '#166534' : '#991b1b' }}>
          {msg.text}
        </div>
      )}

      <BatchActionBar
        selectedCount={selectedIds.length}
        totalCount={paiements.length}
        allSelected={allSelected}
        onToggleSelectAll={toggleSelectAll}
        onClearSelection={() => setSelectedIds([])}
        actions={batchActions}
        loading={loadingBatch}
        itemLabel="paiement(s)"
      />

      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
        <h3 style={{ margin: '0 0 18px', fontSize: 16, fontWeight: 700 }}>
          En attente ({paiements.length})
        </h3>
        {paiements.length === 0 ? (
          <p style={{ color: '#9ca3af', fontSize: 14 }}>Aucune déclaration en attente.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 950 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                  <th style={{ padding: '8px 10px', width: 40, textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      style={{ width: 16, height: 16, accentColor: '#3b82f6', cursor: 'pointer' }}
                    />
                  </th>
                  {['Client', 'Référence', 'Montant', 'Méthode', 'Tél. expéditeur', 'ID transaction', 'Preuve', 'Déclaré le', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: '#6b7280' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paiements.map(p => {
                  const isSel = selectedIds.includes(p.id)
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f9fafb', background: isSel ? '#eff6ff' : 'transparent' }}>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isSel}
                          onChange={() => toggleSelect(p.id)}
                          style={{ width: 16, height: 16, accentColor: '#3b82f6', cursor: 'pointer' }}
                        />
                      </td>
                      <td style={{ padding: '8px 10px' }}>{p.utilisateur_nom}<br /><span style={{ color: '#9ca3af' }}>{p.utilisateur_email}</span></td>
                      <td style={{ padding: '8px 10px', fontFamily: 'monospace' }}>{p.reference}</td>
                      <td style={{ padding: '8px 10px' }}>{Number(p.montant).toLocaleString('fr-FR')} FCFA</td>
                      <td style={{ padding: '8px 10px' }}>{p.methode === 'wave' ? '🌊 Wave' : '🟠 Orange'}</td>
                      <td style={{ padding: '8px 10px' }}>{p.telephone_expediteur}</td>
                      <td style={{ padding: '8px 10px' }}>{p.transaction_id_client || '—'}</td>
                      <td style={{ padding: '8px 10px' }}>
                        {p.preuve_url ? <a href={p.preuve_url} target="_blank" rel="noreferrer">Voir</a> : '—'}
                      </td>
                      <td style={{ padding: '8px 10px' }}>{new Date(p.created_at).toLocaleString('fr-FR')}</td>
                      <td style={{ padding: '8px 10px', display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => valider(p.id)}
                          disabled={enCours === p.id}
                          style={{ padding: '6px 12px', fontSize: 12, fontWeight: 700, borderRadius: 6, border: 'none', cursor: 'pointer', background: '#16a34a', color: '#fff' }}
                        >
                          Valider
                        </button>
                        <button
                          onClick={() => rejeter(p.id)}
                          disabled={enCours === p.id}
                          style={{ padding: '6px 12px', fontSize: 12, fontWeight: 700, borderRadius: 6, border: 'none', cursor: 'pointer', background: '#dc2626', color: '#fff' }}
                        >
                          Rejeter
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
