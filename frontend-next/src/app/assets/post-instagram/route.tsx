import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    (
      <div style={{
        width: 1080, height: 1080,
        display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(160deg, #1C2B4A 0%, #0f1d35 60%, #1a1a2e 100%)',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        position: 'relative',
        overflow: 'hidden',
        justifyContent: 'space-between',
      }}>
        {/* Cercles déco */}
        <div style={{
          position: 'absolute', right: -100, top: -100,
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(199,91,0,0.3) 0%, transparent 70%)',
          display: 'flex',
        }} />
        <div style={{
          position: 'absolute', left: -80, bottom: -80,
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(199,91,0,0.2) 0%, transparent 70%)',
          display: 'flex',
        }} />

        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          {/* Bande orange top */}
          <div style={{ height: 10, background: '#C75B00', width: '100%', display: 'flex' }} />

          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16,
            padding: '40px 60px 0',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 14,
              background: '#C75B00',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="34" height="34" viewBox="0 0 512 512">
                <path
                  fillRule="evenodd"
                  d="M120 108h272v296H120Z M324 108H188l136 198Z M188 404h136L188 206Z"
                  fill="#FFFFFF"
                />
              </svg>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <span style={{ fontSize: 38, fontWeight: 900, color: '#fff', letterSpacing: -1 }}>Nopa</span>
              <span style={{ fontSize: 38, fontWeight: 900, color: '#C75B00', letterSpacing: -1 }}>lou</span>
            </div>
          </div>
        </div>

        {/* Contenu central */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '0 60px',
        }}>
          {/* Badge */}
          <div style={{
            background: 'rgba(199,91,0,0.2)',
            border: '1.5px solid #C75B00',
            borderRadius: 9999, padding: '10px 28px',
            fontSize: 18, color: '#FFA94D', fontWeight: 800,
            marginBottom: 32, display: 'flex', letterSpacing: 0.5,
          }}>
            ⚡ BON PLAN &amp; COMPARATEUR DU JOUR
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 18 }}>
            <span style={{
              fontSize: 48, fontWeight: 900, color: '#fff',
              textAlign: 'center', lineHeight: 1.15, letterSpacing: -1.2,
            }}>
              Comparez les prix avant
            </span>
            <span style={{
              fontSize: 48, fontWeight: 900, color: '#FFA94D',
              textAlign: 'center', lineHeight: 1.15, letterSpacing: -1.2,
            }}>
              d&apos;acheter à Dakar
            </span>
          </div>

          <span style={{
            fontSize: 24, color: '#94A3B8',
            textAlign: 'center', lineHeight: 1.5, fontWeight: 600,
          }}>
            Téléphones · TV · Électroménager · Mode · Immobilier
          </span>

          {/* CTA */}
          <div style={{
            marginTop: 44,
            background: '#C75B00',
            borderRadius: 9999, padding: '18px 48px',
            fontSize: 26, fontWeight: 900, color: '#fff',
            display: 'flex', letterSpacing: 0.5,
            boxShadow: '0 8px 24px rgba(199,91,0,0.4)',
          }}>
            👉 nopalou.com
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '0 60px 40px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 18, color: '#64748B', fontWeight: 600 }}>
            #Nopalou #Dakar #Sénégal #PrixMoinsCher
          </span>
          <span style={{ fontSize: 18, color: '#FFA94D', fontWeight: 800 }}>
            Gratuit · Sans engagement
          </span>
        </div>
      </div>
    ),
    { width: 1080, height: 1080 }
  )
}
