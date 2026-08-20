import { ImageResponse } from 'next/og'
import { apiFetch } from '@/lib/api'

export const runtime = 'edge'

interface BoutiqueDetail {
  id: string
  nom: string
  categorie: string | null
  ville: string
  logo_url: string | null
  whatsapp?: string | null
  telephone?: string | null
  adresse?: string | null
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  let boutique: BoutiqueDetail | null = null
  try {
    const data = await apiFetch<{ id: string; nom: string; categorie: string | null; ville: string; logo_url: string | null; whatsapp?: string | null; telephone?: string | null; adresse?: string | null }>(
      `/boutiques/${params.id}`
    )
    boutique = data as BoutiqueDetail
  } catch { /* fallback */ }

  const nom = boutique?.nom ?? 'Vitrine Officielle'
  const categorie = boutique?.categorie ?? 'Commerce & Vente'
  const ville = boutique?.ville ?? 'Dakar, Sénégal'
  const logo = boutique?.logo_url ?? null
  const contact = boutique?.whatsapp || boutique?.telephone || null
  const adresse = boutique?.adresse || null
  const initiale = nom.trim().charAt(0).toUpperCase() || '🏪'

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: 'flex',
          flexDirection: 'row',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          position: 'relative',
          overflow: 'hidden',
          padding: '50px 60px',
          boxSizing: 'border-box',
          gap: 50,
          alignItems: 'center',
        }}
      >
        {/* Halos d'ambiance */}
        <div
          style={{
            position: 'absolute',
            right: -100,
            top: -100,
            width: 480,
            height: 480,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(2,132,199,0.25) 0%, transparent 70%)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: -100,
            bottom: -100,
            width: 480,
            height: 480,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16,185,129,0.22) 0%, transparent 70%)',
            display: 'flex',
          }}
        />

        {/* ── COLONNE GAUCHE : GRAND LOGO DE LA BOUTIQUE ── */}
        <div
          style={{
            width: 420,
            height: 480,
            borderRadius: 32,
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            border: '2px solid rgba(255,255,255,0.15)',
            flexShrink: 0,
            boxSizing: 'border-box',
          }}
        >
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logo}
              alt={nom}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                padding: 30,
                boxSizing: 'border-box',
              }}
            />
          ) : (
            <div
              style={{
                width: 240,
                height: 240,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 110,
                fontWeight: 900,
                color: '#ffffff',
                boxShadow: '0 15px 35px rgba(2,132,199,0.4)',
              }}
            >
              {initiale}
            </div>
          )}
        </div>

        {/* ── COLONNE DROITE : NOM + INFOS + CTA ── */}
        <div
          style={{
            flex: 1,
            height: 480,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxSizing: 'border-box',
          }}
        >
          {/* Badge Vitrine Officielle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                border: '1.5px solid rgba(255,255,255,0.15)',
                borderRadius: 16,
                padding: '8px 18px',
                fontSize: 14,
                fontWeight: 800,
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span>🏪 VITRINE OFFICIELLE</span>
            </div>
            <div
              style={{
                background: '#10b981',
                borderRadius: 16,
                padding: '8px 16px',
                fontSize: 14,
                fontWeight: 800,
                color: '#ffffff',
                display: 'flex',
              }}
            >
              OUVERT
            </div>
          </div>

          {/* Nom & Catégorie */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span
              style={{
                fontSize: 44,
                fontWeight: 900,
                color: '#ffffff',
                lineHeight: 1.15,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {nom}
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#94a3b8',
                  display: 'flex',
                }}
              >
                🏷️ {categorie}
              </span>
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#94a3b8',
                  display: 'flex',
                }}
              >
                📍 {adresse ? `${adresse}, ${ville}` : ville}
              </span>
            </div>
          </div>

          {/* Bannière CTA */}
          <div
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: 20,
              padding: '16px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 10px 25px rgba(16,185,129,0.3)',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 900,
                  color: '#ffffff',
                  display: 'flex',
                }}
              >
                🛍️ Découvrez notre catalogue en ligne
              </span>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.92)',
                  display: 'flex',
                }}
              >
                {contact ? `Contact WhatsApp : ${contact}` : 'Articles disponibles avec prix à jour'}
              </span>
            </div>

            <div
              style={{
                background: '#ffffff',
                color: '#047857',
                borderRadius: 12,
                padding: '8px 18px',
                fontSize: 15,
                fontWeight: 900,
                display: 'flex',
              }}
            >
              Visiter →
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
