import { ImageResponse } from 'next/og'

export const runtime = 'edge'

// Master Poster All-In-One — Visuel Lumineux Haute Définition aux Couleurs Nopalou (#1C2B4A & #C75B00)
export async function GET() {
  return new ImageResponse(
    (
      <div style={{
        width: 1200, height: 1600,
        display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(160deg, #FFFFFF 0%, #F8FAFC 60%, #FFF7ED 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        position: 'relative',
        color: '#1C2B4A',
        padding: 56,
        boxSizing: 'border-box',
      }}>
        {/* Bande de couleur Nopalou en haut */}
        <div style={{ height: 10, background: 'linear-gradient(90deg, #C75B00 0%, #1C2B4A 50%, #16a34a 100%)', display: 'flex', position: 'absolute', top: 0, left: 0, right: 0 }} />

        {/* HEADER BRANDING NOPALOU */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
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
            background: '#FFF7ED', border: '2.5px solid #C75B00',
            borderRadius: 30, padding: '12px 28px', fontSize: 18, fontWeight: 900, color: '#C75B00', display: 'flex',
          }}>
            🇸🇳 N°1 AU SÉNÉGAL
          </div>
        </div>

        {/* TITRE PRINCIPAL HAUTE NETTETÉ */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 40 }}>
          <span style={{ background: '#1C2B4A', color: '#FFFFFF', padding: '8px 24px', borderRadius: 20, fontSize: 16, fontWeight: 900, letterSpacing: 1.5, marginBottom: 14, display: 'flex' }}>
            L&apos;ÉCOSYSTÈME DIGITAL TOUT-EN-UN
          </span>
          <h1 style={{ fontSize: 54, fontWeight: 900, color: '#1C2B4A', margin: 0, lineHeight: 1.15 }}>
            Pour Acheter, Vendre &amp; Entreprendre au Sénégal
          </h1>
        </div>

        {/* 3 BLOCS DE FONCTIONNALITÉS — COULEURS NOPALOU & TYPO NETTE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, flex: 1 }}>

          {/* BLOC 1 : ACHETEUR */}
          <div style={{
            background: '#FFFFFF', border: '3px solid #C75B00', borderRadius: 24, padding: 28,
            display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 28, fontWeight: 900, color: '#C75B00', display: 'flex', alignItems: 'center', gap: 12 }}>
                🛒 1. ACHETEUR &amp; CONSOMMATEUR
              </span>
              <span style={{ fontSize: 15, background: '#FFF7ED', border: '1.5px solid #C75B00', color: '#C75B00', padding: '6px 16px', borderRadius: 16, fontWeight: 900, display: 'flex' }}>100% GRATUIT</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', gap: 16 }}>
              <div style={{ flex: 1, background: '#F8FAFC', border: '1.5px solid #E2E8F0', padding: 18, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <strong style={{ color: '#1C2B4A', fontSize: 19, fontWeight: 900 }}>🔍 Super-Comparateur</strong>
                <span style={{ fontSize: 15, color: '#475569', fontWeight: 700, lineHeight: 1.45 }}>Auchan, Carrefour, Expat-Dakar &amp; Boutiques Nopalou.</span>
              </div>
              <div style={{ flex: 1, background: '#F8FAFC', border: '1.5px solid #E2E8F0', padding: 18, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <strong style={{ color: '#25D366', fontSize: 19, fontWeight: 900 }}>🤖 Bot WhatsApp Meta</strong>
                <span style={{ fontSize: 15, color: '#475569', fontWeight: 700, lineHeight: 1.45 }}>Recherche, fiches produits et commande 24/7 sur WhatsApp.</span>
              </div>
              <div style={{ flex: 1, background: '#F8FAFC', border: '1.5px solid #E2E8F0', padding: 18, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <strong style={{ color: '#1C2B4A', fontSize: 19, fontWeight: 900 }}>🔔 Alertes Prix &amp; Immo</strong>
                <span style={{ fontSize: 15, color: '#475569', fontWeight: 700, lineHeight: 1.45 }}>Notifications baisses de prix + Télécom &amp; Logements.</span>
              </div>
            </div>
          </div>

          {/* BLOC 2 : MARCHAND POS MAGASIN */}
          <div style={{
            background: '#FFFFFF', border: '3px solid #16a34a', borderRadius: 24, padding: 28,
            display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 28, fontWeight: 900, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 12 }}>
                🏪 2. MARCHAND &amp; CAISSE POS MAGASIN
              </span>
              <span style={{ fontSize: 15, background: '#F0FDF4', border: '1.5px solid #16a34a', color: '#16a34a', padding: '6px 16px', borderRadius: 16, fontWeight: 900, display: 'flex' }}>SOLUTIONS POS MAGASIN</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'row', gap: 16 }}>
                <div style={{ flex: 1, background: '#F8FAFC', border: '1.5px solid #E2E8F0', padding: 18, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <strong style={{ color: '#1C2B4A', fontSize: 19, fontWeight: 900 }}>🖥️ Caisse POS &amp; 3 Scanners</strong>
                  <span style={{ fontSize: 15, color: '#475569', fontWeight: 700, lineHeight: 1.45 }}>Scan Smartphone, Cloud Sync (&lt;100ms) et Douchette USB.</span>
                </div>
                <div style={{ flex: 1, background: '#F8FAFC', border: '1.5px solid #E2E8F0', padding: 18, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <strong style={{ color: '#1C2B4A', fontSize: 19, fontWeight: 900 }}>🏷️ Codes-Barres &amp; Stickers GS1</strong>
                  <span style={{ fontSize: 15, color: '#475569', fontWeight: 700, lineHeight: 1.45 }}>Générateur EAN-13 GS1 Modulo 10 + impression stickers 50x30mm.</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'row', gap: 16 }}>
                <div style={{ flex: 1, background: '#F8FAFC', border: '1.5px solid #E2E8F0', padding: 18, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <strong style={{ color: '#C75B00', fontSize: 19, fontWeight: 900 }}>📓 Carnet Dettes &amp; Relance WA</strong>
                  <span style={{ fontSize: 15, color: '#475569', fontWeight: 700, lineHeight: 1.45 }}>Saisie des crédits + Relance WhatsApp 1-Clic avec solde exact.</span>
                </div>
                <div style={{ flex: 1, background: '#F8FAFC', border: '1.5px solid #E2E8F0', padding: 18, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <strong style={{ color: '#1C2B4A', fontSize: 19, fontWeight: 900 }}>💳 Wave, OM + Multi-Caissiers</strong>
                  <span style={{ fontSize: 15, color: '#475569', fontWeight: 700, lineHeight: 1.45 }}>Encaissement Cash/Wave/OM + Rôles sécurisés par PIN.</span>
                </div>
              </div>
            </div>
          </div>

          {/* BLOC 3 : APPORTEUR D'AFFAIRES */}
          <div style={{
            background: '#FFFFFF', border: '3px solid #7C3AED', borderRadius: 24, padding: 28,
            display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 28, fontWeight: 900, color: '#7C3AED', display: 'flex', alignItems: 'center', gap: 12 }}>
                💼 3. APPORTEUR D&apos;AFFAIRES &amp; PARRAINAGE
              </span>
              <span style={{ fontSize: 15, background: '#F3E8FF', border: '1.5px solid #7C3AED', color: '#7C3AED', padding: '6px 16px', borderRadius: 16, fontWeight: 900, display: 'flex' }}>20% RÉCURRENT MENSUEL</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', gap: 16 }}>
              <div style={{ flex: 1, background: '#F8FAFC', border: '1.5px solid #E2E8F0', padding: 18, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <strong style={{ color: '#7C3AED', fontSize: 19, fontWeight: 900 }}>💰 Commissions Récurrentes 20%</strong>
                <span style={{ fontSize: 15, color: '#475569', fontWeight: 700, lineHeight: 1.45 }}>Perçues chaque mois sur Wave / OM pour chaque boutique parrainée.</span>
              </div>
              <div style={{ flex: 1, background: '#F8FAFC', border: '1.5px solid #E2E8F0', padding: 18, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <strong style={{ color: '#1C2B4A', fontSize: 19, fontWeight: 900 }}>📄 Brochure PDF (13 P.) &amp; Kit</strong>
                <span style={{ fontSize: 15, color: '#475569', fontWeight: 700, lineHeight: 1.45 }}>Support de vente terrain + Démo POS commercial 1-Clic.</span>
              </div>
            </div>
          </div>

        </div>

        {/* FOOTER CTA HAUTE NETTETÉ EN COULEUR NOPALOU (#1C2B4A & #C75B00) */}
        <div style={{
          background: '#1C2B4A', borderRadius: 24, padding: '26px 40px', marginTop: 24,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          border: '3px solid #C75B00',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 28, fontWeight: 900, color: '#FFFFFF' }}>Découvrez l&apos;écosystème complet</span>
            <span style={{ fontSize: 17, color: '#CBD5E1', fontWeight: 700, marginTop: 4 }}>Super-Comparateur · Caisse POS · Bot WhatsApp · Apporteur 20%</span>
          </div>
          <div style={{
            background: '#C75B00', color: '#FFFFFF', padding: '16px 36px', borderRadius: 16,
            fontSize: 26, fontWeight: 900, display: 'flex',
          }}>
            nopalou.com
          </div>
        </div>

      </div>
    ),
    { width: 1200, height: 1600 }
  )
}
