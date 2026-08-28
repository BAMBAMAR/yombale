import type { Metadata } from 'next'
import Link from 'next/link'

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'

export const metadata: Metadata = {
  title: 'Guide 2026 : Comment Créer sa Boutique en Ligne au Sénégal | Nopalou',
  description:
    'Guide complet 2026 pour lancer son commerce au Sénégal : sourcing Alibaba/AliExpress, création 100% WhatsApp en 30s, import Shopify/Excel, paiements Wave & Orange Money et carnet de dettes.',
  keywords: [
    'comment créer boutique en ligne sénégal',
    'guide commerce dakar',
    'vendre sur whatsapp dakar',
    'acheter sur alibaba vendre au sénégal',
    'revente aliexpress dakar',
    'alternative shopify sénégal',
    'migration shopify nopalou',
    'caisse pos sénégal wave',
    'carnet de dettes commerçant dakar',
    'vendre en ligne sans carte bancaire',
  ],
  alternates: {
    canonical: `${BASE}/guide-creer-boutique`,
  },
  openGraph: {
    title: 'Guide complet pour créer sa boutique en ligne au Sénégal (2026)',
    description:
      'Toutes les étapes pour réussir son commerce en ligne à Dakar : sourcing, création WhatsApp en 30s, import 1-clic, paiement Wave/Orange Money et caisse POS.',
    url: `${BASE}/guide-creer-boutique`,
    type: 'article',
  },
}

