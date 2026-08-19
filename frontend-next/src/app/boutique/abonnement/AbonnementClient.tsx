'use client'
import { useState, useTransition } from 'react'
import { initierWaveAbonnement } from '@/app/actions/paiement'
import ModalPaiementManuel from '@/components/ModalPaiementManuel'
import { PALIERS_BOUTIQUE } from '@/lib/fonctionnalites-data'
import { Sparkles, Check, Zap, Gift, ShieldCheck } from 'lucide-react'
import { useTranslation } from '@/i18n/context'

const PLANS_DEFAUT = {
  pro: 5000,
  business: 10000,
}

const PLANS_INFO = PALIERS_BOUTIQUE.filter((p): p is typeof PALIERS_BOUTIQUE[number] & { id: 'pro' | 'business' } =>
  p.id === 'pro' || p.id === 'business'
)

interface Props {
  planActif: { plan: string; fin: string } | null
  userId: string
  settings: Record<string, string>
}

const DUREES = [
  { mois: 1, label: '1 mois', sousTitre: 'Tarif mensuel', remise: 0, badge: null },
  { mois: 3, label: '3 mois', sousTitre: 'Trimestriel', remise: 0.10, badge: '-10%' },
  { mois: 6, label: '6 mois', sousTitre: 'Semestriel', remise: 0.15, badge: '-15%' },
  { mois: 12, label: '12 mois (1 an)', sousTitre: 'Annuel', remise: 0.25, badge: '🔥 -25% (3 mois offerts)' },
]

