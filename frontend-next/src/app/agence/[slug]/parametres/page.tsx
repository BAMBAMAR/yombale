'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  CheckCircle2,
  AlertCircle,
  Building2,
  DollarSign,
  Power
} from 'lucide-react'
import ParametresFacturationImmo from './components/ParametresFacturationImmo'

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
    statut: 'actif',
    vitrine_active: true,
    message_accueil_wa: '',
    taux_vente: '5',
    taux_location: '10',
    // Facturation & Mentions Légales
    ninea: '',
    rccm: '',
    taux_tva_defaut: '18',
    timbre_fiscal_defaut: '100',
    banque_nom: '',
    iban_rib: '',
    mentions_facture: '',
    autoriser_caution_3x: true,
    autoriser_vente_tranches: true,
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
          statut: a.statut || 'actif',
          vitrine_active: p.vitrine_active !== false,
          message_accueil_wa: p.message_accueil_wa || '',
          taux_vente: String(p.taux_commission_vente_defaut ?? '5'),
          taux_location: String(p.taux_commission_location_defaut ?? '10'),
          ninea: p.ninea || '',
          rccm: p.rccm || '',
          taux_tva_defaut: String(p.taux_tva_defaut ?? '18'),
          timbre_fiscal_defaut: String(p.timbre_fiscal_defaut ?? '100'),
          banque_nom: p.banque_nom || '',
          iban_rib: p.iban_rib || '',
          mentions_facture: p.mentions_facture || '',
          autoriser_caution_3x: p.autoriser_caution_3x !== false,
          autoriser_vente_tranches: p.autoriser_vente_tranches !== false,
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
      const resGet = await fetch(`/api/agences/${slug}`)
      const dataGet = await resGet.json()
      const currentParams = dataGet.agence?.parametres || {}

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
        statut: form.statut,
        parametres: {
          ...currentParams,
          vitrine_active: form.vitrine_active,
          message_accueil_wa: form.message_accueil_wa,
          taux_commission_vente_defaut: parseFloat(form.taux_vente) || 5,
          taux_commission_location_defaut: parseFloat(form.taux_location) || 10,
          ninea: form.ninea,
          rccm: form.rccm,
          taux_tva_defaut: parseFloat(form.taux_tva_defaut) || 18,
          timbre_fiscal_defaut: parseFloat(form.timbre_fiscal_defaut) || 100,
          banque_nom: form.banque_nom,
          iban_rib: form.iban_rib,
          mentions_facture: form.mentions_facture,
          autoriser_caution_3x: form.autoriser_caution_3x,
          autoriser_vente_tranches: form.autoriser_vente_tranches,
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

      setToastMsg('Paramètres, statut et facturation d’agence mis à jour avec succès.')
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
        <p>Chargement des paramètres de l'agence...</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      {/* ── En-tête ── */}
      <div className="agence-header">
        <div>
          <h1 className="agence-title">Paramètres &amp; Statut de l'Agence</h1>
          <p className="agence-subtitle">
            Gérez le statut opérationnel, les commissions, la facturation légale COCC et les facilités d'échelonnement.
          </p>
        </div>
      </div>

      {toastMsg && (
        <div style={{ padding: '12px 16px', background: '#DCFCE7', color: '#166534', borderRadius: 8, fontSize: 13.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <CheckCircle2 size={18} />
          {toastMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{ padding: '12px 16px', background: '#FEE2E2', color: '#991B1B', borderRadius: 8, fontSize: 13.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <AlertCircle size={18} />
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* ── Activation & Statut Agence ── */}
        <div className="agence-card">
          <div className="agence-card-header">
            <div className="agence-card-title">
              <Power size={18} />
              Statut de l'Agence &amp; Visibilité Publique
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">État de l'agence *</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
              {[
                { id: 'actif', label: 'Active & Opérationnelle', desc: 'Réception de prospects' },
                { id: 'pause', label: 'Pause Commerciale', desc: 'Biens visibles, pas de visites' },
                { id: 'vacances', label: 'Mode Congés / Vacances', desc: 'Message automatique' },
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setForm({ ...form, statut: opt.id })}
                  style={{
                    padding: '12px',
                    borderRadius: 8,
                    border: '1.5px solid',
                    borderColor: form.statut === opt.id ? 'var(--accent, #C75B00)' : 'var(--border, #E8DDD2)',
                    background: form.statut === opt.id ? 'rgba(199, 91, 0, 0.08)' : '#FFFFFF',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontWeight: 750, fontSize: 13, color: form.statut === opt.id ? 'var(--accent, #C75B00)' : 'var(--navy, #1C2B4A)' }}>
                    {opt.label}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginTop: 16 }}>
            <input
              type="checkbox"
              id="toggle-vitrine"
              checked={form.vitrine_active}
              onChange={e => setForm({ ...form, vitrine_active: e.target.checked })}
              style={{ width: 18, height: 18, marginTop: 2, accentColor: 'var(--accent, #C75B00)' }}
            />
            <label htmlFor="toggle-vitrine" style={{ cursor: 'pointer' }}>
              <div style={{ fontWeight: 700, color: 'var(--navy, #1C2B4A)', fontSize: 14 }}>
                Activer la Vitrine Sociale / Page Publique Agence
              </div>
              <div style={{ fontSize: 12, color: '#64748B' }}>
                Permet aux clients de consulter votre catalogue complet sur <code>/agence/{slug}/vitrine</code>.
              </div>
            </label>
          </div>
        </div>

        {/* ── Coordonnées ── */}
        <div className="agence-card">
          <div className="agence-card-header">
            <div className="agence-card-title">
              <Building2 size={18} />
              Identité Commerciale &amp; Contact
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Nom de l'agence *</label>
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
        </div>

        {/* ── Commissions & WhatsApp ── */}
        <div className="agence-card">
          <div className="agence-card-header">
            <div className="agence-card-title">
              <DollarSign size={18} />
              Taux de Commission &amp; Message d'Accueil
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

          <div className="form-group">
            <label className="form-label">Message d'accueil WhatsApp automatique</label>
            <input
              type="text"
              placeholder="Ex: Bienvenue chez Teranga Immo ! Comment pouvons-nous vous aider ?"
              value={form.message_accueil_wa}
              onChange={e => setForm({ ...form, message_accueil_wa: e.target.value })}
              className="form-input"
            />
          </div>
        </div>

        {/* ── Facturation d'Agence, Mentions Fiscales & Échelonnement (Composant extrait) ── */}
        <ParametresFacturationImmo
          numeroAgrement={form.numero_agrement}
          setNumeroAgrement={val => setForm(f => ({ ...f, numero_agrement: val }))}
          ninea={form.ninea}
          setNinea={val => setForm(f => ({ ...f, ninea: val }))}
          rccm={form.rccm}
          setRccm={val => setForm(f => ({ ...f, rccm: val }))}
          tauxTvaDefaut={form.taux_tva_defaut}
          setTauxTvaDefaut={val => setForm(f => ({ ...f, taux_tva_defaut: val }))}
          timbreFiscalDefaut={form.timbre_fiscal_defaut}
          setTimbreFiscalDefaut={val => setForm(f => ({ ...f, timbre_fiscal_defaut: val }))}
          banqueNom={form.banque_nom}
          setBanqueNom={val => setForm(f => ({ ...f, banque_nom: val }))}
          ibanRib={form.iban_rib}
          setIbanRib={val => setForm(f => ({ ...f, iban_rib: val }))}
          mentionsFacture={form.mentions_facture}
          setMentionsFacture={val => setForm(f => ({ ...f, mentions_facture: val }))}
          autoriserCaution3x={form.autoriser_caution_3x}
          setAutoriserCaution3x={val => setForm(f => ({ ...f, autoriser_caution_3x: val }))}
          autoriserVenteTranches={form.autoriser_vente_tranches}
          setAutoriserVenteTranches={val => setForm(f => ({ ...f, autoriser_vente_tranches: val }))}
        />

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
            {saving ? 'Enregistrement...' : 'Enregistrer tous les paramètres'}
          </button>
        </div>
      </form>
    </div>
  )
}
