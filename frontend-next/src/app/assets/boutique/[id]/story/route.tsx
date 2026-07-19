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
      <div
        style={{
          width: 1080,
          height: 1920,
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(165deg, #1C2B4A 0%, #16223B 48%, #0F1D35 100%)',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Halos décoratifs — profondeur atmosphérique */}
        <div
          style={{
            position: 'absolute',
            right: -260,
            top: -220,
            width: 760,
            height: 760,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(199,91,0,0.38) 0%, transparent 68%)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: -300,
            bottom: 120,
            width: 720,
            height: 720,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(232,185,138,0.14) 0%, transparent 70%)',
            display: 'flex',
          }}
        />

        {/* Bande d'accent diagonale, signature de la carte */}
        <div
          style={{
            position: 'absolute',
            right: -160,
            top: 780,
            width: 900,
            height: 260,
            background: 'linear-gradient(90deg, transparent 0%, rgba(199,91,0,0.55) 100%)',
            transform: 'rotate(-14deg)',
            display: 'flex',
          }}
        />

        {/* En-tête Nopalou */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '78px 80px 0' }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: '#C75B00',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 38,
              fontWeight: 900,
              color: '#fff',
            }}
          >
            N
          </div>
          <span style={{ fontSize: 42, fontWeight: 900, color: '#fff', display: 'flex' }}>
            Nopa<span style={{ color: '#C75B00', display: 'flex' }}>lou</span>
          </span>
          <div style={{ flex: 1, display: 'flex' }} />
          <span
            style={{
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: 6,
              color: 'rgba(255,255,255,0.55)',
              display: 'flex',
            }}
          >
            LA BOUTIQUE
          </span>
        </div>

        {/* Bloc titre — nom de boutique dominant, aligné à gauche */}
        <div style={{ display: 'flex', flexDirection: 'column', padding: '150px 80px 0' }}>
          <span
            style={{
              fontSize: 30,
              fontWeight: 800,
              letterSpacing: 10,
              color: '#C75B00',
              display: 'flex',
            }}
          >
            DÉCOUVREZ
          </span>
          <span
            style={{
              fontSize: 108,
              fontWeight: 900,
              color: '#fff',
              lineHeight: 1.02,
              marginTop: 18,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              maxWidth: 900,
            }}
          >
            {nom}
          </span>
        </div>

        {/* Carte vitrine — logo débordant en haut, tiltée */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '120px 80px 40px',
          }}
        >
          <div
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: 720,
              background: '#FFF7EF',
              borderRadius: 44,
              padding: '210px 56px 60px',
              transform: 'rotate(-2.5deg)',
              boxShadow: '0 40px 90px rgba(0,0,0,0.5)',
            }}
          >
            {/* Logo boutique, débordant le bord haut de la carte */}
            <div
              style={{
                position: 'absolute',
                top: -140,
                width: 300,
                height: 300,
                borderRadius: '50%',
                overflow: 'hidden',
                background: '#1C2B4A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '10px solid #FFF7EF',
                boxShadow: '0 24px 50px rgba(0,0,0,0.4)',
              }}
            >
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt={nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: 150, display: 'flex' }}>🏪</span>
              )}
            </div>

            {/* Badges catégorie + ville */}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
              {categorie ? (
                <span
                  style={{
                    fontSize: 30,
                    fontWeight: 800,
                    color: '#C75B00',
                    background: 'rgba(199,91,0,0.10)',
                    border: '2px solid rgba(199,91,0,0.35)',
                    borderRadius: 999,
                    padding: '14px 34px',
                    display: 'flex',
                  }}
                >
                  {categorie}
                </span>
              ) : null}
              <span
                style={{
                  fontSize: 30,
                  fontWeight: 800,
                  color: '#1C2B4A',
                  background: 'rgba(28,43,74,0.08)',
                  border: '2px solid rgba(28,43,74,0.22)',
                  borderRadius: 999,
                  padding: '14px 34px',
                  display: 'flex',
                }}
              >
                📍 {ville}
              </span>
            </div>

            <span
              style={{
                fontSize: 26,
                fontWeight: 600,
                color: '#5A6478',
                marginTop: 34,
                textAlign: 'center',
                display: 'flex',
              }}
            >
              Commandez directement sur WhatsApp
            </span>
          </div>
        </div>

        {/* CTA bas */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '0 80px 110px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              background: '#C75B00',
              borderRadius: 24,
              padding: '30px 66px',
              boxShadow: '0 20px 50px rgba(199,91,0,0.45)',
            }}
          >
            <span style={{ fontSize: 40, display: 'flex' }}>🛒</span>
            <span style={{ fontSize: 40, fontWeight: 900, color: '#fff', display: 'flex' }}>
              Voir la boutique sur Nopalou
            </span>
          </div>
        </div>
      </div>
    ),
    { width: 1080, height: 1920 }
  )
}