export default function AbonnementClient({ planActif, userId, settings }: Props) {
  const { t, isRtl } = useTranslation()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [planManuel, setPlanManuel] = useState<'pro' | 'business' | null>(null)
  const [duree, setDuree] = useState<number>(12) // 12 mois par défaut pour maximiser l'économie

  const manuelActif = settings.paiement_manuel_actif !== 'false'
  const waveActif = settings.paiement_wave !== 'false'
  const modePaiementLabel = waveActif && manuelActif
    ? 'Paiement sécurisé via Wave ou Mobile Money'
    : waveActif
    ? 'Paiement sécurisé via Wave'
    : 'Paiement manuel (Wave / Orange Money)'

  const PLANS = PLANS_INFO.map(p => {
    const prixMensuelBase = Number(settings[`plan_${p.id}_prix`]) || PLANS_DEFAUT[p.id]
    const optionDuree = DUREES.find(d => d.mois === duree) || DUREES[0]
    const totalBrut = prixMensuelBase * duree
    const totalApresRemise = Math.round(totalBrut * (1 - optionDuree.remise))
    const prixMensuelEquivalent = Math.round(totalApresRemise / duree)
    const economie = totalBrut - totalApresRemise

    return {
      ...p,
      prixMensuelBase,
      totalApresRemise,
      prixMensuelEquivalent,
      economie,
      remiseBadge: optionDuree.badge,
    }
  })

  const handleSouscrire = (plan: 'pro' | 'business') => {
    setError(null)
    setLoadingPlan(plan)
    startTransition(async () => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token') || undefined
      const result = await initierWaveAbonnement(plan, duree, token)
      if (result.ok && result.url) {
        window.location.href = result.url
      } else {
        setPlanManuel(plan)
        if (result.error && !result.fallbackManuel) {
          setError(result.error)
        }
        setLoadingPlan(null)
      }
    })
  }

  const finDate = planActif ? new Date(planActif.fin).toLocaleDateString('fr-FR') : null

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 16px', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* Header */}
      <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 36px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff7f0', border: '1px solid #ffedd5', padding: '6px 14px', borderRadius: 30, color: '#C75B00', fontSize: 13, fontWeight: 800, marginBottom: 12 }}>
          <Sparkles size={16} />
          <span>Propulsez votre commerce au Sénégal</span>
        </div>

        <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', margin: '0 0 10px', lineHeight: 1.2 }}>
          Abonnements & Formules Boutique
        </h1>
        <p style={{ color: '#64748b', fontSize: 16, margin: 0, lineHeight: 1.5 }}>
          Choisissez la durée et le plan adapté à vos besoins pour booster vos ventes, votre caisse enregistreuse et votre catalogue.
        </p>
      </div>

      {/* Alerte si plan actif */}
      {planActif && (
        <div style={{
          background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 14,
          padding: '16px 20px', marginBottom: 32, display: 'flex', alignItems: 'center', gap: 14,
          boxShadow: '0 4px 12px rgba(22,163,74,0.08)',
        }}>
          <span style={{ fontSize: 28 }}>🎉</span>
          <div>
            <strong style={{ fontSize: 16, color: '#14532d' }}>
              Formule Boutique {planActif.plan === 'business' ? 'Business' : planActif.plan === 'pro' ? 'Pro' : planActif.plan === 'decouverte' || planActif.plan === 'taf_taf' ? '⚡ Taf Taf (1 mois offert)' : 'Active'}
            </strong>
            <p style={{ margin: '2px 0 0', color: '#15803d', fontSize: 14 }}>
              {(planActif.plan === 'decouverte' || planActif.plan === 'taf_taf') 
                ? <>Vous profitez actuellement de votre mois d'essai gratuit. Il expire le <strong>{finDate}</strong>. Passez au plan Pro ou Business pour continuer sans interruption.</>
                : <>Votre plan est valide jusqu&apos;au <strong>{finDate}</strong>.</>}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 12,
          padding: '14px 18px', marginBottom: 28, color: '#dc2626', fontWeight: 600, fontSize: 14,
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* 📅 SÉLECTEUR DE DURÉE D'ENGAGEMENT (1, 3, 6, 12 MOIS) */}
      <div style={{ marginBottom: 36 }}>
        <p style={{ textAlign: 'center', fontSize: 13, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
          Choisissez votre durée d&apos;engagement :
        </p>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8,
          background: '#f1f5f9', padding: 6, borderRadius: 16, border: '1px solid #e2e8f0',
        }}>
          {DUREES.map(d => {
            const isSelected = duree === d.mois
            return (
              <button
                key={d.mois}
                onClick={() => setDuree(d.mois)}
                style={{
                  padding: '12px 14px', borderRadius: 12, border: isSelected ? '2px solid #C75B00' : '1px solid transparent',
                  background: isSelected ? '#fff' : 'transparent',
                  color: isSelected ? '#1e293b' : '#64748b',
                  cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.06)' : 'none',
                  position: 'relative', overflow: 'hidden',
                }}
              >
                {d.badge && (
                  <span style={{
                    position: 'absolute', top: 4, right: 6,
                    background: d.mois === 12 ? '#dc2626' : '#C75B00', color: '#fff',
                    fontSize: 9, fontWeight: 900, padding: '1px 6px', borderRadius: 10,
                  }}>
                    {d.badge}
                  </span>
                )}
                <p style={{ margin: 0, fontWeight: isSelected ? 900 : 700, fontSize: 15 }}>{d.label}</p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: isSelected ? '#C75B00' : '#94a3b8', fontWeight: 600 }}>{d.sousTitre}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* 💳 CARTES DES PLANS BOUTIQUE */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(310px, 100%), 1fr))', gap: 24 }}>
        {PLANS.map((plan) => {
          const estActif = planActif?.plan === plan.id
          const enCours = isPending && loadingPlan === plan.id
          const totalAffichage = plan.totalApresRemise.toLocaleString('fr-FR')
          const mensuelAffichage = plan.prixMensuelEquivalent.toLocaleString('fr-FR')
          const estBusiness = plan.id === 'business'

          return (
            <div key={plan.id} style={{
              border: estBusiness ? '2.5px solid #6366f1' : estActif ? `2.5px solid ${plan.couleur}` : '1px solid #e2e8f0',
              borderRadius: 24, padding: 32,
              background: estBusiness
                ? 'linear-gradient(180deg, #ffffff 0%, #f5f3ff 100%)'
                : estActif ? '#fffbf5' : '#ffffff',
              position: 'relative', display: 'flex', flexDirection: 'column',
              boxShadow: estBusiness
                ? '0 20px 40px -10px rgba(99, 102, 241, 0.2)'
                : estActif
                ? '0 12px 30px rgba(199,91,0,0.15)'
                : '0 6px 20px rgba(0,0,0,0.04)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}>
              {estActif && (
                <span style={{
                  position: 'absolute', top: -14, left: 24,
                  background: plan.couleur, color: '#fff',
                  fontSize: 11, fontWeight: 900, padding: '4px 14px', borderRadius: 20,
                  letterSpacing: '0.05em', boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
                }}>
                  ✓ VOTRE PLAN ACTUEL
                </span>
              )}

              {estBusiness && !estActif && (
                <span style={{
                  position: 'absolute', top: -14, left: 24,
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: '#fff',
                  fontSize: 11, fontWeight: 900, padding: '4px 14px', borderRadius: 20,
                  letterSpacing: '0.05em', boxShadow: '0 4px 12px rgba(99,102,241,0.3)'
                }}>
                  👑 FORMULE VIP MULTI-SITES
                </span>
              )}

              {plan.economie > 0 && !estActif && (
                <span style={{
                  position: 'absolute', top: -14, right: 24,
                  background: '#10b981', color: '#fff',
                  fontSize: 11, fontWeight: 900, padding: '4px 14px', borderRadius: 20,
                  boxShadow: '0 4px 10px rgba(16,185,129,0.25)'
                }}>
                  ÉCONOMISEZ {plan.economie.toLocaleString('fr-FR')} FCFA
                </span>
              )}

              <h2 style={{ fontSize: 24, fontWeight: 900, color: estBusiness ? '#4f46e5' : plan.couleur, margin: '6px 0 6px' }}>
                {plan.label}
              </h2>

              {/* Prix */}
              <div style={{ margin: '14px 0 6px' }}>
                <span style={{ fontSize: 36, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
                  {totalAffichage} FCFA
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#64748b', marginLeft: 6 }}>
                  / {duree === 1 ? 'mois' : `${duree} mois`}
                </span>
              </div>

              {duree > 1 && (
                <p style={{ margin: '0 0 16px', fontSize: 13, color: '#059669', fontWeight: 800 }}>
                  Soit seulement <strong>{mensuelAffichage} FCFA</strong> / mois
                </p>
              )}

              <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 22, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
                {modePaiementLabel} • 🎁 1 mois offert
              </p>

              {/* Avantages */}
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                {plan.avantages.map((a) => (
                  <li key={a} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13.5, color: '#334155', lineHeight: 1.4 }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: estBusiness ? '#e0e7ff' : `${plan.couleur}20`, color: estBusiness ? '#4f46e5' : plan.couleur, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <Check size={13} style={{ strokeWidth: 3 }} />
                    </div>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>

              {/* Bouton Souscription Wave */}
              {waveActif && (
                <button
                  onClick={() => handleSouscrire(plan.id)}
                  disabled={isPending || (estActif && duree === 1)}
                  style={{
                    width: '100%', padding: '14px 0', borderRadius: 14, border: 'none',
                    background: (estActif && duree === 1)
                      ? '#e2e8f0'
                      : estBusiness
                      ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
                      : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: (estActif && duree === 1) ? '#64748b' : '#ffffff',
                    fontWeight: 900, fontSize: 15, cursor: (isPending || (estActif && duree === 1)) ? 'default' : 'pointer',
                    boxShadow: (estActif && duree === 1) ? 'none' : estBusiness ? '0 6px 20px rgba(99,102,241,0.35)' : '0 6px 20px rgba(245,158,11,0.35)',
                    transition: 'transform 0.15s ease',
                  }}
                >
                  {enCours ? 'Redirection Wave…' : (estActif && duree === 1) ? 'Plan actif (en cours)' : estActif ? `Renouveler ${duree} mois (${totalAffichage} F)` : `Souscrire ${duree} mois (${totalAffichage} F)`}
                </button>
              )}

              {/* Bouton Paiement Manuel (Wave / Orange Money) */}
              {manuelActif && (
                <button
                  onClick={() => setPlanManuel(plan.id)}
                  disabled={isPending || (estActif && duree === 1)}
                  style={{
                    width: '100%', marginTop: 10, padding: '11px 0', borderRadius: 12,
                    border: '1.5px solid #cbd5e1', background: '#ffffff', color: '#1e293b',
                    fontSize: 13, fontWeight: 800, cursor: (isPending || (estActif && duree === 1)) ? 'default' : 'pointer',
                  }}
                >
                  Payer via Mobile Money (OM / Wave)
                </button>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: 32, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, color: '#64748b', fontSize: 13 }}>
        <ShieldCheck size={18} style={{ color: '#16a34a' }} />
        <span>Paiement sécurisé. Aucun renouvellement automatique sans votre accord.</span>
      </div>

      {planManuel && (
        <ModalPaiementManuel
          reference={`abmt_${userId}_${planManuel}_${duree}`}
          montant={PLANS.find(p => p.id === planManuel)!.totalApresRemise}
          numeroWave={settings.paiement_manuel_numero_wave || ''}
          numeroOM={settings.paiement_manuel_numero_om || ''}
          onClose={() => setPlanManuel(null)}
          onSuccess={() => window.location.reload()}
        />
      )}
    </div>
  )
}
