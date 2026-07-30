import { ImageResponse } from 'next/og'

export const runtime = 'edge'

// Visuel Dédié Pilier 1 — Acheteur & Consommateur (1080 x 1350 px)
export async function GET() {
  return new ImageResponse(
    (
      <div style={{
        width: 1080, height: 1350,
        display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(160deg, #1C2B4A 0%, #0F172A 65%, #020617 100%)',
        fontFamily: 'system-ui, sans-serif',
        position: 'relative', color: '#FFFFFF',
        padding: 48, boxSizing: 'border-box',
        overflow: 'hidden',
      }}>
        {/* Cercles déco arrière-plan */}
        <div style={{
          position: 'absolute', right: -100, top: -100,
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,140,0,0.3) 0%, transparent 70%)',
          display: 'flex',
        }} />
        <div style={{
          position: 'absolute', left: -80, bottom: -80,
          width: 450, height: 450, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(45,212,191,0.2) 0%, transparent 70%)',
          display: 'flex',
        }} />

        {/* Top Accent Line */}
        <div style={{ height: 6, background: 'linear-gradient(90deg, #FF8C00, #2DD4BF)', display: 'flex', position: 'absolute', top: 0, left: 0, right: 0 }} />

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 60, height: 60, borderRadius: 16,
              background: '#FF8C00',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 36, fontWeight: 900, color: '#FFF',
            }}>N</div>
            <span style={{ fontSize: 40, fontWeight: 900, color: '#FFF' }}>
              Nopa<span style={{ color: '#FF8C00' }}>lou</span>
            </span>
          </div>
          <div style={{
            background: 'rgba(255,140,0,0.15)', border: '1.5px solid #FF8C00',
            borderRadius: 30, padding: '8px 20px', fontSize: 16, fontWeight: 800, color: '#FF8C00', display: 'flex',
          }}>
            🛒 PILIER 1 : ACHETEUR
          </div>
        </div>

        {/* HERO TITLE */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 36 }}>
          <span style={{ background: '#FF8C00', color: '#FFF', padding: '6px 20px', borderRadius: 20, fontSize: 14, fontWeight: 900, letterSpacing: 1, marginBottom: 12, display: 'flex' }}>
            100% GRATUIT &amp; SANS INSCRIPTION
          </span>
          <h1 style={{ fontSize: 46, fontWeight: 900, color: '#FFF', margin: 0, lineHeight: 1.15 }}>
            Achetez au Meilleur Prix au Sénégal
          </h1>
          <p style={{ fontSize: 20, color: '#94A3B8', marginTop: 10, marginBottom: 0 }}>
            Comparez les grandes surfaces, boutiques spécialisées &amp; vendeurs de Dakar
          </p>
        </div>

        {/* LISTE DES FONCTIONNALITÉS ACHETEUR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}>

          {/* Feature 1 */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.85)', border: '1.5px solid rgba(255,140,0,0.4)', borderRadius: 20, padding: 22,
            display: 'flex', alignItems: 'center', gap: 20
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16, background: 'rgba(255,140,0,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, flexShrink: 0
            }}>🔍</div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>Super-Comparateur Multi-Marchands</span>
              <span style={{ fontSize: 15, color: '#CBD5E1', marginTop: 4, lineHeight: 1.4 }}>
                Auchan, Carrefour, Expat-Dakar, Boutiques Nopalou Pro : découvrez quel vendeur propose le prix le plus bas en un clin d&apos;œil.
              </span>
            </div>
          </div>

          {/* Feature 2 */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.85)', border: '1.5px solid rgba(37,211,102,0.4)', borderRadius: 20, padding: 22,
            display: 'flex', alignItems: 'center', gap: 20
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16, background: 'rgba(37,211,102,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, flexShrink: 0
            }}>🤖</div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontSize: 22, fontWeight: 900, color: '#25D366' }}>Assistant Chatbot WhatsApp Meta 24/7</span>
              <span style={{ fontSize: 15, color: '#CBD5E1', marginTop: 4, lineHeight: 1.4 }}>
                Recherche de produits, fiches détaillées, comparaison &amp; commande directe dans WhatsApp sans installer d&apos;application.
              </span>
            </div>
          </div>

          {/* Feature 3 */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.85)', border: '1.5px solid rgba(45,212,191,0.4)', borderRadius: 20, padding: 22,
            display: 'flex', alignItems: 'center', gap: 20
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16, background: 'rgba(45,212,191,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, flexShrink: 0
            }}>🔔</div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontSize: 22, fontWeight: 900, color: '#2DD4BF' }}>Alertes Baisses de Prix &amp; Annonces Immo</span>
              <span style={{ fontSize: 15, color: '#CBD5E1', marginTop: 4, lineHeight: 1.4 }}>
                Recevez une notification automatique WhatsApp dès qu&apos;un produit baisse. Accédez aux logements vérifiés &amp; forfaits télécom.
              </span>
            </div>
          </div>

          {/* Feature 4 */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.85)', border: '1.5px solid rgba(255,140,0,0.4)', borderRadius: 20, padding: 22,
            display: 'flex', alignItems: 'center', gap: 20
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16, background: 'rgba(255,140,0,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, flexShrink: 0
            }}>⚖️</div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>Tableau Comparatif Côte à Côte</span>
              <span style={{ fontSize: 15, color: '#CBD5E1', marginTop: 4, lineHeight: 1.4 }}>
                Sélectionnez jusqu&apos;à 3 articles pour analyser stocks, prix, fiches techniques et avis vendeurs.
              </span>
            </div>
          </div>

        </div>

        {/* FOOTER CTA */}
        <div style={{
          background: '#FF8C00', borderRadius: 20, padding: '20px 32px', marginTop: 24,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 24, fontWeight: 900, color: '#FFF' }}>Économisez sur vos achats dès aujourd&apos;hui</span>
            <span style={{ fontSize: 15, color: '#FFF', opacity: 0.9 }}>100% Gratuit · Auchan · Carrefour · Boutiques Dakar</span>
          </div>
          <div style={{
            background: '#FFF', color: '#1C2B4A', padding: '12px 28px', borderRadius: 12,
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
