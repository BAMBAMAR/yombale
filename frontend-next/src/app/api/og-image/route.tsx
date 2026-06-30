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
          <div
            style={{
              width: '72px',
              height: '72px',
              background: 'white',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px',
              fontWeight: '900',
              color: '#C75B00',
            }}
          >
            N
          </div>
          <span
            style={{
              fontSize: '80px',
              fontWeight: '900',
              color: 'white',
              letterSpacing: '-2px',
            }}
          >
            Nopalou
          </span>
        </div>
        <div
          style={{
            fontSize: '36px',
            color: 'rgba(255, 255, 255, 0.90)',
            fontWeight: '500',
            marginBottom: '12px',
            textAlign: 'center',
          }}
        >
          Comparateur de prix N°1 au Sénégal
        </div>
        <div
          style={{
            fontSize: '24px',
            color: 'rgba(255, 255, 255, 0.65)',
            textAlign: 'center',
          }}
        >
          Produits · Immobilier · Télécom · nopalou.com
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
