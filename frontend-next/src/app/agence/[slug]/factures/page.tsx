'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  FileText,
  Plus,
  CheckCircle2,
  Download,
  Printer,
  DollarSign,
  Check,
  Clock,
  AlertCircle,
  Filter,
  Building2,
  User
} from 'lucide-react'

interface FactureItem {
  id: string
  numero_facture: string
  type_facture: string
  client_nom: string
  client_tel?: string
  client_email?: string
  bien_titre?: string
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

export default function AgenceFacturesPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [factures, setFactures] = useState<FactureItem[]>([])
  const [biens, setBiens] = useState<BienOption[]>([])
  const [loading, setLoading] = useState(true)
  const [filtreStatut, setFiltreStatut] = useState('tous')
  const [showModal, setShowModal] = useState(false)
  const [selectedFacture, setSelectedFacture] = useState<FactureItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const [form, setForm] = useState({
    type_facture: 'honoraires_vente',
    client_nom: '',
    client_tel: '',
    client_email: '',
    bien_id: '',
    montant_ht: '',
    taux_tva: '18',
    timbre_fiscal: '100',
    date_echeance: '',
    mode_paiement: 'wave',
    notes: '',
  })

  async function chargerDonnees() {
    try {
      setLoading(true)
      const [resFactures, resBiens] = await Promise.all([
        fetch(`/api/factures-immo/agence/${slug}`),
        fetch(`/api/biens/agence/${slug}?statut=actif`),
      ])
      const dataF = await resFactures.json()
      const dataB = await resBiens.json()

      if (dataF.success) setFactures(dataF.factures || [])
      if (dataB.success) setBiens(dataB.biens || [])
    } catch (err) {
      console.error('[LOAD_FACTURES_ERR]', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (slug) chargerDonnees()
  }, [slug])

  async function handleCreerFacture(e: React.FormEvent) {
    e.preventDefault()
    if (!form.client_nom.trim() || !form.montant_ht) return

    try {
      setSaving(true)
      const res = await fetch(`/api/factures-immo/agence/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) {
        setToastMsg(`Facture ${data.facture.numero_facture} générée avec succès !`)
        setShowModal(false)
        setForm({
          type_facture: 'honoraires_vente',
          client_nom: '',
          client_tel: '',
          client_email: '',
          bien_id: '',
          montant_ht: '',
          taux_tva: '18',
          timbre_fiscal: '100',
          date_echeance: '',
          mode_paiement: 'wave',
          notes: '',
        })
        chargerDonnees()
        setTimeout(() => setToastMsg(null), 4000)
      }
    } catch (err) {
      console.error('[CREATE_FACTURE_ERR]', err)
    } finally {
      setSaving(false)
    }
  }

  async function handleEncaisserFacture(factureId: string) {
    try {
      const res = await fetch(`/api/factures-immo/agence/${slug}/${factureId}/encaisser`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode_paiement: 'wave' }),
      })
      const data = await res.json()
      if (data.success) {
        setToastMsg('Facture marquée comme payée.')
        chargerDonnees()
        setTimeout(() => setToastMsg(null), 3000)
      }
    } catch (err) {
      console.error('[ENCAISSER_FACTURE_ERR]', err)
    }
  }

  const facturesFiltrees = factures.filter(f => {
    if (filtreStatut === 'tous') return true
    return f.statut === filtreStatut
  })

  const totalFacture = factures.reduce((sum, f) => sum + Number(f.montant_ttc || 0), 0)
  const totalEncaisse = factures.filter(f => f.statut === 'payee').reduce((sum, f) => sum + Number(f.montant_ttc || 0), 0)

  return (
    <div>
      {/* ── En-tête ── */}
      <div className="agence-header">
        <div>
          <h1 className="agence-title">Facturation & Honoraires</h1>
          <p className="agence-subtitle">Émission des factures d'honoraires, gestion locative, quittances et débours.</p>
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
          Nouvelle facture
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

      {/* ── KPIs Facturation ── */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-title">Total Facturé</span>
            <div className="kpi-card-icon">
              <FileText size={18} />
            </div>
          </div>
          <div className="kpi-card-value">{Number(totalFacture).toLocaleString('fr-FR')} F</div>
          <div className="kpi-card-sub">{factures.length} facture(s) émise(s)</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-title">Encaissé</span>
            <div className="kpi-card-icon" style={{ color: '#166534' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="kpi-card-value" style={{ color: '#166534' }}>
            {Number(totalEncaisse).toLocaleString('fr-FR')} F
          </div>
          <div className="kpi-card-sub">Honoraires & prestations réglés</div>
        </div>
      </div>

      {/* ── Filtres ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { id: 'tous', label: 'Toutes les factures' },
          { id: 'payee', label: 'Payées' },
          { id: 'en_attente', label: 'En attente' },
        ].map(f => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFiltreStatut(f.id)}
            style={{
              padding: '7px 14px',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              border: '1px solid',
              borderColor: filtreStatut === f.id ? 'var(--navy, #1C2B4A)' : 'var(--border, #E8DDD2)',
              background: filtreStatut === f.id ? 'var(--navy, #1C2B4A)' : '#FFFFFF',
              color: filtreStatut === f.id ? '#FFFFFF' : 'var(--navy, #1C2B4A)',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Tableau des factures ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748B' }}>
          <p>Chargement des factures...</p>
        </div>
      ) : facturesFiltrees.length === 0 ? (
        <div className="agence-card" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
          <FileText size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <p style={{ fontWeight: 700, color: 'var(--navy, #1C2B4A)', fontSize: 16 }}>Aucune facture émise</p>
          <p style={{ fontSize: 13.5 }}>Créez votre première facture d'honoraires ou de gestion locative.</p>
        </div>
      ) : (
        <div className="agence-table-wrapper">
          <table className="agence-table">
            <thead>
              <tr>
                <th>Numéro & Date</th>
                <th>Client / Mandant</th>
                <th>Type de Facture</th>
                <th>Montant TTC</th>
                <th>Statut</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {facturesFiltrees.map(fact => (
                <tr key={fact.id}>
                  <td>
                    <div style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>{fact.numero_facture}</div>
                    <div style={{ fontSize: 11.5, color: '#64748B' }}>
                      Émise le {new Date(fact.date_emission).toLocaleDateString('fr-FR')}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{fact.client_nom}</div>
                    {fact.client_tel && <div style={{ fontSize: 11.5, color: '#64748B' }}>{fact.client_tel}</div>}
                  </td>
                  <td>
                    <span style={{ fontSize: 12.5, textTransform: 'capitalize' }}>
                      {fact.type_facture.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                      {Number(fact.montant_ttc).toLocaleString('fr-FR')} FCFA
                    </div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>HT: {Number(fact.montant_ht).toLocaleString('fr-FR')} F</div>
                  </td>
                  <td>
                    <span className={`status-badge ${fact.statut === 'payee' ? 'actif' : 'en_attente'}`}>
                      {fact.statut === 'payee' ? 'Payée' : 'En attente'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                      {fact.statut !== 'payee' && (
                        <button
                          type="button"
                          onClick={() => handleEncaisserFacture(fact.id)}
                          style={{
                            padding: '5px 10px',
                            borderRadius: 6,
                            background: '#16a34a',
                            color: '#FFFFFF',
                            border: 'none',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Encaisser
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedFacture(fact)}
                        style={{
                          padding: '5px 8px',
                          borderRadius: 6,
                          background: '#FAF8F5',
                          border: '1px solid var(--border, #E8DDD2)',
                          color: 'var(--navy, #1C2B4A)',
                          cursor: 'pointer',
                        }}
                        title="Aperçu & Imprimer"
                      >
                        <Printer size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modale Nouvelle Facture ── */}
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
              maxWidth: 520,
              width: '100%',
              padding: 24,
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={20} color="var(--accent, #C75B00)" />
                <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
                  Émettre une facture pro
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

            <form onSubmit={handleCreerFacture}>
              <div className="form-group">
                <label className="form-label">Type de facture *</label>
                <select
                  value={form.type_facture}
                  onChange={e => setForm({ ...form, type_facture: e.target.value })}
                  className="form-select"
                >
                  <option value="honoraires_vente">Honoraires de Vente / Transaction</option>
                  <option value="honoraires_location">Honoraires d'Entrée Location</option>
                  <option value="gestion_locative">Honoraires de Gestion Locative Mensuelle</option>
                  <option value="debours_travaux">Remboursement Débours / Travaux</option>
                  <option value="acompte_reservation">Acompte / Réservation</option>
                </select>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Nom du client / Mandant *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Babacar Ndiaye"
                    value={form.client_nom}
                    onChange={e => setForm({ ...form, client_nom: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Téléphone</label>
                  <input
                    type="tel"
                    placeholder="+221 77 000 00 00"
                    value={form.client_tel}
                    onChange={e => setForm({ ...form, client_tel: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Montant Hors Taxes (FCFA) *</label>
                  <input
                    type="number"
                    required
                    placeholder="150000"
                    value={form.montant_ht}
                    onChange={e => setForm({ ...form, montant_ht: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">TVA (%)</label>
                  <select
                    value={form.taux_tva}
                    onChange={e => setForm({ ...form, taux_tva: e.target.value })}
                    className="form-select"
                  >
                    <option value="0">0% (Non assujetti)</option>
                    <option value="18">18% (Taux normal Sénégal)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Mode de règlement prévu</label>
                <select
                  value={form.mode_paiement}
                  onChange={e => setForm({ ...form, mode_paiement: e.target.value })}
                  className="form-select"
                >
                  <option value="wave">Wave Sénégal</option>
                  <option value="orange_money">Orange Money</option>
                  <option value="virement">Virement bancaire</option>
                  <option value="cheque">Chèque</option>
                  <option value="especes">Espèces (Cash)</option>
                </select>
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
                  {saving ? 'Génération...' : 'Créer la facture'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modale Aperçu Facture Pro & Impression ── */}
      {selectedFacture && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(28, 43, 74, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: 16,
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 14,
              maxWidth: 600,
              width: '100%',
              padding: 30,
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid var(--border, #E8DDD2)', paddingBottom: 14 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
                  Facture Officielle #{selectedFacture.numero_facture}
                </h2>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                  Date d'émission : {new Date(selectedFacture.date_emission).toLocaleDateString('fr-FR')}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFacture(null)}
                style={{ background: 'none', border: 'none', fontSize: 20, color: '#94A3B8', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: 20, padding: 14, background: '#FAF8F5', borderRadius: 8, fontSize: 13 }}>
              <div><strong>Client :</strong> {selectedFacture.client_nom}</div>
              {selectedFacture.client_tel && <div><strong>Contact :</strong> {selectedFacture.client_tel}</div>}
              <div><strong>Prestation :</strong> {selectedFacture.type_facture.replace(/_/g, ' ')}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Montant HT :</span>
                <span style={{ fontWeight: 700 }}>{Number(selectedFacture.montant_ht).toLocaleString('fr-FR')} FCFA</span>
              </div>
              {selectedFacture.montant_tva > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                  <span>TVA ({selectedFacture.taux_tva}%) :</span>
                  <span>{Number(selectedFacture.montant_tva).toLocaleString('fr-FR')} FCFA</span>
                </div>
              )}
              {selectedFacture.timbre_fiscal > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                  <span>Droit de timbre fiscal :</span>
                  <span>{Number(selectedFacture.timbre_fiscal).toLocaleString('fr-FR')} FCFA</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 900, color: 'var(--navy, #1C2B4A)', borderTop: '2px solid var(--border, #E8DDD2)', paddingTop: 10 }}>
                <span>Total Net à Payer (TTC) :</span>
                <span style={{ color: 'var(--accent, #C75B00)' }}>
                  {Number(selectedFacture.montant_ttc).toLocaleString('fr-FR')} FCFA
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => setSelectedFacture(null)}
                style={{
                  padding: '9px 16px',
                  borderRadius: 8,
                  background: '#FAF8F5',
                  border: '1px solid var(--border, #E8DDD2)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '9px 18px',
                  borderRadius: 8,
                  background: 'var(--navy, #1C2B4A)',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Printer size={15} />
                Imprimer la facture
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
