import { ImageResponse } from 'next/og'

export const runtime = 'edge'

// Post/flyer recrutement apporteurs d'affaires — programme commission 20% récurrente (Nopalou Identity & High Sharpness)
export async function GET() {
  return new ImageResponse(
    (
      <div style={{
        width: 1080, height: 1080,
        display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(160deg, #FFFFFF 0%, #F8FAFC 55%, #FFF7ED 100%)',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        position: 'relative',
        overflow: 'hidden',
        padding: 52,
        boxSizing: 'border-box',
      }}>
        {/* Top Accent Line */}
        <div style={{ height: 10, background: 'linear-gradient(90deg, #C75B00 0%, #7C3AED 50%, #1C2B4A 100%)', display: 'flex', position: 'absolute', top: 0, left: 0, right: 0 }} />

        {/* Header Branding */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 18,
          marginBottom: 28,
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: '#C75B00',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 44, fontWeight: 900, color: '#FFFFFF',
          }}>N</div>
          <span style={{ fontSize: 50, fontWeight: 900, color: '#1C2B4A', letterSpacing: -1.5 }}>
            Nopa<span style={{ color: '#C75B00' }}>lou</span>
          </span>
        </div>

        {/* Contenu central */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '0 20px',
        }}>
          <div style={{
            background: '#F3E8FF',
            border: '2px solid #7C3AED',
            borderRadius: 9999, padding: '10px 32px',
            fontSize: 20, color: '#7C3AED', fontWeight: 900,
            marginBottom: 20, display: 'flex', letterSpacing: 0.5,
          }}>
            💼 PROGRAMME APPORTEUR D&apos;AFFAIRES
          </div>

          <p style={{
            fontSize: 106, fontWeight: 900, color: '#C75B00',
            textAlign: 'center', margin: '0 0 2px', lineHeight: 1,
            letterSpacing: -3,
          }}>
            20%
          </p>
          <p style={{
            fontSize: 36, fontWeight: 900, color: '#1C2B4A',
            textAlign: 'center', margin: '0 0 24px', letterSpacing: -1,
          }}>
            de commission récurrente mensuelle
          </p>

          <p style={{
            fontSize: 24, color: '#334155',
            textAlign: 'center', margin: 0, lineHeight: 1.45, maxWidth: 860, fontWeight: 650,
          }}>
            Présentez Nopalou aux commerçants de votre réseau.<br />
            Chaque boutique Pro ou Business que vous recrutez<br />
            vous rapporte 20% de son abonnement, chaque mois sur Wave / OM.
          </p>

          <div style={{
            marginTop: 40,
            background: '#1C2B4A',
            border: '2.5px solid #C75B00',
            borderRadius: 18, padding: '18px 48px',
            fontSize: 26, fontWeight: 900, color: '#FFFFFF',
            display: 'flex', letterSpacing: -0.5,
          }}>
            nopalou.com/apporteur
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center',
        }}>
          <span style={{ fontSize: 19, color: '#C75B00', fontWeight: 900 }}>
            0 FCFA d&apos;Investissement · Paiement mensuel Wave / OM · Sans limite
          </span>
        </div>
      </div>
    ),
    { width: 1080, height: 1080 }
  )
}
