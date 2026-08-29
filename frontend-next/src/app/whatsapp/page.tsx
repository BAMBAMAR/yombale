import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Vendre sur WhatsApp avec Nopalou | Commandes & Dettes Automatisées',
  description: 'Transformez WhatsApp en machine de vente. Commandes directes, rappels de dettes (Bor), assistant IA 24h/24 et bilan de fin de journée pour commerçants.',
}

export default function WhatsappLandingPage() {
  return (
    <main style={{ background: '#f8fafc', color: '#0f172a', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* ── HERO WHATSAPP ── */}
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
            💬 ASSISTANT WHATSAPP NOPALOU
          </span>

          <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 900, margin: '0 0 20px', lineHeight: 1.1 }}>
            Vendez, même pendant que vous <span style={{ color: '#C75B00' }}>dormez.</span>
          </h1>

          <p style={{ fontSize: 'clamp(16px, 2.5vw, 20px)', color: '#64748b', margin: '0 auto 40px', lineHeight: 1.6 }}>
            Nopalou connecte directement votre boutique à WhatsApp. Recevez des commandes pré-remplies, relancez vos clients pour leurs dettes (Bor), et demandez votre bilan du jour par un simple message.
          </p>

          <Link href="/creer-boutique" style={{
            background: '#C75B00', color: '#ffffff',
            padding: '16px 32px', borderRadius: 30,
            fontSize: 17, fontWeight: 900, textDecoration: 'none',
            boxShadow: '0 8px 24px rgba(199,91,0,0.3)',
            display: 'inline-flex', alignItems: 'center', gap: 8
          }}>
            Activer mon Assistant WhatsApp (1 mois offert)
          </Link>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ maxWidth: 1000, margin: '60px auto', padding: '0 20px' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 32 }}>
          <div style={{ background: '#fff', padding: 32, borderRadius: 20, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: 40, marginBottom: 20 }}>🛒</div>
            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>Commandes structurées</h3>
            <p style={{ color: '#475569', lineHeight: 1.6 }}>Finis les longs échanges ! Vos clients remplissent leur panier sur votre lien Nopalou et vous envoient la commande parfaitement détaillée sur votre WhatsApp.</p>
          </div>
          
          <div style={{ background: '#fff', padding: 32, borderRadius: 20, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: 40, marginBottom: 20 }}>📒</div>
            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>Relances de Dettes</h3>
            <p style={{ color: '#475569', lineHeight: 1.6 }}>Gérez les crédits de vos clients. Depuis le dashboard, envoyez en 1 clic un message WhatsApp poli de relance contenant votre lien Wave ou Orange Money.</p>
          </div>

          <div style={{ background: '#fff', padding: 32, borderRadius: 20, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: 40, marginBottom: 20 }}>📈</div>
            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>Bilan par SMS/WA</h3>
            <p style={{ color: '#475569', lineHeight: 1.6 }}>Envoyez "Bilan" au bot Nopalou à la fin de la journée pour recevoir instantanément votre chiffre d'affaires Cash, Wave et OM.</p>
          </div>
        </div>
      </section>

    </main>
  )
}
