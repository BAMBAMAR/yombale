'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Settings, CheckCircle2, AlertCircle, Building2, DollarSign } from 'lucide-react'

export default function AgenceParametresPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [form, setForm] = useState({
    nom: '',
    description: '',
    adresse: '',
    ville: 'Dakar',
    quartier: '',
    telephone: '',
    whatsapp: '',
    email_contact: '',
    site_web: '',
    numero_agrement: '',
    taux_vente: '5',
    taux_location: '10',
  })

  async function chargerParametres() {
    try {
      setLoading(true)
      const res = await fetch(`/api/agences/${slug}`)
      const data = await res.json()
      if (data.success && data.agence) {
        const a = data.agence
        const p = a.parametres || {}
        setForm({
          nom: a.nom || '',
          description: a.description || '',
          adresse: a.adresse || '',
          ville: a.ville || 'Dakar',
          quartier: a.quartier || '',
          telephone: a.telephone || '',
          whatsapp: a.whatsapp || '',
          email_contact: a.email_contact || '',
          site_web: a.site_web || '',
          numero_agrement: a.numero_agrement || '',
          taux_vente: String(p.taux_commission_vente_defaut ?? '5'),
          taux_location: String(p.taux_commission_location_defaut ?? '10'),
        })
      }
    } catch (err) {
      console.error('[LOAD_SETTINGS_ERR]', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (slug) chargerParametres()
  }, [slug])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg(null)
    setToastMsg(null)

    try {
      setSaving(true)
      const payload = {
        nom: form.nom,
        description: form.description,
        adresse: form.adresse,
        ville: form.ville,
        quartier: form.quartier,
        telephone: form.telephone,
        whatsapp: form.whatsapp,
        email_contact: form.email_contact,
        site_web: form.site_web,
        numero_agrement: form.numero_agrement,
        parametres: {
          taux_commission_vente_defaut: parseFloat(form.taux_vente) || 5,
          taux_commission_location_defaut: parseFloat(form.taux_location) || 10,
        },
      }

      const res = await fetch(`/api/agences/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Erreur lors de la mise à jour.')
        return
      }

      setToastMsg('Paramètres enregistrés avec succès.')
      setTimeout(() => setToastMsg(null), 4000)
    } catch (err) {
      console.error('[SAVE_SETTINGS_ERR]', err)
      setErrorMsg('Erreur de connexion.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748B' }}>
        <p>Chargement des paramètres...</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      {/* ── En-tête ── */}
      <div className="agence-header">
        <div>
          <h1 className="agence-title">Paramètres de l'Agence</h1>
          <p className="agence-subtitle">Coordonnées, informations légales et taux de commission par défaut.</p>
        </div>
      </div>

      {toastMsg && (
        <div
          style={{
            padding: '12px 16px',
            background: '#DCFCE7',
            color: '#166534',
            borderRadius: 8,
            fontSize: 13.5,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 20,
          }}
        >
          <CheckCircle2 size={18} />
          {toastMsg}
        </div>
      )}

      {errorMsg && (
        <div
          style={{
            padding: '12px 16px',
            background: '#FEE2E2',
            color: '#991B1B',
            borderRadius: 8,
            fontSize: 13.5,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 20,
          }}
        >
          <AlertCircle size={18} />
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* ── Coordonnées ── */}
        <div className="agence-card">
          <div className="agence-card-header">
            <div className="agence-card-title">
              <Building2 size={18} />
              Identité & Coordonnées
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Nom commercial de l'agence *</label>
            <input
              type="text"
              required
              value={form.nom}
              onChange={e => setForm({ ...form, nom: e.target.value })}
              className="form-input"
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Téléphone</label>
              <input
                type="tel"
                value={form.telephone}
                onChange={e => setForm({ ...form, telephone: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">WhatsApp Pro</label>
              <input
                type="tel"
                value={form.whatsapp}
                onChange={e => setForm({ ...form, whatsapp: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Ville</label>
              <input
                type="text"
                value={form.ville}
                onChange={e => setForm({ ...form, ville: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Quartier</label>
              <input
                type="text"
                value={form.quartier}
                onChange={e => setForm({ ...form, quartier: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Numéro d'agrément / RCCM</label>
            <input
              type="text"
              placeholder="Ex: SN-DKR-2024-B-12345"
              value={form.numero_agrement}
              onChange={e => setForm({ ...form, numero_agrement: e.target.value })}
              className="form-input"
            />
          </div>
        </div>

        {/* ── Commissions ── */}
        <div className="agence-card">
          <div className="agence-card-header">
            <div className="agence-card-title">
              <DollarSign size={18} />
              Commissions par Défaut
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Taux commission vente (%)</label>
              <input
                type="number"
                step="0.5"
                value={form.taux_vente}
                onChange={e => setForm({ ...form, taux_vente: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Taux commission location (%)</label>
              <input
                type="number"
                step="0.5"
                value={form.taux_location}
                onChange={e => setForm({ ...form, taux_location: e.target.value })}
                className="form-input"
              />
            </div>
          </div>
        </div>

        {/* Bouton de sauvegarde */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 40 }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '11px 24px',
              borderRadius: 8,
              background: 'var(--accent, #C75B00)',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 700,
              fontSize: 14,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </div>
      </form>
    </div>
  )
}
