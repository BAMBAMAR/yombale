import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    (
      <div style={{
        width: 1640, height: 624,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #1C2B4A 0%, #0f1d35 100%)',
        fontFamily: 'system-ui, sans-serif',
        position: 'relative',
      }}>
        {/* Cercle déco gauche */}
        <div style={{
          position: 'absolute', left: -80, top: -80,
          width: 400, height: 400, borderRadius: '50%',
          background: 'rgba(199,91,0,0.15)',
          display: 'flex',
        }} />
        {/* Cercle déco droite */}
        <div style={{
          position: 'absolute', right: -60, bottom: -60,
          width: 350, height: 350, borderRadius: '50%',
          background: 'rgba(199,91,0,0.12)',
          display: 'flex',
        }} />
        {/* Ligne déco */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: 4, background: '#C75B00',
          display: 'flex',
        }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 32 }}>
          <div style={{
            width: 90, height: 90, borderRadius: 20,
            background: '#C75B00',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 52, fontWeight: 900, color: '#fff',
          }}>N</div>
          <span style={{ fontSize: 72, fontWeight: 900, color: '#fff', letterSpacing: -2 }}>
            Nopa<span style={{ color: '#C75B00' }}>lou</span>
          </span>
        </div>

        {/* Tagline */}
        <p style={{
          fontSize: 30, color: '#CBD5E1', margin: 0,
          textAlign: 'center', letterSpacing: 0.5,
        }}>
          Comparateur de prix N°1 au Sénégal
        </p>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 60, marginTop: 48 }}>
          {[['3 000+', 'Produits indexés'], ['Caisse POS', 'Pour Magasins & Scanners'], ['20%', 'Commission Apporteur']].map(([n, l]) => (
            <div key={l} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: 38, fontWeight: 900, color: '#C75B00' }}>{n}</span>
              <span style={{ fontSize: 16, color: '#94A3B8', marginTop: 4 }}>{l}</span>
            </div>
          ))}
        </div>

        {/* URL */}
        <div style={{
          position: 'absolute', bottom: 28, right: 40,
          fontSize: 20, color: '#475569',
          display: 'flex',
        }}>
          nopalou.com
        </div>
      </div>
    ),
    { width: 1640, height: 624 }
  )
}
