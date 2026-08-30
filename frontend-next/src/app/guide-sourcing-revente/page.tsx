import type { Metadata } from 'next'
import Link from 'next/link'
import {
  PackageCheck, ArrowRight, Truck, DollarSign, Smartphone,
  CheckCircle2, Sparkles, HelpCircle, ShieldCheck, ShoppingBag,
  TrendingUp, Award, Layers, Globe, FileText
} from 'lucide-react'

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'

export const metadata: Metadata = {
  title: 'Alibaba, AliExpress, Shein & Afrety au Sénégal : Guide Achat & Revente (2026)',
  description: 'Comment commander sur Alibaba, AliExpress, Shein et livrer à Dakar (Afrety, groupage, fret). Créez votre boutique Nopalou sans carte bancaire, vendez sur WhatsApp et encaissez par Wave.',
  keywords: [
    'alibaba sénégal dakar',
    'groupage alibaba sénégal',
    'adresse alibaba sénégal',
    'comment commander sur aliexpress au sénégal',
    'aliexpress livraison sénégal dakar',
    'shein sénégal dakar',
    'commander sur shein sénégal',
    'shein vêtements femme soldes sénégal',
    'afrety dakar livraison',
    'boutique shopify sénégal prix avis',
    'exemple boutique shopify dropshipping dakar',
    'alternative shopify sénégal wave',
    'acheter sur alibaba vendre au sénégal',
    'revente shein dakar whatsapp'
  ],
  alternates: {
    canonical: `${BASE}/guide-sourcing-revente`,
  },
  openGraph: {
    title: 'Acheter sur Alibaba, AliExpress & Shein pour revendre au Sénégal',
    description: 'Le guide étape par étape : Sourcing Chine, groupage Afrety/transit, boutique Nopalou et encaissement Wave direct.',
    url: `${BASE}/guide-sourcing-revente`,
    type: 'article',
  },
}

const FAQ_SOURCING = [
  {
    q: "Comment faire du groupage et se faire livrer Alibaba ou AliExpress au Sénégal (Afrety, GP) ?",
    a: "Pour faire livrer vos commandes Alibaba, AliExpress ou Shein à Dakar sans complication, vous pouvez utiliser des transitaires locaux ou services de réexpédition comme Afrety, des agences de groupage maritime ou des GP aériens. Vous indiquez l'adresse de leur entrepôt en Chine lors de votre commande, et ils acheminent vos colis jusqu'à Dakar avec dédouanement inclus."
  },
  {
    q: "Comment commander sur SHEIN au Sénégal pour revendre des vêtements femme ?",
    a: "Sur l'application SHEIN, remplissez votre panier avec les articles soldés et tendance (robes, sacs, bijoux). Faites livrer vos colis via une agence de transport (fret aérien 7-10 jours). Dès réception, ajoutez les photos sur votre boutique Nopalou pour vendre directement à votre communauté WhatsApp en fixant vos marges en FCFA."
  },
  {
    q: "Quel est le prix réel d'une boutique Shopify au Sénégal vs Nopalou ?",
    a: "Une boutique Shopify coûte au minimum 18 000 FCFA/mois (29$) payables uniquement par carte Visa internationale en dollars, plus des frais d'applications payantes, sans passerelle Wave native. Nopalou coûte dès 2 500 FCFA/mois, payable directement par Wave ou Orange Money, avec 0% de commission et caisse POS magasin incluse."
  },
  {
    q: "Comment payer sur Alibaba ou AliExpress depuis le Sénégal sans carte bancaire internationale ?",
    a: "De nombreux transitaires à Dakar proposent le service 'Achat pour vous' : vous leur transmettez les liens de vos articles Alibaba/1688/AliExpress, vous réglez en FCFA par Wave ou Orange Money, et ils s'occupent de payer les fournisseurs en Chine et d'acheminer vos colis jusqu'à Dakar."
  },
  {
    q: "Combien de temps prend la livraison entre la Chine et le Sénégal ?",
    a: "Par fret aérien (cargo express / Afrety / GP), les colis arrivent à Dakar en 7 à 12 jours. Par fret maritime (conteneur groupage), comptez 35 à 45 jours avec des coûts de transport très bas au mètre cube pour les gros volumes."
  }
]

