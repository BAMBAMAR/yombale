import { ImageResponse } from 'next/og'
import { notFound } from 'next/navigation'
import { PALIERS_BOUTIQUE } from '@/lib/fonctionnalites-data'

export const runtime = 'edge'

export async function GET(
  request: Request,
  { params }: { params: { plan: string } }
) {
  const palier = PALIERS_BOUTIQUE.find(p => p.id === params.plan)
  if (!palier) notFound()

  const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
  let prix: number | null = null
  if (palier.id !== 'gratuit') {
    let prixPro = 15000
    let prixBusiness = 35000
    try {
      const r = await fetch(`${BACKEND}/api/settings/public`, { cache: 'no-store' })
      if (r.ok) {
        const s = await r.json()
        prixPro = Number(s.plan_pro_prix) || 15000
        prixBusiness = Number(s.plan_business_prix) || 35000
      }
    } catch { /* valeurs par défaut ci-dessus */ }
    prix = palier.id === 'pro' ? prixPro : prixBusiness
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: 1080,
          height: 1080,
          display: 'flex',
          flexDirection: 'column',
          background: `linear-gradient(160deg, #1C2B4A 0%, #132038 55%, ${palier.couleur}22 100%)`,
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Halo décoratif */}
        <div
          style={{
            position: 'absolute',
            right: -140,
            top: -140,
            width: 480,
            height: 480,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${palier.couleur}48 0%, transparent 70%)`,
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: -120,
            bottom: -60,
            width: 380,
            height: 380,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(199,91,0,0.18) 0%, transparent 70%)',
            display: 'flex',
          }}
        />

        <div style={{ height: 8, background: palier.couleur, display: 'flex' }} />

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '40px 60px 0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 54, height: 54, borderRadius: 13, background: '#C75B00',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 30, fontWeight: 900, color: '#fff',
              }}
            >
              N
            </div>
            <span style={{ fontSize: 32, fontWeight: 900, color: '#fff', display: 'flex' }}>
              Nopa<span style={{ color: '#C75B00', display: 'flex' }}>lou</span>
            </span>
          </div>
          <div
            style={{
              background: `${palier.couleur}30`, border: `1.5px solid ${palier.couleur}`,
              borderRadius: 40, padding: '9px 22px', fontSize: 16, color: '#fff',
              fontWeight: 700, display: 'flex',
            }}
          >
            {palier.label.toUpperCase()}
          </div>
        </div>

        {/* Prix */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 60px 0' }}>
          <span style={{ fontSize: 56, fontWeight: 900, color: '#fff', display: 'flex' }}>
            {prix ? `${prix.toLocaleString('fr-FR')} FCFA` : 'Gratuit'}
          </span>
          {prix && (
            <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.6)', display: 'flex', marginTop: 6 }}>
              par mois
            </span>
          )}
        </div>

        {/* Liste avantages */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16, padding: '48px 80px 0' }}>
          {palier.avantages.slice(0, 6).map(a => (
            <div key={a} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <span
                style={{
                  width: 32, height: 32, borderRadius: '50%', background: palier.couleur,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, color: '#fff', flexShrink: 0,
                }}
              >
                ✓
              </span>
              <span style={{ fontSize: 24, color: '#fff', display: 'flex', lineHeight: 1.3 }}>
                {a}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 60px 48px' }}>
          <span style={{ fontSize: 18, color: '#94A3B8', fontWeight: 700, display: 'flex' }}>
            nopalou.com
          </span>
        </div>
      </div>
    ),
    { width: 1080, height: 1080 }
  )
}
