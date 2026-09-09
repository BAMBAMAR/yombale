import type { Metadata } from 'next'
import Link from 'next/link'
import {
  CreditCard, Smartphone, ShieldCheck, Zap, ArrowRight,
  CheckCircle2, Sparkles, HelpCircle, QrCode, Lock, DollarSign
} from 'lucide-react'

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'

export const metadata: Metadata = {
  title: 'Paiement en Ligne au Sénégal (2026) : Wave & Orange Money pour Boutique',
  description: 'Acceptez Wave et Orange Money sur votre boutique en ligne au Sénégal sans carte bancaire et sans commission intermédiaire. Paiement instantané et sécurisé.',
  keywords: [
    'paiement en ligne sénégal',
    'wave boutique en ligne',
    'orange money ecommerce sénégal',
    'accepter wave sur mon site',
    'paiement mobile sénégal',
    'passerelle paiement dakar',
    'wave paiement marchand',
    'encaisser wave sans commission',
    'alternative stripe sénégal'
  ],
  alternates: {
    canonical: `${BASE}/paiement-en-ligne-senegal`,
  },
  openGraph: {
    title: 'Paiement en Ligne au Sénégal : Wave & Orange Money pour Commerçants',
    description: 'La solution simple pour encaisser par Wave et Orange Money sans commission bancaire. 30 jours offerts.',
    url: `${BASE}/paiement-en-ligne-senegal`,
    type: 'website',
  },
}

const PAYMENT_FAQ = [
  {
    q: "Comment fonctionne l'encaissement Wave sur une boutique Nopalou ?",
    a: "Votre client choisit le règlement par Wave lors de sa commande : un QR Code Wave officiel ou un lien direct s'affiche sur son écran. Il valide en 1 seconde sur son application Wave. L'argent arrive directement sur votre compte sans passer par un intermédiaire bancaire."
  },
  {
    q: "Nopalou prend-il une commission sur les paiements Wave et Orange Money ?",
    a: "Non, 0% de commission ! Contrairement aux passerelles internationales qui prélèvent entre 3% et 5% de vos revenus, Nopalou vous laisse encaisser 100% de votre chiffre d'affaires directement sur votre compte marchand."
  },
  {
    q: "Mes clients qui préfèrent payer en espèces à la livraison peuvent-ils commander ?",
    a: "Absolument. Vous pouvez activer le paiement à la livraison ('Cash on Delivery') en un clic. Votre livreur encaisse l'argent en liquide et vous mettez à jour la commande dans votre gestion de caisse."
  },
  {
    q: "Ai-je besoin d'un compte bancaire d'entreprise (NINEA, RCCM) pour commencer ?",
    a: "Non, vous pouvez démarrer immédiatement avec votre compte Wave ou Orange Money personnel habituel. Si vous disposez d'un compte marchand entreprise, vous pouvez également le renseigner."
  }
]

const JSON_LD_FAQ = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: PAYMENT_FAQ.map(item => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.a,
    },
  })),
}

export default function PaiementEnLigneSenegalPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD_FAQ) }}
      />

      <main style={{ background: '#f8fafc', color: '#0f172a', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        
        {/* ── HERO PAIEMENT MOBILE ── */}
        <section style={{
          background: 'linear-gradient(135deg, #0b2920 0%, #03140f 100%)',
          color: '#ffffff',
          padding: '70px 20px 100px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ maxWidth: 960, margin: '0 auto', position: 'relative', zIndex: 2 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(16,185,129,0.18)', color: '#6ee7b7',
              padding: '6px 18px', borderRadius: 30, fontSize: 13, fontWeight: 800,
              marginBottom: 24, border: '1px solid rgba(16,185,129,0.35)',
              letterSpacing: '0.04em'
            }}>
              <CreditCard size={14} />
              <span>FINTECH LOCALE • 0% COMMISSION SUR VOS VENTES</span>
            </div>

            <h1 style={{
              fontSize: 'clamp(32px, 5vw, 56px)',
              fontWeight: 900,
              margin: '0 0 20px',
              lineHeight: 1.15,
              letterSpacing: '-0.03em'
            }}>
              Encaissez par <span style={{ color: '#10b981' }}>Wave & Orange Money</span> sur votre boutique
            </h1>

            <p style={{
              fontSize: 'clamp(16px, 2.2vw, 20px)',
              color: '#94a3b8',
              maxWidth: 780,
              margin: '0 auto 36px',
              lineHeight: 1.6
            }}>
              Oubliez les refus de carte bancaire et les démarches bancaires complexes.
              Permettez à tous vos clients au Sénégal de vous payer avec le portefeuille mobile qu'ils utilisent tous les jours.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 36 }}>
              <Link
                href="/creer-boutique"
                style={{
                  background: '#10b981',
                  color: '#062b19',
                  padding: '16px 36px',
                  borderRadius: 12,
                  fontWeight: 900,
                  fontSize: 17,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  textDecoration: 'none',
                  boxShadow: '0 8px 24px rgba(16,185,129,0.35)'
                }}
              >
                <span>Activer mes paiements Wave</span>
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/creer-boutique-en-ligne"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  color: '#ffffff',
                  padding: '16px 28px',
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: 16,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  textDecoration: 'none',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}
              >
                <span>Comment ça marche ?</span>
              </Link>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap', fontSize: 13, color: '#cbd5e1' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={16} color="#10b981" /> 0% de frais de transaction Nopalou
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={16} color="#10b981" /> Argent disponible sur votre compte
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={16} color="#10b981" /> Espèces à la livraison gérées
              </span>
            </div>
          </div>
        </section>

        {/* ── LES AVANTAGES DU PAIEMENT NOPALOU ── */}
        <section style={{ maxWidth: 1100, margin: '-40px auto 70px', padding: '0 20px', position: 'relative', zIndex: 10 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 20
          }}>
            {[
              {
                icon: <QrCode size={28} color="#10b981" />,
                title: 'QR Code Wave Instantané',
                desc: 'Vos clients scannent et paient en un clin d\'œil depuis leur smartphone, avec validation instantanée.'
              },
              {
                icon: <Lock size={28} color="#C75B00" />,
                title: 'Sécurité Maximale',
                desc: 'Pas de numéro de carte qui circule sur le web. Le client confirme la transaction avec son propre code secret sur son application.'
              },
              {
                icon: <Smartphone size={28} color="#3b82f6" />,
                title: 'Orange Money Direct',
                desc: 'Prise en charge des paiements via Orange Money pour les clients qui préfèrent l\'opérateur historique.'
              },
              {
                icon: <DollarSign size={28} color="#8b5cf6" />,
                title: 'Zéro Blocage de Fonds',
                desc: 'Vos fonds ne sont jamais bloqués pendant 7 ou 14 jours comme sur Stripe ou PayPal. Vous gardez le contrôle total.'
              }
            ].map((box, i) => (
              <div key={i} style={{
                background: '#ffffff',
                borderRadius: 16,
                padding: '28px 24px',
                boxShadow: '0 10px 25px rgba(15,23,42,0.06)',
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                gap: 12
              }}>
                <div style={{ background: '#f8fafc', width: 52, height: 52, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0' }}>
                  {box.icon}
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#1C2B4A' }}>{box.title}</h3>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.55, margin: 0 }}>{box.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FAQ ACCORDÉON SEO ── */}
        <section style={{ maxWidth: 840, margin: '0 auto 90px', padding: '0 20px' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: '#1C2B4A', margin: '0 0 12px' }}>
              Questions Fréquentes sur le Paiement en Ligne
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {PAYMENT_FAQ.map((item, i) => (
              <div key={i} style={{
                background: '#ffffff',
                borderRadius: 14,
                padding: '22px 24px',
                border: '1px solid #e2e8f0'
              }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1C2B4A', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <HelpCircle size={18} color="#C75B00" />
                  <span>{item.q}</span>
                </h3>
                <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, margin: 0 }}>
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── MAILLAGE SILO SOLUTIONS ── */}
        <section style={{ background: '#f1f5f9', borderTop: '1px solid #e2e8f0', padding: '50px 20px' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1C2B4A', marginBottom: 20 }}>
              Découvrez toute la suite Nopalou
            </h3>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
              <Link href="/creer-boutique-en-ligne" style={{ background: '#ffffff', padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#1C2B4A', textDecoration: 'none', border: '1px solid #cbd5e1' }}>
                🛒 Créer une boutique en ligne
              </Link>
              <Link href="/alternative-shopify-senegal" style={{ background: '#ffffff', padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#1C2B4A', textDecoration: 'none', border: '1px solid #cbd5e1' }}>
                🆚 Nopalou vs Shopify
              </Link>
              <Link href="/logiciel-caisse-senegal" style={{ background: '#ffffff', padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#1C2B4A', textDecoration: 'none', border: '1px solid #cbd5e1' }}>
                📟 Caisse POS sans Internet
              </Link>
              <Link href="/gestion-stock-carnet-dettes" style={{ background: '#ffffff', padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#1C2B4A', textDecoration: 'none', border: '1px solid #cbd5e1' }}>
                📒 Carnet de Dettes & Stock
              </Link>
            </div>
          </div>
        </section>

      </main>
    </>
  )
}
