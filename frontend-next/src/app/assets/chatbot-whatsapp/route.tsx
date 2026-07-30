import { ImageResponse } from 'next/og'

export const runtime = 'edge'

// Visuel Dédié — Écosystème Tout-en-Un WhatsApp Nopalou (1080 x 1350 px HD Lumineux)
export async function GET() {
  return new ImageResponse(
    (
      <div style={{
        width: 1080, height: 1350,
        display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(160deg, #FFFFFF 0%, #F8FAFC 50%, #F0FDF4 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        position: 'relative', color: '#1C2B4A',
        padding: 56, boxSizing: 'border-box',
        overflow: 'hidden',
      }}>
        {/* Bande de couleur en haut */}
        <div style={{ height: 10, background: 'linear-gradient(90deg, #25D366 0%, #C75B00 50%, #1C2B4A 100%)', display: 'flex', position: 'absolute', top: 0, left: 0, right: 0 }} />

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
            background: '#F0FDF4', border: '2.5px solid #25D366',
            borderRadius: 30, padding: '12px 28px', fontSize: 18, fontWeight: 900, color: '#25D366', display: 'flex',
          }}>
            💬 ÉCOSYSTÈME WHATSAPP META 24/7
          </div>
        </div>

        {/* HERO TITLE */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 36 }}>
          <span style={{ background: '#25D366', color: '#FFFFFF', padding: '8px 24px', borderRadius: 20, fontSize: 16, fontWeight: 900, letterSpacing: 1.5, marginBottom: 14, display: 'flex' }}>
            TOUTES LES FONCTIONNALITÉS WHATSAPP INTEGRÉES
          </span>
          <h1 style={{ fontSize: 50, fontWeight: 900, color: '#1C2B4A', margin: 0, lineHeight: 1.15 }}>
            Achetez, Vendez &amp; Gérez Vos Dettes sur WhatsApp
          </h1>
          <p style={{ fontSize: 22, color: '#475569', fontWeight: 700, marginTop: 12, marginBottom: 0 }}>
            Découvrez l&apos;assistant IA Nopalou &amp; l&apos;intégration Caisse POS Magasin
          </p>
        </div>

        {/* 4 BLOCS DE FONCTIONNALITÉS WHATSAPP HAUTE NETTETÉ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}>

          {/* Feature 1 : Chatbot IA */}
          <div style={{
            background: '#FFFFFF', border: '3px solid #25D366', borderRadius: 22, padding: 22,
            display: 'flex', alignItems: 'center', gap: 20,
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: 20, background: '#F0FDF4', border: '2px solid #25D366',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, flexShrink: 0
            }}>🤖</div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontSize: 25, fontWeight: 900, color: '#25D366' }}>1. Assistant Chatbot IA Meta 24/7</span>
              <span style={{ fontSize: 17, color: '#334155', fontWeight: 700, marginTop: 4, lineHeight: 1.45 }}>
                Recherche de produits par texte ou photo + comparaison instantanée des prix Auchan, Carrefour &amp; Boutiques.
              </span>
            </div>
          </div>

          {/* Feature 2 : Commande & Panier */}
          <div style={{
            background: '#FFFFFF', border: '3px solid #C75B00', borderRadius: 22, padding: 22,
            display: 'flex', alignItems: 'center', gap: 20,
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: 20, background: '#FFF7ED', border: '2px solid #C75B00',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, flexShrink: 0
            }}>🛒</div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontSize: 25, fontWeight: 900, color: '#C75B00' }}>2. Panier &amp; Commande Directe 1-Clic</span>
              <span style={{ fontSize: 17, color: '#334155', fontWeight: 700, marginTop: 4, lineHeight: 1.45 }}>
                Commandez directement dans WhatsApp sans application. Reçu avec référence unique &amp; suivi en temps réel.
              </span>
            </div>
          </div>

          {/* Feature 3 : Relance Dettes POS */}
          <div style={{
            background: '#FFFFFF', border: '3px solid #16a34a', borderRadius: 22, padding: 22,
            display: 'flex', alignItems: 'center', gap: 20,
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: 20, background: '#F0FDF4', border: '2px solid #16a34a',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, flexShrink: 0
            }}>📓</div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontSize: 25, fontWeight: 900, color: '#16a34a' }}>3. Carnet Dettes &amp; Relance WA 1-Clic</span>
              <span style={{ fontSize: 17, color: '#334155', fontWeight: 700, marginTop: 4, lineHeight: 1.45 }}>
                Module Caisse POS Magasin : relance automatique du client sur WhatsApp avec le solde exact et le lien Wave / OM.
              </span>
            </div>
          </div>

          {/* Feature 4 : Ventes & Multi-Partage */}
          <div style={{
            background: '#FFFFFF', border: '3px solid #1C2B4A', borderRadius: 22, padding: 22,
            display: 'flex', alignItems: 'center', gap: 20,
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: 20, background: '#F8FAFC', border: '2px solid #1C2B4A',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, flexShrink: 0
            }}>📲</div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontSize: 25, fontWeight: 900, color: '#1C2B4A' }}>4. Alertes Ventes Marchands &amp; Partage 1-Clic</span>
              <span style={{ fontSize: 17, color: '#334155', fontWeight: 700, marginTop: 4, lineHeight: 1.45 }}>
                Notification immédiate des commerçants à chaque vente + partage 1-Clic de cartes boutiques &amp; annonces.
              </span>
            </div>
          </div>

        </div>

        {/* FOOTER CTA HAUTE VISIBILITÉ */}
        <div style={{
          background: '#1C2B4A', borderRadius: 24, padding: '22px 36px', marginTop: 20,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          border: '3px solid #25D366',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 25, fontWeight: 900, color: '#FFFFFF' }}>Testez le Bot WhatsApp Nopalou</span>
            <span style={{ fontSize: 16, color: '#CBD5E1', fontWeight: 700, marginTop: 2 }}>Disponible 24h/24 &amp; 7j/7 sur le +221 70 871 79 42</span>
          </div>
          <div style={{
            background: '#25D366', color: '#FFFFFF', padding: '14px 32px', borderRadius: 16,
            fontSize: 24, fontWeight: 900, display: 'flex',
          }}>
            nopalou.com/whatsapp
          </div>
        </div>

      </div>
    ),
    { width: 1080, height: 1350 }
  )
}
