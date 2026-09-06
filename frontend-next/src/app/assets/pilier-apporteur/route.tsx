import { ImageResponse } from 'next/og'

export const runtime = 'edge'

// Visuel Dédié Pilier 3 — Apporteur d'Affaires 20% (Nopalou Identity, Maximum Sharpness)
export async function GET() {
  return new ImageResponse(
    (
      <div style={{
        width: 1080, height: 1350,
        display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(160deg, #FFFFFF 0%, #F8FAFC 50%, #FFF7ED 100%)',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        position: 'relative', color: '#1C2B4A',
        padding: 52, boxSizing: 'border-box',
        overflow: 'hidden',
      }}>
        {/* Bande de couleur Nopalou en haut */}
        <div style={{ height: 10, background: 'linear-gradient(90deg, #7C3AED 0%, #C75B00 50%, #1C2B4A 100%)', display: 'flex', position: 'absolute', top: 0, left: 0, right: 0 }} />

        {/* HEADER BRANDING NOPALOU */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <svg width="72" height="72" viewBox="0 0 512 512" style={{ display: 'block' }}>
              <defs>
                <linearGradient id="pilier3LogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FF7E22"/>
                  <stop offset="35%" stopColor="#EA580C"/>
                  <stop offset="70%" stopColor="#C75B00"/>
                  <stop offset="100%" stopColor="#9E3C00"/>
                </linearGradient>
              </defs>
              <rect x="26" y="26" width="460" height="460" rx="118" fill="url(#pilier3LogoGrad)"/>
              <path fillRule="evenodd" d="M120 108h272v296H120Z M324 108H188l136 198Z M188 404h136L188 206Z" fill="#FFFFFF"/>
            </svg>
            <span style={{ fontSize: 52, fontWeight: 900, color: '#1C2B4A', letterSpacing: -1, display: 'flex' }}>
              Nopa<span style={{ color: '#C75B00' }}>lou</span>
            </span>
          </div>
          <div style={{
            background: '#F3E8FF', border: '2px solid #7C3AED',
            borderRadius: 9999, padding: '10px 24px', fontSize: 17, fontWeight: 900, color: '#7C3AED', display: 'flex',
          }}>
            💼 PILIER 3 : APPORTEUR 20%
          </div>
        </div>

        {/* HERO TITLE */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 32 }}>
          <span style={{ background: '#7C3AED', color: '#FFFFFF', padding: '6px 22px', borderRadius: 9999, fontSize: 15, fontWeight: 900, letterSpacing: 1.5, marginBottom: 12, display: 'flex' }}>
            PROGRAMME DE PARRAINAGE N°1 AU SÉNÉGAL
          </span>
          <h1 style={{ fontSize: 48, fontWeight: 900, color: '#1C2B4A', margin: 0, lineHeight: 1.15, letterSpacing: -1.5 }}>
            Gagnez un Revenu Récurrent Mensuel
          </h1>
          <p style={{ fontSize: 21, color: '#7C3AED', fontWeight: 800, marginTop: 10, marginBottom: 0 }}>
            Recommandez Nopalou aux commerçants et percevez 20% sur chaque abonnement
          </p>
        </div>

        {/* CARDS DES FONCTIONNALITÉS HAUTE NETTETÉ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>

          {/* Feature 1 */}
          <div style={{
            background: '#FFFFFF', border: '2px solid #7C3AED', borderRadius: 20, padding: 22,
            display: 'flex', alignItems: 'center', gap: 20,
          }}>
            <div style={{
              width: 68, height: 68, borderRadius: 18, background: '#F3E8FF', border: '1.5px solid #7C3AED',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, flexShrink: 0
            }}>💰</div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontSize: 24, fontWeight: 900, color: '#7C3AED', letterSpacing: -0.5 }}>Commissions 20% Récurrentes à Vie</span>
              <span style={{ fontSize: 17, color: '#334155', fontWeight: 650, marginTop: 4, lineHeight: 1.4 }}>
                Versées chaque mois directement sur votre compte Wave ou Orange Money.
              </span>
            </div>
          </div>

          {/* Feature 2 */}
          <div style={{
            background: '#FFFFFF', border: '2px solid #C75B00', borderRadius: 20, padding: 22,
            display: 'flex', alignItems: 'center', gap: 20,
          }}>
            <div style={{
              width: 68, height: 68, borderRadius: 18, background: '#FFF7ED', border: '1.5px solid #C75B00',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, flexShrink: 0
            }}>📄</div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontSize: 24, fontWeight: 900, color: '#C75B00', letterSpacing: -0.5 }}>Brochure PDF 13 Pages &amp; Kit Commercial</span>
              <span style={{ fontSize: 17, color: '#334155', fontWeight: 650, marginTop: 4, lineHeight: 1.4 }}>
                Support de présentation terrain complet, argumentaires de vente &amp; visuels WhatsApp.
              </span>
            </div>
          </div>

          {/* Feature 3 */}
          <div style={{
            background: '#FFFFFF', border: '2px solid #1C2B4A', borderRadius: 20, padding: 22,
            display: 'flex', alignItems: 'center', gap: 20,
          }}>
            <div style={{
              width: 68, height: 68, borderRadius: 18, background: '#F8FAFC', border: '1.5px solid #1C2B4A',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, flexShrink: 0
            }}>📊</div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontSize: 24, fontWeight: 900, color: '#1C2B4A', letterSpacing: -0.5 }}>Dashboard &amp; Code Apporteur Personnel</span>
              <span style={{ fontSize: 17, color: '#334155', fontWeight: 650, marginTop: 4, lineHeight: 1.4 }}>
                Suivez vos commerçants parrainés et vos paiements mensuels en temps réel.
              </span>
            </div>
          </div>

          {/* Feature 4 */}
          <div style={{
            background: '#FFFFFF', border: '2px solid #7C3AED', borderRadius: 20, padding: 22,
            display: 'flex', alignItems: 'center', gap: 20,
          }}>
            <div style={{
              width: 68, height: 68, borderRadius: 18, background: '#F3E8FF', border: '1.5px solid #7C3AED',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, flexShrink: 0
            }}>🚀</div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontSize: 24, fontWeight: 900, color: '#7C3AED', letterSpacing: -0.5 }}>0 FCFA d&apos;Investissement · Sans Plafond</span>
              <span style={{ fontSize: 17, color: '#334155', fontWeight: 650, marginTop: 4, lineHeight: 1.4 }}>
                Aucun frais. Recrutez sans limite et construisez votre revenu passif mensuel.
              </span>
            </div>
          </div>

        </div>

        {/* FOOTER CTA HAUTE VISIBILITÉ */}
        <div style={{
          background: '#1C2B4A', borderRadius: 22, padding: '22px 36px', marginTop: 20,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          border: '2.5px solid #7C3AED',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 24, fontWeight: 900, color: '#FFFFFF', letterSpacing: -0.5 }}>Devenez Apporteur Nopalou dès aujourd&apos;hui</span>
            <span style={{ fontSize: 16, color: '#CBD5E1', fontWeight: 650, marginTop: 4 }}>Inscription 1-Clic · Paiements Wave / OM</span>
          </div>
          <div style={{
            background: '#7C3AED', color: '#FFFFFF', padding: '14px 32px', borderRadius: 14,
            fontSize: 22, fontWeight: 900, display: 'flex',
          }}>
            nopalou.com/apporteur
          </div>
        </div>

      </div>
    ),
    { width: 1080, height: 1350 }
  )
}
