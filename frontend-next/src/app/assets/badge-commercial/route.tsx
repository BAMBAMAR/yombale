import { ImageResponse } from 'next/og'
import QRCode from 'qrcode-svg'

export const dynamic = 'force-dynamic'

function qrDataUri(text: string) {
  const svg = new QRCode({ content: text, padding: 0, width: 140, height: 140, color: '#1C2B4A', background: '#ffffff' }).svg()
  const base64 = Buffer.from(svg).toString('base64')
  return `data:image/svg+xml;base64,${base64}`
}

// Badge d'Accréditation & Carte Commercial Officiel (1050 × 650 px)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const agentNom = searchParams.get('nom') || 'CONSEILLER COMMERCIAL'
  const codeAgent = searchParams.get('code') || 'AGENT-221'
  const agentPhone = searchParams.get('phone') || '+221 70 871 79 42'

  const qr = qrDataUri(`https://nopalou.com/creer-boutique?ref=${encodeURIComponent(codeAgent)}`)

  // Calcul adaptatif pour éviter tout débordement de nom
  const nomFontSize = agentNom.length > 25 ? 26 : agentNom.length > 18 ? 32 : 38

  return new ImageResponse(
    (
      <div style={{
        width: 1050, height: 650,
        display: 'flex',
        background: 'linear-gradient(135deg, #1C2B4A 0%, #0F172A 100%)',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Bande latérale orange */}
        <div style={{
          position: 'absolute', top: 0, left: 0, bottom: 0, width: 12,
          background: '#C75B00', display: 'flex',
        }} />

        {/* Forme décorative */}
        <div style={{
          position: 'absolute', right: -60, top: -60,
          width: 320, height: 320, borderRadius: '50%',
          background: 'rgba(199, 91, 0, 0.12)', display: 'flex',
        }} />

        {/* Contenu gauche */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between', padding: '48px 48px 48px 64px',
          minWidth: 0,
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <svg width="60" height="60" viewBox="0 0 512 512" style={{ display: 'block' }}>
                <defs>
                  <linearGradient id="badgeLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FF7E22"/>
                    <stop offset="35%" stopColor="#EA580C"/>
                    <stop offset="70%" stopColor="#C75B00"/>
                    <stop offset="100%" stopColor="#9E3C00"/>
                  </linearGradient>
                </defs>
                <rect x="26" y="26" width="460" height="460" rx="118" fill="url(#badgeLogoGrad)"/>
                <path fillRule="evenodd" d="M120 108h272v296H120Z M324 108H188l136 198Z M188 404h136L188 206Z" fill="#FFFFFF"/>
              </svg>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 36, fontWeight: 900, color: '#fff', letterSpacing: -1 }}>
                  Nopa<span style={{ color: '#C75B00' }}>lou</span>
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em' }}>
                  REPRÉSENTANT OFFICIEL TERRAIN
                </span>
              </div>
            </div>

            <div style={{
              background: '#16A34A', color: '#fff', fontSize: 12, fontWeight: 900,
              padding: '6px 14px', borderRadius: 9999, letterSpacing: '0.05em',
            }}>
              ACCRÉDITÉ 2026
            </div>
          </div>

          {/* Identité de l'Agent */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, color: '#F97316', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              CONSEILLER MARCHANDS &amp; DIGITALISATION
            </span>
            <span style={{ fontSize: nomFontSize, fontWeight: 900, color: '#fff', letterSpacing: -0.5, lineHeight: 1.15 }}>
              {agentNom}
            </span>
            <div style={{ display: 'flex', gap: 20, marginTop: 4 }}>
              <span style={{ fontSize: 18, color: '#38BDF8', fontWeight: 800 }}>
                📞 {agentPhone}
              </span>
              <span style={{ fontSize: 18, color: '#E2E8F0', fontWeight: 700 }}>
                ID : {codeAgent}
              </span>
            </div>
          </div>

          {/* Footer de la carte */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 16,
          }}>
            <span style={{ fontSize: 13, color: '#94A3B8' }}>
              Plateforme N°1 de Commerce &amp; Caisse POS au Sénégal · nopalou.com
            </span>
            <span style={{ fontSize: 13, color: '#F97316', fontWeight: 800 }}>
              Scannez pour valider l&apos;accréditation
            </span>
          </div>
        </div>

        {/* Bloc QR Code Droite */}
        <div style={{
          width: 260, background: 'rgba(255,255,255,0.04)',
          borderLeft: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 16, padding: '32px',
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} width={140} height={140} alt="QR Code" />
          </div>
          <span style={{ fontSize: 13, color: '#CBD5E1', textAlign: 'center', fontWeight: 700 }}>
            Scanner pour créer votre boutique avec ce conseiller
          </span>
        </div>
      </div>
    ),
    { width: 1050, height: 650 }
  )
}
