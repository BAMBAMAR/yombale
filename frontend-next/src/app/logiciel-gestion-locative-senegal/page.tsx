import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Building2,
  FileCheck2,
  CreditCard,
  MessageCircle,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Users,
  Clock,
  Download
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Logiciel Gestion Locative Sénégal & Dakar | Baux, Quittances & Loyers Wave',
  description: 'Le logiciel N°1 de gestion locative au Sénégal pour agences et bailleurs : baux conformes OHADA, quittances certifiées PDF et encaissement des loyers par Wave & Orange Money sans commission.',
  keywords: [
    'logiciel gestion locative dakar',
    'logiciel agence immobiliere senegal',
    'gestion locative senegal',
    'quittance de loyer dakar',
    'bail de location sénégal ohada',
    'paiement loyer wave dakar',
    'nopalou immo'
  ],
  openGraph: {
    title: 'Logiciel de Gestion Locative au Sénégal — Nopalou Immo',
    description: 'Automatisez vos baux, quittances PDF certifiées et la collecte des loyers Wave à Dakar. Démarrez gratuitement.',
    url: 'https://nopalou.com/logiciel-gestion-locative-senegal',
    type: 'website',
  },
}

export default function LogicielGestionLocativePage() {
  return (
    <main
      style={{
        background: '#f8fafc',
        color: '#0f172a',
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      {/* ── 1. HERO BANNER ── */}
      <section
        style={{
          background: 'linear-gradient(135deg, #1C2B4A 0%, #0d1728 100%)',
          color: '#ffffff',
          padding: '60px 16px 90px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(199,91,0,0.2)',
              color: '#fed7aa',
              padding: '6px 16px',
              borderRadius: 30,
              fontSize: 12,
              fontWeight: 800,
              marginBottom: 16,
              border: '1px solid rgba(199,91,0,0.4)'
            }}
          >
            <Sparkles size={14} color="#fed7aa" />
            <span>GESTION LOCATIVE &amp; BAUX NUMÉRIQUES AU SÉNÉGAL</span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(26px, 4.5vw, 42px)',
              fontWeight: 900,
              margin: '0 0 16px',
              lineHeight: 1.2,
              letterSpacing: '-0.02em'
            }}
          >
            Fini les carnets de quittances papier et les retards de loyer à Dakar.
          </h1>

          <p
            style={{
              fontSize: 'clamp(14.5px, 2vw, 17px)',
              color: '#cbd5e1',
              maxWidth: 680,
              margin: '0 auto 28px',
              lineHeight: 1.6
            }}
          >
            Nopalou Immo automatise l&apos;intégralité de votre gestion immobilière : baux conformes au droit sénégalais, quittances certifiées PDFKit, rappels WhatsApp et collecte 1-clic par Wave et Orange Money.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Link
              href="/inscription?role=agence"
              style={{
                background: 'linear-gradient(135deg, #FF6600 0%, #C75B00 100%)',
                color: '#ffffff',
                padding: '14px 30px',
                borderRadius: 24,
                fontSize: 15,
                fontWeight: 800,
                textDecoration: 'none',
                boxShadow: '0 8px 25px rgba(199,91,0,0.4)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <span>Créer mon Agence Pro (Formule Starter Gratuite)</span>
              <ArrowRight size={16} />
            </Link>

            <Link
              href="/demo?role=agence"
              style={{
                background: 'rgba(255,255,255,0.1)',
                color: '#ffffff',
                padding: '14px 24px',
                borderRadius: 24,
                fontSize: 15,
                fontWeight: 700,
                textDecoration: 'none',
                border: '1px solid rgba(255,255,255,0.2)',
                backdropFilter: 'blur(6px)'
              }}
            >
              Tester la démo interactive
            </Link>
          </div>
        </div>
      </section>

      {/* ── 2. LES 4 PILIERS DE LA GESTION LOCATIVE ── */}
      <section style={{ maxWidth: 1100, margin: '-40px auto 60px', padding: '0 16px', position: 'relative', zIndex: 10 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))',
            gap: 16
          }}
        >
          <div style={{ background: '#ffffff', borderRadius: 16, padding: '24px 20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <FileCheck2 size={22} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 900, color: '#1C2B4A', margin: '0 0 6px' }}>Baux Juridiques OHADA</h3>
            <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, margin: 0 }}>
              Modèles complets respectant la législation sénégalaise sur les baux d&apos;habitation et commerciaux. Zéro litige contractuel.
            </p>
          </div>

          <div style={{ background: '#ffffff', borderRadius: 16, padding: '24px 20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#DCFCE7', color: '#0A5C36', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <Download size={22} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 900, color: '#1C2B4A', margin: '0 0 6px' }}>Quittances PDF Certifiées</h3>
            <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, margin: 0 }}>
              Génération instantanée en 1 clic avec QR Code d&apos;authenticité anti-fraude, téléchargeable par le locataire et l&apos;agence.
            </p>
          </div>

          <div style={{ background: '#ffffff', borderRadius: 16, padding: '24px 20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FFF3E8', color: '#C75B00', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <CreditCard size={22} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 900, color: '#1C2B4A', margin: '0 0 6px' }}>Paiement Wave &amp; OM 1-Clic</h3>
            <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, margin: 0 }}>
              Les locataires règlent en toute simplicité via un lien direct sécurisé. Votre compte agence ou propriétaire est crédité sans délai.
            </p>
          </div>

          <div style={{ background: '#ffffff', borderRadius: 16, padding: '24px 20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <MessageCircle size={22} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 900, color: '#1C2B4A', margin: '0 0 6px' }}>Relances Auto WhatsApp</h3>
            <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, margin: 0 }}>
              Rappels automatiques bienveillants envoyés avant l&apos;échéance du 05 du mois. Réduction de 80% des retards d&apos;encaissement.
            </p>
          </div>
        </div>
      </section>

      {/* ── 3. WORKFLOW EN 3 ÉTAPES ── */}
      <section style={{ maxWidth: 960, margin: '0 auto 80px', padding: '0 16px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 32px)', fontWeight: 900, color: '#1C2B4A', margin: '0 0 10px' }}>
            Comment fonctionne Nopalou Immo au quotidien
          </h2>
          <p style={{ fontSize: 15, color: '#64748b', margin: 0 }}>
            Simple, rapide et conçu sur mesure pour les réalités du marché immobilier dakarois :
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#ffffff', borderRadius: 16, padding: '20px 24px', border: '1px solid #e2e8f0', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#1C2B4A', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, flexShrink: 0 }}>
              1
            </div>
            <div>
              <h4 style={{ fontSize: 16, fontWeight: 800, color: '#1C2B4A', margin: '0 0 4px' }}>Vous enregistrez le bien et le bail</h4>
              <p style={{ fontSize: 13.5, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                Renseignez le loyer, les charges, la caution et le locataire. Le bail est généré et le locataire reçoit immédiatement son accès espace personnel par WhatsApp.
              </p>
            </div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: 16, padding: '20px 24px', border: '1px solid #e2e8f0', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#C75B00', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, flexShrink: 0 }}>
              2
            </div>
            <div>
              <h4 style={{ fontSize: 16, fontWeight: 800, color: '#1C2B4A', margin: '0 0 4px' }}>Avis d&apos;échéance &amp; Paiement en 1 clic</h4>
              <p style={{ fontSize: 13.5, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                Chaque début de mois, le locataire reçoit sa notification avec un lien direct vers le portail sécurisé Wave ou Orange Money.
              </p>
            </div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: 16, padding: '20px 24px', border: '1px solid #e2e8f0', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#0A5C36', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, flexShrink: 0 }}>
              3
            </div>
            <div>
              <h4 style={{ fontSize: 16, fontWeight: 800, color: '#1C2B4A', margin: '0 0 4px' }}>Quittance délivrée &amp; Tableau de bord à jour</h4>
              <p style={{ fontSize: 13.5, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                Dès validation, la quittance officielle avec QR code est générée. Votre tableau de bord affiche vos encaissements et votre taux de recouvrement en temps réel.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. BANNIÈRE DÉMARRAGE ── */}
      <section style={{ maxWidth: 960, margin: '0 auto 80px', padding: '0 16px' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #1C2B4A 0%, #111a2e 100%)',
            borderRadius: 24,
            padding: '40px 24px',
            textAlign: 'center',
            color: '#ffffff',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 20px 50px rgba(28,43,74,0.3)'
          }}
        >
          <h3 style={{ fontSize: 'clamp(22px, 3.5vw, 30px)', fontWeight: 900, margin: '0 0 12px' }}>
            Prêt à professionnaliser votre agence immobilière ?
          </h3>
          <p style={{ fontSize: 15, color: '#94a3b8', maxWidth: 540, margin: '0 auto 24px', lineHeight: 1.5 }}>
            La formule Starter est 100% offerte jusqu&apos;à 3 baux actifs. Aucune carte bancaire requise.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Link
              href="/inscription?role=agence"
              style={{
                background: 'var(--accent, #C75B00)',
                color: '#ffffff',
                padding: '12px 28px',
                borderRadius: 20,
                fontSize: 14.5,
                fontWeight: 800,
                textDecoration: 'none'
              }}
            >
              Créer mon espace agence gratuit
            </Link>
            <Link
              href="/tarifs-boutique"
              style={{
                background: 'transparent',
                color: '#cbd5e1',
                padding: '12px 20px',
                borderRadius: 20,
                fontSize: 14,
                fontWeight: 700,
                textDecoration: 'none',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            >
              Consulter la grille tarifaire complète
            </Link>
          </div>
        </div>
      </section>

    </main>
  )
}
