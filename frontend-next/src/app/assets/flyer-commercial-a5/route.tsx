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

  return new ImageResponse(
    (
      <div style={{
        width: 1240, height: 1748,
        display: 'flex', flexDirection: 'column',
        background: '#ffffff',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Bande supérieure orange et bleue */}
        <div style={{ height: 18, background: '#C75B00', display: 'flex' }} />
        
        {/* Header avec Logo & Badge Offre */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '48px 72px 24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{
              width: 80, height: 80, borderRadius: 20,
              background: '#C75B00',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 46, fontWeight: 900, color: '#fff',
            }}>N</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 50, fontWeight: 900, color: '#1C2B4A', lineHeight: 1.1 }}>
                Nopa<span style={{ color: '#C75B00' }}>lou</span>
              </span>
              <span style={{ fontSize: 20, fontWeight: 700, color: '#64748B', letterSpacing: '0.05em' }}>
                COMMERCE &amp; CAISSE POS SÉNÉGAL
              </span>
            </div>
          </div>

          <div style={{
            background: '#FEF3C7', border: '2px solid #F59E0B',
            borderRadius: 16, padding: '12px 24px',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
          }}>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#B45309' }}>
              🎁 1er MOIS 100% OFFERT
            </span>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#92400E' }}>
              Sans engagement · 0 carte bancaire
            </span>
          </div>
        </div>

        {/* Titre Principal Choc */}
        <div style={{ padding: '24px 72px 0', display: 'flex', flexDirection: 'column' }}>
          <h1 style={{
            fontSize: 54, fontWeight: 900, color: '#1C2B4A',
            margin: 0, lineHeight: 1.15,
          }}>
            Prenez le contrôle de votre boutique.<br />
            <span style={{ color: '#C75B00' }}>Vendez en magasin &amp; sur WhatsApp.</span>
          </h1>
          <p style={{ fontSize: 24, color: '#475569', marginTop: 16, lineHeight: 1.4 }}>
            La solution tout-en-un pour les commerçants de Dakar et du Sénégal : caisse tactile, gestion des dettes, facturation légale et vitrine web.
          </p>
        </div>

        {/* Grille des 6 Piliers Majeurs */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 20,
          padding: '36px 72px 0',
        }}>
          {[
            {
              icon: '🖥️',
              titre: 'Caisse POS Hors-Ligne (PWA)',
              desc: 'Encaissez vos clients même sans internet. Zéro coupure de vente.',
              bg: '#EFF6FF', border: '#BFDBFE', color: '#1E40AF',
            },
            {
              icon: '📷',
              titre: '3 Scanners Codes-Barres',
              desc: 'Scannez avec la caméra du smartphone, le cloud ou une douchette USB.',
              bg: '#F0FDF4', border: '#BBF7D0', color: '#166534',
            },
            {
              icon: '📒',
              titre: 'Carnet de Dettes & Relance WA',
              desc: 'Enregistrez les crédits clients et relancez en 1 clic sur WhatsApp.',
              bg: '#FFFBEB', border: '#FDE68A', color: '#92400E',
            },
            {
              icon: '📑',
              titre: 'Factures & Devis OHADA',
              desc: 'PDF professionnels avec NINEA, RCCM et TVA en 10 secondes.',
              bg: '#FAF5FF', border: '#E9D5FF', color: '#6B21A8',
            },
            {
              icon: '🛍️',
              titre: 'Vitrine Web & Zéro Commission',
              desc: 'Vos clients commandent sur WhatsApp. 100% de vos gains pour vous.',
              bg: '#FFF7ED', border: '#FFEDD5', color: '#C75B00',
            },
            {
              icon: '⚡',
              titre: 'Saisie Express & Marges',
              desc: 'Visualisez vos recettes, dépenses journalières et bénéfice net.',
              bg: '#F8FAFC', border: '#E2E8F0', color: '#334155',
            },
          ].map((item, idx) => (
            <div key={idx} style={{
              width: 535,
              background: item.bg,
              border: `2px solid ${item.border}`,
              borderRadius: 18,
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 16,
            }}>
              <span style={{ fontSize: 36 }}>{item.icon}</span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 22, fontWeight: 900, color: item.color }}>
                  {item.titre}
                </span>
                <span style={{ fontSize: 16, color: '#475569', marginTop: 4, lineHeight: 1.35 }}>
                  {item.desc}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Section Tarifs Clairs */}
        <div style={{
          margin: '32px 72px 0',
          background: '#F8FAFC', border: '2px solid #E2E8F0',
          borderRadius: 20, padding: '20px 32px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#1C2B4A' }}>
              Tarifs ultra-accessibles après le mois d&apos;essai :
            </span>
            <span style={{ fontSize: 16, color: '#64748B', marginTop: 4 }}>
              Taf Taf : 2 500 F/mois · Boutique Pro : 5 000 F/mois · Business VIP : 10 000 F/mois
            </span>
          </div>
          <div style={{
            background: '#16A34A', color: '#fff',
            padding: '10px 20px', borderRadius: 12,
            fontSize: 18, fontWeight: 900,
          }}>
            0% de commission sur vos ventes
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex' }} />

        {/* Footer / Bloc Action & QR Code */}
        <div style={{
          margin: '0 72px 48px',
          background: '#1C2B4A',
          borderRadius: 24, padding: '32px 40px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          border: '3px solid #C75B00',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 680 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{
                background: '#C75B00', color: '#fff',
                fontSize: 14, fontWeight: 900, padding: '4px 12px', borderRadius: 8,
              }}>
                AGENT CONSEILLER TERRAIN
              </span>
              <span style={{ fontSize: 18, color: '#CBD5E1' }}>Code : {codeAgent}</span>
            </div>
            <span style={{ fontSize: 28, color: '#fff', fontWeight: 900 }}>
              {agentNom}
            </span>
            <span style={{ fontSize: 24, color: '#38BDF8', fontWeight: 800 }}>
              📞 WhatsApp direct : {agentPhone}
            </span>
            <span style={{ fontSize: 16, color: '#94A3B8' }}>
              Démo live immédiate en 1 clic : nopalou.com/demo
            </span>
          </div>

          <div style={{
            background: '#fff', borderRadius: 18,
            padding: '12px', display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 8,
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} width={180} height={180} alt="QR Code" />
            <span style={{ fontSize: 13, fontWeight: 800, color: '#1C2B4A' }}>
              Scannez pour créer
            </span>
          </div>
        </div>
      </div>
    ),
    { width: 1240, height: 1748 }
  )
}
