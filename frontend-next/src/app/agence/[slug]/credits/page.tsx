'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  CreditCard,
  Plus,
  CheckCircle2,
  DollarSign,
  Calendar,
  MessageCircle,
  Layers,
  AlertCircle,
  Clock,
  Check
} from 'lucide-react'

interface EcheanceItem {
  numero: number
  date_echeance: string
  montant: number
  statut: string
  montant_paye?: number
  date_paiement?: string
}

interface CreditItem {
  id: string
  type_credit: string
  beneficiaire_nom: string
  beneficiaire_tel?: string
  bien_titre?: string
  montant_total: number
  apport_initial: number
  solde_restant: number
  nb_echeances: number
  frequence: string
  statut: string
  echeances: EcheanceItem[]
  notes?: string
}

interface BienOption {
  id: string
  titre: string
}

export default function AgenceCreditsPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [credits, setCredits] = useState<CreditItem[]>([])
  const [biens, setBiens] = useState<BienOption[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const [form, setForm] = useState({
    type_credit: 'caution_echelonnee',
    beneficiaire_nom: '',
    beneficiaire_tel: '',
    bien_id: '',
    montant_total: '',
    apport_initial: '',
    nb_echeances: '3',
    frequence: 'mensuel',
    date_premiere_echeance: new Date().toISOString().split('T')[0],
    notes: '',
  })

  async function chargerDonnees() {
    try {
      setLoading(true)
      const [resCredits, resBiens] = await Promise.all([
        fetch(`/api/credits-immo/agence/${slug}`),
        fetch(`/api/biens/agence/${slug}?statut=actif`),
      ])
      const dataC = await resCredits.json()
      const dataB = await resBiens.json()

      if (dataC.success) setCredits(dataC.credits || [])
      if (dataB.success) setBiens(dataB.biens || [])
    } catch (err) {
      console.error('[LOAD_CREDITS_ERR]', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (slug) chargerDonnees()
  }, [slug])

  async function handleCreerCredit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.beneficiaire_nom.trim() || !form.montant_total) return

    try {
      setSaving(true)
      const res = await fetch(`/api/credits-immo/agence/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) {
        setToastMsg('Plan de paiement échelonné créé avec succès !')
        setShowModal(false)
        setForm({
          type_credit: 'caution_echelonnee',
          beneficiaire_nom: '',
          beneficiaire_tel: '',
          bien_id: '',
          montant_total: '',
          apport_initial: '',
          nb_echeances: '3',
          frequence: 'mensuel',
          date_premiere_echeance: new Date().toISOString().split('T')[0],
          notes: '',
        })
        chargerDonnees()
        setTimeout(() => setToastMsg(null), 4000)
      }
    } catch (err) {
      console.error('[CREATE_CREDIT_ERR]', err)
    } finally {
      setSaving(false)
    }
  }

  const totalFinancement = credits.reduce((sum, c) => sum + Number(c.montant_total || 0), 0)
  const totalRestant = credits.reduce((sum, c) => sum + Number(c.solde_restant || 0), 0)

  return (
    <div>
      {/* ── En-tête ── */}
      <div className="agence-header">
        <div>
          <h1 className="agence-title">Crédits & Paiements Échelonnés</h1>
          <p className="agence-subtitle">Caution en 2x/3x/4x, frais d'agence étalés et facilités de paiement sur terrains/VEFA.</p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="btn-npl"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 8,
            background: 'var(--accent, #C75B00)',
            color: '#FFFFFF',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <Plus size={18} />
          Nouveau plan d'échelonnement
        </button>
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
            marginBottom: 16,
          }}
        >
          <CheckCircle2 size={18} />
          {toastMsg}
        </div>
      )}

      {/* ── KPIs Financements ── */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-title">Total Échelonné</span>
            <div className="kpi-card-icon">
              <CreditCard size={18} />
            </div>
          </div>
          <div className="kpi-card-value">{Number(totalFinancement).toLocaleString('fr-FR')} F</div>
          <div className="kpi-card-sub">{credits.length} contrat(s) en cours</div>
        </div>

        <div className="kpi-card" style={{ borderColor: totalRestant > 0 ? '#FCA5A5' : 'var(--border, #E8DDD2)' }}>
          <div className="kpi-card-header">
            <span className="kpi-card-title">Solde Restant Dû</span>
            <div className="kpi-card-icon" style={{ color: totalRestant > 0 ? '#DC2626' : '#166534' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div className="kpi-card-value" style={{ color: totalRestant > 0 ? '#DC2626' : 'var(--navy, #1C2B4A)' }}>
            {Number(totalRestant).toLocaleString('fr-FR')} F
          </div>
          <div className="kpi-card-sub">À recouvrer sur échéances</div>
        </div>
      </div>

      {/* ── Liste des Plans Échelonnés ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748B' }}>
          <p>Chargement des plans de financement...</p>
        </div>
      ) : credits.length === 0 ? (
        <div className="agence-card" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
          <CreditCard size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <p style={{ fontWeight: 700, color: 'var(--navy, #1C2B4A)', fontSize: 16 }}>Aucun plan d'échelonnement actif</p>
          <p style={{ fontSize: 13.5 }}>Proposez à vos locataires ou acheteurs d'étaler leur caution ou achat en plusieurs fois.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {credits.map(cr => (
            <div key={cr.id} className="agence-card" style={{ padding: 18, marginBottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      padding: '3px 8px',
                      borderRadius: 4,
                      background: '#E0F2FE',
                      color: '#0369A1',
                    }}
                  >
                    {cr.type_credit.replace(/_/g, ' ')}
                  </span>
                  <span className={`status-badge ${cr.statut === 'solde' ? 'actif' : 'en_attente'}`}>
                    {cr.statut === 'solde' ? 'Soldé' : 'En cours'}
                  </span>
                </div>

                <div style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)', fontSize: 15, marginBottom: 2 }}>
                  {cr.beneficiaire_nom}
                </div>
                {cr.beneficiaire_tel && (
                  <div style={{ fontSize: 12, color: '#64748B', marginBottom: 12 }}>
                    Tél : {cr.beneficiaire_tel}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: '#64748B' }}>Montant total :</span>
                  <span style={{ fontWeight: 700 }}>{Number(cr.montant_total).toLocaleString('fr-FR')} F</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: '#64748B' }}>Apport initial :</span>
                  <span style={{ fontWeight: 700, color: '#166534' }}>{Number(cr.apport_initial).toLocaleString('fr-FR')} F</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 800, color: cr.solde_restant > 0 ? '#DC2626' : '#166534', marginBottom: 14 }}>
                  <span>Reste à payer :</span>
                  <span>{Number(cr.solde_restant).toLocaleString('fr-FR')} FCFA</span>
                </div>

                {/* Échéancier */}
                <div style={{ borderTop: '1px solid var(--border, #E8DDD2)', paddingTop: 10, marginTop: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 750, color: 'var(--navy, #1C2B4A)', marginBottom: 6 }}>
                    Échéancier ({cr.nb_echeances} mensualités) :
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {(cr.echeances || []).map((ech, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: 11.5,
                          padding: '4px 8px',
                          background: ech.statut === 'paye' ? '#F0FDF4' : '#FAF8F5',
                          borderRadius: 4,
                        }}
                      >
                        <span>Échéance {ech.numero} ({new Date(ech.date_echeance).toLocaleDateString('fr-FR')})</span>
                        <span style={{ fontWeight: 700, color: ech.statut === 'paye' ? '#166534' : 'var(--navy, #1C2B4A)' }}>
                          {Number(ech.montant).toLocaleString('fr-FR')} F {ech.statut === 'paye' ? '✓' : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bouton Relance WhatsApp */}
              {cr.beneficiaire_tel && cr.solde_restant > 0 && (
                <div style={{ marginTop: 16 }}>
                  <a
                    href={`https://wa.me/${cr.beneficiaire_tel.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                      `Bonjour ${cr.beneficiaire_nom}, ceci est un rappel concernant votre plan de paiement échelonné (${cr.type_credit.replace(/_/g, ' ')}). Solde restant : ${Number(cr.solde_restant).toLocaleString('fr-FR')} FCFA.`
                    )}`}
                    target="_blank"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      padding: '8px',
                      borderRadius: 6,
                      background: 'rgba(22, 163, 74, 0.08)',
                      color: '#166534',
                      fontWeight: 700,
                      fontSize: 12,
                      textDecoration: 'none',
                      border: '1px solid rgba(22, 163, 74, 0.2)',
                    }}
                  >
                    <MessageCircle size={14} />
                    Relancer par WhatsApp
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Modale Nouveau Crédit / Échelonnement ── */}
      {showModal && (
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
              maxWidth: 500,
              width: '100%',
              padding: 24,
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CreditCard size={20} color="var(--accent, #C75B00)" />
                <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
                  Nouveau plan d'échelonnement
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', fontSize: 20, color: '#94A3B8', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreerCredit}>
              <div className="form-group">
                <label className="form-label">Type d'échelonnement *</label>
                <select
                  value={form.type_credit}
                  onChange={e => setForm({ ...form, type_credit: e.target.value })}
                  className="form-select"
                >
                  <option value="caution_echelonnee">Caution / Dépôt de garantie en 2x/3x/4x</option>
                  <option value="frais_agence">Frais d'agence & Honoraires étalés</option>
                  <option value="terrain_vefa">Vente Terrain / Acquisition VEFA en tranches</option>
                  <option value="avance_bailleur">Avance sur loyers consentie au bailleur</option>
                </select>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Nom du bénéficiaire *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Ousmane Seck"
                    value={form.beneficiaire_nom}
                    onChange={e => setForm({ ...form, beneficiaire_nom: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Téléphone</label>
                  <input
                    type="tel"
                    placeholder="+221 77 000 00 00"
                    value={form.beneficiaire_tel}
                    onChange={e => setForm({ ...form, beneficiaire_tel: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Montant total financé (FCFA) *</label>
                  <input
                    type="number"
                    required
                    placeholder="300000"
                    value={form.montant_total}
                    onChange={e => setForm({ ...form, montant_total: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Apport initial (FCFA)</label>
                  <input
                    type="number"
                    placeholder="100000"
                    value={form.apport_initial}
                    onChange={e => setForm({ ...form, apport_initial: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Nombre d'échéances</label>
                  <select
                    value={form.nb_echeances}
                    onChange={e => setForm({ ...form, nb_echeances: e.target.value })}
                    className="form-select"
                  >
                    <option value="2">2 mensualités</option>
                    <option value="3">3 mensualités</option>
                    <option value="4">4 mensualités</option>
                    <option value="6">6 mensualités</option>
                    <option value="12">12 mensualités (VEFA / Terrain)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Date 1ère échéance</label>
                  <input
                    type="date"
                    value={form.date_premiere_echeance}
                    onChange={e => setForm({ ...form, date_premiere_echeance: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
                  {saving ? 'Création...' : 'Valider le plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
