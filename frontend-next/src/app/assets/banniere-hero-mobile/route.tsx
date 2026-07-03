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
        fontFamily: 'system-ui, sans-serif',
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
          height: 6, background: '#C75B00', display: 'flex',
        }} />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 60px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 14,
              background: '#C75B00',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 36, fontWeight: 900, color: '#fff',
            }}>N</div>
            <span style={{ fontSize: 44, fontWeight: 900, color: '#fff', letterSpacing: -2 }}>
              Nopa<span style={{ color: '#C75B00' }}>lou</span>
            </span>
          </div>

          <p style={{
            fontSize: 52, fontWeight: 900, color: '#fff',
            margin: '0 0 20px', textAlign: 'center', lineHeight: 1.15,
          }}>
            Comparez avant d&apos;acheter
          </p>
          <p style={{
            fontSize: 24, color: '#CBD5E1', margin: 0, textAlign: 'center', lineHeight: 1.5,
          }}>
            Produits · Immobilier · Télécom<br />Vendez sur WhatsApp
          </p>

          <div style={{
            marginTop: 48,
            background: '#C75B00',
            borderRadius: 16, padding: '20px 52px',
            fontSize: 26, fontWeight: 800, color: '#fff',
            display: 'flex',
          }}>
            Voir les prix
          </div>
        </div>
      </div>
    ),
    { width: 750, height: 1000 }
  )
}
