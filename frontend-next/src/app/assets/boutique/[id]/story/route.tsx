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
  } catch { /* fallback générique */ }

  const nom = boutique?.nom ?? 'Notre Boutique'
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
          width: 1080,
          height: 1920,
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(165deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          position: 'relative',
          overflow: 'hidden',
          padding: '80px 70px 90px',
          boxSizing: 'border-box',
          justifyContent: 'space-between',
        }}
      >
        {/* Halos décoratifs atmosphériques */}
        <div
          style={{
            position: 'absolute',
            right: -240,
            top: -160,
            width: 700,
            height: 700,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(2,132,199,0.25) 0%, transparent 68%)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: -260,
            bottom: 140,
            width: 700,
            height: 700,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16,185,129,0.22) 0%, transparent 70%)',
            display: 'flex',
          }}
        />

        {/* ── 1. EN-TÊTE DE LA VITRINE ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(12px)',
              border: '1.5px solid rgba(255, 255, 255, 0.18)',
              borderRadius: 20,
              padding: '12px 26px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span style={{ fontSize: 24 }}>🏪</span>
            <span
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '1px',
                textTransform: 'uppercase',
              }}
            >
              VITRINE OFFICIELLE
            </span>
          </div>

          <div
            style={{
              background: '#10b981',
              padding: '10px 24px',
              borderRadius: 20,
              fontSize: 18,
              fontWeight: 800,
              color: '#ffffff',
              display: 'flex',
              boxShadow: '0 4px 15px rgba(16,185,129,0.35)',
            }}
          >
            ✓ COMMERCE VÉRIFIÉ
          </div>
        </div>

        {/* ── 2. BLOC TITRE ET NOM ── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            marginTop: 40,
          }}
        >
          <span
            style={{
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: 6,
              color: '#38bdf8',
              display: 'flex',
              textTransform: 'uppercase',
            }}
          >
            BIENVENUE CHEZ
          </span>
          <span
            style={{
              fontSize: 90,
              fontWeight: 900,
              color: '#ffffff',
              lineHeight: 1.05,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {nom}
          </span>
        </div>

        {/* ── 3. CARTE VITRINE CENTRALE AVEC LOGO ── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#ffffff',
            borderRadius: 44,
            padding: '70px 50px',
            position: 'relative',
            boxShadow: '0 35px 80px rgba(0,0,0,0.5)',
            border: '3px solid rgba(255,255,255,0.15)',
            width: '100%',
            boxSizing: 'border-box',
            margin: '40px 0',
          }}
        >
          {/* Logo Boutique */}
          <div
            style={{
              width: 240,
              height: 240,
              borderRadius: 48,
              overflow: 'hidden',
              background: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '6px solid #f1f5f9',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              marginBottom: 36,
            }}
          >
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logo}
                alt={nom}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span style={{ fontSize: 96, color: '#ffffff', fontWeight: 900 }}>
                {initiale}
              </span>
            )}
          </div>

          {/* Badges Catégorie et Localisation */}
          <div
            style={{
              display: 'flex',
              gap: 16,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {categorie ? (
              <span
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: '#0284c7',
                  background: '#f0f9ff',
                  border: '2px solid #bae6fd',
                  borderRadius: 999,
                  padding: '12px 30px',
                  display: 'flex',
                }}
              >
                🏷️ {categorie}
              </span>
            ) : null}

            <span
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: '#0f172a',
                background: '#f8fafc',
                border: '2px solid #e2e8f0',
                borderRadius: 999,
                padding: '12px 30px',
                display: 'flex',
              }}
            >
              📍 {adresse ? `${adresse}, ${ville}` : ville}
            </span>
          </div>

          <span
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: '#475569',
              marginTop: 34,
              textAlign: 'center',
              display: 'flex',
            }}
          >
            Catalogue complet &amp; Commandes en direct
          </span>
        </div>

        {/* ── 4. PIED DE PAGE CALL-TO-ACTION (CONTACT DIRECT) ── */}
        <div
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: 30,
            padding: '26px 40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 25px 50px rgba(16,185,129,0.4)',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span
              style={{
                fontSize: 30,
                fontWeight: 900,
                color: '#ffffff',
                display: 'flex',
              }}
            >
              💬 Contactez-nous sur WhatsApp
            </span>
            <span
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: 'rgba(255,255,255,0.92)',
                display: 'flex',
              }}
            >
              {contact ? `Numéro direct : ${contact}` : 'Commandes & Renseignements'} · 🚚 Livraison rapide
            </span>
          </div>

          <div
            style={{
              background: '#ffffff',
              color: '#047857',
              borderRadius: 20,
              padding: '16px 30px',
              fontSize: 24,
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span>Commander →</span>
          </div>
        </div>
      </div>
    ),
    { width: 1080, height: 1920 }
  )
}
