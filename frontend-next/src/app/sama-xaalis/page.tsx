import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Wallet, PiggyBank, TrendingUp, CheckCircle2, ShieldCheck,
  ArrowRight, Smartphone, Sparkles, HelpCircle, ArrowUpRight,
  ArrowDownLeft, BarChart3, Lock, Bell
} from 'lucide-react'

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'

export const metadata: Metadata = {
  title: 'Sama Xaalis (Kalpé) | Gestion de Budget, Dépenses & Épargne au Sénégal',
  description: 'Prenez le contrôle de vos finances en Francs CFA : suivi des dépenses quotidiennes, gestion des dettes et créances, objectifs d\'épargne et bilan commerçant à Dakar.',
  keywords: [
    'sama xaalis sénégal',
    'gestion budget dakar',
    'application finances personnelles sénégal',
    'suivi dépenses fcfa',
    'application épargne dakar',
    'gestion trésorerie commerçant sénégal',
    'kalpé nopalou',
    'carnet argent dakar'
  ],
  alternates: {
    canonical: `${BASE}/sama-xaalis`,
  },
  openGraph: {
    title: 'Sama Xaalis — Votre Kalpé Intelligent pour Gérer votre Argent à Dakar',
    description: 'Suivi des dépenses, gestion des dettes clients, objectifs d\'épargne et trésorerie commerçante en FCFA.',
    url: `${BASE}/sama-xaalis`,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sama Xaalis | Gestion de Budget & Épargne au Sénégal',
    description: 'Suivez vos entrées, dépenses et dettes en Francs CFA. 30 jours offerts.',
  },
}

const FAQ_ITEMS = [
  {
    q: "Qu'est-ce que Sama Xaalis (Kalpé) sur Nopalou ?",
    a: "Sama Xaalis est votre portefeuille et carnet financier numérique personnel et professionnel. Il vous permet de noter en quelques secondes chaque entrée et dépense d'argent (espèces, Wave, Orange Money), de suivre qui vous doit de l'argent et de programmer des objectifs d'épargne concrets en FCFA."
  },
  {
    q: "Est-ce réservé aux commerçants ou accessible aux particuliers ?",
    a: "Les deux ! Pour un particulier ou une famille, Sama Xaalis sert de gestionnaire de budget pour maîtriser les dépenses du mois et éviter d'arriver à découvert. Pour un commerçant, il s'intègre à la boutique Nopalou pour séparer l'argent du magasin des dépenses personnelles."
  },
  {
    q: "Comment fonctionne le suivi des dettes et créances ?",
    a: "Vous enregistrez les prêts accordés à vos proches ou clients. Le système calcule automatiquement le reste dû après chaque versement et vous permet d'envoyer un rappel amical sur WhatsApp avec votre lien Wave pour faciliter le remboursement."
  },
  {
    q: "Mes données financières sont-elles sécurisées et confidentielles ?",
    a: "Oui, à 100%. Vos chiffres et comptes sont chiffrés et strictement confidentiels. Seul vous pouvez consulter votre kalpé avec vos identifiants sécurisés."
  },
  {
    q: "Combien coûte l'utilisation de Sama Xaalis ?",
    a: "Vous bénéficiez de 30 jours d'essai 100% gratuits sans engagement. Ensuite, l'abonnement est de seulement 1 000 FCFA/mois réglable directement par Wave ou Orange Money (inclus sans surcoût pour les marchands ayant un forfait Pro actif)."
  }
]

const JSON_LD_SOFTWARE = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Sama Xaalis — Gestion Financière & Épargne Sénégal',
  operatingSystem: 'Web, Android, iOS',
  applicationCategory: 'FinanceApplication',
  offers: {
    '@type': 'Offer',
    price: '1000',
    priceCurrency: 'XOF',
    description: 'Gestion de budget, dépenses, créances et objectifs d\'épargne en FCFA.',
  },
}

const JSON_LD_FAQ = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_ITEMS.map(item => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.a,
    },
  })),
}

