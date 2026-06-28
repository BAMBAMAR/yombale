import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    (
      <div style={{
        width: 1080, height: 1920,
        display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(180deg, #1C2B4A 0%, #0f1d35 50%, #C75B00 100%)',
        fontFamily: 'system-ui, sans-serif',
        position: 'relative', overflow: 'hidden',
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
          display: 'flex', alignItems: 'center', gap: 20,
          padding: '80px 80px 0',
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: 18,
            background: '#C75B00',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 46, fontWeight: 900, color: '#fff',
          }}>N</div>
          <span style={{ fontSize: 52, fontWeight: 900, color: '#fff' }}>
            Nopa<span style={{ color: '#C75B00' }}>lou</span>
          </span>
        </div>

        {/* Tagline */}
        <p style={{
          fontSize: 28, color: '#94A3B8',
          padding: '20px 80px 0', margin: 0,
        }}>
          Comparateur de prix N°1 au Sénégal
        </p>

        {/* Contenu principal */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '0 80px',
        }}>
          <div style={{
            fontSize: 100, marginBottom: 32, display: 'flex',
          }}>🛒</div>

          <p style={{
            fontSize: 60, fontWeight: 900, color: '#fff',
            textAlign: 'center', margin: '0 0 24px', lineHeight: 1.15,
          }}>
            Économisez<br />jusqu'à 40%
          </p>

          <p style={{
            fontSize: 30, color: '#CBD5E1',
            textAlign: 'center', margin: 0, lineHeight: 1.5,
          }}>
            En comparant les prix avant<br />d'acheter à Dakar
          </p>

          {/* Stats */}
          <div style={{
            display: 'flex', gap: 0, marginTop: 64, width: '100%',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 20, overflow: 'hidden',
          }}>
            {[['3 000+', 'Produits'], ['9+', 'Marchands'], ['6h', 'Mise à jour']].map(([n, l], i) => (
              <div key={l} style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', padding: '32px 16px',
                borderRight: i < 2 ? '1px solid rgba(255,255,255,0.12)' : 'none',
                background: 'rgba(255,255,255,0.04)',
              }}>
                <span style={{ fontSize: 40, fontWeight: 900, color: '#C75B00' }}>{n}</span>
                <span style={{ fontSize: 18, color: '#94A3B8', marginTop: 6 }}>{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA bas */}
        <div style={{
          padding: '0 80px 120px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
        }}>
          <div style={{
            background: '#fff', borderRadius: 20,
            padding: '28px 80px',
            fontSize: 36, fontWeight: 900, color: '#C75B00',
            display: 'flex',
          }}>
            nopalou.com
          </div>
          <p style={{ fontSize: 22, color: 'rgba(255,255,255,0.5)', margin: 0, display: 'flex' }}>
            Gratuit · Sans inscription
          </p>
        </div>
      </div>
    ),
    { width: 1080, height: 1920 }
  )
}
