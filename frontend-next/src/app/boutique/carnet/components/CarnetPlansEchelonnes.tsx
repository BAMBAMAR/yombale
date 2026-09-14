'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Layers,
  Sparkles,
  Zap,
  MessageCircle,
  CreditCard,
  Check,
  RefreshCw,
  Plus,
} from 'lucide-react'
import { fcfa, fmtDate } from '@/lib/format'
import CarnetModalCreerPlan from './CarnetModalCreerPlan'

export interface PlanEcheance {
  id: string
  numero: number
  montant_total: number
  montant_paye: number
  montant_restant: number
  date_echeance: string
  statut: 'en_attente' | 'partielle' | 'payee' | 'en_retard' | 'soldee_par_anticipation'
  jours_retard?: number
  derniere_date_paiement?: string | null
}

export interface PlanEchelonne {
  id: string
  reference: string
  montant_total: number
  montant_apport: number
  montant_finance: number
  montant_paye: number
  solde_restant: number
  nb_echeances: number
  frequence: string
  statut: 'actif' | 'solde' | 'annule'
  created_at: string
  echeances: PlanEcheance[]
}

interface CarnetPlansEchelonnesProps {
  boutiqueId: string
  clientId: string
  clientNom: string
  clientTelephone: string
  onPlanUpdated: () => void
}

