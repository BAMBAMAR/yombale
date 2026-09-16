'use client'

import React, { useState, useEffect } from 'react'
import { X, Save, CheckCircle2, AlertCircle } from 'lucide-react'
import { getImmoAuthHeaders } from '@/lib/immo-auth'

export interface BailleurEditData {
  id: string
  nom: string
  prenom?: string
  telephone?: string
  whatsapp?: string
  email?: string
  type_bailleur?: string
  adresse?: string
  iban?: string
  notes?: string
}

interface ModalEditerBailleurProps {
  slug: string
  bailleur: BailleurEditData | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ModalEditerBailleur({
  slug,
  bailleur,
  isOpen,
  onClose,
  onSuccess,
}: ModalEditerBailleurProps) {
  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    whatsapp: '',
    email: '',
    type_bailleur: 'particulier',
    adresse: '',
    iban: '',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (bailleur) {
      setForm({
        nom: bailleur.nom || '',
        prenom: bailleur.prenom || '',
        telephone: bailleur.telephone || '',
        whatsapp: bailleur.whatsapp || bailleur.telephone || '',
        email: bailleur.email || '',
        type_bailleur: bailleur.type_bailleur || 'particulier',
        adresse: bailleur.adresse || '',
        iban: bailleur.iban || '',
        notes: bailleur.notes || '',
      })
      setError(null)
      setSuccess(false)
    }
  }, [bailleur])

  if (!isOpen || !bailleur) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nom.trim()) {
      setError('Le nom du bailleur est obligatoire.')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const res = await fetch(`/api/crm-immo/agence/${slug}/proprietaires/${bailleur?.id}`, {
        method: 'PUT',
        headers: getImmoAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          nom: form.nom.trim(),
          prenom: form.prenom.trim() || null,
          telephone: form.telephone.trim() || null,
          whatsapp: form.whatsapp.trim() || form.telephone.trim() || null,
          email: form.email.trim() || null,
          type_bailleur: form.type_bailleur,
          adresse: form.adresse.trim() || null,
          iban: form.iban.trim() || null,
          notes: form.notes.trim() || null,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors de la modification du bailleur.')
      }

      setSuccess(true)
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 700)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
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
          maxWidth: 520,
          width: '100%',
          padding: 24,
          boxShadow: '0 20px 40px rgba(0,0,0,0.18)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
              Modifier le Propriétaire / Mandant
            </h2>
            <p style={{ margin: '3px 0 0', fontSize: 13, color: '#64748B' }}>
              Coordonnées, type de mandat et informations bancaires.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: 4,
            }}
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

        {success && (
          <div
            style={{
              padding: '10px 14px',
              background: '#DCFCE7',
              color: '#166534',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 14,
            }}
          >
            <CheckCircle2 size={16} />
            Bailleur mis à jour avec succès !
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                Nom / Raison Sociale *
              </label>
              <input
                type="text"
                required
                value={form.nom}
                onChange={e => setForm({ ...form, nom: e.target.value })}
                className="form-input"
                style={{ width: '100%', padding: '9px 12px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                Prénom
              </label>
              <input
                type="text"
                value={form.prenom}
                onChange={e => setForm({ ...form, prenom: e.target.value })}
                className="form-input"
                style={{ width: '100%', padding: '9px 12px' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                Téléphone principal
              </label>
              <input
                type="tel"
                value={form.telephone}
                onChange={e => setForm({ ...form, telephone: e.target.value })}
                className="form-input"
                style={{ width: '100%', padding: '9px 12px' }}
                placeholder="+221 77..."
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                WhatsApp
              </label>
              <input
                type="tel"
                value={form.whatsapp}
                onChange={e => setForm({ ...form, whatsapp: e.target.value })}
                className="form-input"
                style={{ width: '100%', padding: '9px 12px' }}
                placeholder="+221 77..."
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="form-input"
                style={{ width: '100%', padding: '9px 12px' }}
                placeholder="bailleur@email.com"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                Type de bailleur
              </label>
              <select
                value={form.type_bailleur}
                onChange={e => setForm({ ...form, type_bailleur: e.target.value })}
                className="form-select"
                style={{ width: '100%', padding: '9px 12px' }}
              >
                <option value="particulier">Particulier</option>
                <option value="societe">Société / SCI</option>
                <option value="institutionnel">Institutionnel</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
              Coordonnées bancaires (IBAN / RIB pour reversements)
            </label>
            <input
              type="text"
              value={form.iban}
              onChange={e => setForm({ ...form, iban: e.target.value })}
              className="form-input"
              style={{ width: '100%', padding: '9px 12px' }}
              placeholder="SN08 SN01..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
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
              disabled={loading}
              className="btn-npl"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '9px 18px',
                borderRadius: 8,
                background: 'var(--accent, #C75B00)',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              <Save size={16} />
              {loading ? 'Enregistrement...' : 'Mettre à jour'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
