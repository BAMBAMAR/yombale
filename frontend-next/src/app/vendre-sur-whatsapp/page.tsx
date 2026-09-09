import type { Metadata } from 'next'
import Link from 'next/link'
import {
  MessageSquare, ShoppingCart, Receipt, Zap, ShieldCheck,
  CheckCircle2, ArrowRight, Sparkles, HelpCircle, PhoneCall,
  Bell, Bot, Send, CheckCheck, Smartphone, Share2
} from 'lucide-react'

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'

export const metadata: Metadata = {
  title: 'Vendre sur WhatsApp au Sénégal (2026) : Boutique & Commandes Automatisées',
  description: 'Créez votre catalogue et boutique WhatsApp au Sénégal en 30s. Recevez des commandes pré-remplies, relancez vos clients et encaissez par Wave sans commission.',
  keywords: [
    'vendre sur whatsapp sénégal',
    'boutique whatsapp sénégal',
    'catalogue whatsapp dakar',
    'commandes whatsapp sénégal',
    'vendre avec whatsapp dakar',
    'assistant whatsapp commerçant',
    'relance dette whatsapp dakar',
    'boutique en ligne whatsapp wave',
    'commerce conversationnel sénégal'
  ],
  alternates: {
    canonical: `${BASE}/vendre-sur-whatsapp`,
  },
  openGraph: {
    title: 'Vendre sur WhatsApp au Sénégal avec Nopalou',
    description: 'Transformez vos statuts WhatsApp en commandes réelles. 30 jours offerts et zéro commission.',
    url: `${BASE}/vendre-sur-whatsapp`,
    type: 'website',
  },
}

const WA_FAQ = [
  {
    q: "Comment fonctionne une commande WhatsApp via Nopalou ?",
    a: "Votre client clique sur votre lien de boutique personnalisé (partagé dans votre statut WhatsApp, bio Instagram ou TikTok). Il sélectionne ses articles dans votre catalogue et clique sur 'Commander'. Son application WhatsApp s'ouvre automatiquement avec un message pré-rempli contenant la liste des produits, les quantités, le montant total en FCFA et son adresse de livraison."
  },
  {
    q: "Est-ce que je dois ressaisir les informations manuellement ?",
    a: "Non, tout est automatisé ! Dès que le client vous envoie son message WhatsApp, votre stock Nopalou est mis à jour et vous pouvez générer son reçu ou ticket de caisse en un clic."
  },
  {
    q: "Puis-je relancer mes clients qui ont des dettes par WhatsApp ?",
    a: "Oui ! Depuis votre tableau de bord Nopalou, vous disposez d'un bouton 'Relancer par WhatsApp' à côté de chaque dette client. Un message respectueux et personnalisé est généré avec le montant dû et votre lien de paiement Wave sécurisé pour qu'il règle instantanément."
  },
  {
    q: "Puis-je recevoir mon bilan du soir directement par message WhatsApp ?",
    a: "Absolument. En envoyant simplement le mot 'Bilan' au numéro officiel Nopalou, vous recevez en 3 secondes votre chiffre d'affaires du jour, le total des ventes et la ventilation précise Espèces, Wave et Orange Money."
  }
]

const JSON_LD_FAQ = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: WA_FAQ.map(item => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.a,
    },
  })),
}

export default function VendreSurWhatsappPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD_FAQ) }}
      />

      <main style={{ background: '#f8fafc', color: '#0f172a', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        
        {/* ── HERO WHATSAPP COMMERCE ── */}
        <section style={{
          background: 'linear-gradient(135deg, #062b19 0%, #03170d 100%)',
          color: '#ffffff',
          padding: '70px 20px 100px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ maxWidth: 960, margin: '0 auto', position: 'relative', zIndex: 2 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(37,211,102,0.18)', color: '#86efac',
              padding: '6px 18px', borderRadius: 30, fontSize: 13, fontWeight: 800,
              marginBottom: 24, border: '1px solid rgba(37,211,102,0.35)',
              letterSpacing: '0.04em'
            }}>
              <MessageSquare size={14} color="#25D366" />
              <span>COMMERCE CONVERSATIONNEL N°1 AU SÉNÉGAL</span>
            </div>

            <h1 style={{
              fontSize: 'clamp(32px, 5vw, 56px)',
              fontWeight: 900,
              margin: '0 0 20px',
              lineHeight: 1.15,
              letterSpacing: '-0.03em'
            }}>
              Transformez WhatsApp en votre <span style={{ color: '#25D366' }}>meilleur commercial</span>
            </h1>

            <p style={{
              fontSize: 'clamp(16px, 2.2vw, 20px)',
              color: '#94a3b8',
              maxWidth: 780,
              margin: '0 auto 36px',
              lineHeight: 1.6
            }}>
              Partagez votre catalogue en ligne, recevez des commandes structurées sans ressaisie,
              relancez vos dettes en 1 clic avec lien Wave et suivez vos bilans financiers.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 36 }}>
              <Link
                href="/creer-boutique"
                style={{
                  background: '#25D366',
                  color: '#062b19',
                  padding: '16px 36px',
                  borderRadius: 12,
                  fontWeight: 900,
                  fontSize: 17,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  textDecoration: 'none',
                  boxShadow: '0 8px 24px rgba(37,211,102,0.4)'
                }}
              >
                <span>Créer ma boutique WhatsApp</span>
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/assistant-whatsapp"
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
                <span>Découvrir l'assistant WhatsApp</span>
              </Link>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap', fontSize: 13, color: '#cbd5e1' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={16} color="#25D366" /> Fini les allers-retours interminables par message
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={16} color="#25D366" /> Commandes avec adresse et montant précis
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={16} color="#25D366" /> 30 jours offerts sans engagement
              </span>
            </div>
          </div>
        </section>

        {/* ── LES 4 PILIERS DU WHATSAPP COMMERCE NOPALOU ── */}
        <section style={{ maxWidth: 1100, margin: '-40px auto 70px', padding: '0 20px', position: 'relative', zIndex: 10 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 20
          }}>
            {[
              {
                icon: <Share2 size={28} color="#25D366" />,
                title: 'Lien en Statut & Bio',
                desc: 'Un lien propre que vos abonnés consultent depuis leurs téléphones pour voir vos nouveautés sans surcharger la mémoire de leur galerie.'
              },
              {
                icon: <ShoppingCart size={28} color="#C75B00" />,
                title: 'Panier Multi-Articles',
                desc: 'Vos clients ajoutent plusieurs articles et voient le total calculé automatiquement avant de valider la commande.'
              },
              {
                icon: <Receipt size={28} color="#3b82f6" />,
                title: 'Relance Dettes Wave',
                desc: 'Un bouton pour générer un message de relance professionnel avec votre QR Code ou lien de paiement Wave.'
              },
              {
                icon: <Bot size={28} color="#10b981" />,
                title: 'Bilan du Soir en 3s',
                desc: 'Envoyez \'Bilan\' sur WhatsApp pour connaître votre chiffre d\'affaires journalier sans faire de calcul sur calepin.'
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
              Questions Fréquentes sur le Commerce WhatsApp
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {WA_FAQ.map((item, i) => (
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
              Autres outils pour accélérer vos ventes
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
