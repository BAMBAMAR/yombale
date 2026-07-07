'use client'
import { useState, useTransition } from 'react'
import { initierWaveAbonnement } from '@/app/actions/paiement'
import ModalPaiementManuel from '@/components/ModalPaiementManuel'

const PLANS_DEFAUT = {
  pro: 15000,
  business: 35000,
}

const PLANS_INFO = [
  {
    id: 'pro' as const,
    label: 'Boutique Pro',
    couleur: '#C75B00',
    avantages: [
      'Placement prioritaire dans /boutiques',
      'Badge "Vendeur Pro" sur toutes vos annonces',
      '5 annonces classées incluses/mois',
      'Tableau de bord analytics (vues, clics)',
      'Statistiques des prix concurrents',
    ],
  },
  {
    id: 'business' as const,
    label: 'Boutique Business',
    couleur: '#1e3a5f',
    avantages: [
      'Tout ce qui est inclus dans Pro',
      'URL dédiée /boutiques/[votre-nom]',
      '15 annonces classées incluses/mois',
      'Bannière dans 1 page catégorie',
      'Support prioritaire WhatsApp',
    ],
  },
]

interface Props {
  planActif: { plan: string; fin: string } | null
  userId: string
  settings: Record<string, string>
}

export default function AbonnementClient({ planActif, userId, settings }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [planManuel, setPlanManuel] = useState<'pro' | 'business' | null>(null)

  const manuelActif = settings.paiement_manuel_actif !== 'false'
  const waveActif   = settings.paiement_wave !== 'false'
  const modePaiementLabel = waveActif && manuelActif
    ? 'Paiement via Wave ou manuel — renouvellement manuel'
    : waveActif
    ? 'Paiement via Wave — renouvellement manuel'
    : 'Paiement manuel — renouvellement manuel'
  const PLANS = PLANS_INFO.map(p => ({
    ...p,
    prix: Number(settings[`plan_${p.id}_prix`]) || PLANS_DEFAUT[p.id],
  }))

  const handleSouscrire = (plan: 'pro' | 'business') => {
    setError(null)
    setLoadingPlan(plan)
    startTransition(async () => {
      const result = await initierWaveAbonnement(plan)
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
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 16px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Abonnement Boutique</h1>
      <p style={{ color: '#64748b', marginBottom: 32 }}>
        Boostez votre visibilité et gérez votre boutique comme un pro.
      </p>

      {planActif && (
        <div style={{
          background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 12,
          padding: '16px 20px', marginBottom: 32, display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 24 }}>✅</span>
          <div>
            <strong>Plan {planActif.plan === 'pro' ? 'Pro' : 'Business'} actif</strong>
            <p style={{ margin: 0, color: '#16a34a', fontSize: 14 }}>
              Valable jusqu&apos;au {finDate}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8,
          padding: '12px 16px', marginBottom: 24, color: '#dc2626',
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
        {PLANS.map((plan) => {
          const estActif = planActif?.plan === plan.id
          const enCours  = isPending && loadingPlan === plan.id
          return (
            <div key={plan.id} style={{
              border: `2px solid ${estActif ? plan.couleur : '#e2e8f0'}`,
              borderRadius: 16, padding: 28,
              background: estActif ? '#fffbf5' : '#fff',
              position: 'relative',
            }}>
              {estActif && (
                <span style={{
                  position: 'absolute', top: -12, left: 24,
                  background: plan.couleur, color: '#fff',
                  fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 20,
                }}>
                  VOTRE PLAN
                </span>
              )}
              <h2 style={{ fontSize: 20, fontWeight: 700, color: plan.couleur, marginBottom: 4 }}>
                {plan.label}
              </h2>
              <p style={{ fontSize: 28, fontWeight: 800, margin: '8px 0 4px' }}>
                {plan.prix.toLocaleString('fr-FR')} FCFA
                <span style={{ fontSize: 14, fontWeight: 400, color: '#64748b' }}>/mois</span>
              </p>
              <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>
                {modePaiementLabel}
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {plan.avantages.map((a) => (
                  <li key={a} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 14 }}>
                    <span style={{ color: plan.couleur, fontWeight: 700, flexShrink: 0 }}>✓</span>
                    {a}
                  </li>
                ))}
              </ul>
              {(waveActif || estActif) && (
                <button
                  onClick={() => handleSouscrire(plan.id)}
                  disabled={isPending || !!planActif}
                  style={{
                    width: '100%', padding: '12px 0', borderRadius: 10, border: 'none',
                    background: planActif ? '#e2e8f0' : plan.couleur,
                    color: planActif ? '#64748b' : '#fff',
                    fontWeight: 700, fontSize: 15, cursor: (isPending || !!planActif) ? 'default' : 'pointer',
                  }}
                >
                  {estActif ? 'Plan actif' : enCours ? 'Redirection Wave…' : `Souscrire ${plan.label}`}
                </button>
              )}

              {manuelActif && !estActif && (
                <button
                  onClick={() => setPlanManuel(plan.id)}
                  disabled={isPending || !!planActif}
                  style={{ width: '100%', marginTop: 8, padding: '8px 0', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', color: '#374151', fontSize: 13, fontWeight: 600, cursor: (isPending || !!planActif) ? 'default' : 'pointer' }}
                >
                  Payer manuellement (Wave/Orange)
                </button>
              )}
            </div>
          )
        })}
      </div>

      <p style={{ marginTop: 24, fontSize: 13, color: '#94a3b8', textAlign: 'center' }}>
        Paiement sécurisé par Wave. Pas de débit automatique — vous recevrez un email de rappel 7 jours avant expiration.
      </p>

      {planManuel && (
        <ModalPaiementManuel
          reference={`abmt_${userId}_${planManuel}`}
          montant={PLANS.find(p => p.id === planManuel)!.prix}
          numeroWave={settings.paiement_manuel_numero_wave || ''}
          numeroOM={settings.paiement_manuel_numero_om || ''}
          onClose={() => setPlanManuel(null)}
          onSuccess={() => window.location.reload()}
        />
      )}
    </div>
  )
}
