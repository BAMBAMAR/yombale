import { ImageResponse } from 'next/og'

export const dynamic = 'force-dynamic'

// Fiche Mémo Format Poche (1050 × 1485 px) — Guide Rapide de Survie Terrain Commercial
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const agentNom = searchParams.get('nom') || 'Commercial Terrain'
  const codeAgent = searchParams.get('code') || 'AGENT-221'

  return new ImageResponse(
    (
      <div style={{
        width: 1050, height: 1485,
        display: 'flex', flexDirection: 'column',
        background: '#ffffff',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        position: 'relative',
        padding: '36px 48px',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          {/* Header Compact */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: '3px solid #C75B00', paddingBottom: 16, marginBottom: 18,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 50, height: 50, borderRadius: 12,
                background: '#C75B00', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="30" height="30" viewBox="0 0 512 512">
                  <path
                    fillRule="evenodd"
                    d="M120 108h272v296H120Z M324 108H188l136 198Z M188 404h136L188 206Z"
                    fill="#FFFFFF"
                  />
                </svg>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 24, fontWeight: 900, color: '#1C2B4A', letterSpacing: -0.8 }}>
                  MÉMO DE POCHE COMMERCIAL TERRAIN
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#64748B' }}>
                  Conseiller : {agentNom} ({codeAgent})
                </span>
              </div>
            </div>
            <div style={{
              background: '#1C2B4A', color: '#fff', fontSize: 12, fontWeight: 800,
              padding: '6px 14px', borderRadius: 9999, letterSpacing: 0.5,
            }}>
              NOPALOU SÉNÉGAL
            </div>
          </div>

          {/* 1. L'Accroche en 30 Secondes */}
          <div style={{
            background: '#FFF7ED', border: '1.5px solid #FED7AA',
            borderRadius: 14, padding: '14px 18px', marginBottom: 14,
          }}>
            <span style={{ fontSize: 15, fontWeight: 900, color: '#C75B00', letterSpacing: 0.3 }}>
              ⚡ PITCH ÉCLAIR (30 SECONDES) :
            </span>
            <p style={{ fontSize: 13.5, color: '#1C2B4A', margin: '6px 0 0', lineHeight: 1.45, fontWeight: 650 }}>
              « Bonjour ! Je suis avec Nopalou. On aide les boutiques du quartier à digitaliser leur caisse sur leur propre smartphone, gérer les dettes clients par WhatsApp et avoir une vitrine en ligne sans commission. Le 1er mois est 100% offert, je vous montre en 1 minute ? »
            </p>
          </div>

          {/* 2. Arbre de Décision : Sans Appli vs Avec Appli */}
          <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
            <div style={{
              flex: 1, background: '#F0FDF4', border: '1.5px solid #BBF7D0',
              borderRadius: 12, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              <span style={{ fontSize: 14, fontWeight: 900, color: '#166534' }}>
                ❌ S&apos;il n&apos;a PAS d&apos;application :
              </span>
              <span style={{ fontSize: 12, color: '#334155', fontWeight: 600 }}>• Insister sur la <strong>simplicité</strong> et le <strong>zéro investissement</strong>.</span>
              <span style={{ fontSize: 12, color: '#334155', fontWeight: 600 }}>• Caisse PWA Offline (fonctionne même sans connexion).</span>
              <span style={{ fontSize: 12, color: '#334155', fontWeight: 600 }}>• Carnet de dettes client avec relance WhatsApp en 1 clic.</span>
            </div>

            <div style={{
              flex: 1, background: '#EFF6FF', border: '1.5px solid #BFDBFE',
              borderRadius: 12, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              <span style={{ fontSize: 14, fontWeight: 900, color: '#1E40AF' }}>
                ✅ S&apos;il A DÉJÀ une application :
              </span>
              <span style={{ fontSize: 12, color: '#334155', fontWeight: 600 }}>• Insister sur le <strong>double canal</strong> (Caisse + Vitrine Web synchronisée).</span>
              <span style={{ fontSize: 12, color: '#334155', fontWeight: 600 }}>• Mobilité totale (suivi du chiffre d&apos;affaires à distance sur smartphone).</span>
              <span style={{ fontSize: 12, color: '#334155', fontWeight: 600 }}>• 0% de commission et import Excel en 1 clic.</span>
            </div>
          </div>

          {/* 3. Top 5 Objections & Parades Choc */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 14 }}>
            <span style={{ fontSize: 14.5, fontWeight: 900, color: '#1C2B4A', letterSpacing: -0.3 }}>
              🛡️ PARADES AUX OBJECTIONS TERRAIN :
            </span>
            {[
              {
                obj: '« Je n\'ai pas le temps »',
                rep: '« Justement, la démo prend 60 secondes et l\'inscription 3 minutes sur place. »',
              },
              {
                obj: '« Mon carnet papier me suffit »',
                rep: '« Le carnet ne vous rappelle pas qui doit quoi sur WhatsApp quand vous êtes chez vous. »',
              },
              {
                obj: '« Internet coupe souvent »',
                rep: '« Notre Caisse PWA fonctionne 100% hors-ligne. Vous encaissez même sans réseau. »',
              },
              {
                obj: '« C\'est payant ? »',
                rep: '« Le 1er mois est 100% offert sans carte. Ensuite seulement 2 500 ou 5 000 F/mois. »',
              },
              {
                obj: '« J\'ai peur des impôts »',
                rep: '« C\'est votre outil privé sécurisé, aucun organisme n\'y a accès. C\'est pour votre gestion. »',
              },
            ].map((item, idx) => (
              <div key={idx} style={{
                background: '#F8FAFC', border: '1px solid #E2E8F0',
                borderRadius: 10, padding: '7px 12px', display: 'flex', flexDirection: 'column',
              }}>
                <span style={{ fontSize: 12.5, fontWeight: 800, color: '#DC2626' }}>{item.obj}</span>
                <span style={{ fontSize: 12, color: '#16A34A', fontWeight: 700, marginTop: 1 }}>➔ {item.rep}</span>
              </div>
            ))}
          </div>

          {/* 4. Les 5 Étapes de l'Onboarding 3 Minutes */}
          <div style={{
            background: '#1C2B4A', borderRadius: 14, padding: '14px 18px', color: '#fff',
            display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            <span style={{ fontSize: 14, fontWeight: 900, color: '#38BDF8', letterSpacing: 0.3 }}>
              ⏱️ ONBOARDING 3 MINUTES SUR PLACE :
            </span>
            <span style={{ fontSize: 12, color: '#E2E8F0', lineHeight: 1.4 }}>1. Ouvrir <strong>nopalou.com/creer-boutique</strong> avec votre lien ou code parrain.</span>
            <span style={{ fontSize: 12, color: '#E2E8F0', lineHeight: 1.4 }}>2. Saisir son numéro WhatsApp + nom de boutique.</span>
            <span style={{ fontSize: 12, color: '#E2E8F0', lineHeight: 1.4 }}>3. Prendre en photo 1 vrai produit de sa boutique avec le prix.</span>
            <span style={{ fontSize: 12, color: '#E2E8F0', lineHeight: 1.4 }}>4. Faire une fausse vente sur la Caisse POS devant lui.</span>
            <span style={{ fontSize: 12, color: '#E2E8F0', lineHeight: 1.4 }}>5. Enregistrer le QR code de sa vitrine sur son téléphone.</span>
          </div>
        </div>

        {/* Footer Tarifs & Support */}
        <div style={{
          borderTop: '2px solid #E2E8F0', paddingTop: 12,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#64748B',
        }}>
          <span>Forfaits : Taf Taf (2 500 F) · Pro (5 000 F) · Business (10 000 F)</span>
          <span style={{ fontWeight: 800, color: '#C75B00' }}>Commission apporteur : 20% récurrent à vie</span>
        </div>
      </div>
    ),
    { width: 1050, height: 1485 }
  )
}
