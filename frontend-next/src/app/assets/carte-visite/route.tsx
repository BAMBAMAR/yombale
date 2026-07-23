import { ImageResponse } from 'next/og'
import QRCode from 'qrcode-svg'

export const dynamic = 'force-dynamic'

function qrDataUri(text: string) {
  const svg = new QRCode({ content: text, padding: 0, width: 200, height: 200, color: '#1C2B4A', background: '#ffffff' }).svg()
  const base64 = Buffer.from(svg).toString('base64')
  return `data:image/svg+xml;base64,${base64}`
}

// Carte de visite numérique — à partager par WhatsApp lors du démarchage
export async function GET() {
  const qr = qrDataUri('https://nopalou.com')
  return new ImageResponse(
    (
      <div style={{
        width: 1050, height: 600,
        display: 'flex',
        background: 'linear-gradient(135deg, #1C2B4A 0%, #0f1d35 100%)',
        fontFamily: 'system-ui, sans-serif',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', right: -100, top: -100,
          width: 400, height: 400, borderRadius: '50%',
          background: 'rgba(199,91,0,0.15)', display: 'flex',
        }} />
        <div style={{
          position: 'absolute', top: 0, left: 0, bottom: 0,
          width: 6, background: '#C75B00', display: 'flex',
        }} />

        {/* Contenu gauche */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          justifyContent: 'center', padding: '0 0 0 64px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 12,
              background: '#C75B00',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 30, fontWeight: 900, color: '#fff',
            }}>N</div>
            <span style={{ fontSize: 34, fontWeight: 900, color: '#fff' }}>
              Nopa<span style={{ color: '#C75B00' }}>lou</span>
            </span>
          </div>

          <p style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>
            Comparateur de prix N°1 au Sénégal
          </p>
          <p style={{ fontSize: 18, color: '#94A3B8', margin: '0 0 32px' }}>
            Produits · Immobilier · Télécom
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span style={{ fontSize: 20, color: '#C75B00', fontWeight: 700 }}>
              🌐 nopalou.com
            </span>
            <span style={{ fontSize: 20, color: '#CBD5E1' }}>
              💬 Contact WhatsApp direct
            </span>
          </div>
        </div>

        {/* Bloc QR droite */}
        <div style={{
          width: 340, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,255,255,0.05)',
          borderLeft: '1px solid rgba(255,255,255,0.1)',
          gap: 16,
        }}>
          <div style={{
            width: 200, height: 200, background: '#fff',
            borderRadius: 16, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            padding: 12,
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} width={176} height={176} alt="QR nopalou.com" />
          </div>
          <span style={{ fontSize: 15, color: '#94A3B8' }}>
            Scannez pour visiter
          </span>
        </div>
      </div>
    ),
    { width: 1050, height: 600 }
  )
}
