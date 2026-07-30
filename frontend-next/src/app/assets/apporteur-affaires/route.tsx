import { ImageResponse } from 'next/og'

export const runtime = 'edge'

async function getCustomFont() {
  try {
    const res = await fetch('https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.ttf')
    if (res.ok) {
      return await res.arrayBuffer()
    }
  } catch {
    // fallback
  }
  return null
}

// Post/flyer recrutement apporteurs d'affaires — programme commission 20% récurrente (Bright & Sharp)
export async function GET() {
  const fontData = await getCustomFont()
  const fontOptions = fontData ? [{ name: 'Inter', data: fontData, style: 'normal' as const, weight: 700 as const }] : []

  return new ImageResponse(
    (
      <div style={{
        width: 1080, height: 1080,
        display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(160deg, #F3E8FF 0%, #FFFFFF 55%, #FAF5FF 100%)',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        position: 'relative',
        overflow: 'hidden',
        padding: 48,
        boxSizing: 'border-box',
      }}>
        {/* Background shapes */}
        <div style={{
          position: 'absolute', right: -100, top: -100,
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)',
          display: 'flex',
        }} />

        <div style={{ height: 8, background: '#7C3AED', display: 'flex', position: 'absolute', top: 0, left: 0, right: 0 }} />

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16,
          marginBottom: 32,
        }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16,
            background: '#7C3AED',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 34, fontWeight: 900, color: '#fff',
            boxShadow: '0 8px 20px rgba(124,58,237,0.3)',
          }}>N</div>
          <span style={{ fontSize: 40, fontWeight: 900, color: '#0F172A' }}>
            Nopa<span style={{ color: '#7C3AED' }}>lou</span>
          </span>
        </div>

        {/* Contenu central */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '0 40px',
        }}>
          <div style={{
            background: '#F3E8FF',
            border: '2px solid #7C3AED',
            borderRadius: 40, padding: '10px 32px',
            fontSize: 20, color: '#7C3AED', fontWeight: 900,
            marginBottom: 24, display: 'flex',
          }}>
            💼 PROGRAMME APPORTEUR D&apos;AFFAIRES
          </div>

          <p style={{
            fontSize: 100, fontWeight: 900, color: '#7C3AED',
            textAlign: 'center', margin: '0 0 4px', lineHeight: 1,
          }}>
            20%
          </p>
          <p style={{
            fontSize: 34, fontWeight: 900, color: '#0F172A',
            textAlign: 'center', margin: '0 0 28px',
          }}>
            de commission récurrente mensuelle
          </p>

          <p style={{
            fontSize: 24, color: '#475569',
            textAlign: 'center', margin: 0, lineHeight: 1.6, maxWidth: 820, fontWeight: 600,
          }}>
            Présentez Nopalou aux commerçants de votre réseau.<br />
            Chaque boutique Pro ou Business que vous recrutez<br />
            vous rapporte 20% de son abonnement, chaque mois sur Wave / OM.
          </p>

          <div style={{
            marginTop: 44,
            background: '#7C3AED',
            borderRadius: 18, padding: '20px 52px',
            fontSize: 26, fontWeight: 900, color: '#fff',
            display: 'flex',
            boxShadow: '0 10px 25px rgba(124,58,237,0.3)',
          }}>
            nopalou.com/apporteur
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center',
        }}>
          <span style={{ fontSize: 18, color: '#6B21A8', fontWeight: 800 }}>
            0 FCFA d&apos;Investissement · Paiement mensuel Wave / OM · Sans limite
          </span>
        </div>
      </div>
    ),
    { width: 1080, height: 1080, fonts: fontOptions }
  )
}
