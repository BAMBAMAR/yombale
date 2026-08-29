import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Nopalou Marchands | La plateforme e-commerce & POS N°1 au Sénégal',
  description: 'Gérez votre commerce comme un Pro. Boutique en ligne, Caisse Tactile (POS), Commandes WhatsApp et paiement direct Wave & Orange Money. 1 mois offert.',
  keywords: ['boutique en ligne', 'caisse pos', 'ecommerce sénégal', 'vendre sur whatsapp', 'nopalou marchands'],
}

export default function MarchandsLandingPage() {
  return (
    <main style={{ background: '#f8fafc', color: '#0f172a', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* ── HERO SECTION B2B SAAS ── */}
      <section style={{
        background: 'linear-gradient(135deg, #1C2B4A 0%, #0d1728 100%)',
        color: '#ffffff',
        padding: '80px 20px 100px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Cercles de fond pour effet "Glass/Glow" */}
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(199,91,0,0.15) 0%, transparent 70%)', borderRadius: '50%' }}></div>
        <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(10,92,54,0.15) 0%, transparent 70%)', borderRadius: '50%' }}></div>

        <div style={{ maxWidth: 1000, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(199,91,0,0.2)', color: '#fed7aa',
            padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 800,
            marginBottom: 20, border: '1px solid rgba(199,91,0,0.4)',
            letterSpacing: '0.05em'
          }}>
            🚀 L'INFRASTRUCTURE DE VOTRE COMMERCE
          </span>

          <h1 style={{
            fontSize: 'clamp(32px, 5vw, 56px)',
            fontWeight: 900,
            margin: '0 0 20px',
            lineHeight: 1.1,
            letterSpacing: '-0.02em'
          }}>
            La puissance de Shopify,<br/>
            la simplicité de <span style={{ color: '#25D366' }}>WhatsApp.</span>
          </h1>

          <p style={{
            fontSize: 'clamp(16px, 2.5vw, 20px)',
            color: '#94a3b8',
            maxWidth: 720,
            margin: '0 auto 40px',
            lineHeight: 1.6
          }}>
            Une plateforme tout-en-un pour les commerçants africains. 
            <strong> Vitrine en ligne, Caisse Tactile (POS) et intégration directe Wave & Orange Money.</strong> 
            Gérez tout, sans carte bancaire en dollars.
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/creer-boutique" style={{
              background: '#C75B00', color: '#ffffff',
              padding: '16px 32px', borderRadius: 30,
              fontSize: 17, fontWeight: 900, textDecoration: 'none',
              boxShadow: '0 8px 24px rgba(199,91,0,0.3)',
              transition: 'transform 0.2s',
              display: 'inline-flex', alignItems: 'center', gap: 8
            }}>
              Créer ma boutique (1 mois offert)
            </Link>
            <Link href="/admin/boutiques" style={{
              background: 'rgba(255,255,255,0.05)', color: '#ffffff',
              padding: '16px 32px', borderRadius: 30,
              fontSize: 17, fontWeight: 800, textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              transition: 'background 0.2s',
              display: 'inline-flex', alignItems: 'center', gap: 8
            }}>
              Voir la Démo Interactive
            </Link>
          </div>
          <div style={{ marginTop: 24, fontSize: 13, color: '#64748b', fontWeight: 600 }}>
            ✨ Déjà 800+ commerçants actifs à Dakar. Sans engagement.
          </div>
        </div>
      </section>

      {/* ── MOCKUP DASHBOARD VISUEL (Preuve Technologique) ── */}
      <section style={{ maxWidth: 1100, margin: '-60px auto 40px', padding: '0 20px', position: 'relative', zIndex: 3 }}>
        <div style={{
          background: '#ffffff',
          borderRadius: 24,
          padding: 8,
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden'
        }}>
          {/* Faux header mac */}
          <div style={{ display: 'flex', gap: 6, padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', borderRadius: '16px 16px 0 0' }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444' }}></div>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b' }}></div>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#10b981' }}></div>
          </div>
          {/* Contenu Dashboard (Mockup stylisé) */}
          <div style={{ display: 'flex', height: 400, background: '#f1f5f9', padding: 24, gap: 24 }}>
            {/* Sidebar fake */}
            <div style={{ width: 200, background: '#fff', borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ width: '80%', height: 20, background: '#e2e8f0', borderRadius: 4, marginBottom: 20 }}></div>
              {[1, 2, 3, 4, 5].map(i => <div key={i} style={{ width: '100%', height: 30, background: i === 1 ? '#e0e7ff' : '#f8fafc', borderRadius: 8 }}></div>)}
            </div>
            {/* Main content fake */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', gap: 16 }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ flex: 1, height: 100, background: '#fff', borderRadius: 16, padding: 16, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <div style={{ width: 40, height: 40, background: i === 1 ? '#dcfce7' : i === 2 ? '#fff7ed' : '#e0e7ff', borderRadius: 8, marginBottom: 12 }}></div>
                    <div style={{ width: '60%', height: 16, background: '#e2e8f0', borderRadius: 4 }}></div>
                  </div>
                ))}
              </div>
              <div style={{ flex: 1, background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                 <div style={{ width: '30%', height: 24, background: '#e2e8f0', borderRadius: 4, marginBottom: 24 }}></div>
                 <div style={{ width: '100%', height: '60%', background: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)', borderRadius: 8 }}></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3 PILIERS SAAS ── */}
      <section style={{ maxWidth: 1200, margin: '80px auto', padding: '0 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 900, color: '#0f172a', marginBottom: 12 }}>
            Tout ce dont un commerçant a besoin
          </h2>
          <p style={{ fontSize: 18, color: '#64748b', maxWidth: 600, margin: '0 auto' }}>
            Nopalou remplace vos carnets de dettes, vos fichiers Excel et vos anciennes applications par une seule plateforme unifiée.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32 }}>
          {/* Pilier 1 */}
          <div style={{ background: '#ffffff', padding: 32, borderRadius: 24, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
            <div style={{ width: 60, height: 60, background: '#fff7ed', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, marginBottom: 20 }}>
              🏪
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 900, marginBottom: 12 }}>Boutique Taf Taf</h3>
            <p style={{ color: '#475569', fontSize: 15, lineHeight: 1.6, marginBottom: 20 }}>
              Créez votre vitrine e-commerce en 30 secondes. Ajoutez vos produits, obtenez un lien web professionnel et recevez les commandes directement sur WhatsApp.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#334155', fontSize: 14, fontWeight: 600 }}>
              <li style={{ marginBottom: 8 }}>✅ Import depuis Shopify / Excel</li>
              <li style={{ marginBottom: 8 }}>✅ Optimisé pour le mobile</li>
              <li>✅ Trafic gratuit via notre comparateur</li>
            </ul>
          </div>

          {/* Pilier 2 */}
          <div style={{ background: '#ffffff', padding: 32, borderRadius: 24, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
            <div style={{ width: 60, height: 60, background: '#f0fdf4', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, marginBottom: 20 }}>
              🖥️
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 900, marginBottom: 12 }}>Caisse POS Tactile</h3>
            <p style={{ color: '#475569', fontSize: 15, lineHeight: 1.6, marginBottom: 20 }}>
              Gérez les ventes de votre magasin physique. Mode hors-ligne sans coupure internet, scan par caméra ou douchette, et émission de reçus/factures PDF OHADA.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#334155', fontSize: 14, fontWeight: 600 }}>
              <li style={{ marginBottom: 8 }}>✅ Mode Hors-Ligne (PWA)</li>
              <li style={{ marginBottom: 8 }}>✅ Factures avec NINEA & RCCM</li>
              <li>✅ Impression QR Codes</li>
            </ul>
          </div>

          {/* Pilier 3 */}
          <div style={{ background: '#ffffff', padding: 32, borderRadius: 24, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
            <div style={{ width: 60, height: 60, background: '#eff6ff', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, marginBottom: 20 }}>
              💸
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 900, marginBottom: 12 }}>Wave & Orange Money</h3>
            <p style={{ color: '#475569', fontSize: 15, lineHeight: 1.6, marginBottom: 20 }}>
              Oubliez les cartes bancaires et les comptes Stripe bloqués. Enaissez l'argent directement sur votre numéro Wave ou Orange Money, sans intermédiaire.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#334155', fontSize: 14, fontWeight: 600 }}>
              <li style={{ marginBottom: 8 }}>✅ 0% de commission sur vos ventes</li>
              <li style={{ marginBottom: 8 }}>✅ L'argent arrive instantanément</li>
              <li>✅ Carnet de dettes client intégré</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── BANIERE TARIFS ── */}
      <section style={{ maxWidth: 1000, margin: '0 auto 80px', padding: '0 20px' }}>
        <div style={{ background: 'linear-gradient(135deg, #FFEDD5 0%, #FFF7ED 100%)', borderRadius: 24, padding: 40, border: '1px solid #fed7aa', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
          <div>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: '#9a3412', margin: '0 0 10px' }}>Commencez avec 0 FCFA</h2>
            <p style={{ fontSize: 16, color: '#9a3412', margin: 0, maxWidth: 500 }}>
              Testez toute la plateforme pendant 30 jours sans entrer de carte de crédit. Ensuite, nos forfaits (Taf Taf, Pro, Business) s'adaptent à la taille de votre commerce.
            </p>
          </div>
          <Link href="/tarifs-boutique" style={{ background: '#ea580c', color: '#fff', padding: '14px 28px', borderRadius: 20, fontSize: 15, fontWeight: 800, textDecoration: 'none' }}>
            Voir la grille tarifaire →
          </Link>
        </div>
      </section>

    </main>
  )
}
