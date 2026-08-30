import type { Metadata } from 'next'
import Link from 'next/link'
import {
  UploadCloud, FileSpreadsheet, Layers, ShieldCheck, CheckCircle2,
  ArrowRight, Sparkles, HelpCircle, RefreshCw, Smartphone, Clock,
  FileCheck, Database, Zap
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Migration Shopify & Excel vers Nopalou en 1 Clic | Zéro Perte de Données',
  description: 'Quittez Shopify et ses frais en dollars. Transférez tout votre catalogue (titres, photos, prix FCFA, stocks, clients) sur Nopalou en moins de 3 minutes. Service d\'accompagnement gratuit.',
  keywords: [
    'boutique shopify connexion sénégal',
    'boutique shopify prix sénégal',
    'boutique shopify avis dakar',
    'exemple boutique shopify dropshipping dakar',
    'gérer ma boutique shopify',
    'migration shopify vers nopalou',
    'importer catalogue excel boutique',
    'alternative shopify sénégal wave',
    'importer produits woocommerce dakar',
    'migration e-commerce sénégal',
    'nopalou migration'
  ],
  openGraph: {
    title: 'Passez à Nopalou sans recommencer votre boutique.',
    description: 'Transférez vos produits, photos et stocks depuis Shopify, WooCommerce ou Excel en 1 clic. 1 mois offert.',
    url: 'https://nopalou.com/migration',
    type: 'website',
  },
}

const MIGRATION_FAQ = [
  {
    q: "Quelles plateformes et formats de fichiers puis-je importer ?",
    a: "Nopalou importe automatiquement les exports Shopify (fichier products_export.csv), WooCommerce, PrestaShop, ainsi que n'importe quel tableau Excel (.xlsx, .csv) contenant vos noms de produits, prix, descriptions et photos."
  },
  {
    q: "Mes photos de produits sont-elles automatiquement récupérées ?",
    a: "Oui ! Si votre fichier contient des liens vers des images (comme dans l'export Shopify ou WooCommerce), notre moteur télécharge et optimise automatiquement vos images pour qu'elles s'affichent ultra-rapidement sur mobile à Dakar."
  },
  {
    q: "Mes variantes (tailles, couleurs, pointures) sont-elles conservées ?",
    a: "Absolument. Si vous vendez des vêtements (S, M, L, XL) ou des chaussures (38, 39, 40, 41), toutes les déclinaisons de stock et de prix sont fidèlement reproduites sur votre nouvelle boutique Nopalou."
  },
  {
    q: "Puis-je également importer mon carnet de clients et leurs dettes ?",
    a: "Oui, dans l'onglet 'Carnet Clients & Dettes', vous pouvez importer un fichier CSV avec vos contacts, leurs numéros de téléphone et les soldes restants dus pour pouvoir les relancer immédiatement par WhatsApp."
  },
  {
    q: "Que faire si je n'arrive pas à exporter mon fichier tout seul ?",
    a: "Notre service de conciergerie s'occupe de tout pour vous, gratuitement ! Envoyez simplement vos fichiers ou accès par WhatsApp à notre équipe technique, nous configurons votre boutique clé en main sous 24h."
  }
]

