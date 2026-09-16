'use client'

import React, { useState } from 'react'
import { X, UserPlus, Briefcase, Users, AlertCircle } from 'lucide-react'
import { getImmoAuthHeaders } from '@/lib/immo-auth'

interface ModalAjouterMembreProps {
  slug: string
  onClose: () => void
  onSuccess: (msg: string) => void
}

export default function ModalAjouterMembre({ slug, onClose, onSuccess }: ModalAjouterMembreProps) {
  const [typeMembre, setTypeMembre] = useState<'courtier' | 'interne'>('courtier')
  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    email: '',
    role: 'courtier',
    cabinet: '',
    specialite: 'Courtier Financement & Crédit Immobilier',
    commission_taux: '15',
  })

  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  function handleTypeChange(type: 'courtier' | 'interne') {
    setTypeMembre(type)
    setForm(prev => ({
      ...prev,
      role: type === 'courtier' ? 'courtier' : 'agent',
      specialite: type === 'courtier' ? 'Courtier Financement & Crédit Immobilier' : '',
      commission_taux: type === 'courtier' ? '15' : '0',
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg(null)

    if (!form.nom.trim()) {
      setErrorMsg('Veuillez renseigner au moins le nom du collaborateur ou courtier.')
      return
    }

    if (!form.telephone.trim() && !form.email.trim()) {
      setErrorMsg('Veuillez renseigner au moins un numéro de téléphone ou un email de contact.')
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
        cabinet: form.cabinet.trim(),
        specialite: form.specialite.trim(),
        commission_taux: parseFloat(form.commission_taux) || 0,
      }

      const res = await fetch(`/api/agences/${slug}/membres`, {
        method: 'POST',
        headers: getImmoAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors de l’enregistrement')
      }

      onSuccess(data.message || 'Collaborateur ou courtier enregistré avec succès.')
      onClose()
    } catch (err: any) {
      console.error('[AJOUT_MEMBRE_ERR]', err)
      setErrorMsg(err.message || 'Erreur lors de l’enregistrement')
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
              Ajouter un Collaborateur ou Courtier Partenaire
            </h3>
            <p style={{ fontSize: 12.5, color: '#64748B', margin: '4px 0 0' }}>
              Enregistrement direct sans prérequis de compte préalable.
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

        {/* ── Sélecteur Type Collaborateur ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
          <button
            type="button"
            onClick={() => handleTypeChange('courtier')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '10px 14px',
              borderRadius: 8,
              border: '1.5px solid',
              borderColor: typeMembre === 'courtier' ? '#0A5C36' : 'var(--border, #E8DDD2)',
              background: typeMembre === 'courtier' ? '#ECFDF5' : '#FFFFFF',
              color: typeMembre === 'courtier' ? '#0A5C36' : 'var(--navy, #1C2B4A)',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            <Briefcase size={16} />
            <span>Courtier / Apporteur</span>
          </button>

          <button
            type="button"
            onClick={() => handleTypeChange('interne')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '10px 14px',
              borderRadius: 8,
              border: '1.5px solid',
              borderColor: typeMembre === 'interne' ? 'var(--navy, #1C2B4A)' : 'var(--border, #E8DDD2)',
              background: typeMembre === 'interne' ? '#FAF8F5' : '#FFFFFF',
              color: typeMembre === 'interne' ? 'var(--navy, #1C2B4A)' : '#64748B',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            <Users size={16} />
            <span>Équipe Interne</span>
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
                placeholder="Ex: Diallo"
                value={form.nom}
                onChange={e => setForm({ ...form, nom: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Prénom</label>
              <input
                type="text"
                placeholder="Ex: Abdoulaye"
                value={form.prenom}
                onChange={e => setForm({ ...form, prenom: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Téléphone portable *</label>
              <input
                type="text"
                placeholder="+221 77 000 00 00"
                value={form.telephone}
                onChange={e => setForm({ ...form, telephone: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Adresse Email</label>
              <input
                type="email"
                placeholder="courtier@cabinet.sn"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          {typeMembre === 'courtier' ? (
            <>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Cabinet de courtage / Organisme</label>
                  <input
                    type="text"
                    placeholder="Ex: Cabinet Teranga Courtage / Banque"
                    value={form.cabinet}
                    onChange={e => setForm({ ...form, cabinet: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Partage de commission (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    placeholder="15"
                    value={form.commission_taux}
                    onChange={e => setForm({ ...form, commission_taux: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Spécialité &amp; Domaine d'intervention</label>
                <input
                  type="text"
                  placeholder="Ex: Crédit habitat, financement bancaire, apporteur foncier..."
                  value={form.specialite}
                  onChange={e => setForm({ ...form, specialite: e.target.value })}
                  className="form-input"
                />
              </div>
            </>
          ) : (
            <div className="form-group">
              <label className="form-label">Rôle au sein de l'agence *</label>
              <select
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
                className="form-select"
              >
                <option value="agent">Agent Immobilier (Gestion Portefeuille)</option>
                <option value="gestionnaire_locatif">Gestionnaire Locatif (Baux &amp; Loyers)</option>
                <option value="commercial">Commercial (Prospects &amp; Visites)</option>
                <option value="directeur">Directeur Adjoint</option>
              </select>
            </div>
          )}

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
              <UserPlus size={15} />
              <span>{saving ? 'Enregistrement...' : (typeMembre === 'courtier' ? 'Enregistrer le courtier' : 'Ajouter le collaborateur')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
