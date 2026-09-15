'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  Key,
  Plus,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Phone,
  FileText,
  Send,
  Calendar
} from 'lucide-react'

interface BailItem {
  id: string
  bien_titre: string
  locataire_nom: string
  locataire_prenom?: string
  locataire_tel?: string
  loyer_mensuel: number
  charges: number
  date_debut: string
  date_fin?: string
  statut: string
  nb_impayes: number
}

interface LoyerEcheance {
  id: string
  periode: string
  date_echeance: string
  montant_du: number
  montant_paye: number
  montant_restant: number
  statut: string
  quittance_url?: string
  bien_titre: string
  locataire_nom: string
  locataire_prenom?: string
  locataire_tel?: string
}

export default function LocatifPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [tab, setTab] = useState<'loyers' | 'baux'>('loyers')
  const [baux, setBaux] = useState<BailItem[]>([])
  const [loyers, setLoyers] = useState<LoyerEcheance[]>([])
  const [loading, setLoading] = useState(true)

  // Modale Encaissement
  const [selectedLoyer, setSelectedLoyer] = useState<LoyerEcheance | null>(null)
  const [montantEncaissement, setMontantEncaissement] = useState('')
  const [modePaiement, setModePaiement] = useState('wave')
  const [savingPaiement, setSavingPaiement] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  async function chargerDonnees() {
    try {
      setLoading(true)
      const [resBaux, resLoyers] = await Promise.all([
        fetch(`/api/locatif-immo/agence/${slug}/baux?statut=actif`),
        fetch(`/api/locatif-immo/agence/${slug}/loyers`),
      ])
      const dataBaux = await resBaux.json()
      const dataLoyers = await resLoyers.json()
      if (dataBaux.success) setBaux(dataBaux.baux || [])
      if (dataLoyers.success) setLoyers(dataLoyers.loyers || [])
    } catch (err) {
      console.error('[LOAD_LOCATIF_ERR]', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (slug) chargerDonnees()
  }, [slug])

  async function handleEncaisser(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedLoyer) return

    try {
      setSavingPaiement(true)
      const res = await fetch(`/api/locatif-immo/agence/${slug}/loyers/${selectedLoyer.id}/encaisser`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          montant: montantEncaissement ? parseFloat(montantEncaissement) : selectedLoyer.montant_du,
          mode_paiement: modePaiement,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setToastMsg(`Paiement enregistré ! Quittance générée : ${data.quittance_reference}`)
        setSelectedLoyer(null)
        chargerDonnees()
        setTimeout(() => setToastMsg(null), 5000)
      }
    } catch (err) {
      console.error('[ENCAISSER_ERR]', err)
    } finally {
      setSavingPaiement(false)
    }
  }

  async function handleRelance(loyerId: string) {
    try {
      const res = await fetch(`/api/locatif-immo/agence/${slug}/loyers/${loyerId}/relance`, {
        method: 'POST',
      })
      const data = await res.json()
      if (data.success) {
        setToastMsg('Relance de paiement envoyée avec succès.')
        chargerDonnees()
        setTimeout(() => setToastMsg(null), 4000)
      }
    } catch (err) {
      console.error('[RELANCE_ERR]', err)
    }
  }

  return (
    <div>
      {/* ── En-tête ── */}
      <div className="agence-header">
        <div>
          <h1 className="agence-title">Gestion Locative & Loyers</h1>
          <p className="agence-subtitle">Suivi des baux actifs, encaissement des loyers et quittances numériques.</p>
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
            marginBottom: 16,
          }}
        >
          <CheckCircle2 size={18} />
          {toastMsg}
        </div>
      )}

      {/* ── Onglets de bascule ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => setTab('loyers')}
          style={{
            padding: '8px 18px',
            borderRadius: 8,
            fontSize: 13.5,
            fontWeight: 750,
            cursor: 'pointer',
            border: '1px solid',
            borderColor: tab === 'loyers' ? 'var(--navy, #1C2B4A)' : 'var(--border, #E8DDD2)',
            background: tab === 'loyers' ? 'var(--navy, #1C2B4A)' : '#FFFFFF',
            color: tab === 'loyers' ? '#FFFFFF' : 'var(--navy, #1C2B4A)',
          }}
        >
          Échéances & Encaissements
        </button>
        <button
          type="button"
          onClick={() => setTab('baux')}
          style={{
            padding: '8px 18px',
            borderRadius: 8,
            fontSize: 13.5,
            fontWeight: 750,
            cursor: 'pointer',
            border: '1px solid',
            borderColor: tab === 'baux' ? 'var(--navy, #1C2B4A)' : 'var(--border, #E8DDD2)',
            background: tab === 'baux' ? 'var(--navy, #1C2B4A)' : '#FFFFFF',
            color: tab === 'baux' ? '#FFFFFF' : 'var(--navy, #1C2B4A)',
          }}
        >
          Baux Sous Gestion ({baux.length})
        </button>
      </div>

      {/* ── Tableau Échéances de Loyers ── */}
      {tab === 'loyers' && (
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748B' }}>
              <p>Chargement des échéances de loyers...</p>
            </div>
          ) : loyers.length === 0 ? (
            <div className="agence-card" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
              <DollarSign size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p style={{ fontWeight: 700, color: 'var(--navy, #1C2B4A)', fontSize: 16 }}>Aucune échéance générée</p>
              <p style={{ fontSize: 13.5 }}>Créez un bail pour générer automatiquement le calendrier des loyers.</p>
            </div>
          ) : (
            <div className="agence-table-wrapper">
              <table className="agence-table">
                <thead>
                  <tr>
                    <th>Période & Échéance</th>
                    <th>Bien & Locataire</th>
                    <th>Montant Dû</th>
                    <th>Statut</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loyers.map(l => (
                    <tr key={l.id}>
                      <td>
                        <div style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>{l.periode}</div>
                        <div style={{ fontSize: 11.5, color: '#64748B' }}>
                          Échéance : {new Date(l.date_echeance).toLocaleDateString('fr-FR')}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>{l.bien_titre}</div>
                        <div style={{ fontSize: 12, color: '#64748B' }}>
                          {l.locataire_nom} {l.locataire_prenom || ''}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                          {Number(l.montant_du).toLocaleString('fr-FR')} FCFA
                        </div>
                        {l.montant_paye > 0 && l.statut !== 'paye' && (
                          <div style={{ fontSize: 11.5, color: '#166534' }}>
                            Payé : {Number(l.montant_paye).toLocaleString('fr-FR')} FCFA
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`status-badge ${l.statut}`}>
                          {l.statut === 'paye' ? 'Payé' : l.statut === 'retard' ? 'En Retard' : l.statut}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                          {l.statut !== 'paye' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedLoyer(l)
                                  setMontantEncaissement(String(l.montant_restant || l.montant_du))
                                }}
                                style={{
                                  padding: '5px 12px',
                                  borderRadius: 6,
                                  background: 'var(--accent, #C75B00)',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  fontSize: 12,
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              >
                                Encaisser
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRelance(l.id)}
                                style={{
                                  padding: '5px 8px',
                                  borderRadius: 6,
                                  background: '#FAF8F5',
                                  border: '1px solid var(--border, #E8DDD2)',
                                  color: 'var(--navy, #1C2B4A)',
                                  cursor: 'pointer',
                                }}
                                title="Relance WhatsApp"
                              >
                                <Send size={13} />
                              </button>
                            </>
                          ) : (
                            <span style={{ fontSize: 11.5, color: '#166534', fontWeight: 700 }}>
                              ✓ Quittance #{l.quittance_url ? l.quittance_url.substring(0, 14) : 'OK'}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Tableau des Baux ── */}
      {tab === 'baux' && (
        <div className="agence-table-wrapper">
          <table className="agence-table">
            <thead>
              <tr>
                <th>Bien Loué</th>
                <th>Locataire</th>
                <th>Loyer Mensuel</th>
                <th>Date Début</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {baux.map(b => (
                <tr key={b.id}>
                  <td>
                    <div style={{ fontWeight: 750, color: 'var(--navy, #1C2B4A)' }}>{b.bien_titre}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700 }}>
                      {b.locataire_nom} {b.locataire_prenom || ''}
                    </div>
                    {b.locataire_tel && <div style={{ fontSize: 12, color: '#64748B' }}>{b.locataire_tel}</div>}
                  </td>
                  <td>
                    <div style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                      {Number(b.loyer_mensuel).toLocaleString('fr-FR')} FCFA
                    </div>
                  </td>
                  <td>{new Date(b.date_debut).toLocaleDateString('fr-FR')}</td>
                  <td>
                    <span className="status-badge actif">Actif</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modale d'Encaissement de Loyer ── */}
      {selectedLoyer && (
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
              maxWidth: 460,
              width: '100%',
              padding: 24,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <DollarSign size={20} color="var(--accent, #C75B00)" />
                <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
                  Encaisser le loyer — {selectedLoyer.periode}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLoyer(null)}
                style={{ background: 'none', border: 'none', fontSize: 20, color: '#94A3B8', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEncaisser}>
              <div style={{ marginBottom: 16, padding: 12, background: '#FAF8F5', borderRadius: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
                  {selectedLoyer.bien_titre}
                </div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                  Locataire : {selectedLoyer.locataire_nom} {selectedLoyer.locataire_prenom || ''}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Montant perçu (FCFA) *</label>
                <input
                  type="number"
                  required
                  value={montantEncaissement}
                  onChange={e => setMontantEncaissement(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mode de paiement *</label>
                <select
                  value={modePaiement}
                  onChange={e => setModePaiement(e.target.value)}
                  className="form-select"
                >
                  <option value="wave">Wave Sénégal</option>
                  <option value="orange_money">Orange Money</option>
                  <option value="especes">Espèces (Cash)</option>
                  <option value="virement">Virement bancaire</option>
                  <option value="cheque">Chèque</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button
                  type="button"
                  onClick={() => setSelectedLoyer(null)}
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
                  disabled={savingPaiement}
                  style={{
                    padding: '9px 18px',
                    borderRadius: 8,
                    background: 'var(--accent, #C75B00)',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 700,
                    cursor: savingPaiement ? 'not-allowed' : 'pointer',
                  }}
                >
                  {savingPaiement ? 'Validation...' : 'Valider & Générer quittance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
