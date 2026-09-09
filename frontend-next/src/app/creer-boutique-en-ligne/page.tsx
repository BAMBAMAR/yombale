import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Store, Smartphone, ShieldCheck, Zap, TrendingUp, CheckCircle2,
  ArrowRight, Users, MessageSquare, CreditCard, Sparkles, HelpCircle,
  Clock, Award, ShoppingBag, Globe, RefreshCw
} from 'lucide-react'

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'

export const metadata: Metadata = {
  title: 'Créer une Boutique en Ligne au Sénégal (2026) | Vendre sur Internet Facilement',
  description: 'Lancez votre site e-commerce et votre boutique en ligne au Sénégal en moins de 30 secondes. Paiement Wave & Orange Money sans commission, commandes WhatsApp et 30 jours offerts.',
  keywords: [
    'créer boutique en ligne sénégal',
    'créer site e-commerce dakar',
    'vendre en ligne sénégal',
    'vendre sur internet sénégal',
    'solution ecommerce dakar',
    'boutique en ligne gratuite sénégal',
    'plateforme e commerce sénégal',
    'boutique whatsapp sénégal',
    'comment vendre sur internet dakar',
    'nopalou marchands'
  ],
  alternates: {
    canonical: `${BASE}/creer-boutique-en-ligne`,
  },
  openGraph: {
    title: 'Créer une Boutique en Ligne au Sénégal | Nopalou',
    description: 'La solution la plus simple pour vendre en ligne à Dakar et partout au Sénégal. Sans carte bancaire, avec Wave et WhatsApp.',
    url: `${BASE}/creer-boutique-en-ligne`,
    type: 'website',
  },
}

const FAQ_ITEMS = [
  {
    q: "Combien de temps faut-il pour créer sa boutique en ligne sur Nopalou ?",
    a: "Moins de 30 secondes ! Vous choisissez le nom de votre boutique, votre ville (Dakar, Thiès, Touba...) et votre numéro de téléphone. Votre vitrine web personnalisée est immédiatement active et partageable sur vos statuts WhatsApp, Instagram et TikTok."
  },
  {
    q: "Ai-je besoin d'une carte bancaire internationale pour commencer ?",
    a: "Non, aucune carte bancaire n'est exigée. Vous profitez d'une période d'essai de 30 jours 100% offerte. Ensuite, votre abonnement est réglé en toute simplicité en Francs CFA par Wave ou Orange Money (dès 2 500 FCFA/mois)."
  },
  {
    q: "Comment mes clients paient-ils leurs commandes ?",
    a: "Vos clients règlent directement via Wave, Orange Money ou en espèces à la livraison. Nopalou ne prélève aucune commission sur vos ventes : 100% de vos recettes arrivent directement sur votre propre numéro marchand."
  },
  {
    q: "Comment se passe la réception des commandes ?",
    a: "Dès qu'un client valide son panier sur votre boutique, vous recevez un message WhatsApp propre et formaté contenant les articles sélectionnés, les quantités, le total en FCFA et l'adresse de livraison du client."
  },
  {
    q: "Puis-je gérer ma boutique entièrement depuis un smartphone Android ou iPhone ?",
    a: "Oui, la plateforme est 100% Mobile-First. Vous pouvez ajouter vos articles, modifier vos prix, suivre vos stocks, calculer vos bilans et relancer vos clients directement depuis votre téléphone portable."
  }
]

