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

// Visuel Dédié Pilier 3 — Apporteur d'Affaires 20% (Bright & Sharp)
export async function GET() {
  const fontData = await getCustomFont()
  const fontOptions = fontData ? [{ name: 'Inter', data: fontData, style: 'normal' as const, weight: 700 as const }] : []

  return new ImageResponse(
    (
      <div style={{
        width: 1080, height: 1350,
        display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(160deg, #F3E8FF 0%, #FFFFFF 50%, #FAF5FF 100%)',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        position: 'relative', color: '#0F172A',
        padding: 48, boxSizing: 'border-box',
        overflow: 'hidden',
      }}>
        {/* Background shapes */}
        <div style={{
          position: 'absolute', right: -100, top: -100,
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)',
          display: 'flex',
        }} />

        <div style={{ height: 8, background: '#7C3AED', display: 'flex', position: 'absolute', top: 0, left: 0, right: 0 }} />

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 60, height: 60, borderRadius: 16,
              background: '#7C3AED',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 36, fontWeight: 900, color: '#FFF',
              boxShadow: '0 8px 20px rgba(124,58,237,0.3)'
            }}>N</div>
            <span style={{ fontSize: 40, fontWeight: 900, color: '#0F172A' }}>
              Nopa<span style={{ color: '#7C3AED' }}>lou</span>
            </span>
          </div>
          <div style={{
            background: '#F3E8FF', border: '2px solid #7C3AED',
            borderRadius: 30, padding: '8px 22px', fontSize: 16, fontWeight: 900, color: '#7C3AED', display: 'flex',
          }}>
            💼 PILIER 3 : APPORTEUR 20%
          </div>
        </div>

        {/* HERO TITLE */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 36 }}>
          <span style={{ background: '#7C3AED', color: '#FFF', padding: '6px 22px', borderRadius: 20, fontSize: 14, fontWeight: 900, letterSpacing: 1, marginBottom: 12, display: 'flex' }}>
            PROGRAMME DE PARRAINAGE N°1 AU SÉNÉGAL
          </span>
          <h1 style={{ fontSize: 48, fontWeight: 900, color: '#0F172A', margin: 0, lineHeight: 1.15 }}>
            Gagnez un Revenu Récurrent Mensuel
          </h1>
          <p style={{ fontSize: 20, color: '#6B21A8', marginTop: 10, marginBottom: 0 }}>
            Recommandez Nopalou aux commerçants et percevez 20% sur chaque abonnement
          </p>
        </div>

        {/* FEATURES */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}>

          <div style={{
            background: '#FFFFFF', border: '2px solid #7C3AED', borderRadius: 20, padding: 22,
            display: 'flex', alignItems: 'center', gap: 20, boxShadow: '0 8px 20px rgba(124,58,237,0.06)'
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16, background: '#F3E8FF', border: '1px solid #DDD6FE',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, flexShrink: 0
            }}>💰</div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontSize: 22, fontWeight: 900, color: '#7C3AED' }}>Commissions 20% Récurrentes à Vie</span>
              <span style={{ fontSize: 15, color: '#334155', marginTop: 4, lineHeight: 1.4 }}>
                Versées chaque mois directement sur votre compte Wave ou Orange Money.
              </span>
            </div>
          </div>

          <div style={{
            background: '#FFFFFF', border: '2px solid #7C3AED', borderRadius: 20, padding: 22,
            display: 'flex', alignItems: 'center', gap: 20, boxShadow: '0 8px 20px rgba(124,58,237,0.06)'
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16, background: '#F3E8FF', border: '1px solid #DDD6FE',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, flexShrink: 0
            }}>📄</div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontSize: 22, fontWeight: 900, color: '#0F172A' }}>Brochure PDF 13 Pages &amp; Kit Commercial</span>
              <span style={{ fontSize: 15, color: '#334155', marginTop: 4, lineHeight: 1.4 }}>
                Support de présentation terrain complet, argumentaires de vente &amp; visuels WhatsApp.
              </span>
            </div>
          </div>

          <div style={{
            background: '#FFFFFF', border: '2px solid #7C3AED', borderRadius: 20, padding: 22,
            display: 'flex', alignItems: 'center', gap: 20, boxShadow: '0 8px 20px rgba(124,58,237,0.06)'
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16, background: '#F3E8FF', border: '1px solid #DDD6FE',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, flexShrink: 0
            }}>📊</div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontSize: 22, fontWeight: 900, color: '#7C3AED' }}>Dashboard &amp; Code Apporteur Personnel</span>
              <span style={{ fontSize: 15, color: '#334155', marginTop: 4, lineHeight: 1.4 }}>
                Suivez vos commerçants parrainés et vos paiements mensuels en temps réel.
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
            }}>🚀</div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontSize: 22, fontWeight: 900, color: '#EA580C' }}>0 FCFA d&apos;Investissement · Sans Plafond</span>
              <span style={{ fontSize: 15, color: '#334155', marginTop: 4, lineHeight: 1.4 }}>
                Aucun frais. Recrutez sans limite et construisez votre revenu passif mensuel.
              </span>
            </div>
          </div>

        </div>

        {/* FOOTER */}
        <div style={{
          background: '#7C3AED', borderRadius: 20, padding: '20px 32px', marginTop: 24,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          boxShadow: '0 10px 25px rgba(124,58,237,0.25)'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 24, fontWeight: 900, color: '#FFF' }}>Devenez Apporteur Nopalou dès aujourd&apos;hui</span>
            <span style={{ fontSize: 15, color: '#FFF', opacity: 0.95 }}>Inscription 1-Clic · Paiements Wave / OM</span>
          </div>
          <div style={{
            background: '#FFF', color: '#4C1D95', padding: '12px 28px', borderRadius: 12,
            fontSize: 20, fontWeight: 900, display: 'flex',
          }}>
            nopalou.com/apporteur
          </div>
        </div>

      </div>
    ),
    { width: 1080, height: 1350, fonts: fontOptions }
  )
}
