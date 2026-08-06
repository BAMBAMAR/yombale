import { ImageResponse } from 'next/og'

export const runtime = 'edge'

function formatPrix(val: string | null): string {
  if (!val) return ''
  const num = parseInt(val.replace(/\D/g, ''), 10)
  if (isNaN(num)) return val
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA'
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const type = searchParams.get('type') || 'forfait_pro'
  const nom = searchParams.get('nom') || ''
  const prixRaw = searchParams.get('prix') || ''
  const prixBarreRaw = searchParams.get('prixBarre') || ''
  const boutique = searchParams.get('boutique') || ''
  const image = searchParams.get('image') || null

  const prix = formatPrix(prixRaw)
  const prixBarre = formatPrix(prixBarreRaw)

  // 1. VISUEL CHATBOT WHATSAPP META 24/7
  if (type === 'chatbot_wa') {
    return new ImageResponse(
      (
        <div
          style={{
            width: 1080,
            height: 1080,
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(155deg, #0B2B1B 0%, #064E3B 60%, #10B981 100%)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            padding: 60,
            boxSizing: 'border-box',
            color: '#ffffff',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 60, height: 60, borderRadius: 14, background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, fontWeight: 900, color: '#fff' }}>💬</div>
              <span style={{ fontSize: 38, fontWeight: 900, color: '#fff', display: 'flex' }}>Nopa<span style={{ color: '#25D366', display: 'flex' }}>lou</span></span>
            </div>
            <span style={{ background: '#25D366', padding: '10px 24px', borderRadius: 30, fontSize: 18, fontWeight: 900, color: '#fff', display: 'flex' }}>
              🤖 CHATBOT WHATSAPP META 24/7
            </span>
          </div>

          <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h1 style={{ fontSize: 46, fontWeight: 900, margin: 0, color: '#fff', display: 'flex', lineHeight: 1.1 }}>
              Votre Assistant d&apos;Achat Intelligent sur WhatsApp !
            </h1>
            <p style={{ fontSize: 22, color: '#a7f3d0', margin: 0, display: 'flex' }}>
              Recherchez des produits, comparez les prix &amp; suivez vos commandes sans quitter WhatsApp.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 40, flex: 1 }}>
            {[
              { t: '🔍 Recherche Unifiée Instantanée', d: 'Tapez "iPhone 15" -> prix comparés marketplace & immo' },
              { t: '🛍️ Panier Multi-Produits WhatsApp', d: 'Commandez directement depuis le chat' },
              { t: '🔔 Alertes Baisse de Prix', d: 'Notifié sur WhatsApp dès que le prix baisse' },
              { t: '📓 Carnet Dettes POS Client', d: 'Solde de crédit client envoyé par message' },
            ].map(f => (
              <div key={f.t} style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.18)', borderRadius: 16, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: '#ffffff', display: 'flex' }}>{f.t}</span>
                <span style={{ fontSize: 16, color: '#6ee7b7', display: 'flex' }}>{f.d}</span>
              </div>
            ))}
          </div>

          <div style={{ background: '#ffffff', borderRadius: 20, padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 30 }}>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#064E3B', display: 'flex' }}>📲 Tapez &quot;MENU&quot; au +221 70 871 79 42</span>
            <span style={{ fontSize: 24, fontWeight: 900, color: '#25D366', display: 'flex' }}>wa.me/221708717942</span>
          </div>
        </div>
      ),
      { width: 1080, height: 1080 }
    )
  }

  // 2. VISUEL IMMOBILIER DAKAR
  if (type === 'immo') {
    return new ImageResponse(
      (
        <div
          style={{
            width: 1080,
            height: 1080,
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(155deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            padding: 60,
            boxSizing: 'border-box',
            color: '#ffffff',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 60, height: 60, borderRadius: 14, background: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, fontWeight: 900, color: '#fff' }}>🏠</div>
              <span style={{ fontSize: 38, fontWeight: 900, color: '#fff', display: 'flex' }}>Nopa<span style={{ color: '#818cf8', display: 'flex' }}>lou Immo</span></span>
            </div>
            <span style={{ background: '#818cf8', padding: '10px 24px', borderRadius: 30, fontSize: 18, fontWeight: 900, color: '#fff', display: 'flex' }}>
              🏢 IMMOBILIER DAKAR &amp; SÉNÉGAL
            </span>
          </div>

          <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h1 style={{ fontSize: 46, fontWeight: 900, margin: 0, color: '#fff', display: 'flex', lineHeight: 1.1 }}>
              Location &amp; Vente d&apos;Appartements, Villas &amp; Terrains
            </h1>
            <p style={{ fontSize: 22, color: '#c7d2fe', margin: 0, display: 'flex' }}>
              Annonces vérifiées avec photos HD, localisation et contact direct bailleur/agence.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 40, flex: 1 }}>
            {[
              { t: '🏢 Appartements & Studios Dakar', d: 'Almadies, Mermoz, Plateau, Fann, Yoff' },
              { t: '🏡 Villas & Maisons avec Piscine', d: 'Saly, Somone, Ngaparou, Petite Côte' },
              { t: '📐 Terrains Titre Foncier', d: 'Diamniadio, Lac Rose, Sebikotane, Thiès' },
              { t: '📲 Contact Direct WhatsApp Propriétaire', d: 'Zéro intermédiaire masqué · Photos HD' },
            ].map(f => (
              <div key={f.t} style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.18)', borderRadius: 16, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: '#ffffff', display: 'flex' }}>{f.t}</span>
                <span style={{ fontSize: 16, color: '#a5b4fc', display: 'flex' }}>{f.d}</span>
              </div>
            ))}
          </div>

          <div style={{ background: '#ffffff', borderRadius: 20, padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 30 }}>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#1e1b4b', display: 'flex' }}>🔑 Trouvez votre logement aujourd&apos;hui</span>
            <span style={{ fontSize: 24, fontWeight: 900, color: '#4338ca', display: 'flex' }}>nopalou.com/immo</span>
          </div>
        </div>
      ),
      { width: 1080, height: 1080 }
    )
  }

  // 3. VISUEL FORFAITS TÉLÉCOM
  if (type === 'telecom') {
    return new ImageResponse(
      (
        <div
          style={{
            width: 1080,
            height: 1080,
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(155deg, #0284c7 0%, #0369a1 60%, #0f172a 100%)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            padding: 60,
            boxSizing: 'border-box',
            color: '#ffffff',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 60, height: 60, borderRadius: 14, background: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, fontWeight: 900, color: '#fff' }}>📶</div>
              <span style={{ fontSize: 38, fontWeight: 900, color: '#fff', display: 'flex' }}>Nopa<span style={{ color: '#38bdf8', display: 'flex' }}>lou Télécom</span></span>
            </div>
            <span style={{ background: '#38bdf8', padding: '10px 24px', borderRadius: 30, fontSize: 18, fontWeight: 900, color: '#0f172a', display: 'flex' }}>
              📡 FORFAITS &amp; PASS INTERNET
            </span>
          </div>

          <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h1 style={{ fontSize: 46, fontWeight: 900, margin: 0, color: '#fff', display: 'flex', lineHeight: 1.1 }}>
              Comparez les Forfaits Orange, Yas, Expresso &amp; Promobile
            </h1>
            <p style={{ fontSize: 22, color: '#bae6fd', margin: 0, display: 'flex' }}>
              Trouvez le meilleur Pass Internet, Minutes &amp; SMS au Go le moins cher au Sénégal !
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 40, flex: 1 }}>
            {[
              { t: '🍊 Orange Sénégal', d: 'Pass Illimix, Max, Fiber &amp; Kirene' },
              { t: '🟡 Yas Sénégal (ex-Free)', d: 'Pass Internet 4G+, Voix &amp; Roaming' },
              { t: '🔴 Expresso Sénégal', d: 'Pass Chrono, Data &amp; International' },
              { t: '🟢 Promobile Sénégal', d: 'Forfaits hybrides &amp; Voix/Data' },
            ].map(f => (
              <div key={f.t} style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.18)', borderRadius: 16, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: '#ffffff', display: 'flex' }}>{f.t}</span>
                <span style={{ fontSize: 16, color: '#7dd3fc', display: 'flex' }}>{f.d}</span>
              </div>
            ))}
          </div>

          <div style={{ background: '#ffffff', borderRadius: 20, padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 30 }}>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#0369a1', display: 'flex' }}>📡 Comparez les Pass Télécom</span>
            <span style={{ fontSize: 24, fontWeight: 900, color: '#0284c7', display: 'flex' }}>nopalou.com/telecom</span>
          </div>
        </div>
      ),
      { width: 1080, height: 1080 }
    )
  }

  // 4. VISUEL PROGRAMME APPORTEURS 20%
  if (type === 'apporteur') {
    return new ImageResponse(
      (
        <div
          style={{
            width: 1080,
            height: 1080,
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(155deg, #166534 0%, #14532d 60%, #052e16 100%)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            padding: 60,
            boxSizing: 'border-box',
            color: '#ffffff',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 60, height: 60, borderRadius: 14, background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, fontWeight: 900, color: '#fff' }}>💼</div>
              <span style={{ fontSize: 38, fontWeight: 900, color: '#fff', display: 'flex' }}>Nopa<span style={{ color: '#22c55e', display: 'flex' }}>lou Partner</span></span>
            </div>
            <span style={{ background: '#22c55e', padding: '10px 24px', borderRadius: 30, fontSize: 18, fontWeight: 900, color: '#fff', display: 'flex' }}>
              💰 APPORTEURS D&apos;AFFAIRES
            </span>
          </div>

          <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h1 style={{ fontSize: 46, fontWeight: 900, margin: 0, color: '#fff', display: 'flex', lineHeight: 1.1 }}>
              Gagnez 20% de Commission Récurrente Chaque Mois à Vie !
            </h1>
            <p style={{ fontSize: 22, color: '#bbf7d0', margin: 0, display: 'flex' }}>
              Recrutez des commerçants &amp; agences à Dakar et touchez vos gains par Wave ou Orange Money.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 40, flex: 1 }}>
            {[
              { t: '🏪 Boutique Pro (15 000 F/m)', d: 'Vous gagnez 3 000 FCFA / mois par boutique' },
              { t: '👑 Boutique Business (35 000 F/m)', d: 'Vous gagnez 7 000 FCFA / mois par boutique' },
              { t: '📄 Brochure PDF 13 p. Incluse', d: 'Support de vente complet pour démarcher' },
              { t: '📱 Retrait Direct Wave & OM', d: 'Paiement mensuel automatique des commissions' },
            ].map(f => (
              <div key={f.t} style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.18)', borderRadius: 16, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: '#ffffff', display: 'flex' }}>{f.t}</span>
                <span style={{ fontSize: 16, color: '#86efac', display: 'flex' }}>{f.d}</span>
              </div>
            ))}
          </div>

          <div style={{ background: '#ffffff', borderRadius: 20, padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 30 }}>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#14532d', display: 'flex' }}>💼 Devenez Apporteur d&apos;Affaires</span>
            <span style={{ fontSize: 24, fontWeight: 900, color: '#166534', display: 'flex' }}>nopalou.com/compte/apporteur</span>
          </div>
        </div>
      ),
      { width: 1080, height: 1080 }
    )
  }

  // 5. VISUEL FORMULE PRO (Caisse Enregistreuse POS Tactile)
  if (type === 'forfait_pro') {
    return new ImageResponse(
      (
        <div
          style={{
            width: 1080,
            height: 1080,
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(155deg, #1C2B4A 0%, #0f172a 60%, #C75B00 100%)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            padding: 60,
            boxSizing: 'border-box',
            color: '#ffffff',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 60, height: 60, borderRadius: 14, background: '#C75B00', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, fontWeight: 900, color: '#fff' }}>N</div>
              <span style={{ fontSize: 38, fontWeight: 900, color: '#fff', display: 'flex' }}>Nopa<span style={{ color: '#C75B00', display: 'flex' }}>lou</span></span>
            </div>
            <span style={{ background: '#C75B00', padding: '10px 24px', borderRadius: 30, fontSize: 18, fontWeight: 900, color: '#fff', display: 'flex' }}>
              ⭐ FORMULE PRO MAGASIN
            </span>
          </div>

          <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h1 style={{ fontSize: 46, fontWeight: 900, margin: 0, color: '#fff', display: 'flex', lineHeight: 1.1 }}>
              Caisse Enregistreuse POS Tactile + Boutique en Ligne
            </h1>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginTop: 10 }}>
              <span style={{ fontSize: 56, fontWeight: 900, color: '#22C55E', display: 'flex' }}>{prix || '15 000 FCFA'}</span>
              <span style={{ fontSize: 24, color: 'rgba(255,255,255,0.6)', display: 'flex' }}>/ mois · 0% commission sur ventes</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 40, flex: 1 }}>
            {[
              { t: '🖥️ Caisse Tactile Magasin & Tickets', d: 'Ventes comptoir, gestion stocks & clôtures' },
              { t: '📦 3 Scanners Inclus', d: 'Caméra Smartphone, Cloud Sync <100ms & Douchette USB' },
              { t: '📓 Carnet de Dettes Client & Relance WA', d: 'Enregistrez les crédits & relancez en 1-clic' },
              { t: '🏷️ Impression Stickers Codes-Barres EAN-13', d: 'Générez & imprimez vos codes-barres GS1' },
              { t: '🛍️ Boutique Web & Commandes WhatsApp', d: 'Visibilité marketplace + commandes directes' },
            ].map(f => (
              <div key={f.t} style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)', borderRadius: 16, padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: '#ffffff', display: 'flex' }}>{f.t}</span>
                <span style={{ fontSize: 16, color: '#fed7aa', display: 'flex' }}>{f.d}</span>
              </div>
            ))}
          </div>

          <div style={{ background: '#ffffff', borderRadius: 20, padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 30 }}>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#1C2B4A', display: 'flex' }}>🎁 30 Jours d&apos;Essai Gratuits sans carte</span>
            <span style={{ fontSize: 24, fontWeight: 900, color: '#C75B00', display: 'flex' }}>nopalou.com/boutique</span>
          </div>
        </div>
      ),
      { width: 1080, height: 1080 }
    )
  }

  // 6. VISUEL FORMULE TAF TAF
  if (type === 'forfait_taftaf') {
    return new ImageResponse(
      (
        <div
          style={{
            width: 1080,
            height: 1080,
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(155deg, #0f172a 0%, #1e293b 60%, #C75B00 100%)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            padding: 60,
            boxSizing: 'border-box',
            color: '#ffffff',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 60, height: 60, borderRadius: 14, background: '#C75B00', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, fontWeight: 900, color: '#fff' }}>N</div>
              <span style={{ fontSize: 38, fontWeight: 900, color: '#fff', display: 'flex' }}>Nopa<span style={{ color: '#C75B00', display: 'flex' }}>lou</span></span>
            </div>
            <span style={{ background: 'rgba(199,91,0,0.3)', border: '1px solid #C75B00', padding: '10px 24px', borderRadius: 30, fontSize: 18, fontWeight: 900, color: '#fed7aa', display: 'flex' }}>
              ⚡ BOUTIQUE TAF TAF
            </span>
          </div>

          <div style={{ marginTop: 50, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h1 style={{ fontSize: 48, fontWeight: 900, margin: 0, color: '#fff', display: 'flex', lineHeight: 1.1 }}>
              Créez votre Vitrine Web en 30 Secondes Chrono !
            </h1>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginTop: 10 }}>
              <span style={{ fontSize: 60, fontWeight: 900, color: '#22C55E', display: 'flex' }}>{prix || '2 500 FCFA'}</span>
              <span style={{ fontSize: 24, color: 'rgba(255,255,255,0.7)', display: 'flex' }}>/ mois seulement</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 50, flex: 1 }}>
            {[
              { t: '🔗 URL Personnalisée', d: 'nopalou.com/boutiques/votre-nom' },
              { t: '📲 Commandes WhatsApp 1-Clic', d: 'Recevez les acheteurs directement sur votre mobile' },
              { t: '📋 Gestionnaire de Commandes Web', d: 'Suivi des ventes, statuts et clients' },
              { t: '🔍 Visibilité Marketplace Dakar', d: 'Référenciation de vos produits sur le comparateur' },
            ].map(f => (
              <div key={f.t} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 16, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: '#ffffff', display: 'flex' }}>{f.t}</span>
                <span style={{ fontSize: 16, color: '#94a3b8', display: 'flex' }}>{f.d}</span>
              </div>
            ))}
          </div>

          <div style={{ background: '#C75B00', borderRadius: 20, padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 30 }}>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#ffffff', display: 'flex' }}>🚀 Lancez votre boutique aujourd&apos;hui</span>
            <span style={{ fontSize: 24, fontWeight: 900, color: '#ffffff', display: 'flex' }}>nopalou.com/creer-boutique</span>
          </div>
        </div>
      ),
      { width: 1080, height: 1080 }
    )
  }

  // 7. VISUEL FORMULE BUSINESS
  if (type === 'forfait_business') {
    return new ImageResponse(
      (
        <div
          style={{
            width: 1080,
            height: 1080,
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(155deg, #1C2B4A 0%, #0B132B 60%, #1E3A8A 100%)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            padding: 60,
            boxSizing: 'border-box',
            color: '#ffffff',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 60, height: 60, borderRadius: 14, background: '#C75B00', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, fontWeight: 900, color: '#fff' }}>N</div>
              <span style={{ fontSize: 38, fontWeight: 900, color: '#fff', display: 'flex' }}>Nopa<span style={{ color: '#C75B00', display: 'flex' }}>lou</span></span>
            </div>
            <span style={{ background: '#3B82F6', padding: '10px 24px', borderRadius: 30, fontSize: 18, fontWeight: 900, color: '#fff', display: 'flex' }}>
              👑 FORMULE BUSINESS MULTI-CAISSIERS
            </span>
          </div>

          <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h1 style={{ fontSize: 46, fontWeight: 900, margin: 0, color: '#fff', display: 'flex', lineHeight: 1.1 }}>
              Solution Caisse POS Multi-Vendeurs &amp; Grandes Enseignes
            </h1>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginTop: 10 }}>
              <span style={{ fontSize: 56, fontWeight: 900, color: '#22C55E', display: 'flex' }}>{prix || '35 000 FCFA'}</span>
              <span style={{ fontSize: 24, color: 'rgba(255,255,255,0.7)', display: 'flex' }}>/ mois · Tout Inclus Pro</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 40, flex: 1 }}>
            {[
              { t: '👥 Multi-Caissiers & Codes PIN', d: 'Chaque caissier possède ses accès sécurisés' },
              { t: '📊 Clôtures de Caisse Z', d: 'Rapports journaliers automatiques & contrôle écarts' },
              { t: '⭐ Emplacement Prioritaire Catégorie', d: 'Bannière mise en avant sur Nopalou' },
              { t: '🔗 URL Dédiée Personnalisée', d: 'nopalou.com/boutiques/votre-enseigne' },
              { t: '📞 Support Prioritaire WhatsApp Meta 24/7', d: 'Assistance dédiée pour vos équipes' },
            ].map(f => (
              <div key={f.t} style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.18)', borderRadius: 16, padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: '#ffffff', display: 'flex' }}>{f.t}</span>
                <span style={{ fontSize: 16, color: '#93c5fd', display: 'flex' }}>{f.d}</span>
              </div>
            ))}
          </div>

          <div style={{ background: '#ffffff', borderRadius: 20, padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 30 }}>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#1C2B4A', display: 'flex' }}>🏢 Demandez votre démo Grands Comptes</span>
            <span style={{ fontSize: 24, fontWeight: 900, color: '#C75B00', display: 'flex' }}>nopalou.com/boutique</span>
          </div>
        </div>
      ),
      { width: 1080, height: 1080 }
    )
  }

  // 8. VISUEL COMPARATIF DES 3 FORMULES
  if (type === 'comparatif_paliers') {
    return new ImageResponse(
      (
        <div
          style={{
            width: 1080,
            height: 1080,
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(155deg, #1C2B4A 0%, #0f172a 100%)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            padding: 50,
            boxSizing: 'border-box',
            color: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 50, height: 50, borderRadius: 12, background: '#C75B00', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 900, color: '#fff' }}>N</div>
              <span style={{ fontSize: 32, fontWeight: 900, color: '#fff', display: 'flex' }}>Nopa<span style={{ color: '#C75B00', display: 'flex' }}>lou</span></span>
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#ffffff', margin: 0, display: 'flex' }}>
              📊 Comparatif des Formules Boutiques Nopalou
            </h1>
          </div>

          <div style={{ display: 'flex', gap: 20, flex: 1 }}>
            
            {/* Taf Taf */}
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.15)', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#fed7aa', textTransform: 'uppercase', display: 'flex' }}>Vitrine Web</span>
              <h2 style={{ fontSize: 26, fontWeight: 900, margin: '6px 0 0', color: '#fff', display: 'flex' }}>Taf Taf</h2>
              <span style={{ fontSize: 32, fontWeight: 900, color: '#22C55E', margin: '8px 0 16px', display: 'flex' }}>2 500 F <span style={{ fontSize: 14, color: '#94a3b8', fontWeight: 600 }}>/mois</span></span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: '#cbd5e1' }}>
                <span>✓ Vitrine web en 30 sec</span>
                <span>✓ Lien nopalou.com/shop</span>
                <span>✓ Commandes WhatsApp</span>
                <span>✓ Gestionnaire de commandes</span>
                <span>✓ Visibilité comparateur</span>
              </div>
            </div>

            {/* Pro */}
            <div style={{ flex: 1.1, background: '#FFF7ED', border: '3px solid #C75B00', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', position: 'relative' }}>
              <span style={{ position: 'absolute', top: -14, right: 20, background: '#C75B00', color: '#fff', padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 900, display: 'flex' }}>RECOMMANDE</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#C75B00', textTransform: 'uppercase', display: 'flex' }}>Caisse POS Magasin</span>
              <h2 style={{ fontSize: 28, fontWeight: 900, margin: '6px 0 0', color: '#1C2B4A', display: 'flex' }}>Boutique Pro</h2>
              <span style={{ fontSize: 34, fontWeight: 900, color: '#C75B00', margin: '8px 0 16px', display: 'flex' }}>15 000 F <span style={{ fontSize: 14, color: '#64748b', fontWeight: 600 }}>/mois</span></span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: '#1C2B4A', fontWeight: 700 }}>
                <span>✓ Tout ce qui est dans Taf Taf</span>
                <span>✓ Caisse Enregistreuse Tactile</span>
                <span>✓ 3 Scanners (Caméra, Cloud, USB)</span>
                <span>✓ Carnet Dettes WhatsApp 1-clic</span>
                <span>✓ Impression Stickers EAN-13</span>
                <span>✓ 0% commission sur ventes</span>
              </div>
            </div>

            {/* Business */}
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.15)', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#93c5fd', textTransform: 'uppercase', display: 'flex' }}>Multi-Vendeurs</span>
              <h2 style={{ fontSize: 26, fontWeight: 900, margin: '6px 0 0', color: '#fff', display: 'flex' }}>Business</h2>
              <span style={{ fontSize: 32, fontWeight: 900, color: '#60A5FA', margin: '8px 0 16px', display: 'flex' }}>35 000 F <span style={{ fontSize: 14, color: '#94a3b8', fontWeight: 600 }}>/mois</span></span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: '#cbd5e1' }}>
                <span>✓ Tout ce qui est dans Pro</span>
                <span>✓ Multi-Caissiers Code PIN</span>
                <span>✓ Clôtures de Caisse Z</span>
                <span>✓ URL dédiée enseigne</span>
                <span>✓ Bannière mise en avant</span>
                <span>✓ Support prioritaire 24/7</span>
              </div>
            </div>

          </div>

          <div style={{ background: '#C75B00', borderRadius: 16, padding: '16px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: '#fff', display: 'flex' }}>🎁 30 Jours d&apos;Essai Gratuits sans carte</span>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#fff', display: 'flex' }}>nopalou.com/boutique</span>
          </div>
        </div>
      ),
      { width: 1080, height: 1080 }
    )
  }

  // 9. VISUEL DÉFAUT : BON PLAN DU JOUR / PRODUIT COMPARATIF NOPALOU
  return new ImageResponse(
    (
      <div
        style={{
          width: 1080,
          height: 1080,
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(155deg, #1C2B4A 0%, #111C33 60%, #C75B00 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: 60,
          boxSizing: 'border-box',
          color: '#ffffff',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: '#C75B00', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 900, color: '#fff' }}>N</div>
            <span style={{ fontSize: 36, fontWeight: 900, color: '#fff', display: 'flex' }}>Nopa<span style={{ color: '#C75B00', display: 'flex' }}>lou</span></span>
          </div>
          <span style={{ background: '#C75B00', padding: '10px 24px', borderRadius: 30, fontSize: 18, fontWeight: 900, color: '#fff', display: 'flex' }}>
            🔥 BON PLAN PRIX NOPALOU
          </span>
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 40, marginTop: 30 }}>
          <div style={{ width: 380, height: 380, borderRadius: 24, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', border: '4px solid rgba(255,255,255,0.2)', flexShrink: 0 }}>
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt={nom || 'Produit'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 80, display: 'flex' }}>🛍️</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#1C2B4A' }}>{boutique || 'Nopalou'}</span>
              </div>
            )}
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#C75B00', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10, display: 'flex' }}>
              {boutique || 'Vendeur Vérifié Nopalou'}
            </span>
            <h2 style={{ fontSize: 42, fontWeight: 900, color: '#fff', margin: 0, lineHeight: 1.2, display: 'flex' }}>
              {nom || 'Meilleur Prix Détecté à Dakar'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: 24, gap: 8 }}>
              {prixBarre && (
                <span style={{ fontSize: 26, color: 'rgba(255,255,255,0.5)', textDecoration: 'line-through', fontWeight: 700, display: 'flex' }}>
                  {prixBarre}
                </span>
              )}
              <span style={{ fontSize: 54, fontWeight: 900, color: '#22C55E', display: 'flex', lineHeight: 1 }}>
                {prix || '15 000 FCFA'}
              </span>
            </div>
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)', borderRadius: 20, padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: '#fff', display: 'flex' }}>Comparez tous les prix sur Nopalou</span>
          <span style={{ fontSize: 22, fontWeight: 900, color: '#C75B00', display: 'flex' }}>nopalou.com</span>
        </div>
      </div>
    ),
    { width: 1080, height: 1080 }
  )
}
