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
        justifyContent: 'space-between',
      }}>
        {/* Top Accent Line */}
        <div style={{ height: 10, background: 'linear-gradient(90deg, #C75B00 0%, #7C3AED 50%, #1C2B4A 100%)', display: 'flex', position: 'absolute', top: 0, left: 0, right: 0 }} />

        {/* Header Branding */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 18,
          marginBottom: 16,
        }}>
          <div style={{
            width: 68, height: 68, borderRadius: 18,
            background: '#C75B00',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="42" height="42" viewBox="0 0 512 512">
              <path
                fillRule="evenodd"
                d="M120 108h272v296H120Z M324 108H188l136 198Z M188 404h136L188 206Z"
                fill="#FFFFFF"
              />
            </svg>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <span style={{ fontSize: 46, fontWeight: 900, color: '#1C2B4A', letterSpacing: -1 }}>Nopa</span>
            <span style={{ fontSize: 46, fontWeight: 900, color: '#C75B00', letterSpacing: -1 }}>lou</span>
          </div>
        </div>

        {/* Contenu central */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '0 20px',
        }}>
          <div style={{
            background: '#F3E8FF',
            border: '2px solid #7C3AED',
            borderRadius: 9999, padding: '10px 32px',
            fontSize: 18, color: '#7C3AED', fontWeight: 900,
            marginBottom: 16, display: 'flex', letterSpacing: 0.5,
          }}>
            💼 PROGRAMME APPORTEUR D&apos;AFFAIRES
          </div>

          <span style={{
            fontSize: 104, fontWeight: 900, color: '#C75B00',
            textAlign: 'center', lineHeight: 1,
            letterSpacing: -3,
          }}>
            20%
          </span>
          <span style={{
            fontSize: 34, fontWeight: 900, color: '#1C2B4A',
            textAlign: 'center', margin: '6px 0 20px', letterSpacing: -1,
          }}>
            de commission récurrente mensuelle
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, maxWidth: 900 }}>
            <span style={{ fontSize: 22, color: '#334155', textAlign: 'center', fontWeight: 650, lineHeight: 1.4 }}>
              Présentez Nopalou aux commerçants et boutiques de votre réseau.
            </span>
            <span style={{ fontSize: 22, color: '#334155', textAlign: 'center', fontWeight: 650, lineHeight: 1.4 }}>
              Chaque abonnement actif vous rapporte 20% chaque mois par Wave / OM.
            </span>
          </div>

          <div style={{
            marginTop: 36,
            background: '#1C2B4A',
            border: '2.5px solid #C75B00',
            borderRadius: 9999, padding: '18px 48px',
            fontSize: 24, fontWeight: 900, color: '#FFFFFF',
            display: 'flex', letterSpacing: -0.5,
            boxShadow: '0 8px 24px rgba(28, 43, 74, 0.25)',
          }}>
            👉 nopalou.com/compte/apporteur
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center',
        }}>
          <span style={{ fontSize: 18, color: '#C75B00', fontWeight: 900 }}>
            0 FCFA d&apos;Investissement · Paiement mensuel direct Wave / OM · Sans plafond
          </span>
        </div>
      </div>
    ),
    { width: 1080, height: 1080 }
  )
}
