'use client'

import React, { useState } from 'react'
import { X, CheckCircle2, AlertCircle, Plus } from 'lucide-react'
import { getImmoAuthHeaders } from '@/lib/immo-auth'

export interface BienOption {
  id: string
  titre: string
  prix_location?: number
  statut_occupation: string
}

interface ModalNouveauLocataireProps {
  slug: string
  isOpen: boolean
  biensDispo: BienOption[]
  onClose: () => void
  onSuccess: () => void
}

export function ModalNouveauLocataire({
  slug,
  isOpen,
  biensDispo,
  onClose,
  onSuccess,
}: ModalNouveauLocataireProps) {
  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    whatsapp: '',
    email: '',
    profession: '',
    bien_id: '',
    loyer_mensuel: '',
    charges: '0',
    depot_garantie: '',
    date_debut: new Date().toISOString().split('T')[0],
    duree_mois: '12',
    jour_echeance: '5',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  async function handleCreerLocataire(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nom.trim()) {
      setError('Le nom de famille est obligatoire.')
      return
    }

    try {
      setSaving(true)
      setError(null)

      // 1. Créer le contact locataire
      const resContact = await fetch(`/api/crm-immo/agence/${slug}/contacts`, {
        method: 'POST',
        headers: getImmoAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          nom: form.nom.trim(),
          prenom: form.prenom.trim() || null,
          telephone: form.telephone.trim() || null,
          whatsapp: (form.whatsapp || form.telephone).trim() || null,
          email: form.email.trim() || null,
          profession: form.profession.trim() || null,
          type_contact: 'locataire',
          statut_crm: 'gagne',
        }),
      })
      const dataContact = await resContact.json()

      if (!resContact.ok || !dataContact.success) {
        throw new Error(dataContact.error || 'Erreur lors de la création du contact locataire.')
      }

      // 2. Si un bien est sélectionné, créer le bail directement
      if (form.bien_id && form.loyer_mensuel) {
        await fetch(`/api/locatif-immo/agence/${slug}/baux`, {
          method: 'POST',
          headers: getImmoAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            bien_id: form.bien_id,
            locataire_id: dataContact.contact.id,
            date_debut: form.date_debut,
            duree_mois: parseInt(form.duree_mois, 10) || 12,
            loyer_mensuel: parseFloat(form.loyer_mensuel),
            charges: parseFloat(form.charges) || 0,
            depot_garantie: parseFloat(form.depot_garantie) || 0,
            jour_echeance: parseInt(form.jour_echeance, 10) || 5,
          }),
        })
      }

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
          maxWidth: 520,
          width: '100%',
          padding: 24,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 40px rgba(0,0,0,0.18)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
            Enregistrer un nouveau locataire
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

        <form onSubmit={handleCreerLocataire}>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Nom du locataire *</label>
              <input
                type="text"
                required
                placeholder="Diallo"
                value={form.nom}
                onChange={e => setForm({ ...form, nom: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Prénom</label>
              <input
                type="text"
                placeholder="Amadou"
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
                type="tel"
                placeholder="+221 77 000 00 00"
                value={form.telephone}
                onChange={e => setForm({ ...form, telephone: e.target.value, whatsapp: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Profession</label>
              <input
                type="text"
                placeholder="Cadre, Enseignant..."
                value={form.profession}
                onChange={e => setForm({ ...form, profession: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border, #E8DDD2)', paddingTop: 14, marginTop: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy, #1C2B4A)', marginBottom: 10 }}>
              Rattachement à un bien & Bail (Optionnel)
            </div>

            <div className="form-group">
              <label className="form-label">Bien loué</label>
              <select
                value={form.bien_id}
                onChange={e => {
                  const bId = e.target.value
                  const selected = biensDispo.find(b => b.id === bId)
                  setForm({
                    ...form,
                    bien_id: bId,
                    loyer_mensuel: selected?.prix_location ? String(selected.prix_location) : form.loyer_mensuel,
                  })
                }}
                className="form-select"
              >
                <option value="">Sélectionner un bien du portefeuille</option>
                {biensDispo.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.titre} ({b.prix_location ? `${Number(b.prix_location).toLocaleString('fr-FR')} F` : 'Prix libre'})
                  </option>
                ))}
              </select>
            </div>

            {form.bien_id && (
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Loyer mensuel (FCFA)</label>
                  <input
                    type="number"
                    value={form.loyer_mensuel}
                    onChange={e => setForm({ ...form, loyer_mensuel: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Jour d'échéance du mois</label>
                  <input
                    type="number"
                    value={form.jour_echeance}
                    onChange={e => setForm({ ...form, jour_echeance: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>
            )}
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
                gap: 7,
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
