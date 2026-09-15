'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Briefcase,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Layers,
  FileCheck,
  Building2
} from 'lucide-react'
import { ModalCreerTransaction } from './components/ModalCreerTransaction'

interface TransactionItem {
  id: string
  bien_id: string
  vendeur_id?: string
  acheteur_id?: string
  agent_id?: string
  courtier_id?: string
  courtier_nom?: string
  courtier_prenom?: string
  courtier_telephone?: string
  type_transaction: string
  montant: number
  date_transaction: string
  date_cloture?: string
  statut: string
  notes?: string
  bien_titre: string
  bien_quartier?: string
  bien_ville?: string
  bien_images?: string[]
  vendeur_nom?: string
  vendeur_telephone?: string
  acheteur_nom?: string
  acheteur_telephone?: string
  agent_nom?: string
  agent_prenom?: string
  commission_id?: string
  commission_montant?: number
  commission_statut?: string
}

const STAGES = [
  { key: 'en_cours', label: 'Offre acceptée', color: '#64748b', bg: '#f1f5f9' },
  { key: 'compromis_signe', label: 'Compromis signé', color: '#0369a1', bg: '#e0f2fe' },
  { key: 'sequestre_depose', label: 'Séquestre déposé', color: '#b45309', bg: '#fef3c7' },
  { key: 'acte_authentique', label: 'Acte authentique', color: '#7c3aed', bg: '#f5f3ff' },
  { key: 'cloturee', label: 'Clôturée & Actée', color: '#15803d', bg: '#f0fdf4' },
]

