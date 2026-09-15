'use client'

import React, { useState, useEffect } from 'react'
import { X, Check, Briefcase } from 'lucide-react'

interface BienOption {
  id: string
  titre: string
  prix_vente?: number
  prix_location?: number
  quartier?: string
}

interface ContactOption {
  id: string
  nom: string
  telephone?: string
}

interface ProprietaireOption {
  id: string
  nom: string
}

interface ModalCreerTransactionProps {
  slug: string
  biens: BienOption[]
  contacts: ContactOption[]
  proprietaires: ProprietaireOption[]
  onClose: () => void
  onSuccess: () => void
}

export function ModalCreerTransaction({
  slug,
  biens,
  contacts,
  proprietaires,
  onClose,
  onSuccess,
}: ModalCreerTransactionProps) {
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [form, setForm] = useState({
    bien_id: biens[0]?.id || '',
    type_transaction: 'vente',
    acheteur_id: contacts[0]?.id || '',
    vendeur_id: proprietaires[0]?.id || '',
    montant: '',
    date_transaction: new Date().toISOString().split('T')[0],
    notes: '',
  })

  // Auto-fill price when property is selected
  useEffect(() => {
    const chosen = biens.find(b => b.id === form.bien_id)
    if (chosen && !form.montant) {
      const p = chosen.prix_vente || chosen.prix_location
      if (p) setForm(prev => ({ ...prev, montant: String(p) }))
    }
  }, [form.bien_id, biens])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.bien_id || !form.montant) {
      setErrorMsg('Veuillez sélectionner un bien et saisir le montant.')
      return
    }

    try {
      setSaving(true)
      setErrorMsg(null)
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

      const res = await fetch(`/api/transactions-immo/agence/${slug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          bien_id: form.bien_id,
          type_transaction: form.type_transaction,
          acheteur_id: form.acheteur_id || null,
          vendeur_id: form.vendeur_id || null,
          montant: Number(form.montant),
          date_transaction: form.date_transaction,
          notes: form.notes.trim() || null,
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        onSuccess()
      } else {
        setErrorMsg(data.error || 'Erreur lors de la création de la transaction.')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur de connexion.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="immo-modal-backdrop">
      <div className="immo-modal-card" style={{ maxWidth: 540 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Briefcase size={20} color="var(--accent, #C75B00)" />
            <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: 'var(--navy, #1C2B4A)' }}>
              Nouvelle Transaction
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
          >
            <X size={18} />
          </button>
        </div>

        {errorMsg && (
          <div style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, color: '#dc2626', fontSize: 13, marginBottom: 14 }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 4, color: '#334155' }}>
              Bien Immobilier *
            </label>
            <select
              value={form.bien_id}
              onChange={e => {
                const bId = e.target.value
                const chosen = biens.find(b => b.id === bId)
                setForm({
                  ...form,
                  bien_id: bId,
                  montant: chosen?.prix_vente ? String(chosen.prix_vente) : form.montant,
                })
              }}
              required
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13.5 }}
            >
              {biens.map(b => (
                <option key={b.id} value={b.id}>
                  {b.titre} {b.quartier ? `(${b.quartier})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 4, color: '#334155' }}>
                Type de Transaction
              </label>
              <select
                value={form.type_transaction}
                onChange={e => setForm({ ...form, type_transaction: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13.5 }}
              >
                <option value="vente">Vente</option>
                <option value="location">Location</option>
                <option value="vefa">VEFA / Programme neuf</option>
                <option value="terrain">Terrain</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 4, color: '#334155' }}>
                Montant Accordé (FCFA) *
              </label>
              <input
                type="number"
                value={form.montant}
                onChange={e => setForm({ ...form, montant: e.target.value })}
                required
                placeholder="Ex: 85000000"
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13.5 }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 4, color: '#334155' }}>
                Aquéreur / Preneur (CRM)
              </label>
              <select
                value={form.acheteur_id}
                onChange={e => setForm({ ...form, acheteur_id: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13.5 }}
              >
                <option value="">Sélectionner un contact...</option>
                {contacts.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nom} {c.telephone ? `(${c.telephone})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 4, color: '#334155' }}>
                Vendeur / Propriétaire
              </label>
              <select
                value={form.vendeur_id}
                onChange={e => setForm({ ...form, vendeur_id: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13.5 }}
              >
                <option value="">Sélectionner un bailleur...</option>
                {proprietaires.map(p => (
                  <option key={p.id} value={p.id}>{p.nom}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 4, color: '#334155' }}>
              Notes, Notaire ou Conditions suspensives
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Étude Notaire Me Diop, condition de prêt bancaire BOA sous 45j..."
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13.5 }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
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
                border: 'none',
                background: 'var(--accent, #C75B00)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              <Check size={16} />
              <span>{saving ? 'Enregistrement…' : 'Créer la Transaction'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
