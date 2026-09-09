import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Smartphone, WifiOff, QrCode, Receipt, Users, Zap, ShieldCheck,
  CheckCircle2, ArrowRight, Printer, Sparkles, HelpCircle, Store,
  CreditCard, BarChart2, Laptop, Clock
} from 'lucide-react'

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'

export const metadata: Metadata = {
  title: 'Logiciel de Caisse Enregistreuse au Sénégal (2026) | Nopalou POS Dakar',
  description: 'Le logiciel de caisse enregistreuse tactile n°1 au Sénégal pour boutique et magasin. Fonctionne 100% hors-ligne sans Internet, encaisse Wave & OM, dès 2 500 FCFA/mois.',
  keywords: [
    'logiciel de caisse sénégal',
    'caisse enregistreuse dakar',
    'pos sénégal',
    'caisse enregistreuse prix sénégal',
    'caisse tactile dakar',
    'caisse enregistreuse petit commerce',
    'logiciel caisse magasin dakar',
    'caisse hors ligne sénégal wave',
    'imprimante thermique ticket de caisse dakar',
    'terminal point de vente sénégal'
  ],
  alternates: {
    canonical: `${BASE}/logiciel-caisse-senegal`,
  },
  openGraph: {
    title: 'Logiciel de Caisse Enregistreuse au Sénégal | Nopalou POS',
    description: 'La solution de caisse enregistreuse tactile pour commerces au Sénégal. Fonctionne hors-ligne dès 2 500 FCFA/mois.',
    url: `${BASE}/logiciel-caisse-senegal`,
    type: 'website',
  },
}

const POS_FAQ = [
  {
    q: "Quel est le prix d'un logiciel de caisse enregistreuse au Sénégal ?",
    a: "Alors qu'un équipement de caisse tactile traditionnel coûte entre 350 000 et 900 000 FCFA à Dakar, Nopalou POS ne requiert aucun matériel propriétaire coûteux. L'abonnement débute à seulement 2 500 FCFA/mois (avec 30 jours 100% offerts) et fonctionne directement sur votre smartphone, tablette ou ordinateur."
  },
  {
    q: "La caisse fonctionne-t-elle si la connexion Internet coupe à Dakar ?",
    a: "Oui, à 100% ! Nopalou POS intègre un moteur Offline-First. En cas de coupure de réseau Orange/Yas ou de délestage électrique Senelec, vous continuez à enregistrer vos ventes, calculer la monnaie et imprimer vos tickets. Dès le rétablissement de la connexion, vos données se synchronisent automatiquement."
  },
  {
    q: "Quel matériel dois-je acheter pour utiliser Nopalou POS ?",
    a: "Zéro matériel obligatoire ! Vous pouvez encaisser avec un simple smartphone Android ou un iPhone. Si vous souhaitez imprimer des reçus, Nopalou est nativement compatible avec toutes les imprimantes thermiques Bluetooth ou USB (58mm et 80mm) et les douchettes code-barres standard du marché sénégalais."
  },
  {
    q: "Comment sont gérées les ventes à crédit et les dettes clients ?",
    a: "Nopalou POS intègre un carnet de dettes complet ('Bor'). Vous pouvez attribuer une vente à un client, enregistrer les acomptes partiels et lui envoyer un rappel poli sur WhatsApp contenant son solde restant et un lien Wave pour régler en 1 seconde."
  }
]

const JSON_LD_SOFTWARE = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Nopalou POS - Logiciel de Caisse Enregistreuse Sénégal',
  operatingSystem: 'Android, iOS, Windows, Mac, Web',
  applicationCategory: 'PointOfSaleApplication',
  offers: {
    '@type': 'Offer',
    price: '2500',
    priceCurrency: 'XOF',
    priceValidUntil: '2027-12-31',
    description: 'Caisse enregistreuse tactile hors-ligne pour petit commerce au Sénégal.',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.95',
    reviewCount: '280',
  },
}

const JSON_LD_FAQ = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: POS_FAQ.map(item => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.a,
    },
  })),
}