export default function SamaXaalisLandingPage() {
  return (
    <main style={{ background: '#f8fafc', color: '#0f172a', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD_SOFTWARE) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD_FAQ) }}
      />

      {/* ── 1. HERO BANNER ── */}
      <section style={{
        background: 'linear-gradient(135deg, #1C2B4A 0%, #0d1728 100%)',
        color: '#ffffff',
        padding: '70px 20px 100px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: '-15%', left: '-10%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-15%', right: '-10%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(199,91,0,0.2) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(16,185,129,0.16)', color: '#86efac',
            padding: '6px 18px', borderRadius: 30, fontSize: 13, fontWeight: 800,
            marginBottom: 20, border: '1px solid rgba(16,185,129,0.3)',
            letterSpacing: '0.04em'
          }}>
            <Wallet size={14} style={{ color: '#86efac' }} />
            <span>SAMA XAALIS &bull; GESTION FINANCIÈRE &amp; ÉPARGNE EN FCFA</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(32px, 5vw, 54px)',
            fontWeight: 900,
            margin: '0 0 20px',
            lineHeight: 1.15,
            letterSpacing: '-0.02em'
          }}>
            Sachez exactement où va votre argent.<br />
            Chaque jour, en <span style={{ color: '#86efac' }}>Francs CFA</span>.
          </h1>

          <p style={{
            fontSize: 'clamp(16px, 2.5vw, 19px)',
            color: '#cbd5e1',
            maxWidth: 720,
            margin: '0 auto 36px',
            lineHeight: 1.6
          }}>
            Finies les fins de mois difficiles sans savoir où est parti votre argent. Suivez vos entrées, maîtrisez vos dépenses, relancez vos créances et atteignez vos objectifs d&apos;épargne sur votre smartphone.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/compte?tab=kalpe"
              style={{
                background: '#C75B00', color: '#ffffff',
                padding: '16px 32px', borderRadius: 30, fontSize: 16, fontWeight: 800,
                textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10,
                boxShadow: '0 10px 25px rgba(199,91,0,0.4)', transition: 'all 0.2s ease'
              }}
            >
              <span>Ouvrir mon Sama Xaalis (30j offerts)</span>
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/connexion"
              style={{
                background: 'rgba(255,255,255,0.08)', color: '#ffffff',
                padding: '16px 26px', borderRadius: 30, fontSize: 15, fontWeight: 700,
                textDecoration: 'none', border: '1px solid rgba(255,255,255,0.2)',
                display: 'inline-flex', alignItems: 'center', gap: 8
              }}
            >
              <span>Se connecter</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 2. LES 4 PILIERS ── */}
      <section style={{ maxWidth: 1140, margin: '-50px auto 70px', padding: '0 20px', position: 'relative', zIndex: 3 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
          
          <div style={{ background: '#ffffff', padding: 26, borderRadius: 20, border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.04)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', marginBottom: 16 }}>
              <ArrowDownLeft size={24} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 8px', color: '#1C2B4A' }}>Suivi des Dépenses</h3>
            <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, margin: 0 }}>
              Notez chaque dépense (loyer, nourriture, transport, factures) en 3 secondes. Visualisez où part votre argent chaque semaine.
            </p>
          </div>

          <div style={{ background: '#ffffff', padding: 26, borderRadius: 20, border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.04)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', marginBottom: 16 }}>
              <ArrowUpRight size={24} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 8px', color: '#1C2B4A' }}>Entrées &amp; Recettes</h3>
            <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, margin: 0 }}>
              Enregistrez vos salaires, ventes boutique ou prestations. Ventilation claire entre espèces, Wave et Orange Money.
            </p>
          </div>

          <div style={{ background: '#ffffff', padding: 26, borderRadius: 20, border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.04)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c', marginBottom: 16 }}>
              <Bell size={24} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 8px', color: '#1C2B4A' }}>Créances &amp; Dettes</h3>
            <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, margin: 0 }}>
              Ne perdez plus la mémoire de qui vous doit de l&apos;argent. Relancez en 1 clic par message WhatsApp avec un lien Wave.
            </p>
          </div>

          <div style={{ background: '#ffffff', padding: 26, borderRadius: 20, border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.04)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: '#fdf2f8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#db2777', marginBottom: 16 }}>
              <PiggyBank size={24} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 8px', color: '#1C2B4A' }}>Objectifs d&apos;Épargne</h3>
            <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, margin: 0 }}>
              Tabaski, scolarité, terrain, fonds d&apos;urgence : fixez une cible en FCFA et suivez votre progression pourcentage par pourcentage.
            </p>
          </div>

        </div>
      </section>

      {/* ── 3. SECTION CONFIANCE & SÉCURITÉ ── */}
      <section style={{ maxWidth: 960, margin: '0 auto 80px', padding: '0 20px' }}>
        <div style={{ background: '#ffffff', borderRadius: 24, padding: '36px 30px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(10,92,54,0.1)', color: 'var(--price, #0A5C36)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ShieldCheck size={32} />
          </div>
          <div style={{ flex: 1, minWidth: 260 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1C2B4A', margin: '0 0 6px' }}>
              100% Chiffré &bull; Confidentialité Absolue
            </h2>
            <p style={{ fontSize: 14, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
              Vos finances ne regardent que vous. Vos entrées, dépenses et dettes ne sont jamais partagées ni vendues. L&apos;accès est verrouillé par votre mot de passe et votre numéro personnel.
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 28, fontWeight: 900, color: 'var(--price, #0A5C36)', display: 'block' }}>1 000 F</span>
            <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>CFA / mois après 30j offerts</span>
          </div>
        </div>
      </section>

      {/* ── 4. FAQ ── */}
      <section style={{ maxWidth: 860, margin: '0 auto 80px', padding: '0 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#C75B00', textTransform: 'uppercase', letterSpacing: '0.08em' }}>FAQ Financière</span>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: '#1C2B4A', margin: '8px 0 0' }}>Questions Fréquentes sur Sama Xaalis</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {FAQ_ITEMS.map((item, idx) => (
            <div key={idx} style={{ background: '#ffffff', borderRadius: 16, padding: '20px 24px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1C2B4A', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <HelpCircle size={16} color="#C75B00" style={{ flexShrink: 0 }} />
                <span>{item.q}</span>
              </h3>
              <p style={{ fontSize: 14, color: '#64748b', margin: 0, lineHeight: 1.6 }}>{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 5. CTA FINAL ── */}
      <section style={{ background: 'linear-gradient(135deg, #1C2B4A 0%, #0d1728 100%)', color: '#ffffff', padding: '60px 20px', textAlign: 'center' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ fontSize: 28, fontWeight: 900, margin: '0 0 12px' }}>Commencez dès aujourd&apos;hui à maîtriser votre budget</h2>
          <p style={{ fontSize: 15, color: '#cbd5e1', margin: '0 0 28px', lineHeight: 1.6 }}>
            Activez votre Kalpé en 30 secondes avec votre numéro de téléphone et profitez de 30 jours complets d&apos;essai gratuit.
          </p>
          <Link
            href="/compte?tab=kalpe"
            style={{
              background: '#C75B00', color: '#ffffff',
              padding: '16px 36px', borderRadius: 30, fontSize: 16, fontWeight: 800,
              textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10,
              boxShadow: '0 8px 24px rgba(199,91,0,0.4)'
            }}
          >
            <span>Activer mon Kalpé Gratuitement</span>
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </main>
  )
}
