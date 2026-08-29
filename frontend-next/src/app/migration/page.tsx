import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Migration Shopify & WooCommerce vers Nopalou en 1-Clic',
  description: 'Quittez Shopify et ses frais cachés. Importez vos produits, photos et stocks sur Nopalou en 1 clic grâce à notre outil de migration. 1 mois offert.',
}

export default function MigrationLandingPage() {
  return (
    <main style={{ background: '#f8fafc', color: '#0f172a', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* ── HERO MIGRATION ── */}
      <section style={{
        background: '#ffffff',
        padding: '80px 20px',
        textAlign: 'center',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: '#eff6ff', color: '#2563eb', padding: '6px 16px', borderRadius: 20,
            fontSize: 13, fontWeight: 800, marginBottom: 20, border: '1px solid #bfdbfe'
          }}>
            📦 OUTIL D'IMPORT INTELLIGENT
          </span>

          <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 900, margin: '0 0 20px', lineHeight: 1.1 }}>
            Quittez Shopify en <span style={{ color: '#C75B00' }}>1-Clic.</span>
          </h1>

          <p style={{ fontSize: 'clamp(16px, 2.5vw, 20px)', color: '#64748b', margin: '0 auto 40px', lineHeight: 1.6 }}>
            Transférez tout votre catalogue (titres, prix, photos, descriptions, variantes et stocks) depuis <strong>Shopify, WooCommerce ou Excel</strong> vers Nopalou en moins de 3 minutes.
          </p>

          <Link href="/creer-boutique" style={{
            background: '#C75B00', color: '#ffffff',
            padding: '16px 32px', borderRadius: 30,
            fontSize: 17, fontWeight: 900, textDecoration: 'none',
            boxShadow: '0 8px 24px rgba(199,91,0,0.3)',
            display: 'inline-flex', alignItems: 'center', gap: 8
          }}>
            Commencer ma migration gratuite
          </Link>
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE ── */}
      <section style={{ maxWidth: 1000, margin: '60px auto', padding: '0 20px' }}>
        <h2 style={{ textAlign: 'center', fontSize: 32, fontWeight: 900, marginBottom: 40 }}>Comment fonctionne l'import magique ?</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 32 }}>
          <div style={{ background: '#fff', padding: 32, borderRadius: 20, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#C75B00', background: '#fff7ed', width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>1</div>
            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>Exportez votre catalogue</h3>
            <p style={{ color: '#475569', lineHeight: 1.6 }}>Allez sur votre espace admin Shopify ou WooCommerce et exportez vos produits au format CSV (Excel).</p>
          </div>
          
          <div style={{ background: '#fff', padding: 32, borderRadius: 20, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#C75B00', background: '#fff7ed', width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>2</div>
            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>Déposez le fichier</h3>
            <p style={{ color: '#475569', lineHeight: 1.6 }}>Créez votre boutique Nopalou et glissez-déposez le fichier dans l'onglet <strong>Import Intelligent</strong>.</p>
          </div>

          <div style={{ background: '#fff', padding: 32, borderRadius: 20, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#C75B00', background: '#fff7ed', width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>3</div>
            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>Vendez immédiatement</h3>
            <p style={{ color: '#475569', lineHeight: 1.6 }}>Notre IA récupère les images et formate les prix. Vous êtes prêt à encaisser par Wave ou Orange Money.</p>
          </div>
        </div>
      </section>

    </main>
  )
}
