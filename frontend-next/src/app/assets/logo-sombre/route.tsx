import { ImageResponse } from 'next/og'

export const runtime = 'edge'

// Logo fond sombre — pour réseaux sociaux, fond noir
export async function GET() {
  return new ImageResponse(
    (
      <div style={{
        width: 800, height: 800,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: '#0B0F19',
      }}>
        {/* Authentic Nopalou Squircle SVG with 4-stop solar gradient */}
        <svg width="340" height="340" viewBox="0 0 512 512" style={{ display: 'block', marginBottom: 36 }}>
          <defs>
            <linearGradient id="nopalouGradDark" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF7E22"/>
              <stop offset="35%" stopColor="#EA580C"/>
              <stop offset="70%" stopColor="#C75B00"/>
              <stop offset="100%" stopColor="#9E3C00"/>
            </linearGradient>
          </defs>
          <rect x="26" y="26" width="460" height="460" rx="118" fill="url(#nopalouGradDark)"/>
          <path fillRule="evenodd" d="M120 108h272v296H120Z M324 108H188l136 198Z M188 404h136L188 206Z" fill="#FFFFFF"/>
        </svg>

        <span style={{
          fontSize: 96, fontWeight: 900, color: '#FFFFFF', letterSpacing: -2, display: 'flex', alignItems: 'center',
        }}>
          Nopa<span style={{ color: '#C75B00' }}>lou</span>
        </span>
        <span style={{ fontSize: 28, color: '#94A3B8', marginTop: 14, fontWeight: 700, display: 'flex' }}>
          nopalou.com
        </span>
      </div>
    ),
    { width: 800, height: 800 }
  )
}
