import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ShieldCheck, CheckCircle2, ArrowRight, XCircle, HelpCircle,
  Sparkles, DollarSign, Smartphone, MessageSquare, CreditCard,
  Layers, RefreshCw, AlertCircle
} from 'lucide-react'

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'

export const metadata: Metadata = {
  title: 'Nopalou vs Shopify au Sénégal (2026) : Comparatif Factuel & Prix',
  description: 'Quelle est la meilleure alternative à Shopify au Sénégal ? Comparatif factuel : prix en FCFA sans carte bancaire, encaissement Wave sans commission, commandes WhatsApp et caisse hors-ligne.',
  keywords: [
    'shopify sénégal',
    'alternative shopify sénégal',
    'shopify vs nopalou',
    'shopify prix sénégal',
    'créer boutique shopify dakar',
    'shopify wave sénégal',
    'shopify orange money',
    'meilleure plateforme ecommerce sénégal',
    'boutique en ligne sans carte bancaire',
    'avis shopify dakar'
  ],
  alternates: {
    canonical: `${BASE}/alternative-shopify-senegal`,
  },
  openGraph: {
    title: 'Nopalou vs Shopify au Sénégal : Le Comparatif Factuel',
    description: 'Pourquoi les commerçants sénégalais choisissent Nopalou face à Shopify. Tarifs en FCFA, Wave direct et zéro commission.',
    url: `${BASE}/alternative-shopify-senegal`,
    type: 'article',
  },
}

const FAQ_ITEMS = [
  {
    q: "Pourquoi Shopify est-il difficile à utiliser pour un commerçant au Sénégal ?",
    a: "Shopify exige une carte bancaire internationale pour payer l'abonnement en dollars (29$ à 299$/mois + frais de change bancaires). De plus, intégrer Wave et Orange Money sur Shopify nécessite des passerelles tierces complexes avec des frais de transaction élevés et des blocages de sécurité fréquents pour les comptes africains."
  },
  {
    q: "Qu'est-ce qui rend Nopalou plus adapté au marché sénégalais ?",
    a: "Nopalou est nativement pensé pour le Sénégal : facturation en FCFA (dès 2 500 FCFA/mois payables par Wave/OM), intégration WhatsApp native où se concluent 85% des ventes, encaissement Wave/OM sans commission et une caisse physique tactile qui continue à fonctionner même sans connexion Internet."
  },
  {
    q: "Puis-je migrer ma boutique Shopify existante vers Nopalou sans perdre mes produits ?",
    a: "Oui ! Nopalou intègre un outil de migration en 1 clic. Vous exportez simplement votre fichier 'products_export.csv' depuis votre administration Shopify et le déposez sur Nopalou : vos titres, photos, prix en FCFA et déclinaisons sont importés automatiquement en moins de 3 minutes."
  },
  {
    q: "Shopify propose-t-il un carnet de dettes et de gestion du crédit local ?",
    a: "Non. Shopify est conçu pour le paiement carte immédiat occidental. Nopalou intègre le carnet de dettes ('Bor') indispensable au commerce africain : suivi des dettes clients et relance en 1 clic sur WhatsApp avec lien de paiement Wave sécurisé."
  }
]

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