export default function AgenceTransactionsPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [transactions, setTransactions] = useState<TransactionItem[]>([])
  const [pipeline, setPipeline] = useState<any>({})
  const [biens, setBiens] = useState<any[]>([])
  const [contacts, setContacts] = useState<any[]>([])
  const [proprietaires, setProprietaires] = useState<any[]>([])
  const [courtiers, setCourtiers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [advancingId, setAdvancingId] = useState<string | null>(null)

  const [filterStatut, setFilterStatut] = useState('tous')
  const [searchTerm, setSearchTerm] = useState('')

  async function chargerDonnees() {
    try {
      setLoading(true)
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}

      const [resTx, resPipe, resBiens, resContacts, resProps, resMembres] = await Promise.all([
        fetch(`/api/transactions-immo/agence/${slug}?statut=${filterStatut}&search=${encodeURIComponent(searchTerm)}`, { headers }),
        fetch(`/api/transactions-immo/agence/${slug}/pipeline`, { headers }),
        fetch(`/api/biens/agence/${slug}?statut=actif`, { headers }),
        fetch(`/api/crm-immo/agence/${slug}/contacts`, { headers }),
        fetch(`/api/crm-immo/agence/${slug}/proprietaires`, { headers }),
        fetch(`/api/agences/${slug}/membres`, { headers }),
      ])

      const [dTx, dPipe, dB, dC, dP, dM] = await Promise.all([
        resTx.json(),
        resPipe.json(),
        resBiens.json(),
        resContacts.json(),
        resProps.json(),
        resMembres.json(),
      ])

      if (dTx.success) setTransactions(dTx.transactions || [])
      if (dPipe.success) setPipeline(dPipe.pipeline || {})
      if (dB.success) setBiens(dB.biens || [])
      if (dC.success) setContacts(dC.contacts || [])
      if (dP.success) setProprietaires(dP.proprietaires || [])
      if (dM.success) setCourtiers((dM.membres || []).filter((m: any) => m.role === 'courtier'))
    } catch (err) {
      console.error('[LOAD_TX_ERR]', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (slug) chargerDonnees()
  }, [slug, filterStatut])

  async function handleAvancerEtape(tx: TransactionItem) {
    const currentIdx = STAGES.findIndex(s => s.key === tx.statut)
    if (currentIdx < 0 || currentIdx >= STAGES.length - 1) return

    const nextStage = STAGES[currentIdx + 1]
    const confirmMsg = nextStage.key === 'cloturee'
      ? `Confirmez-vous la clôture de cette vente de ${tx.montant.toLocaleString('fr-FR')} FCFA ? Le bien sera marqué vendu et les commissions seront générées.`
      : `Avancer la transaction vers l'étape "${nextStage.label}" ?`

    if (!window.confirm(confirmMsg)) return

    try {
      setAdvancingId(tx.id)
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const res = await fetch(`/api/transactions-immo/agence/${slug}/${tx.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ statut: nextStage.key }),
      })
      if (res.ok) {
        chargerDonnees()
      }
    } catch (err) {
      console.error('[ADVANCE_STAGE_ERR]', err)
    } finally {
      setAdvancingId(null)
    }
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 40 }}>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Briefcase size={24} color="var(--accent, #C75B00)" />
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: 'var(--navy, #1C2B4A)' }}>
              Transactions & Ventes
            </h1>
          </div>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0 0' }}>
            Pipeline notarial : compromis, séquestres, actes authentiques et clôtures de vente
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--accent, #C75B00)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '9px 16px',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <Plus size={16} />
          <span>Nouvelle Transaction</span>
        </button>
      </div>

      {/* KPIs Pipeline */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
        <div style={{ background: '#fff', padding: '14px 16px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>Volume d&apos;affaires en cours</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
            {Number(pipeline.volume_affaires_total || 0).toLocaleString('fr-FR')} FCFA
          </div>
        </div>

        <div style={{ background: '#fff', padding: '14px 16px', borderRadius: 10, border: '1px solid #bbf7d0' }}>
          <div style={{ fontSize: 12, color: '#15803d', fontWeight: 600, marginBottom: 4 }}>Volume Clôturé & Acté</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#15803d' }}>
            {Number(pipeline.volume_affaires_cloture || 0).toLocaleString('fr-FR')} FCFA
          </div>
        </div>

        <div style={{ background: '#fff', padding: '14px 16px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>Dossiers Notaire en cours</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#334155', marginTop: 4 }}>
            {(Number(pipeline.total_compromis || 0) + Number(pipeline.total_sequestre || 0) + Number(pipeline.total_acte_authentique || 0))} dossiers
          </div>
        </div>
      </div>

      {/* Barre de filtres */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Rechercher par bien, acheteur, vendeur..."
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
          <option value="tous">Toutes les étapes</option>
          {STAGES.map(s => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
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

      {/* Tableau des transactions */}
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
            Chargement des transactions…
          </div>
        ) : transactions.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <Briefcase size={40} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#334155', margin: 0 }}>Aucune transaction en cours</h3>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: '4px 0 16px' }}>
              Suivez l&apos;avancement de vos ventes et compromis de la signature jusqu&apos;à l&apos;acte authentique.
            </p>
            <button
              type="button"
              onClick={() => setShowModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'var(--accent, #C75B00)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '8px 14px',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Plus size={14} />
              <span>Créer la première transaction</span>
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Bien & Prix</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Parties (Acheteur / Vendeur)</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Agent & Courtier</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Étape Notariale</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Commission Agence</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => {
                  const stageInfo = STAGES.find(s => s.key === t.statut) || STAGES[0]
                  const currentIdx = STAGES.findIndex(s => s.key === t.statut)
                  const canAdvance = currentIdx >= 0 && currentIdx < STAGES.length - 1
                  const nextStage = canAdvance ? STAGES[currentIdx + 1] : null

                  return (
                    <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <Link
                          href={`/agence/${slug}/biens/${t.bien_id}`}
                          style={{ fontWeight: 700, color: 'var(--navy, #1C2B4A)', textDecoration: 'none', display: 'block' }}
                        >
                          {t.bien_titre}
                        </Link>
                        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--price, #0A5C36)', marginTop: 2 }}>
                          {Number(t.montant).toLocaleString('fr-FR')} FCFA
                        </div>
                        <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 1 }}>
                          Initié le {new Date(t.date_transaction).toLocaleDateString('fr-FR')}
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontSize: 12.5, color: '#334155' }}>
                          <span style={{ fontWeight: 700 }}>Acheteur :</span> {t.acheteur_nom || 'Non spécifié'}
                        </div>
                        <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 2 }}>
                          <span style={{ fontWeight: 700 }}>Vendeur :</span> {t.vendeur_nom || 'Non spécifié'}
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontSize: 12.5, color: '#334155' }}>
                          <span style={{ fontWeight: 700 }}>Agent :</span>{' '}
                          {t.agent_nom ? `${t.agent_prenom || ''} ${t.agent_nom}`.trim() : 'Agence direct'}
                        </div>
                        {t.courtier_nom ? (
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            marginTop: 4,
                            padding: '2px 8px',
                            borderRadius: 6,
                            background: '#DCFCE7',
                            color: '#166534',
                            fontSize: 11,
                            fontWeight: 700,
                            border: '1px solid #BBF7D0'
                          }}>
                            <span>Courtier : {t.courtier_prenom ? `${t.courtier_prenom} ${t.courtier_nom}` : t.courtier_nom}</span>
                          </div>
                        ) : (
                          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>
                            Sans courtier
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          display: 'inline-block',
                          fontSize: 11.5,
                          fontWeight: 700,
                          padding: '3px 9px',
                          borderRadius: 6,
                          background: stageInfo.bg,
                          color: stageInfo.color,
                        }}>
                          {stageInfo.label}
                        </span>

                        {t.statut === 'cloturee' && t.date_cloture && (
                          <div style={{ fontSize: 11, color: '#15803d', fontWeight: 600, marginTop: 4 }}>
                            Acté le {new Date(t.date_cloture).toLocaleDateString('fr-FR')}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        {t.commission_montant ? (
                          <div>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>
                              {Number(t.commission_montant).toLocaleString('fr-FR')} FCFA
                            </div>
                            <span style={{
                              fontSize: 10.5,
                              fontWeight: 700,
                              color: t.commission_statut === 'payee' ? '#15803d' : '#b45309',
                            }}>
                              {t.commission_statut === 'payee' ? '✓ Honoraires réglés' : 'En attente règlement'}
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontSize: 11.5, color: '#94a3b8' }}>Calculée à la clôture</span>
                        )}
                      </td>

                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        {canAdvance && nextStage && (
                          <button
                            type="button"
                            onClick={() => handleAvancerEtape(t)}
                            disabled={advancingId === t.id}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              background: '#eff6ff',
                              color: '#1d4ed8',
                              border: '1px solid #bfdbfe',
                              borderRadius: 6,
                              padding: '5px 10px',
                              fontSize: 11.5,
                              fontWeight: 700,
                              cursor: advancingId === t.id ? 'not-allowed' : 'pointer',
                            }}
                          >
                            <span>➔ {nextStage.label}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <ModalCreerTransaction
          slug={slug}
          biens={biens}
          contacts={contacts}
          proprietaires={proprietaires}
          courtiers={courtiers}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false)
            chargerDonnees()
          }}
        />
      )}
    </div>
  )
}
