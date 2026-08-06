import { ImageResponse } from 'next/og'

export const runtime = 'edge'

function formatPrix(val: string | null): string {
  if (!val) return ''
  const num = parseInt(val.replace(/\D/g, ''), 10)
  if (isNaN(num)) return val
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA'
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const nom = searchParams.get('nom') || 'Baisse de Prix Excitation'
  const prixRaw = searchParams.get('prix') || '15000'
  const prixBarreRaw = searchParams.get('prixBarre') || '25000'
  const boutique = searchParams.get('boutique') || 'Boutique Nopalou'
  const image = searchParams.get('image') || null

  const prix = formatPrix(prixRaw)
  const prixBarre = formatPrix(prixBarreRaw)

  return new ImageResponse(
    (
      <div
        style={{
          width: 1080,
          height: 1080,
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(155deg, #1C2B4A 0%, #111C33 60%, #C75B00 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
          padding: 60,
          boxSizing: 'border-box',
          overflow: 'hidden',
          color: '#ffffff',
        }}
      >
        {/* Halo décoratif top right */}
        <div
          style={{
            position: 'absolute',
            right: -100,
            top: -100,
            width: 450,
            height: 450,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(199,91,0,0.35) 0%, transparent 70%)',
            display: 'flex',
          }}
        />

        {/* Header Branding Nopalou */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 56, height: 56, borderRadius: 14, background: '#C75B00',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 32, fontWeight: 900, color: '#ffffff',
              }}
            >
              N
            </div>
            <span style={{ fontSize: 36, fontWeight: 900, color: '#ffffff', display: 'flex' }}>
              Nopa<span style={{ color: '#C75B00', display: 'flex' }}>lou</span>
            </span>
          </div>
          <div
            style={{
              background: '#C75B00',
              borderRadius: 30,
              padding: '10px 24px',
              fontSize: 18,
              fontWeight: 900,
              color: '#ffffff',
              display: 'flex',
              letterSpacing: 1,
            }}
          >
            🔥 BON PLAN DU JOUR
          </div>
        </div>

        {/* Corps central */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 40,
            marginTop: 30,
          }}
        >
          {/* Bloc Image ou Illustration */}
          <div
            style={{
              width: 380,
              height: 380,
              borderRadius: 24,
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              border: '4px solid rgba(255,255,255,0.2)',
              flexShrink: 0,
            }}
          >
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt={nom}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <span style={{ fontSize: 80, display: 'flex' }}>🛍️</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#1C2B4A' }}>
                  {boutique}
                </span>
              </div>
            )}
          </div>

          {/* Bloc Infos Produit & Prix */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: '#C75B00',
                textTransform: 'uppercase',
                letterSpacing: 2,
                marginBottom: 10,
                display: 'flex',
              }}
            >
              {boutique}
            </span>
            <h2
              style={{
                fontSize: 42,
                fontWeight: 900,
                color: '#ffffff',
                margin: 0,
                lineHeight: 1.2,
                display: 'flex',
              }}
            >
              {nom}
            </h2>

            {/* Zone de Prix */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                marginTop: 24,
                gap: 8,
              }}
            >
              {prixBarre && (
                <span
                  style={{
                    fontSize: 26,
                    color: 'rgba(255,255,255,0.5)',
                    textDecoration: 'line-through',
                    fontWeight: 700,
                    display: 'flex',
                  }}
                >
                  {prixBarre}
                </span>
              )}
              <span
                style={{
                  fontSize: 54,
                  fontWeight: 900,
                  color: '#22C55E',
                  display: 'flex',
                  lineHeight: 1,
                }}
              >
                {prix}
              </span>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1.5px solid rgba(255,255,255,0.15)',
            borderRadius: 20,
            padding: '20px 32px',
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: 20, fontWeight: 800, color: '#ffffff', display: 'flex' }}>
            Comparez &amp; Commandez sur Nopalou
          </span>
          <span style={{ fontSize: 22, fontWeight: 900, color: '#C75B00', display: 'flex' }}>
            nopalou.com
          </span>
        </div>
      </div>
    ),
    { width: 1080, height: 1080 }
  )
}
