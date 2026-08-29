import type { Metadata } from 'next'
import Link from 'next/link'
import TarifsPublicsSelector from './TarifsPublicsSelector'

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'

export const metadata: Metadata = {
  title: 'Tarifs & Forfaits Vendeurs | Créer une Boutique au Sénégal | Nopalou',
  description: 'Découvrez nos forfaits d’abonnement pour créer votre boutique en ligne au Sénégal dès 5.000 FCFA/mois (1 mois offert). Alternative N°1 à Shopify pour vendre sur WhatsApp avec Wave et Orange Money.',
  keywords: ['tarifs boutique en ligne sénégal', 'forfait vendeur dakar', 'prix création boutique whatsapp sénégal', 'alternative shopify sénégal', 'créer business dakar', 'vendre produits alibaba sénégal', 'abonnement e-commerce sénégal', 'nopalou tarifs vendeurs'],
  alternates: {
    canonical: `${BASE}/tarifs-boutique`,
  },
  openGraph: {
    title: 'Tarifs & Formules Vendeurs — Nopalou Sénégal',
    description: 'Lancez votre boutique en ligne au Sénégal en 2 minutes. 1 mois offert, 0% de commission, paiement Wave & Orange Money.',
    url: `${BASE}/tarifs-boutique`,
    type: 'website',
  },
}

const FAQ_ITEMS = [
  { q: 'Combien coûte la création d’une boutique en ligne sur Nopalou ?', a: 'La création de boutique démarre dès 2.500 FCFA par mois avec la formule Boutique Taf Taf, avec 30 jours 100% offerts sans engagement. Vous profitez de 0% de commission sur vos ventes et des encaissements directs par Wave ou Orange Money.' },
  { q: 'Pourquoi Nopalou est la meilleure alternative à Shopify au Sénégal ?', a: 'Contrairement à Shopify qui exige une carte bancaire en dollars ($29/mois + frais de transaction) et n’intègre pas nativement Wave ou Orange Money, Nopalou est 100% conçu pour le Sénégal : paiements locaux directs, commandes WhatsApp, caisse tactile POS magasin et référencement gratuit sur le comparateur de prix N°1.' },
  { q: 'Puis-je migrer mon catalogue Shopify, WooCommerce ou Excel en 1 clic ?', a: 'Oui ! Grâce au moteur d’import intelligent Nopalou, vous pouvez glisser-déposer votre fichier d’export Shopify, WooCommerce ou Excel : vos titres, prix, stocks et photos sont reconnus automatiquement sans aucune ressaisie.' },
  { q: 'Puis-je gérer ma boutique entièrement par WhatsApp sans ordinateur ?', a: 'Absolument ! Vous pouvez ouvrir votre boutique en 30 secondes en envoyant un message WhatsApp, ajouter des produits en envoyant une simple photo et le prix, consulter votre bilan du jour et suivre votre carnet de dettes directement dans la conversation WhatsApp.' },
  { q: 'Comment mes clients paient-ils sur ma boutique ?', a: 'Vos clients commandent directement sur votre boutique ou via WhatsApp. Ils peuvent vous régler via Wave, Orange Money, Free Money ou en espèces à la livraison. Vous recevez 100% des fonds instantanément sur votre propre compte.' },
  { q: 'Est-il nécessaire d’avoir des compétences informatiques ?', a: 'Aucune compétence technique n’est nécessaire ! L’espace marchand a été pensé pour le « zéro apprentissage » avec 6 onglets essentiels simples et un accompagnement WhatsApp permanent.' },
]

const JSON_LD_FAQ = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_ITEMS.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a },
  })),
}

