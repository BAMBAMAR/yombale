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
  QrCode,
  Smartphone,
  ChevronRight,
  Zap
} from 'lucide-react'

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

        <div style={{ maxWidth: 960, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(199,91,0,0.18)', color: '#fed7aa',
            padding: '5px 16px', borderRadius: 30, fontSize: 12, fontWeight: 800,
            marginBottom: 20, border: '1px solid rgba(199,91,0,0.35)',
            letterSpacing: '0.04em'
          }}>
            <Building2 size={14} color="#fed7aa" />
            <span>SOLUTION PRO POUR AGENCES IMMOBILIÈRES &amp; BAILLEURS AU SÉNÉGAL</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(28px, 4.8vw, 52px)',
            fontWeight: 900,
            margin: '0 0 16px',
            lineHeight: 1.18,
            letterSpacing: '-0.02em'
          }}>
            Gérez vos baux, automatisez les quittances <br/>
            et encaissez les loyers sur <span style={{ color: '#10b981' }}>Wave &amp; WhatsApp</span>.
          </h1>

          <p style={{
            fontSize: 'clamp(15px, 2.2vw, 18px)',
            color: '#94a3b8',
            maxWidth: 720,
            margin: '0 auto 32px',
            lineHeight: 1.55
          }}>
            Éliminez la paperasse manuelle et les retards de paiement. Nopalou digitalise toute votre gestion locative : 
            <strong> baux conformes OHADA, quittances certifiées PDFKit, relances 1-clic et CRM avec alertes WhatsApp.</strong>
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
            <Link
              href="/inscription?role=agence&redirect=/agence"
              style={{
                background: 'linear-gradient(135deg, #FF6600 0%, #C75B00 100%)',
                color: '#ffffff',
                padding: '14px 32px', borderRadius: 30,
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
              <span>Accéder à mon espace pro</span>
              <ChevronRight size={16} />
            </Link>
          </div>

          <div style={{
            marginTop: 28, display: 'flex', justifyContent: 'center', alignItems: 'center',
            gap: 20, flexWrap: 'wrap', fontSize: 12.5, color: '#94a3b8', fontWeight: 700
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={15} style={{ color: '#10b981' }} />
              <span>0 F d&apos;avance (Sans carte bancaire)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={15} style={{ color: '#10b981' }} />
              <span>Quittances certifiées avec QR Code</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={15} style={{ color: '#10b981' }} />
              <span>Paiements directs Wave &amp; Orange Money</span>
            </div>
          </div>

        </div>
      </section>

      {/* ── 2. LES 4 PILIERS DE LA GESTION IMMOBILIÈRE NOPALOU ── */}
      <section style={{ maxWidth: 1100, margin: '-40px auto 40px', padding: '0 16px', position: 'relative', zIndex: 3 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: 16 }}>
          
          {/* Pilier 1 : Baux & Quittances PDF */}
          <div style={{
            background: '#ffffff', borderRadius: 16, padding: '24px 20px',
            border: '1px solid var(--border, #E8DDD2)', boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 14
          }}>
            <div>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(28,43,74,0.08)', color: 'var(--navy, #1C2B4A)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <FileText size={22} />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 900, color: 'var(--navy, #1C2B4A)', margin: '0 0 8px' }}>
                Baux &amp; Quittances PDF Certifiées
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-subtle, #5A4E42)', lineHeight: 1.5, margin: 0 }}>
                Générez des contrats de location sécurisés et émettez des quittances PDF certifiées avec QR Code conformes aux normes OHADA en 1 clic.
              </p>
            </div>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent, #C75B00)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>Modèles légaux sénégalais</span>
            </div>
          </div>

          {/* Pilier 2 : Paiement Loyer Wave 1-Clic */}
          <div style={{
            background: '#ffffff', borderRadius: 16, padding: '24px 20px',
            border: '1px solid var(--border, #E8DDD2)', boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 14
          }}>
            <div>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(16,185,129,0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <CreditCard size={22} />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 900, color: 'var(--navy, #1C2B4A)', margin: '0 0 8px' }}>
                Collecte des Loyers Wave &amp; OM
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-subtle, #5A4E42)', lineHeight: 1.5, margin: 0 }}>
                Vos locataires reçoivent l&apos;échéance par SMS ou WhatsApp et règlent directement par Wave. Mise à disposition immédiate de la quittance.
              </p>
            </div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>Zéro déplacement, zéro chèque impayé</span>
            </div>
          </div>

          {/* Pilier 3 : CRM Leads & Matching WhatsApp */}
          <div style={{
            background: '#ffffff', borderRadius: 16, padding: '24px 20px',
            border: '1px solid var(--border, #E8DDD2)', boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 14
          }}>
            <div>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(37,211,102,0.12)', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <MessageCircle size={22} />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 900, color: 'var(--navy, #1C2B4A)', margin: '0 0 8px' }}>
                Matching Leads par WhatsApp
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-subtle, #5A4E42)', lineHeight: 1.5, margin: 0 }}>
                Dès qu&apos;un bien est publié, notre moteur trouve automatiquement les acquéreurs et locataires en attente et vous alerte sur WhatsApp.
              </p>
            </div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>Score de compatibilité &gt; 65%</span>
            </div>
          </div>

          {/* Pilier 4 : Vitrine Agence & Vidéos */}
          <div style={{
            background: '#ffffff', borderRadius: 16, padding: '24px 20px',
            border: '1px solid var(--border, #E8DDD2)', boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 14
          }}>
            <div>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(199,91,0,0.1)', color: 'var(--accent, #C75B00)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <Sparkles size={22} />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 900, color: 'var(--navy, #1C2B4A)', margin: '0 0 8px' }}>
                Vitrine Pro &amp; Visites Vidéo
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-subtle, #5A4E42)', lineHeight: 1.5, margin: 0 }}>
                Page dédiée personnalisée pour votre agence avec intégration des vidéos YouTube, TikTok, visites virtuelles Matterport et photos HD.
              </p>
            </div>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--navy, #1C2B4A)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>Référencement prioritaire Dakar</span>
            </div>
          </div>

        </div>
      </section>

      {/* ── 3. WORKFLOW : COMMENT ÇA MARCHE ── */}
      <section style={{ maxWidth: 960, margin: '0 auto 60px', padding: '0 16px' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent, #C75B00)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Workflow 100% Digitalisé
          </span>
          <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 34px)', fontWeight: 900, color: 'var(--navy, #1C2B4A)', margin: '8px 0 0' }}>
            De la signature du bail au paiement du loyer
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 16 }}>
          {[
            { step: '1', titre: 'Création du Bail', desc: 'Saisissez les informations du locataire, le montant du loyer et la date d\'échéance mensuelle.' },
            { step: '2', titre: 'Alerte WhatsApp', desc: 'Le locataire reçoit le récapitulatif de son bail et un lien direct pour payer en 1 clic par Wave.' },
            { step: '3', titre: 'Paiement Sécurisé', desc: 'Le locataire valide son paiement sans frais. Les fonds arrivent directement sur le compte de l\'agence ou du bailleur.' },
            { step: '4', titre: 'Quittance Immédiate', desc: 'La quittance PDF officielle avec QR code certifié est téléchargeable instantanément par le locataire.' },
          ].map(w => (
            <div key={w.step} style={{ background: '#ffffff', borderRadius: 14, padding: '20px 18px', border: '1px solid var(--border, #E8DDD2)', position: 'relative' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--navy, #1C2B4A)', color: '#fff', fontSize: 13, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                {w.step}
              </div>
              <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: '0 0 6px' }}>{w.titre}</h4>
              <p style={{ fontSize: 12.5, color: 'var(--text-subtle, #5A4E42)', lineHeight: 1.45, margin: 0 }}>{w.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4. BANNIÈRE LOCATAIRE (PASSERELLE ESPACE CLIENT) ── */}
      <section style={{ maxWidth: 960, margin: '0 auto 60px', padding: '0 16px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #F8F5F0 0%, #FFFDF9 100%)',
          borderRadius: 20, border: '1.5px solid var(--border, #E8DDD2)',
          padding: '28px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 20, flexWrap: 'wrap'
        }}>
          <div style={{ maxWidth: 540 }}>
            <span style={{ fontSize: 11, fontWeight: 900, background: 'rgba(10, 92, 54, 0.12)', color: 'var(--price, #0A5C36)', padding: '3px 10px', borderRadius: 12, textTransform: 'uppercase' }}>
              Espace Locataire Dédié
            </span>
            <h3 style={{ fontSize: 20, fontWeight: 900, color: 'var(--navy, #1C2B4A)', margin: '8px 0 6px' }}>
              Vous êtes locataire d&apos;un bien géré sur Nopalou ?
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-subtle, #5A4E42)', margin: 0, lineHeight: 1.5 }}>
              Connectez-vous à votre compte pour consulter l&apos;historique de vos baux, régler vos échéances par Wave ou Orange Money et télécharger vos quittances certifiées.
            </p>
          </div>
          <Link
            href="/compte?tab=locations"
            style={{
              background: 'var(--navy, #1C2B4A)', color: '#ffffff', padding: '12px 22px', borderRadius: 12,
              fontSize: 13.5, fontWeight: 800, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0
            }}
          >
            <span>Voir mes quittances</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* ── 5. BANNIÈRE FINALE DE CONVERSION PRO ── */}
      <section style={{
        background: 'linear-gradient(135deg, var(--navy, #1C2B4A) 0%, #0d1728 100%)',
        color: '#ffffff', padding: '48px 20px', textAlign: 'center'
      }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 32px)', fontWeight: 900, margin: '0 0 12px' }}>
            Rejoignez les agences immobilières modernes du Sénégal
          </h2>
          <p style={{ fontSize: 14, color: '#94a3b8', margin: '0 auto 24px', maxWidth: 540, lineHeight: 1.5 }}>
            Créez votre agence en 2 minutes, publiez vos mandats et sécurisez vos encaissements de loyer dès aujourd&apos;hui.
          </p>
          <Link
            href="/inscription?role=agence&redirect=/agence"
            style={{
              background: 'linear-gradient(135deg, #FF6600 0%, #C75B00 100%)',
              color: '#ffffff', padding: '14px 34px', borderRadius: 30,
              fontSize: 16, fontWeight: 900, textDecoration: 'none',
              boxShadow: '0 8px 24px rgba(199,91,0,0.4)', display: 'inline-flex', alignItems: 'center', gap: 8
            }}
          >
            <span>Démarrer avec 30 jours offerts</span>
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>

    </div>
  )
}
