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
  Check,
  Settings
} from 'lucide-react'
import { ParametresEchelonnementImmo } from './components/ParametresEchelonnementImmo'
import { ModalCreerCredit } from './components/ModalCreerCredit'
import { getImmoAuthHeaders } from '@/lib/immo-auth'

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

  const [activeTab, setActiveTab] = useState<'plans' | 'parametres'>('plans')
  const [credits, setCredits] = useState<CreditItem[]>([])
  const [biens, setBiens] = useState<BienOption[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [encaissementId, setEncaissementId] = useState<string | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  async function chargerDonnees() {
    try {
      setLoading(true)
      const headers = getImmoAuthHeaders()

      const [resCredits, resBiens] = await Promise.all([
        fetch(`/api/credits-immo/agence/${slug}`, { headers }),
        fetch(`/api/biens/agence/${slug}?statut=actif`, { headers }),
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

  async function handleEncaisserEcheance(creditId: string, numeroEcheance: number, montant: number) {
    try {
      setEncaissementId(`${creditId}-${numeroEcheance}`)
      const res = await fetch(`/api/credits-immo/agence/${slug}/${creditId}/encaisser-echeance`, {
        method: 'POST',
        headers: getImmoAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          numero_echeance: numeroEcheance,
          mode_paiement: 'wave',
          montant,
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setToastMsg(`Échéance #${numeroEcheance} encaissée avec succès !`)
        chargerDonnees()
        setTimeout(() => setToastMsg(null), 3500)
      } else {
        alert(data.error || 'Erreur lors de l\'encaissement')
      }
    } catch (err) {
      console.error('[ENCAISSER_ERR]', err)
    } finally {
      setEncaissementId(null)
    }
  }

  const totalFinancement = credits.reduce((acc, c) => acc + Number(c.montant_total || 0), 0)
  const totalRestant = credits.reduce((acc, c) => acc + Number(c.solde_restant || 0), 0)

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 40 }}>
      {/* ── En-tête de la Page ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CreditCard size={24} color="var(--accent, #C75B00)" />
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: 'var(--navy, #1C2B4A)' }}>
              Crédits & Plans d&apos;Échelonnement
            </h1>
          </div>
          <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0 0' }}>
            Caution locative en 2x/3x/4x, vente de terrains et VEFA par tranches avec suivi des mensualités
          </p>
        </div>

        {activeTab === 'plans' && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
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
              fontSize: 13,
            }}
          >
            <Plus size={16} />
            <span>Nouveau plan d&apos;échelonnement</span>
          </button>
        )}
      </div>

      {/* ── Onglets Principaux ── */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #E2E8F0', marginBottom: 20 }}>
        <button
          type="button"
          onClick={() => setActiveTab('plans')}
          style={{
            padding: '10px 18px',
            fontSize: 13.5,
            fontWeight: 700,
            border: 'none',
            background: 'none',
            color: activeTab === 'plans' ? 'var(--accent, #C75B00)' : '#64748B',
            borderBottom: activeTab === 'plans' ? '2px solid var(--accent, #C75B00)' : '2px solid transparent',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Layers size={15} />
          <span>Échéanciers en cours ({credits.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('parametres')}
          style={{
            padding: '10px 18px',
            fontSize: 13.5,
            fontWeight: 700,
            border: 'none',
            background: 'none',
            color: activeTab === 'parametres' ? 'var(--accent, #C75B00)' : '#64748B',
            borderBottom: activeTab === 'parametres' ? '2px solid var(--accent, #C75B00)' : '2px solid transparent',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Settings size={15} />
          <span>Paramètres & Politiques d&apos;Échelonnement</span>
        </button>
      </div>

      {toastMsg && (
        <div style={{ padding: '12px 16px', background: '#DCFCE7', color: '#166534', borderRadius: 8, fontSize: 13.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <CheckCircle2 size={18} />
          {toastMsg}
        </div>
      )}

      {activeTab === 'parametres' ? (
        <ParametresEchelonnementImmo slug={slug} />
      ) : (
        <>
          {/* ── KPIs Financements ── */}
          <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 20 }}>
            <div className="kpi-card" style={{ background: '#fff', padding: '14px 16px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>Total Échelonné</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                {Number(totalFinancement).toLocaleString('fr-FR')} FCFA
              </div>
              <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 3 }}>{credits.length} contrat(s) actif(s)</div>
            </div>

            <div className="kpi-card" style={{ background: '#fff', padding: '14px 16px', borderRadius: 10, border: totalRestant > 0 ? '1px solid #FCA5A5' : '1px solid #bbf7d0' }}>
              <div style={{ fontSize: 12, color: totalRestant > 0 ? '#DC2626' : '#15803d', fontWeight: 600, marginBottom: 4 }}>Solde Restant Dû</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: totalRestant > 0 ? '#DC2626' : '#15803d' }}>
                {Number(totalRestant).toLocaleString('fr-FR')} FCFA
              </div>
              <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 3 }}>À recouvrer sur échéances</div>
            </div>
          </div>

          {/* ── Liste des Plans Échelonnés ── */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748B' }}>
              <p>Chargement des plans de financement...</p>
            </div>
          ) : credits.length === 0 ? (
            <div className="agence-card" style={{ textAlign: 'center', padding: '48px 20px', background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <CreditCard size={36} color="#94A3B8" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)', fontSize: 16, margin: 0 }}>
                Aucun plan d&apos;échelonnement actif
              </p>
              <p style={{ fontSize: 13, color: '#64748B', margin: '6px 0 18px' }}>
                Proposez à vos locataires ou acheteurs d&apos;étaler leur caution ou achat en plusieurs fois.
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
                  padding: '9px 16px',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Plus size={15} />
                <span>Créer un premier plan</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
              {credits.map(cr => (
                <div key={cr.id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
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
                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: cr.statut === 'solde' ? '#f0fdf4' : '#fef3c7',
                        color: cr.statut === 'solde' ? '#166534' : '#92400e',
                      }}>
                        {cr.statut === 'solde' ? 'Soldé' : 'En cours'}
                      </span>
                    </div>

                    <div style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)', fontSize: 15, marginBottom: 2 }}>
                      {cr.beneficiaire_nom}
                    </div>
                    {cr.beneficiaire_tel && (
                      <div style={{ fontSize: 12, color: '#64748B', marginBottom: 10 }}>
                        Tél : {cr.beneficiaire_tel}
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span style={{ color: '#64748B' }}>Montant total :</span>
                      <span style={{ fontWeight: 700 }}>{Number(cr.montant_total).toLocaleString('fr-FR')} FCFA</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span style={{ color: '#64748B' }}>Apport initial :</span>
                      <span style={{ fontWeight: 700, color: '#166534' }}>{Number(cr.apport_initial).toLocaleString('fr-FR')} FCFA</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 12 }}>
                      <span style={{ color: '#64748B' }}>Solde restant :</span>
                      <span style={{ fontWeight: 800, color: cr.solde_restant > 0 ? '#DC2626' : '#166534' }}>
                        {Number(cr.solde_restant).toLocaleString('fr-FR')} FCFA
                      </span>
                    </div>

                    {/* Échéancier détaillé */}
                    <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 10 }}>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                        Échéances ({cr.echeances?.length || 0})
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {cr.echeances?.map(ech => (
                          <div
                            key={ech.numero}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '6px 10px',
                              background: ech.statut === 'paye' ? '#F0FDF4' : '#F8FAFC',
                              borderRadius: 6,
                              fontSize: 12,
                            }}
                          >
                            <div>
                              <span style={{ fontWeight: 700 }}>#{ech.numero}</span> · {new Date(ech.date_echeance).toLocaleDateString('fr-FR')}
                              <div style={{ fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
                                {Number(ech.montant).toLocaleString('fr-FR')} FCFA
                              </div>
                            </div>

                            {ech.statut === 'paye' ? (
                              <span style={{ color: '#166534', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <Check size={13} /> Payé
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleEncaisserEcheance(cr.id, ech.numero, ech.montant)}
                                disabled={encaissementId === `${cr.id}-${ech.numero}`}
                                style={{
                                  padding: '4px 8px',
                                  fontSize: 11,
                                  fontWeight: 700,
                                  background: 'var(--accent, #C75B00)',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: 4,
                                  cursor: 'pointer',
                                }}
                              >
                                Encaisser
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {cr.beneficiaire_tel && (
                    <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid #F1F5F9' }}>
                      <a
                        href={`https://wa.me/${cr.beneficiaire_tel.replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour ${cr.beneficiaire_nom}, nous vous rappelons votre échéance de caution/financement de ${Number(cr.solde_restant).toLocaleString('fr-FR')} FCFA.`)}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          width: '100%',
                          padding: '7px 0',
                          background: '#25D366',
                          color: '#fff',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          textDecoration: 'none',
                        }}
                      >
                        <MessageCircle size={14} />
                        <span>Relance WhatsApp</span>
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {showModal && (
        <ModalCreerCredit
          slug={slug}
          biens={biens}
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
