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
    } catch { /* fallback */ }
  }

  if (!produit) {
    try {
      const data = await apiFetch<{
        id: string
        nom: string
        prix_min?: number
        images?: string[]
        image_url?: string
        boutique_nom?: string
        boutique_id?: string
        boutique_slug?: string
      }>(`/produits/${params.id}`)
      if (data) {
        let bLogo: string | null = null
        let bWa: string | null = null
        let bTel: string | null = null
        let bVille: string | null = null

        if (data.boutique_id || data.boutique_slug) {
          try {
            const bData = await apiFetch<{
              logo_url?: string | null
              whatsapp?: string | null
              telephone?: string | null
              ville?: string | null
            }>(`/boutiques/${data.boutique_id || data.boutique_slug}`)
            if (bData) {
              bLogo = bData.logo_url || null
              bWa = bData.whatsapp || null
              bTel = bData.telephone || null
              bVille = bData.ville || null
            }
          } catch { /* ignore */ }
        }

        produit = {
          id: data.id,
          nom: data.nom,
          prix: data.prix_min ?? null,
          prix_barre: null,
          images: data.images || (data.image_url ? [data.image_url] : []),
          boutique_nom: data.boutique_nom,
          boutique_logo: bLogo,
          boutique_whatsapp: bWa,
          boutique_telephone: bTel,
          boutique_ville: bVille,
        }
      }
    } catch { /* fallback */ }
  }

  const nom = produit?.nom ?? 'Article disponible en boutique'
  const prix = formatFcfa(produit?.prix ?? null)
  const prixBarre = produit?.prix_barre ? formatFcfa(produit.prix_barre) : null
  const remise = (produit?.prix && produit?.prix_barre && produit.prix_barre > produit.prix)
    ? Math.round((1 - produit.prix / produit.prix_barre) * 100)
    : null
  const boutiqueNom = produit?.boutique_nom ?? 'Boutique Partenaire'
  const boutiqueLogo = produit?.boutique_logo ?? null
  const boutiqueVille = produit?.boutique_ville ?? 'Dakar, Sénégal'
  const contact = produit?.boutique_whatsapp || produit?.boutique_telephone || null
  const image = produit?.images?.[0] ?? null

  const initiale = boutiqueNom.trim().charAt(0).toUpperCase() || '🏪'

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
          padding: '45px 50px',
          boxSizing: 'border-box',
          gap: 40,
          alignItems: 'center',
        }}
      >
        {/* Halos d'ambiance */}
        <div
          style={{
            position: 'absolute',
            right: -100,
            top: -100,
            width: 450,
            height: 450,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16,185,129,0.22) 0%, transparent 70%)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: -100,
            bottom: -100,
            width: 450,
            height: 450,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(2,132,199,0.20) 0%, transparent 70%)',
            display: 'flex',
          }}
        />

        {/* ── COLONNE GAUCHE : PHOTO DU PRODUIT ── */}
        <div
          style={{
            width: 480,
            height: 540,
            borderRadius: 28,
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
          {remise ? (
            <div
              style={{
                position: 'absolute',
                top: 20,
                left: 20,
                zIndex: 10,
                background: '#ef4444',
                color: '#ffffff',
                fontSize: 20,
                fontWeight: 900,
                padding: '6px 16px',
                borderRadius: 12,
                boxShadow: '0 4px 14px rgba(239,68,68,0.4)',
                display: 'flex',
              }}
            >
              PROMO -{remise}%
            </div>
          ) : (
            <div
              style={{
                position: 'absolute',
                top: 20,
                left: 20,
                zIndex: 10,
                background: '#0284c7',
                color: '#ffffff',
                fontSize: 18,
                fontWeight: 900,
                padding: '6px 14px',
                borderRadius: 12,
                boxShadow: '0 4px 12px rgba(2,132,199,0.3)',
                display: 'flex',
              }}
            >
              🔥 EN STOCK
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
                padding: 24,
                boxSizing: 'border-box',
              }}
            />
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
                color: '#64748b',
              }}
            >
              <span style={{ fontSize: 90 }}>🛍️</span>
              <span style={{ fontSize: 20, fontWeight: 700 }}>Photo en boutique</span>
            </div>
          )}
        </div>

        {/* ── COLONNE DROITE : IDENTITÉ BOUTIQUE + NOM + PRIX + CTA ── */}
        <div
          style={{
            flex: 1,
            height: 540,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxSizing: 'border-box',
          }}
        >
          {/* En-tête Boutique */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(12px)',
              border: '1.5px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 20,
              padding: '12px 20px',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {boutiqueLogo ? (
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    overflow: 'hidden',
                    background: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
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
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    fontWeight: 900,
                    color: '#ffffff',
                  }}
                >
                  {initiale}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 900,
                    color: '#ffffff',
                    display: 'flex',
                  }}
                >
                  {boutiqueNom}
                </span>
                <span
                  style={{
                    fontSize: 14,
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
                padding: '6px 14px',
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 800,
                color: '#ffffff',
                display: 'flex',
              }}
            >
              DISPONIBLE
            </div>
          </div>

          {/* Titre & Prix */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span
              style={{
                fontSize: 34,
                fontWeight: 900,
                color: '#ffffff',
                lineHeight: 1.2,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {nom}
            </span>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
              <span
                style={{
                  fontSize: 46,
                  fontWeight: 900,
                  color: '#22c55e',
                  letterSpacing: '-0.5px',
                  display: 'flex',
                }}
              >
                {prix}
              </span>
              {prixBarre && (
                <span
                  style={{
                    fontSize: 24,
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

          {/* Bannière de Contact Direct Marchand */}
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
                💬 Commandez en 1-Clic
              </span>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.92)',
                  display: 'flex',
                }}
              >
                {contact ? `WhatsApp : ${contact}` : 'Envoi direct commerçant'} · 🚚 Livraison rapide
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
              Voir la boutique →
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
