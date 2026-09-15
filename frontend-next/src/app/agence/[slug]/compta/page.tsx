'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  DollarSign,
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  FileText,
  Building2,
  Download
} from 'lucide-react'

interface MoisBilan {
  periode: string
  encaisse: number
  attendu: number
  honoraires: number
  nb_echeances: number
}

interface BilanData {
  total_loyers_encaisses: number
  total_loyers_attendus: number
  total_impayes: number
  nb_impayes: number
  nb_quittances_emises: number
  taux_commission_moyen: number
  honoraires_gestion_bruts: number
  reversement_bailleurs_net: number
  total_depenses_travaux: number
  historique_mensuel: MoisBilan[]
}

export default function AgenceComptaPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [bilan, setBilan] = useState<BilanData | null>(null)
  const [loading, setLoading] = useState(true)

  async function chargerCompta() {
    try {
      setLoading(true)
      const res = await fetch(`/api/locatif-immo/agence/${slug}/compta`)
      const data = await res.json()
      if (data.success) {
        setBilan(data.bilan)
      }
    } catch (err) {
      console.error('[LOAD_COMPTA_ERR]', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (slug) chargerCompta()
  }, [slug])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748B' }}>
        <p>Calcul des états financiers de l'agence...</p>
      </div>
    )
  }

  const b = bilan || {
    total_loyers_encaisses: 0,
    total_loyers_attendus: 0,
    total_impayes: 0,
    nb_impayes: 0,
    nb_quittances_emises: 0,
    taux_commission_moyen: 10,
    honoraires_gestion_bruts: 0,
    reversement_bailleurs_net: 0,
    total_depenses_travaux: 0,
    historique_mensuel: [],
  }

  return (
    <div>
      {/* ── En-tête ── */}
      <div className="agence-header">
        <div>
          <h1 className="agence-title">Comptabilité & Commissions</h1>
          <p className="agence-subtitle">Suivi des flux financiers, honoraires d'agence et reddition des comptes bailleurs.</p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '9px 16px',
            borderRadius: 8,
            background: '#FFFFFF',
            border: '1px solid var(--border, #E8DDD2)',
            color: 'var(--navy, #1C2B4A)',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          <Download size={15} />
          Imprimer le bilan
        </button>
      </div>

      {/* ── 4 Cartes Financières ── */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-title">Loyers Encaissés</span>
            <div className="kpi-card-icon" style={{ color: '#166534' }}>
              <ArrowDownRight size={18} />
            </div>
          </div>
          <div className="kpi-card-value" style={{ color: '#166534' }}>
            {Number(b.total_loyers_encaisses).toLocaleString('fr-FR')} F
          </div>
          <div className="kpi-card-sub">{b.nb_quittances_emises} quittance(s) émise(s)</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-title">Honoraires Agence</span>
            <div className="kpi-card-icon" style={{ color: 'var(--accent, #C75B00)' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="kpi-card-value" style={{ color: 'var(--accent, #C75B00)' }}>
            {Number(b.honoraires_gestion_bruts).toLocaleString('fr-FR')} F
          </div>
          <div className="kpi-card-sub">Taux moyen : {b.taux_commission_moyen}%</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-title">Reversement Bailleurs</span>
            <div className="kpi-card-icon" style={{ color: 'var(--navy, #1C2B4A)' }}>
              <Building2 size={18} />
            </div>
          </div>
          <div className="kpi-card-value">
            {Number(b.reversement_bailleurs_net).toLocaleString('fr-FR')} F
          </div>
          <div className="kpi-card-sub">Montant net mandataires</div>
        </div>

        <div className="kpi-card" style={{ borderColor: b.total_impayes > 0 ? '#FCA5A5' : 'var(--border, #E8DDD2)' }}>
          <div className="kpi-card-header">
            <span className="kpi-card-title">Impayés à Recouvrer</span>
            <div className="kpi-card-icon" style={{ color: b.total_impayes > 0 ? '#DC2626' : '#166534' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div className="kpi-card-value" style={{ color: b.total_impayes > 0 ? '#DC2626' : 'var(--navy, #1C2B4A)' }}>
            {Number(b.total_impayes).toLocaleString('fr-FR')} F
          </div>
          <div className="kpi-card-sub">{b.nb_impayes} dossier(s) en retard</div>
        </div>
      </div>

      {/* ── Ventilation Mensuelle ── */}
      <div className="agence-card">
        <div className="agence-card-header">
          <div className="agence-card-title">
            <Calendar size={18} />
            Historique & Reddition des Comptes Mensuels
          </div>
        </div>

        {b.historique_mensuel.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '30px 0', color: '#64748B' }}>
            Aucun historique d'encaissement disponible pour le moment.
          </p>
        ) : (
          <div className="agence-table-wrapper">
            <table className="agence-table">
              <thead>
                <tr>
                  <th>Mois / Période</th>
                  <th>Loyers Attendus</th>
                  <th>Loyers Encaissés</th>
                  <th>Honoraires Agence</th>
                  <th>Reversé Bailleur</th>
                  <th>Taux Recouvrement</th>
                </tr>
              </thead>
              <tbody>
                {b.historique_mensuel.map(m => {
                  const taux = m.attendu > 0 ? Math.round((m.encaisse / m.attendu) * 100) : 0
                  const reversement = m.encaisse - m.honoraires
                  return (
                    <tr key={m.periode}>
                      <td>
                        <span style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>{m.periode}</span>
                      </td>
                      <td>{Number(m.attendu).toLocaleString('fr-FR')} FCFA</td>
                      <td>
                        <span style={{ fontWeight: 750, color: '#166534' }}>
                          {Number(m.encaisse).toLocaleString('fr-FR')} FCFA
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 750, color: 'var(--accent, #C75B00)' }}>
                          {Number(m.honoraires).toLocaleString('fr-FR')} FCFA
                        </span>
                      </td>
                      <td>{Number(reversement).toLocaleString('fr-FR')} FCFA</td>
                      <td>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: 12,
                            fontSize: 12,
                            fontWeight: 800,
                            background: taux >= 90 ? '#DCFCE7' : taux >= 50 ? '#FEF3C7' : '#FEE2E2',
                            color: taux >= 90 ? '#166534' : taux >= 50 ? '#92400E' : '#991B1B',
                          }}
                        >
                          {taux}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
