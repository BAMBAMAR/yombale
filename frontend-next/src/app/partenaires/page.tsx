import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Programme Partenaires & Apporteurs d\'Affaires | Nopalou',
  description: 'Devenez Apporteur d\'Affaires Nopalou. Gagnez jusqu\'à 20% de commission récurrente sur chaque abonnement SaaS (Boutique & POS) vendu. Inscrivez-vous maintenant.',
}

export default function PartenairesLandingPage() {
  return (
    <main style={{ background: '#f8fafc', color: '#0f172a', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif', paddingBottom: 80 }}>
      
      {/* ── HERO SECTION B2B PARTENAIRES ── */}
      <section style={{
        background: 'linear-gradient(135deg, #1C2B4A 0%, #1e1b4b 100%)',
        color: '#ffffff',
        padding: '80px 20px 100px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: '10%', left: '-5%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)', borderRadius: '50%' }}></div>
        <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%)', borderRadius: '50%' }}></div>

        <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(139,92,246,0.2)', color: '#ddd6fe',
            padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 800,
            marginBottom: 20, border: '1px solid rgba(139,92,246,0.4)',
            letterSpacing: '0.05em'
          }}>
            🤝 PROGRAMME APPORTEURS D'AFFAIRES
          </span>

          <h1 style={{
            fontSize: 'clamp(32px, 5vw, 56px)',
            fontWeight: 900,
            margin: '0 0 20px',
            lineHeight: 1.1,
            letterSpacing: '-0.02em'
          }}>
            Générez des revenus passifs en recommandant <span style={{ color: '#C75B00' }}>Nopalou.</span>
          </h1>

          <p style={{
            fontSize: 'clamp(16px, 2.5vw, 20px)',
            color: '#cbd5e1',
            maxWidth: 720,
            margin: '0 auto 40px',
            lineHeight: 1.6
          }}>
            Vous connaissez des commerçants ou des agences à Dakar ? Présentez-leur Nopalou et touchez 
            <strong> 20% de commission récurrente chaque mois</strong>, tant que leur boutique reste active.
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/compte/apporteur/inscription" style={{
              background: '#C75B00', color: '#ffffff',
              padding: '16px 32px', borderRadius: 30,
              fontSize: 17, fontWeight: 900, textDecoration: 'none',
              boxShadow: '0 8px 24px rgba(199,91,0,0.3)',
              transition: 'transform 0.2s',
              display: 'inline-flex', alignItems: 'center', gap: 8
            }}>
              Devenir Apporteur d'Affaires
            </Link>
          </div>
          <div style={{ marginTop: 24, fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>
            💰 Paiements garantis par Wave ou Orange Money, le 5 de chaque mois.
          </div>
        </div>
      </section>

      {/* ── ARGUMENTS & OUTILS ── */}
      <section style={{ maxWidth: 1100, margin: '-40px auto 40px', padding: '0 20px', position: 'relative', zIndex: 3 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          
          <div style={{ background: '#ffffff', padding: 32, borderRadius: 24, border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📈</div>
            <h3 style={{ fontSize: 20, fontWeight: 900, marginBottom: 12 }}>20% de revenus récurrents</h3>
            <p style={{ color: '#475569', lineHeight: 1.6, fontSize: 15 }}>
              Ce n'est pas un gain unique (one-shot). Vous touchez votre commission <strong>chaque mois</strong> sur l'abonnement SaaS (Pro ou Business) du commerçant, à vie !
            </p>
          </div>

          <div style={{ background: '#ffffff', padding: 32, borderRadius: 24, border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🎨</div>
            <h3 style={{ fontSize: 20, fontWeight: 900, marginBottom: 12 }}>Un Kit de Vente fourni</h3>
            <p style={{ color: '#475569', lineHeight: 1.6, fontSize: 15 }}>
              Dès votre inscription, accédez à notre <strong>Générateur de Visuels</strong>. Créez des affiches personnalisées avec votre nom et code promo, et publiez directement sur WhatsApp.
            </p>
          </div>

          <div style={{ background: '#ffffff', padding: 32, borderRadius: 24, border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⚡</div>
            <h3 style={{ fontSize: 20, fontWeight: 900, marginBottom: 12 }}>Vente ultra-simple</h3>
            <p style={{ color: '#475569', lineHeight: 1.6, fontSize: 15 }}>
              Nopalou se vend tout seul : le 1er mois est <strong>100% offert</strong> sans carte bancaire pour le marchand. Il vous suffit de partager votre lien d'affiliation.
            </p>
          </div>

        </div>
      </section>

      {/* ── APERÇU DU KIT DE COMM (Preuve Technologique) ── */}
      <section style={{ maxWidth: 1000, margin: '80px auto', padding: '0 20px' }}>
        <div style={{ background: '#FFF7ED', borderRadius: 24, padding: 40, border: '1px solid #FFEDD5', textAlign: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#C75B00', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Outil Exclusif
          </span>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 900, color: '#1C2B4A', margin: '12px 0 24px' }}>
            Accédez au Générateur de Kit Commercial Nopalou
          </h2>
          <p style={{ fontSize: 16, color: '#6B5E52', maxWidth: 600, margin: '0 auto 32px', lineHeight: 1.6 }}>
            En tant que partenaire certifié, vous débloquez notre outil de Sales Enablement en ligne. Générez vos affiches promotionnelles, copiez nos scripts de vente WhatsApp, et suivez vos conversions en temps réel.
          </p>
          
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
             {/* Faux visuel représentant le KitComClient */}
             <div style={{ width: '100%', maxWidth: 700, height: 300, background: '#ffffff', borderRadius: 16, boxShadow: '0 20px 40px rgba(0,0,0,0.1)', border: '1px solid #fed7aa', display: 'flex', overflow: 'hidden' }}>
                <div style={{ width: 200, background: '#f8fafc', borderRight: '1px solid #e2e8f0', padding: 16 }}>
                  <div style={{ height: 16, background: '#cbd5e1', borderRadius: 4, width: '80%', marginBottom: 24 }}></div>
                  <div style={{ height: 12, background: '#e2e8f0', borderRadius: 4, width: '100%', marginBottom: 12 }}></div>
                  <div style={{ height: 12, background: '#e2e8f0', borderRadius: 4, width: '90%', marginBottom: 12 }}></div>
                  <div style={{ height: 12, background: '#e2e8f0', borderRadius: 4, width: '95%' }}></div>
                </div>
                <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ height: 24, background: '#ffedd5', borderRadius: 4, width: '40%' }}></div>
                  <div style={{ height: 140, background: '#f1f5f9', borderRadius: 8, width: '100%', border: '2px dashed #cbd5e1' }}></div>
                  <div style={{ height: 36, background: '#C75B00', borderRadius: 8, width: '30%', alignSelf: 'flex-end' }}></div>
                </div>
             </div>
          </div>
        </div>
      </section>

    </main>
  )
}
