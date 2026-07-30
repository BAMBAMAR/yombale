import { ImageResponse } from 'next/og'

export const runtime = 'edge'

// Visuel Dédié Pilier 1 — Acheteur & Consommateur (Bright & Sharp)
export async function GET() {
  return new ImageResponse(
    (
      <div style={{
        width: 1080, height: 1350,
        display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(160deg, #FFF7ED 0%, #FFFFFF 50%, #F1F5F9 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        position: 'relative', color: '#0F172A',
        padding: 48, boxSizing: 'border-box',
        overflow: 'hidden',
      }}>
        {/* Background shapes */}
        <div style={{
          position: 'absolute', right: -100, top: -100,
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(234,88,12,0.12) 0%, transparent 70%)',
          display: 'flex',
        }} />

        <div style={{ height: 8, background: '#EA580C', display: 'flex', position: 'absolute', top: 0, left: 0, right: 0 }} />

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 60, height: 60, borderRadius: 16,
              background: '#EA580C',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 36, fontWeight: 900, color: '#FFF',
              boxShadow: '0 8px 20px rgba(234,88,12,0.3)'
            }}>N</div>
            <span style={{ fontSize: 40, fontWeight: 900, color: '#0F172A' }}>
              Nopa<span style={{ color: '#EA580C' }}>lou</span>
            </span>
          </div>
          <div style={{
            background: '#FFF7ED', border: '2px solid #EA580C',
            borderRadius: 30, padding: '8px 22px', fontSize: 16, fontWeight: 900, color: '#EA580C', display: 'flex',
          }}>
            🛒 PILIER 1 : ACHETEUR
          </div>
        </div>

        {/* HERO TITLE */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 36 }}>
          <span style={{ background: '#EA580C', color: '#FFF', padding: '6px 22px', borderRadius: 20, fontSize: 14, fontWeight: 900, letterSpacing: 1, marginBottom: 12, display: 'flex' }}>
            100% GRATUIT &amp; SANS INSCRIPTION
          </span>
          <h1 style={{ fontSize: 48, fontWeight: 900, color: '#0F172A', margin: 0, lineHeight: 1.15 }}>
            Achetez au Meilleur Prix au Sénégal
          </h1>
          <p style={{ fontSize: 20, color: '#475569', marginTop: 10, marginBottom: 0 }}>
            Comparez les grandes surfaces, boutiques spécialisées &amp; vendeurs de Dakar
          </p>
        </div>

        {/* FEATURES */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}>

          <div style={{
            background: '#FFFFFF', border: '2px solid #EA580C', borderRadius: 20, padding: 22,
            display: 'flex', alignItems: 'center', gap: 20, boxShadow: '0 8px 20px rgba(234,88,12,0.06)'
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16, background: '#FFF7ED', border: '1px solid #FFEDD5',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, flexShrink: 0
            }}>🔍</div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontSize: 22, fontWeight: 900, color: '#0F172A' }}>Super-Comparateur Multi-Marchands</span>
              <span style={{ fontSize: 15, color: '#475569', marginTop: 4, lineHeight: 1.4 }}>
                Auchan, Carrefour, Expat-Dakar, Boutiques Nopalou Pro : trouvez quel vendeur est le moins cher.
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
            }}>🤖</div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontSize: 22, fontWeight: 900, color: '#059669' }}>Assistant Chatbot WhatsApp Meta 24/7</span>
              <span style={{ fontSize: 15, color: '#475569', marginTop: 4, lineHeight: 1.4 }}>
                Recherchez, comparez et commandez vos produits directement sur WhatsApp sans app.
              </span>
            </div>
          </div>

          <div style={{
            background: '#FFFFFF', border: '2px solid #0284C7', borderRadius: 20, padding: 22,
            display: 'flex', alignItems: 'center', gap: 20, boxShadow: '0 8px 20px rgba(2,132,199,0.06)'
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16, background: '#E0F2FE', border: '1px solid #BAE6FD',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, flexShrink: 0
            }}>🔔</div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontSize: 22, fontWeight: 900, color: '#0284C7' }}>Alertes Prix &amp; Immo</span>
              <span style={{ fontSize: 15, color: '#475569', marginTop: 4, lineHeight: 1.4 }}>
                Alertes automatiques lors des baisses de prix + accès aux biens immobiliers vérifiés &amp; forfaits télécom.
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
            }}>⚖️</div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontSize: 22, fontWeight: 900, color: '#0F172A' }}>Tableau Comparatif Côte à Côte</span>
              <span style={{ fontSize: 15, color: '#475569', marginTop: 4, lineHeight: 1.4 }}>
                Comparez jusqu&apos;à 3 produits simultanément avec fiches techniques et stocks en temps réel.
              </span>
            </div>
          </div>

        </div>

        {/* FOOTER */}
        <div style={{
          background: '#EA580C', borderRadius: 20, padding: '20px 32px', marginTop: 24,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          boxShadow: '0 10px 25px rgba(234,88,12,0.25)'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 24, fontWeight: 900, color: '#FFF' }}>Économisez sur vos achats dès maintenant</span>
            <span style={{ fontSize: 15, color: '#FFF', opacity: 0.95 }}>100% Gratuit · Auchan · Carrefour · Boutiques Dakar</span>
          </div>
          <div style={{
            background: '#FFF', color: '#0F172A', padding: '12px 28px', borderRadius: 12,
            fontSize: 22, fontWeight: 900, display: 'flex',
          }}>
            nopalou.com
          </div>
        </div>

      </div>
    ),
    { width: 1080, height: 1350 }
  )
}