const JSON_LD_ARTICLE = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Comment Acheter sur Alibaba, AliExpress & Shein et Revendre au Sénégal avec Succès',
  description: 'Guide complet pour sourcer des articles en Chine, organiser le transport vers Dakar, lancer sa boutique en ligne et vendre sur WhatsApp.',
  author: {
    '@type': 'Organization',
    name: 'Nopalou',
    url: 'https://nopalou.com'
  },
  publisher: {
    '@type': 'Organization',
    name: 'Nopalou',
    logo: {
      '@type': 'ImageObject',
      url: 'https://nopalou.com/icons/icon-512.svg'
    }
  },
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': `${BASE}/guide-sourcing-revente`
  }
}

const JSON_LD_FAQ = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_SOURCING.map(f => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: f.a
    }
  }))
}

export default function GuideSourcingReventePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD_ARTICLE) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD_FAQ) }} />

      <main style={{ background: '#f8fafc', color: '#0f172a', minHeight: '100vh', padding: '40px 20px 80px', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <article style={{ maxWidth: 900, margin: '0 auto', background: '#ffffff', padding: '44px 36px', borderRadius: 24, border: '1px solid #cbd5e1', boxShadow: '0 10px 35px rgba(0,0,0,0.03)' }}>
          
          {/* HEADER */}
          <header style={{ marginBottom: 36, borderBottom: '1px solid #e2e8f0', paddingBottom: 28 }}>
            <span style={{
              background: '#fff7ed', color: '#C75B00', padding: '6px 16px',
              borderRadius: 20, fontSize: 13, fontWeight: 900, display: 'inline-flex', alignItems: 'center', gap: 6,
              border: '1px solid #fed7aa', marginBottom: 16
            }}>
              📦 Business &amp; Sourcing Sénégal 2026
            </span>
            <h1 style={{ fontSize: 'clamp(28px, 4.5vw, 40px)', fontWeight: 900, color: '#1C2B4A', margin: '0 0 16px', lineHeight: 1.2 }}>
              Comment Acheter sur Alibaba, AliExpress &amp; Shein et Revendre au Sénégal
            </h1>
            <p style={{ fontSize: 16.5, color: '#475569', margin: 0, lineHeight: 1.65 }}>
              Le guide complet pour lancer un commerce rentable à Dakar : de la commande auprès des usines chinoises jusqu'à l'encaissement par Wave et la livraison à domicile.
            </p>
          </header>

          {/* SOMMAIRE RAPIDE */}
          <nav style={{ background: '#f8fafc', padding: 24, borderRadius: 16, border: '1px solid #e2e8f0', marginBottom: 40 }}>
            <div style={{ fontWeight: 900, fontSize: 15, marginBottom: 12, color: '#1C2B4A' }}>Au programme de ce guide :</div>
            <ol style={{ margin: 0, paddingLeft: 20, color: '#C75B00', fontSize: 14.5, lineHeight: 1.8, fontWeight: 700 }}>
              <li>1. Comparatif des plateformes : Alibaba vs AliExpress vs Shein vs 1688</li>
              <li>2. Comment acheminer ses colis de Chine vers Dakar (Fret Aérien &amp; Maritime)</li>
              <li>3. Calculer sa marge nette et fixer ses prix en Francs CFA</li>
              <li>4. Pourquoi éviter Shopify et choisir Nopalou pour vendre au Sénégal</li>
              <li>5. Lancer sa vitrine en 2 minutes et vendre sur WhatsApp avec Wave &amp; OM</li>
            </ol>
          </nav>

          {/* SECTION 1 : COMPARATIF FOURNISSEURS */}
          <section style={{ marginBottom: 44 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#1C2B4A', marginBottom: 16 }}>
              1. Comparatif des Plateformes : Où Sourcer ses Produits ?
            </h2>
            <p style={{ fontSize: 15, color: '#334155', lineHeight: 1.7, marginBottom: 20 }}>
              Le choix de votre fournisseur dépend de votre budget de départ et des quantités que vous souhaitez commander :
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
              <div style={{ background: '#fff7ed', padding: 20, borderRadius: 14, border: '1.5px solid #fed7aa' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>🟠 Alibaba</div>
                <div style={{ fontWeight: 900, color: '#9a3412', fontSize: 15, marginBottom: 6 }}>Pour les Gros Volumes &amp; Grossistes</div>
                <p style={{ fontSize: 13, color: '#7c2d12', lineHeight: 1.5, margin: 0 }}>
                  Prix d'usine imbattables. Négociation directe avec les fabricants. Idéal pour les commandes de 50 à 500+ pièces.
                </p>
              </div>

              <div style={{ background: '#f0fdf4', padding: 20, borderRadius: 14, border: '1.5px solid #bbf7d0' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>🔴 AliExpress</div>
                <div style={{ fontWeight: 900, color: '#166534', fontSize: 15, marginBottom: 6 }}>Pour Démarrer Sans Risque (1 à 10 pièces)</div>
                <p style={{ fontSize: 13, color: '#14532d', lineHeight: 1.5, margin: 0 }}>
                  Achat unitaire sans minimum de commande. Parfait pour tester la demande des clients à Dakar avant d'investir gros.
                </p>
              </div>

              <div style={{ background: '#fdf4ff', padding: 20, borderRadius: 14, border: '1.5px solid #f5d0fe' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>👗 Shein</div>
                <div style={{ fontWeight: 900, color: '#86198f', fontSize: 15, marginBottom: 6 }}>Pour la Mode &amp; Prêt-à-Porter Féminin</div>
                <p style={{ fontSize: 13, color: '#701a75', lineHeight: 1.5, margin: 0 }}>
                  Robes, sacs, bijoux et ensembles tendance. Forte demande auprès de la clientèle dakaroise sur Instagram et WhatsApp.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 2 : TRANSPORT CHINE - DAKAR */}
          <section style={{ marginBottom: 44 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#1C2B4A', marginBottom: 16 }}>
              2. Transporter ses Marchandises de Chine vers Dakar
            </h2>
            <p style={{ fontSize: 15, color: '#334155', lineHeight: 1.7, marginBottom: 14 }}>
              Vous n'avez pas besoin de voyager en Chine ! Des dizaines d'agences de transit et de GP à Dakar gèrent l'acheminement complet :
            </p>
            <ul style={{ paddingLeft: 20, fontSize: 15, color: '#334155', lineHeight: 1.8, marginBottom: 16 }}>
              <li><strong>Fret Aérien (Cargo Express) :</strong> 7 à 12 jours. Tarif moyen entre 6 000 et 9 000 FCFA le kilo. Idéal pour les smartphones, montres, bijoux, mèches et vêtements légers.</li>
              <li><strong>Fret Maritime (Bateau Conteneur) :</strong> 35 à 45 jours. Facturé au mètre cube (CBM). Solution la plus économique pour les sacs, chaussures, électroménager et cosmétiques volumineux.</li>
            </ul>
            <div style={{ background: '#eff6ff', padding: 16, borderRadius: 12, borderLeft: '4px solid #3b82f6', fontSize: 13.5, color: '#1e40af' }}>
              💡 <strong>Astuce Logistique :</strong> Demandez à votre fournisseur d'expédier votre colis à l'adresse de l'entrepôt chinois de votre transitaire basé à Guangzhou ou Yiwu. Le transitaire s'occupe du dédouanement et vous livre à Dakar.
            </div>
          </section>

          {/* SECTION 3 : SHOPIFY VS NOPALOU POUR LA REVENTE */}
          <section style={{ marginBottom: 44 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#1C2B4A', marginBottom: 16 }}>
              3. Pourquoi Nopalou est l'Alternative N°1 à Shopify au Sénégal
            </h2>
            <p style={{ fontSize: 15, color: '#334155', lineHeight: 1.7, marginBottom: 20 }}>
              Vouloir lancer un site Shopify pour revendre ses articles Alibaba à Dakar est l'erreur la plus coûteuse des débutants :
            </p>

            <div style={{ overflowX: 'auto', background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', marginBottom: 20 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: 14, textAlign: 'left', color: '#475569' }}>Fonctionnalité</th>
                    <th style={{ padding: 14, textAlign: 'left', color: '#C75B00', background: '#fff7ed', fontWeight: 900 }}>🧡 Nopalou Sénégal</th>
                    <th style={{ padding: 14, textAlign: 'left', color: '#64748b' }}>Shopify / WooCommerce</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: 14, fontWeight: 700 }}>Abonnement mensuel</td>
                    <td style={{ padding: 14, fontWeight: 900, color: '#16a34a', background: '#fff7ed' }}>Dès 2 500 F (1 mois offert)</td>
                    <td style={{ padding: 14, color: '#dc2626' }}>29$ / mois (~18 000 FCFA)</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: 14, fontWeight: 700 }}>Paiement de l'outil</td>
                    <td style={{ padding: 14, fontWeight: 900, color: '#16a34a', background: '#fff7ed' }}>Wave &amp; Orange Money direct</td>
                    <td style={{ padding: 14, color: '#dc2626' }}>Carte Visa internationale ($)</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: 14, fontWeight: 700 }}>Paiement Client (Checkout)</td>
                    <td style={{ padding: 14, fontWeight: 900, color: '#16a34a', background: '#fff7ed' }}>Wave, OM, Cash (0% commission)</td>
                    <td style={{ padding: 14, color: '#dc2626' }}>Passerelles bancaires difficiles</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: 14, fontWeight: 700 }}>Vente WhatsApp</td>
                    <td style={{ padding: 14, fontWeight: 900, color: '#16a34a', background: '#fff7ed' }}>Commandes WhatsApp natives</td>
                    <td style={{ padding: 14, color: '#dc2626' }}>Plugins payants complexes</td>
                  </tr>
                  <tr>
                    <td style={{ padding: 14, fontWeight: 700 }}>Caisse Magasin (POS)</td>
                    <td style={{ padding: 14, fontWeight: 900, color: '#16a34a', background: '#fff7ed' }}>Caisse Offline incluse</td>
                    <td style={{ padding: 14, color: '#dc2626' }}>Matériel lourd payant</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* SECTION 4 : LANCER SA BOUTIQUE NOPALOU */}
          <section style={{ marginBottom: 44 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#1C2B4A', marginBottom: 16 }}>
              4. Mettre ses Produits en Ligne en 2 Minutes
            </h2>
            <p style={{ fontSize: 15, color: '#334155', lineHeight: 1.7, marginBottom: 16 }}>
              Dès que vos articles sont arrivés ou en cours d'acheminement :
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              <div style={{ background: '#f8fafc', padding: 18, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 900, color: '#C75B00', marginBottom: 6 }}>Étape 1 : Création</div>
                <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.5 }}>Créez votre boutique Nopalou avec votre numéro WhatsApp en 30 secondes.</div>
              </div>
              <div style={{ background: '#f8fafc', padding: 18, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 900, color: '#C75B00', marginBottom: 6 }}>Étape 2 : Catalogue</div>
                <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.5 }}>Téléchargez les photos Alibaba/Shein et fixez vos prix de vente en FCFA.</div>
              </div>
              <div style={{ background: '#f8fafc', padding: 18, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 900, color: '#C75B00', marginBottom: 6 }}>Étape 3 : Diffusion</div>
                <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.5 }}>Partagez votre lien dans votre statut WhatsApp, bio Instagram et TikTok.</div>
              </div>
            </div>
          </section>

          {/* FAQ SOURCING */}
          <section style={{ marginBottom: 44 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#1C2B4A', marginBottom: 20 }}>
              Questions Fréquentes sur le Sourcing &amp; la Revente
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {FAQ_SOURCING.map((f, idx) => (
                <details key={idx} style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: 14, border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                  <summary style={{ fontWeight: 800, fontSize: 15, color: '#0f172a', outline: 'none' }}>
                    {f.q}
                  </summary>
                  <p style={{ marginTop: 12, color: '#475569', fontSize: 14, lineHeight: 1.6, margin: '12px 0 0' }}>
                    {f.a}
                  </p>
                </details>
              ))}
            </div>
          </section>

          {/* CTA FINAL */}
          <div style={{
            background: 'linear-gradient(135deg, #1C2B4A 0%, #0d1728 100%)',
            borderRadius: 20, padding: 36, textAlign: 'center', color: '#ffffff'
          }}>
            <h3 style={{ fontSize: 24, fontWeight: 900, margin: '0 0 12px', color: '#ffffff' }}>
              Prêt à lancer votre boutique de revente à Dakar ?
            </h3>
            <p style={{ fontSize: 15, color: '#94a3b8', margin: '0 0 24px', maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }}>
              Bénéficiez de 30 jours offerts, 0% de commission sur vos ventes et encaissement direct Wave &amp; Orange Money.
            </p>
            <Link
              href="/creer-boutique"
              style={{
                background: 'linear-gradient(135deg, #FF6600 0%, #C75B00 100%)',
                color: '#ffffff', padding: '14px 32px', borderRadius: 24,
                fontSize: 16, fontWeight: 900, textDecoration: 'none',
                display: 'inline-flex', alignItems: 'center', gap: 8
              }}
            >
              <span>Créer ma boutique gratuitement (30j offerts)</span>
              <ArrowRight size={18} />
            </Link>
          </div>

        </article>
      </main>
    </>
  )
}
