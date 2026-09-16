'use client'

import React, { useState } from 'react'
import { X, Plus, AlertCircle } from 'lucide-react'
import { getImmoAuthHeaders } from '@/lib/immo-auth'

export interface OptionItem {
  id: string
  titre?: string
  nom?: string
  prenom?: string
}

interface ModalProgrammerVisiteProps {
  slug: string
  isOpen: boolean
  biensOptions: OptionItem[]
  contactsOptions: OptionItem[]
  onClose: () => void
  onSuccess: () => void
}

export function ModalProgrammerVisite({
  slug,
  isOpen,
  biensOptions,
  contactsOptions,
  onClose,
  onSuccess,
}: ModalProgrammerVisiteProps) {
  const [form, setForm] = useState({
    bien_id: '',
    contact_id: '',
    date_visite: '',
    duree_min: '30',
    lieu_rdv: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  async function handleCreerVisite(e: React.FormEvent) {
    e.preventDefault()
    if (!form.bien_id || !form.contact_id || !form.date_visite) {
      setError('Veuillez renseigner le bien, le prospect et la date/heure.')
      return
    }

    try {
      setSaving(true)
      setError(null)
      const res = await fetch(`/api/crm-immo/agence/${slug}/visites`, {
        method: 'POST',
        headers: getImmoAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors de la programmation de la visite.')
      }

      setForm({ bien_id: '', contact_id: '', date_visite: '', duree_min: '30', lieu_rdv: '', notes: '' })
      onSuccess()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(28, 43, 74, 0.55)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 14,
          maxWidth: 480,
          width: '100%',
          padding: 24,
          boxShadow: '0 20px 40px rgba(0,0,0,0.18)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
            Programmer une visite
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 4 }}
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              background: '#FEE2E2',
              color: '#DC2626',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 14,
            }}
          >
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleCreerVisite}>
          <div className="form-group">
            <label className="form-label">Bien à visiter *</label>
            <select
              required
              value={form.bien_id}
              onChange={e => setForm({ ...form, bien_id: e.target.value })}
              className="form-select"
            >
              <option value="">Sélectionner un bien</option>
              {biensOptions.map(b => (
                <option key={b.id} value={b.id}>
                  {b.titre}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Prospect concerné *</label>
            <select
              required
              value={form.contact_id}
              onChange={e => setForm({ ...form, contact_id: e.target.value })}
              className="form-select"
            >
              <option value="">Sélectionner un prospect</option>
              {contactsOptions.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nom} {c.prenom || ''}
                </option>
              ))}
            </select>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Date & Heure *</label>
              <input
                type="datetime-local"
                required
                value={form.date_visite}
                onChange={e => setForm({ ...form, date_visite: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Durée estimée (min)</label>
              <input
                type="number"
                value={form.duree_min}
                onChange={e => setForm({ ...form, duree_min: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Lieu de rendez-vous</label>
            <input
              type="text"
              placeholder="Devant le bien / rond-point..."
              value={form.lieu_rdv}
              onChange={e => setForm({ ...form, lieu_rdv: e.target.value })}
              className="form-input"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 14px',
                borderRadius: 8,
                background: '#FAF8F5',
                border: '1px solid var(--border, #E8DDD2)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-npl"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 18px',
                borderRadius: 8,
                background: 'var(--accent, #C75B00)',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              <Plus size={16} />
              {saving ? 'Enregistrement...' : 'Confirmer la visite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
