import { ImageResponse } from 'next/og'

export const runtime = 'edge'

// Post/flyer recrutement apporteurs d'affaires — programme commission 10%
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
          <div style={{
            background: 'rgba(199,91,0,0.2)',
            border: '1.5px solid #C75B00',
            borderRadius: 40, padding: '10px 28px',
            fontSize: 20, color: '#C75B00', fontWeight: 700,
            marginBottom: 32, display: 'flex',
          }}>
            💼 PROGRAMME APPORTEUR D&apos;AFFAIRES
          </div>

          <p style={{
            fontSize: 88, fontWeight: 900, color: '#fff',
            textAlign: 'center', margin: '0 0 8px', lineHeight: 1,
          }}>
            20%
          </p>
          <p style={{
            fontSize: 32, fontWeight: 800, color: '#fff',
            textAlign: 'center', margin: '0 0 32px',
          }}>
            de commission récurrente
          </p>

          <p style={{
            fontSize: 26, color: '#94A3B8',
            textAlign: 'center', margin: 0, lineHeight: 1.6, maxWidth: 780,
          }}>
            Présentez Nopalou aux commerçants de votre réseau.<br />
            Chaque boutique Pro ou Business que vous recrutez<br />
            vous rapporte 20% de son abonnement, chaque mois.
          </p>

          <div style={{
            marginTop: 48,
            background: '#C75B00',
            borderRadius: 16, padding: '20px 48px',
            fontSize: 26, fontWeight: 800, color: '#fff',
            display: 'flex',
          }}>
            nopalou.com/apporteur
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '0 60px 40px',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
        }}>
          <span style={{ fontSize: 18, color: '#C75B00', fontWeight: 700 }}>
            Aucun investissement · Paiement mensuel · Sans limite de recrutement
          </span>
        </div>
      </div>
    ),
    { width: 1080, height: 1080 }
  )
}
