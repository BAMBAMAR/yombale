import { ImageResponse } from 'next/og'
import { apiFetch } from '@/lib/api'

export const runtime = 'edge'

interface ProduitDetail {
  id: string
  nom: string
  prix: number | null
  prix_barre: number | null
  images: string[]
  boutique_nom?: string
  boutique_logo?: string | null
  boutique_whatsapp?: string | null
  boutique_telephone?: string | null
  boutique_ville?: string | null
}

function formatFcfa(n: number | null) {
  if (!n) return 'Prix sur demande'
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(request.url)
  const boutiqueId = searchParams.get('boutiqueId')

  let produit: ProduitDetail | null = null
  if (boutiqueId) {
    try {
      const data = await apiFetch<{ produit: ProduitDetail }>(
        `/boutiques/${boutiqueId}/produits/${params.id}`
      )
      produit = data.produit
    } catch { /* fallback générique */ }
  }

  const nom = produit?.nom ?? 'Nouveauté en Boutique'
  const prix = formatFcfa(produit?.prix ?? null)
  const prixBarre = produit?.prix_barre ? formatFcfa(produit.prix_barre) : null
  const remise = (produit?.prix && produit?.prix_barre && produit.prix_barre > produit.prix)
    ? Math.round((1 - produit.prix / produit.prix_barre) * 100)
    : null
  const boutiqueNom = produit?.boutique_nom ?? 'Notre Boutique'
  const boutiqueLogo = produit?.boutique_logo ?? null
  const boutiqueVille = produit?.boutique_ville ?? 'Dakar, Sénégal'
  const contact = produit?.boutique_whatsapp || produit?.boutique_telephone || null
  const image = produit?.images?.[0] ?? null

  const initiale = boutiqueNom.trim().charAt(0).toUpperCase() || '🏪'

  return new ImageResponse(
    (
      <div
        style={{
          width: 1080,
          height: 1920,
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(175deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          position: 'relative',
          overflow: 'hidden',
          padding: '70px 60px 80px',
          boxSizing: 'border-box',
          justifyContent: 'space-between',
        }}
      >
        {/* Halos décoratifs subtils */}
        <div
          style={{
            position: 'absolute',
            right: -180,
            top: -100,
            width: 600,
            height: 600,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16,185,129,0.20) 0%, transparent 70%)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: -200,
            bottom: 200,
            width: 650,
            height: 650,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(2,132,199,0.18) 0%, transparent 70%)',
            display: 'flex',
          }}
        />

        {/* ── 1. EN-TÊTE 100% IDENTITÉ BOUTIQUE ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(16px)',
            border: '1.5px solid rgba(255, 255, 255, 0.14)',
            borderRadius: 28,
            padding: '18px 28px',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {boutiqueLogo ? (
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 20,
                  overflow: 'hidden',
                  background: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid rgba(255,255,255,0.3)',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={boutiqueLogo}
                  alt={boutiqueNom}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            ) : (
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 20,
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 34,
                  fontWeight: 900,
                  color: '#ffffff',
                  boxShadow: '0 8px 20px rgba(2,132,199,0.35)',
                }}
              >
                {initiale}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontSize: 32,
                  fontWeight: 900,
                  color: '#ffffff',
                  display: 'flex',
                  letterSpacing: '-0.5px',
                }}
              >
                {boutiqueNom}
              </span>
              <span
                style={{
                  fontSize: 20,
                  color: '#94a3b8',
                  fontWeight: 600,
                  display: 'flex',
                }}
              >
                📍 {boutiqueVille}
              </span>
            </div>
          </div>

          <div
            style={{
              background: '#10b981',
              padding: '10px 22px',
              borderRadius: 20,
              fontSize: 18,
              fontWeight: 800,
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 14px rgba(16,185,129,0.35)',
            }}
          >
            <span>DISPONIBLE</span>
          </div>
        </div>

        {/* ── 2. CARTE PHOTO PRODUIT CENTRALE ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: 900,
            position: 'relative',
            background: '#ffffff',
            borderRadius: 40,
            overflow: 'hidden',
            boxShadow: '0 30px 70px rgba(0,0,0,0.5)',
            border: '3px solid rgba(255,255,255,0.12)',
            boxSizing: 'border-box',
          }}
        >
          {remise ? (
            <div
              style={{
                position: 'absolute',
                top: 28,
                left: 28,
                zIndex: 10,
                background: '#ef4444',
                color: '#ffffff',
                fontSize: 28,
                fontWeight: 900,
                padding: '10px 24px',
                borderRadius: 20,
                boxShadow: '0 8px 24px rgba(239,68,68,0.45)',
                display: 'flex',
              }}
            >
              PROMO -{remise}%
            </div>
          ) : (
            <div
              style={{
                position: 'absolute',
                top: 28,
                left: 28,
                zIndex: 10,
                background: '#0284c7',
                color: '#ffffff',
                fontSize: 24,
                fontWeight: 900,
                padding: '8px 20px',
                borderRadius: 16,
                boxShadow: '0 6px 18px rgba(2,132,199,0.35)',
                display: 'flex',
              }}
            >
              🔥 NOUVEL ARRIVAGE
            </div>
          )}

          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={nom}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                padding: 40,
                boxSizing: 'border-box',
              }}
            />
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
                color: '#64748b',
              }}
            >
              <span style={{ fontSize: 130 }}>🛍️</span>
              <span style={{ fontSize: 26, fontWeight: 700 }}>Photo en boutique</span>
            </div>
          )}
        </div>

        {/* ── 3. BLOC NOM & PRIX ── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            width: '100%',
          }}
        >
          <span
            style={{
              fontSize: 48,
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

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 20 }}>
            <span
              style={{
                fontSize: 64,
                fontWeight: 900,
                color: '#22c55e',
                letterSpacing: '-1px',
                display: 'flex',
              }}
            >
              {prix}
            </span>
            {prixBarre && (
              <span
                style={{
                  fontSize: 34,
                  fontWeight: 700,
                  color: '#94a3b8',
                  textDecoration: 'line-through',
                  display: 'flex',
                }}
              >
                {prixBarre}
              </span>
            )}
          </div>
        </div>

        {/* ── 4. PIED DE PAGE CALL-TO-ACTION (DIRECT MARCHAND) ── */}
        <div
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: 28,
            padding: '24px 34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 20px 45px rgba(16,185,129,0.35)',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span
              style={{
                fontSize: 28,
                fontWeight: 900,
                color: '#ffffff',
                display: 'flex',
              }}
            >
              💬 Commandez en 1-Clic
            </span>
            <span
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: 'rgba(255,255,255,0.92)',
                display: 'flex',
              }}
            >
              {contact ? `WhatsApp : ${contact}` : 'Envoi rapide & direct'} · 🚚 Livraison disponible
            </span>
          </div>

          <div
            style={{
              background: '#ffffff',
              color: '#047857',
              borderRadius: 18,
              padding: '14px 26px',
              fontSize: 22,
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span>Écrire →</span>
          </div>
        </div>
      </div>
    ),
    { width: 1080, height: 1920 }
  )
}
