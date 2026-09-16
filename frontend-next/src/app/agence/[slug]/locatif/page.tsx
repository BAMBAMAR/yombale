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
  Calendar,
  Download,
  ExternalLink,
  Pencil
} from 'lucide-react'
import ModalCreerBail from './components/ModalCreerBail'
import ModalEncaisserLoyer from './components/ModalEncaisserLoyer'
import ModalEditerQuittanceImmo from './components/ModalEditerQuittanceImmo'
import TableBauxImmo, { BailItem } from './components/TableBauxImmo'
import ExportCsvButton from '../../components/ExportCsvButton'
import { getImmoAuthHeaders, getImmoAuthToken } from '@/lib/immo-auth'

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

  // Modales
  const [showCreerBail, setShowCreerBail] = useState(false)
  const [selectedLoyer, setSelectedLoyer] = useState<LoyerEcheance | null>(null)
  const [loyerAEditer, setLoyerAEditer] = useState<LoyerEcheance | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  async function chargerDonnees() {
    try {
      setLoading(true)
      const headers = getImmoAuthHeaders()

      const [resBaux, resLoyers] = await Promise.all([
        fetch(`/api/locatif-immo/agence/${slug}/baux`, { headers }),
        fetch(`/api/locatif-immo/agence/${slug}/loyers`, { headers }),
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

  async function handleRelance(loyerId: string) {
    try {
      const headers = getImmoAuthHeaders()

      const res = await fetch(`/api/locatif-immo/agence/${slug}/loyers/${loyerId}/relance`, {
        method: 'POST',
        headers,
      })
      const data = await res.json()
      if (data.success) {
        setToastMsg('Rappel et relance de loyer enregistrés avec succès.')
        chargerDonnees()
        setTimeout(() => setToastMsg(null), 4000)
      }
    } catch (err) {
      console.error('[RELANCE_ERR]', err)
    }
  }

  return (
    <div>
      {/* ── En-tête avec actions ── */}
      <div className="agence-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="agence-title">Gestion Locative & Loyers</h1>
          <p className="agence-subtitle">Suivi des baux actifs, encaissement des loyers et quittances numériques certifiées.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <ExportCsvButton slug={slug} type={tab === 'loyers' ? 'loyers' : 'baux'} label={`Exporter ${tab === 'loyers' ? 'Loyers' : 'Baux'} CSV`} />
          <button
            type="button"
            onClick={() => setShowCreerBail(true)}
            className="agence-btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={16} />
            <span>Nouveau Bail</span>
          </button>
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
          Échéances & Encaissements ({loyers.length})
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
            <div className="agence-card" style={{ textAlign: 'center', padding: '50px 20px', color: '#64748B' }}>
              <DollarSign size={36} style={{ margin: '0 auto 12px', opacity: 0.5, color: 'var(--accent, #C75B00)' }} />
              <p style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)', fontSize: 17 }}>Aucune échéance de loyer générée</p>
              <p style={{ fontSize: 13.5, maxWidth: 450, margin: '6px auto 16px' }}>
                Créez un contrat de bail pour que le système génère automatiquement l'échéancier des 12 prochains mois.
              </p>
              <button
                type="button"
                onClick={() => setShowCreerBail(true)}
                className="agence-btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, margin: '0 auto' }}
              >
                <Plus size={16} />
                <span>Créer mon premier bail</span>
              </button>
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
                          <div style={{ fontSize: 11.5, color: '#0A5C36', fontWeight: 600 }}>
                            Acompte : {Number(l.montant_paye).toLocaleString('fr-FR')} FCFA
                          </div>
                        )}
                      </td>
                      <td>
                        {l.statut === 'paye' && <span className="status-badge actif">Payé</span>}
                        {l.statut === 'en_attente' && <span className="status-badge brouillon">En attente</span>}
                        {l.statut === 'retard' && <span className="status-badge suspendu">En retard</span>}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                          {l.statut !== 'paye' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => setSelectedLoyer(l)}
                                style={{
                                  padding: '5px 10px',
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
                                title="Envoyer une relance"
                              >
                                <Send size={13} />
                              </button>
                            </>
                          ) : (
                            <a
                              href={`/api/agences/agence/${slug}/documents/quittance/${l.id}.pdf${getImmoAuthToken() ? `?token=${encodeURIComponent(getImmoAuthToken()!)}` : ''}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                padding: '5px 10px',
                                borderRadius: 6,
                                background: '#ECFDF5',
                                border: '1px solid #A7F3D0',
                                color: '#065F46',
                                fontSize: 12,
                                fontWeight: 700,
                                textDecoration: 'none',
                              }}
                              title="Télécharger la Quittance de loyer officielle"
                            >
                              <FileText size={13} />
                              <span>Quittance PDF</span>
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => setLoyerAEditer(l)}
                            style={{
                              padding: '5px 8px',
                              borderRadius: 6,
                              background: '#FAF8F5',
                              border: '1px solid var(--border, #E8DDD2)',
                              color: 'var(--navy, #1C2B4A)',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                            title="Modifier les montants, statut ou références de la quittance"
                          >
                            <Pencil size={13} />
                          </button>
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

      {/* ── Tableau des Baux (Modulaire) ── */}
      {tab === 'baux' && (
        <TableBauxImmo
          slug={slug}
          baux={baux}
          onNouveauBail={() => setShowCreerBail(true)}
        />
      )}

      {/* ── Modale Création Nouveau Bail ── */}
      {showCreerBail && (
        <ModalCreerBail
          slug={slug}
          onClose={() => setShowCreerBail(false)}
          onSuccess={(msg) => {
            setToastMsg(msg)
            chargerDonnees()
            setTimeout(() => setToastMsg(null), 5000)
          }}
        />
      )}

      {/* ── Modale d'Encaissement de Loyer ── */}
      {selectedLoyer && (
        <ModalEncaisserLoyer
          slug={slug}
          loyer={selectedLoyer}
          onClose={() => setSelectedLoyer(null)}
          onSuccess={(msg) => {
            setToastMsg(msg)
            setSelectedLoyer(null)
            chargerDonnees()
            setTimeout(() => setToastMsg(null), 5000)
          }}
        />
      )}

      {/* ── Modale de Modification de Quittance / Terme ── */}
      {loyerAEditer && (
        <ModalEditerQuittanceImmo
          slug={slug}
          loyer={loyerAEditer}
          onClose={() => setLoyerAEditer(null)}
          onSuccess={(msg) => {
            setToastMsg(msg)
            setLoyerAEditer(null)
            chargerDonnees()
            setTimeout(() => setToastMsg(null), 4000)
          }}
        />
      )}
    </div>
  )
}
