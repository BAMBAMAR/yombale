import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    (
      <div style={{
        width: 1080, height: 1080,
        display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(160deg, #1C2B4A 0%, #0f1d35 60%, #1a1a2e 100%)',
        fontFamily: 'system-ui, sans-serif',
        position: 'relative',
        overflow: 'hidden',
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

        {/* Bande orange top */}
        <div style={{ height: 8, background: '#C75B00', display: 'flex' }} />

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16,
          padding: '40px 60px 0',
        }}>
          <div style={{
            width: 60, height: 60, borderRadius: 14,
            background: '#C75B00',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 34, fontWeight: 900, color: '#fff',
          }}>N</div>
          <span style={{ fontSize: 36, fontWeight: 900, color: '#fff' }}>
            Nopa<span style={{ color: '#C75B00' }}>lou</span>
          </span>
        </div>

        {/* Contenu central */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '0 60px',
        }}>
          {/* Badge */}
          <div style={{
            background: 'rgba(199,91,0,0.2)',
            border: '1.5px solid #C75B00',
            borderRadius: 40, padding: '10px 28px',
            fontSize: 20, color: '#C75B00', fontWeight: 700,
            marginBottom: 32, display: 'flex',
          }}>
            🔥 BON PLAN DU JOUR
          </div>

          <p style={{
            fontSize: 44, fontWeight: 900, color: '#fff',
            textAlign: 'center', margin: '0 0 16px', lineHeight: 1.2,
          }}>
            Comparez les prix avant<br />d'acheter à Dakar
          </p>

          <p style={{
            fontSize: 24, color: '#94A3B8',
            textAlign: 'center', margin: 0, lineHeight: 1.5,
          }}>
            Téléphones · TV · Électro · Mode · Immo
          </p>

          {/* CTA */}
          <div style={{
            marginTop: 48,
            background: '#C75B00',
            borderRadius: 16, padding: '20px 48px',
            fontSize: 26, fontWeight: 800, color: '#fff',
            display: 'flex',
          }}>
            nopalou.com
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '0 60px 40px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 18, color: '#475569' }}>
            #Nopalou #Dakar #Sénégal #PrixMoinsCher
          </span>
          <span style={{ fontSize: 18, color: '#C75B00', fontWeight: 700 }}>
            Gratuit · Sans inscription
          </span>
        </div>
      </div>
    ),
    { width: 1080, height: 1080 }
  )
}
