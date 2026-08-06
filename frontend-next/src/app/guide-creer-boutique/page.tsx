import type { Metadata } from 'next'
import Link from 'next/link'

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'

export const metadata: Metadata = {
  title: 'Guide 2026 : Comment Créer sa Boutique en Ligne au Sénégal | Nopalou',
  description:
    'Découvrez le guide complet pour lancer votre commerce en ligne à Dakar et au Sénégal. Sourcing sur Alibaba/AliExpress, alternative à Shopify, encaissement Wave & Orange Money et vente sur WhatsApp.',
  keywords: [
    'comment créer boutique en ligne sénégal',
    'guide commerce dakar',
    'acheter sur alibaba vendre au sénégal',
    'revente aliexpress dakar',
    'alternative shopify sénégal',
    'lancer son business whatsapp dakar',
    'vendre en ligne sans carte bancaire',
  ],
  alternates: {
    canonical: `${BASE}/guide-creer-boutique`,
  },
  openGraph: {
    title: 'Guide complet pour créer sa boutique en ligne au Sénégal (2026)',
    description:
      'Toutes les étapes pour réussir son commerce en ligne à Dakar : sourcing, choix de la plateforme, paiement Wave/Orange Money et livraison.',
    url: `${BASE}/guide-creer-boutique`,
    type: 'article',
  },
}

const JSON_LD_HOWTO = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'Comment créer une boutique en ligne et lancer son commerce au Sénégal',
  description:
    'Guide étape par étape pour trouver ses produits sur Alibaba/AliExpress, créer sa vitrine Nopalou et vendre sur WhatsApp au Sénégal.',
  step: [
    {
      '@type': 'HowToStep',
      name: 'Trouver ses produits (Sourcing)',
      text: 'Commandez vos marchandises à prix de gros sur Alibaba, AliExpress, Shein ou chez des grossistes locaux à Dakar.',
    },
    {
      '@type': 'HowToStep',
      name: 'Créer sa boutique Nopalou',
      text: 'Remplissez le nom de votre boutique et votre numéro WhatsApp sur Nopalou en 2 minutes.',
    },
    {
      '@type': 'HowToStep',
      name: 'Ajouter ses articles et ses prix en FCFA',
      text: 'Ajoutez les photos, descriptions et prix de vos produits sur votre vitrine.',
    },
    {
      '@type': 'HowToStep',
      name: 'Recevoir les paiements Wave & Orange Money',
      text: 'Vos clients passent commande sur WhatsApp et vous règlent directement sans intermédiaire.',
    },
  ],
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
      name: 'Guides',
      item: `${BASE}/guide-prix`,
    },
    {
      '@type': 'ListItem',
      position: 3,
      name: 'Guide Créer sa Boutique',
      item: `${BASE}/guide-creer-boutique`,
    },
  ],
}

