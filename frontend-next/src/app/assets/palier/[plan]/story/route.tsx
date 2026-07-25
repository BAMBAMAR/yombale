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
  let commission = 2
  if (palier.id !== 'gratuit') {
    let prixPro = 15000
    let prixBusiness = 35000
    try {
      const r = await fetch(`${BACKEND}/api/settings/public`, { cache: 'no-store' })
      if (r.ok) {
        const s = await r.json()
        prixPro = Number(s.plan_pro_prix) || 15000
        prixBusiness = Number(s.plan_business_prix) || 35000
        commission = Number(s.commission_business) || 2
      }
    } catch { /* valeurs par défaut ci-dessus */ }
    prix = palier.id === 'pro' ? prixPro : prixBusiness
  }

  const avantages = [...palier.avantages]
  if (palier.id === 'business') {
    avantages.splice(1, 0, `Seulement ${commission}% de commission`)
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: 1080,
          height: 1920,
          display: 'flex',
          flexDirection: 'column',
          background: `linear-gradient(165deg, #1C2B4A 0%, #16223B 48%, #0F1D35 100%)`,
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Halos décoratifs */}
        <div
          style={{
            position: 'absolute', right: -260, top: -220, width: 760, height: 760,
            borderRadius: '50%', background: `radial-gradient(circle, ${palier.couleur}55 0%, transparent 68%)`,
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute', left: -300, bottom: 120, width: 720, height: 720,
            borderRadius: '50%', background: 'radial-gradient(circle, rgba(232,185,138,0.14) 0%, transparent 70%)',
            display: 'flex',
          }}
        />

        {/* Bande d'accent diagonale */}
        <div
          style={{
            position: 'absolute', right: -160, top: 780, width: 900, height: 260,
            background: `linear-gradient(90deg, transparent 0%, ${palier.couleur}80 100%)`,
            transform: 'rotate(-14deg)', display: 'flex',
          }}
        />

        {/* En-tête Nopalou */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '78px 80px 0' }}>
          <div
            style={{
              width: 64, height: 64, borderRadius: 16, background: '#C75B00',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 38, fontWeight: 900, color: '#fff',
            }}
          >
            N
          </div>
          <span style={{ fontSize: 42, fontWeight: 900, color: '#fff', display: 'flex' }}>
            Nopa<span style={{ color: '#C75B00', display: 'flex' }}>lou</span>
          </span>
        </div>

        {/* Bloc titre — nom du palier dominant */}
        <div style={{ display: 'flex', flexDirection: 'column', padding: '110px 80px 0' }}>
          <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: 8, color: palier.couleur, display: 'flex' }}>
            BOUTIQUE
          </span>
          <span
            style={{
              fontSize: 96, fontWeight: 900, color: '#fff', lineHeight: 1.05, marginTop: 14, display: 'flex',
            }}
          >
            {palier.label.replace('Boutique ', '')}
          </span>
          <span style={{ fontSize: 44, fontWeight: 900, color: '#fff', marginTop: 24, display: 'flex' }}>
            {prix ? `${prix.toLocaleString('fr-FR')} FCFA/mois` : 'Gratuit, sans engagement'}
          </span>
        </div>

        {/* Carte avantages */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 80px 40px' }}>
          <div
            style={{
              display: 'flex', flexDirection: 'column', gap: 22, width: 720,
              background: '#FFF7EF', borderRadius: 44, padding: '56px 56px',
              boxShadow: '0 40px 90px rgba(0,0,0,0.5)',
            }}
          >
            {avantages.slice(0, 6).map(a => (
              <div key={a} style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <span
                  style={{
                    width: 36, height: 36, borderRadius: '50%', background: palier.couleur,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, color: '#fff', flexShrink: 0,
                  }}
                >
                  ✓
                </span>
                <span style={{ fontSize: 26, color: '#1C2B4A', fontWeight: 600, display: 'flex', lineHeight: 1.3 }}>
                  {a}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA bas */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '0 80px 110px' }}>
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 18, background: palier.couleur,
              borderRadius: 24, padding: '30px 66px', boxShadow: `0 20px 50px ${palier.couleur}70`,
            }}
          >
            <span style={{ fontSize: 40, display: 'flex' }}>🏪</span>
            <span style={{ fontSize: 36, fontWeight: 900, color: '#fff', display: 'flex' }}>
              Créez votre boutique sur Nopalou
            </span>
          </div>
        </div>
      </div>
    ),
    { width: 1080, height: 1920 }
  )
}
