import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Layers, BookOpen, AlertTriangle, CheckCircle2, ArrowRight,
  Sparkles, HelpCircle, Users, Bell, DollarSign, Clock, ShieldCheck
} from 'lucide-react'

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'

export const metadata: Metadata = {
  title: 'Carnet de Dettes & Gestion de Stock au Sénégal (2026) | Nopalou',
  description: 'Digitalisez votre carnet de crédit et de dettes commerçant ("Bor") à Dakar. Suivi des stocks en temps réel, alertes d\'impayés et relances WhatsApp en 1 clic avec lien Wave.',
  keywords: [
    'carnet de dettes commerçant sénégal',
    'gestion de stock sénégal',
    'logiciel gestion stock dakar',
    'suivi dettes clients dakar',
    'carnet de crédit bor sénégal',
    'relance dette whatsapp dakar',
    'gestion commerciale petit commerce sénégal',
    'cahier de dettes boutique dakar'
  ],
  alternates: {
    canonical: `${BASE}/gestion-stock-carnet-dettes`,
  },
  openGraph: {
    title: 'Carnet de Dettes & Gestion de Stock au Sénégal | Nopalou',
    description: 'Ne perdez plus jamais un franc dans vos dettes clients. Relances WhatsApp et gestion de stock.',
    url: `${BASE}/gestion-stock-carnet-dettes`,
    type: 'website',
  },
}

const STOCK_FAQ = [
  {
    q: "Qu'est-ce que le carnet de dettes digital Nopalou ?",
    a: "C'est l'équivalent moderne de votre cahier papier ('Cahier Bor'). Vous y enregistrez en 2 clics chaque client à qui vous faites crédit, avec le détail des articles achetés et la date d'échéance. Fini les pages déchirées ou les montants oubliés."
  },
  {
    q: "Comment se passe la relance des clients débiteurs ?",
    a: "En un clic sur le bouton 'Relancer' à côté d'une dette, un message WhatsApp poli et soigné est préparé avec le nom du client, le montant exact restant à payer et votre lien de paiement Wave sécurisé. Le client n'a plus qu'à cliquer pour vous rembourser immédiatement."
  },
  {
    q: "La gestion de stock déduit-elle automatiquement les articles vendus ?",
    a: "Oui, à chaque vente effectuée en caisse ou sur votre boutique en ligne WhatsApp, les quantités sont déduites automatiquement en temps réel. Dès qu'un article passe sous le seuil d'alerte, vous recevez une notification pour vous réapprovisionner."
  },
  {
    q: "Puis-je gérer les paiements partiels (acomptes) ?",
    a: "Absolument. Si un client vous doit 20 000 FCFA et verse 5 000 FCFA d'acompte par Wave ou en espèces, vous saisissez l'acompte et le carnet calcule immédiatement le reste dû (15 000 FCFA) avec l'historique daté."
  }
]

const JSON_LD_FAQ = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: STOCK_FAQ.map(item => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.a,
    },
  })),
}

export default function GestionStockCarnetDettesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD_FAQ) }}
      />

      <main style={{ background: '#f8fafc', color: '#0f172a', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        
        {/* ── HERO GESTION & BOR ── */}
        <section style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          color: '#ffffff',
          padding: '70px 20px 100px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ maxWidth: 960, margin: '0 auto', position: 'relative', zIndex: 2 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(245,158,11,0.18)', color: '#fde68a',
              padding: '6px 18px', borderRadius: 30, fontSize: 13, fontWeight: 800,
              marginBottom: 24, border: '1px solid rgba(245,158,11,0.35)',
              letterSpacing: '0.04em'
            }}>
              <BookOpen size={14} color="#fde68a" />
              <span>FINI LES CAHIERS PERDUS • GESTION DIGITALE DU « BOR »</span>
            </div>

            <h1 style={{
              fontSize: 'clamp(32px, 5vw, 56px)',
              fontWeight: 900,
              margin: '0 0 20px',
              lineHeight: 1.15,
              letterSpacing: '-0.03em'
            }}>
              Carnet de dettes & gestion de stock pour <span style={{ color: '#fed7aa' }}>commerçants au Sénégal</span>
            </h1>

            <p style={{
              fontSize: 'clamp(16px, 2.2vw, 20px)',
              color: '#94a3b8',
              maxWidth: 780,
              margin: '0 auto 36px',
              lineHeight: 1.6
            }}>
              Suivez vos créances au centime près, relancez vos clients sur WhatsApp avec lien Wave et gardez un œil constant sur vos stocks pour ne jamais tomber en rupture.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 36 }}>
              <Link
                href="/creer-boutique"
                style={{
                  background: '#C75B00',
                  color: '#ffffff',
                  padding: '16px 36px',
                  borderRadius: 12,
                  fontWeight: 800,
                  fontSize: 17,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  textDecoration: 'none',
                  boxShadow: '0 8px 24px rgba(199,91,0,0.4)'
                }}
              >
                <span>Tester le carnet de dettes (30 jours offerts)</span>
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
                <span>Découvrir la suite complète</span>
              </Link>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap', fontSize: 13, color: '#cbd5e1' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={16} color="#10b981" /> Récupérez votre argent plus vite
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={16} color="#10b981" /> Relances polies avec lien Wave
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={16} color="#10b981" /> Alertes rupture de stock
              </span>
            </div>
          </div>
        </section>

        {/* ── LES 4 FONCTIONNALITÉS ESSENTIELLES ── */}
        <section style={{ maxWidth: 1100, margin: '-40px auto 70px', padding: '0 20px', position: 'relative', zIndex: 10 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 20
          }}>
            {[
              {
                icon: <BookOpen size={28} color="#C75B00" />,
                title: 'Cahier « Bor » 100% Digital',
                desc: 'Notez le nom du client, le montant et les articles en 5 secondes. Vos comptes sont sauvegardés en lieu sûr dans le Cloud.'
              },
              {
                icon: <Bell size={28} color="#10b981" />,
                title: 'Relance WhatsApp 1-Clic',
                desc: 'Envoyez un récapitulatif clair sur WhatsApp avec un lien Wave sécurisé pour un règlement immédiat sans dispute.'
              },
              {
                icon: <Layers size={28} color="#3b82f6" />,
                title: 'Stock en Temps Réel',
                desc: 'Chaque vente physique ou en ligne ajuste automatiquement vos stocks disponibles et signale les produits à racheter.'
              },
              {
                icon: <DollarSign size={28} color="#f59e0b" />,
                title: 'Acomptes & Paiements Échelonnés',
                desc: 'Consignez les versements partiels et visualisez en un clin d\'œil le montant total qui vous est dû sur le marché.'
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
              Questions Fréquentes sur le Carnet de Dettes & Stock
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {STOCK_FAQ.map((item, i) => (
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
              Passez au commerce digital avec Nopalou
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
              <Link href="/paiement-en-ligne-senegal" style={{ background: '#ffffff', padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#1C2B4A', textDecoration: 'none', border: '1px solid #cbd5e1' }}>
                💳 Paiements Wave & Orange Money
              </Link>
            </div>
          </div>
        </section>

      </main>
    </>
  )
}
