import { ImageResponse } from 'next/og'

export const runtime = 'edge'

async function getCustomFont() {
  try {
    const res = await fetch('https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.ttf')
    if (res.ok) {
      return await res.arrayBuffer()
    }
  } catch {
    // fallback
  }
  return null
}

// Visuel Dédié Pilier 2 — Marchand & Caisse POS Magasin (Bright & Sharp)
export async function GET() {
  const fontData = await getCustomFont()
  const fontOptions = fontData ? [{ name: 'Inter', data: fontData, style: 'normal' as const, weight: 700 as const }] : []

  return new ImageResponse(
    (
      <div style={{
        width: 1080, height: 1350,
        display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(160deg, #ECFDF5 0%, #FFFFFF 50%, #F0FDF4 100%)',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        position: 'relative', color: '#0F172A',
        padding: 48, boxSizing: 'border-box',
        overflow: 'hidden',
      }}>
        {/* Background shapes */}
        <div style={{
          position: 'absolute', right: -100, top: -100,
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(5,150,105,0.12) 0%, transparent 70%)',
          display: 'flex',
        }} />

        <div style={{ height: 8, background: '#059669', display: 'flex', position: 'absolute', top: 0, left: 0, right: 0 }} />

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 60, height: 60, borderRadius: 16,
              background: '#059669',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 36, fontWeight: 900, color: '#FFF',
              boxShadow: '0 8px 20px rgba(5,150,105,0.3)'
            }}>N</div>
            <span style={{ fontSize: 40, fontWeight: 900, color: '#0F172A' }}>
              Nopa<span style={{ color: '#059669' }}>lou</span>
            </span>
          </div>
          <div style={{
            background: '#ECFDF5', border: '2px solid #059669',
            borderRadius: 30, padding: '8px 22px', fontSize: 16, fontWeight: 900, color: '#059669', display: 'flex',
          }}>
            🏪 PILIER 2 : MARCHAND &amp; CAISSE POS
          </div>
        </div>

        {/* HERO TITLE */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 36 }}>
          <span style={{ background: '#059669', color: '#FFF', padding: '6px 22px', borderRadius: 20, fontSize: 14, fontWeight: 900, letterSpacing: 1, marginBottom: 12, display: 'flex' }}>
            SOLUTION ENREGISTREUSE CAISSE POS MAGASIN
          </span>
          <h1 style={{ fontSize: 48, fontWeight: 900, color: '#0F172A', margin: 0, lineHeight: 1.15 }}>
            Digitalisez Votre Boutique Magasin &amp; En Ligne
          </h1>
          <p style={{ fontSize: 20, color: '#047857', marginTop: 10, marginBottom: 0 }}>
            Ventes en magasin, douchette scanner, gestion des dettes &amp; commandes WhatsApp
          </p>
        </div>

        {/* FEATURES */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}>

          <div style={{
            background: '#FFFFFF', border: '2px solid #059669', borderRadius: 20, padding: 22,
            display: 'flex', alignItems: 'center', gap: 20, boxShadow: '0 8px 20px rgba(5,150,105,0.06)'
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16, background: '#ECFDF5', border: '1px solid #A7F3D0',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, flexShrink: 0
            }}>🖥️</div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontSize: 22, fontWeight: 900, color: '#059669' }}>Caisse Tactile POS &amp; 3 Scanners</span>
              <span style={{ fontSize: 15, color: '#334155', marginTop: 4, lineHeight: 1.4 }}>
                Scan Caméra Smartphone, Douchette Cloud Sync (&lt;100ms) et Douchette USB.
              </span>
            </div>
          </div>

          <div style={{
            background: '#FFFFFF', border: '2px solid #EA580C', borderRadius: 20, padding: 22,
            display: 'flex', alignItems: 'center', gap: 20, boxShadow: '0 8px 20px rgba(234,88,12,0.06)'
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16, background: '#FFF7ED', border: '1px solid #FFEDD5',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, flexShrink: 0
            }}>📓</div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontSize: 22, fontWeight: 900, color: '#EA580C' }}>Carnet Dettes Client &amp; Relance WA 1-Clic</span>
              <span style={{ fontSize: 15, color: '#334155', marginTop: 4, lineHeight: 1.4 }}>
                Saisie des crédits + Relance WhatsApp 1-Clic automatique avec le solde exact.
              </span>
            </div>
          </div>

          <div style={{
            background: '#FFFFFF', border: '2px solid #059669', borderRadius: 20, padding: 22,
            display: 'flex', alignItems: 'center', gap: 20, boxShadow: '0 8px 20px rgba(5,150,105,0.06)'
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16, background: '#ECFDF5', border: '1px solid #A7F3D0',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, flexShrink: 0
            }}>🏷️</div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontSize: 22, fontWeight: 900, color: '#0F172A' }}>Générateur Codes-Barres &amp; Stickers GS1</span>
              <span style={{ fontSize: 15, color: '#334155', marginTop: 4, lineHeight: 1.4 }}>
                Générez des codes EAN-13 GS1 Modulo 10 et imprimez vos étiquettes (50x30mm).
              </span>
            </div>
          </div>

          <div style={{
            background: '#FFFFFF', border: '2px solid #059669', borderRadius: 20, padding: 22,
            display: 'flex', alignItems: 'center', gap: 20, boxShadow: '0 8px 20px rgba(5,150,105,0.06)'
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16, background: '#ECFDF5', border: '1px solid #A7F3D0',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, flexShrink: 0
            }}>💳</div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontSize: 22, fontWeight: 900, color: '#0F172A' }}>Paiement Cash, Wave, OM + Multi-Caissiers PIN</span>
              <span style={{ fontSize: 15, color: '#334155', marginTop: 4, lineHeight: 1.4 }}>
                Encaissement multi-modes rapide, sessions caissiers sécurisées et clôtures Z.
              </span>
            </div>
          </div>

        </div>

        {/* FOOTER */}
        <div style={{
          background: '#059669', borderRadius: 20, padding: '20px 32px', marginTop: 24,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          boxShadow: '0 10px 25px rgba(5,150,105,0.25)'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 24, fontWeight: 900, color: '#FFF' }}>Testez la Démo Commerciale Caisse POS</span>
            <span style={{ fontSize: 15, color: '#FFF', opacity: 0.95 }}>30 Jours d&apos;essai Pro offerts · Zéro installation</span>
          </div>
          <div style={{
            background: '#FFF', color: '#064E3B', padding: '12px 28px', borderRadius: 12,
            fontSize: 22, fontWeight: 900, display: 'flex',
          }}>
            nopalou.com/demo
          </div>
        </div>

      </div>
    ),
    { width: 1080, height: 1350, fonts: fontOptions }
  )
}
