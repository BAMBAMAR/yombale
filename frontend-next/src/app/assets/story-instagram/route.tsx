import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    (
      <div style={{
        width: 1080, height: 1920,
        display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(180deg, #1C2B4A 0%, #0f1d35 50%, #C75B00 100%)',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        position: 'relative', overflow: 'hidden',
        justifyContent: 'space-between',
      }}>
        {/* Cercles déco */}
        <div style={{
          position: 'absolute', right: -150, top: 200,
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(199,91,0,0.25) 0%, transparent 70%)',
          display: 'flex',
        }} />
        <div style={{
          position: 'absolute', left: -100, bottom: 300,
          width: 500, height: 500, borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
          display: 'flex',
        }} />

        {/* Logo top */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          padding: '80px 80px 0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{
              width: 76, height: 76, borderRadius: 18,
              background: '#C75B00',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="46" height="46" viewBox="0 0 512 512">
                <path
                  fillRule="evenodd"
                  d="M120 108h272v296H120Z M324 108H188l136 198Z M188 404h136L188 206Z"
                  fill="#FFFFFF"
                />
              </svg>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <span style={{ fontSize: 48, fontWeight: 900, color: '#fff', letterSpacing: -1 }}>Nopa</span>
              <span style={{ fontSize: 48, fontWeight: 900, color: '#C75B00', letterSpacing: -1 }}>lou</span>
            </div>
          </div>
          <span style={{ fontSize: 24, color: '#94A3B8', marginTop: 14, fontWeight: 700 }}>
            Super-Comparateur de prix N°1 au Sénégal
          </span>
        </div>

        {/* Contenu principal */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '0 80px',
        }}>
          <div style={{
            width: 110, height: 110, borderRadius: 32,
            background: 'rgba(199, 91, 0, 0.2)', border: '2px solid rgba(199, 91, 0, 0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 36,
          }}>
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#FFA94D" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
            </svg>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
            <span style={{
              fontSize: 64, fontWeight: 900, color: '#fff',
              textAlign: 'center', lineHeight: 1.15, letterSpacing: -1.5,
            }}>
              Économisez
            </span>
            <span style={{
              fontSize: 64, fontWeight: 900, color: '#FFA94D',
              textAlign: 'center', lineHeight: 1.15, letterSpacing: -1.5,
            }}>
              jusqu&apos;à 40%
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: 28, color: '#CBD5E1', textAlign: 'center', lineHeight: 1.4, fontWeight: 600 }}>
              En comparant les prix avant d&apos;acheter à Dakar
            </span>
          </div>

          {/* Stats */}
          <div style={{
            display: 'flex', gap: 0, marginTop: 56, width: '100%',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 24, overflow: 'hidden',
            background: 'rgba(15, 23, 42, 0.4)',
          }}>
            {[['3 000+', 'Produits'], ['9+', 'Marchands'], ['6h', 'Mise à jour']].map(([n, l], i) => (
              <div key={l} style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', padding: '32px 16px',
                borderRight: i < 2 ? '1px solid rgba(255,255,255,0.15)' : 'none',
              }}>
                <span style={{ fontSize: 40, fontWeight: 900, color: '#FFA94D' }}>{n}</span>
                <span style={{ fontSize: 18, color: '#94A3B8', marginTop: 6, fontWeight: 700 }}>{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA bas */}
        <div style={{
          padding: '0 80px 100px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
        }}>
          <div style={{
            background: '#ffffff', color: '#1C2B4A',
            padding: '20px 48px', borderRadius: 9999,
            fontSize: 26, fontWeight: 900, letterSpacing: 0.5,
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          }}>
            👉 nopalou.com
          </div>
          <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.8)', fontWeight: 700 }}>
            Trouvez les meilleurs prix en 1 clic
          </span>
        </div>
      </div>
    ),
    { width: 1080, height: 1920 }
  )
}
