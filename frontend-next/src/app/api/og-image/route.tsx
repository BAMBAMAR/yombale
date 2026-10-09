import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #C75B00 0%, #9a4500 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            marginBottom: '24px',
          }}
        >
          <svg width="76" height="76" viewBox="0 0 512 512" style={{ display: 'block' }}>
            <defs>
              <linearGradient id="nopalouOgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF7E22"/>
                <stop offset="35%" stopColor="#EA580C"/>
                <stop offset="70%" stopColor="#C75B00"/>
                <stop offset="100%" stopColor="#9E3C00"/>
              </linearGradient>
            </defs>
            <rect x="26" y="26" width="460" height="460" rx="118" fill="url(#nopalouOgGrad)"/>
            <path fillRule="evenodd" d="M120 108h272v296H120Z M324 108H188l136 198Z M188 404h136L188 206Z" fill="#FFFFFF"/>
          </svg>
          <span
            style={{
              fontSize: '76px',
              fontWeight: '900',
              letterSpacing: '-2px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <span style={{ color: '#FFFFFF' }}>Nopa</span>
            <span style={{ color: '#C75B00' }}>lou</span>
          </span>
        </div>
        <div
          style={{
            fontSize: '34px',
            color: 'rgba(255, 255, 255, 0.95)',
            fontWeight: '700',
            marginBottom: '10px',
            textAlign: 'center',
          }}
        >
          Plateforme de Commerce Digital au Sénégal
        </div>
        <div
          style={{
            fontSize: '22px',
            color: 'rgba(255, 255, 255, 0.75)',
            textAlign: 'center',
          }}
        >
          Acheter au meilleur prix · Vendre · Caisse POS · nopalou.com
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
