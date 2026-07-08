import { ImageResponse } from 'next/og'
import { apiFetch } from '@/lib/api'

export const runtime = 'edge'

interface ProduitDetail {
  id: string
  nom: string
  prix: number | null
  prix_barre: number | null
  images: string[]
  boutique_nom: string
  boutique_logo: string | null
}

function fcfa(n: number | null) {
  if (!n) return 'Prix à négocier'
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
    } catch { /* fallback générique ci-dessous */ }
  }

  const nom = produit?.nom ?? 'Produit'
  const prix = fcfa(produit?.prix ?? null)
  const prixBarre = produit?.prix_barre ? fcfa(produit.prix_barre) : null
  const boutiqueNom = produit?.boutique_nom ?? 'Nopalou'
  const image = produit?.images?.[0] ?? null

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

        {/* Photo produit */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '50px 70px', minHeight: 0,
        }}>
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={nom} style={{ maxWidth: '100%', maxHeight: 760, objectFit: 'contain', borderRadius: 20 }} />
          ) : (
            <div style={{
              width: 500, height: 500, borderRadius: 24, background: 'rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 140,
            }}>📦</div>
          )}
        </div>

        {/* Infos produit */}
        <div style={{ display: 'flex', flexDirection: 'column', padding: '0 70px 60px', gap: 16 }}>
          <p style={{
            fontSize: 46, fontWeight: 900, color: '#fff', margin: 0, lineHeight: 1.2,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {nom}
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
            <span style={{ fontSize: 52, fontWeight: 900, color: '#fff' }}>{prix}</span>
            {prixBarre && (
              <span style={{ fontSize: 28, color: 'rgba(255,255,255,0.5)', textDecoration: 'line-through' }}>{prixBarre}</span>
            )}
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginTop: 12,
            background: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: '16px 20px', width: 'fit-content',
          }}>
            <span style={{ fontSize: 24 }}>🏪</span>
            <span style={{ fontSize: 26, fontWeight: 700, color: '#fff' }}>{boutiqueNom}</span>
          </div>
        </div>
      </div>
    ),
    { width: 1080, height: 1920 }
  )
}
