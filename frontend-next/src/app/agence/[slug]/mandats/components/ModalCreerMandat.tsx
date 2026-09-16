'use client'

import React, { useState, useEffect } from 'react'
import { X, Check, FileSignature } from 'lucide-react'
import { getImmoAuthHeaders } from '@/lib/immo-auth'

interface BienOption {
  id: string
  titre: string
  quartier?: string
  prix_location?: number
  prix_vente?: number
}

interface ProprietaireOption {
  id: string
  nom: string
  telephone?: string
}

interface ModalCreerMandatProps {
  slug: string
  biens: BienOption[]
  proprietaires: ProprietaireOption[]
  onClose: () => void
  onSuccess: () => void
}

export function ModalCreerMandat({
  slug,
  biens,
  proprietaires,
  onClose,
  onSuccess,
}: ModalCreerMandatProps) {
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [form, setForm] = useState({
    bien_id: biens[0]?.id || '',
    proprietaire_id: proprietaires[0]?.id || '',
    type_mandat: 'simple',
    type_operation: 'vente',
    date_debut: new Date().toISOString().split('T')[0],
    duree_mois: '12',
    taux_commission: '5',
    montant_commission_fixe: '',
    conditions: '',
  })

  // Pré-sélectionner automatiquement le propriétaire si le premier bien est choisi
  useEffect(() => {
    if (biens.length > 0 && !form.bien_id) {
      setForm(prev => ({ ...prev, bien_id: biens[0].id }))
    }
    if (proprietaires.length > 0 && !form.proprietaire_id) {
      setForm(prev => ({ ...prev, proprietaire_id: proprietaires[0].id }))
    }
  }, [biens, proprietaires])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.bien_id || !form.proprietaire_id) {
      setErrorMsg('Veuillez sélectionner un bien et un propriétaire.')
      return
    }

    try {
      setSaving(true)
      setErrorMsg(null)

      const res = await fetch(`/api/mandats-immo/agence/${slug}`, {
        method: 'POST',
        headers: getImmoAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          bien_id: form.bien_id,
          proprietaire_id: form.proprietaire_id,
          type_mandat: form.type_mandat,
          type_operation: form.type_operation,
          date_debut: form.date_debut,
          duree_mois: Number(form.duree_mois) || 12,
          taux_commission: form.taux_commission ? Number(form.taux_commission) : null,
          montant_commission_fixe: form.montant_commission_fixe ? Number(form.montant_commission_fixe) : null,
          conditions: form.conditions.trim() || null,
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        onSuccess()
      } else {
        setErrorMsg(data.error || 'Erreur lors de la création du mandat.')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur de connexion.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="immo-modal-backdrop">
      <div className="immo-modal-card" style={{ maxWidth: 560 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileSignature size={20} color="var(--accent, #C75B00)" />
            <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: 'var(--navy, #1C2B4A)' }}>
              Nouveau Mandat Immobilier
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
              Bien Immobilier Concerné *
            </label>
            <select
              value={form.bien_id}
              onChange={e => setForm({ ...form, bien_id: e.target.value })}
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

          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 4, color: '#334155' }}>
              Propriétaire Mandant *
            </label>
            <select
              value={form.proprietaire_id}
              onChange={e => setForm({ ...form, proprietaire_id: e.target.value })}
              required
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13.5 }}
            >
              {proprietaires.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nom} {p.telephone ? `(${p.telephone})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 4, color: '#334155' }}>
                Type de Mandat
              </label>
              <select
                value={form.type_mandat}
                onChange={e => setForm({ ...form, type_mandat: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13.5 }}
              >
                <option value="simple">Mandat Simple</option>
                <option value="exclusif">Mandat Exclusif ⭐</option>
                <option value="co_exclusif">Mandat Co-exclusif</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 4, color: '#334155' }}>
                Opération
              </label>
              <select
                value={form.type_operation}
                onChange={e => setForm({ ...form, type_operation: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13.5 }}
              >
                <option value="vente">Vente</option>
                <option value="location">Location</option>
                <option value="gestion_locative">Gestion Locative</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 4, color: '#334155' }}>
                Date d&apos;effet
              </label>
              <input
                type="date"
                value={form.date_debut}
                onChange={e => setForm({ ...form, date_debut: e.target.value })}
                required
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13.5 }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 4, color: '#334155' }}>
                Durée (mois)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={form.duree_mois}
                onChange={e => setForm({ ...form, duree_mois: e.target.value })}
                required
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13.5 }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 4, color: '#334155' }}>
                Taux Commission (%)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="Ex: 5"
                value={form.taux_commission}
                onChange={e => setForm({ ...form, taux_commission: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13.5 }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 4, color: '#334155' }}>
                Ou Forfait Fixe (FCFA)
              </label>
              <input
                type="number"
                placeholder="Optionnel"
                value={form.montant_commission_fixe}
                onChange={e => setForm({ ...form, montant_commission_fixe: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13.5 }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 4, color: '#334155' }}>
              Clauses particulières & Conditions
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Clés remises à l'agence le 15/09, visites du lundi au samedi sur RDV..."
              value={form.conditions}
              onChange={e => setForm({ ...form, conditions: e.target.value })}
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
              <span>{saving ? 'Enregistrement…' : 'Créer le Mandat'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
