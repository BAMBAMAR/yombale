import { ImageResponse } from 'next/og'
import { apiFetch } from '@/lib/api'

export const runtime = 'edge'

interface BoutiqueDetail {
  id: string
  nom: string
  categorie: string | null
  ville: string
  logo_url: string | null
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  let boutique: BoutiqueDetail | null = null
  try {
    const data = await apiFetch<{ id: string; nom: string; categorie: string | null; ville: string; logo_url: string | null }>(
      `/boutiques/${params.id}`
    )
    boutique = data as BoutiqueDetail
  } catch { /* fallback générique ci-dessous */ }

  const nom = boutique?.nom ?? 'Boutique'
  const categorie = boutique?.categorie ?? ''
  const ville = boutique?.ville ?? 'Sénégal'
  const logo = boutique?.logo_url ?? null

  return new ImageResponse(
    (
      <div style={{
        width: 1080, height: 1920,
        display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(180deg, #1C2B4A 0%, #0f1d35 60%, #C75B00 100%)',
        fontFamily: 'system-ui, sans-serif',
      }}>
        {/* Logo Nopalou */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '70px 70px 0' }}>
          <div style={{
            width: 60, height: 60, borderRadius: 14, background: '#C75B00',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 34, fontWeight: 900, color: '#fff',
          }}>N</div>
          <span style={{ fontSize: 38, fontWeight: 900, color: '#fff' }}>
            Nopa<span style={{ color: '#C75B00' }}>lou</span>
          </span>
        </div>

        {/* Logo boutique */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '50px 70px', gap: 40,
        }}>
          <div style={{
            width: 320, height: 320, borderRadius: '50%', overflow: 'hidden',
            background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '6px solid rgba(255,255,255,0.25)',
          }}>
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt={nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: 120 }}>🏪</span>
            )}
          </div>

          <p style={{ fontSize: 26, color: 'rgba(255,255,255,0.7)', margin: 0, textAlign: 'center' }}>
            Découvrez
          </p>
          <p style={{
            fontSize: 56, fontWeight: 900, color: '#fff', margin: 0, textAlign: 'center', lineHeight: 1.2,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {nom}
          </p>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {categorie && (
              <span style={{ fontSize: 22, background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '8px 20px', borderRadius: 999 }}>
                {categorie}
              </span>
            )}
            <span style={{ fontSize: 22, background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '8px 20px', borderRadius: 999 }}>
              📍 {ville}
            </span>
          </div>
        </div>

        {/* CTA bas */}
        <div style={{ padding: '0 70px 100px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '24px 60px', fontSize: 32, fontWeight: 900, color: '#C75B00' }}>
            sur Nopalou
          </div>
        </div>
      </div>
    ),
    { width: 1080, height: 1920 }
  )
}
