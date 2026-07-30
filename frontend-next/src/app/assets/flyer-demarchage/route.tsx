import { ImageResponse } from 'next/og'

export const runtime = 'edge'

// Flyer A5 imprimable — démarchage terrain commerçants
export async function GET() {
  return new ImageResponse(
    (
      <div style={{
        width: 1240, height: 1748,
        display: 'flex', flexDirection: 'column',
        background: '#ffffff',
        fontFamily: 'system-ui, sans-serif',
        position: 'relative',
      }}>
        {/* Bande orange top */}
        <div style={{ height: 16, background: '#C75B00', display: 'flex' }} />

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 20,
          padding: '56px 80px 0',
        }}>
          <div style={{
            width: 84, height: 84, borderRadius: 20,
            background: '#C75B00',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 48, fontWeight: 900, color: '#fff',
          }}>N</div>
          <span style={{ fontSize: 52, fontWeight: 900, color: '#1C2B4A' }}>
            Nopa<span style={{ color: '#C75B00' }}>lou</span>
          </span>
        </div>

        {/* Titre accroche */}
        <div style={{ padding: '48px 80px 0', display: 'flex', flexDirection: 'column' }}>
          <p style={{
            fontSize: 56, fontWeight: 900, color: '#1C2B4A',
            margin: 0, lineHeight: 1.15,
          }}>
            Votre boutique visible.<br />Vos clients sur WhatsApp.
          </p>
          <p style={{ fontSize: 26, color: '#64748B', marginTop: 24, lineHeight: 1.5 }}>
            Rejoignez Nopalou, le comparateur de prix N°1 au Sénégal
          </p>
        </div>

        {/* Avantages */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 20,
          padding: '56px 80px 0',
        }}>
          {[
            '30 jours d\'essai Pro offerts',
            'Caisse POS Tactile (3 Scanners: Caméra, Cloud <100ms, USB)',
            'Carnet de Dettes Client & Relance WhatsApp 1-Clic',
            'Stickers Codes-Barres EAN-13 GS1 Modulo 10',
            'Commandes clients reçues directement sur WhatsApp',
            'Démo Commerciale POS en 1-clic : nopalou.com/demo',
          ].map(txt => (
            <div key={txt} style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: '#FFF7ED', border: '2px solid #C75B00',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, color: '#C75B00', fontWeight: 900, flexShrink: 0,
              }}>✓</div>
              <span style={{ fontSize: 28, color: '#1C2B4A', fontWeight: 600 }}>{txt}</span>
            </div>
          ))}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1, display: 'flex' }} />

        {/* Bloc CTA + contact */}
        <div style={{
          margin: '0 80px 56px',
          background: '#1C2B4A',
          borderRadius: 24, padding: '48px 56px',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <span style={{ fontSize: 30, color: '#fff', fontWeight: 800 }}>
            Découvrez la Démo POS &amp; Créez votre boutique
          </span>
          <span style={{ fontSize: 34, color: '#C75B00', fontWeight: 900 }}>
            nopalou.com/demo · nopalou.com/boutique
          </span>
          <span style={{ fontSize: 22, color: '#94A3B8', marginTop: 8 }}>
            Ou contactez-nous directement sur WhatsApp (+221 70 871 79 42)
          </span>
        </div>
      </div>
    ),
    { width: 1240, height: 1748 }
  )
}
