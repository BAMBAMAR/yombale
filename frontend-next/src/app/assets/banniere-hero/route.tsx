import { ImageResponse } from 'next/og'

export const runtime = 'edge'

// Bannière hero page d'accueil — desktop 1920x600
export async function GET() {
  return new ImageResponse(
    (
      <div style={{
        width: 1920, height: 600,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #1C2B4A 0%, #0f1d35 100%)',
        fontFamily: 'system-ui, sans-serif',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', left: -100, top: -100,
          width: 500, height: 500, borderRadius: '50%',
          background: 'rgba(199,91,0,0.15)', display: 'flex',
        }} />
        <div style={{
          position: 'absolute', right: -80, bottom: -80,
          width: 420, height: 420, borderRadius: '50%',
          background: 'rgba(199,91,0,0.12)', display: 'flex',
        }} />
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: 5, background: '#C75B00', display: 'flex',
        }} />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
            <div style={{
              width: 72, height: 72, borderRadius: 16,
              background: '#C75B00',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 42, fontWeight: 900, color: '#fff',
            }}>N</div>
            <span style={{ fontSize: 56, fontWeight: 900, color: '#fff', letterSpacing: -2 }}>
              Nopa<span style={{ color: '#C75B00' }}>lou</span>
            </span>
          </div>

          <p style={{
            fontSize: 48, fontWeight: 900, color: '#fff',
            margin: '0 0 16px', textAlign: 'center',
          }}>
            Comparez avant d&apos;acheter
          </p>
          <p style={{
            fontSize: 24, color: '#CBD5E1', margin: 0, textAlign: 'center',
          }}>
            Produits · Immobilier · Forfaits télécom — vendez directement sur WhatsApp
          </p>

          <div style={{
            marginTop: 36,
            background: '#C75B00',
            borderRadius: 14, padding: '16px 44px',
            fontSize: 24, fontWeight: 800, color: '#fff',
            display: 'flex',
          }}>
            Voir les prix
          </div>
        </div>
      </div>
    ),
    { width: 1920, height: 600 }
  )
}
