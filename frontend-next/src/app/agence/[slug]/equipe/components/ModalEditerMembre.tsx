'use client'

import React, { useState } from 'react'
import { X, Save, AlertCircle } from 'lucide-react'
import { getImmoAuthHeaders } from '@/lib/immo-auth'

export interface MembreItem {
  id: string
  utilisateur_id: string
  role: string
  actif: boolean
  date_entree: string
  utilisateur_nom: string
  utilisateur_prenom?: string
  utilisateur_email: string
  utilisateur_tel?: string
  permissions?: {
    cabinet?: string
    specialite?: string
    partage_taux_commission?: number
    telephone?: string
    email?: string
  }
}

interface ModalEditerMembreProps {
  slug: string
  membre: MembreItem
  onClose: () => void
  onSuccess: (msg: string) => void
}

export default function ModalEditerMembre({
  slug,
  membre,
  onClose,
  onSuccess,
}: ModalEditerMembreProps) {
  const perms = membre.permissions || {}
  const [form, setForm] = useState({
    nom: membre.utilisateur_nom || '',
    prenom: membre.utilisateur_prenom || '',
    telephone: membre.utilisateur_tel || perms.telephone || '',
    email: membre.utilisateur_email || perms.email || '',
    role: membre.role || 'courtier',
    cabinet: perms.cabinet || '',
    specialite: perms.specialite || '',
    commission_taux: String(perms.partage_taux_commission ?? (membre.role === 'courtier' ? 15 : 0)),
    actif: membre.actif !== false,
  })

  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const isCourtier = form.role === 'courtier'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg(null)

    if (!form.nom.trim()) {
      setErrorMsg('Veuillez renseigner le nom.')
      return
    }

    try {
      setSaving(true)

      const payload = {
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
        telephone: form.telephone.trim(),
        email: form.email.trim(),
        role: form.role,
        actif: form.actif,
        cabinet: form.cabinet.trim(),
        specialite: form.specialite.trim(),
        commission_taux: parseFloat(form.commission_taux) || 0,
      }

      const res = await fetch(`/api/agences/${slug}/membres/${membre.id}`, {
        method: 'PUT',
        headers: getImmoAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors de la mise à jour')
      }

      onSuccess(data.message || 'Membre mis à jour avec succès.')
      onClose()
    } catch (err: any) {
      console.error('[EDIT_MEMBRE_ERR]', err)
      setErrorMsg(err.message || 'Impossible de mettre à jour le membre')
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
              Modifier le Profil de {membre.utilisateur_prenom || ''} {membre.utilisateur_nom}
            </h3>
            <p style={{ fontSize: 12.5, color: '#64748B', margin: '4px 0 0' }}>
              Mise à jour des coordonnées, rôle, cabinet et commission.
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
              <label className="form-label">Nom de famille *</label>
              <input
                type="text"
                required
                value={form.nom}
                onChange={e => setForm({ ...form, nom: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Prénom</label>
              <input
                type="text"
                value={form.prenom}
                onChange={e => setForm({ ...form, prenom: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Téléphone</label>
              <input
                type="text"
                value={form.telephone}
                onChange={e => setForm({ ...form, telephone: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Rôle / Privilèges *</label>
              <select
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
                className="form-select"
              >
                <option value="courtier">Courtier / Apporteur d'Affaires</option>
                <option value="agent">Agent Immobilier</option>
                <option value="gestionnaire_locatif">Gestionnaire Locatif</option>
                <option value="commercial">Commercial</option>
                <option value="directeur">Directeur Adjoint</option>
              </select>
            </div>
          </div>

          {isCourtier && (
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Cabinet / Banque partenaire</label>
                <input
                  type="text"
                  placeholder="Ex: Teranga Courtage"
                  value={form.cabinet}
                  onChange={e => setForm({ ...form, cabinet: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Partage commission (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={form.commission_taux}
                  onChange={e => setForm({ ...form, commission_taux: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>
          )}

          {isCourtier && (
            <div className="form-group">
              <label className="form-label">Spécialité &amp; Domaine d'intervention</label>
              <input
                type="text"
                placeholder="Ex: Financement immobilier & crédit bancaire"
                value={form.specialite}
                onChange={e => setForm({ ...form, specialite: e.target.value })}
                className="form-input"
              />
            </div>
          )}

          <div className="form-group" style={{ marginTop: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13.5, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
              <input
                type="checkbox"
                checked={form.actif}
                onChange={e => setForm({ ...form, actif: e.target.checked })}
                style={{ width: 16, height: 16 }}
              />
              <span>Compte actif au sein de l'agence</span>
            </label>
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
              <span>{saving ? 'Enregistrement...' : 'Enregistrer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
