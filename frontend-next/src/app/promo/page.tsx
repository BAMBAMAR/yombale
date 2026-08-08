import Link from 'next/link'

// Page Promotionnelle B2B (Landing Page hautement animée)
// Accessible via /promo
// Remplace le besoin d'une vidéo en créant une expérience visuelle dynamique.

export default async function PromoPage() {
  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'
  let s = { plan_decouverte_prix: 2500, plan_pro_prix: 5000, plan_business_prix: 10000 }
  
  try {
    const res = await fetch(`${BACKEND}/api/settings/public`, { cache: 'no-store' })
    if (res.ok) {
      const data = await res.json()
      s.plan_decouverte_prix = Number(data.plan_decouverte_prix) || 2500
      s.plan_pro_prix = Number(data.plan_pro_prix) || 5000
      s.plan_business_prix = Number(data.plan_business_prix) || 10000
    }
  } catch (e) {
    // fallback
  }

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', background: '#0f172a', color: '#fff', minHeight: '100vh', overflowX: 'hidden' }}>
      
      {/* CSS Animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseGlow {
          0% { box-shadow: 0 0 0 0 rgba(199, 91, 0, 0.7); }
          70% { box-shadow: 0 0 0 20px rgba(199, 91, 0, 0); }
          100% { box-shadow: 0 0 0 0 rgba(199, 91, 0, 0); }
        }
        @keyframes slideIn {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-fade-up { animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        .delay-1 { animation-delay: 0.2s; }
        .delay-2 { animation-delay: 0.4s; }
        .delay-3 { animation-delay: 0.6s; }
        .delay-4 { animation-delay: 0.8s; }
        .pulse-btn { animation: pulseGlow 2s infinite; }
        .price-card:hover { transform: translateY(-10px); transition: 0.3s; }
      `}} />

      {/* HEADER */}
      <header style={{ padding: '24px 32px', display: 'flex', justifyContent: 'center' }}>
        <h1 style={{ color: '#C75B00', fontSize: 32, fontWeight: 900, margin: 0, letterSpacing: '-1px' }}>
          NOPALOU<span style={{color: '#fff'}}>.</span>
        </h1>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
        
        {/* HERO SECTION */}
        <div className="animate-fade-up">
          <div style={{ display: 'inline-block', background: 'rgba(199,91,0,0.15)', border: '1px solid #C75B00', color: '#ffedd5', padding: '6px 16px', borderRadius: 30, fontSize: 14, fontWeight: 700, marginBottom: 24 }}>
            🔥 Offre Spéciale Vendeurs
          </div>
          <h2 style={{ fontSize: 'clamp(40px, 6vw, 64px)', fontWeight: 900, lineHeight: 1.1, margin: '0 0 24px' }}>
            Transformez votre WhatsApp<br />
            <span style={{ color: '#C75B00' }}>en Machine à Vendre.</span>
          </h2>
          <p style={{ fontSize: 'clamp(18px, 2vw, 22px)', color: '#94a3b8', maxWidth: 700, margin: '0 auto 48px', lineHeight: 1.5 }}>
            Zéro pourcent de commission sur vos ventes. Une boutique en ligne à vos couleurs en 2 minutes. Commandes directes sur votre WhatsApp.
          </p>
        </div>

        {/* PRICING CARDS */}
        <div className="animate-fade-up delay-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginTop: 60, marginBottom: 60 }}>
          
          {/* Card 1 */}
          <div className="price-card" style={{ background: '#1e293b', borderRadius: 24, padding: 40, border: '1px solid #334155', textAlign: 'left', transition: 'all 0.3s' }}>
            <h3 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 16px', color: '#e2e8f0' }}>Boutique Taf Taf</h3>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 24 }}>
              <span style={{ fontSize: 40, fontWeight: 900, color: '#fff' }}>{s.plan_decouverte_prix.toLocaleString()}</span>
              <span style={{ color: '#94a3b8', fontWeight: 600 }}>FCFA / mois</span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#cbd5e1', fontSize: 16, lineHeight: 1.8 }}>
              <li>✓ Commandes WhatsApp</li>
              <li>✓ Catalogue illimité</li>
              <li>✓ 0% de commission</li>
            </ul>
          </div>

          {/* Card 2 - Highlight */}
          <div className="price-card" style={{ background: 'linear-gradient(145deg, #C75B00 0%, #9a4700 100%)', borderRadius: 24, padding: 40, border: '1px solid #ffedd5', textAlign: 'left', transform: 'scale(1.05)', position: 'relative', zIndex: 10 }}>
            <div style={{ position: 'absolute', top: -15, right: 30, background: '#fff', color: '#C75B00', padding: '4px 12px', borderRadius: 20, fontWeight: 900, fontSize: 12, textTransform: 'uppercase' }}>Le plus populaire</div>
            <h3 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 16px', color: '#fff' }}>Boutique Pro</h3>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 24 }}>
              <span style={{ fontSize: 40, fontWeight: 900, color: '#fff' }}>{s.plan_pro_prix.toLocaleString()}</span>
              <span style={{ color: '#ffedd5', fontWeight: 600 }}>FCFA / mois</span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#fff', fontSize: 16, lineHeight: 1.8 }}>
              <li>✓ Tout de Taf Taf</li>
              <li>✓ Référencement prioritaire</li>
              <li>✓ Caisse enregistreuse POS</li>
            </ul>
          </div>

          {/* Card 3 */}
          <div className="price-card" style={{ background: '#1e293b', borderRadius: 24, padding: 40, border: '1px solid #334155', textAlign: 'left', transition: 'all 0.3s' }}>
            <h3 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 16px', color: '#e2e8f0' }}>Boutique Business</h3>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 24 }}>
              <span style={{ fontSize: 40, fontWeight: 900, color: '#fff' }}>{s.plan_business_prix.toLocaleString()}</span>
              <span style={{ color: '#94a3b8', fontWeight: 600 }}>FCFA / mois</span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#cbd5e1', fontSize: 16, lineHeight: 1.8 }}>
              <li>✓ Multi-caissiers & Multi-stocks</li>
              <li>✓ API & Webhooks ERP</li>
              <li>✓ Relance paniers abandonnés</li>
            </ul>
          </div>

        </div>

        {/* CTA OFFER */}
        <div className="animate-fade-up delay-2" style={{ background: '#ffffff', borderRadius: 32, padding: '60px 20px', color: '#0f172a', marginTop: 80, position: 'relative', overflow: 'hidden' }}>
          <h2 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 900, margin: '0 0 20px' }}>
            Votre Premier Mois est <span style={{ color: '#C75B00' }}>100% Offert.</span>
          </h2>
          <p style={{ fontSize: 20, color: '#475569', marginBottom: 40, fontWeight: 500 }}>
            Aucun risque. Pas d'engagement. Créez votre boutique en 2 minutes.
          </p>
          <Link href="/creer-boutique" className="pulse-btn" style={{ 
            display: 'inline-block', 
            background: '#C75B00', 
            color: '#fff', 
            fontSize: 22, 
            fontWeight: 800, 
            padding: '20px 48px', 
            borderRadius: 50, 
            textDecoration: 'none',
            transition: 'background 0.3s'
          }}>
            LANCER MA BOUTIQUE
          </Link>
        </div>

      </main>
    </div>
  )
}
