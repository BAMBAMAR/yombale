'use client'

import React, { useState } from 'react'
import { CreditCard, X, Check } from 'lucide-react'

interface BienOption {
  id: string
  titre: string
}

interface ModalCreerCreditProps {
  slug: string
  biens: BienOption[]
  onClose: () => void
  onSuccess: () => void
}

export function ModalCreerCredit({ slug, biens, onClose, onSuccess }: ModalCreerCreditProps) {
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [form, setForm] = useState({
    type_credit: 'caution_echelonnee',
    beneficiaire_nom: '',
    beneficiaire_tel: '',
    bien_id: biens[0]?.id || '',
    montant_total: '',
    apport_initial: '',
    nb_echeances: '3',
    frequence: 'mensuel',
    date_premiere_echeance: new Date().toISOString().split('T')[0],
    notes: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.beneficiaire_nom.trim() || !form.montant_total) return

    try {
      setSaving(true)
      setErrorMsg(null)
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

      const res = await fetch(`/api/credits-immo/agence/${slug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          ...form,
          montant_total: parseFloat(form.montant_total),
          apport_initial: form.apport_initial ? parseFloat(form.apport_initial) : 0,
          nb_echeances: parseInt(form.nb_echeances, 10),
          bien_id: form.bien_id || null,
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        onSuccess()
      } else {
        setErrorMsg(data.error || 'Erreur lors de la création du plan')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur réseau')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(3px)',
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
          maxWidth: 500,
          width: '100%',
          padding: 24,
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CreditCard size={20} color="var(--accent, #C75B00)" />
            <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
              Nouveau plan d&apos;échelonnement
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {errorMsg && (
          <div style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, color: '#dc2626', fontSize: 13, marginBottom: 14 }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label" style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 4 }}>
              Type d&apos;échelonnement *
            </label>
            <select
              value={form.type_credit}
              onChange={e => setForm({ ...form, type_credit: e.target.value })}
              className="form-select"
              style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
            >
              <option value="caution_echelonnee">Caution / Dépôt de garantie en 2x/3x/4x</option>
              <option value="frais_agence">Frais d&apos;agence & Honoraires étalés</option>
              <option value="terrain_vefa">Vente Terrain / Acquisition VEFA en tranches</option>
              <option value="avance_bailleur">Avance sur loyers consentie au bailleur</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 4 }}>Bénéficiaire *</label>
              <input
                type="text"
                required
                placeholder="Ex: Ousmane Seck"
                value={form.beneficiaire_nom}
                onChange={e => setForm({ ...form, beneficiaire_nom: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 4 }}>Téléphone</label>
              <input
                type="tel"
                placeholder="+221 77 000 00 00"
                value={form.beneficiaire_tel}
                onChange={e => setForm({ ...form, beneficiaire_tel: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 4 }}>Montant financé (FCFA) *</label>
              <input
                type="number"
                required
                placeholder="300000"
                value={form.montant_total}
                onChange={e => setForm({ ...form, montant_total: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 4 }}>Apport initial (FCFA)</label>
              <input
                type="number"
                placeholder="100000"
                value={form.apport_initial}
                onChange={e => setForm({ ...form, apport_initial: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 4 }}>Nombre d&apos;échéances</label>
              <select
                value={form.nb_echeances}
                onChange={e => setForm({ ...form, nb_echeances: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
              >
                <option value="2">2 mensualités</option>
                <option value="3">3 mensualités</option>
                <option value="4">4 mensualités</option>
                <option value="6">6 mensualités</option>
                <option value="12">12 mensualités (VEFA / Terrain)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 4 }}>Date 1ère échéance</label>
              <input
                type="date"
                value={form.date_premiere_echeance}
                onChange={e => setForm({ ...form, date_premiere_echeance: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
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
              <Check size={16} />
              <span>{saving ? 'Création...' : 'Valider le plan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
