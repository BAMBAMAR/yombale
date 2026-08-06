'use client'
import { useState, useTransition } from 'react'
import { initierWaveAbonnement } from '@/app/actions/paiement'
import ModalPaiementManuel from '@/components/ModalPaiementManuel'
import { PALIERS_BOUTIQUE } from '@/lib/fonctionnalites-data'
import { Sparkles, Check, Zap, Gift, ShieldCheck } from 'lucide-react'

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
    const remise = duree >= 12 ? 0.25 : duree >= 6 ? 0.15 : duree >= 3 ? 0.10 : duree >= 2 ? 0.05 : 0
    const badge = duree >= 12 ? '🔥 -25% (3m offerts)' : duree >= 6 ? '-15%' : duree >= 3 ? '-10%' : duree >= 2 ? '-5%' : null

    const totalBrut = prixMensuelBase * duree
    const totalApresRemise = Math.round(totalBrut * (1 - remise))
    const prixMensuelEquivalent = Math.round(totalApresRemise / duree)
    const economie = totalBrut - totalApresRemise

    return {
      ...p,
      prixMensuelBase,
      totalApresRemise,
      prixMensuelEquivalent,
      economie,
      remiseBadge: badge,
    }
  })

  const handleSouscrire = (plan: 'pro' | 'business') => {
    setError(null)
    setLoadingPlan(plan)
    startTransition(async () => {
      const result = await initierWaveAbonnement(plan, duree)
      if (result.ok && result.url) {
        window.location.href = result.url
      } else {
        setError(result.error ?? 'Une erreur est survenue')
        setLoadingPlan(null)
      }
    })
  }

  const finDate = planActif ? new Date(planActif.fin).toLocaleDateString('fr-FR') : null

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 16px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
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

        {/* Champ de Saisie Durée Librement Définie par le Marchand */}
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>
            ✏️ Ou saisissez le nombre de mois exact souhaité :
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="number"
              min={1}
              max={36}
              value={duree}
              onChange={(e) => {
                const val = Math.max(1, Math.min(36, parseInt(e.target.value, 10) || 1))
                setDuree(val)
              }}
              style={{
                width: 76,
                padding: '6px 10px',
                borderRadius: 10,
                border: '2px solid #C75B00',
                fontWeight: 900,
                fontSize: 16,
                textAlign: 'center',
                outline: 'none',
                background: '#fff7ed',
                color: '#9a3412',
              }}
            />
            <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>mois</span>
          </div>
        </div>
      </div>

      {/* 💳 CARTES DES PLANS BOUTIQUE */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: 24 }}>
        {PLANS.map((plan) => {
          const estActif = planActif?.plan === plan.id
          const enCours = isPending && loadingPlan === plan.id
          const totalAffichage = plan.totalApresRemise.toLocaleString('fr-FR')
          const mensuelAffichage = plan.prixMensuelEquivalent.toLocaleString('fr-FR')

          return (
            <div key={plan.id} style={{
              border: `2.5px solid ${estActif ? plan.couleur : '#e2e8f0'}`,
              borderRadius: 20, padding: 30,
              background: estActif ? '#fffbf5' : '#fff',
              position: 'relative', display: 'flex', flexDirection: 'column',
              boxShadow: estActif ? '0 12px 30px rgba(199,91,0,0.15)' : '0 6px 20px rgba(0,0,0,0.04)',
            }}>
              {estActif && (
                <span style={{
                  position: 'absolute', top: -14, left: 24,
                  background: plan.couleur, color: '#fff',
                  fontSize: 11, fontWeight: 900, padding: '3px 12px', borderRadius: 20,
                  letterSpacing: '0.05em',
                }}>
                  VOTRE PLAN ACTUEL
                </span>
              )}

              {plan.economie > 0 && !estActif && (
                <span style={{
                  position: 'absolute', top: -14, right: 24,
                  background: '#16a34a', color: '#fff',
                  fontSize: 11, fontWeight: 900, padding: '3px 12px', borderRadius: 20,
                }}>
                  ÉCONOMISEZ {plan.economie.toLocaleString('fr-FR')} FCFA
                </span>
              )}

              <h2 style={{ fontSize: 22, fontWeight: 900, color: plan.couleur, margin: '0 0 6px' }}>
                {plan.label}
              </h2>

              {/* Prix */}
              <div style={{ margin: '12px 0 6px' }}>
                <span style={{ fontSize: 34, fontWeight: 900, color: '#0f172a' }}>
                  {totalAffichage} FCFA
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#64748b', marginLeft: 6 }}>
                  / {duree === 1 ? 'mois' : `${duree} mois`}
                </span>
              </div>

              {duree > 1 && (
                <p style={{ margin: '0 0 16px', fontSize: 13, color: '#16a34a', fontWeight: 700 }}>
                  Soit environ <strong>{mensuelAffichage} FCFA</strong> / mois
                </p>
              )}

              <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 22, borderBottom: '1px solid #f1f5f9', paddingBottom: 12 }}>
                {modePaiementLabel}
              </p>

              {/* Avantages */}
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                {plan.avantages.map((a) => (
                  <li key={a} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: '#334155', lineHeight: 1.4 }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: `${plan.couleur}15`, color: plan.couleur, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <Check size={12} style={{ strokeWidth: 3 }} />
                    </div>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>

              {/* Bouton Souscription Wave */}
              {(waveActif || estActif) && (
                <button
                  onClick={() => handleSouscrire(plan.id)}
                  disabled={isPending || !!planActif}
                  style={{
                    width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
                    background: planActif ? '#e2e8f0' : (plan.id === 'business' ? '#1e3a5f' : '#C75B00'),
                    color: planActif ? '#64748b' : '#fff',
                    fontWeight: 900, fontSize: 15, cursor: (isPending || !!planActif) ? 'default' : 'pointer',
                    boxShadow: planActif ? 'none' : '0 4px 14px rgba(0,0,0,0.15)',
                    transition: 'transform 0.15s ease',
                  }}
                >
                  {estActif ? 'Plan actif' : enCours ? 'Redirection Wave…' : `Souscrire ${duree} mois (${totalAffichage} F)`}
                </button>
              )}

              {/* Bouton Paiement Manuel (Wave / Orange Money) */}
              {manuelActif && !estActif && (
                <button
                  onClick={() => setPlanManuel(plan.id)}
                  disabled={isPending || !!planActif}
                  style={{
                    width: '100%', marginTop: 10, padding: '10px 0', borderRadius: 10,
                    border: '1.5px solid #cbd5e1', background: '#fff', color: '#334151',
                    fontSize: 13, fontWeight: 700, cursor: (isPending || !!planActif) ? 'default' : 'pointer',
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
