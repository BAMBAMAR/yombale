'use client'

import React from 'react'
import Link from 'next/link'
import {
  Building2,
  FileText,
  CreditCard,
  MessageCircle,
  Users2,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Lock
} from 'lucide-react'
import { AgenceErpModulesGrid } from './AgenceErpModulesGrid'
import { AgenceComparativeTable } from './AgenceComparativeTable'
import { AgenceSimulatorSection } from './AgenceSimulatorSection'

export function AgenceLandingPublicView() {
  return (
    <div style={{ width: '100%', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* ── 1. HERO B2B IMMOBILIER PRO ── */}
      <section style={{
        background: 'linear-gradient(135deg, var(--navy, #1C2B4A) 0%, #0d1728 100%)',
        color: '#ffffff',
        padding: '50px 16px 80px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: 450, height: 450, background: 'radial-gradient(circle, rgba(199,91,0,0.2) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 980, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(199,91,0,0.18)', color: '#fed7aa',
            padding: '5px 16px', borderRadius: 30, fontSize: 12, fontWeight: 800,
            marginBottom: 20, border: '1px solid rgba(199,91,0,0.35)',
            letterSpacing: '0.04em'
          }}>
            <Building2 size={14} color="#fed7aa" />
            <span>ERP COMPLET POUR AGENCES IMMOBILIÈRES &amp; BAILLEURS AU SÉNÉGAL</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(28px, 4.8vw, 52px)',
            fontWeight: 900,
            margin: '0 0 16px',
            lineHeight: 1.18,
            letterSpacing: '-0.02em'
          }}>
            Le Système d&apos;Exploitation de votre Agence :<br/>
            Baux, Quittances, Bailleurs &amp; Loyers sur <span style={{ color: '#10b981' }}>Wave &amp; WhatsApp</span>.
          </h1>

          <p style={{
            fontSize: 'clamp(15px, 2.2vw, 18px)',
            color: '#94a3b8',
            maxWidth: 760,
            margin: '0 auto 32px',
            lineHeight: 1.55
          }}>
            Remplacez vos classeurs papier et feuilles Excel par une suite logicielle tout-en-un : 
            <strong> baux conformes OHADA, quittances certifiées PDFKit, redditions de comptes bailleurs, CRM avec matching WhatsApp et collecte de loyers Wave 1-clic.</strong>
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
            <Link
              href="/inscription?role=agence&redirect=/agence"
              style={{
                background: 'linear-gradient(135deg, #FF6600 0%, #C75B00 100%)',
                color: '#ffffff',
                padding: '14px 34px', borderRadius: 30,
                fontSize: 16, fontWeight: 900, textDecoration: 'none',
                boxShadow: '0 10px 30px rgba(199,91,0,0.35)',
                display: 'inline-flex', alignItems: 'center', gap: 8,
                transition: 'all 0.15s ease'
              }}
            >
              <span>Créer mon agence (30 jours offerts)</span>
              <ArrowRight size={17} />
            </Link>

            <Link
              href="/connexion?redirect=/agence"
              style={{
                background: 'rgba(255,255,255,0.08)',
                color: '#ffffff',
                padding: '14px 26px', borderRadius: 30,
                fontSize: 15, fontWeight: 800, textDecoration: 'none',
                border: '1px solid rgba(255,255,255,0.2)',
                display: 'inline-flex', alignItems: 'center', gap: 6
              }}
            >
              <Lock size={15} />
              <span>Accéder à mon espace pro</span>
            </Link>
          </div>

          <div style={{
            marginTop: 28, display: 'flex', justifyContent: 'center', alignItems: 'center',
            gap: 20, flexWrap: 'wrap', fontSize: 12.5, color: '#94a3b8', fontWeight: 700
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={15} style={{ color: '#10b981' }} />
              <span>Plan Agence Starter 100% gratuit</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={15} style={{ color: '#10b981' }} />
              <span>Quittances conformes avec QR Code</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={15} style={{ color: '#10b981' }} />
              <span>Reversements nets aux bailleurs</span>
            </div>
          </div>

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <Link
              href="/agences"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                fontWeight: 750,
                color: '#fed7aa',
                textDecoration: 'none',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(254,215,170,0.25)',
                padding: '6px 16px',
                borderRadius: 20,
              }}
            >
              <Building2 size={14} color="var(--accent, #C75B00)" />
              <span>Vous cherchez un bien ? Consulter l&apos;annuaire public des agences vérifiées →</span>
            </Link>
          </div>

        </div>
      </section>

      {/* ── 2. LA GRILLE DES 8 PÔLES DU VÉRITABLE ERP IMMO NOPALOU ── */}
      <div style={{ position: 'relative', zIndex: 3, marginTop: -40 }}>
        <AgenceErpModulesGrid />
      </div>

      {/* ── 3. SIMULATEUR DE GAINS & ROI POUR LES AGENCES DE DAKAR ── */}
      <AgenceSimulatorSection />

      {/* ── 4. COMPARATIF CHOC : GESTION MANUELLE VS NOPALOU ERP ── */}
      <AgenceComparativeTable />

      {/* ── 5. WORKFLOW : DU MANDAT AU PAIEMENT DU LOYER ── */}
      <section style={{ maxWidth: 1000, margin: '0 auto 70px', padding: '0 16px' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent, #C75B00)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Cycle Complet 100% Automatisé
          </span>
          <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 34px)', fontWeight: 900, color: 'var(--navy, #1C2B4A)', margin: '8px 0 0' }}>
            Comment Nopalou Simplifie le Quotidien de votre Cabinet
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 16 }}>
          {[
            { step: '1', titre: 'Saisie du Mandat & Bail', desc: 'Enregistrez le propriétaire, le bien et le bailleur. Les clauses légales sénégalaises sont prêtes en 2 minutes.' },
            { step: '2', titre: 'Échéance & Alerte Wave', desc: 'Le locataire reçoit son avis d\'échéance avec lien de règlement Wave 1-clic direct sur son WhatsApp.' },
            { step: '3', titre: 'Quittance QR Automatique', desc: 'Le paiement est certifié en temps réel. La quittance officielle infalsifiable est émise sans intervention manuelle.' },
            { step: '4', titre: 'Reversement au Bailleur', desc: 'Vos honoraires de gestion sont prélevés à la source et le loyer net est reversé au propriétaire avec compte-rendu clair.' },
          ].map(w => (
            <div key={w.step} style={{ background: '#ffffff', borderRadius: 16, padding: '22px 20px', border: '1.5px solid var(--border, #E8DDD2)', position: 'relative' }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--navy, #1C2B4A)', color: '#fff', fontSize: 13, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                {w.step}
              </div>
              <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: '0 0 6px' }}>{w.titre}</h4>
              <p style={{ fontSize: 12.5, color: 'var(--text-subtle, #5A4E42)', lineHeight: 1.45, margin: 0 }}>{w.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 6. PASSERELLE LOCATAIRES (VOIR MES QUITTANCES) ── */}
      <section style={{ maxWidth: 1000, margin: '0 auto 70px', padding: '0 16px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #F8F5F0 0%, #FFFDF9 100%)',
          borderRadius: 20, border: '1.5px solid var(--border, #E8DDD2)',
          padding: '28px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 20, flexWrap: 'wrap'
        }}>
          <div style={{ maxWidth: 580 }}>
            <span style={{ fontSize: 11, fontWeight: 900, background: 'rgba(10, 92, 54, 0.12)', color: 'var(--price, #0A5C36)', padding: '3px 10px', borderRadius: 12, textTransform: 'uppercase' }}>
              Espace Locataire Dédié
            </span>
            <h3 style={{ fontSize: 20, fontWeight: 900, color: 'var(--navy, #1C2B4A)', margin: '8px 0 6px' }}>
              Votre agence utilise Nopalou ?
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-subtle, #5A4E42)', margin: 0, lineHeight: 1.5 }}>
              Connectez-vous pour consulter vos baux, payer votre loyer en 1 clic par Wave ou Orange Money et télécharger vos quittances certifiées avec QR Code.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link
              href="/payer-loyer"
              style={{
                background: '#10b981', color: '#ffffff', padding: '12px 20px', borderRadius: 12,
                fontSize: 13.5, fontWeight: 800, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6
              }}
            >
              <CreditCard size={15} />
              <span>Payer mon loyer</span>
            </Link>
            <Link
              href="/compte?tab=locations"
              style={{
                background: 'var(--navy, #1C2B4A)', color: '#ffffff', padding: '12px 20px', borderRadius: 12,
                fontSize: 13.5, fontWeight: 800, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6
              }}
            >
              <span>Espace quittances</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 7. BANNIÈRE FINALE DE CONVERSION PRO ── */}
      <section style={{
        background: 'linear-gradient(135deg, var(--navy, #1C2B4A) 0%, #0d1728 100%)',
        color: '#ffffff', padding: '54px 20px', textAlign: 'center'
      }}>
        <div style={{ maxWidth: 740, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(24px, 3.8vw, 36px)', fontWeight: 900, margin: '0 0 14px' }}>
            Modernisez la gestion de votre agence dès aujourd&apos;hui
          </h2>
          <p style={{ fontSize: 14.5, color: '#94a3b8', margin: '0 auto 26px', maxWidth: 580, lineHeight: 1.5 }}>
            Rejoignez les administrateurs de biens et cabinets immobiliers qui font confiance à Nopalou au Sénégal. 0 frais d&apos;installation, 30 jours offerts.
          </p>
          <Link
            href="/inscription?role=agence&redirect=/agence"
            style={{
              background: 'linear-gradient(135deg, #FF6600 0%, #C75B00 100%)',
              color: '#ffffff', padding: '15px 38px', borderRadius: 30,
              fontSize: 16, fontWeight: 900, textDecoration: 'none',
              boxShadow: '0 8px 24px rgba(199,91,0,0.4)', display: 'inline-flex', alignItems: 'center', gap: 8
            }}
          >
            <span>Créer mon compte agence pro</span>
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>

    </div>
  )
}