export default function MigrationLandingPage() {
  return (
    <main style={{ background: '#f8fafc', color: '#0f172a', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* ── 1. HERO MIGRATION EXPRESS ── */}
      <section style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        color: '#ffffff',
        padding: '70px 20px 110px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: 550, height: 550, background: 'radial-gradient(circle, rgba(199,91,0,0.18) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1000, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(59,130,246,0.18)', color: '#93c5fd',
            padding: '6px 18px', borderRadius: 30, fontSize: 13, fontWeight: 800,
            marginBottom: 24, border: '1px solid rgba(59,130,246,0.35)',
            letterSpacing: '0.04em'
          }}>
            <RefreshCw size={14} style={{ color: '#60a5fa' }} />
            <span>IMPORT INTELLIGENT MULTI-PLATEFORMES &bull; EN MOINS DE 3 MINUTES</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(32px, 5vw, 56px)',
            fontWeight: 900,
            margin: '0 0 20px',
            lineHeight: 1.15,
            letterSpacing: '-0.03em'
          }}>
            Passez à Nopalou sans <br/>
            recommencer <span style={{ color: '#C75B00' }}>votre boutique.</span>
          </h1>

          <p style={{
            fontSize: 'clamp(16px, 2.4vw, 20px)',
            color: '#94a3b8',
            maxWidth: 760,
            margin: '0 auto 36px',
            lineHeight: 1.6
          }}>
            Quittez les abonnements en dollars de Shopify et les fichiers Excel dispersés. 
            <strong> Transférez vos articles, prix, photos, stocks et carnet de clients en 1 clic.</strong>
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
            <Link href="/creer-boutique" style={{
              background: 'linear-gradient(135deg, #FF6600 0%, #C75B00 100%)',
              color: '#ffffff',
              padding: '16px 36px', borderRadius: 30,
              fontSize: 17, fontWeight: 900, textDecoration: 'none',
              boxShadow: '0 10px 30px rgba(199,91,0,0.4)',
              display: 'inline-flex', alignItems: 'center', gap: 10
            }}>
              <span>Lancer ma migration gratuite</span>
              <ArrowRight size={18} />
            </Link>

            <a href="https://wa.me/221708717942?text=Bonjour,%20je%20souhaite%20migrer%20ma%20boutique%20sur%20Nopalou" target="_blank" rel="noopener noreferrer" style={{
              background: 'rgba(255,255,255,0.08)',
              color: '#ffffff',
              padding: '16px 30px', borderRadius: 30,
              fontSize: 16, fontWeight: 800, textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
              display: 'inline-flex', alignItems: 'center', gap: 8
            }}>
              <span>Assistance Migration par WhatsApp</span>
              <span>💬</span>
            </a>
          </div>

          <div style={{
            marginTop: 32, display: 'flex', justifyContent: 'center', alignItems: 'center',
            gap: 24, flexWrap: 'wrap', fontSize: 13, color: '#94a3b8', fontWeight: 700
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={16} style={{ color: '#60a5fa' }} />
              <span>Zéro interruption de votre activité</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={16} style={{ color: '#60a5fa' }} />
              <span>Images &amp; Variantes conservées</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={16} style={{ color: '#60a5fa' }} />
              <span>Accompagnement 100% offert</span>
            </div>
          </div>

        </div>
      </section>

      {/* ── 2. CE QUE VOUS POUVEZ IMPORTER EN 1 CLIC ── */}
      <section style={{ maxWidth: 1100, margin: '-60px auto 70px', padding: '0 20px', position: 'relative', zIndex: 3 }}>
        <div style={{
          background: '#ffffff',
          borderRadius: 24,
          padding: '36px 30px',
          boxShadow: '0 25px 60px -12px rgba(15, 23, 42, 0.12)',
          border: '1px solid #cbd5e1'
        }}>
          <h2 style={{ fontSize: 22, fontWeight: 900, textAlign: 'center', color: '#0f172a', marginBottom: 28 }}>
            Toutes vos données transférées sans aucune ressaisie
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
            <div style={{ background: '#f8fafc', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📦</div>
              <div style={{ fontWeight: 900, fontSize: 15, color: '#0f172a' }}>Articles &amp; Variantes</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Titres, tailles, couleurs, pointures et descriptions complètes.</div>
            </div>

            <div style={{ background: '#f8fafc', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🖼️</div>
              <div style={{ fontWeight: 900, fontSize: 15, color: '#0f172a' }}>Photos &amp; Galeries HD</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Récupération automatique de toutes les images produits hébergées.</div>
            </div>

            <div style={{ background: '#f8fafc', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>💰</div>
              <div style={{ fontWeight: 900, fontSize: 15, color: '#0f172a' }}>Prix FCFA &amp; Stocks</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Conversion propre des tarifs et quantités en stock par magasin.</div>
            </div>

            <div style={{ background: '#f8fafc', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📒</div>
              <div style={{ fontWeight: 900, fontSize: 15, color: '#0f172a' }}>Clients &amp; Dettes</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Importation du carnet de clients avec numéros WhatsApp et reliquats.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. COMMENT FONCTIONNE L'IMPORT EN 3 ÉTAPES ── */}
      <section style={{ maxWidth: 1100, margin: '0 auto 100px', padding: '0 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 50 }}>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 900, color: '#1C2B4A', margin: 0 }}>
            Comment fonctionne l'import magique ?
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 28 }}>
          
          <div style={{ background: '#ffffff', padding: 32, borderRadius: 20, border: '1px solid #e2e8f0' }}>
            <div style={{ width: 44, height: 44, background: '#eff6ff', color: '#2563eb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, marginBottom: 16 }}>
              1
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>Exportez votre catalogue</h3>
            <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
              Téléchargez votre fichier CSV depuis Shopify, WooCommerce ou enregistrez simplement votre fichier Excel avec vos articles.
            </p>
          </div>

          <div style={{ background: '#ffffff', padding: 32, borderRadius: 20, border: '1px solid #e2e8f0' }}>
            <div style={{ width: 44, height: 44, background: '#eff6ff', color: '#2563eb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, marginBottom: 16 }}>
              2
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>Glissez-déposez le fichier</h3>
            <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
              Dans votre espace Nopalou, ouvrez l'onglet 'Import' et déposez votre fichier. Notre système analyse les colonnes automatiquement.
            </p>
          </div>

          <div style={{ background: '#ffffff', padding: 32, borderRadius: 20, border: '1px solid #e2e8f0' }}>
            <div style={{ width: 44, height: 44, background: '#eff6ff', color: '#2563eb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, marginBottom: 16 }}>
              3
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>Vendez immédiatement</h3>
            <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
              Votre boutique en ligne est instantanément prête. Vos clients peuvent commander sur WhatsApp et vous encaissez par Wave.
            </p>
          </div>

        </div>
      </section>

      {/* ── 4. CONCIERGERIE & ACCOMPAGNEMENT SUR MESURE ── */}
      <section style={{ maxWidth: 1000, margin: '0 auto 100px', padding: '0 20px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
          borderRadius: 24,
          padding: '36px 32px',
          border: '1.5px solid #fed7aa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 24
        }}>
          <div style={{ maxWidth: 580 }}>
            <span style={{ background: '#ea580c', color: '#fff', fontSize: 11, fontWeight: 900, padding: '3px 10px', borderRadius: 10, textTransform: 'uppercase' }}>
              Service Conciergerie VIP
            </span>
            <h3 style={{ fontSize: 22, fontWeight: 900, color: '#9a3412', margin: '10px 0 8px' }}>
              Vous préférez qu'on s'occupe de la migration pour vous ?
            </h3>
            <p style={{ fontSize: 14, color: '#7c2d12', margin: 0, lineHeight: 1.6 }}>
              Envoyez vos photos, listes de prix ou fichiers par WhatsApp. Notre équipe technique configure l'intégralité de votre boutique gratuitement sous 24h.
            </p>
          </div>

          <a
            href="https://wa.me/221708717942?text=Bonjour,%20pouvez-vous%20m%27aider%20%C3%A0%20migrer%20mes%20produits%20sur%20Nopalou%20?"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: '#25D366', color: '#ffffff',
              padding: '14px 28px', borderRadius: 20,
              fontSize: 15, fontWeight: 900, textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: 8,
              boxShadow: '0 4px 14px rgba(37,211,102,0.3)', flexShrink: 0
            }}
          >
            <span>💬 Confier ma migration par WhatsApp</span>
          </a>
        </div>
      </section>

      {/* ── 5. FAQ MIGRATION ── */}
      <section style={{ maxWidth: 900, margin: '0 auto 100px', padding: '0 20px' }}>
        <h2 style={{ fontSize: 28, fontWeight: 900, textAlign: 'center', color: '#1C2B4A', marginBottom: 36 }}>
          Questions Fréquentes sur la Migration
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {MIGRATION_FAQ.map((item, idx) => (
            <details
              key={idx}
              style={{
                background: '#ffffff',
                borderRadius: 16,
                padding: '18px 24px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                cursor: 'pointer'
              }}
            >
              <summary style={{ fontWeight: 800, fontSize: 16, color: '#0f172a', outline: 'none' }}>
                {item.q}
              </summary>
              <p style={{ marginTop: 14, color: '#475569', fontSize: 14.5, lineHeight: 1.6, margin: '14px 0 0' }}>
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* ── 6. BANNIÈRE CTA MIGRATION ── */}
      <section style={{ maxWidth: 1040, margin: '0 auto 80px', padding: '0 20px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #1C2B4A 0%, #0d1728 100%)',
          borderRadius: 28,
          padding: '50px 30px',
          textAlign: 'center',
          color: '#ffffff',
          boxShadow: '0 20px 50px rgba(28,43,74,0.3)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <h2 style={{ fontSize: 'clamp(28px, 4.5vw, 40px)', fontWeight: 900, margin: '0 0 16px', lineHeight: 1.2 }}>
            Faites des économies dès ce mois-ci.
          </h2>
          <p style={{ fontSize: 16, color: '#94a3b8', maxWidth: 600, margin: '0 auto 32px', lineHeight: 1.6 }}>
            Importez votre boutique en 3 minutes et commencez avec 30 jours 100% offerts sans carte bancaire.
          </p>
          <Link href="/creer-boutique" style={{
            background: 'linear-gradient(135deg, #FF6600 0%, #C75B00 100%)',
            color: '#ffffff',
            padding: '16px 36px', borderRadius: 30,
            fontSize: 17, fontWeight: 900, textDecoration: 'none',
            boxShadow: '0 10px 25px rgba(199,91,0,0.4)',
            display: 'inline-flex', alignItems: 'center', gap: 8
          }}>
            <span>Démarrer ma migration maintenant</span>
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

    </main>
  )
}
