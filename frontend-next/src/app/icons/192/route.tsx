import { ImageResponse } from 'next/og'

// Icône PWA PNG 192x192 (purpose "any") — même dessin que app/apple-icon.tsx.
// runtime edge obligatoire : @vercel/og plante en runtime Node (chemin de police).
// Cachée à l'exécution par le SW (pattern /icons/ dans sw.js).
export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#C75B00',
          borderRadius: 42,
          fontFamily: 'system-ui, sans-serif',
          fontSize: 118, fontWeight: 900, color: '#fff',
          letterSpacing: -2,
        }}
      >
        N
      </div>
    ),
    { width: 192, height: 192 }
  )
}
