'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Building2,
  Crown,
  Check,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Network,
  Users2,
  FileCheck2,
  CheckCircle2,
} from 'lucide-react'
import { fcfa } from '@/lib/format'
import { PLANS_AGENCES_CONFIG, DUREES_INITIALES, DureeOption, PlanConfig } from '@/app/tarifs-boutique/tarifsData'

export function AgencePlansPricingSection() {
  const [duree, setDuree] = useState<number>(12) // 12 mois (1 an) par défaut pour la meilleure remise
  const [dureesOptions, setDureesOptions] = useState<DureeOption[]>(DUREES_INITIALES)
  const [plans, setPlans] = useState<PlanConfig[]>(PLANS_AGENCES_CONFIG)
  const [sponsoring, setSponsoring] = useState<any>(null)

  // Synchronisation 100% dynamique depuis la base de données (API publique administrable)
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'}/api/plans/public`)
      .then(res => res.json())
      .then(data => {
        if (data?.plans && Array.isArray(data.plans)) {
          const immoPlansDb = data.plans.filter((p: any) => p.categorie === 'immo' && p.actif !== false && p.slug !== 'immo_sponsoring')
          if (immoPlansDb.length > 0) {
            setPlans(immoPlansDb.map((p: any) => ({
              id: p.slug,
              nom: p.label,
              tag: p.badge || (p.slug === 'immo_pro' ? 'Solution Métier Complète' : 'Formule Pro'),
              prixMensuelBase: Number(p.prix_mensuel) || 0,
              description: p.description || '',
              recommande: Boolean(p.slug === 'immo_pro' || (p.badge && p.badge.toLowerCase().includes('recommandé'))),
              features: Array.isArray(p.avantages) && p.avantages.length > 0 ? p.avantages : [],
              ctaText: Number(p.prix_mensuel) === 0 ? 'Créer mon agence gratuite' : 'Activer cette formule (30 jours offerts)',
              ctaHref: `/inscription?role=agence&plan=${p.slug}&redirect=/agence`,
            })))
          }
          const sp = data.plans.find((p: any) => p.slug === 'immo_sponsoring')
          if (sp) {
            setSponsoring(sp)
          }
        }
      })
      .catch(() => {})

    // Récupérer les remises configurées
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'}/api/settings/public`)
      .then(res => res.json())
      .then(settings => {
        if (!settings) return
        if (settings.reduc_3_mois || settings.reduc_6_mois || settings.reduc_12_mois) {
          const r3 = Number(settings.reduc_3_mois) / 100 || 0.10
          const r6 = Number(settings.reduc_6_mois) / 100 || 0.15
          const r12 = Number(settings.reduc_12_mois) / 100 || 0.25
          setDureesOptions([
            { mois: 1, label: '1 mois', sousTitre: 'Tarif mensuel', remise: 0, badge: null },
            { mois: 3, label: '3 mois', sousTitre: 'Trimestriel', remise: r3, badge: `-${r3 * 100}%` },
            { mois: 6, label: '6 mois', sousTitre: 'Semestriel', remise: r6, badge: `-${r6 * 100}%` },
            { mois: 12, label: '12 mois (1 an)', sousTitre: 'Annuel', remise: r12, badge: `-${r12 * 100}% (3 mois offerts)` },
          ])
        }
      })
      .catch(() => {})
  }, [])

  const optionDuree = dureesOptions.find(d => d.mois === duree) || dureesOptions[0]

  return (
    <section
      id="forfaits-agence"
      style={{
        maxWidth: 1180,
        margin: '0 auto 70px',
        padding: '0 16px',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* ── En-tête de section ── */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(124, 58, 237, 0.1)',
            color: '#7c3aed',
            padding: '4px 14px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: 10,
          }}
        >
          <Crown size={14} color="#7c3aed" />
          <span>Formules &amp; Abonnements Agences Immobilières</span>
        </div>

        <h2
          style={{
            fontSize: 'clamp(24px, 3.8vw, 36px)',
            fontWeight: 900,
            color: 'var(--navy, #1C2B4A)',
            margin: '0 0 10px',
            lineHeight: 1.22,
          }}
        >
          Des Tarifs Clairs, Rentables et Sans Commission Cachée
        </h2>

        <p
          style={{
            fontSize: 14.5,
            color: 'var(--text-subtle, #5A4E42)',
            maxWidth: 720,
            margin: '0 auto',
            lineHeight: 1.5,
          }}
        >
          Choisissez la formule calibrée pour votre agence : du mandataire indépendant au réseau multi-succursales. 
          Baux conformes OHADA, quittances certifiées et collecte des loyers Wave &amp; OM.
        </p>
      </div>

      {/* ── Sélecteur de Durée / Remise ── */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div
          style={{
            display: 'inline-grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: 8,
            background: '#ffffff',
            padding: 6,
            borderRadius: 20,
            border: '1.5px solid var(--border, #E8DDD2)',
            boxShadow: '0 4px 18px rgba(0,0,0,0.04)',
            maxWidth: 680,
            width: '100%',
          }}
        >
          {dureesOptions.map(d => {
            const isSelected = duree === d.mois
            return (
              <button
                key={d.mois}
                type="button"
                onClick={() => setDuree(d.mois)}
                style={{
                  padding: '10px 14px',
                  borderRadius: 14,
                  border: isSelected ? '2px solid #7c3aed' : '1px solid transparent',
                  background: isSelected ? '#f5f3ff' : 'transparent',
                  color: isSelected ? '#6d28d9' : '#64748b',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                  outline: 'none',
                }}
              >
                {d.badge && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 6,
                      background: d.mois === 12 ? '#10b981' : '#7c3aed',
                      color: '#ffffff',
                      fontSize: 9,
                      fontWeight: 900,
                      padding: '2px 6px',
                      borderRadius: 10,
                    }}
                  >
                    {d.badge}
                  </span>
                )}
                <p style={{ margin: 0, fontWeight: isSelected ? 900 : 700, fontSize: 14 }}>{d.label}</p>
                <p
                  style={{
                    margin: '2px 0 0',
                    fontSize: 11,
                    color: isSelected ? '#7c3aed' : '#94a3b8',
                    fontWeight: 600,
                  }}
                >
                  {d.sousTitre}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Grille des Cartes Forfaits Agences ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 310px), 1fr))',
          gap: 22,
          marginBottom: 30,
        }}
      >
        {plans.map(plan => {
          const totalBrut = plan.prixMensuelBase * duree
          const totalApresRemise = Math.round(totalBrut * (1 - optionDuree.remise))
          const mensuelEquiv = Math.round(totalApresRemise / duree)
          const economie = totalBrut - totalApresRemise
          const isPro = plan.recommande || plan.id === 'immo_pro'

          return (
            <div
              key={plan.id}
              style={{
                background: '#ffffff',
                borderRadius: 20,
                padding: '28px 24px',
                border: isPro ? '2.5px solid #7c3aed' : '1.5px solid var(--border, #E8DDD2)',
                boxShadow: isPro
                  ? '0 12px 35px rgba(124, 58, 237, 0.12)'
                  : '0 8px 24px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
              }}
            >
              {isPro && (
                <span
                  style={{
                    position: 'absolute',
                    top: -13,
                    right: 20,
                    background: '#7c3aed',
                    color: '#ffffff',
                    padding: '3px 12px',
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Sparkles size={11} />
                  Formule Recommandée
                </span>
              )}

              <div>
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 800,
                    color: isPro ? '#6d28d9' : '#475569',
                    background: isPro ? '#ede9fe' : '#f1f5f9',
                    padding: '4px 10px',
                    borderRadius: 12,
                    display: 'inline-block',
                  }}
                >
                  {plan.tag}
                </span>

                <h3 style={{ fontSize: 22, fontWeight: 900, margin: '12px 0 6px', color: 'var(--navy, #1C2B4A)' }}>
                  {plan.nom}
                </h3>
                <p style={{ color: 'var(--text-subtle, #5A4E42)', fontSize: 13, margin: '0 0 18px', lineHeight: 1.45, minHeight: 40 }}>
                  {plan.description}
                </p>

                {/* Tarification mensuelle & remise */}
                <div style={{ marginBottom: 20, borderBottom: '1px solid #f1f5f9', paddingBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontSize: 32, fontWeight: 900, color: plan.prixMensuelBase === 0 ? '#10b981' : 'var(--navy, #1C2B4A)' }}>
                      {plan.prixMensuelBase === 0 ? '100% Inclus' : `${mensuelEquiv.toLocaleString('fr-FR')} FCFA`}
                    </span>
                    {plan.prixMensuelBase > 0 && (
                      <span style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>/ mois</span>
                    )}
                  </div>

                  {duree > 1 && plan.prixMensuelBase > 0 && (
                    <div style={{ marginTop: 4, fontSize: 12, color: '#64748b' }}>
                      Facturé <strong>{totalApresRemise.toLocaleString('fr-FR')} FCFA</strong> pour {duree} mois
                    </div>
                  )}

                  {economie > 0 && (
                    <div
                      style={{
                        display: 'inline-block',
                        marginTop: 6,
                        background: '#ecfdf5',
                        color: '#047857',
                        border: '1px solid #a7f3d0',
                        fontSize: 11,
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: 8,
                      }}
                    >
                      Économie : {economie.toLocaleString('fr-FR')} FCFA ({optionDuree.badge})
                    </div>
                  )}
                </div>

                {/* Liste des fonctionnalités */}
                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    fontSize: 13,
                    color: '#334155',
                  }}
                >
                  {plan.features.map((ft, idx) => (
                    <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <Check
                        size={15}
                        color={isPro ? '#7c3aed' : '#10b981'}
                        style={{ flexShrink: 0, marginTop: 2 }}
                      />
                      <span>{ft}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href={`${plan.ctaHref}&duree=${duree}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  textAlign: 'center',
                  background: isPro
                    ? 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)'
                    : 'var(--navy, #1C2B4A)',
                  color: '#ffffff',
                  padding: '13px 20px',
                  borderRadius: 12,
                  fontWeight: 800,
                  fontSize: 14,
                  textDecoration: 'none',
                  marginTop: 24,
                  boxShadow: isPro ? '0 4px 14px rgba(124, 58, 237, 0.3)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{plan.ctaText}</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          )
        })}
      </div>

      {/* ── Encadré Optionnel : Sponsoring & Mise en Avant Annuaire ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
          borderRadius: 16,
          border: '1.5px solid #fde68a',
          padding: '22px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 20,
          flexWrap: 'wrap',
          marginBottom: 32,
        }}
      >
        <div style={{ maxWidth: 700 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 900,
                color: '#b45309',
                background: '#fef3c7',
                border: '1px solid #fcd34d',
                padding: '2px 8px',
                borderRadius: 10,
                textTransform: 'uppercase',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Sparkles size={11} color="#b45309" />
              Option Visibilité Annuaire N°1
            </span>
          </div>
          <h4 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 900, color: '#78350f' }}>
            Mise en Avant Sponsoring (Badge doré &quot;En Vedette&quot;) — 5 000 FCFA / 30 jours
          </h4>
          <p style={{ margin: 0, fontSize: 12.5, color: '#92400e', lineHeight: 1.45 }}>
            Propulsez votre cabinet en tête des recherches sur l&apos;annuaire immobilier officiel (/agences), bénéficiez du badge de confiance et recevez jusqu&apos;à 3x plus de contacts de propriétaires bailleurs.
          </p>
        </div>

        <Link
          href="/inscription?role=agence&plan=immo_sponsoring&redirect=/agence"
          style={{
            background: '#b45309',
            color: '#ffffff',
            padding: '10px 18px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 800,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            whiteSpace: 'nowrap',
          }}
        >
          <span>Activer le Sponsoring</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* ── Engagements & Rassurance ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 24,
          flexWrap: 'wrap',
          fontSize: 12.5,
          color: '#64748b',
          fontWeight: 700,
          borderTop: '1px solid var(--border, #E8DDD2)',
          paddingTop: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <CheckCircle2 size={15} color="#10b981" />
          <span>30 jours d&apos;essai gratuit sans engagement</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ShieldCheck size={15} color="#10b981" />
          <span>0% de commission sur vos loyers et honoraires</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <FileCheck2 size={15} color="#10b981" />
          <span>Baux conformes droit OHADA &amp; quittances infalsifiables</span>
        </div>
      </div>
    </section>
  )
}
