'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  FileText,
  Plus,
  CheckCircle2,
  DollarSign,
  Check,
  Building2,
  Eye,
  Pencil,
  ExternalLink
} from 'lucide-react'
import ModalCreerFactureImmo from './components/ModalCreerFactureImmo'
import ModalApercuFactureImmo from './components/ModalApercuFactureImmo'
import ModalEditerFactureImmo from './components/ModalEditerFactureImmo'
import ExportCsvButton from '../../components/ExportCsvButton'

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
  prix_vente?: number
  prix_location?: number
}

export default function AgenceFacturesPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [factures, setFactures] = useState<FactureItem[]>([])
  const [biens, setBiens] = useState<BienOption[]>([])
  const [loading, setLoading] = useState(true)
  const [filtreStatut, setFiltreStatut] = useState('tous')
  const [filtreType, setFiltreType] = useState('tous')

  // Modales
  const [showModalCreer, setShowModalCreer] = useState(false)
  const [selectedFacture, setSelectedFacture] = useState<FactureItem | null>(null)
  const [factureAEditer, setFactureAEditer] = useState<FactureItem | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  async function chargerDonnees() {
    try {
      setLoading(true)
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}

      const [resFactures, resBiens] = await Promise.all([
        fetch(`/api/factures-immo/agence/${slug}`, { headers }),
        fetch(`/api/biens/agence/${slug}?statut=actif`, { headers }),
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

  async function handleEncaisserFacture(factureId: string) {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      }

      const res = await fetch(`/api/factures-immo/agence/${slug}/${factureId}/encaisser`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ mode_paiement: 'wave' }),
      })
      const data = await res.json()
      if (data.success) {
        setToastMsg('Facture d\'honoraires marquée comme payée avec succès.')
        chargerDonnees()
        setTimeout(() => setToastMsg(null), 3000)
      }
    } catch (err) {
      console.error('[ENCAISSER_FACTURE_ERR]', err)
    }
  }

  const facturesFiltrees = factures.filter(f => {
    if (filtreStatut !== 'tous' && f.statut !== filtreStatut) return false
    if (filtreType !== 'tous' && f.type_facture !== filtreType) return false
    return true
  })

  const totalFacture = factures.reduce((sum, f) => sum + Number(f.montant_ttc || 0), 0)
  const totalEncaisse = factures.filter(f => f.statut === 'payee').reduce((sum, f) => sum + Number(f.montant_ttc || 0), 0)

  const typeLabels: Record<string, string> = {
    honoraires_vente: 'Transaction & Vente',
    gestion_locative: 'Gestion Locative',
    honoraires_location: 'Rédaction Bail',
    debours_travaux: 'Débours Travaux',
    expertise: 'Expertise & Avis Valeur',
  }

  return (
    <div>
      {/* ── En-tête avec Actions ── */}
      <div className="agence-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="agence-title">Facturation & Honoraires d'Agence</h1>
          <p className="agence-subtitle">
            Émission des factures professionnelles pour transactions, mandats de gestion, débours et expertises.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <ExportCsvButton slug={slug} type="transactions" label="Exporter CSV" />
          <button
            type="button"
            onClick={() => setShowModalCreer(true)}
            className="agence-btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={16} />
            <span>Nouvelle Facture</span>
          </button>
        </div>
      </div>

      {/* ── Bannière Distinction Métier Agence vs Boutique ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(28, 43, 74, 0.04) 0%, rgba(199, 91, 0, 0.05) 100%)',
          border: '1px solid var(--border, #E8DDD2)',
          borderRadius: 10,
          padding: '12px 16px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'var(--navy, #1C2B4A)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Building2 size={16} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
              Spécificité Facturation Agence vs Commerce / Boutique
            </div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 1 }}>
              Notes d'honoraires &amp; débours réglementés par le COCC (Commissions transactions, gérance locative, rédaction de baux). Chaque note intègre le bien rattaché, la TVA 18% et le timbre fiscal 100 FCFA.
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <span className="badge-npl" style={{ fontSize: 11, background: '#E0F2FE', color: '#0369A1' }}>
            COCC Sénégal
          </span>
          <span className="badge-npl" style={{ fontSize: 11, background: '#FEF3C7', color: '#92400E' }}>
            TVA 18% &amp; Timbre 100 F
          </span>
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

      {/* ── Cartes KPIs Métier Agence ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 20 }}>
        <div className="agence-kpi-card">
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>Total Facturé (TTC)</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--navy, #1C2B4A)', marginTop: 4 }}>
            {totalFacture.toLocaleString('fr-FR')} FCFA
          </div>
        </div>

        <div className="agence-kpi-card">
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>Honoraires Encaissés</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#0A5C36', marginTop: 4 }}>
            {totalEncaisse.toLocaleString('fr-FR')} FCFA
          </div>
        </div>

        <div className="agence-kpi-card">
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>En Attente de Règlement</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--accent, #C75B00)', marginTop: 4 }}>
            {(totalFacture - totalEncaisse).toLocaleString('fr-FR')} FCFA
          </div>
        </div>
      </div>

      {/* ── Filtres ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <select
          value={filtreStatut}
          onChange={e => setFiltreStatut(e.target.value)}
          style={{
            padding: '7px 12px',
            borderRadius: 8,
            border: '1px solid var(--border, #E8DDD2)',
            fontSize: 13,
            fontWeight: 650,
            background: '#FFF',
          }}
        >
          <option value="tous">Tous les statuts</option>
          <option value="en_attente">En attente de paiement</option>
          <option value="payee">Factures réglées</option>
        </select>

        <select
          value={filtreType}
          onChange={e => setFiltreType(e.target.value)}
          style={{
            padding: '7px 12px',
            borderRadius: 8,
            border: '1px solid var(--border, #E8DDD2)',
            fontSize: 13,
            fontWeight: 650,
            background: '#FFF',
          }}
        >
          <option value="tous">Toutes les prestations</option>
          <option value="honoraires_vente">Transactions &amp; Ventes</option>
          <option value="gestion_locative">Gestion Locative</option>
          <option value="honoraires_location">Rédaction de Bail</option>
          <option value="debours_travaux">Débours &amp; Travaux</option>
          <option value="expertise">Expertise &amp; Estimations</option>
        </select>
      </div>

      {/* ── Tableau des Factures d'Honoraires ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748B' }}>
          <p>Chargement du journal des factures d'honoraires...</p>
        </div>
      ) : facturesFiltrees.length === 0 ? (
        <div className="agence-card" style={{ textAlign: 'center', padding: '50px 20px', color: '#64748B' }}>
          <FileText size={36} style={{ margin: '0 auto 12px', opacity: 0.5, color: 'var(--accent, #C75B00)' }} />
          <p style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)', fontSize: 17 }}>Aucune facture d'honoraires émise</p>
          <p style={{ fontSize: 13.5, maxWidth: 450, margin: '6px auto 16px' }}>
            Émettez une facture professionnelle d'honoraires pour une transaction, une gestion locative ou des débours.
          </p>
          <button
            type="button"
            onClick={() => setShowModalCreer(true)}
            className="agence-btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, margin: '0 auto' }}
          >
            <Plus size={16} />
            <span>Émettre ma première facture</span>
          </button>
        </div>
      ) : (
        <div className="agence-table-wrapper">
          <table className="agence-table">
            <thead>
              <tr>
                <th>Réf. &amp; Émission</th>
                <th>Client / Mandant</th>
                <th>Prestation Immobilière</th>
                <th>Montant Net TTC</th>
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
                    <div style={{ fontWeight: 650, color: 'var(--navy, #1C2B4A)', fontSize: 13 }}>
                      {typeLabels[fact.type_facture] || fact.type_facture.replace(/_/g, ' ')}
                    </div>
                    {fact.bien_titre && (
                      <div style={{ fontSize: 11.5, color: '#64748B' }}>
                        Bien : {fact.bien_titre}
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                      {Number(fact.montant_ttc).toLocaleString('fr-FR')} FCFA
                    </div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>
                      HT : {Number(fact.montant_ht).toLocaleString('fr-FR')} F • TVA : {fact.taux_tva}%
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${fact.statut === 'payee' ? 'actif' : 'en_attente'}`}>
                      {fact.statut === 'payee' ? 'Payée' : 'En attente'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, alignItems: 'center' }}>
                      {fact.statut !== 'payee' && (
                        <button
                          type="button"
                          onClick={() => handleEncaisserFacture(fact.id)}
                          style={{ padding: '5px 10px', borderRadius: 6, background: '#0A5C36', color: '#FFFFFF', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                        >
                          Encaisser
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setSelectedFacture(fact)}
                        style={{ padding: '5px 9px', borderRadius: 6, background: '#FAF8F5', border: '1px solid var(--border, #E8DDD2)', color: 'var(--navy, #1C2B4A)', cursor: 'pointer' }}
                        title="Aperçu de la facture"
                      >
                        <Eye size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setFactureAEditer(fact)}
                        style={{ padding: '5px 9px', borderRadius: 6, background: '#FAF8F5', border: '1px solid var(--border, #E8DDD2)', color: 'var(--navy, #1C2B4A)', cursor: 'pointer' }}
                        title="Modifier la facture"
                      >
                        <Pencil size={13} />
                      </button>

                      {(() => {
                        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
                        const pdfUrl = `/api/agences/agence/${slug}/documents/facture/${fact.id}.pdf${token ? `?token=${encodeURIComponent(token)}` : ''}`
                        return (
                          <a
                            href={pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 6, background: '#F1F5F9', border: '1px solid #CBD5E1', color: 'var(--navy, #1C2B4A)', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}
                            title="Télécharger la Facture PDF officielle"
                          >
                            <FileText size={13} />
                            <span>PDF</span>
                          </a>
                        )
                      })()}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modale Création Facture Immobilière ── */}
      {showModalCreer && (
        <ModalCreerFactureImmo
          slug={slug}
          biens={biens}
          onClose={() => setShowModalCreer(false)}
          onSuccess={(msg) => {
            setToastMsg(msg)
            chargerDonnees()
            setTimeout(() => setToastMsg(null), 4000)
          }}
        />
      )}

      {/* ── Modale Modification Facture Immobilière ── */}
      {factureAEditer && (
        <ModalEditerFactureImmo
          slug={slug}
          facture={factureAEditer}
          biens={biens}
          onClose={() => setFactureAEditer(null)}
          onSuccess={(msg) => {
            setToastMsg(msg)
            chargerDonnees()
            setTimeout(() => setToastMsg(null), 4000)
          }}
        />
      )}

      {/* ── Modale Aperçu Facture Immobilière ── */}
      {selectedFacture && (
        <ModalApercuFactureImmo
          slug={slug}
          facture={selectedFacture}
          onClose={() => setSelectedFacture(null)}
          onEncaisser={(id) => handleEncaisserFacture(id)}
        />
      )}
    </div>
  )
}
