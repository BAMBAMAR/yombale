import { ImageResponse } from 'next/og'

// Icône PWA PNG 512x512 (purpose "any").
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
          borderRadius: 112,
          fontFamily: 'system-ui, sans-serif',
          fontSize: 314, fontWeight: 900, color: '#fff',
          letterSpacing: -6,
        }}
      >
        N
      </div>
    ),
    { width: 512, height: 512 }
  )
}