export default function AlternativeShopifyPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD_FAQ) }}
      />

      <main style={{ background: '#f8fafc', color: '#0f172a', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        
        {/* ── HERO COMPARATIF ── */}
        <section style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          padding: '70px 20px 90px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ maxWidth: 960, margin: '0 auto', position: 'relative', zIndex: 2 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(59,130,246,0.18)', color: '#93c5fd',
              padding: '6px 18px', borderRadius: 30, fontSize: 13, fontWeight: 800,
              marginBottom: 24, border: '1px solid rgba(59,130,246,0.35)',
              letterSpacing: '0.04em'
            }}>
              <Sparkles size={14} />
              <span>ÉTUDE COMPARATIVE INDÉPENDANTE • COMMERCE SÉNÉGAL 2026</span>
            </div>

            <h1 style={{
              fontSize: 'clamp(32px, 4.8vw, 54px)',
              fontWeight: 900,
              margin: '0 0 20px',
              lineHeight: 1.18,
              letterSpacing: '-0.03em'
            }}>
              Nopalou vs Shopify au Sénégal :<br />
              <span style={{ color: '#fed7aa' }}>Quelle solution choisir pour votre commerce ?</span>
            </h1>

            <p style={{
              fontSize: 'clamp(16px, 2.2vw, 19px)',
              color: '#94a3b8',
              maxWidth: 760,
              margin: '0 auto 36px',
              lineHeight: 1.6
            }}>
              Shopify est un géant mondial, mais est-il adapté au commerce réel à Dakar, Thiès ou Touba ?
              Découvrez une comparaison transparente des coûts, des moyens de paiement et de l'expérience client.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
              <Link
                href="/migration"
                style={{
                  background: '#C75B00',
                  color: '#ffffff',
                  padding: '15px 32px',
                  borderRadius: 12,
                  fontWeight: 800,
                  fontSize: 16,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  textDecoration: 'none',
                  boxShadow: '0 8px 24px rgba(199,91,0,0.4)'
                }}
              >
                <span>Migrer de Shopify vers Nopalou</span>
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/creer-boutique"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  color: '#ffffff',
                  padding: '15px 28px',
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
                <span>Tester Nopalou 30 jours offerts</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ── TABLEAU COMPARATIF DÉTAILLÉ ── */}
        <section style={{ maxWidth: 1060, margin: '-40px auto 70px', padding: '0 20px', position: 'relative', zIndex: 10 }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 20,
            boxShadow: '0 12px 35px rgba(15,23,42,0.08)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1.4fr 1fr 1fr',
              background: '#f8fafc',
              borderBottom: '2px solid #e2e8f0',
              padding: '20px 24px',
              fontWeight: 900,
              fontSize: 16
            }}>
              <span style={{ color: '#64748b' }}>Critères Clés</span>
              <span style={{ color: '#C75B00', textAlign: 'center' }}>🇸🇳 Nopalou</span>
              <span style={{ color: '#64748b', textAlign: 'center' }}>🌐 Shopify</span>
            </div>

            {[
              {
                critere: 'Tarif mensuel de base',
                detail: 'Prix réel sans frais cachés',
                nopalou: 'Dès 2 500 FCFA / mois',
                shopify: '29 $ US (~18 000 FCFA/mois)',
                nopalouOk: true,
                shopifyOk: false
              },
              {
                critere: 'Moyen de paiement de l\'abonnement',
                detail: 'Facilité d\'accès pour le commerçant',
                nopalou: 'Wave & Orange Money direct',
                shopify: 'Carte Bancaire Internationale (Visa/Mastercard)',
                nopalouOk: true,
                shopifyOk: false
              },
              {
                critere: 'Paiements clients (Wave, OM, Cash)',
                detail: 'Encaissement local',
                nopalou: 'Intégré nativement • 0% commission',
                shopify: 'Nécessite passerelle tierce + frais de transaction',
                nopalouOk: true,
                shopifyOk: false
              },
              {
                critere: 'Tunnel de commande WhatsApp',
                detail: 'Mode d\'achat préféré au Sénégal',
                nopalou: 'Panier converti en message WhatsApp propre',
                shopify: 'Nécessite des applications payantes supplémentaires',
                nopalouOk: true,
                shopifyOk: false
              },
              {
                critere: 'Caisse magasin (Point de Vente POS)',
                detail: 'Vente physique en boutique',
                nopalou: 'Inclus • Fonctionne 100% sans Internet',
                shopify: 'Nécessite abonnement POS Pro + matériel spécifique',
                nopalouOk: true,
                shopifyOk: false
              },
              {
                critere: 'Carnet de Dettes & Crédit ("Bor")',
                detail: 'Gestion des arriérés clients',
                nopalou: 'Inclus avec relance 1-clic lien Wave',
                shopify: 'Inexistant (conçu pour l\'Occident)',
                nopalouOk: true,
                shopifyOk: false
              },
              {
                critere: 'Prise en main & Complexité',
                detail: 'Temps nécessaire pour être en ligne',
                nopalou: 'Opérationnel en 30s sur smartphone',
                shopify: 'Configuration technique et thèmes complexes',
                nopalouOk: true,
                shopifyOk: false
              },
              {
                critere: 'Marché d\'applications & Plugins',
                detail: 'Écosystème mondial',
                nopalou: 'Tout est intégré de base',
                shopify: 'Des milliers d\'apps (la plupart payantes)',
                nopalouOk: true,
                shopifyOk: true
              }
            ].map((row, idx) => (
              <div
                key={idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.4fr 1fr 1fr',
                  padding: '20px 24px',
                  borderBottom: '1px solid #f1f5f9',
                  alignItems: 'center',
                  background: idx % 2 === 0 ? '#ffffff' : '#fafafa'
                }}
              >
                <div>
                  <strong style={{ fontSize: 15, color: '#1C2B4A', display: 'block' }}>{row.critere}</strong>
                  <span style={{ fontSize: 12, color: '#64748b' }}>{row.detail}</span>
                </div>
                <div style={{ textAlign: 'center', padding: '0 12px' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    color: '#0A5C36', fontWeight: 800, fontSize: 14,
                    background: 'rgba(10,92,54,0.08)', padding: '6px 12px', borderRadius: 8
                  }}>
                    <CheckCircle2 size={16} />
                    {row.nopalou}
                  </span>
                </div>
                <div style={{ textAlign: 'center', padding: '0 12px' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    color: row.shopifyOk ? '#334155' : '#dc2626', fontWeight: 600, fontSize: 13,
                    background: row.shopifyOk ? '#f1f5f9' : 'rgba(220,38,38,0.06)',
                    padding: '6px 12px', borderRadius: 8
                  }}>
                    {row.shopifyOk ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                    {row.shopify}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── SECTION EXPLICATION DÉTAILLÉE ── */}
        <section style={{ maxWidth: 880, margin: '0 auto 80px', padding: '0 20px' }}>
          <h2 style={{ fontSize: 26, fontWeight: 900, color: '#1C2B4A', margin: '0 0 20px' }}>
            Pourquoi Nopalou est la meilleure alternative à Shopify au Sénégal
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, color: '#475569', lineHeight: 1.7, fontSize: 15 }}>
            <p>
              Pour un commerçant basé à Dakar ou dans les régions du Sénégal, l'utilisation de plateformes e-commerce conçues pour les marchés américain ou européen pose trois obstacles majeurs :
            </p>
            <ol style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <li>
                <strong>La barrière de la devise et du paiement :</strong> Payer entre 29$ et 299$ chaque mois par carte bancaire internationale représente une charge financière lourde et soumise aux restrictions de devises. Avec Nopalou, vous payez votre abonnement en Francs CFA via Wave.
              </li>
              <li>
                <strong>Les habitudes d'achat locales :</strong> Au Sénégal, les acheteurs veulent voir les photos, poser des questions sur WhatsApp et payer à la livraison ou par transfert Wave. Un panier e-commerce classique génère souvent un fort taux d'abandon, alors que le tunnel WhatsApp de Nopalou convertit immédiatement.
              </li>
              <li>
                <strong>La réalité physique du commerce :</strong> La majorité des commerçants sénégalais vendent à la fois en ligne et dans une boutique physique ou un showroom. Avoir une caisse enregistreuse tactile qui ne plante pas lors des coupures de réseau est indispensable.
              </li>
            </ol>
          </div>
        </section>

        {/* ── FAQ ACCORDÉON SEO ── */}
        <section style={{ maxWidth: 840, margin: '0 auto 90px', padding: '0 20px' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: '#1C2B4A', margin: '0 0 12px' }}>
              Questions Fréquentes : Passer de Shopify à Nopalou
            </h2>
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
              Passez à l'action pour votre commerce
            </h3>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
              <Link href="/creer-boutique-en-ligne" style={{ background: '#ffffff', padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#1C2B4A', textDecoration: 'none', border: '1px solid #cbd5e1' }}>
                🛒 Créer ma boutique en ligne
              </Link>
              <Link href="/migration" style={{ background: '#ffffff', padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#1C2B4A', textDecoration: 'none', border: '1px solid #cbd5e1' }}>
                📦 Guide d'import Shopify en 1 clic
              </Link>
              <Link href="/logiciel-caisse-senegal" style={{ background: '#ffffff', padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#1C2B4A', textDecoration: 'none', border: '1px solid #cbd5e1' }}>
                📟 Caisse POS sans Internet
              </Link>
              <Link href="/vendre-sur-whatsapp" style={{ background: '#ffffff', padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#1C2B4A', textDecoration: 'none', border: '1px solid #cbd5e1' }}>
                💬 Commandes WhatsApp
              </Link>
            </div>
          </div>
        </section>

      </main>
    </>
  )
}
