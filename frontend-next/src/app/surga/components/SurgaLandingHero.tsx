'use client'

import React from 'react'
import {
  Sun,
  Calculator,
  Compass,
  ArrowRight,
  ShieldCheck,
  Zap,
  Radio,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react'

interface SurgaLandingHeroProps {
  onDemarrerOnboarding: () => void
  onIgnorerVersApp?: () => void
}

export default function SurgaLandingHero({
  onDemarrerOnboarding,
  onIgnorerVersApp,
}: SurgaLandingHeroProps) {
  return (
    <div className="surga-container" style={{ paddingBottom: 40 }}>
      {/* En-tête Héroïque */}
      <section
        style={{
          textAlign: 'center',
          padding: '36px 16px 28px',
          background: 'linear-gradient(180deg, #F8F5F0 0%, #FFFFFF 100%)',
          borderRadius: 16,
          border: '1px solid var(--border, #E8DDD2)',
          marginTop: 12,
          boxShadow: '0 4px 20px rgba(28, 43, 74, 0.04)',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--surga-accent-soft, rgba(217, 119, 6, 0.08))',
            color: 'var(--surga-accent, #D97706)',
            padding: '6px 14px',
            borderRadius: 20,
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 16,
          }}
        >
          <Sun size={14} strokeWidth={2.5} />
          <span>Votre assistant personnel à Dakar</span>
        </div>

        <h1
          style={{
            fontSize: 26,
            fontWeight: 800,
            lineHeight: 1.25,
            color: 'var(--surga-primary, #0F172A)',
            margin: '0 0 14px',
          }}
        >
          L&apos;essentiel de votre quotidien à Dakar, en une seule application
        </h1>

        <p
          style={{
            fontSize: 15,
            lineHeight: 1.55,
            color: 'var(--surga-text2, #475569)',
            maxWidth: 520,
            margin: '0 auto 24px',
          }}
        >
          Briefing matinal sourcé, suivi précis de vos dépenses en FCFA, calculatrice déterministe,
          trafic en temps réel sur les grands axes et alertes locales. Tout est conçu pour être rapide,
          économe en données mobiles et utilisable hors ligne.
        </p>

        {/* Bouton d'action principal CTA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <button
            type="button"
            onClick={onDemarrerOnboarding}
            className="surga-btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '14px 28px',
              fontSize: 16,
              fontWeight: 700,
              borderRadius: 12,
              color: '#FFFFFF',
              border: 'none',
              cursor: 'pointer',
              width: '100%',
              maxWidth: 340,
            }}
          >
            <span>Démarrer ma journée avec Surga</span>
            <ArrowRight size={18} />
          </button>

          {onIgnorerVersApp && (
            <button
              type="button"
              onClick={onIgnorerVersApp}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--navy, #1C2B4A)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                padding: '6px 12px',
                textDecoration: 'underline',
              }}
            >
              Accéder directement sans configuration
            </button>
          )}
        </div>
      </section>

      {/* Les 3 piliers essentiels */}
      <section style={{ marginTop: 32 }}>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--navy, #1C2B4A)',
            marginBottom: 16,
            textAlign: 'left',
          }}
        >
          Pourquoi Surga deviendra votre réflexe chaque matin
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
          {/* Carte 1 : Briefing */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--border, #E8DDD2)',
              borderRadius: 12,
              padding: 18,
              display: 'flex',
              gap: 14,
              alignItems: 'flex-start',
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'rgba(199, 91, 0, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent, #C75B00)',
                flexShrink: 0,
              }}
            >
              <Sun size={20} />
            </div>
            <div>
              <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
                Briefing Matinal & Presse
              </h3>
              <p style={{ margin: 0, fontSize: 14, color: '#6A5F53', lineHeight: 1.5 }}>
                L&apos;actualité sénégalaise résumée en 180 caractères avec sources officielles vérifiées (APS, Le Soleil),
                météo dakaroise et Unes de la presse.
              </p>
            </div>
          </div>

          {/* Carte 2 : Dépenses & Calculs */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--border, #E8DDD2)',
              borderRadius: 12,
              padding: 18,
              display: 'flex',
              gap: 14,
              alignItems: 'flex-start',
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'rgba(10, 92, 54, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--price, #0A5C36)',
                flexShrink: 0,
              }}
            >
              <Calculator size={20} />
            </div>
            <div>
              <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
                Finances & Dépenses en FCFA
              </h3>
              <p style={{ margin: 0, fontSize: 14, color: '#6A5F53', lineHeight: 1.5 }}>
                Enregistrez vos dépenses quotidiennes en un geste, à l&apos;écrit ou par la voix. Moteur arithmétique 100% exact et déterministe.
              </p>
            </div>
          </div>

          {/* Carte 3 : Trafic & Mobilité */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--border, #E8DDD2)',
              borderRadius: 12,
              padding: 18,
              display: 'flex',
              gap: 14,
              alignItems: 'flex-start',
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'rgba(28, 43, 74, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--navy, #1C2B4A)',
                flexShrink: 0,
              }}
            >
              <Compass size={20} />
            </div>
            <div>
              <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
                Trafic TomTom en Direct
              </h3>
              <p style={{ margin: 0, fontSize: 14, color: '#6A5F53', lineHeight: 1.5 }}>
                État de la circulation sur l&apos;A1, la VDN, la Corniche Ouest et la RN1, avec prévisions aux heures de pointe et état du TER et du BRT.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Garanties et engagements */}
      <section
        style={{
          marginTop: 28,
          padding: 16,
          background: 'var(--bg, #F8F5F0)',
          borderRadius: 12,
          display: 'flex',
          justifyContent: 'space-around',
          flexWrap: 'wrap',
          gap: 16,
          fontSize: 13,
          color: '#5A4E42',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShieldCheck size={18} color="var(--price, #0A5C36)" />
          <span>Données chiffrées & privées</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Zap size={18} color="var(--accent, #C75B00)" />
          <span>Fonctionne hors connexion</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Radio size={18} color="var(--navy, #1C2B4A)" />
          <span>Radios FM sénégalaises</span>
        </div>
      </section>
    </div>
  )
}
