'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  Scale
} from 'lucide-react'

const CG_MANDAT_DEFAUT = `CONDITIONS GÉNÉRALES DE GESTION LOCATIVE & MANDAT

1. OBJET DU MANDAT : Le mandant confie à l'agence immobilière la gestion administrative, financière et technique du bien désigné, incluant la recherche de locataires, la rédaction des baux, l'encaissement des loyers et le suivi des réparations.

2. HONORAIRES DE GESTION : Les honoraires de l'agence sont fixés conformément au barème convenu, prélevés mensuellement sur les loyers bruts encaissés.

3. REDDITION DES COMPTES : L'agence s'engage à reverser les loyers nets au propriétaire mandant dans un délai de 5 jours ouvrés suivant leur encaissement effectif, accompagnés d'un état récapitulatif mensuel.

4. OBLIGATIONS FISCALES : L'agence rappelle au bailleur l'obligation de déclaration des revenus fonciers auprès de la Direction Générale des Impôts et des Domaines (DGID) du Sénégal.

5. JURIDICTION : En cas de litige relatif à l'exécution du présent mandat, attribution expresse de compétence est faite aux tribunaux de Dakar.`

export default function FiscaliteAgencePage() {
  const params = useParams()
  const slug = params?.slug as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [form, setForm] = useState({
    ninea: '',
    rccm: '',
    numero_agrement: '',
    assujetti_tva: false,
    taux_tva: '18',
    retenue_source_applicable: false,
    taux_retenue_source: '5',
    timbre_fiscal: true,
    montant_timbre: '100',
    conditions_gestion: CG_MANDAT_DEFAUT,
  })

  async function chargerFiscalite() {
    try {
      setLoading(true)
      const res = await fetch(`/api/agences/${slug}`)
      const data = await res.json()
      if (data.success && data.agence) {
        const a = data.agence
        const f = a.parametres?.fiscalite || {}
        setForm({
          ninea: f.ninea || a.ninea || '',
          rccm: f.rccm || '',
          numero_agrement: a.numero_agrement || f.numero_agrement || '',
          assujetti_tva: f.assujetti_tva === true,
          taux_tva: String(f.taux_tva ?? '18'),
          retenue_source_applicable: f.retenue_source_applicable === true,
          taux_retenue_source: String(f.taux_retenue_source ?? '5'),
          timbre_fiscal: f.timbre_fiscal !== false,
          montant_timbre: String(f.montant_timbre ?? '100'),
          conditions_gestion: f.conditions_gestion || CG_MANDAT_DEFAUT,
        })
      }
    } catch (err) {
      console.error('[LOAD_FISCALITE_ERR]', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (slug) chargerFiscalite()
  }, [slug])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg(null)
    setToastMsg(null)

    try {
      setSaving(true)
      // Récupérer les paramètres actuels
      const resGet = await fetch(`/api/agences/${slug}`)
      const dataGet = await resGet.json()
      const currentParametres = dataGet.agence?.parametres || {}

      const updatedParametres = {
        ...currentParametres,
        fiscalite: {
          ninea: form.ninea,
          rccm: form.rccm,
          numero_agrement: form.numero_agrement,
          assujetti_tva: form.assujetti_tva,
          taux_tva: parseFloat(form.taux_tva) || 18,
          retenue_source_applicable: form.retenue_source_applicable,
          taux_retenue_source: parseFloat(form.taux_retenue_source) || 5,
          timbre_fiscal: form.timbre_fiscal,
          montant_timbre: parseFloat(form.montant_timbre) || 100,
          conditions_gestion: form.conditions_gestion,
        },
      }

      const res = await fetch(`/api/agences/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numero_agrement: form.numero_agrement,
          parametres: updatedParametres,
        }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Erreur lors de la sauvegarde.')
        return
      }

      setToastMsg('Paramètres fiscaux et légaux enregistrés avec succès.')
      setTimeout(() => setToastMsg(null), 4000)
    } catch (err) {
      console.error('[SAVE_FISCALITE_ERR]', err)
      setErrorMsg('Erreur de connexion.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748B' }}>
        <p>Chargement des paramètres fiscaux...</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      {/* ── En-tête ── */}
      <div className="agence-header">
        <div>
          <h1 className="agence-title">Fiscalité & Conformité Immobilière</h1>
          <p className="agence-subtitle">TVA, NINEA, retenues foncières et mentions légales sur vos quittances et mandats.</p>
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
        {/* ── Identifiants Légaux ── */}
        <div className="agence-card">
          <div className="agence-card-header">
            <div className="agence-card-title">
              <Scale size={18} />
              Identifiants Officiels (Sénégal)
            </div>
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label">Numéro NINEA</label>
              <input
                type="text"
                placeholder="Ex: 001234567 2V1"
                value={form.ninea}
                onChange={e => setForm({ ...form, ninea: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Numéro RCCM</label>
              <input
                type="text"
                placeholder="Ex: SN-DKR-2024-B-..."
                value={form.rccm}
                onChange={e => setForm({ ...form, rccm: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Numéro Agrément Agent Immo</label>
              <input
                type="text"
                placeholder="Ex: AGR-IMMO-2024-..."
                value={form.numero_agrement}
                onChange={e => setForm({ ...form, numero_agrement: e.target.value })}
                className="form-input"
              />
            </div>
          </div>
        </div>

        {/* ── TVA & Retenues Fiscales ── */}
        <div className="agence-card">
          <div className="agence-card-header">
            <div className="agence-card-title">
              <DollarSign size={18} />
              Régime TVA & Retenues à la Source
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Toggle TVA */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <input
                type="checkbox"
                id="toggle-tva"
                checked={form.assujetti_tva}
                onChange={e => setForm({ ...form, assujetti_tva: e.target.checked })}
                style={{ width: 18, height: 18, marginTop: 2, accentColor: 'var(--accent, #C75B00)' }}
              />
              <label htmlFor="toggle-tva" style={{ cursor: 'pointer' }}>
                <div style={{ fontWeight: 700, color: 'var(--navy, #1C2B4A)', fontSize: 14 }}>
                  Agence assujettie à la TVA (18%)
                </div>
                <div style={{ fontSize: 12, color: '#64748B' }}>
                  Applique automatiquement la TVA sur les commissions d'agence et frais de gestion locative.
                </div>
              </label>
            </div>

            {/* Toggle Timbre Fiscal */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <input
                type="checkbox"
                id="toggle-timbre"
                checked={form.timbre_fiscal}
                onChange={e => setForm({ ...form, timbre_fiscal: e.target.checked })}
                style={{ width: 18, height: 18, marginTop: 2, accentColor: 'var(--accent, #C75B00)' }}
              />
              <label htmlFor="toggle-timbre" style={{ cursor: 'pointer' }}>
                <div style={{ fontWeight: 700, color: 'var(--navy, #1C2B4A)', fontSize: 14 }}>
                  Droit de Timbre Fiscal sur Quittances (100 FCFA)
                </div>
                <div style={{ fontSize: 12, color: '#64748B' }}>
                  Mentionne la taxe de timbre réglementaire sur les quittances de loyer émises.
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* ── Conditions Générales de Gestion ── */}
        <div className="agence-card">
          <div className="agence-card-header">
            <div className="agence-card-title">
              <FileText size={18} />
              Conditions Générales de Gestion Locative
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Clauses standard figurant sur les mandats et quittances</label>
            <textarea
              rows={8}
              value={form.conditions_gestion}
              onChange={e => setForm({ ...form, conditions_gestion: e.target.value })}
              className="form-textarea"
            />
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
            {saving ? 'Enregistrement...' : 'Enregistrer les paramètres légaux'}
          </button>
        </div>
      </form>
    </div>
  )
}
