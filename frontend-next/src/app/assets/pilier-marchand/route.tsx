import { ImageResponse } from 'next/og'

export const runtime = 'edge'

// Visuel Dédié Pilier 2 — Marchand & Caisse POS Magasin (1080 x 1350 px)
export async function GET() {
  return new ImageResponse(
    (
      <div style={{
        width: 1080, height: 1350,
        display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(160deg, #0F172A 0%, #064E3B 65%, #022C22 100%)',
        fontFamily: 'system-ui, sans-serif',
        position: 'relative', color: '#FFFFFF',
        padding: 48, boxSizing: 'border-box',
        overflow: 'hidden',
      }}>
        {/* Cercles déco arrière-plan */}
        <div style={{
          position: 'absolute', right: -100, top: -100,
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.3) 0%, transparent 70%)',
          display: 'flex',
        }} />
        <div style={{
          position: 'absolute', left: -80, bottom: -80,
          width: 450, height: 450, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,140,0,0.2) 0%, transparent 70%)',
          display: 'flex',
        }} />

        {/* Top Accent Line */}
        <div style={{ height: 6, background: 'linear-gradient(90deg, #10B981, #34D399, #FF8C00)', display: 'flex', position: 'absolute', top: 0, left: 0, right: 0 }} />

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 60, height: 60, borderRadius: 16,
              background: '#10B981',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 36, fontWeight: 900, color: '#FFF',
            }}>N</div>
            <span style={{ fontSize: 40, fontWeight: 900, color: '#FFF' }}>
              Nopa<span style={{ color: '#10B981' }}>lou</span>
            </span>
          </div>
          <div style={{
            background: 'rgba(16,185,129,0.15)', border: '1.5px solid #10B981',
            borderRadius: 30, padding: '8px 20px', fontSize: 16, fontWeight: 800, color: '#34D399', display: 'flex',
          }}>
            🏪 PILIER 2 : MARCHAND &amp; CAISSE POS
          </div>
        </div>

        {/* HERO TITLE */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 32 }}>
          <span style={{ background: '#10B981', color: '#FFF', padding: '6px 20px', borderRadius: 20, fontSize: 14, fontWeight: 900, letterSpacing: 1, marginBottom: 12, display: 'flex' }}>
            SOLUTION ENREGISTREUSE CAISSE POS MAGASIN
          </span>
          <h1 style={{ fontSize: 46, fontWeight: 900, color: '#FFF', margin: 0, lineHeight: 1.15 }}>
            Digitalisez Votre Boutique physique &amp; En Ligne
          </h1>
          <p style={{ fontSize: 20, color: '#A7F3D0', marginTop: 10, marginBottom: 0 }}>
            Ventes en magasin, douchette scanner, gestion des dettes &amp; commandes WhatsApp
          </p>
        </div>

        {/* LISTE DES FONCTIONNALITÉS MARCHAND */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>

          {/* Feature 1 */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.85)', border: '1.5px solid rgba(16,185,129,0.4)', borderRadius: 20, padding: 20,
            display: 'flex', alignItems: 'center', gap: 20
          }}>
            <div style={{
              width: 60, height: 60, borderRadius: 16, background: 'rgba(16,185,129,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, flexShrink: 0
            }}>🖥️</div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontSize: 21, fontWeight: 900, color: '#34D399' }}>Caisse Tactile POS &amp; 3 Scanners</span>
              <span style={{ fontSize: 14, color: '#E2E8F0', marginTop: 4, lineHeight: 1.4 }}>
                Scanner Caméra Smartphone, Douchette Cloud Sync (&lt;100ms) et Douchette USB. Encaissement ultra-rapide en caisse.
              </span>
            </div>
          </div>

          {/* Feature 2 */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.85)', border: '1.5px solid rgba(16,185,129,0.4)', borderRadius: 20, padding: 20,
            display: 'flex', alignItems: 'center', gap: 20
          }}>
            <div style={{
              width: 60, height: 60, borderRadius: 16, background: 'rgba(16,185,129,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, flexShrink: 0
            }}>📓</div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontSize: 21, fontWeight: 900, color: '#FFF' }}>Carnet Dettes Client &amp; Relance WhatsApp 1-Clic</span>
              <span style={{ fontSize: 14, color: '#E2E8F0', marginTop: 4, lineHeight: 1.4 }}>
                Enregistrez les crédits clients et envoyez une relance WhatsApp personnalisée avec le solde exact en 1 seul clic.
              </span>
            </div>
          </div>

          {/* Feature 3 */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.85)', border: '1.5px solid rgba(16,185,129,0.4)', borderRadius: 20, padding: 20,
            display: 'flex', alignItems: 'center', gap: 20
          }}>
            <div style={{
              width: 60, height: 60, borderRadius: 16, background: 'rgba(16,185,129,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, flexShrink: 0
            }}>🏷️</div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontSize: 21, fontWeight: 900, color: '#34D399' }}>Générateur Codes-Barres &amp; Stickers GS1</span>
              <span style={{ fontSize: 14, color: '#E2E8F0', marginTop: 4, lineHeight: 1.4 }}>
                Générez des codes EAN-13 GS1 Modulo 10 et imprimez vos étiquettes prix / stickers (50x30mm) directement.
              </span>
            </div>
          </div>

          {/* Feature 4 */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.85)', border: '1.5px solid rgba(16,185,129,0.4)', borderRadius: 20, padding: 20,
            display: 'flex', alignItems: 'center', gap: 20
          }}>
            <div style={{
              width: 60, height: 60, borderRadius: 16, background: 'rgba(16,185,129,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, flexShrink: 0
            }}>💳</div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontSize: 21, fontWeight: 900, color: '#FFF' }}>Paiement Cash, Wave, OM + Multi-Caissiers PIN</span>
              <span style={{ fontSize: 14, color: '#E2E8F0', marginTop: 4, lineHeight: 1.4 }}>
                Encaissement multi-modes rapide, rôles d&apos;accès sécurisés par code PIN et suivi des clôtures de caisse (Z).
              </span>
            </div>
          </div>

        </div>

        {/* FOOTER CTA */}
        <div style={{
          background: '#10B981', borderRadius: 20, padding: '20px 32px', marginTop: 24,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 24, fontWeight: 900, color: '#FFF' }}>Essayez la Démo POS Commerciale</span>
            <span style={{ fontSize: 15, color: '#FFF', opacity: 0.9 }}>30 Jours d&apos;essai Pro offerts · Zéro installation</span>
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
    { width: 1080, height: 1350 }
  )
}
