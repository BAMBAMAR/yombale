'use client'

import React, { useState } from 'react'
import { X, Save, AlertCircle } from 'lucide-react'
import { getImmoAuthHeaders } from '@/lib/immo-auth'

interface FactureItem {
  id: string
  numero_facture: string
  type_facture: string
  client_nom: string
  client_tel?: string
  client_email?: string
  bien_titre?: string
  bien_id?: string
  montant_ht: number
  taux_tva: number
  montant_tva: number
  timbre_fiscal: number
  montant_ttc: number
  statut: string
  date_emission: string
  date_echeance?: string
  mode_paiement?: string
  notes?: string
}

interface BienOption {
  id: string
  titre: string
}

interface ModalEditerFactureImmoProps {
  slug: string
  facture: FactureItem
  biens: BienOption[]
  onClose: () => void
  onSuccess: (msg: string) => void
}

export default function ModalEditerFactureImmo({
  slug,
  facture,
  biens,
  onClose,
  onSuccess,
}: ModalEditerFactureImmoProps) {
  const [form, setForm] = useState({
    client_nom: facture.client_nom || '',
    client_tel: facture.client_tel || '',
    client_email: facture.client_email || '',
    type_facture: facture.type_facture || 'honoraires_vente',
    bien_id: facture.bien_id || '',
    montant_ht: String(facture.montant_ht || ''),
    taux_tva: String(facture.taux_tva || 18),
    timbre_fiscal: String(facture.timbre_fiscal || 100),
    date_echeance: facture.date_echeance ? facture.date_echeance.slice(0, 10) : '',
    mode_paiement: facture.mode_paiement || 'wave',
    statut: facture.statut || 'en_attente',
    notes: facture.notes || '',
  })

  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const ht = parseFloat(form.montant_ht) || 0
  const tvaPct = parseFloat(form.taux_tva) || 0
  const tva = (ht * tvaPct) / 100
  const timbre = parseFloat(form.timbre_fiscal) || 0
  const ttc = ht + tva + timbre

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg(null)

    if (!form.client_nom.trim() || ht <= 0) {
      setErrorMsg('Veuillez renseigner le nom du client et un montant HT valide.')
      return
    }

    try {
      setSaving(true)

      const res = await fetch(`/api/factures-immo/agence/${slug}/${facture.id}`, {
        method: 'PUT',
        headers: getImmoAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          ...form,
          montant_ht: ht,
          taux_tva: tvaPct,
          timbre_fiscal: timbre,
          bien_id: form.bien_id || 'null',
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors de la mise à jour de la facture')
      }

      onSuccess(`Facture ${facture.numero_facture} mise à jour avec succès.`)
      onClose()
    } catch (err: any) {
      console.error('[EDIT_FACTURE_ERR]', err)
      setErrorMsg(err.message || 'Impossible de modifier la facture')
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
          maxWidth: 620,
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
              Modifier la Facture {facture.numero_facture}
            </h3>
            <p style={{ fontSize: 12.5, color: '#64748B', margin: '4px 0 0' }}>
              Ajustez les coordonnées client, la prestation, les montants ou le statut d'encaissement.
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
              <label className="form-label">Client / Mandant facturé *</label>
              <input
                type="text"
                required
                value={form.client_nom}
                onChange={e => setForm({ ...form, client_nom: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Téléphone client</label>
              <input
                type="text"
                value={form.client_tel}
                onChange={e => setForm({ ...form, client_tel: e.target.value })}
                className="form-input"
                placeholder="+221 77 000 00 00"
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Email client</label>
              <input
                type="email"
                value={form.client_email}
                onChange={e => setForm({ ...form, client_email: e.target.value })}
                className="form-input"
                placeholder="client@domaine.sn"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Type de prestation *</label>
              <select
                value={form.type_facture}
                onChange={e => setForm({ ...form, type_facture: e.target.value })}
                className="form-select"
              >
                <option value="honoraires_vente">Honoraires de Vente / Transaction</option>
                <option value="gestion_locative">Honoraires de Gestion Locative</option>
                <option value="honoraires_location">Rédaction de Bail &amp; Entrée</option>
                <option value="debours_travaux">Débours Travaux &amp; Réparations</option>
                <option value="expertise">Expertise &amp; Avis de Valeur</option>
              </select>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Bien immobilier rattaché</label>
              <select
                value={form.bien_id}
                onChange={e => setForm({ ...form, bien_id: e.target.value })}
                className="form-select"
              >
                <option value="">-- Aucun (Prestation générale) --</option>
                {biens.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.titre}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Statut du règlement *</label>
              <select
                value={form.statut}
                onChange={e => setForm({ ...form, statut: e.target.value })}
                className="form-select"
              >
                <option value="en_attente">En attente de paiement</option>
                <option value="payee">Payée / Réglée</option>
                <option value="annulee">Annulée</option>
              </select>
            </div>
          </div>

          <div className="form-grid-3" style={{ background: '#FAF8F5', padding: 12, borderRadius: 10, marginBottom: 16 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Montant H.T. (FCFA) *</label>
              <input
                type="number"
                required
                min="0"
                value={form.montant_ht}
                onChange={e => setForm({ ...form, montant_ht: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">TVA (%)</label>
              <select
                value={form.taux_tva}
                onChange={e => setForm({ ...form, taux_tva: e.target.value })}
                className="form-select"
              >
                <option value="0">0% (Exonéré)</option>
                <option value="18">18% (Taux normal)</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Timbre fiscal (FCFA)</label>
              <input
                type="number"
                min="0"
                value={form.timbre_fiscal}
                onChange={e => setForm({ ...form, timbre_fiscal: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <div
            style={{
              padding: '12px 16px',
              background: '#ECFDF5',
              border: '1px solid #A7F3D0',
              borderRadius: 8,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: '#065F46' }}>Total Net à Payer (TTC) :</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#0A5C36' }}>
              {Math.round(ttc).toLocaleString('fr-FR')} FCFA
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Mode de règlement</label>
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
            <div className="form-group">
              <label className="form-label">Échéance limite</label>
              <input
                type="date"
                value={form.date_echeance}
                onChange={e => setForm({ ...form, date_echeance: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notes &amp; Modalités particulières</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              className="form-textarea"
              placeholder="Ex: Facturation sur transaction réf #TR-2026..."
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
              <span>{saving ? 'Enregistrement...' : 'Enregistrer les modifications'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
