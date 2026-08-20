import { ImageResponse } from 'next/og'
import QRCode from 'qrcode-svg'

export const dynamic = 'force-dynamic'

function qrDataUri(text: string) {
  const svg = new QRCode({ content: text, padding: 0, width: 180, height: 180, color: '#1C2B4A', background: '#ffffff' }).svg()
  const base64 = Buffer.from(svg).toString('base64')
  return `data:image/svg+xml;base64,${base64}`
}

// Fiche Tarifaire A4 Haute Définition (1240 × 1754 px) — Grille Officielle Nopalou
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const codeAgent = searchParams.get('code') || 'DIRECT'
  const agentPhone = searchParams.get('phone') || '+221 70 871 79 42'

  const qr = qrDataUri(`https://nopalou.com/creer-boutique?ref=${encodeURIComponent(codeAgent)}`)

  return new ImageResponse(
    (
      <div style={{
        width: 1240, height: 1754,
        display: 'flex', flexDirection: 'column',
        background: '#ffffff',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        position: 'relative',
      }}>
        {/* Bande supérieure */}
        <div style={{ height: 16, background: '#C75B00', display: 'flex' }} />

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '40px 72px 20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{
              width: 70, height: 70, borderRadius: 18,
              background: '#C75B00',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 40, fontWeight: 900, color: '#fff',
            }}>N</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 44, fontWeight: 900, color: '#1C2B4A', lineHeight: 1.1 }}>
                Nopa<span style={{ color: '#C75B00' }}>lou</span>
              </span>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#64748B' }}>
                GRILLE TARIFAIRE OFFICIELLE &amp; FORMULES MARCHANDS
              </span>
            </div>
          </div>

          <div style={{
            background: '#DCFCE7', border: '2px solid #16A34A',
            borderRadius: 14, padding: '10px 20px',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: '#15803D' }}>
              🎁 1er Mois 100% Offert sur Tous les Plans
            </span>
          </div>
        </div>

        {/* Titre */}
        <div style={{ padding: '16px 72px 0', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: 38, fontWeight: 900, color: '#1C2B4A', margin: 0 }}>
            Choisissez la formule adaptée à la taille de votre commerce
          </h2>
          <p style={{ fontSize: 20, color: '#64748B', marginTop: 8 }}>
            Zéro frais cachés · Zéro commission sur vos ventes · Paiement sécurisé Wave &amp; Orange Money
          </p>
        </div>

        {/* 3 Cartes de Formules */}
        <div style={{
          display: 'flex', gap: 24, padding: '24px 72px 0',
        }}>
          {/* Formule 1 : Taf Taf */}
          <div style={{
            flex: 1, background: '#F8FAFC', border: '2px solid #CBD5E1',
            borderRadius: 20, padding: '24px 20px', display: 'flex', flexDirection: 'column',
          }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#64748B' }}>DÉCOUVERTE &amp; WEB</span>
            <span style={{ fontSize: 32, fontWeight: 900, color: '#1C2B4A', marginTop: 4 }}>Taf Taf</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 12 }}>
              <span style={{ fontSize: 40, fontWeight: 900, color: '#C75B00' }}>2 500</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#64748B' }}>F CFA / mois</span>
            </div>
            <span style={{ fontSize: 14, color: '#16A34A', fontWeight: 800, marginTop: 4 }}>
              1er mois offert
            </span>
            <hr style={{ border: 'none', borderTop: '1px solid #E2E8F0', margin: '16px 0' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 15, color: '#334155' }}>
              <span>✓ Vitrine web personnalisée</span>
              <span>✓ Commandes directes WhatsApp</span>
              <span>✓ Carnet de dettes client</span>
              <span>✓ Partage de stories marque blanche</span>
              <span>✓ 0% commission sur les ventes</span>
            </div>
          </div>

          {/* Formule 2 : Boutique Pro (Star) */}
          <div style={{
            flex: 1, background: '#FFF7ED', border: '3px solid #C75B00',
            borderRadius: 20, padding: '24px 20px', display: 'flex', flexDirection: 'column',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', top: -14, right: 20,
              background: '#C75B00', color: '#fff', fontSize: 12, fontWeight: 900,
              padding: '4px 12px', borderRadius: 8,
            }}>⭐ LE PLUS POPULAIRE</div>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#C75B00' }}>MAGASIN PHYSIQUE</span>
            <span style={{ fontSize: 32, fontWeight: 900, color: '#1C2B4A', marginTop: 4 }}>Boutique Pro</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 12 }}>
              <span style={{ fontSize: 40, fontWeight: 900, color: '#C75B00' }}>5 000</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#64748B' }}>F CFA / mois</span>
            </div>
            <span style={{ fontSize: 14, color: '#16A34A', fontWeight: 800, marginTop: 4 }}>
              1er mois offert · Rentabilisé dès la 1ère vente
            </span>
            <hr style={{ border: 'none', borderTop: '1px solid #FED7AA', margin: '16px 0' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 15, color: '#1C2B4A', fontWeight: 600 }}>
              <span>✓ <strong>Tout le plan Taf Taf inclus</strong></span>
              <span>✓ <strong>Caisse POS Tactile Magasin</strong></span>
              <span>✓ <strong>Mode PWA Hors-Ligne (sans internet)</strong></span>
              <span>✓ <strong>3 Scanners (Caméra, Cloud, USB)</strong></span>
              <span>✓ <strong>Factures &amp; Devis OHADA (PDF)</strong></span>
              <span>✓ <strong>Codes-Barres EAN-13 GS1</strong></span>
              <span>✓ <strong>Saisie Express flux financiers</strong></span>
            </div>
          </div>

          {/* Formule 3 : Business VIP */}
          <div style={{
            flex: 1, background: '#F8FAFC', border: '2px solid #1E293B',
            borderRadius: 20, padding: '24px 20px', display: 'flex', flexDirection: 'column',
          }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#1E293B' }}>PME &amp; ENSEIGNES</span>
            <span style={{ fontSize: 32, fontWeight: 900, color: '#1C2B4A', marginTop: 4 }}>Business VIP</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 12 }}>
              <span style={{ fontSize: 40, fontWeight: 900, color: '#1C2B4A' }}>10 000</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#64748B' }}>F CFA / mois</span>
            </div>
            <span style={{ fontSize: 14, color: '#16A34A', fontWeight: 800, marginTop: 4 }}>
              1er mois offert
            </span>
            <hr style={{ border: 'none', borderTop: '1px solid #CBD5E1', margin: '16px 0' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 15, color: '#334155' }}>
              <span>✓ <strong>Tout le plan Pro inclus</strong></span>
              <span>✓ <strong>Multi-Caissiers sécurisés PIN</strong></span>
              <span>✓ <strong>Fournisseurs &amp; Scan OCR</strong></span>
              <span>✓ <strong>Import lot Excel/CSV illimité</strong></span>
              <span>✓ <strong>Clôtures de Caisse Z &amp; Marges</strong></span>
              <span>✓ <strong>Portail API REST &amp; Webhooks</strong></span>
              <span>✓ <strong>Support commercial prioritaire 24/7</strong></span>
            </div>
          </div>
        </div>

        {/* Remises Multi-Durées */}
        <div style={{
          margin: '28px 72px 0', background: '#FEF3C7', border: '2px solid #F59E0B',
          borderRadius: 18, padding: '16px 28px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 20, fontWeight: 900, color: '#92400E' }}>
            🏷️ Barème des Remises Commerçants :
          </span>
          <div style={{ display: 'flex', gap: 24 }}>
            <span style={{ fontSize: 17, fontWeight: 800, color: '#B45309' }}>
              3 mois : <strong>-10%</strong>
            </span>
            <span style={{ fontSize: 17, fontWeight: 800, color: '#B45309' }}>
              6 mois : <strong>-15%</strong>
            </span>
            <span style={{ fontSize: 17, fontWeight: 900, color: '#15803D', background: '#DCFCE7', padding: '4px 12px', borderRadius: 8 }}>
              12 mois : <strong>-25% (3 mois offerts !)</strong>
            </span>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex' }} />

        {/* Footer Contact & Onboarding */}
        <div style={{
          margin: '0 72px 40px', background: '#1C2B4A', borderRadius: 20, padding: '24px 36px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 24, fontWeight: 900, color: '#fff' }}>
              Démarrez votre essai gratuit dès aujourd&apos;hui
            </span>
            <span style={{ fontSize: 18, color: '#38BDF8', fontWeight: 800 }}>
              📞 Contact WhatsApp : {agentPhone} · Code : {codeAgent}
            </span>
            <span style={{ fontSize: 14, color: '#94A3B8' }}>
              Inscription immédiate en 3 minutes sur nopalou.com/boutique
            </span>
          </div>

          <div style={{
            background: '#fff', borderRadius: 14, padding: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} width={140} height={140} alt="QR Code" />
          </div>
        </div>
      </div>
    ),
    { width: 1240, height: 1754 }
  )
}
