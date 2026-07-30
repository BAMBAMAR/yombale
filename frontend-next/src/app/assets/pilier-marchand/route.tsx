import { ImageResponse } from 'next/og'

export const runtime = 'edge'

// Visuel Dédié Pilier 2 — Marchand & Caisse POS Magasin (Nopalou Identity, Maximum Sharpness)
export async function GET() {
  return new ImageResponse(
    (
      <div style={{
        width: 1080, height: 1350,
        display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(160deg, #FFFFFF 0%, #F8FAFC 50%, #FFF7ED 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        position: 'relative', color: '#1C2B4A',
        padding: 56, boxSizing: 'border-box',
        overflow: 'hidden',
      }}>
        {/* Bande de couleur Nopalou en haut */}
        <div style={{ height: 10, background: 'linear-gradient(90deg, #C75B00 0%, #16a34a 50%, #1C2B4A 100%)', display: 'flex', position: 'absolute', top: 0, left: 0, right: 0 }} />

        {/* HEADER BRANDING NOPALOU */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{
              width: 72, height: 72, borderRadius: 20,
              background: '#C75B00',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 44, fontWeight: 900, color: '#FFFFFF',
            }}>N</div>
            <span style={{ fontSize: 52, fontWeight: 900, color: '#1C2B4A', letterSpacing: -1 }}>
              Nopa<span style={{ color: '#C75B00' }}>lou</span>
            </span>
          </div>
          <div style={{
            background: '#F0FDF4', border: '2.5px solid #16a34a',
            borderRadius: 30, padding: '12px 28px', fontSize: 18, fontWeight: 900, color: '#16a34a', display: 'flex',
          }}>
            🏪 PILIER 2 : MARCHAND &amp; CAISSE POS
          </div>
        </div>

        {/* HERO TITLE */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 40 }}>
          <span style={{ background: '#16a34a', color: '#FFFFFF', padding: '8px 24px', borderRadius: 20, fontSize: 16, fontWeight: 900, letterSpacing: 1.5, marginBottom: 14, display: 'flex' }}>
            SOLUTION ENREGISTREUSE CAISSE POS MAGASIN
          </span>
          <h1 style={{ fontSize: 52, fontWeight: 900, color: '#1C2B4A', margin: 0, lineHeight: 1.15 }}>
            Digitalisez Votre Boutique Magasin &amp; En Ligne
          </h1>
          <p style={{ fontSize: 22, color: '#475569', fontWeight: 700, marginTop: 12, marginBottom: 0 }}>
            Ventes en magasin, douchette scanner, gestion des dettes &amp; commandes WhatsApp
          </p>
        </div>

        {/* CARDS DES FONCTIONNALITÉS HAUTE NETTETÉ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>

          {/* Feature 1 */}
          <div style={{
            background: '#FFFFFF', border: '3px solid #16a34a', borderRadius: 22, padding: 24,
            display: 'flex', alignItems: 'center', gap: 22,
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: 20, background: '#F0FDF4', border: '2px solid #16a34a',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, flexShrink: 0
            }}>🖥️</div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontSize: 26, fontWeight: 900, color: '#16a34a' }}>Caisse Tactile POS &amp; 3 Scanners</span>
              <span style={{ fontSize: 18, color: '#334155', fontWeight: 700, marginTop: 6, lineHeight: 1.45 }}>
                Scan Caméra Smartphone, Douchette Cloud Sync (&lt;100ms) et Douchette USB.
              </span>
            </div>
          </div>

          {/* Feature 2 */}
          <div style={{
            background: '#FFFFFF', border: '3px solid #C75B00', borderRadius: 22, padding: 24,
            display: 'flex', alignItems: 'center', gap: 22,
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: 20, background: '#FFF7ED', border: '2px solid #C75B00',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, flexShrink: 0
            }}>📓</div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontSize: 26, fontWeight: 900, color: '#C75B00' }}>Carnet Dettes Client &amp; Relance WA 1-Clic</span>
              <span style={{ fontSize: 18, color: '#334155', fontWeight: 700, marginTop: 6, lineHeight: 1.45 }}>
                Saisie des crédits + Relance WhatsApp 1-Clic automatique avec le solde exact.
              </span>
            </div>
          </div>

          {/* Feature 3 */}
          <div style={{
            background: '#FFFFFF', border: '3px solid #16a34a', borderRadius: 22, padding: 24,
            display: 'flex', alignItems: 'center', gap: 22,
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: 20, background: '#F0FDF4', border: '2px solid #16a34a',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, flexShrink: 0
            }}>🏷️</div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontSize: 26, fontWeight: 900, color: '#1C2B4A' }}>Générateur Codes-Barres &amp; Stickers GS1</span>
              <span style={{ fontSize: 18, color: '#334155', fontWeight: 700, marginTop: 6, lineHeight: 1.45 }}>
                Générez des codes EAN-13 GS1 Modulo 10 et imprimez vos étiquettes (50x30mm).
              </span>
            </div>
          </div>

          {/* Feature 4 */}
          <div style={{
            background: '#FFFFFF', border: '3px solid #1C2B4A', borderRadius: 22, padding: 24,
            display: 'flex', alignItems: 'center', gap: 22,
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: 20, background: '#F8FAFC', border: '2px solid #1C2B4A',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, flexShrink: 0
            }}>💳</div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontSize: 26, fontWeight: 900, color: '#1C2B4A' }}>Cash, Wave, OM + Multi-Caissiers PIN</span>
              <span style={{ fontSize: 18, color: '#334155', fontWeight: 700, marginTop: 6, lineHeight: 1.45 }}>
                Encaissement multi-modes rapide, sessions caissiers sécurisées et clôtures Z.
              </span>
            </div>
          </div>

        </div>

        {/* FOOTER CTA HAUTE VISIBILITÉ */}
        <div style={{
          background: '#1C2B4A', borderRadius: 24, padding: '24px 40px', marginTop: 24,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          border: '3px solid #16a34a',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 26, fontWeight: 900, color: '#FFFFFF' }}>Testez la Démo Commerciale POS</span>
            <span style={{ fontSize: 17, color: '#CBD5E1', fontWeight: 700, marginTop: 4 }}>30 Jours d&apos;essai Pro offerts · Zéro installation</span>
          </div>
          <div style={{
            background: '#16a34a', color: '#FFFFFF', padding: '16px 36px', borderRadius: 16,
            fontSize: 26, fontWeight: 900, display: 'flex',
          }}>
            nopalou.com/demo
          </div>
        </div>

      </div>
    ),
    { width: 1080, height: 1350 }
  )
}
