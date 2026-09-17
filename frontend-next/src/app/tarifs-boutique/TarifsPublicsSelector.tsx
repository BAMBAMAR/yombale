'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Store, Building2, Check, Sparkles, Zap, ArrowRight } from 'lucide-react'
import {
  type DureeOption,
  type PlanConfig,
  DUREES_INITIALES,
  PLANS_BOUTIQUES_CONFIG,
  PLANS_AGENCES_CONFIG
} from './tarifsData'

export default function TarifsPublicsSelector() {
  const [secteur, setSecteur] = useState<'commerce' | 'immo'>('commerce')
  const [duree, setDuree] = useState<number>(12) // 12 mois par défaut
  const [plans, setPlans] = useState<PlanConfig[]>(PLANS_BOUTIQUES_CONFIG)
  const [dureesOptions, setDureesOptions] = useState<DureeOption[]>(DUREES_INITIALES)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'}/api/settings/public`)
      .then(res => res.json())
      .then(settings => {
        if (!settings) return;
        setPlans(prev => prev.map(p => {
          if (p.id === 'taf_taf') {
            return {
              ...p,
              nom: settings.plan_decouverte_label || p.nom,
              prixMensuelBase: Number(settings.plan_decouverte_prix) || 2500,
            };
          }
          if (p.id === 'pro') {
            return {
              ...p,
              nom: settings.plan_pro_label || p.nom,
              prixMensuelBase: Number(settings.plan_pro_prix) || 5000,
            };
          }
          if (p.id === 'business') {
            return {
              ...p,
              nom: settings.plan_business_label || p.nom,
              prixMensuelBase: Number(settings.plan_business_prix) || 10000,
            };
          }
          return p;
        }));

        if (settings.reduc_3_mois || settings.reduc_6_mois || settings.reduc_12_mois) {
          const r3 = Number(settings.reduc_3_mois) / 100 || 0.10;
          const r6 = Number(settings.reduc_6_mois) / 100 || 0.15;
          const r12 = Number(settings.reduc_12_mois) / 100 || 0.25;
          setDureesOptions([
            { mois: 1, label: '1 mois', sousTitre: 'Tarif mensuel', remise: 0, badge: null },
            { mois: 3, label: '3 mois', sousTitre: 'Trimestriel', remise: r3, badge: `-${r3 * 100}%` },
            { mois: 6, label: '6 mois', sousTitre: 'Semestriel', remise: r6, badge: `-${r6 * 100}%` },
            { mois: 12, label: '12 mois (1 an)', sousTitre: 'Annuel', remise: r12, badge: `-${r12 * 100}%` },
          ]);
        }
      })
      .catch(() => {});
  }, []);

  const optionDuree = dureesOptions.find((d) => d.mois === duree) || dureesOptions[0]
  const activePlans = secteur === 'immo' ? PLANS_AGENCES_CONFIG : plans

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* SÉLECTEUR D'UNIVERS : COMMERCES VS AGENCES IMMOBILIÈRES */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
        <div style={{
          display: 'inline-flex',
          background: '#ffffff',
          padding: '5px',
          borderRadius: 30,
          border: '1.5px solid var(--border, #E8DDD2)',
          boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
          gap: 6,
          maxWidth: '100%',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          <button
            type="button"
            onClick={() => setSecteur('commerce')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '9px 18px', borderRadius: 24, fontSize: 13,
              fontWeight: secteur === 'commerce' ? 850 : 650,
              border: 'none', cursor: 'pointer',
              background: secteur === 'commerce' ? 'var(--navy, #1C2B4A)' : 'transparent',
              color: secteur === 'commerce' ? '#ffffff' : 'var(--navy, #1C2B4A)',
              boxShadow: secteur === 'commerce' ? '0 3px 10px rgba(28,43,74,0.2)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Store size={15} color={secteur === 'commerce' ? '#fed7aa' : 'currentColor'} />
            <span>Commerces, Boutiques &amp; POS</span>
          </button>

          <button
            type="button"
            onClick={() => setSecteur('immo')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '9px 18px', borderRadius: 24, fontSize: 13,
              fontWeight: secteur === 'immo' ? 850 : 650,
              border: 'none', cursor: 'pointer',
              background: secteur === 'immo' ? 'var(--navy, #1C2B4A)' : 'transparent',
              color: secteur === 'immo' ? '#ffffff' : 'var(--navy, #1C2B4A)',
              boxShadow: secteur === 'immo' ? '0 3px 10px rgba(28,43,74,0.2)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Building2 size={15} color={secteur === 'immo' ? '#fed7aa' : 'currentColor'} />
            <span>Agences &amp; Gestion Locative</span>
            <span style={{ fontSize: 9.5, fontWeight: 900, background: 'rgba(16,185,129,0.2)', color: secteur === 'immo' ? '#86efac' : '#10b981', padding: '1px 5px', borderRadius: 6 }}>
              IMMO
            </span>
          </button>
        </div>
      </div>

      {/* SÉLECTEUR DE DURÉE */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <p
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: '#475569',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 12,
          }}
        >
          Choisissez la durée de votre forfait (Remise selon votre choix) :
        </p>

        <div
          style={{
            display: 'inline-grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: 8,
            background: '#ffffff',
            padding: 8,
            borderRadius: 20,
            border: '1px solid #cbd5e1',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            maxWidth: 680,
            width: '100%',
          }}
        >
          {dureesOptions.map((d) => {
            const isSelected = duree === d.mois
            return (
              <button
                key={d.mois}
                onClick={() => setDuree(d.mois)}
                style={{
                  padding: '12px 14px',
                  borderRadius: 14,
                  border: isSelected ? '2px solid #C75B00' : '1px solid transparent',
                  background: isSelected ? '#fff7ed' : 'transparent',
                  color: isSelected ? '#9a3412' : '#64748b',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
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
                      background: d.mois === 12 ? '#dc2626' : '#C75B00',
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
                <p style={{ margin: 0, fontWeight: isSelected ? 900 : 700, fontSize: 15 }}>{d.label}</p>
                <p
                  style={{
                    margin: '2px 0 0',
                    fontSize: 11,
                    color: isSelected ? '#C75B00' : '#94a3b8',
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

      {/* GRILLE DES CARTES DE FORFAITS (RESPONSIVE SANS DÉBORDEMENT) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 24 }}>
        {activePlans.map((plan) => {
          const totalBrut = plan.prixMensuelBase * duree
          const totalApresRemise = Math.round(totalBrut * (1 - optionDuree.remise))
          const mensuelEquiv = Math.round(totalApresRemise / duree)
          const economie = totalBrut - totalApresRemise

          return (
            <div
              key={plan.id}
              style={{
                background: '#ffffff',
                borderRadius: 20,
                padding: 32,
                border: plan.recommande ? '2.5px solid #C75B00' : '1px solid #cbd5e1',
                boxShadow: plan.recommande
                  ? '0 12px 35px rgba(199,91,0,0.15)'
                  : '0 10px 30px rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
              }}
            >
              {plan.recommande && (
                <span
                  style={{
                    position: 'absolute',
                    top: -14,
                    right: 24,
                    background: '#C75B00',
                    color: '#ffffff',
                    padding: '4px 14px',
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 900,
                    textTransform: 'uppercase',
                  }}
                >
                  Recommandé
                </span>
              )}

              <div>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: plan.recommande ? '#C75B00' : '#475569',
                    background: plan.recommande ? '#fff7ed' : '#f1f5f9',
                    padding: '4px 10px',
                    borderRadius: 12,
                  }}
                >
                  {plan.tag}
                </span>

                <h3 style={{ fontSize: 24, fontWeight: 900, margin: '12px 0 8px', color: '#0f172a' }}>
                  {plan.nom}
                </h3>
                <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 20px', lineHeight: 1.5 }}>
                  {plan.description}
                </p>

                {/* TARIFICATION DYNAMIQUE */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontSize: 34, fontWeight: 900, color: plan.prixMensuelBase === 0 ? '#10b981' : '#0f172a' }}>
                      {plan.prixMensuelBase === 0 ? '100% Gratuit' : `${mensuelEquiv.toLocaleString('fr-FR')} FCFA`}
                    </span>
                    {plan.prixMensuelBase > 0 && <span style={{ color: '#64748b', fontSize: 14 }}>/ mois</span>}
                  </div>

                  {duree > 1 && plan.prixMensuelBase > 0 && (
                    <div style={{ marginTop: 6, fontSize: 13, color: '#475569', fontWeight: 600 }}>
                      Facturé <strong style={{ color: '#0f172a' }}>{totalApresRemise.toLocaleString('fr-FR')} FCFA</strong> pour {duree} mois
                    </div>
                  )}

                  {economie > 0 && (
                    <div
                      style={{
                        display: 'inline-block',
                        marginTop: 8,
                        background: '#f0fdf4',
                        color: '#16a34a',
                        border: '1px solid #bbf7d0',
                        fontSize: 12,
                        fontWeight: 800,
                        padding: '3px 10px',
                        borderRadius: 10,
                      }}
                    >
                      Économisez {economie.toLocaleString('fr-FR')} FCFA ({optionDuree.badge})
                    </div>
                  )}
                </div>

                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    fontSize: 14,
                    color: '#334155',
                  }}
                >
                  {plan.features.map((ft, idx) => (
                    <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: '#16a34a', fontWeight: 900 }}>✓</span>
                      <span>{ft}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href={`${plan.ctaHref}&duree=${duree}`}
                style={{
                  display: 'block',
                  textAlign: 'center',
                  background: plan.recommande ? '#C75B00' : '#0f172a',
                  color: '#ffffff',
                  padding: '14px 20px',
                  borderRadius: 12,
                  fontWeight: 800,
                  textDecoration: 'none',
                  marginTop: 28,
                  boxShadow: plan.recommande ? '0 4px 14px rgba(199,91,0,0.3)' : 'none',
                  transition: 'transform 0.15s ease',
                }}
              >
                {plan.ctaText}
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}
