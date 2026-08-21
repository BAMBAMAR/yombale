import { ImageResponse } from 'next/og'
import QRCode from 'qrcode-svg'

export const dynamic = 'force-dynamic'

function qrDataUri(text: string) {
  const svg = new QRCode({ content: text, padding: 0, width: 220, height: 220, color: '#1C2B4A', background: '#ffffff' }).svg()
  const base64 = Buffer.from(svg).toString('base64')
  return `data:image/svg+xml;base64,${base64}`
}

// Flyer A5 Haute Définition (1240 × 1748 px) — Démarchage Commercial Terrain
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const codeAgent = searchParams.get('code') || 'DIRECT'
  const agentPhone = searchParams.get('phone') || '+221 70 871 79 42'
  const agentNom = searchParams.get('nom') || 'Conseiller Nopalou'
  
  const targetUrl = `https://nopalou.com/creer-boutique?ref=${encodeURIComponent(codeAgent)}`
  const qr = qrDataUri(targetUrl)

  const nomFontSize = agentNom.length > 25 ? 24 : agentNom.length > 18 ? 28 : 32

  return new ImageResponse(
    (
      <div style={{
        width: 1240, height: 1748,
        display: 'flex', flexDirection: 'column',
        background: '#ffffff',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        position: 'relative',
        overflow: 'hidden',
        justifyContent: 'space-between',
        padding: '0',
      }}>
        {/* En-tête & Corps */}
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          
          {/* Bande supérieure orange décorative */}
          <div style={{ height: 16, background: '#C75B00', width: '100%', display: 'flex' }} />
          
          {/* Header avec Logo Propriétaire & Badge Offre */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '44px 72px 24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{
                width: 76, height: 76, borderRadius: 18,
                background: '#C75B00',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 20px rgba(199, 91, 0, 0.25)',
              }}>
                <svg width="48" height="48" viewBox="0 0 512 512">
                  <path
                    fillRule="evenodd"
                    d="M120 108h272v296H120Z M324 108H188l136 198Z M188 404h136L188 206Z"
                    fill="#FFFFFF"
                  />
                </svg>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'baseline' }}>
                  <span style={{ fontSize: 46, fontWeight: 900, color: '#1C2B4A', letterSpacing: -1 }}>Nopa</span>
                  <span style={{ fontSize: 46, fontWeight: 900, color: '#C75B00', letterSpacing: -1 }}>lou</span>
                </div>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#64748B', letterSpacing: '0.08em', marginTop: -2 }}>
                  COMMERCE &amp; CAISSE POS SÉNÉGAL
                </span>
              </div>
            </div>

            <div style={{
              background: '#FFFBEB', border: '2px solid #F59E0B',
              borderRadius: 9999, padding: '12px 26px',
              display: 'flex', alignItems: 'center', gap: 10,
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.15)',
            }}>
              <div style={{
                width: 12, height: 12, borderRadius: '50%', background: '#16A34A', display: 'flex',
              }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 18, fontWeight: 900, color: '#92400E', letterSpacing: 0.2 }}>
                  1er MOIS 100% OFFERT
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#B45309' }}>
                  Sans engagement · 0 carte bancaire
                </span>
              </div>
            </div>
          </div>

          {/* Titre Principal sans <br/> pour éliminer le bug de troncature Satori */}
          <div style={{ padding: '16px 72px 28px', display: 'flex', flexDirection: 'column' }}>
            <span style={{
              fontSize: 48, fontWeight: 900, color: '#1C2B4A',
              lineHeight: 1.15, letterSpacing: -1.2,
            }}>
              Prenez le contrôle de votre boutique.
            </span>
            <span style={{
              fontSize: 48, fontWeight: 900, color: '#C75B00',
              lineHeight: 1.15, letterSpacing: -1.2, marginTop: 4,
            }}>
              Vendez en magasin &amp; sur WhatsApp.
            </span>
            <p style={{
              fontSize: 21, color: '#475569', marginTop: 16,
              lineHeight: 1.45, fontWeight: 600, maxWidth: 1050,
            }}>
              La solution tout-en-un pour les commerçants de Dakar et du Sénégal : caisse tactile sur mobile, gestion des dettes clients, facturation légale OHADA et vitrine web sans commission.
            </p>
          </div>

          {/* Grille des 6 Piliers Majeurs (Icônes Vectorielles Pures SVG) */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 20,
            padding: '0 72px',
          }}>
            {[
              {
                titre: 'Caisse POS Hors-Ligne (PWA)',
                desc: 'Encaissez vos ventes même sans connexion internet. Synchronisation automatique au retour du réseau.',
                bg: '#EFF6FF', border: '#BFDBFE', color: '#1E40AF', badge: 'POS OFFLINE',
                svgPath: 'M4 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm2 14h12v2H6v-2z',
              },
              {
                titre: '3 Modes Scanners Barcode',
                desc: 'Scannez vos articles avec la caméra du smartphone, le catalogue cloud instantané ou une douchette USB.',
                bg: '#F0FDF4', border: '#BBF7D0', color: '#166534', badge: 'SCANNER HD',
                svgPath: 'M3 4a1 1 0 011-1h4v2H5v3H3V4zm14-1a1 1 0 011 1v4h-2V5h-3V3h4zM3 16a1 1 0 001 1h4v-2H5v-3H3v4zm17 0a1 1 0 01-1 1h-4v-2h3v-3h2v4zM7 8h2v8H7V8zm4 0h2v8h-2V8zm4 0h2v8h-2V8z',
              },
              {
                titre: 'Carnet de Dettes & Relance WhatsApp',
                desc: 'Enregistrez les crédits clients en 1 clic et envoyez des rappels polis et professionnels sur WhatsApp.',
                bg: '#FFFBEB', border: '#FDE68A', color: '#92400E', badge: 'ZÉRO OUBLI',
                svgPath: 'M12 2C6.48 2 2 6.48 2 12c0 1.77.46 3.44 1.28 4.9L2 22l5.24-1.25C8.68 21.49 10.3 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z',
              },
              {
                titre: 'Factures & Devis Légaux OHADA',
                desc: 'Générez des factures PDF professionnelles avec mentions légales, NINEA, RCCM et TVA en 5 secondes.',
                bg: '#FAF5FF', border: '#E9D5FF', color: '#6B21A8', badge: 'CONFORME',
                svgPath: 'M6 2a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6H6zm7 7V3.5L18.5 9H13zm-5 4h8v2H8v-2zm0 4h5v2H8v-2z',
              },
              {
                titre: 'Vitrine Web & 0% Commission',
                desc: 'Recevez les commandes de vos clients directement sur WhatsApp. Conservez 100% de votre chiffre d\'affaires.',
                bg: '#FFF7ED', border: '#FFEDD5', color: '#C75B00', badge: '100% VOS GAINS',
                svgPath: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z',
              },
              {
                titre: 'Saisie Express, Dépenses & Marges',
                desc: 'Visualisez en temps réel votre chiffre d\'affaires journalier, vos bénéfices nets et vos marges réelles.',
                bg: '#F8FAFC', border: '#CBD5E1', color: '#1E293B', badge: 'RENTABILITÉ',
                svgPath: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
              },
            ].map((item, idx) => (
              <div key={idx} style={{
                width: 535,
                background: item.bg,
                border: `1.5px solid ${item.border}`,
                borderRadius: 18,
                padding: '20px 22px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 16,
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: '#ffffff', border: `1.5px solid ${item.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={item.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={item.svgPath} />
                  </svg>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 20, fontWeight: 900, color: item.color, letterSpacing: -0.4 }}>
                      {item.titre}
                    </span>
                    <span style={{
                      fontSize: 11, fontWeight: 800, color: item.color,
                      background: '#ffffff', padding: '2px 8px', borderRadius: 9999,
                      border: `1px solid ${item.border}`,
                    }}>
                      {item.badge}
                    </span>
                  </div>
                  <span style={{ fontSize: 14.5, color: '#475569', lineHeight: 1.4, fontWeight: 600 }}>
                    {item.desc}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Section Tarifs Clairs et Transparents */}
          <div style={{
            margin: '26px 72px 0',
            background: '#F8FAFC', border: '1.5px solid #CBD5E1',
            borderRadius: 18, padding: '16px 28px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#1C2B4A', letterSpacing: -0.3 }}>
                Tarifs ultra-accessibles après le mois d&apos;essai offert :
              </span>
              <span style={{ fontSize: 14.5, color: '#64748B', marginTop: 3, fontWeight: 600 }}>
                ⚡ Taf Taf : 2 500 F/m · ⭐ Boutique Pro : 5 000 F/m · 👑 Business VIP : 10 000 F/m
              </span>
            </div>
            <div style={{
              background: '#16A34A', color: '#fff',
              padding: '10px 22px', borderRadius: 9999,
              fontSize: 15, fontWeight: 900, letterSpacing: 0.2,
              boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)',
            }}>
              0% de commission sur vos ventes
            </div>
          </div>
        </div>

        {/* Footer / Carte de Contact Commercial & QR Code Haute Définition */}
        <div style={{
          margin: '0 72px 40px',
          background: 'linear-gradient(135deg, #1C2B4A 0%, #0F172A 100%)',
          borderRadius: 24, padding: '26px 36px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          border: '2.5px solid #C75B00',
          boxShadow: '0 12px 30px rgba(15, 23, 42, 0.25)',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 660, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{
                background: '#C75B00', color: '#fff',
                fontSize: 12, fontWeight: 900, padding: '4px 12px', borderRadius: 9999,
                letterSpacing: 0.6,
              }}>
                CONSEILLER TERRAIN OFFICIEL
              </span>
              <span style={{ fontSize: 16, color: '#94A3B8', fontWeight: 700 }}>Code Agent : {codeAgent}</span>
            </div>
            <span style={{ fontSize: nomFontSize, color: '#fff', fontWeight: 900, letterSpacing: -0.5 }}>
              {agentNom}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, background: '#25D366',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                fontWeight: 900, fontSize: 18,
              }}>✆</div>
              <span style={{ fontSize: 24, color: '#38BDF8', fontWeight: 900, letterSpacing: 0.5 }}>
                {agentPhone}
              </span>
            </div>
            <span style={{ fontSize: 14, color: '#CBD5E1', fontWeight: 600, marginTop: 2 }}>
              🌐 Démo interactive immédiate sans inscription : <strong>nopalou.com/demo</strong>
            </span>
          </div>

          <div style={{
            background: '#fff', borderRadius: 20,
            padding: '14px', display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 8, flexShrink: 0,
            boxShadow: '0 6px 18px rgba(0,0,0,0.15)',
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} width={170} height={170} alt="QR Code" style={{ borderRadius: 8 }} />
            <span style={{ fontSize: 12, fontWeight: 900, color: '#1C2B4A', letterSpacing: 0.2 }}>
              SCANNEZ POUR CRÉER
            </span>
          </div>
        </div>
      </div>
    ),
    { width: 1240, height: 1748 }
  )
}
