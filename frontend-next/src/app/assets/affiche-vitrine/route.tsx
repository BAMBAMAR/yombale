import { ImageResponse } from 'next/og'
import QRCode from 'qrcode-svg'

export const dynamic = 'force-dynamic'

function qrDataUri(text: string) {
  const svg = new QRCode({ content: text, padding: 0, width: 280, height: 280, color: '#1C2B4A', background: '#ffffff' }).svg()
  const base64 = Buffer.from(svg).toString('base64')
  return `data:image/svg+xml;base64,${base64}`
}

// Affiche Vitrine & Comptoir (1240 × 1748 px) — À poser chez les commerçants partenaires
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const boutiqueNom = searchParams.get('boutique') || 'VOTRE BOUTIQUE'
  const boutiqueSlug = searchParams.get('slug') || 'boutique'
  const boutiquePhone = searchParams.get('phone') || '+221 70 871 79 42'

  const qr = qrDataUri(`https://nopalou.com/boutiques/${encodeURIComponent(boutiqueSlug)}`)

  return new ImageResponse(
    (
      <div style={{
        width: 1240, height: 1748,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center',
        background: '#ffffff',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        position: 'relative',
        padding: '64px 80px',
        textAlign: 'center',
      }}>
        {/* Bande supérieure */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 20, background: '#C75B00', display: 'flex' }} />

        {/* Header Partenaire */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16,
          background: '#FFF7ED', border: '2px solid #FED7AA',
          borderRadius: 40, padding: '12px 32px', marginBottom: 36,
        }}>
          <span style={{ fontSize: 24 }}>⭐</span>
          <span style={{ fontSize: 22, fontWeight: 900, color: '#C75B00', letterSpacing: '0.05em' }}>
            COMMERCE PARTENAIRE OFFICIEL NOPALOU
          </span>
        </div>

        {/* Nom de la Boutique */}
        <h1 style={{
          fontSize: 64, fontWeight: 900, color: '#1C2B4A',
          margin: '0 0 16px', lineHeight: 1.1,
        }}>
          {boutiqueNom}
        </h1>

        <p style={{ fontSize: 30, fontWeight: 700, color: '#64748B', margin: '0 0 48px', maxWidth: 900 }}>
          Commandez directement sur notre catalogue en ligne et recevez vos articles à Dakar !
        </p>

        {/* Bloc Grand Format QR Code */}
        <div style={{
          background: '#F8FAFC', border: '4px solid #1C2B4A',
          borderRadius: 36, padding: '40px', display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 20, boxShadow: '0 20px 40px rgba(0,0,0,0.06)',
        }}>
          <div style={{
            background: '#fff', borderRadius: 24, padding: '24px',
            border: '2px solid #E2E8F0', display: 'flex',
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} width={280} height={280} alt="QR Catalogue" />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 32 }}>📲</span>
            <span style={{ fontSize: 28, fontWeight: 900, color: '#1C2B4A' }}>
              Scannez pour voir tous nos articles &amp; prix
            </span>
          </div>
        </div>

        {/* 3 Avantages Clients */}
        <div style={{
          display: 'flex', gap: 24, width: '100%',
          marginTop: 48,
        }}>
          {[
            { icon: '💬', titre: 'Commande WhatsApp', desc: 'Directe avec nous' },
            { icon: '🏷️', titre: 'Prix & Stock en Direct', desc: 'Mis à jour en temps réel' },
            { icon: '🚀', titre: 'Livraison Rapide', desc: 'À domicile ou retrait' },
          ].map((a, i) => (
            <div key={i} style={{
              flex: 1, background: '#FFF7ED', border: '2px solid #FFEDD5',
              borderRadius: 20, padding: '20px 16px', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 6,
            }}>
              <span style={{ fontSize: 36 }}>{a.icon}</span>
              <span style={{ fontSize: 20, fontWeight: 900, color: '#C75B00' }}>{a.titre}</span>
              <span style={{ fontSize: 15, color: '#64748B', fontWeight: 600 }}>{a.desc}</span>
            </div>
          ))}
        </div>

        <div style={{ flex: 1, display: 'flex' }} />

        {/* Footer Contact */}
        <div style={{
          width: '100%', background: '#1C2B4A', borderRadius: 24, padding: '28px 40px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <svg width="54" height="54" viewBox="0 0 512 512" style={{ display: 'block' }}>
              <defs>
                <linearGradient id="afficheVitrineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FF7E22"/>
                  <stop offset="35%" stopColor="#EA580C"/>
                  <stop offset="70%" stopColor="#C75B00"/>
                  <stop offset="100%" stopColor="#9E3C00"/>
                </linearGradient>
              </defs>
              <rect x="26" y="26" width="460" height="460" rx="118" fill="url(#afficheVitrineGrad)"/>
              <path fillRule="evenodd" d="M120 108h272v296H120Z M324 108H188l136 198Z M188 404h136L188 206Z" fill="#FFFFFF"/>
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
              <span style={{ fontSize: 24, fontWeight: 900, color: '#fff' }}>
                Vitrine propulsée par Nopalou.com
              </span>
              <span style={{ fontSize: 16, color: '#94A3B8' }}>
                Le comparateur de prix &amp; plateforme marchande N°1 au Sénégal
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: 14, color: '#38BDF8', fontWeight: 800 }}>COMMANDE DIRECTE</span>
            <span style={{ fontSize: 24, color: '#fff', fontWeight: 900 }}>{boutiquePhone}</span>
          </div>
        </div>
      </div>
    ),
    { width: 1240, height: 1748 }
  )
}
