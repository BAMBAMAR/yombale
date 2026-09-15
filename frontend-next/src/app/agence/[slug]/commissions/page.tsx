'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Percent,
  Search,
  CheckCircle2,
  Clock,
  Check,
  TrendingUp,
  RefreshCw,
  Wallet,
  DollarSign
} from 'lucide-react'

interface CommissionItem {
  id: string
  transaction_id: string
  montant_brut: number
  montant_paye: number
  montant_restant: number
  statut: string
  date_prevue?: string
  date_paiement?: string
  notes?: string
  created_at: string
  type_transaction?: string
  transaction_montant?: number
  bien_titre?: string
  bien_quartier?: string
  bien_ville?: string
  agent_nom?: string
  agent_prenom?: string
  courtier_nom?: string
  courtier_prenom?: string
  courtier_email?: string
  repartition?: any
}

export default function AgenceCommissionsPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [commissions, setCommissions] = useState<CommissionItem[]>([])
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [payingId, setPayingId] = useState<string | null>(null)
  const [filterStatut, setFilterStatut] = useState('tous')
  const [searchTerm, setSearchTerm] = useState('')

  async function chargerDonnees() {
    try {
      setLoading(true)
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}

      const [resCom, resStats] = await Promise.all([
        fetch(`/api/commissions-immo/agence/${slug}?statut=${filterStatut}&search=${encodeURIComponent(searchTerm)}`, { headers }),
        fetch(`/api/commissions-immo/agence/${slug}/stats`, { headers }),
      ])

      const [dC, dS] = await Promise.all([resCom.json(), resStats.json()])

      if (dC.success) setCommissions(dC.commissions || [])
      if (dS.success) setStats(dS.stats || {})
    } catch (err) {
      console.error('[LOAD_COMMISSIONS_ERR]', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (slug) chargerDonnees()
  }, [slug, filterStatut])

  async function handleReglerCommission(com: CommissionItem) {
    const confirmVal = window.prompt(
      `Montant à encaisser/verser pour cette commission (Reste: ${com.montant_restant.toLocaleString('fr-FR')} FCFA) :`,
      String(com.montant_restant)
    )
    if (!confirmVal) return
    const montant = Number(confirmVal)
    if (isNaN(montant) || montant <= 0) return

    try {
      setPayingId(com.id)
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const res = await fetch(`/api/commissions-immo/agence/${slug}/${com.id}/regler`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ montant_verse: montant }),
      })
      if (res.ok) {
        chargerDonnees()
      }
    } catch (err) {
      console.error('[PAY_COMMISSION_ERR]', err)
    } finally {
      setPayingId(null)
    }
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 40 }}>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Percent size={24} color="var(--accent, #C75B00)" />
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: 'var(--navy, #1C2B4A)' }}>
              Commissions & Honoraires d&apos;Agence
            </h1>
          </div>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0 0' }}>
            Suivi des honoraires perçus sur les ventes/baux et répartition avec les agents négociateurs
          </p>
        </div>
      </div>

      {/* Grille KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
        <div style={{ background: '#fff', padding: '14px 16px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>Honoraires Bruts Générés</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
            {Number(stats.total_brut || 0).toLocaleString('fr-FR')} FCFA
          </div>
        </div>

        <div style={{ background: '#fff', padding: '14px 16px', borderRadius: 10, border: '1px solid #bbf7d0' }}>
          <div style={{ fontSize: 12, color: '#15803d', fontWeight: 600, marginBottom: 4 }}>Honoraires Encaissés ✓</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#15803d' }}>
            {Number(stats.total_encaisse || 0).toLocaleString('fr-FR')} FCFA
          </div>
        </div>

        <div style={{ background: '#fff', padding: '14px 16px', borderRadius: 10, border: '1px solid #fde68a' }}>
          <div style={{ fontSize: 12, color: '#b45309', fontWeight: 600, marginBottom: 4 }}>En Attente d&apos;Encaissement</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#b45309' }}>
            {Number(stats.total_restant || 0).toLocaleString('fr-FR')} FCFA
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Rechercher par bien, agent..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && chargerDonnees()}
            style={{ width: '100%', padding: '8px 10px 8px 32px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
          />
        </div>

        <select
          value={filterStatut}
          onChange={e => setFilterStatut(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, background: '#fff' }}
        >
          <option value="tous">Tous les statuts</option>
          <option value="en_attente">En attente</option>
          <option value="partiellement_payee">Partiellement réglé</option>
          <option value="payee">Intégralement réglé</option>
        </select>

        <button
          type="button"
          onClick={chargerDonnees}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
          title="Actualiser"
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
        </button>
      </div>

      {/* Tableau des commissions */}
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
            Chargement des commissions…
          </div>
        ) : commissions.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <Percent size={40} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#334155', margin: 0 }}>Aucune commission enregistrée</h3>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: '4px 0 0' }}>
              Les honoraires sont générés automatiquement lors de la clôture des transactions et signatures de baux.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Transaction & Bien</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Négociateur & Courtier</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Montant Brut</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Encaissé / Solde</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Statut</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {commissions.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
                        {c.bien_titre || 'Transaction immobilière'}
                      </div>
                      <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>
                        Montant acte : {Number(c.transaction_montant || 0).toLocaleString('fr-FR')} FCFA ({c.type_transaction})
                      </div>
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>
                        {c.agent_nom ? `${c.agent_prenom || ''} ${c.agent_nom}`.trim() : 'Agence (Direct)'}
                      </div>
                      {c.courtier_nom && (
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          marginTop: 4,
                          padding: '2px 7px',
                          borderRadius: 6,
                          background: '#DCFCE7',
                          color: '#166534',
                          fontSize: 11,
                          fontWeight: 700,
                          border: '1px solid #BBF7D0'
                        }}>
                          <span>Courtier : {c.courtier_prenom ? `${c.courtier_prenom} ${c.courtier_nom}` : c.courtier_nom}</span>
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 14 }}>
                        {Number(c.montant_brut).toLocaleString('fr-FR')} FCFA
                      </div>
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: 12.5, color: '#15803d', fontWeight: 700 }}>
                        {Number(c.montant_paye).toLocaleString('fr-FR')} FCFA payés
                      </div>
                      {Number(c.montant_restant) > 0 && (
                        <div style={{ fontSize: 11.5, color: '#dc2626', fontWeight: 600, marginTop: 1 }}>
                          Reste : {Number(c.montant_restant).toLocaleString('fr-FR')} FCFA
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        display: 'inline-block',
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 6,
                        background: c.statut === 'payee' ? '#f0fdf4' : c.statut === 'partiellement_payee' ? '#fef3c7' : '#f8fafc',
                        color: c.statut === 'payee' ? '#166534' : c.statut === 'partiellement_payee' ? '#92400e' : '#475569',
                      }}>
                        {c.statut === 'payee' ? 'Intégralement réglé' : c.statut === 'partiellement_payee' ? 'Partiel' : 'En attente'}
                      </span>
                    </td>

                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      {c.statut !== 'payee' && (
                        <button
                          type="button"
                          onClick={() => handleReglerCommission(c)}
                          disabled={payingId === c.id}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            background: '#f0fdf4',
                            color: '#15803d',
                            border: '1px solid #bbf7d0',
                            borderRadius: 6,
                            padding: '5px 10px',
                            fontSize: 11.5,
                            fontWeight: 700,
                            cursor: payingId === c.id ? 'not-allowed' : 'pointer',
                          }}
                        >
                          <Check size={13} />
                          <span>Encaisser</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
