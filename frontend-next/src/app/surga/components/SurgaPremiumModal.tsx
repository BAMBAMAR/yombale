'use client'

import React, { useEffect, useState } from 'react'
import { X, Crown, CheckCircle2, ArrowRight, Lock } from 'lucide-react'
import SurgaPremiumAvantages from './SurgaPremiumAvantages'
import { formaterFCFA } from '@/lib/surga-formatting'
import { oublierOffre, planParticulier, reductionAnnuelle, resumeGratuit, useSurgaOffre, type CycleOffre } from '@/lib/surga-offre'

// Écran d'abonnement. La formule, ses durées, ses prix, ses avantages, les quotas gratuits et l'ouverture des ventes
// viennent de la console d'administration : rien n'est écrit ici. Wave est le seul moyen de paiement ouvert.

interface SurgaPremiumModalProps {
  isOpen: boolean
  onClose: () => void
  onAbonnementActive?: () => void
}

const ERREUR_STYLE: React.CSSProperties = { color: '#DC2626', fontSize: 12, fontWeight: 600, padding: 8, backgroundColor: '#FEE2E2', borderRadius: 8 }

export default function SurgaPremiumModal({ isOpen, onClose, onAbonnementActive }: SurgaPremiumModalProps) {
  const { offre, chargement, recharger } = useSurgaOffre()
  const [cycle, setCycle] = useState<CycleOffre | null>(null)
  const [telephone, setTelephone] = useState<string>('')
  const [envoi, setEnvoi] = useState<boolean>(false)
  const [etape, setEtape] = useState<'choix' | 'validation' | 'succes'>('choix')
  const [referencePaiement, setReferencePaiement] = useState<string>('')
  const [erreur, setErreur] = useState<string | null>(null)

  // À chaque ouverture, l'offre est relue : un prix changé dans la console est vu aussitôt.
  useEffect(() => {
    if (!isOpen) return
    oublierOffre()
    recharger()
    setEtape('choix')
    setErreur(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const plan = planParticulier(offre)
  const cycles = plan?.cycles ?? []
  // Cycle choisi : celui que la personne a pris s'il est toujours proposé, sinon le mensuel, sinon le premier.
  const cycleActif = cycles.find((c) => c.cycle === cycle) ?? cycles.find((c) => c.cycle === 'mensuel') ?? cycles[0] ?? null
  const reduction = reductionAnnuelle(plan)
  const ventesFermees = offre ? !offre.ventes_ouvertes : false

  if (!isOpen) return null

  const handleSouscrire = async () => {
    if (!plan || !cycleActif) return
    setEnvoi(true)
    setErreur(null)
    try {
      const res = await fetch('/api/surga/abonnements/initier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: plan.id, cycle: cycleActif.cycle, provider: 'wave', phone: telephone || undefined }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Erreur lors de l’initiation du paiement.')
      setReferencePaiement(data.reference)
      setEtape('validation')
      if (data.paiementUrl) window.open(data.paiementUrl, '_blank')
    } catch (err: any) {
      setErreur(err.message || 'Une erreur est survenue.')
    } finally {
      setEnvoi(false)
    }
  }

  const handleConfirmerPaiement = async () => {
    setEnvoi(true)
    setErreur(null)
    try {
      const res = await fetch('/api/surga/abonnements/verifier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: referencePaiement }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Paiement non encore validé.')
      setEtape('succes')
      if (onAbonnementActive) onAbonnementActive()
    } catch (err: any) {
      setErreur(err.message || 'Validation en attente. Veuillez patienter quelques instants.')
    } finally {
      setEnvoi(false)
    }
  }

  const gratuit = resumeGratuit(offre?.gratuit)

  return (
    <div
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}
    >
      <div
        style={{ width: '100%', maxWidth: 480, maxHeight: '90vh', backgroundColor: '#FFFFFF', borderRadius: 16, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div style={{ padding: '18px 20px', backgroundColor: 'var(--navy, #1C2B4A)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Crown size={20} color="#FBBF24" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>{plan?.nom || 'Abonnement Surga'}</div>
              {plan?.description && <div style={{ fontSize: 12, opacity: 0.85 }}>{plan.description}</div>}
            </div>
          </div>
          <button type="button" aria-label="Fermer l’abonnement" onClick={onClose} style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer', padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {/* Corps */}
        <div style={{ padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {etape === 'choix' && (
            <>
              {chargement && !offre && <div style={{ fontSize: 13, color: 'var(--text2, #5A4E42)' }}>Chargement de l’offre…</div>}
              {!chargement && !plan && (
                <div style={{ fontSize: 13, color: 'var(--text2, #5A4E42)' }}>
                  {offre ? 'Aucune formule n’est proposée pour le moment.' : 'L’offre n’a pas pu être chargée. Vérifiez votre connexion et réessayez.'}
                </div>
              )}

              {plan && (
                <>
                  {/* Durées proposées : une par cycle dont le tarif est supérieur à 0 */}
                  <div role="radiogroup" aria-label="Durée de l’abonnement" style={{ display: 'flex', backgroundColor: 'var(--bg, #F8F5F0)', borderRadius: 10, padding: 4, gap: 4 }}>
                    {cycles.map((c) => {
                      const actif = c.cycle === cycleActif?.cycle
                      return (
                        <button
                          key={c.cycle}
                          type="button"
                          role="radio"
                          aria-checked={actif}
                          onClick={() => setCycle(c.cycle)}
                          style={{
                            flex: 1,
                            padding: '8px 6px',
                            borderRadius: 8,
                            border: 'none',
                            fontWeight: 700,
                            fontSize: 13,
                            cursor: 'pointer',
                            backgroundColor: actif ? '#FFFFFF' : 'transparent',
                            color: actif ? 'var(--navy, #1C2B4A)' : 'var(--text2, #5A4E42)',
                            boxShadow: actif ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            position: 'relative',
                            lineHeight: 1.3,
                          }}
                        >
                          <div>{c.libelle}</div>
                          <div style={{ fontSize: 12, fontWeight: 800 }}>{formaterFCFA(c.montant)}</div>
                          {c.cycle === 'annuel' && reduction !== null && (
                            <span style={{ position: 'absolute', top: -8, right: 4, backgroundColor: 'var(--accent, #C75B00)', color: '#FFFFFF', fontSize: 12, fontWeight: 800, padding: '1px 6px', borderRadius: 10 }}>
                              -{reduction}%
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>

                  <SurgaPremiumAvantages avantages={plan.avantages} />

                  {gratuit && (
                    <div style={{ fontSize: 12, color: 'var(--text2, #5A4E42)', backgroundColor: 'var(--bg, #F8F5F0)', borderRadius: 8, padding: '8px 12px', lineHeight: 1.45 }}>
                      <strong>Sans abonnement :</strong> {gratuit}.
                    </div>
                  )}

                  {ventesFermees && (
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy, #1C2B4A)', padding: 10, borderRadius: 8, border: '1px solid var(--border, #E8DDD2)' }}>
                      Les abonnements ne sont pas ouverts pour le moment. Revenez bientôt.
                    </div>
                  )}

                  {/* Moyen de paiement : Wave seulement */}
                  <div style={{ borderTop: '1px solid var(--border, #E8DDD2)', paddingTop: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy, #1C2B4A)', marginBottom: 8 }}>Paiement sécurisé</div>
                    <div style={{ padding: '10px 14px', borderRadius: 10, border: '2px solid #1BA3E8', backgroundColor: 'rgba(27, 163, 232, 0.06)', textAlign: 'center', fontWeight: 700, fontSize: 13, color: 'var(--navy, #1C2B4A)' }}>
                      Wave Sénégal
                    </div>
                  </div>

                  <div>
                    <label htmlFor="surga-abonnement-tel" style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy, #1C2B4A)', display: 'block', marginBottom: 4 }}>
                      Numéro de téléphone mobile (optionnel)
                    </label>
                    <input
                      id="surga-abonnement-tel"
                      type="tel"
                      placeholder="Ex : 77 123 45 67"
                      value={telephone}
                      onChange={(e) => setTelephone(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border, #E8DDD2)', fontSize: 13 }}
                    />
                  </div>

                  {erreur && <div role="alert" style={ERREUR_STYLE}>{erreur}</div>}

                  <button
                    type="button"
                    onClick={handleSouscrire}
                    disabled={envoi || ventesFermees || !cycleActif}
                    className="surga-btn-primary"
                    style={{ width: '100%', padding: '12px 16px', fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: envoi || ventesFermees ? 0.6 : 1 }}
                  >
                    <Lock size={16} />
                    <span>{cycleActif ? `Régler ${formaterFCFA(cycleActif.montant)} et activer ${plan.nom}` : 'Choisir une durée'}</span>
                    <ArrowRight size={16} />
                  </button>
                  {cycleActif && (
                    <div style={{ fontSize: 12, color: 'var(--text2, #5A4E42)', textAlign: 'center', marginTop: -6 }}>
                      Valable {cycleActif.libelle}. Paiement unique : l’abonnement ne se renouvelle pas tout seul.
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {etape === 'validation' && (
            <div style={{ textAlign: 'center', padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: 'rgba(27, 163, 232, 0.1)', color: '#1BA3E8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                <Crown size={28} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>Validation de votre paiement</div>
              <p style={{ fontSize: 13, color: 'var(--text2, #5A4E42)', margin: 0 }}>
                La passerelle sécurisée s’est ouverte dans un nouvel onglet. Dès que vous avez approuvé la transaction sur votre application Wave, cliquez ci-dessous pour activer immédiatement votre abonnement.
              </p>
              <div style={{ fontSize: 12, color: 'var(--text3, #536175)' }}>
                Référence : <code>{referencePaiement}</code>
              </div>
              {erreur && <div role="alert" style={ERREUR_STYLE}>{erreur}</div>}
              <button type="button" onClick={handleConfirmerPaiement} disabled={envoi} className="surga-btn-primary" style={{ width: '100%', padding: '12px 16px', fontSize: 14, fontWeight: 800 }}>
                {envoi ? 'Vérification en cours...' : 'J’ai validé mon paiement'}
              </button>
            </div>
          )}

          {etape === 'succes' && (
            <div style={{ textAlign: 'center', padding: '24px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: 'rgba(10, 92, 54, 0.1)', color: 'var(--price, #0A5C36)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                <CheckCircle2 size={36} />
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                {plan ? `${plan.nom} est actif` : 'Votre abonnement est actif'}
              </div>
              <p style={{ fontSize: 13, color: 'var(--text2, #5A4E42)', margin: 0 }}>
                {plan && plan.avantages.length > 0 ? `Vous profitez maintenant de : ${plan.avantages.join(' ; ').toLowerCase()}.` : 'Vos avantages sont débloqués.'}
              </p>
              <button type="button" onClick={onClose} className="surga-btn-primary" style={{ width: '100%', padding: '12px 16px', fontSize: 14, fontWeight: 800, marginTop: 8 }}>
                Accéder à mon espace
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
