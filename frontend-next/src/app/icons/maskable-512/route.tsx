import { ImageResponse } from 'next/og'

// Icône PWA maskable 512x512 : fond plein bord à bord (Android la rogne en
// cercle/squircle) + logo réduit dans la safe-zone de 20% — exigence maskable,
// distincte de l'icône "any" (qui a des coins arrondis et le logo plein cadre).
// runtime edge obligatoire : @vercel/og plante en runtime Node (chemin de police).
export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#C75B00',
          fontFamily: 'system-ui, sans-serif',
          fontSize: 245, fontWeight: 900, color: '#fff',
          letterSpacing: -5,
        }}
      >
        N
      </div>
    ),
    { width: 512, height: 512 }
  )
}
