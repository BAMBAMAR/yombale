import { ImageResponse } from 'next/og'

export const runtime = 'edge'

function formatPrix(val: string | null): string {
  if (!val) return ''
  const num = parseInt(val.replace(/\D/g, ''), 10)
  if (isNaN(num)) return val
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA'
}

function NopalouLogoMark({ size = 60 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`promoMarkGrad_${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF7E22"/>
          <stop offset="35%" stopColor="#EA580C"/>
          <stop offset="70%" stopColor="#C75B00"/>
          <stop offset="100%" stopColor="#9E3C00"/>
        </linearGradient>
      </defs>
      <rect x="26" y="26" width="460" height="460" rx="118" fill={`url(#promoMarkGrad_${size})`}/>
      <path fillRule="evenodd" d="M120 108h272v296H120Z M324 108H188l136 198Z M188 404h136L188 206Z" fill="#FFFFFF"/>
    </svg>
  )
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

  // ── PALETTE DE COULEURS OFFICIELLE NOPALOU (FOND CLAIR & HAUT CONTRASTE) ──
  const C = {
    bgPage: '#FFFDF9',        // Fond principal crème / blanc très clair
    cardBg: '#ffffff',        // Fond carte blanc pur
    border: '#E2E8F0',        // Bordure douce
    marine: '#1C2B4A',        // Titres & Textes principaux (Marine Nopalou)
    orange: '#C75B00',        // Accent principal (Orange Nopalou)
    vert: '#16A34A',          // Prix & Validation (Vert Nopalou)
    gris: '#475569',          // Sous-titres & Détails
    fondOrange: '#FFF7ED',    // Fond doux orange
    fondVert: '#F0FDF4',      // Fond doux vert
    fondBleu: '#EFF6FF',      // Fond doux bleu
    fondImmo: '#EEF2FF',      // Fond doux indigo
    borderOrange: '#FED7AA',
  }

  // 1. VISUEL CHATBOT WHATSAPP META 24/7 (FOND CLAIR)
  if (type === 'chatbot_wa') {
    return new ImageResponse(
      (
        <div
          style={{
            width: 1080,
            height: 1080,
            display: 'flex',
            flexDirection: 'column',
            background: C.bgPage,
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            padding: 56,
            boxSizing: 'border-box',
            color: C.marine,
            position: 'relative',
          }}
        >
          {/* Header Nopalou */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <NopalouLogoMark size={60} />
              <span style={{ fontSize: 38, fontWeight: 900, color: C.marine, letterSpacing: -1, display: 'flex' }}>Nopa<span style={{ color: C.orange, display: 'flex' }}>lou</span></span>
            </div>
            <span style={{ background: '#25D366', padding: '10px 24px', borderRadius: 9999, fontSize: 17, fontWeight: 900, color: '#ffffff', letterSpacing: 0.5, display: 'flex' }}>
              💬 CHATBOT WHATSAPP META 24/7
            </span>
          </div>

          {/* Titre & Description */}
          <div style={{ marginTop: 36, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h1 style={{ fontSize: 44, fontWeight: 900, margin: 0, color: C.marine, letterSpacing: -1.2, display: 'flex', lineHeight: 1.15 }}>
              Votre Assistant d&apos;Achat Intelligent sur WhatsApp !
            </h1>
            <p style={{ fontSize: 20, color: C.gris, margin: 0, display: 'flex', fontWeight: 600, lineHeight: 1.4 }}>
              Recherchez des produits, comparez les prix &amp; suivez vos commandes sans quitter WhatsApp.
            </p>
          </div>

          {/* Cartes Fonctionnalités Chatbot (Fonds clairs haute visibilité) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 32, flex: 1 }}>
            {[
              { t: '🔍 Recherche Unifiée Instantanée', d: 'Prix comparés marketplace, boutiques & immo' },
              { t: '🛍️ Panier Multi-Produits WhatsApp', d: 'Commandez directement depuis votre chat' },
              { t: '🔔 Alertes Baisse de Prix', d: 'Soyez notifié dès qu\'un prix baisse à Dakar' },
              { t: '📓 Carnet de Dettes Client POS', d: 'Envoi automatique du solde client par message' },
            ].map(f => (
              <div key={f.t} style={{ background: C.fondVert, border: '1.5px solid #BBF7D0', borderRadius: 16, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 21, fontWeight: 800, color: C.marine, letterSpacing: -0.3, display: 'flex' }}>{f.t}</span>
                <span style={{ fontSize: 16, color: C.vert, fontWeight: 700, display: 'flex' }}>{f.d}</span>
              </div>
            ))}
          </div>

          {/* Footer CTA Haute Lisibilité */}
          <div style={{ background: C.marine, borderRadius: 20, padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#ffffff', display: 'flex' }}>📲 Tapez &quot;MENU&quot; au +221 70 871 79 42</span>
            <span style={{ fontSize: 24, fontWeight: 900, color: '#25D366', display: 'flex' }}>wa.me/221708717942</span>
          </div>
        </div>
      ),
      { width: 1080, height: 1080 }
    )
  }

  // 2. VISUEL IMMOBILIER DAKAR (FOND CLAIR)
  if (type === 'immo') {
    return new ImageResponse(
      (
        <div
          style={{
            width: 1080,
            height: 1080,
            display: 'flex',
            flexDirection: 'column',
            background: C.bgPage,
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            padding: 56,
            boxSizing: 'border-box',
            color: C.marine,
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <NopalouLogoMark size={60} />
              <span style={{ fontSize: 38, fontWeight: 900, color: C.marine, letterSpacing: -1, display: 'flex' }}>Nopa<span style={{ color: C.orange, display: 'flex' }}>lou Immo</span></span>
            </div>
            <span style={{ background: '#4338CA', padding: '10px 24px', borderRadius: 9999, fontSize: 17, fontWeight: 900, color: '#ffffff', letterSpacing: 0.5, display: 'flex' }}>
              🏠 IMMOBILIER DAKAR &amp; SÉNÉGAL
            </span>
          </div>

          <div style={{ marginTop: 36, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h1 style={{ fontSize: 44, fontWeight: 900, margin: 0, color: C.marine, letterSpacing: -1.2, display: 'flex', lineHeight: 1.15 }}>
              Location &amp; Vente d&apos;Appartements, Villas &amp; Terrains
            </h1>
            <p style={{ fontSize: 20, color: C.gris, margin: 0, display: 'flex', fontWeight: 600, lineHeight: 1.4 }}>
              Annonces vérifiées avec photos HD, prix clairs et contact direct bailleur/agence.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 32, flex: 1 }}>
            {[
              { t: '🏢 Appartements & Studios Dakar', d: 'Almadies, Mermoz, Plateau, Fann, Yoff' },
              { t: '🏡 Villas & Maisons avec Piscine', d: 'Saly, Somone, Ngaparou, Petite Côte' },
              { t: '📐 Terrains Titre Foncier', d: 'Diamniadio, Lac Rose, Sebikotane, Thiès' },
              { t: '📲 Contact Direct WhatsApp Propriétaire', d: 'Zéro intermédiaire masqué · Photos HD' },
            ].map(f => (
              <div key={f.t} style={{ background: C.fondImmo, border: '1.5px solid #C7D2FE', borderRadius: 16, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 21, fontWeight: 800, color: C.marine, letterSpacing: -0.3, display: 'flex' }}>{f.t}</span>
                <span style={{ fontSize: 16, color: '#4338CA', fontWeight: 700, display: 'flex' }}>{f.d}</span>
              </div>
            ))}
          </div>

          <div style={{ background: C.marine, borderRadius: 20, padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#ffffff', display: 'flex' }}>🔑 Trouvez votre bien immobilier</span>
            <span style={{ fontSize: 24, fontWeight: 900, color: '#818CF8', display: 'flex' }}>nopalou.com/immo</span>
          </div>
        </div>
      ),
      { width: 1080, height: 1080 }
    )
  }

  // 3. VISUEL FORFAITS TÉLÉCOM (FOND CLAIR & TEXTE HAUTE LISIBILITÉ)
  if (type === 'telecom') {
    return new ImageResponse(
      (
        <div
          style={{
            width: 1080,
            height: 1080,
            display: 'flex',
            flexDirection: 'column',
            background: C.bgPage,
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            padding: 56,
            boxSizing: 'border-box',
            color: C.marine,
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <NopalouLogoMark size={60} />
              <span style={{ fontSize: 38, fontWeight: 900, color: C.marine, letterSpacing: -1, display: 'flex' }}>Nopa<span style={{ color: C.orange, display: 'flex' }}>lou Télécom</span></span>
            </div>
            <span style={{ background: '#0284C7', padding: '10px 24px', borderRadius: 9999, fontSize: 17, fontWeight: 900, color: '#ffffff', letterSpacing: 0.5, display: 'flex' }}>
              📶 FORFAITS &amp; PASS INTERNET
            </span>
          </div>

          <div style={{ marginTop: 36, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h1 style={{ fontSize: 44, fontWeight: 900, margin: 0, color: C.marine, letterSpacing: -1.2, display: 'flex', lineHeight: 1.15 }}>
              Comparez les Forfaits Orange, Yas, Expresso &amp; Promobile
            </h1>
            <p style={{ fontSize: 20, color: C.gris, margin: 0, display: 'flex', fontWeight: 600, lineHeight: 1.4 }}>
              Trouvez le meilleur Pass Internet, Minutes &amp; SMS au Go le moins cher au Sénégal !
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 32, flex: 1 }}>
            {[
              { t: '🍊 Orange Sénégal', d: 'Pass Illimix, Max, Fiber & Kirene' },
              { t: '🟡 Yas Sénégal (ex-Free)', d: 'Pass Internet 4G+, Voix & Roaming' },
              { t: '🔴 Expresso Sénégal', d: 'Pass Chrono, Data & International' },
              { t: '🟢 Promobile Sénégal', d: 'Forfaits hybrides & Voix/Data' },
            ].map(f => (
              <div key={f.t} style={{ background: C.fondBleu, border: '1.5px solid #BAE6FD', borderRadius: 16, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 21, fontWeight: 800, color: C.marine, letterSpacing: -0.3, display: 'flex' }}>{f.t}</span>
                <span style={{ fontSize: 16, color: '#0284C7', fontWeight: 700, display: 'flex' }}>{f.d}</span>
              </div>
            ))}
          </div>

          <div style={{ background: C.marine, borderRadius: 20, padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#ffffff', display: 'flex' }}>📡 Comparez tous les Pass Télécom</span>
            <span style={{ fontSize: 24, fontWeight: 900, color: '#38BDF8', display: 'flex' }}>nopalou.com/telecom</span>
          </div>
        </div>
      ),
      { width: 1080, height: 1080 }
    )
  }

  // 4. VISUEL PROGRAMME APPORTEURS 20% (FOND CLAIR)
  if (type === 'apporteur') {
    return new ImageResponse(
      (
        <div
          style={{
            width: 1080,
            height: 1080,
            display: 'flex',
            flexDirection: 'column',
            background: C.bgPage,
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            padding: 56,
            boxSizing: 'border-box',
            color: C.marine,
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <NopalouLogoMark size={60} />
              <span style={{ fontSize: 38, fontWeight: 900, color: C.marine, letterSpacing: -1, display: 'flex' }}>Nopa<span style={{ color: C.orange, display: 'flex' }}>lou Partner</span></span>
            </div>
            <span style={{ background: C.vert, padding: '10px 24px', borderRadius: 9999, fontSize: 17, fontWeight: 900, color: '#ffffff', letterSpacing: 0.5, display: 'flex' }}>
              💼 APPORTEURS D&apos;AFFAIRES
            </span>
          </div>

          <div style={{ marginTop: 36, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h1 style={{ fontSize: 44, fontWeight: 900, margin: 0, color: C.marine, letterSpacing: -1.2, display: 'flex', lineHeight: 1.15 }}>
              Gagnez 20% de Commission Récurrente Chaque Mois à Vie !
            </h1>
            <p style={{ fontSize: 20, color: C.gris, margin: 0, display: 'flex', fontWeight: 600, lineHeight: 1.4 }}>
              Recrutez des commerçants &amp; agences à Dakar et touchez vos gains par Wave ou Orange Money.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 28, flex: 1 }}>
            {[
              { t: '🏪 Boutique Pro (5 000 F/mois)', d: 'Vous gagnez 1 000 FCFA / mois par boutique' },
              { t: '👑 Boutique Business (10 000 F/mois)', d: 'Vous gagnez 2 000 FCFA / mois par boutique' },
              { t: '⚡ Boutique Taf Taf (2 500 F/mois)', d: 'Vous gagnez 500 FCFA / mois par boutique' },
              { t: '📄 Brochure PDF (13 P.) & Démo POS', d: 'Support de vente imprimable + Démo 1-clic' },
              { t: '📱 Retrait Direct Wave & OM', d: 'Paiement mensuel automatique des commissions 20%' },
            ].map(f => (
              <div key={f.t} style={{ background: C.fondVert, border: '1.5px solid #BBF7D0', borderRadius: 16, padding: '13px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 19, fontWeight: 800, color: C.marine, letterSpacing: -0.3, display: 'flex' }}>{f.t}</span>
                <span style={{ fontSize: 15, color: C.vert, fontWeight: 700, display: 'flex' }}>{f.d}</span>
              </div>
            ))}
          </div>

          <div style={{ background: C.marine, borderRadius: 20, padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
            <span style={{ fontSize: 21, fontWeight: 900, color: '#ffffff', display: 'flex' }}>💼 Devenez Apporteur d&apos;Affaires</span>
            <span style={{ fontSize: 23, fontWeight: 900, color: '#4ADE80', display: 'flex' }}>nopalou.com/compte/apporteur</span>
          </div>
        </div>
      ),
      { width: 1080, height: 1080 }
    )
  }

  // 5. VISUEL FORMULE PRO (Caisse Enregistreuse POS Tactile — FOND CLAIR)
  if (type === 'forfait_pro') {
    return new ImageResponse(
      (
        <div
          style={{
            width: 1080,
            height: 1080,
            display: 'flex',
            flexDirection: 'column',
            background: C.bgPage,
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            padding: 56,
            boxSizing: 'border-box',
            color: C.marine,
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <NopalouLogoMark size={60} />
              <span style={{ fontSize: 38, fontWeight: 900, color: C.marine, letterSpacing: -1, display: 'flex' }}>Nopa<span style={{ color: C.orange, display: 'flex' }}>lou</span></span>
            </div>
            <span style={{ background: C.orange, padding: '10px 24px', borderRadius: 9999, fontSize: 17, fontWeight: 900, color: '#ffffff', letterSpacing: 0.5, display: 'flex' }}>
              ⭐ FORMULE PRO MAGASIN
            </span>
          </div>

          <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <h1 style={{ fontSize: 42, fontWeight: 900, margin: 0, color: C.marine, letterSpacing: -1.2, display: 'flex', lineHeight: 1.15 }}>
              Caisse POS Tactile + Facturation OHADA + PWA Offline
            </h1>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginTop: 4 }}>
              <span style={{ fontSize: 50, fontWeight: 900, color: C.vert, letterSpacing: -1, display: 'flex' }}>{prix || '5 000 FCFA'}</span>
              <span style={{ fontSize: 19, color: C.gris, fontWeight: 700, display: 'flex' }}>/ mois · 0% commission · -25% sur 12 mois</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24, flex: 1 }}>
            {[
              { t: '🖥️ Caisse POS & 3 Scanners', d: 'Scan Caméra Smartphone, Cloud (<100ms) & Douchette USB' },
              { t: '📶 Mode Caisse PWA Hors-Ligne', d: 'Fonctionne même sans connexion Internet / coupure 4G' },
              { t: '🧾 Factures & Devis OHADA PDF', d: 'Normes fiscales sénégalaises, NINEA, RCCM & TVA' },
              { t: '📓 Carnet Dettes Client & Relance WA', d: 'Enregistrez les crédits & relancez en 1-clic sur WhatsApp' },
              { t: '🏷️ Impression Stickers Codes-Barres GS1', d: 'Générez & imprimez vos étiquettes EAN-13' },
            ].map(f => (
              <div key={f.t} style={{ background: C.fondOrange, border: `1.5px solid ${C.borderOrange}`, borderRadius: 16, padding: '12px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 19, fontWeight: 800, color: C.marine, letterSpacing: -0.3, display: 'flex' }}>{f.t}</span>
                <span style={{ fontSize: 15, color: C.orange, fontWeight: 700, display: 'flex' }}>{f.d}</span>
              </div>
            ))}
          </div>

          <div style={{ background: C.marine, borderRadius: 20, padding: '18px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: '#ffffff', display: 'flex' }}>🎁 1er Mois 100% Offert sans carte</span>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#FED7AA', display: 'flex' }}>nopalou.com/boutique</span>
          </div>
        </div>
      ),
      { width: 1080, height: 1080 }
    )
  }

  // 6. VISUEL FORMULE TAF TAF (FOND CLAIR)
  if (type === 'forfait_taftaf') {
    return new ImageResponse(
      (
        <div
          style={{
            width: 1080,
            height: 1080,
            display: 'flex',
            flexDirection: 'column',
            background: C.bgPage,
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            padding: 56,
            boxSizing: 'border-box',
            color: C.marine,
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <NopalouLogoMark size={60} />
              <span style={{ fontSize: 38, fontWeight: 900, color: C.marine, letterSpacing: -1, display: 'flex' }}>Nopa<span style={{ color: C.orange, display: 'flex' }}>lou</span></span>
            </div>
            <span style={{ background: '#1D4ED8', padding: '10px 24px', borderRadius: 9999, fontSize: 17, fontWeight: 900, color: '#ffffff', letterSpacing: 0.5, display: 'flex' }}>
              ⚡ BOUTIQUE TAF TAF
            </span>
          </div>

          <div style={{ marginTop: 36, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h1 style={{ fontSize: 44, fontWeight: 900, margin: 0, color: C.marine, letterSpacing: -1.2, display: 'flex', lineHeight: 1.15 }}>
              Créez votre Vitrine Web en 30 Secondes Chrono !
            </h1>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginTop: 6 }}>
              <span style={{ fontSize: 54, fontWeight: 900, color: C.vert, letterSpacing: -1, display: 'flex' }}>{prix || '2 500 FCFA'}</span>
              <span style={{ fontSize: 22, color: C.gris, fontWeight: 700, display: 'flex' }}>/ mois · 1er mois 100% offert</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 32, flex: 1 }}>
            {[
              { t: '🔗 URL Personnalisée', d: 'nopalou.com/boutiques/votre-nom' },
              { t: '📲 Commandes WhatsApp 1-Clic', d: 'Recevez les acheteurs directement sur votre mobile' },
              { t: '📓 Carnet de Dettes Client Inclus', d: 'Suivi de vos créances clients et historique' },
              { t: '✨ Import AliExpress & 1688', d: 'Ajoutez vos produits en 1-clic avec photos et descriptif' },
              { t: '🔍 Visibilité Marketplace Dakar', d: '0% de commission sur vos ventes' },
            ].map(f => (
              <div key={f.t} style={{ background: C.fondBleu, border: '1.5px solid #BFDBFE', borderRadius: 16, padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: C.marine, letterSpacing: -0.3, display: 'flex' }}>{f.t}</span>
                <span style={{ fontSize: 15, color: '#1D4ED8', fontWeight: 700, display: 'flex' }}>{f.d}</span>
              </div>
            ))}
          </div>

          <div style={{ background: C.orange, borderRadius: 20, padding: '18px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
            <span style={{ fontSize: 21, fontWeight: 900, color: '#ffffff', display: 'flex' }}>🚀 Lancez votre boutique aujourd&apos;hui</span>
            <span style={{ fontSize: 23, fontWeight: 900, color: '#ffffff', display: 'flex' }}>nopalou.com/creer-boutique</span>
          </div>
        </div>
      ),
      { width: 1080, height: 1080 }
    )
  }

  // 7. VISUEL FORMULE BUSINESS (FOND CLAIR)
  if (type === 'forfait_business') {
    return new ImageResponse(
      (
        <div
          style={{
            width: 1080,
            height: 1080,
            display: 'flex',
            flexDirection: 'column',
            background: C.bgPage,
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            padding: 56,
            boxSizing: 'border-box',
            color: C.marine,
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <NopalouLogoMark size={60} />
              <span style={{ fontSize: 38, fontWeight: 900, color: C.marine, letterSpacing: -1, display: 'flex' }}>Nopa<span style={{ color: C.orange, display: 'flex' }}>lou</span></span>
            </div>
            <span style={{ background: '#7E22CE', padding: '10px 24px', borderRadius: 9999, fontSize: 17, fontWeight: 900, color: '#ffffff', letterSpacing: 0.5, display: 'flex' }}>
              👑 FORMULE BUSINESS VIP
            </span>
          </div>

          <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <h1 style={{ fontSize: 42, fontWeight: 900, margin: 0, color: C.marine, letterSpacing: -1.2, display: 'flex', lineHeight: 1.15 }}>
              Caisse Multi-Caissiers + Fournisseurs OCR + API REST
            </h1>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginTop: 4 }}>
              <span style={{ fontSize: 50, fontWeight: 900, color: C.vert, letterSpacing: -1, display: 'flex' }}>{prix || '10 000 FCFA'}</span>
              <span style={{ fontSize: 19, color: C.gris, fontWeight: 700, display: 'flex' }}>/ mois · Tout Inclus Pro + VIP</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24, flex: 1 }}>
            {[
              { t: '👥 Multi-Caissiers & Codes PIN', d: 'Chaque vendeur possède son PIN et ses droits' },
              { t: '📊 Clôtures de Caisse Z & Marges', d: 'Rapports journaliers automatiques & contrôle des écarts' },
              { t: '🧾 Achats Fournisseurs & Scan OCR', d: 'Bons de commande & scan automatique de factures' },
              { t: '📥 Import par Lot Excel / CSV', d: 'Importez tout votre catalogue en 1-clic' },
              { t: '🔌 Portail Développeur API & Webhooks', d: 'Connectez vos logiciels tiers (ERP, Shopify, WooCommerce)' },
            ].map(f => (
              <div key={f.t} style={{ background: '#FDF4FF', border: '1.5px solid #F5D0FE', borderRadius: 16, padding: '12px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 19, fontWeight: 800, color: C.marine, letterSpacing: -0.3, display: 'flex' }}>{f.t}</span>
                <span style={{ fontSize: 15, color: '#7E22CE', fontWeight: 700, display: 'flex' }}>{f.d}</span>
              </div>
            ))}
          </div>

          <div style={{ background: C.marine, borderRadius: 20, padding: '18px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: '#ffffff', display: 'flex' }}>🏢 Demandez votre démo VIP Grands Comptes</span>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#E9D5FF', display: 'flex' }}>nopalou.com/boutique</span>
          </div>
        </div>
      ),
      { width: 1080, height: 1080 }
    )
  }

  // 8. VISUEL COMPARATIF DES 3 FORMULES (FOND CLAIR)
  if (type === 'comparatif_paliers') {
    return new ImageResponse(
      (
        <div
          style={{
            width: 1080,
            height: 1080,
            display: 'flex',
            flexDirection: 'column',
            background: C.bgPage,
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            padding: 44,
            boxSizing: 'border-box',
            color: C.marine,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <NopalouLogoMark size={46} />
              <span style={{ fontSize: 30, fontWeight: 900, color: C.marine, letterSpacing: -1, display: 'flex' }}>Nopa<span style={{ color: C.orange, display: 'flex' }}>lou</span></span>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: C.marine, letterSpacing: -0.5, margin: 0, display: 'flex' }}>
              📊 Formules Boutiques &amp; Caisse POS
            </h1>
          </div>

          <div style={{ display: 'flex', gap: 16, flex: 1 }}>
            
            {/* Taf Taf */}
            <div style={{ flex: 1, background: C.cardBg, border: '1.5px solid #CBD5E1', borderRadius: 18, padding: 18, display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex' }}>Vitrine Web</span>
              <h2 style={{ fontSize: 22, fontWeight: 900, margin: '4px 0 0', color: C.marine, letterSpacing: -0.5, display: 'flex' }}>Taf Taf</h2>
              <span style={{ fontSize: 26, fontWeight: 900, color: C.vert, letterSpacing: -0.5, margin: '6px 0 12px', display: 'flex' }}>2 500 F <span style={{ fontSize: 12, color: C.gris, fontWeight: 600 }}>/mois</span></span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: C.marine, fontWeight: 600 }}>
                <span>✓ Vitrine web en 30 sec</span>
                <span>✓ Commandes WhatsApp</span>
                <span>✓ Carnet de dettes client</span>
                <span>✓ Import AliExpress / 1688</span>
                <span>✓ 0% de commission</span>
                <span style={{ color: '#16a34a', fontWeight: 800 }}>🎁 1er mois OFFERT</span>
              </div>
            </div>

            {/* Pro */}
            <div style={{ flex: 1.15, background: '#FFF7ED', border: '2.5px solid #C75B00', borderRadius: 18, padding: 18, display: 'flex', flexDirection: 'column', position: 'relative' }}>
              <span style={{ position: 'absolute', top: -12, right: 16, background: C.orange, color: '#fff', padding: '3px 10px', borderRadius: 9999, fontSize: 10, fontWeight: 900, display: 'flex' }}>RECOMMANDE</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: C.orange, textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex' }}>Caisse POS Magasin</span>
              <h2 style={{ fontSize: 24, fontWeight: 900, margin: '4px 0 0', color: C.marine, letterSpacing: -0.5, display: 'flex' }}>Boutique Pro</h2>
              <span style={{ fontSize: 28, fontWeight: 900, color: C.orange, letterSpacing: -0.5, margin: '6px 0 12px', display: 'flex' }}>5 000 F <span style={{ fontSize: 12, color: C.gris, fontWeight: 600 }}>/mois</span></span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: C.marine, fontWeight: 800 }}>
                <span>✓ Tout ce qui est dans Taf Taf</span>
                <span>✓ Caisse POS &amp; 3 Scanners</span>
                <span>✓ Mode Caisse PWA Offline</span>
                <span>✓ Factures &amp; Devis OHADA PDF</span>
                <span>✓ Relance Dettes WhatsApp</span>
                <span>✓ Impression Stickers EAN-13</span>
                <span style={{ color: '#C75B00', fontWeight: 900 }}>🎁 1er mois OFFERT</span>
              </div>
            </div>

            {/* Business */}
            <div style={{ flex: 1, background: C.cardBg, border: '1.5px solid #CBD5E1', borderRadius: 18, padding: 18, display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#7E22CE', textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex' }}>Multi-Caissiers</span>
              <h2 style={{ fontSize: 22, fontWeight: 900, margin: '4px 0 0', color: C.marine, letterSpacing: -0.5, display: 'flex' }}>Business VIP</h2>
              <span style={{ fontSize: 26, fontWeight: 900, color: '#7E22CE', letterSpacing: -0.5, margin: '6px 0 12px', display: 'flex' }}>10 000 F <span style={{ fontSize: 12, color: C.gris, fontWeight: 600 }}>/mois</span></span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: C.marine, fontWeight: 600 }}>
                <span>✓ Tout ce qui est dans Pro</span>
                <span>✓ Multi-Caissiers Code PIN</span>
                <span>✓ Clôtures de Caisse Z</span>
                <span>✓ Fournisseurs &amp; Scan OCR</span>
                <span>✓ Import par lot Excel / CSV</span>
                <span>✓ API REST &amp; Webhooks</span>
                <span style={{ color: '#7E22CE', fontWeight: 800 }}>🎁 1er mois OFFERT</span>
              </div>
            </div>

          </div>

          {/* Bandeau remises multi-durées */}
          <div style={{ background: '#F1F5F9', borderRadius: 12, padding: '10px 20px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginTop: 14, fontSize: 12, fontWeight: 800, color: C.marine }}>
            <span>3 mois : -10%</span>
            <span>·</span>
            <span>6 mois : -15%</span>
            <span>·</span>
            <span style={{ color: '#C75B00' }}>🔥 12 mois : -25% (3 mois offerts)</span>
          </div>

          <div style={{ background: C.marine, borderRadius: 14, padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
            <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', display: 'flex' }}>🎁 Testez 1 Mois Gratuitement</span>
            <span style={{ fontSize: 17, fontWeight: 900, color: '#FED7AA', display: 'flex' }}>nopalou.com/boutique</span>
          </div>
        </div>
      ),
      { width: 1080, height: 1080 }
    )
  }

  // 9. VISUEL DÉFAUT : BON PLAN DU JOUR / PRODUIT COMPARATIF NOPALOU (FOND CLAIR)
  // Calcul adaptatif pour éviter tout débordement ou texte tronqué
  const nomAffichage = nom || 'Meilleur Prix Détecté à Dakar'
  const nomFontSize = nomAffichage.length > 50 ? 28 : nomAffichage.length > 30 ? 34 : 40
  const nomLineHeight = nomAffichage.length > 50 ? 1.15 : 1.2

  const boutiqueAffichage = boutique || 'Vendeur Vérifié Nopalou'
  const boutiqueFontSize = boutiqueAffichage.length > 25 ? 15 : 18

  return new ImageResponse(
    (
      <div
        style={{
          width: 1080,
          height: 1080,
          display: 'flex',
          flexDirection: 'column',
          background: C.bgPage,
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          padding: 56,
          boxSizing: 'border-box',
          color: C.marine,
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <NopalouLogoMark size={56} />
            <span style={{ fontSize: 36, fontWeight: 900, color: C.marine, letterSpacing: -1, display: 'flex' }}>Nopa<span style={{ color: C.orange, display: 'flex' }}>lou</span></span>
          </div>
          <span style={{ background: C.orange, padding: '10px 24px', borderRadius: 9999, fontSize: 17, fontWeight: 900, color: '#fff', letterSpacing: 0.5, display: 'flex' }}>
            🔥 BON PLAN PRIX NOPALOU
          </span>
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 36, marginTop: 24 }}>
          <div style={{ width: 380, height: 380, borderRadius: 24, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', border: '3px solid #E2E8F0', flexShrink: 0 }}>
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt={nomAffichage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 80, display: 'flex' }}>🛍️</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: C.marine, textAlign: 'center', padding: '0 20px' }}>{boutiqueAffichage}</span>
              </div>
            )}
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
            <span style={{ fontSize: boutiqueFontSize, fontWeight: 800, color: C.orange, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10, display: 'flex' }}>
              {boutiqueAffichage}
            </span>
            <h2 style={{ fontSize: nomFontSize, fontWeight: 900, color: C.marine, margin: 0, lineHeight: nomLineHeight, letterSpacing: -0.8, display: 'flex' }}>
              {nomAffichage}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: 20, gap: 6 }}>
              {prixBarre && (
                <span style={{ fontSize: 24, color: C.gris, textDecoration: 'line-through', fontWeight: 700, display: 'flex' }}>
                  {prixBarre}
                </span>
              )}
              <span style={{ fontSize: 50, fontWeight: 900, color: C.vert, letterSpacing: -1, display: 'flex', lineHeight: 1 }}>
                {prix || '15 000 FCFA'}
              </span>
            </div>
          </div>
        </div>

        <div style={{ background: C.marine, borderRadius: 20, padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: '#fff', display: 'flex' }}>Comparez tous les prix sur Nopalou</span>
          <span style={{ fontSize: 22, fontWeight: 900, color: '#FED7AA', display: 'flex' }}>nopalou.com</span>
        </div>
      </div>
    ),
    { width: 1080, height: 1080 }
  )
}
