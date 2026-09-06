import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Nopalou — Comparateur de prix au Sénégal'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg, #1C2B4A 0%, #0f1d35 100%)',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
        }}
      >
        {/* Motif décoratif */}
        <div style={{
          position: 'absolute', top: 0, right: 0,
          width: 400, height: 400,
          background: 'radial-gradient(circle, rgba(199,91,0,0.25) 0%, transparent 70%)',
          display: 'flex',
        }} />
        <div style={{
          position: 'absolute', bottom: 0, left: 0,
          width: 300, height: 300,
          background: 'radial-gradient(circle, rgba(199,91,0,0.15) 0%, transparent 70%)',
          display: 'flex',
        }} />

        {/* Logo — monogramme vectoriel authentique + wordmark */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 20, marginBottom: 40,
        }}>
          <svg width="72" height="72" viewBox="0 0 512 512" style={{ display: 'block' }}>
            <defs>
              <linearGradient id="ogBrandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF7E22"/>
                <stop offset="35%" stopColor="#EA580C"/>
                <stop offset="70%" stopColor="#C75B00"/>
                <stop offset="100%" stopColor="#9E3C00"/>
              </linearGradient>
            </defs>
            <rect x="26" y="26" width="460" height="460" rx="118" fill="url(#ogBrandGrad)"/>
            <path fillRule="evenodd" d="M120 108h272v296H120Z M324 108H188l136 198Z M188 404h136L188 206Z" fill="#FFFFFF"/>
          </svg>
          <span style={{ fontSize: 52, fontWeight: 800, letterSpacing: -1, display: 'flex' }}>
            <span style={{ color: '#fff' }}>Nopa</span>
            <span style={{ color: '#C75B00' }}>lou</span>
          </span>
        </div>

        {/* Tagline */}
        <p style={{
          fontSize: 32, color: '#E2E8F0', margin: 0, textAlign: 'center',
          maxWidth: 700, lineHeight: 1.3,
        }}>
          Comparateur de prix N°1 au Sénégal
        </p>

        {/* Stats */}
        <div style={{
          display: 'flex', gap: 48, marginTop: 48,
        }}>
          {[['3 000+', 'Produits'], ['9+', 'Marchands'], ['100%', 'Gratuit']].map(([n, l]) => (
            <div key={l} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: 36, fontWeight: 800, color: '#C75B00' }}>{n}</span>
              <span style={{ fontSize: 16, color: '#94A3B8', marginTop: 4 }}>{l}</span>
            </div>
          ))}
        </div>

        {/* URL */}
        <div style={{
          position: 'absolute', bottom: 32,
          fontSize: 18, color: '#64748B',
          display: 'flex',
        }}>
          nopalou.com
        </div>
      </div>
    ),
    { ...size }
  )
}
