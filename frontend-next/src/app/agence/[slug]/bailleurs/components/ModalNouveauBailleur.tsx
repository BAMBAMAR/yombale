'use client'

import React, { useState } from 'react'
import { X, Plus, AlertCircle } from 'lucide-react'
import { getImmoAuthHeaders } from '@/lib/immo-auth'

interface ModalNouveauBailleurProps {
  slug: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ModalNouveauBailleur({
  slug,
  isOpen,
  onClose,
  onSuccess,
}: ModalNouveauBailleurProps) {
  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    whatsapp: '',
    email: '',
    type_bailleur: 'particulier',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  async function handleCreerBailleur(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nom.trim()) {
      setError('Le nom du propriétaire est obligatoire.')
      return
    }

    try {
      setSaving(true)
      setError(null)
      const res = await fetch(`/api/crm-immo/agence/${slug}/proprietaires`, {
        method: 'POST',
        headers: getImmoAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors de la création du propriétaire.')
      }
      setForm({ nom: '', prenom: '', telephone: '', whatsapp: '', email: '', type_bailleur: 'particulier' })
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
          maxWidth: 460,
          width: '100%',
          padding: 24,
          boxShadow: '0 20px 40px rgba(0,0,0,0.18)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
            Ajouter un propriétaire / bailleur
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

        <form onSubmit={handleCreerBailleur}>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Nom *</label>
              <input
                type="text"
                required
                placeholder="Sarr"
                value={form.nom}
                onChange={e => setForm({ ...form, nom: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Prénom</label>
              <input
                type="text"
                placeholder="Fatou"
                value={form.prenom}
                onChange={e => setForm({ ...form, prenom: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Téléphone / WhatsApp</label>
            <input
              type="tel"
              placeholder="+221 77 000 00 00"
              value={form.telephone}
              onChange={e => setForm({ ...form, telephone: e.target.value, whatsapp: e.target.value })}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              placeholder="bailleur@exemple.sn"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
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
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
