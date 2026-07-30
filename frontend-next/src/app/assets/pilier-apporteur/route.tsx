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
        fontFamily: 'system-ui, -apple-system, sans-serif',
        position: 'relative', color: '#1C2B4A',
        padding: 56, boxSizing: 'border-box',
        overflow: 'hidden',
      }}>
        {/* Bande de couleur Nopalou en haut */}
        <div style={{ height: 10, background: 'linear-gradient(90deg, #7C3AED 0%, #C75B00 50%, #1C2B4A 100%)', display: 'flex', position: 'absolute', top: 0, left: 0, right: 0 }} />

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
            background: '#F3E8FF', border: '2.5px solid #7C3AED',
            borderRadius: 30, padding: '12px 28px', fontSize: 18, fontWeight: 900, color: '#7C3AED', display: 'flex',
          }}>
            💼 PILIER 3 : APPORTEUR 20%
          </div>
        </div>

        {/* HERO TITLE */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 40 }}>
          <span style={{ background: '#7C3AED', color: '#FFFFFF', padding: '8px 24px', borderRadius: 20, fontSize: 16, fontWeight: 900, letterSpacing: 1.5, marginBottom: 14, display: 'flex' }}>
            PROGRAMME DE PARRAINAGE N°1 AU SÉNÉGAL
          </span>
          <h1 style={{ fontSize: 52, fontWeight: 900, color: '#1C2B4A', margin: 0, lineHeight: 1.15 }}>
            Gagnez un Revenu Récurrent Mensuel
          </h1>
          <p style={{ fontSize: 22, color: '#7C3AED', fontWeight: 900, marginTop: 12, marginBottom: 0 }}>
            Recommandez Nopalou aux commerçants et percevez 20% sur chaque abonnement
          </p>
        </div>

        {/* CARDS DES FONCTIONNALITÉS HAUTE NETTETÉ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>

          {/* Feature 1 */}
          <div style={{
            background: '#FFFFFF', border: '3px solid #7C3AED', borderRadius: 22, padding: 24,
            display: 'flex', alignItems: 'center', gap: 22,
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: 20, background: '#F3E8FF', border: '2px solid #7C3AED',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, flexShrink: 0
            }}>💰</div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontSize: 26, fontWeight: 900, color: '#7C3AED' }}>Commissions 20% Récurrentes à Vie</span>
              <span style={{ fontSize: 18, color: '#334155', fontWeight: 700, marginTop: 6, lineHeight: 1.45 }}>
                Versées chaque mois directement sur votre compte Wave ou Orange Money.
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
            }}>📄</div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontSize: 26, fontWeight: 900, color: '#C75B00' }}>Brochure PDF 13 Pages &amp; Kit Commercial</span>
              <span style={{ fontSize: 18, color: '#334155', fontWeight: 700, marginTop: 6, lineHeight: 1.45 }}>
                Support de présentation terrain complet, argumentaires de vente &amp; visuels WhatsApp.
              </span>
            </div>
          </div>

          {/* Feature 3 */}
          <div style={{
            background: '#FFFFFF', border: '3px solid #1C2B4A', borderRadius: 22, padding: 24,
            display: 'flex', alignItems: 'center', gap: 22,
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: 20, background: '#F8FAFC', border: '2px solid #1C2B4A',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, flexShrink: 0
            }}>📊</div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontSize: 26, fontWeight: 900, color: '#1C2B4A' }}>Dashboard &amp; Code Apporteur Personnel</span>
              <span style={{ fontSize: 18, color: '#334155', fontWeight: 700, marginTop: 6, lineHeight: 1.45 }}>
                Suivez vos commerçants parrainés et vos paiements mensuels en temps réel.
              </span>
            </div>
          </div>

          {/* Feature 4 */}
          <div style={{
            background: '#FFFFFF', border: '3px solid #7C3AED', borderRadius: 22, padding: 24,
            display: 'flex', alignItems: 'center', gap: 22,
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: 20, background: '#F3E8FF', border: '2px solid #7C3AED',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, flexShrink: 0
            }}>🚀</div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontSize: 26, fontWeight: 900, color: '#7C3AED' }}>0 FCFA d&apos;Investissement · Sans Plafond</span>
              <span style={{ fontSize: 18, color: '#334155', fontWeight: 700, marginTop: 6, lineHeight: 1.45 }}>
                Aucun frais. Recrutez sans limite et construisez votre revenu passif mensuel.
              </span>
            </div>
          </div>

        </div>

        {/* FOOTER CTA HAUTE VISIBILITÉ */}
        <div style={{
          background: '#1C2B4A', borderRadius: 24, padding: '24px 40px', marginTop: 24,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          border: '3px solid #7C3AED',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 26, fontWeight: 900, color: '#FFFFFF' }}>Devenez Apporteur Nopalou dès aujourd&apos;hui</span>
            <span style={{ fontSize: 17, color: '#CBD5E1', fontWeight: 700, marginTop: 4 }}>Inscription 1-Clic · Paiements Wave / OM</span>
          </div>
          <div style={{
            background: '#7C3AED', color: '#FFFFFF', padding: '16px 36px', borderRadius: 16,
            fontSize: 24, fontWeight: 900, display: 'flex',
          }}>
            nopalou.com/apporteur
          </div>
        </div>

      </div>
    ),
    { width: 1080, height: 1350 }
  )
}