export default function TarifsBoutiquePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD_FAQ) }} />

      <main style={{ background: '#f8fafc', color: '#0f172a', minHeight: '100vh', paddingBottom: 80, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        
        {/* ── HERO HEADER SAAS PREMIUM ── */}
        <section style={{
          background: 'linear-gradient(135deg, #1C2B4A 0%, #0d1728 100%)',
          color: '#ffffff',
          padding: '80px 20px 140px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Glassmorphism circles */}
          <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(199,91,0,0.2) 0%, transparent 70%)', borderRadius: '50%' }}></div>
          <div style={{ position: 'absolute', bottom: '-20%', right: '0', width: 500, height: 500, background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)', borderRadius: '50%' }}></div>

          <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 2 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(199,91,0,0.2)', color: '#fed7aa', padding: '6px 16px', borderRadius: 20,
              fontSize: 13, fontWeight: 800, marginBottom: 20, border: '1px solid rgba(199,91,0,0.4)', letterSpacing: '0.05em'
            }}>
              💳 PRIX TRANSPARENTS
            </span>
            <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 900, margin: '0 0 16px', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
              Investissez dans votre succès, <br/>sans surprise.
            </h1>
            <p style={{ fontSize: 'clamp(16px, 2.5vw, 20px)', color: '#94a3b8', maxWidth: 600, margin: '0 auto 0', lineHeight: 1.6 }}>
              Aucune commission sur vos ventes. <br/>Commencez gratuitement pendant 30 jours, puis choisissez le plan qui vous correspond le mieux.
            </p>
          </div>
        </section>

        {/* ── FORFAITS CARDS SECTION (Lifted up to overlap header) ── */}
        <section style={{ maxWidth: 1200, margin: '-80px auto 80px', padding: '0 20px', position: 'relative', zIndex: 3 }}>
          <TarifsPublicsSelector />
        </section>

        {/* ── COMPARATIF DIRECT NOPALOU VS SHOPIFY & WOOCOMMERCE ── */}
        <section style={{ maxWidth: 1000, margin: '0 auto 80px', padding: '0 20px' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#C75B00', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Comparatif</span>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 900, color: '#1C2B4A', marginTop: 10 }}>
              Pourquoi abandonner Shopify au Sénégal ?
            </h2>
          </div>

          <div style={{ overflowX: 'auto', background: '#ffffff', borderRadius: 24, border: '1px solid #e2e8f0', boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 15 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '20px 24px', fontWeight: 800, color: '#334155' }}>Critères clés</th>
                  <th style={{ padding: '20px 24px', fontWeight: 900, color: '#C75B00', background: '#fff7ed', fontSize: 17 }}>🧡 Nopalou SaaS</th>
                  <th style={{ padding: '20px 24px', fontWeight: 700, color: '#64748b' }}>Shopify</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px 24px', fontWeight: 700, color: '#475569' }}>Coût d'entrée</td>
                  <td style={{ padding: '16px 24px', fontWeight: 900, color: '#10b981', background: '#fff7ed' }}>Dès 2.500 FCFA (1m offert)</td>
                  <td style={{ padding: '16px 24px', color: '#64748b' }}>29$ / mois (~18.000 FCFA)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px 24px', fontWeight: 700, color: '#475569' }}>Carte bancaire requise</td>
                  <td style={{ padding: '16px 24px', fontWeight: 900, color: '#10b981', background: '#fff7ed' }}>NON (Abonnement par Wave)</td>
                  <td style={{ padding: '16px 24px', color: '#ef4444' }}>OUI (Visa / Mastercard)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px 24px', fontWeight: 700, color: '#475569' }}>Paiement Client (Wave/OM)</td>
                  <td style={{ padding: '16px 24px', fontWeight: 900, color: '#10b981', background: '#fff7ed' }}>Natif (Encaissement direct)</td>
                  <td style={{ padding: '16px 24px', color: '#ef4444' }}>Via intégrateurs (Difficile)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px 24px', fontWeight: 700, color: '#475569' }}>Commission sur ventes</td>
                  <td style={{ padding: '16px 24px', fontWeight: 900, color: '#10b981', background: '#fff7ed' }}>0% Commission</td>
                  <td style={{ padding: '16px 24px', color: '#ef4444' }}>2% à 5% par transaction</td>
                </tr>
                <tr>
                  <td style={{ padding: '16px 24px', fontWeight: 700, color: '#475569' }}>Vente WhatsApp</td>
                  <td style={{ padding: '16px 24px', fontWeight: 900, color: '#10b981', background: '#fff7ed' }}>100% Intégré</td>
                  <td style={{ padding: '16px 24px', color: '#ef4444' }}>Non / Plugins payants</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ── SECTION SOURCING ALIBABA / ALIEXPRESS ── */}
        <section style={{ maxWidth: 1000, margin: '0 auto 60px', padding: '0 20px' }}>
          <div style={{ background: '#ffffff', borderRadius: 20, padding: 32, border: '1px solid #e2e8f0', boxShadow: '0 6px 24px rgba(0,0,0,0.03)' }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', margin: '0 0 12px' }}>
              📦 Vous achetez sur Alibaba ou AliExpress ? Vendez facilement au Sénégal !
            </h2>
            <p style={{ color: '#475569', fontSize: 15, lineHeight: 1.7, margin: '0 0 20px' }}>
              De nombreux commerçants à Dakar s&apos;approvisionnent en gros sur <strong>Alibaba, AliExpress, Shein ou 1688</strong> pour revendre des vêtements, téléphones, cosmétiques et accessoires. Avec Nopalou :
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
              <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>1️⃣ Sourcing</div>
                <div style={{ fontSize: 13, color: '#64748b' }}>Commandez vos articles sur Alibaba/AliExpress à prix de gros.</div>
              </div>
              <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>2️⃣ Boutique Nopalou</div>
                <div style={{ fontSize: 13, color: '#64748b' }}>Publiez votre catalogue en 2 min avec vos prix en FCFA.</div>
              </div>
              <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>3️⃣ Vente WhatsApp</div>
                <div style={{ fontSize: 13, color: '#64748b' }}>Recevez l&apos;argent directement par Wave ou Orange Money à la commande.</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ACCORDION SECTION ── */}
        <section style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px' }}>
          <h2 style={{ fontSize: 26, fontWeight: 900, textAlign: 'center', marginBottom: 32 }}>
            Questions Fréquentes (FAQ Vendeurs)
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {FAQ_ITEMS.map((item, index) => (
              <details
                key={index}
                style={{
                  background: '#ffffff',
                  borderRadius: 12,
                  padding: '16px 20px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  cursor: 'pointer',
                }}
              >
                <summary style={{ fontWeight: 800, fontSize: 16, color: '#0f172a', outline: 'none' }}>
                  {item.q}
                </summary>
                <p style={{ marginTop: 12, color: '#475569', fontSize: 14, lineHeight: 1.6, margin: '12px 0 0' }}>
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </section>

      </main>
    </>
  )
}
