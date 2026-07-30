import { ImageResponse } from 'next/og'

export const runtime = 'edge'

// Master Poster All-In-One — Visuel Lumineux Haute Définition
export async function GET() {
  return new ImageResponse(
    (
      <div style={{
        width: 1200, height: 1600,
        display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(160deg, #F8FAFC 0%, #F1F5F9 40%, #FFF7ED 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        position: 'relative',
        color: '#0F172A',
        padding: 48,
        boxSizing: 'border-box',
      }}>
        {/* Decorative background shapes */}
        <div style={{
          position: 'absolute', right: -100, top: -100,
          width: 550, height: 550, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(234,88,12,0.12) 0%, transparent 70%)',
          display: 'flex',
        }} />
        <div style={{
          position: 'absolute', left: -80, bottom: -80,
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(5,150,105,0.1) 0%, transparent 70%)',
          display: 'flex',
        }} />

        {/* Top Accent Line */}
        <div style={{ height: 8, background: 'linear-gradient(90deg, #EA580C, #059669, #7C3AED)', display: 'flex', position: 'absolute', top: 0, left: 0, right: 0 }} />

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 68, height: 68, borderRadius: 18,
              background: '#EA580C',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 42, fontWeight: 900, color: '#FFF',
              boxShadow: '0 8px 20px rgba(234,88,12,0.3)',
            }}>N</div>
            <span style={{ fontSize: 46, fontWeight: 900, color: '#0F172A', letterSpacing: -1 }}>
              Nopa<span style={{ color: '#EA580C' }}>lou</span>
            </span>
          </div>
          <div style={{
            background: '#ECFDF5', border: '2px solid #059669',
            borderRadius: 30, padding: '10px 24px', fontSize: 16, fontWeight: 900, color: '#059669', display: 'flex',
          }}>
            🇸🇳 N°1 AU SÉNÉGAL
          </div>
        </div>

        {/* TITRE PRINCIPAL */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
          <span style={{ background: '#EA580C', color: '#FFF', padding: '6px 22px', borderRadius: 20, fontSize: 14, fontWeight: 900, letterSpacing: 1, marginBottom: 12, display: 'flex' }}>
            L&apos;ÉCOSYSTÈME DIGITAL TOUT-EN-UN
          </span>
          <h1 style={{ fontSize: 48, fontWeight: 900, color: '#0F172A', margin: 0, lineHeight: 1.15 }}>
            Pour Acheter, Vendre &amp; Entreprendre au Sénégal
          </h1>
        </div>

        {/* 3 BLOCS DE FONCTIONNALITÉS LUMINEUX */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>

          {/* BLOC 1 : ACHETEUR */}
          <div style={{
            background: '#FFFFFF', border: '2px solid #EA580C', borderRadius: 22, padding: 24,
            display: 'flex', flexDirection: 'column', gap: 14,
            boxShadow: '0 10px 30px rgba(234,88,12,0.08)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 24, fontWeight: 900, color: '#EA580C', display: 'flex', alignItems: 'center', gap: 10 }}>
                🛒 1. ACHETEUR &amp; CONSOMMATEUR
              </span>
              <span style={{ fontSize: 13, background: '#FFF7ED', border: '1px solid #FFEDD5', color: '#C2410C', padding: '5px 14px', borderRadius: 14, fontWeight: 900, display: 'flex' }}>100% GRATUIT</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', gap: 12, fontSize: 14, color: '#334155' }}>
              <div style={{ flex: 1, background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 14, borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <strong style={{ color: '#0F172A', fontSize: 15 }}>🔍 Super-Comparateur</strong>
                <span style={{ fontSize: 12.5, color: '#64748B', lineHeight: 1.4 }}>Auchan, Carrefour, Expat-Dakar &amp; Boutiques Nopalou.</span>
              </div>
              <div style={{ flex: 1, background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 14, borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <strong style={{ color: '#059669', fontSize: 15 }}>🤖 Chatbot WhatsApp Meta</strong>
                <span style={{ fontSize: 12.5, color: '#64748B', lineHeight: 1.4 }}>Recherche, fiches produits et commande 24/7 sur WhatsApp.</span>
              </div>
              <div style={{ flex: 1, background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 14, borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <strong style={{ color: '#0F172A', fontSize: 15 }}>🔔 Alertes Prix &amp; Immo</strong>
                <span style={{ fontSize: 12.5, color: '#64748B', lineHeight: 1.4 }}>Notifications baisses de prix + Forfaits télécom &amp; logements.</span>
              </div>
            </div>
          </div>

          {/* BLOC 2 : MARCHAND POS */}
          <div style={{
            background: '#FFFFFF', border: '2px solid #059669', borderRadius: 22, padding: 24,
            display: 'flex', flexDirection: 'column', gap: 14,
            boxShadow: '0 10px 30px rgba(5,150,105,0.08)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 24, fontWeight: 900, color: '#059669', display: 'flex', alignItems: 'center', gap: 10 }}>
                🏪 2. MARCHAND &amp; CAISSE POS MAGASIN
              </span>
              <span style={{ fontSize: 13, background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#047857', padding: '5px 14px', borderRadius: 14, fontWeight: 900, display: 'flex' }}>SOLUTIONS POS MAGASIN</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14, color: '#334155' }}>
              <div style={{ display: 'flex', flexDirection: 'row', gap: 12 }}>
                <div style={{ flex: 1, background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 14, borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <strong style={{ color: '#0F172A', fontSize: 15 }}>🖥️ Caisse Tactile &amp; 3 Scanners</strong>
                  <span style={{ fontSize: 12.5, color: '#64748B', lineHeight: 1.4 }}>Scan Smartphone Caméra, Cloud Sync (&lt;100ms) et Douchette USB.</span>
                </div>
                <div style={{ flex: 1, background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 14, borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <strong style={{ color: '#0F172A', fontSize: 15 }}>🏷️ Codes-Barres &amp; Stickers GS1</strong>
                  <span style={{ fontSize: 12.5, color: '#64748B', lineHeight: 1.4 }}>Générateur EAN-13 GS1 Modulo 10 + impression stickers 50x30mm.</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'row', gap: 12 }}>
                <div style={{ flex: 1, background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 14, borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <strong style={{ color: '#EA580C', fontSize: 15 }}>📓 Carnet Dettes &amp; Relance WA</strong>
                  <span style={{ fontSize: 12.5, color: '#64748B', lineHeight: 1.4 }}>Saisie des crédits + Relance WhatsApp 1-Clic avec solde exact.</span>
                </div>
                <div style={{ flex: 1, background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 14, borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <strong style={{ color: '#0F172A', fontSize: 15 }}>💳 Wave, OM + Multi-Caissiers</strong>
                  <span style={{ fontSize: 12.5, color: '#64748B', lineHeight: 1.4 }}>Encaissement Espèces/Wave/OM + Rôles sécurisés par PIN.</span>
                </div>
              </div>
            </div>
          </div>

          {/* BLOC 3 : APPORTEUR D'AFFAIRES */}
          <div style={{
            background: '#FFFFFF', border: '2px solid #7C3AED', borderRadius: 22, padding: 24,
            display: 'flex', flexDirection: 'column', gap: 14,
            boxShadow: '0 10px 30px rgba(124,58,237,0.08)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 24, fontWeight: 900, color: '#7C3AED', display: 'flex', alignItems: 'center', gap: 10 }}>
                💼 3. APPORTEUR D&apos;AFFAIRES &amp; PARRAINAGE
              </span>
              <span style={{ fontSize: 13, background: '#F3E8FF', border: '1px solid #DDD6FE', color: '#6B21A8', padding: '5px 14px', borderRadius: 14, fontWeight: 900, display: 'flex' }}>20% RÉCURRENT MENSUEL</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', gap: 12, fontSize: 14, color: '#334155' }}>
              <div style={{ flex: 1, background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 14, borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <strong style={{ color: '#7C3AED', fontSize: 15 }}>💰 Commissions Récurrentes 20%</strong>
                <span style={{ fontSize: 12.5, color: '#64748B', lineHeight: 1.4 }}>Perçues chaque mois sur Wave / OM pour chaque boutique parrainée.</span>
              </div>
              <div style={{ flex: 1, background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 14, borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <strong style={{ color: '#0F172A', fontSize: 15 }}>📄 Brochure PDF (13 P.) &amp; Kit</strong>
                <span style={{ fontSize: 12.5, color: '#64748B', lineHeight: 1.4 }}>Support de vente terrain + Démo POS commercial 1-Clic.</span>
              </div>
            </div>
          </div>

        </div>

        {/* FOOTER & CTA LUMINEUX */}
        <div style={{
          background: 'linear-gradient(90deg, #EA580C 0%, #C2410C 100%)', borderRadius: 20, padding: '22px 36px', marginTop: 24,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          boxShadow: '0 12px 30px rgba(234,88,12,0.25)'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 26, fontWeight: 900, color: '#FFF' }}>Découvrez l&apos;écosystème complet</span>
            <span style={{ fontSize: 16, color: '#FFF', opacity: 0.95 }}>Super-Comparateur · Caisse POS · Bot WhatsApp · Apporteur 20%</span>
          </div>
          <div style={{
            background: '#FFF', color: '#0F172A', padding: '12px 32px', borderRadius: 14,
            fontSize: 22, fontWeight: 900, display: 'flex',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            nopalou.com
          </div>
        </div>

      </div>
    ),
    { width: 1200, height: 1600 }
  )
}
