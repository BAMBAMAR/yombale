'use client'

import React, { useState, useEffect } from 'react'
import { Wrench } from 'lucide-react'
import { getImmoAuthHeaders } from '@/lib/immo-auth'
import { showToast } from '@/context/ToastContext'

export interface BienOption {
  id: string
  titre: string
  quartier?: string
  ville: string
}

interface ModalNouveauTicketProps {
  slug: string
  isOpen: boolean
  biens: BienOption[]
  onClose: () => void
  onSuccess: () => void
}

export default function ModalNouveauTicket({
  slug,
  isOpen,
  biens,
  onClose,
  onSuccess,
}: ModalNouveauTicketProps) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    bien_id: '',
    type: 'plomberie',
    description: '',
    priorite: 'normale',
    demandeur: 'locataire',
    technicien: '',
    cout_estime: '',
    a_charge_de: 'proprietaire',
  })

  useEffect(() => {
    if (biens.length > 0 && !form.bien_id) {
      setForm((prev) => ({ ...prev, bien_id: biens[0].id }))
    }
  }, [biens])

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.bien_id || !form.description.trim()) return

    try {
      setSaving(true)
      const res = await fetch(`/api/locatif-immo/agence/${slug}/maintenance`, {
        method: 'POST',
        headers: getImmoAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) {
        setForm({
          bien_id: biens[0]?.id || '',
          type: 'plomberie',
          description: '',
          priorite: 'normale',
          demandeur: 'locataire',
          technicien: '',
          cout_estime: '',
          a_charge_de: 'proprietaire',
        })
        showToast('Ticket de maintenance créé avec succès !', 'success', 'Maintenance')
        onSuccess()
      } else {
        showToast(data.error || 'Erreur lors de la création du ticket.', 'error', 'Maintenance')
      }
    } catch (err) {
      console.error('[CREATE_TICKET_ERR]', err)
      showToast('Erreur réseau lors de la création du ticket.', 'error', 'Réseau')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(28, 43, 74, 0.5)',
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
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Wrench size={20} color="var(--accent, #C75B00)" />
            <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
              Signaler un incident / Travaux
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: 20, color: '#94A3B8', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Bien concerné *</label>
            <select
              required
              value={form.bien_id}
              onChange={(e) => setForm({ ...form, bien_id: e.target.value })}
              className="form-select"
            >
              {biens.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.titre} ({b.quartier ? `${b.quartier}, ${b.ville}` : b.ville})
                </option>
              ))}
            </select>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Type d'incident</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="form-select"
              >
                <option value="plomberie">Plomberie & Fuites</option>
                <option value="electricite">Électricité & Disjoncteur</option>
                <option value="climatisation">Climatisation</option>
                <option value="peinture">Peinture & Murs</option>
                <option value="serrurerie">Serrurerie & Portes</option>
                <option value="autre">Autre incident</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priorité</label>
              <select
                value={form.priorite}
                onChange={(e) => setForm({ ...form, priorite: e.target.value })}
                className="form-select"
              >
                <option value="basse">Basse</option>
                <option value="normale">Normale</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description du problème *</label>
            <textarea
              required
              rows={3}
              placeholder="Ex: Fuite d'eau sous l'évier de la cuisine nécessitant le remplacement d'un joint..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="form-textarea"
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Prise en charge</label>
              <select
                value={form.a_charge_de}
                onChange={(e) => setForm({ ...form, a_charge_de: e.target.value })}
                className="form-select"
              >
                <option value="proprietaire">Propriétaire (Bailleur)</option>
                <option value="locataire">Locataire (Entretien courant)</option>
                <option value="agence">Agence (Garantie)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Coût estimé (FCFA)</label>
              <input
                type="number"
                placeholder="25000"
                value={form.cout_estime}
                onChange={(e) => setForm({ ...form, cout_estime: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Prestataire / Artisan assigné (Optionnel)</label>
            <input
              type="text"
              placeholder="Ex: Babacar Plombier (+221 77 ...)"
              value={form.technicien}
              onChange={(e) => setForm({ ...form, technicien: e.target.value })}
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
              style={{
                padding: '9px 18px',
                borderRadius: 8,
                background: 'var(--accent, #C75B00)',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'Enregistrement...' : 'Enregistrer le ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