export default function CarnetPlansEchelonnes({
  boutiqueId,
  clientId,
  clientNom,
  clientTelephone,
  onPlanUpdated,
}: CarnetPlansEchelonnesProps) {
  const [plans, setPlans] = useState<PlanEchelonne[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null)
  
  // Modale Nouveau Plan
  const [modalCreerPlanOpen, setModalCreerPlanOpen] = useState(false)

  // Modale Encaisser
  const [encaissementModalOpen, setEncaissementModalOpen] = useState(false)
  const [selectedPlanForPay, setSelectedPlanForPay] = useState<PlanEchelonne | null>(null)
  const [montantEncaissement, setMontantEncaissement] = useState<number>(0)
  const [modePaiement, setModePaiement] = useState<string>('especes')
  const [loadingAction, setLoadingAction] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const loadPlans = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/boutiques/${boutiqueId}/credits-clients/${clientId}/plans`)
      const data = await res.json()
      if (data.success && Array.isArray(data.plans)) {
        setPlans(data.plans)
        if (data.plans.length > 0 && !expandedPlanId) {
          setExpandedPlanId(data.plans[0].id)
        }
      } else {
        setPlans([])
      }
    } catch (err) {
      console.warn('[LOAD PLANS ERR]:', err)
    } finally {
      setLoading(false)
    }
  }, [boutiqueId, clientId, expandedPlanId])

  useEffect(() => {
    loadPlans()
  }, [loadPlans])

  const handleOpenEncaisser = (plan: PlanEchelonne) => {
    setSelectedPlanForPay(plan)
    const nextUnpaid = plan.echeances.find((e) => e.statut !== 'payee' && e.statut !== 'soldee_par_anticipation')
    setMontantEncaissement(nextUnpaid ? Number(nextUnpaid.montant_restant) : Number(plan.solde_restant))
    setActionError(null)
    setEncaissementModalOpen(true)
  }

  const handleValiderEncaissement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPlanForPay || montantEncaissement <= 0) return
    setLoadingAction(true)
    setActionError(null)
    try {
      const res = await fetch(`/api/boutiques/${boutiqueId}/credits-clients/${clientId}/encaisser`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlanForPay.id,
          montant: montantEncaissement,
          modePaiement,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setActionError(data.error || 'Erreur lors de l’encaissement')
        setLoadingAction(false)
        return
      }
      setEncaissementModalOpen(false)
      loadPlans()
      onPlanUpdated()
    } catch {
      setActionError('Impossible de joindre le serveur')
    } finally {
      setLoadingAction(false)
    }
  }

  const handleSolderAnticipe = async (plan: PlanEchelonne) => {
    if (!window.confirm(`Confirmez-vous le solde anticipé de ${fcfa(plan.solde_restant)} pour le plan ${plan.reference} ?`)) {
      return
    }
    setLoadingAction(true)
    try {
      const res = await fetch(`/api/boutiques/${boutiqueId}/credits-clients/${clientId}/solder-anticipe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          modePaiement: 'especes',
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        alert(data.error || 'Erreur lors du solde anticipé')
      } else {
        loadPlans()
        onPlanUpdated()
      }
    } catch {
      alert('Erreur réseau lors du solde anticipé')
    } finally {
      setLoadingAction(false)
    }
  }

  const handlePartagerWhatsApp = (plan: PlanEchelonne) => {
    const lignes = plan.echeances
      .map((e) => {
        const icon = e.statut === 'payee' ? '✅' : e.statut === 'en_retard' ? '🔴' : '🟡'
        return `${icon} Échéance ${e.numero} : ${fcfa(e.montant_total)} (Due le ${fmtDate(e.date_echeance)}) - Statut : ${e.statut}`
      })
      .join('\n')

    const msg = `*Rappel Échéancier Nopalou — ${clientNom}*\n\nPlan Réf : *${plan.reference}*\nMontant total : *${fcfa(plan.montant_total)}*\nApport versé : *${fcfa(plan.montant_apport)}*\nSolde restant : *${fcfa(plan.solde_restant)}*\n\n*Détail des Échéances :*\n${lignes}\n\nMerci de votre confiance !`

    const cleanTel = clientTelephone.replace(/\D/g, '')
    const url = `https://wa.me/${cleanTel.startsWith('221') ? cleanTel : `221${cleanTel}`}?text=${encodeURIComponent(msg)}`
    window.open(url, '_blank')
  }

  return (
    <div style={{ marginTop: 12 }}>
      {/* État vide avec bouton de création direct */}
      {plans.length === 0 ? (
        <div
          style={{
            background: '#fffaf5',
            border: '1px solid #fed7aa',
            borderRadius: 14,
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 220 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: '#ffedd5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Layers size={20} color="var(--accent, #C75B00)" />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: 13.5, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
                Paiement Échelonné / Crédit Structuré
              </h4>
              <p style={{ margin: 0, fontSize: 11.5, color: '#64748b' }}>
                Aucun plan actif pour ce client. Accordez un paiement en 2x, 3x, 4x ou 6x.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setModalCreerPlanOpen(true)}
            className="btn-npl btn-npl-sm btn-npl-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '8px 14px' }}
          >
            <Plus size={14} />
            <span>Créer un plan échelonné</span>
          </button>
        </div>
      ) : (
        /* Liste des plans actifs */
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <h3 style={{ fontSize: 13.5, fontWeight: 900, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Layers size={16} color="var(--accent, #C75B00)" />
              <span>Plans d&apos;Échelonnement Actifs ({plans.length})</span>
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                onClick={() => setModalCreerPlanOpen(true)}
                className="btn-npl btn-npl-sm btn-npl-primary"
                style={{ height: 28, padding: '0 10px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <Plus size={12} />
                <span>Nouveau Plan</span>
              </button>
              <button
                type="button"
                onClick={loadPlans}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700 }}
              >
                <RefreshCw size={12} />
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {plans.map((plan) => {
              const isExpanded = expandedPlanId === plan.id
              const totalNum = Number(plan.montant_total) || 1
              const payeNum = Number(plan.montant_paye) || 0
              const soldeRestantNum = Number(plan.solde_restant !== undefined ? plan.solde_restant : (plan as any).montant_restant) || 0
              const pct = Math.min(100, Math.round((payeNum / totalNum) * 100))
              const estSolde = plan.statut === 'solde' || soldeRestantNum <= 0

              return (
                <div
                  key={plan.id}
                  style={{
                    border: estSolde ? '1px solid #bbf7d0' : '1.5px solid #fed7aa',
                    background: estSolde ? '#f0fdf4' : '#fffaf5',
                    borderRadius: 12,
                    padding: '12px 14px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* En-tête du Plan */}
                  <div
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', gap: 10, flexWrap: 'wrap' }}
                    onClick={() => setExpandedPlanId(isExpanded ? null : plan.id)}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12.5, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
                          {plan.reference}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            padding: '1px 6px',
                            borderRadius: 6,
                            background: estSolde ? '#dcfce7' : '#ffedd5',
                            color: estSolde ? '#166534' : '#9a3412',
                          }}
                        >
                          {estSolde ? 'SOLDÉ' : `${plan.nb_echeances}x ${plan.frequence}`}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                        Créé le {fmtDate(plan.created_at)} • Total : <strong>{fcfa(totalNum)}</strong>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: estSolde ? '#166534' : 'var(--accent, #C75B00)' }}>
                          {estSolde ? '0 FCFA' : `Reste : ${fcfa(soldeRestantNum)}`}
                        </div>
                        <div style={{ fontSize: 10, color: '#64748b' }}>
                          {pct}% payé ({fcfa(payeNum)})
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp size={16} color="#64748b" /> : <ChevronDown size={16} color="#64748b" />}
                    </div>
                  </div>

                  {/* Barre de Progression */}
                  <div
                    style={{
                      height: 6,
                      background: '#e2e8f0',
                      borderRadius: 3,
                      overflow: 'hidden',
                      marginTop: 8,
                      marginBottom: isExpanded ? 12 : 0,
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: estSolde ? '#16a34a' : 'linear-gradient(90deg, #f97316, #ea580c)',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>

                  {/* Détail Déplié des Échéances */}
                  {isExpanded && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid #f1f5f9', paddingTop: 10 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {(plan.echeances || []).map((ech, idx) => {
                          const isPayee = ech.statut === 'payee' || ech.statut === 'soldee_par_anticipation'
                          const isRetard = ech.statut === 'en_retard'
                          const isPartielle = ech.statut === 'partielle'
                          const numEch = ech.numero || (ech as any).numero_echeance || idx + 1
                          const montantEch = Number(ech.montant_total !== undefined ? ech.montant_total : (ech as any).montant_prevu) || 0
                          const montantRestantEch = Number(ech.montant_restant !== undefined ? ech.montant_restant : (montantEch - (Number(ech.montant_paye) || 0))) || 0

                          return (
                            <div
                              key={ech.id || `ech-${idx}`}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: '#ffffff',
                                border: isRetard ? '1px solid #fca5a5' : isPayee ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                                borderRadius: 8,
                                padding: '6px 10px',
                                fontSize: 11.5,
                                gap: 8,
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                                <span
                                  style={{
                                    width: 18,
                                    height: 18,
                                    borderRadius: '50%',
                                    background: isPayee ? '#dcfce7' : isRetard ? '#fee2e2' : '#f1f5f9',
                                    color: isPayee ? '#166534' : isRetard ? '#991b1b' : '#475569',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 900,
                                    fontSize: 10,
                                    flexShrink: 0,
                                  }}
                                >
                                  {isPayee ? <Check size={11} strokeWidth={3} /> : numEch}
                                </span>
                                <div style={{ minWidth: 0 }}>
                                  <strong style={{ color: '#0f172a' }}>Échéance {numEch}</strong>
                                  <div style={{ fontSize: 10.5, color: isRetard ? '#dc2626' : '#64748b', whiteSpace: 'nowrap' }}>
                                    Due le {fmtDate(ech.date_echeance)} {isRetard ? `(Retard ${ech.jours_retard || 0}j)` : ''}
                                  </div>
                                </div>
                              </div>

                              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <div style={{ fontWeight: 800, color: isPayee ? '#166534' : '#0f172a' }}>
                                  {fcfa(montantEch)}
                                </div>
                                {isPartielle && (
                                  <div style={{ fontSize: 10, color: '#ea580c', fontWeight: 700 }}>
                                    Reste : {fcfa(montantRestantEch)}
                                  </div>
                                )}
                                {isPayee && (
                                  <div style={{ fontSize: 10, color: '#166534', fontWeight: 700 }}>
                                    Réglée
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {/* Boutons d'Action Plan */}
                      {!estSolde && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', width: '100%', marginTop: 4 }}>
                          <button
                            type="button"
                            onClick={() => handleOpenEncaisser(plan)}
                            className="btn-npl btn-npl-sm btn-npl-primary"
                            style={{ flex: '1 1 130px', height: 34, fontSize: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
                          >
                            <CreditCard size={13} />
                            <span>Encaisser (FIFO)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSolderAnticipe(plan)}
                            disabled={loadingAction}
                            className="btn-npl btn-npl-sm btn-npl-secondary"
                            style={{ flex: '1 1 140px', height: 34, fontSize: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
                          >
                            <Zap size={13} />
                            <span>Solder par anticipation</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handlePartagerWhatsApp(plan)}
                            className="btn-npl btn-npl-sm btn-npl-whatsapp"
                            style={{ height: 34, padding: '0 12px', fontSize: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                            title="Envoyer l'échéancier sur WhatsApp"
                          >
                            <MessageCircle size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Modale de Création d'un Plan Échelonné */}
      <CarnetModalCreerPlan
        isOpen={modalCreerPlanOpen}
        onClose={() => setModalCreerPlanOpen(false)}
        boutiqueId={boutiqueId}
        clientId={clientId}
        clientNom={clientNom}
        onPlanCreated={() => {
          loadPlans()
          onPlanUpdated()
        }}
      />

      {/* Modale d'Encaissement Partiel / Complet */}
      {encaissementModalOpen && selectedPlanForPay && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setEncaissementModalOpen(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              maxWidth: 420,
              width: '100%',
              padding: 20,
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
              Encaisser un Paiement Échelonné
            </h3>
            <p style={{ margin: '0 0 14px', fontSize: 12, color: '#64748b' }}>
              Plan {selectedPlanForPay.reference} • Solde restant : <strong>{fcfa(selectedPlanForPay.solde_restant)}</strong>
            </p>

            {actionError && (
              <div style={{ background: '#fee2e2', color: '#991b1b', padding: '8px 12px', borderRadius: 8, fontSize: 12, marginBottom: 12, fontWeight: 700 }}>
                {actionError}
              </div>
            )}

            <form onSubmit={handleValiderEncaissement} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 800, color: '#334155', display: 'block', marginBottom: 4 }}>
                  Montant encaissé (FCFA)
                </label>
                <input
                  type="number"
                  required
                  min={100}
                  max={selectedPlanForPay.solde_restant}
                  value={montantEncaissement || ''}
                  onChange={(e) => setMontantEncaissement(Number(e.target.value))}
                  className="input-npl"
                  style={{ fontSize: 15, fontWeight: 900 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 800, color: '#334155', display: 'block', marginBottom: 4 }}>
                  Mode de règlement
                </label>
                <select
                  value={modePaiement}
                  onChange={(e) => setModePaiement(e.target.value)}
                  className="input-npl"
                  style={{ cursor: 'pointer', fontWeight: 700 }}
                >
                  <option value="especes">Espèces</option>
                  <option value="wave">Wave</option>
                  <option value="orange_money">Orange Money</option>
                  <option value="virement">Virement bancaire</option>
                </select>
              </div>

              <div style={{ background: '#f8fafc', padding: 10, borderRadius: 8, fontSize: 11.5, color: '#475569', lineHeight: 1.4 }}>
                💡 <strong>Allocation FIFO automatique :</strong> ce versement sera imputé en priorité sur l&apos;échéance la plus ancienne non soldée.
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setEncaissementModalOpen(false)}
                  className="btn-npl btn-npl-secondary"
                  style={{ flex: 1 }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loadingAction || montantEncaissement <= 0}
                  className="btn-npl btn-npl-primary"
                  style={{ flex: 1 }}
                >
                  {loadingAction ? 'Enregistrement...' : `Confirmer ${fcfa(montantEncaissement)}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
