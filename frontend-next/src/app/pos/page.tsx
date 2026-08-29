import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Nopalou POS | La Caisse Enregistreuse Tactile pour le Sénégal',
  description: 'Transformez votre boutique physique avec Nopalou POS. Fonctionne hors-ligne, 3 scanners inclus, carnets de dettes et édition de reçus. Idéal pour Dakar.',
}

export default function PosLandingPage() {
  return (
    <main style={{ background: '#f8fafc', color: '#0f172a', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* ── HERO POS ── */}
      <section style={{
        background: '#ffffff',
        padding: '80px 20px',
        textAlign: 'center',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: '#f0fdf4', color: '#16a34a', padding: '6px 16px', borderRadius: 20,
            fontSize: 13, fontWeight: 800, marginBottom: 20, border: '1px solid #bbf7d0'
          }}>
            🖥️ CAISSE ENREGISTREUSE NOPALOU
          </span>

          <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 900, margin: '0 0 20px', lineHeight: 1.1 }}>
            Votre commerce physique, <span style={{ color: '#C75B00' }}>digitalisé.</span>
          </h1>

          <p style={{ fontSize: 'clamp(16px, 2.5vw, 20px)', color: '#64748b', margin: '0 auto 40px', lineHeight: 1.6 }}>
            Vendez au comptoir même sans connexion Internet. Scan par caméra, factures OHADA, carnet de dettes et synchronisation en temps réel avec votre vitrine en ligne.
          </p>

          <Link href="/creer-boutique?plan=pro" style={{
            background: '#C75B00', color: '#ffffff',
            padding: '16px 32px', borderRadius: 30,
            fontSize: 17, fontWeight: 900, textDecoration: 'none',
            boxShadow: '0 8px 24px rgba(199,91,0,0.3)',
            display: 'inline-flex', alignItems: 'center', gap: 8
          }}>
            Découvrir Nopalou POS (1 mois offert)
          </Link>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ maxWidth: 1000, margin: '60px auto', padding: '0 20px' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 32 }}>
          <div style={{ background: '#fff', padding: 32, borderRadius: 20, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: 40, marginBottom: 20 }}>📶</div>
            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>Fonctionne sans Internet</h3>
            <p style={{ color: '#475569', lineHeight: 1.6 }}>Grâce à notre technologie PWA Offline-First, continuez à encaisser vos clients même lors d'une coupure de courant ou de réseau Senelec/Sonatel.</p>
          </div>
          
          <div style={{ background: '#fff', padding: 32, borderRadius: 20, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: 40, marginBottom: 20 }}>📸</div>
            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>3 Scanners Inclus</h3>
            <p style={{ color: '#475569', lineHeight: 1.6 }}>Scannez les codes-barres avec l'appareil photo de votre smartphone, une douchette USB/Bluetooth, ou l'application Cloud Sync &lt;100ms.</p>
          </div>

          <div style={{ background: '#fff', padding: 32, borderRadius: 20, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: 40, marginBottom: 20 }}>📄</div>
            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>Facturation OHADA</h3>
            <p style={{ color: '#475569', lineHeight: 1.6 }}>Éditez des devis et des reçus PDF professionnels, conformes NINEA & RCCM, et partagez-les en un clic sur WhatsApp.</p>
          </div>
        </div>
      </section>

    </main>
  )
}
