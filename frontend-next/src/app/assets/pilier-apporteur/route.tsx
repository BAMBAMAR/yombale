import { ImageResponse } from 'next/og'

export const runtime = 'edge'

// Visuel Dédié Pilier 3 — Apporteur d'Affaires & Parrainage 20% (1080 x 1350 px)
export async function GET() {
  return new ImageResponse(
    (
      <div style={{
        width: 1080, height: 1350,
        display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(160deg, #1C1B2E 0%, #3B0764 65%, #1E1B4B 100%)',
        fontFamily: 'system-ui, sans-serif',
        position: 'relative', color: '#FFFFFF',
        padding: 48, boxSizing: 'border-box',
        overflow: 'hidden',
      }}>
        {/* Cercles déco arrière-plan */}
        <div style={{
          position: 'absolute', right: -100, top: -100,
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168,85,247,0.35) 0%, transparent 70%)',
          display: 'flex',
        }} />
        <div style={{
          position: 'absolute', left: -80, bottom: -80,
          width: 450, height: 450, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,140,0,0.25) 0%, transparent 70%)',
          display: 'flex',
        }} />

        {/* Top Accent Line */}
        <div style={{ height: 6, background: 'linear-gradient(90deg, #7C3AED, #A855F7, #FF8C00)', display: 'flex', position: 'absolute', top: 0, left: 0, right: 0 }} />

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 60, height: 60, borderRadius: 16,
              background: '#7C3AED',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 36, fontWeight: 900, color: '#FFF',
            }}>N</div>
            <span style={{ fontSize: 40, fontWeight: 900, color: '#FFF' }}>
              Nopa<span style={{ color: '#A855F7' }}>lou</span>
            </span>
          </div>
          <div style={{
            background: 'rgba(124,58,237,0.2)', border: '1.5px solid #A855F7',
            borderRadius: 30, padding: '8px 20px', fontSize: 16, fontWeight: 800, color: '#E9D5FF', display: 'flex',
          }}>
            💼 PILIER 3 : APPORTEUR 20%
          </div>
        </div>

        {/* HERO TITLE */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 32 }}>
          <span style={{ background: '#7C3AED', color: '#FFF', padding: '6px 20px', borderRadius: 20, fontSize: 14, fontWeight: 900, letterSpacing: 1, marginBottom: 12, display: 'flex' }}>
            PROGRAMME DE PARRAINAGE N°1 AU SÉNÉGAL
          </span>
          <h1 style={{ fontSize: 48, fontWeight: 900, color: '#FFF', margin: 0, lineHeight: 1.15 }}>
            Gagnez un Revenu Récurrent Mensuel
          </h1>
          <p style={{ fontSize: 20, color: '#E9D5FF', marginTop: 10, marginBottom: 0 }}>
            Recommandez Nopalou aux commerçants et percevez 20% sur chaque abonnement
          </p>
        </div>

        {/* LISTE DES FONCTIONNALITÉS APPORTEUR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>

          {/* Feature 1 */}
          <div style={{
            background: 'rgba(30, 27, 75, 0.85)', border: '1.5px solid rgba(168,85,247,0.4)', borderRadius: 20, padding: 20,
            display: 'flex', alignItems: 'center', gap: 20
          }}>
            <div style={{
              width: 60, height: 60, borderRadius: 16, background: 'rgba(124,58,237,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, flexShrink: 0
            }}>💰</div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontSize: 22, fontWeight: 900, color: '#F0ABFC' }}>Commissions 20% Récurrentes à Vie</span>
              <span style={{ fontSize: 14, color: '#E9D5FF', marginTop: 4, lineHeight: 1.4 }}>
                Versées chaque mois directement sur votre compte Wave ou Orange Money pour chaque boutique parrainée active.
              </span>
            </div>
          </div>

          {/* Feature 2 */}
          <div style={{
            background: 'rgba(30, 27, 75, 0.85)', border: '1.5px solid rgba(168,85,247,0.4)', borderRadius: 20, padding: 20,
            display: 'flex', alignItems: 'center', gap: 20
          }}>
            <div style={{
              width: 60, height: 60, borderRadius: 16, background: 'rgba(124,58,237,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, flexShrink: 0
            }}>📄</div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>Brochure PDF 13 Pages &amp; Kit Commercial</span>
              <span style={{ fontSize: 14, color: '#E9D5FF', marginTop: 4, lineHeight: 1.4 }}>
                Accédez à un support de présentation complet, argumentaires de vente &amp; visuels WhatsApp prêts à partager.
              </span>
            </div>
          </div>

          {/* Feature 3 */}
          <div style={{
            background: 'rgba(30, 27, 75, 0.85)', border: '1.5px solid rgba(168,85,247,0.4)', borderRadius: 20, padding: 20,
            display: 'flex', alignItems: 'center', gap: 20
          }}>
            <div style={{
              width: 60, height: 60, borderRadius: 16, background: 'rgba(124,58,237,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, flexShrink: 0
            }}>📊</div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontSize: 22, fontWeight: 900, color: '#F0ABFC' }}>Espace Dashboard &amp; Lien Unique</span>
              <span style={{ fontSize: 14, color: '#E9D5FF', marginTop: 4, lineHeight: 1.4 }}>
                Suivez en direct vos filleuls, vos paiements mensuels et votre code apporteur depuis votre espace personnel.
              </span>
            </div>
          </div>

          {/* Feature 4 */}
          <div style={{
            background: 'rgba(30, 27, 75, 0.85)', border: '1.5px solid rgba(168,85,247,0.4)', borderRadius: 20, padding: 20,
            display: 'flex', alignItems: 'center', gap: 20
          }}>
            <div style={{
              width: 60, height: 60, borderRadius: 16, background: 'rgba(124,58,237,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, flexShrink: 0
            }}>🚀</div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>0 FCFA d&apos;Investissement · Sans Plafond</span>
              <span style={{ fontSize: 14, color: '#E9D5FF', marginTop: 4, lineHeight: 1.4 }}>
                Aucun frais de démarrage. Plus vous parrainez de commerçants, plus vos revenus mensuels augmentent.
              </span>
            </div>
          </div>

        </div>

        {/* FOOTER CTA */}
        <div style={{
          background: '#7C3AED', borderRadius: 20, padding: '20px 32px', marginTop: 24,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 24, fontWeight: 900, color: '#FFF' }}>Devenez Apporteur Nopalou dès aujourd&apos;hui</span>
            <span style={{ fontSize: 15, color: '#FFF', opacity: 0.9 }}>Inscription 1-Clic · Paiements Wave / OM</span>
          </div>
          <div style={{
            background: '#FFF', color: '#3B0764', padding: '12px 28px', borderRadius: 12,
            fontSize: 20, fontWeight: 900, display: 'flex',
          }}>
            nopalou.com/apporteur
          </div>
        </div>

      </div>
    ),
    { width: 1080, height: 1350 }
  )
}
