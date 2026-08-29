'use client'

import React, { useState, useTransition } from 'react'
import Link from 'next/link'
import { initierWaveAbonnement } from '@/app/actions/paiement'
import ModalPaiementManuel from '@/components/ModalPaiementManuel'
import { PALIERS_BOUTIQUE, FONCTIONNALITES_PLATEFORME } from '@/lib/fonctionnalites-data'
import { Sparkles, Check, Zap, Gift, ShieldCheck, Star, Crown, ArrowRight, Store, ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import { useTranslation } from '@/i18n/context'
import { fcfa } from '@/lib/format'

interface Props {
  planActif: { plan: string; fin: string } | null
  userId: string
  settings: Record<string, string>
}

interface DureeOption {
  mois: number
  label: string
  sousTitre: string
  remise: number
  badge: string | null
}

const DUREES: DureeOption[] = [
  { mois: 1, label: '1 mois', sousTitre: 'Tarif mensuel', remise: 0, badge: null },
  { mois: 3, label: '3 mois', sousTitre: 'Trimestriel', remise: 0.10, badge: '-10%' },
  { mois: 6, label: '6 mois', sousTitre: 'Semestriel', remise: 0.15, badge: '-15%' },
  { mois: 12, label: '12 mois (1 an)', sousTitre: 'Annuel', remise: 0.25, badge: '🔥 -25% (3 mois offerts)' },
]

export default function AbonnementClient({ planActif, userId, settings }: Props) {
  const { t } = useTranslation()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [planManuel, setPlanManuel] = useState<'decouverte' | 'pro' | 'business' | null>(null)
  const [duree, setDuree] = useState<number>(12) // 12 mois sélectionné par défaut

  const prixDecouverteBase = Number(settings.plan_decouverte_prix) || 2500
  const prixProBase = Number(settings.plan_pro_prix) || 5000
  const prixBusinessBase = Number(settings.plan_business_prix) || 10000

  const PRIX_BASE_PAR_PALIER: Record<string, number | null> = {
    gratuit: null,
    decouverte: prixDecouverteBase,
    taf_taf: prixDecouverteBase,
    pro: prixProBase,
    business: prixBusinessBase,
  }

  const optionDuree = DUREES.find(d => d.mois === duree) || DUREES[0]
  const palierActuelId = planActif ? planActif.plan : 'gratuit'
  const RANG_PALIER: Record<string, number> = { gratuit: 0, decouverte: 1, taf_taf: 1, pro: 2, business: 3 }

  const handleSouscrireWave = (planId: 'decouverte' | 'pro' | 'business') => {
    setError(null)
    setLoadingPlan(planId)
    startTransition(async () => {
      const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || sessionStorage.getItem('token') || undefined) : undefined
      const result = await initierWaveAbonnement(planId as 'pro' | 'business', duree, token)
      if (result.ok && result.url) {
        window.location.href = result.url
      } else {
        if (result.error) {
          setError(result.error)
        }
        if (result.fallbackManuel) {
          setPlanManuel(planId)
        }
        setLoadingPlan(null)
      }
    })
  }

  const finDate = planActif ? new Date(planActif.fin).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : null

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .premium-wrapper { font-family: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'; max-width: 1100px; margin: 0 auto; padding: 24px 16px 80px; }
        .hero-title { font-size: 42px; font-weight: 900; background: linear-gradient(135deg, #1C2B4A 0%, #C75B00 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0 0 14px; line-height: 1.15; letter-spacing: -0.03em; }
        .hero-badge { display: inline-flex; align-items: center; gap: 6px; background: linear-gradient(90deg, #FFF3E8, #FFE0C2); border: 1px solid rgba(199,91,0,0.2); padding: 6px 16px; border-radius: 30px; color: #C75B00; font-size: 13.5px; font-weight: 800; margin-bottom: 16px; box-shadow: 0 4px 12px rgba(199,91,0,0.1); }
        .duration-toggle { display: inline-flex; align-items: center; gap: 6px; background: #F8FAFC; padding: 6px; border-radius: 20px; border: 1px solid #E2E8F0; margin-top: 28px; flex-wrap: wrap; justify-content: center; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02); }
        .duration-btn { border: none; background: transparent; color: #64748B; font-weight: 600; font-size: 14px; padding: 10px 18px; border-radius: 14px; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
        .duration-btn.active { background: #ffffff; color: #1C2B4A; font-weight: 800; box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
        .pricing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px; margin-bottom: 56px; align-items: stretch; }
        .pricing-card { background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1.5px solid #E2E8F0; border-radius: 24px; padding: 36px 24px 28px; display: flex; flex-direction: column; justify-content: space-between; position: relative; box-shadow: 0 4px 20px rgba(0,0,0,0.04); transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease; }
        .pricing-card:hover { transform: translateY(-8px); box-shadow: 0 20px 40px rgba(0,0,0,0.08); }
        .pricing-card.pro { border: 2px solid #C75B00; box-shadow: 0 12px 32px rgba(199, 91, 0, 0.12); z-index: 2; }
        .pricing-card.pro:hover { box-shadow: 0 24px 48px rgba(199, 91, 0, 0.2); }
        .pricing-card.business { border: 2px solid #1E3A5F; box-shadow: 0 12px 32px rgba(30, 58, 95, 0.12); }
        .pricing-card.business:hover { box-shadow: 0 24px 48px rgba(30, 58, 95, 0.2); }
        .badge-float { position: absolute; top: -14px; left: 50%; transform: translateX(-50%); color: #ffffff; font-size: 11.5px; font-weight: 900; padding: 5px 18px; border-radius: 20px; display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; letter-spacing: 0.02em; }
        .badge-pro { background: linear-gradient(135deg, #C75B00 0%, #ea580c 100%); box-shadow: 0 4px 12px rgba(199,91,0,0.3); }
        .badge-business { background: linear-gradient(135deg, #1E3A5F 0%, #0f172a 100%); box-shadow: 0 4px 12px rgba(30,58,95,0.3); }
        .badge-actuel { background: #10B981; box-shadow: 0 4px 12px rgba(16,185,129,0.3); }
        .btn-cta { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 14px 0; border-radius: 14px; border: none; font-weight: 800; font-size: 14.5px; cursor: pointer; transition: all 0.25s ease; width: 100%; box-shadow: 0 4px 14px rgba(0,0,0,0.08); }
        .btn-cta.primary { background: linear-gradient(135deg, #C75B00 0%, #ea580c 100%); color: #ffffff; }
        .btn-cta.primary:hover:not(:disabled) { transform: scale(1.02); box-shadow: 0 8px 24px rgba(199,91,0,0.25); filter: brightness(1.1); }
        .btn-cta.business { background: linear-gradient(135deg, #1E3A5F 0%, #0f172a 100%); color: #ffffff; }
        .btn-cta.business:hover:not(:disabled) { transform: scale(1.02); box-shadow: 0 8px 24px rgba(30,58,95,0.25); filter: brightness(1.2); }
        .btn-cta.outline { background: #ffffff; color: #1C2B4A; border: 1.5px solid #CBD5E1; box-shadow: none; }
        .btn-cta.outline:hover { border-color: #94A3B8; background: #F8FAFC; }
        .btn-cta:disabled { opacity: 0.7; cursor: not-allowed; transform: none !important; }
        .feature-item { display: flex; align-items: flex-start; gap: 10px; font-size: 13.5px; color: #334155; line-height: 1.5; margin-bottom: 14px; }
        .feature-icon-wrapper { flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; font-size: 13px; }
        .feature-icon-wrapper.basic { background: #F0FDF4; color: #16A34A; }
        .feature-icon-wrapper.pro { background: #FFF7ED; color: #C75B00; }
        .feature-icon-wrapper.business { background: #F1F5F9; color: #1E3A5F; }
        @keyframes pulseGlow { 0% { box-shadow: 0 0 0 0 rgba(199,91,0, 0.4); } 70% { box-shadow: 0 0 0 12px rgba(199,91,0, 0); } 100% { box-shadow: 0 0 0 0 rgba(199,91,0, 0); } }
        .animate-pulse-glow { animation: pulseGlow 2s infinite; }
        
        @media (max-width: 768px) {
          .hero-title { font-size: 32px; }
          .pricing-grid { grid-template-columns: 1fr; }
        }
      `}} />

      <div className="premium-wrapper">
        
        {/* Bouton retour */}
        <div style={{ marginBottom: 24 }}>
          <Link
            href="/boutique"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: '#ffffff',
              border: '1px solid #CBD5E1',
              borderRadius: 12,
              padding: '10px 16px',
              color: '#1C2B4A',
              fontSize: 13.5,
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#F8FAFC'}
            onMouseOut={(e) => e.currentTarget.style.background = '#ffffff'}
          >
            <ArrowLeft size={16} />
            <span>Retour à l&apos;espace Boutique</span>
          </Link>
        </div>

        {/* ── En-tête (Hero) ── */}
        <div style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto 40px' }}>
          <div className="hero-badge animate-pulse-glow">
            <Sparkles size={16} />
            <span>Formules & Forfaits Boutiques Nopalou</span>
          </div>

          <h1 className="hero-title">
            {t('account.featuresTitle') || 'Abonnements & Formules Vendeurs'}
          </h1>
          <p style={{ color: '#64748B', fontSize: 16, margin: 0, lineHeight: 1.6, fontWeight: 500 }}>
            {t('account.featuresDesc') || 'Boostez votre commerce, vos ventes WhatsApp, votre caisse enregistreuse tactile et votre catalogue au Sénégal avec nos offres premium.'}
          </p>

          {/* ── Sélecteur de Durée ── */}
          <div className="duration-toggle">
            {DUREES.map(d => {
              const isSelected = duree === d.mois
              return (
                <button
                  key={d.mois}
                  type="button"
                  onClick={() => setDuree(d.mois)}
                  className={`duration-btn ${isSelected ? 'active' : ''}`}
                >
                  <span>{d.label}</span>
                  {d.badge && (
                    <span style={{
                      fontSize: 11,
                      fontWeight: 900,
                      background: isSelected ? '#FEF2F2' : '#FEE2E2',
                      color: '#DC2626',
                      padding: '3px 8px',
                      borderRadius: 8,
                    }}>
                      {d.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Alerte Plan Actif */}
        {planActif && (
          <div style={{
            background: 'linear-gradient(90deg, #F0FDF4, #DCFCE7)',
            border: '1.5px solid #86EFAC',
            borderRadius: 18,
            padding: '20px 24px',
            marginBottom: 36,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            boxShadow: '0 8px 24px rgba(22,163,74,0.08)',
          }}>
            <span style={{ fontSize: 32, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>🎉</span>
            <div>
              <strong style={{ fontSize: 16, color: '#14532D', display: 'block', marginBottom: 4 }}>
                Formule active : {planActif.plan === 'business' ? '👑 Boutique Business VIP' : planActif.plan === 'pro' ? '⭐ Boutique Pro' : planActif.plan === 'decouverte' || planActif.plan === 'taf_taf' ? '⚡ Boutique Taf Taf (Mois offert)' : 'Gratuit'}
              </strong>
              <p style={{ margin: 0, color: '#15803D', fontSize: 14, lineHeight: 1.5 }}>
                {(planActif.plan === 'decouverte' || planActif.plan === 'taf_taf') ? (
                  <>Vous profitez actuellement de votre mois d&apos;essai gratuit. Il est valide jusqu&apos;au <strong style={{color:'#14532D'}}>{finDate}</strong>. Passez au plan Pro ou Business pour continuer sans interruption.</>
                ) : (
                  <>Votre forfait est actif jusqu&apos;au <strong style={{color:'#14532D'}}>{finDate}</strong>. Vous pouvez le renouveler ou changer d&apos;offre ci-dessous.</>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Bannière Erreur */}
        {error && (
          <div style={{
            background: '#FEF2F2',
            border: '1px solid #FCA5A5',
            borderRadius: 12,
            padding: '16px 20px',
            marginBottom: 24,
            color: '#DC2626',
            fontWeight: 600,
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* ── Grille des Forfaits Boutiques ── */}
        <section>
          <div className="pricing-grid">
            {PALIERS_BOUTIQUE.map(palier => {
              const estActuel = palierActuelId === palier.id || (palierActuelId === 'taf_taf' && palier.id === 'decouverte')
              const prixBase = PRIX_BASE_PAR_PALIER[palier.id]
              const enCours = isPending && loadingPlan === palier.id
              
              let prixMensuelFmt = '0 FCFA'
              let sousPrixDetail = 'Gratuit à vie'
              let totalMontant = 0

              if (prixBase !== null && typeof prixBase === 'number') {
                const totalBrut = prixBase * duree
                const totalApresRemise = Math.round(totalBrut * (1 - optionDuree.remise))
                const prixMensuelEquivalent = Math.round(totalApresRemise / duree)
                totalMontant = totalApresRemise
                
                prixMensuelFmt = `${fcfa(prixMensuelEquivalent)}`
                
                if (duree > 1 && optionDuree.remise > 0) {
                  sousPrixDetail = `${fcfa(totalApresRemise)} pour ${duree} mois`
                } else {
                  sousPrixDetail = 'Facturé au mois'
                }
              }

              const estPopulaire = palier.id === 'decouverte'
              const estRecommande = palier.id === 'pro'
              const estBusiness = palier.id === 'business'
              
              const cardClass = `pricing-card ${estRecommande ? 'pro' : estBusiness ? 'business' : ''}`
              const btnClass = `btn-cta ${estRecommande ? 'primary' : estBusiness ? 'business' : 'outline'}`
              const iconClass = `feature-icon-wrapper ${estRecommande ? 'pro' : estBusiness ? 'business' : 'basic'}`

              return (
                <div key={palier.id} className={cardClass}>
                  {/* Badge supérieur */}
                  {estActuel ? (
                    <span className="badge-float badge-actuel">
                      <Check size={14} strokeWidth={3} /> Formule actuelle
                    </span>
                  ) : estRecommande ? (
                    <span className="badge-float badge-pro animate-pulse-glow">
                      <Star size={14} fill="#fff" /> Recommandé Pro
                    </span>
                  ) : estBusiness ? (
                    <span className="badge-float badge-business">
                      <Crown size={14} fill="#fff" /> VIP Business
                    </span>
                  ) : null}

                  <div>
                    {/* Titre */}
                    <div style={{ marginBottom: 8, marginTop: (estActuel || estRecommande || estBusiness) ? 8 : 0 }}>
                      <h3 style={{ fontSize: 22, fontWeight: 900, color: palier.couleur, margin: 0, letterSpacing: '-0.02em' }}>
                        {palier.label}
                      </h3>
                    </div>

                    {/* Prix */}
                    <div style={{ margin: '16px 0 24px', paddingBottom: 24, borderBottom: '2px dashed #F1F5F9' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                        <span style={{ fontSize: 32, fontWeight: 900, color: '#1C2B4A', letterSpacing: '-0.03em' }}>
                          {prixMensuelFmt}
                        </span>
                        {prixBase !== null && (
                          <span style={{ fontSize: 14, color: '#64748B', fontWeight: 700 }}>
                            / mois
                          </span>
                        )}
                      </div>
                      <p style={{ margin: '6px 0 0', fontSize: 13, color: '#64748B', fontWeight: 600 }}>
                        {sousPrixDetail}
                      </p>
                      {prixBase !== null && (
                        <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'linear-gradient(90deg, #F0FDF4, #DCFCE7)', color: '#15803D', padding: '4px 12px', borderRadius: 10, fontSize: 12, fontWeight: 800 }}>
                          <Gift size={14} /> 1er mois 100% OFFERT
                        </div>
                      )}
                    </div>

                    {/* Avantages */}
                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column' }}>
                      {palier.avantages.map((a, idx) => (
                        <li key={idx} className="feature-item">
                          <span className={iconClass}><Check size={12} strokeWidth={3} /></span>
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Boutons d'action */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {palier.id === 'gratuit' ? (
                      <Link href="/boutique" className="btn-cta outline" style={{ textDecoration: 'none' }}>
                        Formule de base gratuite
                      </Link>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleSouscrireWave(palier.id as 'decouverte' | 'pro' | 'business')}
                          disabled={isPending}
                          className={btnClass}
                        >
                          {enCours ? (
                            <>
                              <Loader2 size={16} className="animate-spin" />
                              <span>Connexion Wave…</span>
                            </>
                          ) : estActuel ? (
                            <>
                              <span>Renouveler {duree} mois ({fcfa(totalMontant)})</span>
                              <ArrowRight size={16} />
                            </>
                          ) : (
                            <>
                              <span>{RANG_PALIER[palier.id] > RANG_PALIER[palierActuelId] ? 'Passer à cette formule' : 'Changer pour cette offre'}</span>
                              <ArrowRight size={16} />
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setPlanManuel(palier.id as 'decouverte' | 'pro' | 'business')}
                          disabled={isPending}
                          style={{
                            background: 'transparent',
                            border: '1px solid transparent',
                            padding: '8px 0',
                            fontSize: 12,
                            fontWeight: 700,
                            color: '#64748B',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            textDecorationColor: '#CBD5E1',
                            textUnderlineOffset: 4,
                            transition: 'color 0.2s'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.color = '#1C2B4A'}
                          onMouseOut={(e) => e.currentTarget.style.color = '#64748B'}
                        >
                          Autre moyen (Orange Money, Free...)
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Garantie Sécurité */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, color: '#475569', fontSize: 14, fontWeight: 500, marginBottom: 56, background: '#F8FAFC', padding: '16px 24px', borderRadius: 16, maxWidth: 600, margin: '0 auto 56px' }}>
          <ShieldCheck size={24} style={{ color: '#16A34A' }} />
          <span>Paiement sécurisé instantané. Aucun prélèvement automatique sans votre consentement explicite.</span>
        </div>

        {/* ── Toutes les Fonctionnalités de la Plateforme ── */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28, justifyContent: 'center', textAlign: 'center', flexDirection: 'column' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #FFF3E8, #FFE0C2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C75B00', boxShadow: '0 8px 16px rgba(199,91,0,0.1)' }}>
              <Store size={28} />
            </div>
            <div>
              <h2 style={{ fontSize: 26, fontWeight: 900, color: '#1C2B4A', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
                {t('account.platformOffers') || 'Toutes les fonctionnalités incluses avec Nopalou'}
              </h2>
              <p style={{ margin: 0, fontSize: 15, color: '#64748B', fontWeight: 500 }}>
                Une plateforme tout-en-un conçue pour les commerçants sénégalais ambitieux
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {FONCTIONNALITES_PLATEFORME.map(f => (
              <div
                key={f.id}
                style={{
                  border: '1px solid #E2E8F0',
                  borderRadius: 20,
                  padding: '24px 20px',
                  background: '#ffffff',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'default'
                }}
                onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.06)'; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.02)'; }}
              >
                <div>
                  <span style={{ fontSize: 32, display: 'block', marginBottom: 14 }}>{f.emoji}</span>
                  <h4 style={{ fontSize: 16, fontWeight: 800, color: '#1C2B4A', margin: '0 0 8px' }}>{f.label}</h4>
                  <p style={{ fontSize: 13.5, color: '#64748B', margin: 0, lineHeight: 1.6 }}>{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Modal Paiement Manuel (Optionnel / Déclaratif) */}
        {planManuel && (
          <ModalPaiementManuel
            reference={`abmt_${userId}_${planManuel}_${duree}_${Date.now()}`}
            montant={Math.round((PRIX_BASE_PAR_PALIER[planManuel] || 5000) * duree * (1 - optionDuree.remise))}
            numeroWave={settings.paiement_manuel_numero_wave || '777202086'}
            numeroOM={settings.paiement_manuel_numero_om || '777202086'}
            onClose={() => setPlanManuel(null)}
            onSuccess={() => window.location.reload()}
          />
        )}

      </div>
    </>
  )
}

