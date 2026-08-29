'use client'

import { useState } from 'react'
import type { Forfait } from './page'
import BatchActionBar, { BatchActionConfig } from '@/components/admin/BatchActionBar'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'

const TYPES = ['data', 'voix', 'mixte', 'sms']
const OPERATEURS = ['Orange', 'Free', 'Expresso', 'Autre']

const EMPTY: Omit<Forfait, 'id' | 'actif'> = {
  operateur: 'Orange',
  nom: '',
  type: 'mixte',
  data_mo: null,
  minutes: null,
  sms: null,
  validite_jours: null,
  prix: 0,
  description: null,
}

function num(v: string) { const n = parseFloat(v); return isNaN(n) ? null : n }

export default function AdminTelecomClient({
  forfaits: initial,
  adminSecret,
}: {
  forfaits: Forfait[]
  adminSecret: string
}) {
  const [forfaits, setForfaits] = useState<Forfait[]>(initial)
  const [modal, setModal] = useState<'create' | Forfait | null>(null)
  const [form, setForm] = useState<Omit<Forfait, 'id' | 'actif'>>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loadingBatch, setLoadingBatch] = useState(false)

  const allIds = forfaits.map(f => f.id)
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

  function openCreate() {
    setForm(EMPTY)
    setErr('')
    setModal('create')
  }

  function openEdit(f: Forfait) {
    setForm({
      operateur: f.operateur,
      nom: f.nom,
      type: f.type,
      data_mo: f.data_mo,
      minutes: f.minutes,
      sms: f.sms,
      validite_jours: f.validite_jours,
      prix: f.prix,
      description: f.description,
    })
    setErr('')
    setModal(f)
  }

  async function save() {
    if (!form.nom.trim() || !form.operateur || !form.type || form.prix == null) {
      setErr('Opérateur, nom, type et prix sont obligatoires.')
      return
    }
    setSaving(true)
    setErr('')
    const isEdit = modal !== 'create'
    const url  = isEdit ? `/api/telecom/${(modal as Forfait).id}` : `/api/telecom`
    const method = isEdit ? 'PUT' : 'POST'
    try {
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': adminSecret },
        body: JSON.stringify(form),
      })
      if (!r.ok) { const d = await r.json(); setErr(d.error || 'Erreur serveur'); return }
      const saved: Forfait = await r.json()
      if (isEdit) {
        setForfaits(prev => prev.map(f => f.id === saved.id ? saved : f))
      } else {
        setForfaits(prev => [saved, ...prev])
      }
      setModal(null)
    } catch { setErr('Impossible de contacter le serveur.') }
    finally { setSaving(false) }
  }

  async function deactivate(id: string) {
    if (!confirm('Désactiver ce forfait ?')) return
    try {
      const r = await fetch(`/api/telecom/${id}`, {
        method: 'DELETE',
        headers: { 'X-Admin-Secret': adminSecret },
      })
      if (r.ok) setForfaits(prev => prev.filter(f => f.id !== id))
    } catch { alert('Erreur lors de la désactivation.') }
  }

  const handleBatchDeactivate = async () => {
    setLoadingBatch(true)
    for (const id of selectedIds) {
      try {
        await fetch(`/api/telecom/${id}`, {
          method: 'DELETE',
          headers: { 'X-Admin-Secret': adminSecret },
        })
      } catch {}
    }
    setForfaits(prev => prev.filter(f => !selectedIds.includes(f.id)))
    setSelectedIds([])
    setLoadingBatch(false)
  }

  function field(k: keyof typeof form, label: string, type = 'text', placeholder = '') {
    const val = form[k]
    return (
      <div className="admin-form-field">
        <label>{label}</label>
        <input
          type={type}
          value={val ?? ''}
          placeholder={placeholder}
          onChange={e => setForm(p => ({
            ...p,
            [k]: type === 'number' ? num(e.target.value) : e.target.value,
          }))}
        />
      </div>
    )
  }

  const grouped = OPERATEURS.reduce<Record<string, Forfait[]>>((acc, op) => {
    acc[op] = forfaits.filter(f => f.operateur === op)
    return acc
  }, {})
  const autres = forfaits.filter(f => !OPERATEURS.includes(f.operateur))
  if (autres.length) grouped['Autre'] = (grouped['Autre'] || []).concat(autres)

  const batchActions: BatchActionConfig[] = [
    {
      key: 'desactiver',
      label: 'Désactiver / Supprimer les forfaits',
      icon: '🗑️',
      color: 'red',
      confirmMsg: 'Désactiver tous les forfaits sélectionnés ?',
      onClick: handleBatchDeactivate,
    },
  ]

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <button className="admin-action-btn" onClick={openCreate}>+ Nouveau forfait</button>
      </div>

      <BatchActionBar
        selectedCount={selectedIds.length}
        totalCount={forfaits.length}
        allSelected={allSelected}
        onToggleSelectAll={toggleSelectAll}
        onClearSelection={() => setSelectedIds([])}
        actions={batchActions}
        loading={loadingBatch}
        itemLabel="forfait(s)"
      />

      {OPERATEURS.filter(op => grouped[op]?.length).map(op => (
        <section key={op} style={{ marginBottom: 32 }}>
          <h2 className="admin-section-titre">{op} <span className="admin-page-count">{grouped[op].length}</span></h2>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 40, textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      style={{ width: 16, height: 16, accentColor: '#3b82f6', cursor: 'pointer' }}
                    />
                  </th>
                  <th>Nom</th>
                  <th>Type</th>
                  <th>Data</th>
                  <th>Min</th>
                  <th>Validité</th>
                  <th>Prix</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {grouped[op].map(f => {
                  const isSel = selectedIds.includes(f.id)
                  return (
                    <tr key={f.id} style={{ background: isSel ? '#eff6ff' : 'transparent' }}>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isSel}
                          onChange={() => toggleSelect(f.id)}
                          style={{ width: 16, height: 16, accentColor: '#3b82f6', cursor: 'pointer' }}
                        />
                      </td>
                      <td><strong>{f.nom}</strong></td>
                      <td><span className={`admin-badge admin-badge--${f.type}`}>{f.type}</span></td>
                      <td>{f.data_mo != null ? `${f.data_mo >= 1024 ? `${(f.data_mo/1024).toFixed(0)} Go` : `${f.data_mo} Mo`}` : '—'}</td>
                      <td>{f.minutes != null ? `${f.minutes} min` : '—'}</td>
                      <td>{f.validite_jours != null ? `${f.validite_jours}j` : '—'}</td>
                      <td><strong>{f.prix.toLocaleString('fr-SN')} FCFA</strong></td>
                      <td>
                        <button className="admin-btn-edit" onClick={() => openEdit(f)}>Modifier</button>
                        <button className="admin-btn-reject" onClick={() => deactivate(f.id)}>Désactiver</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      {forfaits.length === 0 && (
        <p style={{ color: '#888' }}>Aucun forfait actif. Créez le premier ci-dessus.</p>
      )}

      {modal !== null && (
        <div className="admin-modal-backdrop" onClick={() => setModal(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <h2 className="admin-modal-titre">
              {modal === 'create' ? 'Nouveau forfait' : `Modifier — ${(modal as Forfait).nom}`}
            </h2>

            <div className="admin-form-field">
              <label>Opérateur</label>
              <select value={form.operateur} onChange={e => setForm(p => ({ ...p, operateur: e.target.value }))}>
                {OPERATEURS.map(op => <option key={op}>{op}</option>)}
              </select>
            </div>

            {field('nom', 'Nom du forfait', 'text', 'Ex: Yakar 1Go 30j')}

            <div className="admin-form-field">
              <label>Type</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            <div className="admin-form-row">
              {field('prix', 'Prix (FCFA)', 'number', '500')}
              {field('validite_jours', 'Validité (jours)', 'number', '30')}
            </div>
            <div className="admin-form-row">
              {field('data_mo', 'Data (Mo)', 'number', '1024')}
              {field('minutes', 'Minutes', 'number', '60')}
              {field('sms', 'SMS', 'number', '100')}
            </div>

            <div className="admin-form-field">
              <label>Description (optionnel)</label>
              <textarea
                rows={2}
                value={form.description ?? ''}
                onChange={e => setForm(p => ({ ...p, description: e.target.value || null }))}
                placeholder="Détails supplémentaires…"
              />
            </div>

            {err && <p className="admin-form-error">{err}</p>}

            <div className="admin-modal-actions">
              <button className="admin-btn-cancel" onClick={() => setModal(null)}>Annuler</button>
              <button className="admin-action-btn" onClick={save} disabled={saving}>
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