const JSON_LD_HOWTO = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'Comment créer une boutique en ligne et lancer son commerce au Sénégal',
  description:
    'Guide étape par étape pour sourcer ses produits, ouvrir sa boutique Nopalou en 30 secondes sur WhatsApp ou le web, importer son catalogue et encaisser par Wave.',
  step: [
    {
      '@type': 'HowToStep',
      name: 'Trouver ses produits (Sourcing)',
      text: 'Commandez vos marchandises à prix de gros sur Alibaba, AliExpress, Shein ou chez des grossistes locaux à Dakar.',
    },
    {
      '@type': 'HowToStep',
      name: 'Créer sa boutique Nopalou en 30s',
      text: 'Ouvrez votre boutique en 30 secondes directement par WhatsApp ou via le formulaire en ligne.',
    },
    {
      '@type': 'HowToStep',
      name: 'Importer ou ajouter ses articles',
      text: 'Importez votre catalogue en 1 clic depuis Shopify, WooCommerce ou Excel, ou envoyez simplement une photo et le prix sur WhatsApp.',
    },
    {
      '@type': 'HowToStep',
      name: 'Encaisser par Wave & Orange Money et gérer son carnet',
      text: 'Recevez les paiements directs sans commission, suivez vos dettes clients et demandez votre bilan du jour par message.',
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
        <article style={{ maxWidth: 880, margin: '0 auto', background: '#ffffff', padding: '40px 32px', borderRadius: 24, border: '1px solid #e2e8f0', boxShadow: '0 8px 30px rgba(0,0,0,0.03)' }}>
          
          {/* HEADER ARTICLE */}
          <header style={{ marginBottom: 32, borderBottom: '1px solid #f1f5f9', paddingBottom: 24 }}>
            <span style={{ background: '#fff7ed', color: '#C75B00', padding: '5px 14px', borderRadius: 20, fontSize: 12.5, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span>📘</span>
              <span>Guide Pratique E-Commerce &amp; POS Sénégal 2026</span>
            </span>
            <h1 style={{ fontFamily: 'var(--font-archivo), system-ui, sans-serif', fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: 900, color: '#0f172a', margin: '16px 0 12px', lineHeight: 1.25 }}>
              Comment Créer sa Boutique en Ligne &amp; Réussir son Commerce au Sénégal
            </h1>
            <p style={{ fontSize: 16, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
              Du sourcing sur Alibaba/AliExpress à la gestion des commandes WhatsApp, paiements Wave, Caisse POS et Carnet de dettes à Dakar.
            </p>
          </header>

          {/* TABLE DES MATIÈRES */}
          <nav style={{ background: '#f8fafc', padding: 22, borderRadius: 16, border: '1px solid #cbd5e1', marginBottom: 40 }}>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 12, color: '#0f172a' }}>Sommaire du guide :</div>
            <ol style={{ margin: 0, paddingLeft: 20, color: '#C75B00', fontSize: 14.5, lineHeight: 1.85, fontWeight: 700 }}>
              <li>Étape 1 : Le Sourcing (Alibaba, AliExpress, Shein, Grossistes Dakar)</li>
              <li>Étape 2 : Pourquoi Nopalou est la meilleure alternative à Shopify &amp; WooCommerce</li>
              <li>Étape 3 : 3 façons d&apos;ouvrir sa boutique (WhatsApp en 30s, Web ou Import 1-Clic)</li>
              <li>Étape 4 : Encaisser par Wave, Orange Money et gérer son commerce au quotidien</li>
              <li>Étape 5 : Carnet de dettes client (&quot;Bor&quot;) et bilan de caisse instantané</li>
            </ol>
          </nav>

          {/* SECTION 1 */}
          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', marginBottom: 14 }}>
              1. Trouver ses produits : Le Sourcing sur Alibaba, AliExpress &amp; Grossistes
            </h2>
            <p style={{ fontSize: 15, color: '#334155', lineHeight: 1.7, marginBottom: 14 }}>
              Au Sénégal, la majorité des entrepreneurs à succès s&apos;approvisionnent directement en Asie via des plateformes comme <strong>Alibaba, AliExpress, 1688 ou Shein</strong>, ou collaborent avec des grossistes locaux (Sandaga, Colobane, HLM). Que vous vendiez des vêtements, des chaussures, de la téléphonie ou des cosmétiques, le sourcing en ligne permet d&apos;obtenir des marges nettes confortables.
            </p>
            <div style={{ background: '#eff6ff', borderLeft: '4px solid #3b82f6', padding: 16, borderRadius: '0 12px 12px 0', fontSize: 14, color: '#1e40af' }}>
              💡 <strong>Conseil Pro :</strong> Pour démarrer sans risque, commandez d&apos;abord quelques pièces sur AliExpress pour tester la qualité et la rapidité de vente avant d&apos;engager des volumes plus importants sur Alibaba.
            </div>
          </section>

          {/* SECTION 2 */}
          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', marginBottom: 14 }}>
              2. Choisir sa plateforme : Pourquoi éviter les pièges de Shopify au Sénégal
            </h2>
            <p style={{ fontSize: 15, color: '#334155', lineHeight: 1.7, marginBottom: 14 }}>
              De nombreux vendeurs débutants tentent de créer un site sur Shopify ou WooCommerce. En Afrique de l&apos;Ouest, cela pose 4 blocages majeurs :
            </p>
            <ul style={{ paddingLeft: 20, fontSize: 15, color: '#334155', lineHeight: 1.8, marginBottom: 16 }}>
              <li><strong>La carte bancaire en dollars :</strong> Shopify facture 29$/mois par carte Visa internationale, inaccessible à beaucoup.</li>
              <li><strong>Le blocage au checkout :</strong> Les clients sénégalais veulent payer par <strong>Wave et Orange Money</strong>, pas par carte de crédit.</li>
              <li><strong>L&apos;absence de trafic naturel :</strong> Un site Shopify isolé exige des centaines de milliers de FCFA en publicités TikTok/Meta.</li>
              <li><strong>La barrière technique :</strong> Configurer des thèmes, plugins et passerelles de paiement prend des semaines.</li>
            </ul>
            <p style={{ fontSize: 15, color: '#334155', lineHeight: 1.7 }}>
              C&apos;est pourquoi <strong>Nopalou</strong> a été conçu pour l&apos;Afrique : votre boutique est immédiatement connectée au <strong>comparateur de prix N°1 au Sénégal</strong> (trafic gratuit) avec encaissement direct Wave/Orange Money et 0% de commission.
            </p>
          </section>

          {/* SECTION 3 */}
          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', marginBottom: 14 }}>
              3. 3 façons simples de lancer votre boutique sur Nopalou
            </h2>
            <p style={{ fontSize: 15, color: '#334155', lineHeight: 1.7, marginBottom: 16 }}>
              Nopalou s&apos;adapte à votre niveau de confort technologique :
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: '#f0fdf4', padding: 18, borderRadius: 14, border: '1.5px solid #bbf7d0' }}>
                <strong style={{ color: '#166534', fontSize: 16 }}>📱 Méthode 1 : 100% WhatsApp en 30 secondes (Zéro Ordinateur)</strong>
                <p style={{ margin: '6px 0 0', fontSize: 14, color: '#15803d', lineHeight: 1.6 }}>
                  Envoyez simplement <em>« creer boutique »</em> au numéro WhatsApp officiel Nopalou. En 3 réponses (Nom, Secteur, Ville), votre boutique et votre vitrine web sont ouvertes et prêtes à vendre !
                </p>
              </div>

              <div style={{ background: '#f8fafc', padding: 18, borderRadius: 14, border: '1px solid #cbd5e1' }}>
                <strong style={{ color: '#0f172a', fontSize: 16 }}>💻 Méthode 2 : Formulaire Express en Ligne (2 minutes)</strong>
                <p style={{ margin: '6px 0 0', fontSize: 14, color: '#475569', lineHeight: 1.6 }}>
                  Sur le site web, renseignez le nom de votre boutique et votre numéro WhatsApp. Votre espace marchand simplifié à 6 onglets est immédiatement actif.
                </p>
              </div>

              <div style={{ background: '#eff6ff', padding: 18, borderRadius: 14, border: '1.5px solid #bfdbfe' }}>
                <strong style={{ color: '#1e40af', fontSize: 16 }}>📦 Méthode 3 : Migration Intelligente 1-Clic (Shopify, WooCommerce, Excel)</strong>
                <p style={{ margin: '6px 0 0', fontSize: 14, color: '#1d4ed8', lineHeight: 1.6 }}>
                  Vous avez déjà un catalogue ailleurs ? Uploadez votre fichier CSV/Excel : le moteur d&apos;import intelligent détecte automatiquement vos titres, prix, stocks et photos en quelques secondes !
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 4 & 5 */}
          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', marginBottom: 14 }}>
              4. Carnet de dettes client (&quot;Bor&quot;) &amp; Commandes WhatsApp
            </h2>
            <p style={{ fontSize: 15, color: '#334155', lineHeight: 1.7, marginBottom: 14 }}>
              Au Sénégal, la vente à crédit et les acomptes font partie du commerce. Nopalou remplace le carnet papier traditionnel par un <strong>Carnet de Dettes numérique sécurisé</strong> :
            </p>
            <ul style={{ paddingLeft: 20, fontSize: 15, color: '#334155', lineHeight: 1.8, marginBottom: 16 }}>
              <li><strong>Historique précis des dettes &amp; avances</strong> par client avec plafond autorisé.</li>
              <li><strong>Relances WhatsApp en 1 clic</strong> polies et personnalisées avec lien de paiement Wave.</li>
              <li><strong>Bilan du jour par message :</strong> Tapez <em>« Bilan »</em> sur WhatsApp pour connaître votre chiffre d&apos;affaires du jour et la répartition Cash vs Wave/OM.</li>
            </ul>
          </section>

          {/* BANDEAU CTA FINAL */}
          <div style={{ marginTop: 48, background: 'linear-gradient(135deg, #1C2B4A 0%, #0f172a 100%)', color: '#ffffff', padding: 36, borderRadius: 22, textAlign: 'center' }}>
            <h3 style={{ fontSize: 23, fontWeight: 900, margin: '0 0 10px', color: '#ffffff' }}>
              Prêt à développer votre commerce au Sénégal ?
            </h3>
            <p style={{ fontSize: 14.5, color: '#94a3b8', margin: '0 0 24px', maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }}>
              Profitez d&apos;un mois d&apos;essai offert sans engagement, 0% de commission sur vos ventes et encaissement direct Wave &amp; Orange Money.
            </p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                href="/creer-boutique"
                style={{
                  background: '#C75B00',
                  color: '#ffffff',
                  padding: '13px 26px',
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
                  padding: '13px 26px',
                  borderRadius: 24,
                  fontWeight: 800,
                  fontSize: 14.5,
                  textDecoration: 'none',
                  border: '1px solid rgba(255,255,255,0.25)',
                }}
              >
                Voir les forfaits vendeurs
              </Link>
            </div>
          </div>

        </article>
      </main>
    </>
  )
}
