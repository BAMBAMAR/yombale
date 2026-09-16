'use client'

import React, { useState } from 'react'
import { X, Save, AlertCircle } from 'lucide-react'
import { getImmoAuthHeaders } from '@/lib/immo-auth'

interface LoyerItem {
  id: string
  periode: string
  date_echeance: string
  montant_du: number
  montant_paye: number
  montant_restant: number
  statut: string
  mode_paiement?: string
  reference_paiement?: string
  date_paiement?: string
  notes?: string
  bien_titre: string
  locataire_nom: string
  locataire_prenom?: string
  locataire_tel?: string
}

interface ModalEditerQuittanceImmoProps {
  slug: string
  loyer: LoyerItem
  onClose: () => void
  onSuccess: (msg: string) => void
}

export default function ModalEditerQuittanceImmo({
  slug,
  loyer,
  onClose,
  onSuccess,
}: ModalEditerQuittanceImmoProps) {
  const [form, setForm] = useState({
    montant_du: String(loyer.montant_du || ''),
    montant_paye: String(loyer.montant_paye || ''),
    statut: loyer.statut || 'paye',
    date_paiement: loyer.date_paiement ? loyer.date_paiement.slice(0, 10) : new Date().toISOString().slice(0, 10),
    mode_paiement: loyer.mode_paiement || 'wave',
    reference_paiement: loyer.reference_paiement || '',
    notes: loyer.notes || '',
  })

  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const du = parseFloat(form.montant_du) || 0
  const paye = parseFloat(form.montant_paye) || 0
  const restant = Math.max(0, du - paye)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg(null)

    if (du <= 0) {
      setErrorMsg('Le montant exigible doit être supérieur à 0.')
      return
    }

    try {
      setSaving(true)
      const headers = getImmoAuthHeaders({
        'Content-Type': 'application/json',
      })

      const res = await fetch(`/api/locatif-immo/agence/${slug}/loyers/${loyer.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          montant_du: du,
          montant_paye: paye,
          statut: form.statut,
          date_paiement: paye > 0 ? form.date_paiement : null,
          mode_paiement: form.mode_paiement,
          reference_paiement: form.reference_paiement || null,
          notes: form.notes || null,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors de la modification de la quittance')
      }

      onSuccess(`Quittance et terme de loyer ${loyer.periode} mis à jour avec succès.`)
      onClose()
    } catch (err: any) {
      console.error('[EDIT_QUITTANCE_ERR]', err)
      setErrorMsg(err.message || 'Impossible de mettre à jour la quittance')
    } finally {
      setSaving(false)
    }
  }

  const locataireNomComplet = `${loyer.locataire_prenom || ''} ${loyer.locataire_nom}`.trim()

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
          maxWidth: 540,
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: 24,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
              Modifier la Quittance &amp; Loyer ({loyer.periode})
            </h3>
            <p style={{ fontSize: 12.5, color: '#64748B', margin: '4px 0 0' }}>
              Locataire : <strong style={{ color: 'var(--navy, #1C2B4A)' }}>{locataireNomComplet}</strong> • {loyer.bien_titre}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}
          >
            <X size={20} />
          </button>
        </div>

        {errorMsg && (
          <div
            style={{
              padding: '10px 14px',
              background: '#FEE2E2',
              color: '#991B1B',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 650,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 16,
            }}
          >
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Montant exigible / dû (FCFA) *</label>
              <input
                type="number"
                required
                min="0"
                value={form.montant_du}
                onChange={e => setForm({ ...form, montant_du: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Montant encaissé (FCFA) *</label>
              <input
                type="number"
                min="0"
                value={form.montant_paye}
                onChange={e => {
                  const val = parseFloat(e.target.value) || 0
                  const newStatut = val >= du ? 'paye' : (val > 0 ? 'partiel' : 'en_attente')
                  setForm({ ...form, montant_paye: e.target.value, statut: newStatut })
                }}
                className="form-input"
              />
            </div>
          </div>

          <div
            style={{
              padding: '10px 14px',
              background: restant === 0 ? '#ECFDF5' : '#FEF3C7',
              border: `1px solid ${restant === 0 ? '#A7F3D0' : '#FDE68A'}`,
              borderRadius: 8,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
              fontSize: 13,
              fontWeight: 700,
              color: restant === 0 ? '#065F46' : '#92400E',
            }}
          >
            <span>Solde restant dû :</span>
            <span style={{ fontSize: 15, fontWeight: 900 }}>
              {Math.round(restant).toLocaleString('fr-FR')} FCFA
            </span>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Statut du terme *</label>
              <select
                value={form.statut}
                onChange={e => setForm({ ...form, statut: e.target.value })}
                className="form-select"
              >
                <option value="paye">Intégralement Payé</option>
                <option value="partiel">Acompte / Paiement Partiel</option>
                <option value="en_attente">En attente</option>
                <option value="retard">En retard / Impayé</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Mode d'encaissement</label>
              <select
                value={form.mode_paiement}
                onChange={e => setForm({ ...form, mode_paiement: e.target.value })}
                className="form-select"
              >
                <option value="wave">Wave</option>
                <option value="orange_money">Orange Money</option>
                <option value="virement">Virement Bancaire</option>
                <option value="cheque">Chèque</option>
                <option value="especes">Espèces</option>
              </select>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Date de valeur / encaissement</label>
              <input
                type="date"
                value={form.date_paiement}
                onChange={e => setForm({ ...form, date_paiement: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Référence transaction / reçu</label>
              <input
                type="text"
                placeholder="Ex: WAVE-98724219"
                value={form.reference_paiement}
                onChange={e => setForm({ ...form, reference_paiement: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notes de gestion interne</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              className="form-textarea"
              placeholder="Ex: Acompte versé en espèces au bureau..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <button
              type="button"
              onClick={onClose}
              className="agence-btn-secondary"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="agence-btn-primary"
            >
              <Save size={15} />
              <span>{saving ? 'Enregistrement...' : 'Enregistrer la quittance'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
