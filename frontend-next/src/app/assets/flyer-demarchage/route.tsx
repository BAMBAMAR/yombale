import { ImageResponse } from 'next/og'

export const runtime = 'edge'

// Flyer A5 imprimable — démarchage terrain commerçants
export async function GET() {
  return new ImageResponse(
    (
      <div style={{
        width: 1240, height: 1748,
        display: 'flex', flexDirection: 'column',
        background: '#ffffff',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        position: 'relative',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          {/* Bande orange top */}
          <div style={{ height: 16, background: '#C75B00', width: '100%', display: 'flex' }} />

          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 20,
            padding: '56px 80px 0',
          }}>
            <svg width="80" height="80" viewBox="0 0 512 512" style={{ display: 'block' }}>
              <defs>
                <linearGradient id="flyerDemarchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FF7E22"/>
                  <stop offset="35%" stopColor="#EA580C"/>
                  <stop offset="70%" stopColor="#C75B00"/>
                  <stop offset="100%" stopColor="#9E3C00"/>
                </linearGradient>
              </defs>
              <rect x="26" y="26" width="460" height="460" rx="118" fill="url(#flyerDemarchGrad)"/>
              <path fillRule="evenodd" d="M120 108h272v296H120Z M324 108H188l136 198Z M188 404h136L188 206Z" fill="#FFFFFF"/>
            </svg>
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <span style={{ fontSize: 52, fontWeight: 900, color: '#1C2B4A', letterSpacing: -1 }}>Nopa</span>
              <span style={{ fontSize: 52, fontWeight: 900, color: '#C75B00', letterSpacing: -1 }}>lou</span>
            </div>
          </div>

          {/* Titre accroche sans <br/> */}
          <div style={{ padding: '48px 80px 0', display: 'flex', flexDirection: 'column' }}>
            <span style={{
              fontSize: 52, fontWeight: 900, color: '#1C2B4A',
              lineHeight: 1.15, letterSpacing: -1.2,
            }}>
              Votre boutique visible.
            </span>
            <span style={{
              fontSize: 52, fontWeight: 900, color: '#C75B00',
              lineHeight: 1.15, letterSpacing: -1.2, marginTop: 4,
            }}>
              Vos clients sur WhatsApp.
            </span>
            <p style={{ fontSize: 26, color: '#64748B', marginTop: 20, lineHeight: 1.5, fontWeight: 600 }}>
              Rejoignez Nopalou, le super-comparateur de prix et caisse POS N°1 au Sénégal
            </p>
          </div>

          {/* Avantages */}
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 22,
            padding: '48px 80px 0',
          }}>
            {[
              '🎁 30 jours d\'essai Formule Pro 100% offerts',
              '⚡ Caisse POS Tactile (3 Scanners : Caméra, Cloud <100ms, Douchette USB)',
              '📒 Carnet de Dettes Client & Relance WhatsApp 1-Clic',
              '🏷️ Générateur de Stickers Codes-Barres EAN-13 GS1 Modulo 10',
              '🛍️ Commandes clients reçues directement sur WhatsApp sans commission',
              '🌐 Démo Commerciale POS interactive en 1-clic : nopalou.com/demo',
            ].map(txt => (
              <div key={txt} style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: '#FFF7ED', border: '2px solid #C75B00',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C75B00" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <span style={{ fontSize: 25, color: '#1C2B4A', fontWeight: 800 }}>{txt}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bloc CTA + contact */}
        <div style={{
          margin: '0 80px 56px',
          background: '#1C2B4A',
          borderRadius: 24, padding: '40px 48px',
          display: 'flex', flexDirection: 'column', gap: 10,
          border: '2px solid #C75B00',
          boxShadow: '0 12px 30px rgba(15, 23, 42, 0.25)',
        }}>
          <span style={{ fontSize: 26, color: '#fff', fontWeight: 800 }}>
            Découvrez la Démo POS &amp; Créez votre boutique gratuitement
          </span>
          <span style={{ fontSize: 32, color: '#C75B00', fontWeight: 900, letterSpacing: -0.5 }}>
            nopalou.com/demo · nopalou.com/creer-boutique
          </span>
          <span style={{ fontSize: 20, color: '#94A3B8', marginTop: 4 }}>
            Ou contactez-nous directement sur WhatsApp (+221 70 871 79 42)
          </span>
        </div>
      </div>
    ),
    { width: 1240, height: 1748 }
  )
}
