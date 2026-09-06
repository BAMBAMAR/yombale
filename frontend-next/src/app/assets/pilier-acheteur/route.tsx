import { ImageResponse } from 'next/og'

export const runtime = 'edge'

// Visuel Dédié Pilier 1 — Acheteur & Consommateur (Nopalou Identity, Maximum Sharpness)
export async function GET() {
  return new ImageResponse(
    (
      <div style={{
        width: 1080, height: 1350,
        display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(160deg, #FFFFFF 0%, #F8FAFC 50%, #FFF7ED 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        position: 'relative', color: '#1C2B4A',
        padding: 56, boxSizing: 'border-box',
        overflow: 'hidden',
      }}>
        {/* Bande de couleur Nopalou en haut */}
        <div style={{ height: 10, background: 'linear-gradient(90deg, #C75B00 0%, #1C2B4A 50%, #25D366 100%)', display: 'flex', position: 'absolute', top: 0, left: 0, right: 0 }} />

        {/* HEADER BRANDING NOPALOU */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <svg width="72" height="72" viewBox="0 0 512 512" style={{ display: 'block' }}>
              <defs>
                <linearGradient id="pilier1LogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FF7E22"/>
                  <stop offset="35%" stopColor="#EA580C"/>
                  <stop offset="70%" stopColor="#C75B00"/>
                  <stop offset="100%" stopColor="#9E3C00"/>
                </linearGradient>
              </defs>
              <rect x="26" y="26" width="460" height="460" rx="118" fill="url(#pilier1LogoGrad)"/>
              <path fillRule="evenodd" d="M120 108h272v296H120Z M324 108H188l136 198Z M188 404h136L188 206Z" fill="#FFFFFF"/>
            </svg>
            <span style={{ fontSize: 52, fontWeight: 900, color: '#1C2B4A', letterSpacing: -1, display: 'flex' }}>
              Nopa<span style={{ color: '#C75B00' }}>lou</span>
            </span>
          </div>
          <div style={{
            background: '#FFF7ED', border: '2.5px solid #C75B00',
            borderRadius: 30, padding: '12px 28px', fontSize: 18, fontWeight: 900, color: '#C75B00', display: 'flex',
          }}>
            🛒 PILIER 1 : ACHETEUR
          </div>
        </div>

        {/* HERO TITLE */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 40 }}>
          <span style={{ background: '#C75B00', color: '#FFFFFF', padding: '8px 24px', borderRadius: 20, fontSize: 16, fontWeight: 900, letterSpacing: 1.5, marginBottom: 14, display: 'flex' }}>
            100% GRATUIT &amp; SANS INSCRIPTION
          </span>
          <h1 style={{ fontSize: 52, fontWeight: 900, color: '#1C2B4A', margin: 0, lineHeight: 1.15 }}>
            Achetez au Meilleur Prix au Sénégal
          </h1>
          <p style={{ fontSize: 22, color: '#475569', fontWeight: 700, marginTop: 12, marginBottom: 0 }}>
            Comparez les grandes surfaces, boutiques spécialisées &amp; vendeurs de Dakar
          </p>
        </div>

        {/* CARDS DES FONCTIONNALITÉS HAUTE NETTETÉ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>

          {/* Feature 1 */}
          <div style={{
            background: '#FFFFFF', border: '3px solid #C75B00', borderRadius: 22, padding: 24,
            display: 'flex', alignItems: 'center', gap: 22,
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: 20, background: '#FFF7ED', border: '2px solid #C75B00',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, flexShrink: 0
            }}>🔍</div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontSize: 26, fontWeight: 900, color: '#C75B00' }}>Super-Comparateur Multi-Marchands</span>
              <span style={{ fontSize: 18, color: '#334155', fontWeight: 700, marginTop: 6, lineHeight: 1.45 }}>
                Auchan, Carrefour, Expat-Dakar, Boutiques Nopalou Pro : découvrez le prix le plus bas.
              </span>
            </div>
          </div>

          {/* Feature 2 */}
          <div style={{
            background: '#FFFFFF', border: '3px solid #25D366', borderRadius: 22, padding: 24,
            display: 'flex', alignItems: 'center', gap: 22,
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: 20, background: '#F0FDF4', border: '2px solid #25D366',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, flexShrink: 0
            }}>🤖</div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontSize: 26, fontWeight: 900, color: '#25D366' }}>Assistant Chatbot WhatsApp Meta 24/7</span>
              <span style={{ fontSize: 18, color: '#334155', fontWeight: 700, marginTop: 6, lineHeight: 1.45 }}>
                Recherchez, comparez et commandez vos produits directement sur WhatsApp sans app.
              </span>
            </div>
          </div>

          {/* Feature 3 */}
          <div style={{
            background: '#FFFFFF', border: '3px solid #1C2B4A', borderRadius: 22, padding: 24,
            display: 'flex', alignItems: 'center', gap: 22,
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: 20, background: '#F8FAFC', border: '2px solid #1C2B4A',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, flexShrink: 0
            }}>🔔</div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontSize: 26, fontWeight: 900, color: '#1C2B4A' }}>Alertes Prix &amp; Annonces Immo</span>
              <span style={{ fontSize: 18, color: '#334155', fontWeight: 700, marginTop: 6, lineHeight: 1.45 }}>
                Alertes automatiques lors des baisses de prix + accès aux logements &amp; télécom.
              </span>
            </div>
          </div>

          {/* Feature 4 */}
          <div style={{
            background: '#FFFFFF', border: '3px solid #C75B00', borderRadius: 22, padding: 24,
            display: 'flex', alignItems: 'center', gap: 22,
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: 20, background: '#FFF7ED', border: '2px solid #C75B00',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, flexShrink: 0
            }}>⚖️</div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontSize: 26, fontWeight: 900, color: '#1C2B4A' }}>Tableau Comparatif Côte à Côte</span>
              <span style={{ fontSize: 18, color: '#334155', fontWeight: 700, marginTop: 6, lineHeight: 1.45 }}>
                Comparez jusqu&apos;à 3 produits simultanément avec fiches techniques et stocks.
              </span>
            </div>
          </div>

        </div>

        {/* FOOTER CTA HAUTE VISIBILITÉ */}
        <div style={{
          background: '#1C2B4A', borderRadius: 24, padding: '24px 40px', marginTop: 24,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          border: '3px solid #C75B00',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 26, fontWeight: 900, color: '#FFFFFF' }}>Économisez sur vos achats dès maintenant</span>
            <span style={{ fontSize: 17, color: '#CBD5E1', fontWeight: 700, marginTop: 4 }}>100% Gratuit · Auchan · Carrefour · Boutiques Dakar</span>
          </div>
          <div style={{
            background: '#C75B00', color: '#FFFFFF', padding: '16px 36px', borderRadius: 16,
            fontSize: 26, fontWeight: 900, display: 'flex',
          }}>
            nopalou.com
          </div>
        </div>

      </div>
    ),
    { width: 1080, height: 1350 }
  )
}
