import { ImageResponse } from 'next/og'

export const runtime = 'edge'

// Logo fond blanc — idéal pour documents, présentations, presse
export async function GET() {
  return new ImageResponse(
    (
      <div style={{
        width: 800, height: 800,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: '#ffffff',
      }}>
        <div style={{
          width: 320, height: 320, borderRadius: 72,
          background: '#C75B00',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 200, fontWeight: 900, color: '#fff',
          marginBottom: 48,
        }}>N</div>
        <span style={{
          fontSize: 96, fontWeight: 900, color: '#1C2B4A', letterSpacing: -2,
        }}>
          Nopa<span style={{ color: '#C75B00' }}>lou</span>
        </span>
        <span style={{ fontSize: 28, color: '#64748B', marginTop: 16 }}>
          nopalou.com
        </span>
      </div>
    ),
    { width: 800, height: 800 }
  )
}
