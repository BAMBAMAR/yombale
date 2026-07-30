import { ImageResponse } from 'next/og'

export const runtime = 'edge'

// Master Poster All-In-One — Visuel Unique Regroupant Toutes les Fonctionnalités Nopalou
export async function GET() {
  return new ImageResponse(
    (
      <div style={{
        width: 1200, height: 1600,
        display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(160deg, #1C2B4A 0%, #0F172A 60%, #020617 100%)',
        fontFamily: 'system-ui, sans-serif',
        position: 'relative',
        color: '#FFFFFF',
        padding: 48,
        boxSizing: 'border-box',
      }}>
        {/* Cercles déco arrière-plan */}
        <div style={{
          position: 'absolute', right: -120, top: -120,
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(199,91,0,0.3) 0%, transparent 70%)',
          display: 'flex',
        }} />
        <div style={{
          position: 'absolute', left: -100, bottom: -100,
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%)',
          display: 'flex',
        }} />

        {/* Top Accent Line */}
        <div style={{ height: 6, background: 'linear-gradient(90deg, #FF8C00, #10B981, #7C3AED)', display: 'flex', position: 'absolute', top: 0, left: 0, right: 0 }} />

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16,
              background: '#C75B00',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 38, fontWeight: 900, color: '#FFF',
            }}>N</div>
            <span style={{ fontSize: 44, fontWeight: 900, color: '#FFF' }}>
              Nopa<span style={{ color: '#FF8C00' }}>lou</span>
            </span>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 30, padding: '8px 20px', fontSize: 16, fontWeight: 800, color: '#2DD4BF', display: 'flex',
          }}>
            🇸🇳 N°1 AU SÉNÉGAL
          </div>
        </div>

        {/* TITRE PRINCIPAL */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
          <span style={{ background: '#FF8C00', color: '#FFF', padding: '6px 18px', borderRadius: 20, fontSize: 14, fontWeight: 900, letterSpacing: 1, marginBottom: 10, display: 'flex' }}>
            L&apos;ÉCOSYSTÈME DIGITAL TOUT-EN-UN
          </span>
          <h1 style={{ fontSize: 48, fontWeight: 900, color: '#FFF', margin: 0, lineHeight: 1.2 }}>
            Pour Acheter, Vendre &amp; Entreprendre au Sénégal
          </h1>
        </div>

        {/* 3 BLOCS DE FONCTIONNALITÉS COMPLETS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>

          {/* BLOC 1 : ACHETEUR */}
          <div style={{
            background: 'rgba(2, 6, 23, 0.75)', border: '1.5px solid #FF8C00', borderRadius: 20, padding: 24,
            display: 'flex', flexDirection: 'column', gap: 12
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 24, fontWeight: 900, color: '#FF8C00', display: 'flex', alignItems: 'center', gap: 10 }}>
                🛒 1. ACHETEUR &amp; CONSOMMATEUR
              </span>
              <span style={{ fontSize: 13, background: 'rgba(255,140,0,0.2)', color: '#FF8C00', padding: '4px 12px', borderRadius: 12, fontWeight: 800, display: 'flex' }}>100% GRATUIT</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, fontSize: 14, color: '#E2E8F0' }}>
              <div style={{ background: '#0F172A', padding: 12, borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <strong style={{ color: '#FFF' }}>🔍 Super-Comparateur</strong>
                <span style={{ fontSize: 12, color: '#94A3B8' }}>Auchan, Carrefour, Expat-Dakar, Boutiques Nopalou Pro.</span>
              </div>
              <div style={{ background: '#0F172A', padding: 12, borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <strong style={{ color: '#FFF' }}>🤖 Chatbot WhatsApp Meta</strong>
                <span style={{ fontSize: 12, color: '#94A3B8' }}>Recherche, fiches produits et commande 24/7 sur WhatsApp.</span>
              </div>
              <div style={{ background: '#0F172A', padding: 12, borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <strong style={{ color: '#FFF' }}>🔔 Alertes Prix &amp; Immo</strong>
                <span style={{ fontSize: 12, color: '#94A3B8' }}>Notifications baisses de prix + Forfaits télécom &amp; logements.</span>
              </div>
            </div>
          </div>

          {/* BLOC 2 : MARCHAND POS */}
          <div style={{
            background: 'rgba(2, 6, 23, 0.75)', border: '1.5px solid #10B981', borderRadius: 20, padding: 24,
            display: 'flex', flexDirection: 'column', gap: 12
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 24, fontWeight: 900, color: '#10B981', display: 'flex', alignItems: 'center', gap: 10 }}>
                🏪 2. MARCHAND &amp; CAISSE POS MAGASIN
              </span>
              <span style={{ fontSize: 13, background: 'rgba(16,185,129,0.2)', color: '#10B981', padding: '4px 12px', borderRadius: 12, fontWeight: 800, display: 'flex' }}>SOLUTIONS POS</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 14, color: '#E2E8F0' }}>
              <div style={{ background: '#0F172A', padding: 12, borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <strong style={{ color: '#FFF' }}>🖥️ Caisse Tactile &amp; 3 Scanners</strong>
                <span style={{ fontSize: 12, color: '#94A3B8' }}>Scan Caméra Smartphone, Douchette Cloud Sync (&lt;100ms) et USB.</span>
              </div>
              <div style={{ background: '#0F172A', padding: 12, borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <strong style={{ color: '#FFF' }}>🏷️ Codes-Barres &amp; Stickers EAN-13</strong>
                <span style={{ fontSize: 12, color: '#94A3B8' }}>Générateur GS1 Modulo 10 + impression stickers 50x30mm.</span>
              </div>
              <div style={{ background: '#0F172A', padding: 12, borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <strong style={{ color: '#FFF' }}>📓 Carnet Dettes &amp; Relance WA</strong>
                <span style={{ fontSize: 12, color: '#94A3B8' }}>Saisie exacte des crédits + Relance WhatsApp 1-Clic avec solde.</span>
              </div>
              <div style={{ background: '#0F172A', padding: 12, borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <strong style={{ color: '#FFF' }}>💳 Wave &amp; OM + Multi-Caissiers</strong>
                <span style={{ fontSize: 12, color: '#94A3B8' }}>Encaissement Cash/Wave/OM + Rôles sécurisés par PIN.</span>
              </div>
            </div>
          </div>

          {/* BLOC 3 : APPORTEUR D'AFFAIRES */}
          <div style={{
            background: 'rgba(2, 6, 23, 0.75)', border: '1.5px solid #7C3AED', borderRadius: 20, padding: 24,
            display: 'flex', flexDirection: 'column', gap: 12
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 24, fontWeight: 900, color: '#A855F7', display: 'flex', alignItems: 'center', gap: 10 }}>
                💼 3. APPORTEUR D&apos;AFFAIRES &amp; PARRAINAGE
              </span>
              <span style={{ fontSize: 13, background: 'rgba(124,58,237,0.2)', color: '#A855F7', padding: '4px 12px', borderRadius: 12, fontWeight: 800, display: 'flex' }}>20% RÉCURRENT</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 14, color: '#E2E8F0' }}>
              <div style={{ background: '#0F172A', padding: 12, borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <strong style={{ color: '#FFF' }}>💰 Commissions Récurrentes 20%</strong>
                <span style={{ fontSize: 12, color: '#94A3B8' }}>Perçues chaque mois sur Wave / OM pour chaque boutique parrainée.</span>
              </div>
              <div style={{ background: '#0F172A', padding: 12, borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <strong style={{ color: '#FFF' }}>📄 Brochure PDF (13 Pages) &amp; Kit</strong>
                <span style={{ fontSize: 12, color: '#94A3B8' }}>Support de vente terrain téléchargeable + Visuels &amp; Pitchs WhatsApp.</span>
              </div>
            </div>
          </div>

        </div>

        {/* FOOTER & CTA */}
        <div style={{
          background: '#FF8C00', borderRadius: 18, padding: '20px 32px', marginTop: 24,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 26, fontWeight: 900, color: '#FFF' }}>Découvrez l&apos;écosystème complet</span>
            <span style={{ fontSize: 16, color: '#FFF', opacity: 0.9 }}>Comparateur · Caisse POS · Bot WhatsApp · Apporteur</span>
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
    { width: 1200, height: 1600 }
  )
}
