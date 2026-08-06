import type { Metadata } from 'next'
import Link from 'next/link'

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'

export const metadata: Metadata = {
  title: 'Tarifs & Forfaits Vendeurs | Créer une Boutique au Sénégal | Nopalou',
  description:
    'Découvrez nos forfaits d’abonnement pour créer votre boutique en ligne au Sénégal dès 5.000 FCFA/mois (1 mois offert). Alternative N°1 à Shopify pour vendre sur WhatsApp avec Wave et Orange Money.',
  keywords: [
    'tarifs boutique en ligne sénégal',
    'forfait vendeur dakar',
    'prix création boutique whatsapp sénégal',
    'alternative shopify sénégal',
    'créer business dakar',
    'vendre produits alibaba sénégal',
    'abonnement e-commerce sénégal',
    'nopalou tarifs vendeurs',
  ],
  alternates: {
    canonical: `${BASE}/tarifs-boutique`,
  },
  openGraph: {
    title: 'Tarifs & Formules Vendeurs — Nopalou Sénégal',
    description:
      'Lancez votre boutique en ligne au Sénégal en 2 minutes. 1 mois offert, 0% de commission, paiement Wave & Orange Money.',
    url: `${BASE}/tarifs-boutique`,
    type: 'website',
  },
}

const FAQ_ITEMS = [
  {
    q: 'Combien coûte la création d’une boutique en ligne sur Nopalou ?',
    a: 'La création de boutique démarre à 5.000 FCFA par mois avec la formule Boutique Taf Taf, avec 30 jours offerts. Vous profitez de 0% de commission sur vos ventes et des encaissements directs par Wave ou Orange Money.',
  },
  {
    q: 'Pourquoi Nopalou est la meilleure alternative à Shopify au Sénégal ?',
    a: 'Contrairement à Shopify qui exige une carte bancaire internationale en dollars ($29/mois + frais de transaction) et n’intègre pas nativement les moyens de paiement locaux, Nopalou est 100% conçu pour le Sénégal : paiements Wave/Orange Money natifs, devises en FCFA, commandes directes sur WhatsApp et référencement automatique sur notre comparateur de prix.',
  },
  {
    q: 'Puis-je vendre sur Nopalou si j’achète mes marchandises sur Alibaba ou AliExpress ?',
    a: 'Absolument ! Des centaines de commerçants à Dakar et au Sénégal importent leurs produits depuis Alibaba, AliExpress, Shein ou 1688 et utilisent Nopalou pour créer leur catalogue vitrine et recevoir les commandes directement sur leur WhatsApp.',
  },
  {
    q: 'Comment mes clients paient-ils sur ma boutique ?',
    a: 'Vos clients effectuent leurs commandes directement via WhatsApp. Ils peuvent vous régler via Wave, Orange Money, Wizall ou en espèces à la livraison. Vous gardez 100% de l’argent directement dans votre poche.',
  },
  {
    q: 'Est-il nécessaire d’avoir des compétences informatiques ?',
    a: 'Aucune compétence technique n’est nécessaire ! Vous remplissez le formulaire de création en 2 minutes depuis votre téléphone, et votre boutique est immédiatement prête à recevoir des clients.',
  },
]

const JSON_LD_FAQ = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_ITEMS.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.a,
    },
  })),
}

const JSON_LD_BREADCRUMB = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Accueil',
      item: BASE,
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Tarifs Vendeurs',
      item: `${BASE}/tarifs-boutique`,
    },
  ],
}