const JSON_LD_SOFTWARE = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Nopalou Création de Boutique en Ligne',
  operatingSystem: 'Android, iOS, Web',
  applicationCategory: 'BusinessApplication',
  offers: {
    '@type': 'Offer',
    price: '2500',
    priceCurrency: 'XOF',
    priceValidUntil: '2027-12-31',
    description: 'Abonnement mensuel commerçant au Sénégal avec 30 jours offerts et 0% de commission.',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    reviewCount: '340',
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

export default function CreerBoutiquePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD_SOFTWARE) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD_FAQ) }}
      />

      <main style={{ background: '#f8fafc', color: '#0f172a', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        
        {/* ── HERO SECTION ── */}
        <section style={{
          background: 'linear-gradient(135deg, #1C2B4A 0%, #0d1728 100%)',
          color: '#ffffff',
          padding: '70px 20px 100px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: '-15%', left: '-10%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(199,91,0,0.25) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: 550, height: 550, background: 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

          <div style={{ maxWidth: 960, margin: '0 auto', position: 'relative', zIndex: 2 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(199,91,0,0.2)', color: '#fed7aa',
              padding: '6px 18px', borderRadius: 30, fontSize: 13, fontWeight: 800,
              marginBottom: 24, border: '1px solid rgba(199,91,0,0.35)',
              letterSpacing: '0.04em'
            }}>
              <Sparkles size={14} style={{ color: '#fed7aa' }} />
              <span>COMMERCE EN LIGNE AU SÉNÉGAL • SANS CARTE BANCAIRE</span>
            </div>

            <h1 style={{
              fontSize: 'clamp(32px, 5vw, 56px)',
              fontWeight: 900,
              margin: '0 0 20px',
              lineHeight: 1.15,
              letterSpacing: '-0.03em'
            }}>
              Créez votre boutique en ligne au Sénégal en <span style={{ color: '#fed7aa' }}>30 secondes</span>
            </h1>

            <p style={{
              fontSize: 'clamp(16px, 2.2vw, 20px)',
              color: '#94a3b8',
              maxWidth: 780,
              margin: '0 auto 36px',
              lineHeight: 1.6
            }}>
              Votre vitrine web professionnelle connectée à <strong>WhatsApp</strong> et <strong>Wave</strong>.
              Recevez des commandes prêtes à livrer, encaissez sans commission et gérez tout depuis votre smartphone.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 40 }}>
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
                  boxShadow: '0 8px 24px rgba(199,91,0,0.4)',
                  transition: 'transform 0.15s ease'
                }}
              >
                <span>Créer ma boutique gratuitement</span>
                <ArrowRight size={18} />
              </Link>

              <Link
                href="/alternative-shopify-senegal"
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
                  border: '1px solid rgba(255,255,255,0.18)'
                }}
              >
                <span>Pourquoi choisir Nopalou ?</span>
              </Link>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap', fontSize: 13, color: '#cbd5e1' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={16} color="#10b981" /> 30 jours d'essai offerts
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={16} color="#10b981" /> 0% de commission sur vos ventes
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={16} color="#10b981" /> Paiement direct Wave & OM
              </span>
            </div>
          </div>
        </section>

        {/* ── SECTION LES 4 AVANTAGES CLÉS POUR LE MARCHÉ SÉNÉGALAIS ── */}
        <section style={{ maxWidth: 1100, margin: '-50px auto 70px', padding: '0 20px', position: 'relative', zIndex: 10 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 20
          }}>
            {[
              {
                icon: <MessageSquare size={28} color="#25D366" />,
                title: 'Commandes WhatsApp',
                desc: 'Vos clients commandent en 1 clic. Vous recevez un récapitulatif propre sur WhatsApp avec produits, total et adresse de livraison.'
              },
              {
                icon: <CreditCard size={28} color="#00A859" />,
                title: 'Wave & Orange Money',
                desc: 'Vos clients scannent et paient instantanément. Vous touchez 100% de vos fonds directement sur votre compte marchand.'
              },
              {
                icon: <Smartphone size={28} color="#C75B00" />,
                title: '100% Mobile & Facile',
                desc: 'Pas besoin d\'ordinateur ni de connaissances techniques. Ajoutez des photos et ajustez vos prix directement sur votre téléphone.'
              },
              {
                icon: <Store size={28} color="#3b82f6" />,
                title: 'Caisse Magasin Incluse',
                desc: 'Une caisse enregistreuse tactile utilisable en magasin même sans connexion Internet en cas de coupure de réseau.'
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

        {/* ── ÉTAPES DE CRÉATION ── */}
        <section style={{ maxWidth: 960, margin: '0 auto 80px', padding: '0 20px', textAlign: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#C75B00', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            SIMPLICITÉ ABSOLUE
          </span>
          <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 38px)', fontWeight: 900, color: '#1C2B4A', margin: '8px 0 20px' }}>
            Comment lancer votre commerce en ligne en 3 étapes
          </h2>
          <p style={{ color: '#64748b', fontSize: 16, maxWidth: 650, margin: '0 auto 40px' }}>
            Fini les semaines de configuration compliquée ou les devis exorbitants en agence web.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24, textAlign: 'left' }}>
            {[
              {
                step: '01',
                titre: 'Ouvrez votre vitrine',
                texte: 'Indiquez le nom de votre commerce et choisissez votre lien personnalisé (ex: nopalou.com/boutique/votre-boutique).'
              },
              {
                step: '02',
                titre: 'Ajoutez vos produits',
                texte: 'Prenez en photo vos articles avec votre smartphone ou importez votre fichier Excel / Shopify en 1 clic.'
              },
              {
                step: '03',
                titre: 'Partagez et encaissez',
                texte: 'Diffusez votre lien sur vos statuts WhatsApp, TikTok et Instagram. Recevez vos paiements Wave sans commission.'
              }
            ].map((st, i) => (
              <div key={i} style={{
                background: '#ffffff',
                borderRadius: 16,
                padding: '30px 24px',
                border: '1px solid #e2e8f0',
                position: 'relative'
              }}>
                <span style={{ fontSize: 36, fontWeight: 900, color: '#C75B00', opacity: 0.25, display: 'block', marginBottom: 12 }}>
                  {st.step}
                </span>
                <h3 style={{ fontSize: 19, fontWeight: 800, color: '#1C2B4A', margin: '0 0 10px' }}>{st.titre}</h3>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, margin: 0 }}>{st.texte}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FAQ ACCORDÉON SEO ── */}
        <section style={{ maxWidth: 840, margin: '0 auto 90px', padding: '0 20px' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: '#1C2B4A', margin: '0 0 12px' }}>
              Questions Fréquentes sur la Vente en Ligne au Sénégal
            </h2>
            <p style={{ color: '#64748b', fontSize: 15 }}>
              Tout ce que vous devez savoir pour démarrer sans risque.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {FAQ_ITEMS.map((item, i) => (
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
              Découvrez les solutions Nopalou pour votre commerce au Sénégal
            </h3>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
              <Link href="/alternative-shopify-senegal" style={{ background: '#ffffff', padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#1C2B4A', textDecoration: 'none', border: '1px solid #cbd5e1' }}>
                🆚 Nopalou vs Shopify
              </Link>
              <Link href="/logiciel-caisse-senegal" style={{ background: '#ffffff', padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#1C2B4A', textDecoration: 'none', border: '1px solid #cbd5e1' }}>
                📟 Caisse POS sans Internet
              </Link>
              <Link href="/vendre-sur-whatsapp" style={{ background: '#ffffff', padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#1C2B4A', textDecoration: 'none', border: '1px solid #cbd5e1' }}>
                💬 Commandes WhatsApp
              </Link>
              <Link href="/paiement-en-ligne-senegal" style={{ background: '#ffffff', padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#1C2B4A', textDecoration: 'none', border: '1px solid #cbd5e1' }}>
                💳 Paiements Wave & Orange Money
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