export default function LogicielCaisseSenegalPage() {
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
        
        {/* ── HERO CAISSE POS ── */}
        <section style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
          color: '#ffffff',
          padding: '70px 20px 100px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ maxWidth: 960, margin: '0 auto', position: 'relative', zIndex: 2 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(99,102,241,0.2)', color: '#c7d2fe',
              padding: '6px 18px', borderRadius: 30, fontSize: 13, fontWeight: 800,
              marginBottom: 24, border: '1px solid rgba(99,102,241,0.35)',
              letterSpacing: '0.04em'
            }}>
              <Sparkles size={14} />
              <span>SYSTÈME POINT DE VENTE (POS) 100% SÉNÉGAL</span>
            </div>

            <h1 style={{
              fontSize: 'clamp(32px, 5vw, 56px)',
              fontWeight: 900,
              margin: '0 0 20px',
              lineHeight: 1.15,
              letterSpacing: '-0.03em'
            }}>
              Le logiciel de caisse tactile conçu pour les <span style={{ color: '#fed7aa' }}>commerces de Dakar</span>
            </h1>

            <p style={{
              fontSize: 'clamp(16px, 2.2vw, 20px)',
              color: '#94a3b8',
              maxWidth: 780,
              margin: '0 auto 36px',
              lineHeight: 1.6
            }}>
              Encaissez en magasin même lors des coupures Internet. Calculez la monnaie, gérez vos stocks,
              imprimez vos tickets Bluetooth et encaissez par Wave sans commission.
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
                <span>Tester la caisse (30 jours offerts)</span>
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/pos"
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
                <span>Voir la démo de caisse</span>
              </Link>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap', fontSize: 13, color: '#cbd5e1' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={16} color="#10b981" /> 100% utilisable hors-ligne
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={16} color="#10b981" /> Sur smartphone, tablette ou PC
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={16} color="#10b981" /> Compatible imprimante thermique 58/80mm
              </span>
            </div>
          </div>
        </section>

        {/* ── LES FONCTIONS CAISSE CLÉS ── */}
        <section style={{ maxWidth: 1100, margin: '-40px auto 70px', padding: '0 20px', position: 'relative', zIndex: 10 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 20
          }}>
            {[
              {
                icon: <WifiOff size={28} color="#ef4444" />,
                title: 'Mode Hors-Ligne Garanti',
                desc: 'Aucune perte de vente : si votre 4G coupe ou si Senelec décharge le quartier, votre caisse continue à tourner.'
              },
              {
                icon: <QrCode size={28} color="#10b981" />,
                title: 'Paiement Wave & Espèces',
                desc: 'Calcul instantané de la monnaie à rendre en espèces, et affichage du QR Code Wave pour paiement immédiat.'
              },
              {
                icon: <Printer size={28} color="#6366f1" />,
                title: 'Tickets de Caisse & Factures',
                desc: 'Impression en 1 seconde sur n\'importe quelle imprimante de caisse thermique Bluetooth ou envoi du reçu par WhatsApp.'
              },
              {
                icon: <Users size={28} color="#f59e0b" />,
                title: 'Gestion Multi-Caissiers',
                desc: 'Attribuez des accès sécurisés à vos vendeurs avec suivi précis des encaissements et des clôtures de caisse du soir.'
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
              Questions Fréquentes sur la Caisse Enregistreuse au Sénégal
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {POS_FAQ.map((item, i) => (
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
              Autres solutions Nopalou pour commerçants
            </h3>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
              <Link href="/creer-boutique-en-ligne" style={{ background: '#ffffff', padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#1C2B4A', textDecoration: 'none', border: '1px solid #cbd5e1' }}>
                🛒 Créer une boutique en ligne
              </Link>
              <Link href="/alternative-shopify-senegal" style={{ background: '#ffffff', padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#1C2B4A', textDecoration: 'none', border: '1px solid #cbd5e1' }}>
                🆚 Nopalou vs Shopify
              </Link>
              <Link href="/vendre-sur-whatsapp" style={{ background: '#ffffff', padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#1C2B4A', textDecoration: 'none', border: '1px solid #cbd5e1' }}>
                💬 Commandes WhatsApp
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
