import { ImageResponse } from 'next/og'
import { apiFetch } from '@/lib/api'

export const runtime = 'edge'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

interface Produit {
  id: number
  nom: string
  marque: string | null
  categorie_nom: string | null
  prix_min: number | null
  image_url: string | null
}

function fcfa(n: number | null) {
  if (!n) return '—'
  return new Intl.NumberFormat('fr-SN').format(n) + ' FCFA'
}

export default async function OgImage({ params }: { params: { id: string } }) {
  let produit: Produit | null = null
  try {
    produit = await apiFetch<Produit>(`/produits/${params.id}`)
  } catch { /* fallback générique */ }

  const nom     = produit?.nom    ?? 'Produit'
  const marque  = produit?.marque ?? ''
  const prix    = fcfa(produit?.prix_min ?? null)
  const categorie = produit?.categorie_nom ?? 'Nopalou'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%',
          display: 'flex',
          background: 'linear-gradient(135deg, #1C2B4A 0%, #0f1d35 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Colonne gauche */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          justifyContent: 'center', padding: '60px 48px',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
            <svg width="44" height="44" viewBox="0 0 512 512" style={{ display: 'block' }}>
              <defs>
                <linearGradient id="ogProdGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FF7E22"/>
                  <stop offset="35%" stopColor="#EA580C"/>
                  <stop offset="70%" stopColor="#C75B00"/>
                  <stop offset="100%" stopColor="#9E3C00"/>
                </linearGradient>
              </defs>
              <rect x="26" y="26" width="460" height="460" rx="118" fill="url(#ogProdGrad)"/>
              <path fillRule="evenodd" d="M120 108h272v296H120Z M324 108H188l136 198Z M188 404h136L188 206Z" fill="#FFFFFF"/>
            </svg>
            <span style={{ fontSize: 28, fontWeight: 800, color: '#fff', display: 'flex' }}>
              Nopa<span style={{ color: '#C75B00' }}>lou</span>
            </span>
          </div>

          {/* Catégorie */}
          <span style={{
            fontSize: 16, color: '#C75B00', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12,
            display: 'flex',
          }}>{categorie}</span>

          {/* Nom produit */}
          <h1 style={{
            fontSize: nom.length > 40 ? 32 : 40,
            fontWeight: 800, color: '#fff',
            margin: '0 0 8px', lineHeight: 1.2,
            maxWidth: 560,
          }}>
            {marque ? `${marque} ` : ''}{nom}
          </h1>

          {/* Prix */}
          <div style={{
            display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 24,
          }}>
            <span style={{ fontSize: 18, color: '#94A3B8' }}>À partir de</span>
            <span style={{ fontSize: 44, fontWeight: 900, color: '#C75B00' }}>{prix}</span>
          </div>

          {/* CTA */}
          <div style={{
            marginTop: 32, display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              background: '#C75B00', borderRadius: 10,
              padding: '12px 24px',
              fontSize: 18, fontWeight: 700, color: '#fff',
              display: 'flex',
            }}>
              Comparer les prix
            </div>
          </div>
        </div>

        {/* Colonne droite — image produit */}
        {produit?.image_url && (
          <div style={{
            width: 380, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.04)',
            padding: 40,
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={produit.image_url}
              alt={nom}
              style={{ maxWidth: 300, maxHeight: 420, objectFit: 'contain' }}
            />
          </div>
        )}
      </div>
    ),
    { ...size }
  )
}
