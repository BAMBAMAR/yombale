'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  DollarSign,
  TrendingUp,
  ArrowDownRight,
  Calendar,
  Building2,
  Download,
  Briefcase,
  Wallet
} from 'lucide-react'
import ExportCsvButton from '../../components/ExportCsvButton'

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
  commissions_vente_brutes: number
  commissions_vente_payees: number
  factures_honoraires_encaisses: number
  chiffre_affaires_global: number
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
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}

      const res = await fetch(`/api/locatif-immo/agence/${slug}/compta`, { headers })
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
        <p>Calcul des états financiers réels de l'agence...</p>
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
    commissions_vente_brutes: 0,
    commissions_vente_payees: 0,
    factures_honoraires_encaisses: 0,
    chiffre_affaires_global: 0,
    historique_mensuel: [],
  }

  return (
    <div>
      {/* ── En-tête ── */}
      <div className="agence-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="agence-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Wallet size={22} color="var(--accent, #C75B00)" />
            <span>Comptabilité &amp; Commissions de l'Agence</span>
          </h1>
          <p className="agence-subtitle">
            Suivi des flux financiers réels : encaissements de loyers, commissions de vente, honoraires et reversements.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <ExportCsvButton slug={slug} type="transactions" label="Exporter CSV" />
          <button
            type="button"
            onClick={() => window.print()}
            className="agence-btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Download size={15} />
            <span>Imprimer le bilan</span>
          </button>
        </div>
      </div>

      {/* ── Bannière Synthèse Chiffre d'Affaires Global ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--navy, #1C2B4A) 0%, #2A3F6D 100%)',
          borderRadius: 12,
          padding: '20px 24px',
          color: '#FFFFFF',
          marginBottom: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div style={{ fontSize: 13, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
            Revenus Cumulés &amp; Honoraires d'Agence Encaissés
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, marginTop: 4, color: '#FFFFFF' }}>
            {Number(b.chiffre_affaires_global).toLocaleString('fr-FR')} FCFA
          </div>
          <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
            Comprend les honoraires de gérance ({Number(b.honoraires_gestion_bruts).toLocaleString('fr-FR')} F) et les factures d'honoraires réglées ({Number(b.factures_honoraires_encaisses).toLocaleString('fr-FR')} F).
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '10px 16px', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 11, opacity: 0.8 }}>Loyers Traités</div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>{Number(b.total_loyers_encaisses).toLocaleString('fr-FR')} F</div>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '10px 16px', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 11, opacity: 0.8 }}>Reversement Bailleurs</div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>{Number(b.reversement_bailleurs_net).toLocaleString('fr-FR')} F</div>
          </div>
        </div>
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
            <span className="kpi-card-title">Honoraires Gestion Locative</span>
            <div className="kpi-card-icon" style={{ color: 'var(--accent, #C75B00)' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="kpi-card-value" style={{ color: 'var(--accent, #C75B00)' }}>
            {Number(b.honoraires_gestion_bruts).toLocaleString('fr-FR')} F
          </div>
          <div className="kpi-card-sub">Taux moyen mandat : {b.taux_commission_moyen}%</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-title">Net Reversé Bailleurs</span>
            <div className="kpi-card-icon" style={{ color: 'var(--navy, #1C2B4A)' }}>
              <Building2 size={18} />
            </div>
          </div>
          <div className="kpi-card-value">
            {Number(b.reversement_bailleurs_net).toLocaleString('fr-FR')} F
          </div>
          <div className="kpi-card-sub">Montant reversé aux propriétaires</div>
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
          <div className="kpi-card-sub">{b.nb_impayes} échéance(s) en retard</div>
        </div>
      </div>

      {/* ── Ventilation Mensuelle & Reddition ── */}
      <div className="agence-card" style={{ marginTop: 20 }}>
        <div className="agence-card-header">
          <div className="agence-card-title">
            <Calendar size={18} />
            Historique &amp; Reddition des Comptes Mensuels (Périodes Récentes)
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
                        <strong style={{ color: 'var(--navy, #1C2B4A)' }}>{m.periode}</strong>
                        <div style={{ fontSize: 11, color: '#64748B' }}>{m.nb_echeances} échéance(s)</div>
                      </td>
                      <td>{Number(m.attendu).toLocaleString('fr-FR')} FCFA</td>
                      <td>
                        <span style={{ fontWeight: 750, color: m.encaisse > 0 ? '#166534' : 'inherit' }}>
                          {Number(m.encaisse).toLocaleString('fr-FR')} FCFA
                        </span>
                      </td>
                      <td>
                        <span style={{ color: 'var(--accent, #C75B00)', fontWeight: 700 }}>
                          {Number(m.honoraires).toLocaleString('fr-FR')} FCFA
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
                          {Number(reversement).toLocaleString('fr-FR')} FCFA
                        </span>
                      </td>
                      <td>
                        <span
                          className={`status-badge ${taux === 100 ? 'actif' : taux > 0 ? 'partiel' : 'en_attente'}`}
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