export default function TarifsBoutiquePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD_FAQ) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD_BREADCRUMB) }}
      />

      <main style={{ background: '#f8fafc', color: '#0f172a', minHeight: '100vh', paddingBottom: 60 }}>
        {/* HERO HEADER */}
        <section
          style={{
            background: 'linear-gradient(135deg, #1C2B4A 0%, #0f172a 100%)',
            color: '#ffffff',
            padding: '60px 20px 80px',
            textAlign: 'center',
            position: 'relative',
          }}
        >
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <span
              style={{
                display: 'inline-block',
                background: 'rgba(199,91,0,0.2)',
                color: '#fed7aa',
                padding: '6px 16px',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 800,
                marginBottom: 16,
                border: '1px solid rgba(199,91,0,0.4)',
              }}
            >
              🚀 Forfaits & Formules Vendeurs Nopalou
            </span>
            <h1
              style={{
                fontFamily: 'var(--font-archivo), system-ui, sans-serif',
                fontSize: 'clamp(28px, 5vw, 44px)',
                fontWeight: 900,
                margin: '0 0 16px',
                lineHeight: 1.2,
              }}
            >
              Créer votre boutique en ligne, lancer votre commerce &amp; booster votre business au{' '}
              <span style={{ color: '#C75B00' }}>Sénégal</span>
            </h1>
            <p
              style={{
                fontSize: 'clamp(15px, 2.5vw, 18px)',
                color: '#94a3b8',
                maxWidth: 720,
                margin: '0 auto 32px',
                lineHeight: 1.6,
              }}
            >
              Une solution e-commerce 100% adaptée au marché sénégalais. Sans carte bancaire,
              paiement direct <strong>Wave &amp; Orange Money</strong>, 0% de commission et 1 mois offert !
            </p>

            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                href="/creer-boutique"
                style={{
                  background: '#C75B00',
                  color: '#ffffff',
                  padding: '14px 28px',
                  borderRadius: 30,
                  fontSize: 16,
                  fontWeight: 900,
                  textDecoration: 'none',
                  boxShadow: '0 4px 16px rgba(199,91,0,0.3)',
                }}
              >
                ⚡ Créer ma boutique (1 mois offert)
              </Link>
              <Link
                href="/guide-creer-boutique"
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  color: '#ffffff',
                  padding: '14px 28px',
                  borderRadius: 30,
                  fontSize: 15,
                  fontWeight: 800,
                  textDecoration: 'none',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}
              >
                📖 Lire le guide du commerce
              </Link>
            </div>
          </div>
        </section>

        {/* FORFAITS CARDS SECTION */}
        <section style={{ maxWidth: 1200, margin: '-40px auto 60px', padding: '0 20px', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            
            {/* PLAN 1 */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: 20,
                padding: 32,
                border: '1px solid #cbd5e1',
                boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#C75B00', background: '#fff7ed', padding: '4px 10px', borderRadius: 12 }}>
                  Formule Populaire
                </span>
                <h3 style={{ fontSize: 24, fontWeight: 900, margin: '12px 0 8px' }}>Boutique Taf Taf</h3>
                <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 20px' }}>
                  Idéal pour débuter son commerce et vendre immédiatement sur WhatsApp.
                </p>

                <div style={{ marginBottom: 24 }}>
                  <span style={{ fontSize: 36, fontWeight: 900, color: '#0f172a' }}>5.000 FCFA</span>
                  <span style={{ color: '#64748b', fontSize: 14 }}> / mois</span>
                  <div style={{ color: '#10b981', fontSize: 12, fontWeight: 800, marginTop: 4 }}>
                    🎁 1er mois 100% offert
                  </div>
                </div>

                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14, color: '#334155' }}>
                  <li>✓ Catalogue de produits illimité</li>
                  <li>✓ Commandes directes sur WhatsApp</li>
                  <li>✓ Encaissement Wave &amp; Orange Money</li>
                  <li>✓ Vitrine personnalisable à votre couleur</li>
                  <li>✓ 0% de commission sur vos ventes</li>
                </ul>
              </div>

              <Link
                href="/creer-boutique?plan=decouverte"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  background: '#0f172a',
                  color: '#ffffff',
                  padding: '12px 20px',
                  borderRadius: 12,
                  fontWeight: 800,
                  textDecoration: 'none',
                  marginTop: 28,
                }}
              >
                Choisir cette formule
              </Link>
            </div>

            {/* PLAN 2 */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: 20,
                padding: 32,
                border: '2px solid #C75B00',
                boxShadow: '0 12px 35px rgba(199,91,0,0.12)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: -14,
                  right: 24,
                  background: '#C75B00',
                  color: '#ffffff',
                  padding: '4px 14px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 900,
                  textTransform: 'uppercase',
                }}
              >
                ⭐ Recommandé
              </span>

              <div>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#C75B00', background: '#fff7ed', padding: '4px 10px', borderRadius: 12 }}>
                  Booster de Ventes
                </span>
                <h3 style={{ fontSize: 24, fontWeight: 900, margin: '12px 0 8px' }}>Vendeur Pro</h3>
                <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 20px' }}>
                  Pour les commerces établis voulant maximiser leur visibilité sur Nopalou.
                </p>

                <div style={{ marginBottom: 24 }}>
                  <span style={{ fontSize: 36, fontWeight: 900, color: '#0f172a' }}>15.000 FCFA</span>
                  <span style={{ color: '#64748b', fontSize: 14 }}> / mois</span>
                  <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>
                    Soit 150.000 FCFA / an (-2 mois offerts)
                  </div>
                </div>

                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14, color: '#334155' }}>
                  <li>✓ Tout le contenu de la formule Taf Taf</li>
                  <li>✓ Badge Vendeur Pro Certifié ⭐</li>
                  <li>✓ Référencement prioritaire sur le comparateur</li>
                  <li>✓ Affichage en tête des recherches à Dakar</li>
                  <li>✓ Support client prioritaire sur WhatsApp</li>
                </ul>
              </div>

              <Link
                href="/creer-boutique?plan=pro"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  background: '#C75B00',
                  color: '#ffffff',
                  padding: '12px 20px',
                  borderRadius: 12,
                  fontWeight: 800,
                  textDecoration: 'none',
                  marginTop: 28,
                  boxShadow: '0 4px 12px rgba(199,91,0,0.25)',
                }}
              >
                Devenir Vendeur Pro
              </Link>
            </div>

            {/* PLAN 3 */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: 20,
                padding: 32,
                border: '1px solid #cbd5e1',
                boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#475569', background: '#f1f5f9', padding: '4px 10px', borderRadius: 12 }}>
                  Solution Globale
                </span>
                <h3 style={{ fontSize: 24, fontWeight: 900, margin: '12px 0 8px' }}>Business VIP</h3>
                <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 20px' }}>
                  Pour les grandes enseignes, grossistes et marques d&apos;importation.
                </p>

                <div style={{ marginBottom: 24 }}>
                  <span style={{ fontSize: 36, fontWeight: 900, color: '#0f172a' }}>35.000 FCFA</span>
                  <span style={{ color: '#64748b', fontSize: 14 }}> / mois</span>
                  <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>
                    Accompagnement marketing personnalisé
                  </div>
                </div>

                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14, color: '#334155' }}>
                  <li>✓ Tout le contenu de la formule Pro</li>
                  <li>✓ Bannière publicitaire sponsorisée Nopalou</li>
                  <li>✓ Campagnes de promotion WhatsApp &amp; TikTok</li>
                  <li>✓ Analytics avancés &amp; statistiques de visites</li>
                  <li>✓ Account Manager dédié 7j/7</li>
                </ul>
              </div>

              <Link
                href="/creer-boutique?plan=business"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  background: '#0f172a',
                  color: '#ffffff',
                  padding: '12px 20px',
                  borderRadius: 12,
                  fontWeight: 800,
                  textDecoration: 'none',
                  marginTop: 28,
                }}
              >
                Activer Business VIP
              </Link>
            </div>
          </div>
        </section>

        {/* COMPARATIF DIRECT NOPALOU VS SHOPIFY & WOOCOMMERCE */}
        <section style={{ maxWidth: 1000, margin: '0 auto 60px', padding: '0 20px' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: '#0f172a' }}>
              Pourquoi Nopalou est la meilleure alternative à Shopify au Sénégal ?
            </h2>
            <p style={{ color: '#64748b', fontSize: 15, maxWidth: 680, margin: '8px auto 0' }}>
              Découvrez la comparaison directe pour créer et gérer son commerce en toute sérénité à Dakar.
            </p>
          </div>

          <div style={{ overflowX: 'auto', background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '16px 20px', fontWeight: 800 }}>Critères</th>
                  <th style={{ padding: '16px 20px', fontWeight: 900, color: '#C75B00', background: '#fff7ed' }}>🧡 Nopalou</th>
                  <th style={{ padding: '16px 20px', fontWeight: 700, color: '#475569' }}>Shopify</th>
                  <th style={{ padding: '16px 20px', fontWeight: 700, color: '#475569' }}>WooCommerce</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px 20px', fontWeight: 700 }}>Coût mensuel</td>
                  <td style={{ padding: '16px 20px', fontWeight: 900, color: '#10b981', background: '#fff7ed' }}>Dès 5.000 FCFA (1m offert)</td>
                  <td style={{ padding: '16px 20px', color: '#64748b' }}>29$ / mois (~18.000 FCFA)</td>
                  <td style={{ padding: '16px 20px', color: '#64748b' }}>Hébergement + plugins payants</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px 20px', fontWeight: 700 }}>Carte bancaire obligatoire</td>
                  <td style={{ padding: '16px 20px', fontWeight: 900, color: '#10b981', background: '#fff7ed' }}>NON (Paiement Wave/OM)</td>
                  <td style={{ padding: '16px 20px', color: '#ef4444' }}>OUI (Visa / Mastercard)</td>
                  <td style={{ padding: '16px 20px', color: '#ef4444' }}>OUI pour l&apos;hébergeur</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px 20px', fontWeight: 700 }}>Paiement Wave &amp; Orange Money</td>
                  <td style={{ padding: '16px 20px', fontWeight: 900, color: '#10b981', background: '#fff7ed' }}>Direct &amp; Intégré</td>
                  <td style={{ padding: '16px 20px', color: '#64748b' }}>Complexe / Plugin tiers</td>
                  <td style={{ padding: '16px 20px', color: '#64748b' }}>Développement sur mesure</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px 20px', fontWeight: 700 }}>Commission sur les ventes</td>
                  <td style={{ padding: '16px 20px', fontWeight: 900, color: '#10b981', background: '#fff7ed' }}>0% Commission</td>
                  <td style={{ padding: '16px 20px', color: '#ef4444' }}>2% à 5% par transaction</td>
                  <td style={{ padding: '16px 20px', color: '#64748b' }}>Selon passerelle</td>
                </tr>
                <tr>
                  <td style={{ padding: '16px 20px', fontWeight: 700 }}>Visibilité Comparateur Nopalou</td>
                  <td style={{ padding: '16px 20px', fontWeight: 900, color: '#10b981', background: '#fff7ed' }}>Inclus (Trafic gratuit)</td>
                  <td style={{ padding: '16px 20px', color: '#ef4444' }}>Non (Publicité payante requise)</td>
                  <td style={{ padding: '16px 20px', color: '#ef4444' }}>Non (Publicité payante requise)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* SECTION SOURCING ALIBABA / ALIEXPRESS */}
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

        {/* FAQ ACCORDION SECTION */}
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
