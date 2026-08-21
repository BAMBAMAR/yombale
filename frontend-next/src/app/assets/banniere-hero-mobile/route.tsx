import { ImageResponse } from 'next/og'

export const runtime = 'edge'

// Bannière hero page d'accueil — mobile 750x1000
export async function GET() {
  return new ImageResponse(
    (
      <div style={{
        width: 750, height: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(160deg, #1C2B4A 0%, #0f1d35 60%, #1a1a2e 100%)',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', right: -80, top: -80,
          width: 360, height: 360, borderRadius: '50%',
          background: 'rgba(199,91,0,0.2)', display: 'flex',
        }} />
        <div style={{
          position: 'absolute', left: -60, bottom: -60,
          width: 300, height: 300, borderRadius: '50%',
          background: 'rgba(199,91,0,0.15)', display: 'flex',
        }} />
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: 8, background: '#C75B00', display: 'flex',
        }} />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 60px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
            <div style={{
              width: 60, height: 60, borderRadius: 14,
              background: '#C75B00',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="36" height="36" viewBox="0 0 512 512">
                <path
                  fillRule="evenodd"
                  d="M120 108h272v296H120Z M324 108H188l136 198Z M188 404h136L188 206Z"
                  fill="#FFFFFF"
                />
              </svg>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <span style={{ fontSize: 44, fontWeight: 900, color: '#fff', letterSpacing: -1 }}>Nopa</span>
              <span style={{ fontSize: 44, fontWeight: 900, color: '#C75B00', letterSpacing: -1 }}>lou</span>
            </div>
          </div>

          <span style={{
            fontSize: 48, fontWeight: 900, color: '#fff',
            margin: '0 0 16px', textAlign: 'center', lineHeight: 1.15, letterSpacing: -1,
          }}>
            Comparez avant d&apos;acheter
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 24, color: '#CBD5E1', textAlign: 'center', fontWeight: 600 }}>
              Produits · Immobilier · Télécom
            </span>
            <span style={{ fontSize: 24, color: '#FFA94D', textAlign: 'center', fontWeight: 700 }}>
              Vendez en direct sur WhatsApp
            </span>
          </div>

          <div style={{
            marginTop: 48,
            background: '#C75B00',
            borderRadius: 9999, padding: '18px 52px',
            fontSize: 24, fontWeight: 900, color: '#fff',
            display: 'flex', letterSpacing: 0.5,
            boxShadow: '0 8px 24px rgba(199,91,0,0.35)',
          }}>
            Voir les prix
          </div>
        </div>
      </div>
    ),
    { width: 750, height: 1000 }
  )
}