export default function GuideCreerBoutiquePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD_HOWTO) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD_BREADCRUMB) }}
      />

      <main style={{ background: '#f8fafc', color: '#0f172a', minHeight: '100vh', padding: '40px 20px 80px' }}>
        <article style={{ maxWidth: 840, margin: '0 auto', background: '#ffffff', padding: '40px 32px', borderRadius: 24, border: '1px solid #e2e8f0', boxShadow: '0 8px 30px rgba(0,0,0,0.03)' }}>
          
          {/* HEADER ARTICLE */}
          <header style={{ marginBottom: 32, borderBottom: '1px solid #f1f5f9', paddingBottom: 24 }}>
            <span style={{ background: '#fff7ed', color: '#C75B00', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 800 }}>
              📘 Guide Pratique E-Commerce Sénégal 2026
            </span>
            <h1 style={{ fontFamily: 'var(--font-archivo), system-ui, sans-serif', fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: 900, color: '#0f172a', margin: '16px 0 12px', lineHeight: 1.25 }}>
              Comment Créer sa Boutique en Ligne &amp; Réussir son Commerce au Sénégal
            </h1>
            <p style={{ fontSize: 16, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
              Du sourcing sur Alibaba/AliExpress à la gestion des commandes WhatsApp avec Wave &amp; Orange Money à Dakar.
            </p>
          </header>

          {/* TABLE DES MATIÈRES */}
          <nav style={{ background: '#f8fafc', padding: 20, borderRadius: 16, border: '1px solid #cbd5e1', marginBottom: 40 }}>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 10, color: '#0f172a' }}>Sommaire du guide :</div>
            <ol style={{ margin: 0, paddingLeft: 20, color: '#C75B00', fontSize: 14, lineHeight: 1.8, fontWeight: 700 }}>
              <li>Étape 1 : Le Sourcing (Alibaba, AliExpress, Shein)</li>
              <li>Étape 2 : Choisir sa Plateforme (Pourquoi éviter les pièges de Shopify au Sénégal)</li>
              <li>Étape 3 : Configurer sa Boutique Nopalou en 2 minutes</li>
              <li>Étape 4 : Encaisser par Wave, Orange Money et gérer la livraison à Dakar</li>
            </ol>
          </nav>

          {/* SECTION 1 */}
          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', marginBottom: 14 }}>
              1. Trouver ses produits : Le Sourcing sur Alibaba &amp; AliExpress
            </h2>
            <p style={{ fontSize: 15, color: '#334155', lineHeight: 1.7, marginBottom: 14 }}>
              Au Sénégal, la majorité des entrepreneurs à succès s&apos;approvisionnent directement en Asie via des plateformes comme <strong>Alibaba, AliExpress, 1688 ou Shein</strong>. Que vous vendiez des vêtements, des accessoires de mode, du matériel high-tech ou des cosmétiques, le sourcing en ligne permet d&apos;obtenir des marges confortables.
            </p>
            <div style={{ background: '#eff6ff', borderLeft: '4px solid #3b82f6', padding: 16, borderRadius: '0 12px 12px 0', fontSize: 14, color: '#1e40af' }}>
              💡 <strong>Conseil Pro :</strong> Pour démarrer sans prendre de risque financier, commandez d&apos;abord des échantillons d&apos;AliExpress pour tester la qualité avant de faire des commandes en gros sur Alibaba.
            </div>
          </section>

          {/* SECTION 2 */}
          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', marginBottom: 14 }}>
              2. Choisir sa plateforme : Nopalou vs Shopify &amp; WooCommerce
            </h2>
            <p style={{ fontSize: 15, color: '#334155', lineHeight: 1.7, marginBottom: 14 }}>
              De nombreux vendeurs commettent l&apos;erreur de créer un site sur Shopify ou WooCommerce. Au Sénégal, cela pose 3 obstacles majeurs :
            </p>
            <ul style={{ paddingLeft: 20, fontSize: 15, color: '#334155', lineHeight: 1.8, marginBottom: 16 }}>
              <li><strong>La carte bancaire en dollars :</strong> Shopify facture 29$/mois par carte Visa/Mastercard internationale.</li>
              <li><strong>Le blocage au paiement :</strong> Les acheteurs sénégalais préfèrent Wave et Orange Money à la carte bancaire.</li>
              <li><strong>L&apos;absence de trafic :</strong> Un site Shopify isolé nécessite de payer très cher en pubs Meta/TikTok pour avoir des visiteurs.</li>
            </ul>
            <p style={{ fontSize: 15, color: '#334155', lineHeight: 1.7 }}>
              C&apos;est pourquoi <strong>Nopalou</strong> a été créé : votre boutique est immédiatement connectée au <strong>comparateur de prix N°1 au Sénégal</strong> (trafic gratuit) et les commandes arrivent directement sur votre WhatsApp.
            </p>
          </section>

          {/* SECTION 3 */}
          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', marginBottom: 14 }}>
              3. Lancer sa boutique Nopalou en 2 minutes
            </h2>
            <p style={{ fontSize: 15, color: '#334155', lineHeight: 1.7, marginBottom: 16 }}>
              Le processus est ultra-simple :
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <strong>1. Choisissez le nom de votre boutique</strong> (ex: <em>Dakar Chic, Electro SN</em>).
              </div>
              <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <strong>2. Renseignez votre numéro WhatsApp</strong> pour recevoir les commandes.
              </div>
              <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <strong>3. Sélectionnez votre formule (1 mois offert)</strong> et commencez à ajouter vos produits.
              </div>
            </div>
          </section>

          {/* BANDEAU CTA FINAL */}
          <div style={{ marginTop: 48, background: 'linear-gradient(135deg, #1C2B4A 0%, #0f172a 100%)', color: '#ffffff', padding: 32, borderRadius: 20, textAlign: 'center' }}>
            <h3 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 10px', color: '#ffffff' }}>
              Prêt à lancer votre commerce au Sénégal ?
            </h3>
            <p style={{ fontSize: 14, color: '#94a3b8', margin: '0 0 24px' }}>
              Profitez d&apos;un mois d&apos;essai offert sur la formule Boutique Taf Taf et vendez sans commission !
            </p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                href="/creer-boutique"
                style={{
                  background: '#C75B00',
                  color: '#ffffff',
                  padding: '12px 24px',
                  borderRadius: 24,
                  fontWeight: 900,
                  fontSize: 15,
                  textDecoration: 'none',
                }}
              >
                🚀 Créer ma boutique gratuitement
              </Link>
              <Link
                href="/tarifs-boutique"
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  color: '#ffffff',
                  padding: '12px 24px',
                  borderRadius: 24,
                  fontWeight: 800,
                  fontSize: 14,
                  textDecoration: 'none',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}
              >
                Voir les tarifs vendeurs
              </Link>
            </div>
          </div>

        </article>
      </main>
    </>
  )
}
