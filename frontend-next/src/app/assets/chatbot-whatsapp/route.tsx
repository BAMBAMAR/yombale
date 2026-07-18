import { ImageResponse } from 'next/og'

export const runtime = 'edge'

// Post/flyer promo de l'assistant WhatsApp — mockup de conversation montrant
// les 4 groupes de fonctions (recherche, boutiques/panier, alertes, FAQ),
// la bulle "Boutiques & achat" étant mise en avant visuellement.
export async function GET() {
  const bubbleBase = {
    display: 'flex',
    alignItems: 'flex-start',
    borderRadius: 20,
    padding: '14px 22px',
    fontSize: 20,
    lineHeight: 1.3,
    color: '#1C2B4A',
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: 1080,
          height: 1080,
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(160deg, #1C2B4A 0%, #132038 55%, #0f1626 100%)',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Halo décoratif */}
        <div
          style={{
            position: 'absolute',
            right: -140,
            top: -140,
            width: 480,
            height: 480,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(37,211,102,0.28) 0%, transparent 70%)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: -120,
            bottom: -60,
            width: 380,
            height: 380,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(199,91,0,0.22) 0%, transparent 70%)',
            display: 'flex',
          }}
        />

        <div style={{ height: 8, background: '#25D366', display: 'flex' }} />

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '36px 56px 0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 13,
                background: '#C75B00',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 30,
                fontWeight: 900,
                color: '#fff',
              }}
            >
              N
            </div>
            <span style={{ fontSize: 32, fontWeight: 900, color: '#fff', display: 'flex' }}>
              Nopa<span style={{ color: '#C75B00', display: 'flex' }}>lou</span>
            </span>
          </div>

          <div
            style={{
              background: 'rgba(37,211,102,0.18)',
              border: '1.5px solid #25D366',
              borderRadius: 40,
              padding: '9px 22px',
              fontSize: 17,
              color: '#25D366',
              fontWeight: 700,
              display: 'flex',
            }}
          >
            💬 ASSISTANT WHATSAPP
          </div>
        </div>

        {/* Titre */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '26px 60px 0',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              fontSize: 42,
              fontWeight: 900,
              color: '#fff',
              textAlign: 'center',
              lineHeight: 1.16,
            }}
          >
            <span>Comparez, commandez et suivez</span>
            <span>tout, directement sur WhatsApp</span>
          </div>
        </div>

        {/* Mockup conversation */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '24px 64px 0',
          }}
        >
          <div
            style={{
              height: 660,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              background: '#0b141a',
              borderRadius: 32,
              padding: '24px 26px',
              boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
            }}
          >
            {/* Bulle 1 — recherche */}
            <div
              style={{
                ...bubbleBase,
                flexDirection: 'column',
                gap: 4,
                alignSelf: 'flex-start',
                background: '#1f2c34',
                color: '#e9edef',
                borderTopLeftRadius: 6,
                maxWidth: 640,
              }}
            >
              <span style={{ display: 'flex', fontWeight: 800 }}>
                🔍 &laquo;&nbsp;samsung a15&nbsp;&raquo;
              </span>
              <span style={{ display: 'flex' }}>
                Produits, boutiques, immo, télécom : tout dans une seule recherche
              </span>
            </div>

            {/* Bulle 2 — BOUTIQUES & ACHAT : bulle vedette, plus grande, tiltée */}
            <div
              style={{
                display: 'flex',
                alignSelf: 'flex-end',
                transform: 'rotate(-1.2deg)',
                maxWidth: 760,
              }}
            >
              <div
                style={{
                  ...bubbleBase,
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  background: '#dcf8c6',
                  borderTopRightRadius: 6,
                  padding: '18px 26px',
                  boxShadow: '0 10px 26px rgba(0,0,0,0.35)',
                  gap: 8,
                }}
              >
                <span style={{ display: 'flex', fontSize: 23, fontWeight: 800 }}>
                  🛍️ Boutiques &amp; achat
                </span>
                <span style={{ display: 'flex', fontSize: 20 }}>
                  Parcourez une boutique, ajoutez plusieurs articles à votre
                </span>
                <span style={{ display: 'flex', fontSize: 20 }}>
                  panier et commandez — sans quitter le chat.
                </span>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    marginTop: 4,
                    background: '#ffffff',
                    borderRadius: 14,
                    padding: '9px 16px',
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 9,
                      background: '#25D366',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                    }}
                  >
                    🛒
                  </div>
                  <span style={{ display: 'flex', fontSize: 18, fontWeight: 700, color: '#1C2B4A' }}>
                    Panier · 3 articles
                  </span>
                  <span
                    style={{
                      display: 'flex',
                      fontSize: 16,
                      fontWeight: 800,
                      color: '#C75B00',
                      marginLeft: 8,
                    }}
                  >
                    Commander →
                  </span>
                </div>
              </div>
            </div>

            {/* Bulle 3 — alertes & suivi */}
            <div
              style={{
                ...bubbleBase,
                flexDirection: 'column',
                gap: 4,
                alignSelf: 'flex-start',
                background: '#1f2c34',
                color: '#e9edef',
                borderTopLeftRadius: 6,
                maxWidth: 640,
              }}
            >
              <span style={{ display: 'flex' }}>🔔 Alerte activée sur ce prix</span>
              <span style={{ display: 'flex' }}>📦 Suivi de votre commande en temps réel</span>
            </div>

            {/* Bulle 4 — FAQ */}
            <div
              style={{
                ...bubbleBase,
                flexDirection: 'column',
                gap: 4,
                alignSelf: 'flex-start',
                background: '#1f2c34',
                color: '#e9edef',
                borderTopLeftRadius: 6,
                maxWidth: 640,
              }}
            >
              <span style={{ display: 'flex' }}>&laquo;&nbsp;c&apos;est gratuit ?&nbsp;&raquo;</span>
              <span style={{ display: 'flex' }}>❓ Réponse automatique instantanée, 24h/24</span>
            </div>
          </div>
        </div>

        {/* CTA + footer */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '20px 60px 26px',
            gap: 12,
          }}
        >
          <div
            style={{
              background: '#25D366',
              borderRadius: 16,
              padding: '18px 46px',
              fontSize: 26,
              fontWeight: 800,
              color: '#fff',
              display: 'flex',
            }}
          >
            wa.me/221708717942
          </div>
          <span style={{ fontSize: 18, color: '#94A3B8', fontWeight: 700, display: 'flex' }}>
            Disponible 24h/24 · 100% gratuit · Aucune app à installer
          </span>
        </div>
      </div>
    ),
    { width: 1080, height: 1080 }
  )
}
