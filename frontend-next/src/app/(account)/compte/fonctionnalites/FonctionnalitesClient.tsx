'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FONCTIONNALITES_PLATEFORME, PALIERS_BOUTIQUE, PalierBoutique } from '@/lib/fonctionnalites-data'
import { useTranslation } from '@/i18n/context'
import { fcfa } from '@/lib/format'
import { Sparkles, Check, Gift, ShieldCheck, Zap, ArrowRight, Store, Star, Crown } from 'lucide-react'

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

export default function FonctionnalitesClient() {
  const [planActif, setPlanActif] = useState<{ plan: string; fin: string } | null>(null)
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [duree, setDuree] = useState<number>(12) // 12 mois sélectionné par défaut
  const { t } = useTranslation()

  useEffect(() => {
    const cacheKey = 'nopalou_offline_fonctionnalites'
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      try {
        const d = JSON.parse(cached)
        setPlanActif(d.planActif)
        setSettings(d.settings)
        setLoading(false)
      } catch (e) {}
    }

    Promise.all([
      fetch('/api/abonnements/mon-plan').then(r => r.ok ? r.json() : {}).catch(() => ({})),
      fetch('/api/settings/public').then(r => r.ok ? r.json() : {}).catch(() => ({}))
    ]).then(([planData, settingsData]) => {
      const plan = (planData as { abonnement?: { plan: string; fin: string } })?.abonnement || null
      setPlanActif(plan)
      setSettings(settingsData as Record<string, string>)
      localStorage.setItem(cacheKey, JSON.stringify({ planActif: plan, settings: settingsData }))
      setLoading(false)
    })
  }, [])

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

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '16px 8px 60px', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* ── En-tête de section ── */}
      <div style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto 36px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: '#FFF3E8',
          border: '1px solid #FFE0C2',
          padding: '6px 16px',
          borderRadius: 30,
          color: '#C75B00',
          fontSize: 13,
          fontWeight: 800,
          marginBottom: 12,
          boxShadow: '0 1px 3px rgba(199,91,0,0.08)',
        }}>
          <Sparkles size={15} />
          <span>Formules & Forfaits Boutiques Nopalou</span>
        </div>

        <h1 style={{ fontSize: 30, fontWeight: 900, color: '#1C2B4A', margin: '0 0 10px', letterSpacing: '-0.02em', lineHeight: 1.25 }}>
          {t('account.featuresTitle') || 'Fonctionnalités & Forfaits'}
        </h1>
        <p style={{ color: '#64748b', fontSize: 15, margin: 0, lineHeight: 1.6 }}>
          {t('account.featuresDesc') || 'Découvrez l’ensemble des outils et forfaits conçus pour accélérer votre commerce, vos ventes et votre visibilité au Sénégal.'}
        </p>

        {/* ── Sélecteur de Durée / Remise ── */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: '#F1F5F9',
          padding: 5,
          borderRadius: 16,
          border: '1px solid #E2E8F0',
          marginTop: 24,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          {DUREES.map(d => {
            const isSelected = duree === d.mois
            return (
              <button
                key={d.mois}
                type="button"
                onClick={() => setDuree(d.mois)}
                style={{
                  border: 'none',
                  background: isSelected ? '#ffffff' : 'transparent',
                  color: isSelected ? '#1C2B4A' : '#64748b',
                  fontWeight: isSelected ? 800 : 600,
                  fontSize: 13,
                  padding: '8px 14px',
                  borderRadius: 12,
                  cursor: 'pointer',
                  boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{d.label}</span>
                {d.badge && (
                  <span style={{
                    fontSize: 10.5,
                    fontWeight: 900,
                    background: isSelected ? '#FEF2F2' : '#FEE2E2',
                    color: '#DC2626',
                    padding: '2px 6px',
                    borderRadius: 6,
                  }}>
                    {d.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Grille des 4 Forfaits Boutiques ── */}
      <section style={{ marginBottom: 54 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
          {PALIERS_BOUTIQUE.map(palier => {
            const estActuel = palierActuelId === palier.id || (palierActuelId === 'taf_taf' && palier.id === 'decouverte')
            const prixBase = PRIX_BASE_PAR_PALIER[palier.id]
            
            let prixMensuelFmt = '0 FCFA'
            let sousPrixDetail = 'Gratuit à vie'
            let badgePromo = null

            if (prixBase !== null && typeof prixBase === 'number') {
              const totalBrut = prixBase * duree
              const totalApresRemise = Math.round(totalBrut * (1 - optionDuree.remise))
              const prixMensuelEquivalent = Math.round(totalApresRemise / duree)
              
              prixMensuelFmt = `${fcfa(prixMensuelEquivalent)}`
              
              if (duree > 1 && optionDuree.remise > 0) {
                sousPrixDetail = `${fcfa(totalApresRemise)} facturés pour ${duree} mois`
                badgePromo = `${optionDuree.badge}`
              } else {
                sousPrixDetail = 'Facturé au mois'
              }
            }

            const estPopulaire = palier.id === 'decouverte'
            const estRecommande = palier.id === 'pro'
            const estBusiness = palier.id === 'business'

            return (
              <div
                key={palier.id}
                style={{
                  background: '#ffffff',
                  border: estActuel
                    ? `2.5px solid ${palier.couleur}`
                    : estRecommande
                    ? '2px solid #C75B00'
                    : '1.5px solid #E2E8F0',
                  borderRadius: 18,
                  padding: '24px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  boxShadow: estRecommande || estActuel
                    ? '0 10px 30px rgba(199, 91, 0, 0.08)'
                    : '0 4px 16px rgba(0,0,0,0.03)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
              >
                {/* Badge supérieur */}
                {estActuel ? (
                  <span style={{
                    position: 'absolute', top: -13, left: 16,
                    background: palier.couleur, color: '#ffffff',
                    fontSize: 11, fontWeight: 900, padding: '3px 12px', borderRadius: 20,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                  }}>
                    <Check size={12} strokeWidth={3} /> {t('account.currentTierBadge') || 'Votre formule actuelle'}
                  </span>
                ) : estRecommande ? (
                  <span style={{
                    position: 'absolute', top: -13, left: 16,
                    background: '#C75B00', color: '#ffffff',
                    fontSize: 11, fontWeight: 900, padding: '3px 12px', borderRadius: 20,
                    boxShadow: '0 2px 6px rgba(199,91,0,0.3)',
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                  }}>
                    <Star size={12} fill="#fff" /> Recommandé Pro
                  </span>
                ) : estPopulaire ? (
                  <span style={{
                    position: 'absolute', top: -13, left: 16,
                    background: '#10B981', color: '#ffffff',
                    fontSize: 11, fontWeight: 900, padding: '3px 12px', borderRadius: 20,
                    boxShadow: '0 2px 6px rgba(16,185,129,0.3)',
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                  }}>
                    <Zap size={12} /> Populaire
                  </span>
                ) : estBusiness ? (
                  <span style={{
                    position: 'absolute', top: -13, left: 16,
                    background: '#1E3A5F', color: '#ffffff',
                    fontSize: 11, fontWeight: 900, padding: '3px 12px', borderRadius: 20,
                    boxShadow: '0 2px 6px rgba(30,58,95,0.3)',
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                  }}>
                    <Crown size={12} /> VIP Business
                  </span>
                ) : null}

                <div>
                  {/* Titre du forfait */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, marginTop: (estActuel || estRecommande || estPopulaire || estBusiness) ? 4 : 0 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 900, color: palier.couleur, margin: 0 }}>
                      {palier.label}
                    </h3>
                  </div>

                  {/* Prix */}
                  <div style={{ margin: '12px 0 16px', paddingBottom: 16, borderBottom: '1px solid #F1F5F9' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      <span style={{ fontSize: 24, fontWeight: 900, color: '#1C2B4A', letterSpacing: '-0.02em' }}>
                        {prixMensuelFmt}
                      </span>
                      {prixBase !== null && (
                        <span style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>
                          / mois
                        </span>
                      )}
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: 11.5, color: '#64748B', fontWeight: 500 }}>
                      {sousPrixDetail}
                    </p>
                    {prixBase !== null && (
                      <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 4, background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0', padding: '3px 8px', borderRadius: 8, fontSize: 11, fontWeight: 800 }}>
                        <Gift size={12} /> 1er mois 100% OFFERT
                      </div>
                    )}
                  </div>

                  {/* Liste des avantages */}
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {palier.avantages.map((a, idx) => (
                      <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: '#334155', lineHeight: 1.45 }}>
                        <span style={{ color: palier.couleur, fontWeight: 900, flexShrink: 0, fontSize: 14 }}>✓</span>
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Bouton d'action */}
                <div>
                  {estActuel ? (
                    <div style={{
                      display: 'block',
                      textAlign: 'center',
                      background: '#F1F5F9',
                      color: '#475569',
                      padding: '11px 0',
                      borderRadius: 12,
                      fontWeight: 800,
                      fontSize: 13.5,
                      border: '1px solid #CBD5E1',
                    }}>
                      ✓ {t('account.currentTierBadge') || 'Formule active'}
                    </div>
                  ) : palier.id === 'gratuit' ? (
                    <Link
                      href="/creer-boutique"
                      style={{
                        display: 'block',
                        textAlign: 'center',
                        background: '#ffffff',
                        color: '#1C2B4A',
                        border: '1.5px solid #CBD5E1',
                        padding: '11px 0',
                        borderRadius: 12,
                        textDecoration: 'none',
                        fontWeight: 800,
                        fontSize: 13.5,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      Ouvrir ma boutique gratuite
                    </Link>
                  ) : (
                    <Link
                      href="/boutique/abonnement"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        background: palier.couleur === '#f59e0b' ? 'linear-gradient(135deg, #C75B00 0%, #ea580c 100%)' : palier.couleur,
                        color: '#ffffff',
                        padding: '11px 0',
                        borderRadius: 12,
                        textDecoration: 'none',
                        fontWeight: 800,
                        fontSize: 13.5,
                        boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span>{RANG_PALIER[palier.id] > RANG_PALIER[palierActuelId] ? 'Passer à cette formule' : 'Changer pour cette offre'}</span>
                      <ArrowRight size={15} />
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Toutes les Fonctionnalités de la Plateforme Nopalou ── */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FFF3E8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C75B00' }}>
            <Store size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#1C2B4A', margin: 0 }}>
              {t('account.platformOffers') || 'Toutes les fonctionnalités Nopalou'}
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748B' }}>
              Une suite complète d’outils web & WhatsApp pour particuliers et professionnels
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {FONCTIONNALITES_PLATEFORME.map(f => (
            <div
              key={f.id}
              style={{
                border: '1px solid #E2E8F0',
                borderRadius: 14,
                padding: '18px 16px',
                background: '#ffffff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.15s ease, border-color 0.15s ease',
              }}
            >
              <div>
                <span style={{ fontSize: 28, display: 'block', marginBottom: 10 }}>{f.emoji}</span>
                <h4 style={{ fontSize: 14.5, fontWeight: 800, color: '#1C2B4A', margin: '0 0 6px' }}>{f.label}</h4>
                <p style={{ fontSize: 12.5, color: '#64748B', margin: 0, lineHeight: 1.55 }}>{f.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
