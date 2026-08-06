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
    borderOrange: '#FFEDD5',
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
            fontFamily: 'system-ui, -apple-system, sans-serif',
            padding: 60,
            boxSizing: 'border-box',
            color: C.marine,
            position: 'relative',
          }}
        >
          {/* Header Nopalou */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 60, height: 60, borderRadius: 14, background: C.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, fontWeight: 900, color: '#fff' }}>N</div>
              <span style={{ fontSize: 38, fontWeight: 900, color: C.marine, display: 'flex' }}>Nopa<span style={{ color: C.orange, display: 'flex' }}>lou</span></span>
            </div>
            <span style={{ background: '#25D366', padding: '10px 24px', borderRadius: 30, fontSize: 18, fontWeight: 900, color: '#ffffff', display: 'flex' }}>
              💬 CHATBOT WHATSAPP META 24/7
            </span>
          </div>

          {/* Titre & Description */}
          <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h1 style={{ fontSize: 46, fontWeight: 900, margin: 0, color: C.marine, display: 'flex', lineHeight: 1.15 }}>
              Votre Assistant d&apos;Achat Intelligent sur WhatsApp !
            </h1>
            <p style={{ fontSize: 22, color: C.gris, margin: 0, display: 'flex', fontWeight: 600 }}>
              Recherchez des produits, comparez les prix &amp; suivez vos commandes sans quitter WhatsApp.
            </p>
          </div>

          {/* Cartes Fonctionnalités Chatbot (Fonds clairs haute visibilité) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 36, flex: 1 }}>
            {[
              { t: '🔍 Recherche Unifiée Instantanée', d: 'Prix comparés marketplace, boutiques & immo' },
              { t: '🛍️ Panier Multi-Produits WhatsApp', d: 'Commandez directement depuis votre chat' },
              { t: '🔔 Alertes Baisse de Prix', d: 'Soyez notifié dès qu\'un prix baisse à Dakar' },
              { t: '📓 Carnet de Dettes Client POS', d: 'Envoi automatique du solde client par message' },
            ].map(f => (
              <div key={f.t} style={{ background: C.fondVert, border: '1.5px solid #BBF7D0', borderRadius: 16, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: C.marine, display: 'flex' }}>{f.t}</span>
                <span style={{ fontSize: 16, color: C.vert, fontWeight: 700, display: 'flex' }}>{f.d}</span>
              </div>
            ))}
          </div>

          {/* Footer CTA Haute Lisibilité */}
          <div style={{ background: C.marine, borderRadius: 20, padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 30 }}>
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
            fontFamily: 'system-ui, -apple-system, sans-serif',
            padding: 60,
            boxSizing: 'border-box',
            color: C.marine,
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 60, height: 60, borderRadius: 14, background: C.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, fontWeight: 900, color: '#fff' }}>N</div>
              <span style={{ fontSize: 38, fontWeight: 900, color: C.marine, display: 'flex' }}>Nopa<span style={{ color: C.orange, display: 'flex' }}>lou Immo</span></span>
            </div>
            <span style={{ background: '#4338CA', padding: '10px 24px', borderRadius: 30, fontSize: 18, fontWeight: 900, color: '#ffffff', display: 'flex' }}>
              🏠 IMMOBILIER DAKAR &amp; SÉNÉGAL
            </span>
          </div>

          <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h1 style={{ fontSize: 46, fontWeight: 900, margin: 0, color: C.marine, display: 'flex', lineHeight: 1.15 }}>
              Location &amp; Vente d&apos;Appartements, Villas &amp; Terrains
            </h1>
            <p style={{ fontSize: 22, color: C.gris, margin: 0, display: 'flex', fontWeight: 600 }}>
              Annonces vérifiées avec photos HD, prix clairs et contact direct bailleur/agence.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 36, flex: 1 }}>
            {[
              { t: '🏢 Appartements & Studios Dakar', d: 'Almadies, Mermoz, Plateau, Fann, Yoff' },
              { t: '🏡 Villas & Maisons avec Piscine', d: 'Saly, Somone, Ngaparou, Petite Côte' },
              { t: '📐 Terrains Titre Foncier', d: 'Diamniadio, Lac Rose, Sebikotane, Thiès' },
              { t: '📲 Contact Direct WhatsApp Propriétaire', d: 'Zéro intermédiaire masqué · Photos HD' },
            ].map(f => (
              <div key={f.t} style={{ background: C.fondImmo, border: '1.5px solid #C7D2FE', borderRadius: 16, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: C.marine, display: 'flex' }}>{f.t}</span>
                <span style={{ fontSize: 16, color: '#4338CA', fontWeight: 700, display: 'flex' }}>{f.d}</span>
              </div>
            ))}
          </div>

          <div style={{ background: C.marine, borderRadius: 20, padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 30 }}>
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
            fontFamily: 'system-ui, -apple-system, sans-serif',
            padding: 60,
            boxSizing: 'border-box',
            color: C.marine,
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 60, height: 60, borderRadius: 14, background: C.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, fontWeight: 900, color: '#fff' }}>N</div>
              <span style={{ fontSize: 38, fontWeight: 900, color: C.marine, display: 'flex' }}>Nopa<span style={{ color: C.orange, display: 'flex' }}>lou Télécom</span></span>
            </div>
            <span style={{ background: '#0284C7', padding: '10px 24px', borderRadius: 30, fontSize: 18, fontWeight: 900, color: '#ffffff', display: 'flex' }}>
              📶 FORFAITS &amp; PASS INTERNET
            </span>
          </div>

          <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h1 style={{ fontSize: 46, fontWeight: 900, margin: 0, color: C.marine, display: 'flex', lineHeight: 1.15 }}>
              Comparez les Forfaits Orange, Yas, Expresso &amp; Promobile
            </h1>
            <p style={{ fontSize: 22, color: C.gris, margin: 0, display: 'flex', fontWeight: 600 }}>
              Trouvez le meilleur Pass Internet, Minutes &amp; SMS au Go le moins cher au Sénégal !
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 36, flex: 1 }}>
            {[
              { t: '🍊 Orange Sénégal', d: 'Pass Illimix, Max, Fiber & Kirene' },
              { t: '🟡 Yas Sénégal (ex-Free)', d: 'Pass Internet 4G+, Voix & Roaming' },
              { t: '🔴 Expresso Sénégal', d: 'Pass Chrono, Data & International' },
              { t: '🟢 Promobile Sénégal', d: 'Forfaits hybrides & Voix/Data' },
            ].map(f => (
              <div key={f.t} style={{ background: C.fondBleu, border: '1.5px solid #BAE6FD', borderRadius: 16, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: C.marine, display: 'flex' }}>{f.t}</span>
                <span style={{ fontSize: 16, color: '#0284C7', fontWeight: 700, display: 'flex' }}>{f.d}</span>
              </div>
            ))}
          </div>

          <div style={{ background: C.marine, borderRadius: 20, padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 30 }}>
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
            fontFamily: 'system-ui, -apple-system, sans-serif',
            padding: 60,
            boxSizing: 'border-box',
            color: C.marine,
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 60, height: 60, borderRadius: 14, background: C.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, fontWeight: 900, color: '#fff' }}>N</div>
              <span style={{ fontSize: 38, fontWeight: 900, color: C.marine, display: 'flex' }}>Nopa<span style={{ color: C.orange, display: 'flex' }}>lou Partner</span></span>
            </div>
            <span style={{ background: C.vert, padding: '10px 24px', borderRadius: 30, fontSize: 18, fontWeight: 900, color: '#ffffff', display: 'flex' }}>
              💼 APPORTEURS D&apos;AFFAIRES
            </span>
          </div>

          <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h1 style={{ fontSize: 46, fontWeight: 900, margin: 0, color: C.marine, display: 'flex', lineHeight: 1.15 }}>
              Gagnez 20% de Commission Récurrente Chaque Mois à Vie !
            </h1>
            <p style={{ fontSize: 22, color: C.gris, margin: 0, display: 'flex', fontWeight: 600 }}>
              Recrutez des commerçants &amp; agences à Dakar et touchez vos gains par Wave ou Orange Money.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 36, flex: 1 }}>
            {[
              { t: '🏪 Boutique Pro (15 000 F/mois)', d: 'Vous gagnez 3 000 FCFA / mois par boutique' },
              { t: '👑 Boutique Business (35 000 F/mois)', d: 'Vous gagnez 7 000 FCFA / mois par boutique' },
              { t: '📄 Brochure PDF 13 p. Incluses', d: 'Support de vente imprimable pour démarcher' },
              { t: '📱 Retrait Direct Wave & OM', d: 'Paiement mensuel automatique des commissions' },
            ].map(f => (
              <div key={f.t} style={{ background: C.fondVert, border: '1.5px solid #BBF7D0', borderRadius: 16, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: C.marine, display: 'flex' }}>{f.t}</span>
                <span style={{ fontSize: 16, color: C.vert, fontWeight: 700, display: 'flex' }}>{f.d}</span>
              </div>
            ))}
          </div>

          <div style={{ background: C.marine, borderRadius: 20, padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 30 }}>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#ffffff', display: 'flex' }}>💼 Devenez Apporteur d&apos;Affaires</span>
            <span style={{ fontSize: 24, fontWeight: 900, color: '#4ADE80', display: 'flex' }}>nopalou.com/compte/apporteur</span>
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
            fontFamily: 'system-ui, -apple-system, sans-serif',
            padding: 60,
            boxSizing: 'border-box',
            color: C.marine,
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 60, height: 60, borderRadius: 14, background: C.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, fontWeight: 900, color: '#fff' }}>N</div>
              <span style={{ fontSize: 38, fontWeight: 900, color: C.marine, display: 'flex' }}>Nopa<span style={{ color: C.orange, display: 'flex' }}>lou</span></span>
            </div>
            <span style={{ background: C.orange, padding: '10px 24px', borderRadius: 30, fontSize: 18, fontWeight: 900, color: '#ffffff', display: 'flex' }}>
              ⭐ FORMULE PRO MAGASIN
            </span>
          </div>

          <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h1 style={{ fontSize: 46, fontWeight: 900, margin: 0, color: C.marine, display: 'flex', lineHeight: 1.15 }}>
              Caisse Enregistreuse POS Tactile + Boutique en Ligne
            </h1>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginTop: 6 }}>
              <span style={{ fontSize: 56, fontWeight: 900, color: C.vert, display: 'flex' }}>{prix || '15 000 FCFA'}</span>
              <span style={{ fontSize: 22, color: C.gris, fontWeight: 700, display: 'flex' }}>/ mois · 0% commission sur ventes</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 36, flex: 1 }}>
            {[
              { t: '🖥️ Caisse Tactile Magasin & Tickets', d: 'Ventes comptoir, gestion stocks & clôtures' },
              { t: '📦 3 Scanners Inclus', d: 'Caméra Smartphone, Cloud Sync <100ms & Douchette USB' },
              { t: '📓 Carnet de Dettes Client & Relance WA', d: 'Enregistrez les crédits & relancez en 1-clic' },
              { t: '🏷️ Impression Stickers Codes-Barres EAN-13', d: 'Générez & imprimez vos codes-barres GS1' },
              { t: '🛍️ Boutique Web & Commandes WhatsApp', d: 'Visibilité marketplace + commandes directes' },
            ].map(f => (
              <div key={f.t} style={{ background: C.fondOrange, border: `1.5px solid ${C.borderOrange}`, borderRadius: 16, padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: C.marine, display: 'flex' }}>{f.t}</span>
                <span style={{ fontSize: 16, color: C.orange, fontWeight: 700, display: 'flex' }}>{f.d}</span>
              </div>
            ))}
          </div>

          <div style={{ background: C.marine, borderRadius: 20, padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 30 }}>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#ffffff', display: 'flex' }}>🎁 30 Jours d&apos;Essai Gratuits sans carte</span>
            <span style={{ fontSize: 24, fontWeight: 900, color: '#FED7AA', display: 'flex' }}>nopalou.com/boutique</span>
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
            fontFamily: 'system-ui, -apple-system, sans-serif',
            padding: 60,
            boxSizing: 'border-box',
            color: C.marine,
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 60, height: 60, borderRadius: 14, background: C.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, fontWeight: 900, color: '#fff' }}>N</div>
              <span style={{ fontSize: 38, fontWeight: 900, color: C.marine, display: 'flex' }}>Nopa<span style={{ color: C.orange, display: 'flex' }}>lou</span></span>
            </div>
            <span style={{ background: '#1D4ED8', padding: '10px 24px', borderRadius: 30, fontSize: 18, fontWeight: 900, color: '#ffffff', display: 'flex' }}>
              ⚡ BOUTIQUE TAF TAF
            </span>
          </div>

          <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h1 style={{ fontSize: 48, fontWeight: 900, margin: 0, color: C.marine, display: 'flex', lineHeight: 1.15 }}>
              Créez votre Vitrine Web en 30 Secondes Chrono !
            </h1>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginTop: 10 }}>
              <span style={{ fontSize: 60, fontWeight: 900, color: C.vert, display: 'flex' }}>{prix || '2 500 FCFA'}</span>
              <span style={{ fontSize: 24, color: C.gris, fontWeight: 700, display: 'flex' }}>/ mois seulement</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 45, flex: 1 }}>
            {[
              { t: '🔗 URL Personnalisée', d: 'nopalou.com/boutiques/votre-nom' },
              { t: '📲 Commandes WhatsApp 1-Clic', d: 'Recevez les acheteurs directement sur votre mobile' },
              { t: '📋 Gestionnaire de Commandes Web', d: 'Suivi des ventes, statuts et clients' },
              { t: '🔍 Visibilité Marketplace Dakar', d: 'Référenciation de vos produits sur le comparateur' },
            ].map(f => (
              <div key={f.t} style={{ background: C.fondBleu, border: '1.5px solid #BFDBFE', borderRadius: 16, padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: C.marine, display: 'flex' }}>{f.t}</span>
                <span style={{ fontSize: 16, color: '#1D4ED8', fontWeight: 700, display: 'flex' }}>{f.d}</span>
              </div>
            ))}
          </div>

          <div style={{ background: C.orange, borderRadius: 20, padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 30 }}>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#ffffff', display: 'flex' }}>🚀 Lancez votre boutique aujourd&apos;hui</span>
            <span style={{ fontSize: 24, fontWeight: 900, color: '#ffffff', display: 'flex' }}>nopalou.com/creer-boutique</span>
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
            fontFamily: 'system-ui, -apple-system, sans-serif',
            padding: 60,
            boxSizing: 'border-box',
            color: C.marine,
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 60, height: 60, borderRadius: 14, background: C.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, fontWeight: 900, color: '#fff' }}>N</div>
              <span style={{ fontSize: 38, fontWeight: 900, color: C.marine, display: 'flex' }}>Nopa<span style={{ color: C.orange, display: 'flex' }}>lou</span></span>
            </div>
            <span style={{ background: '#7E22CE', padding: '10px 24px', borderRadius: 30, fontSize: 18, fontWeight: 900, color: '#ffffff', display: 'flex' }}>
              👑 FORMULE BUSINESS MULTI-CAISSIERS
            </span>
          </div>

          <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h1 style={{ fontSize: 46, fontWeight: 900, margin: 0, color: C.marine, display: 'flex', lineHeight: 1.15 }}>
              Solution Caisse POS Multi-Vendeurs &amp; Grandes Enseignes
            </h1>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginTop: 10 }}>
              <span style={{ fontSize: 56, fontWeight: 900, color: C.vert, display: 'flex' }}>{prix || '35 000 FCFA'}</span>
              <span style={{ fontSize: 24, color: C.gris, fontWeight: 700, display: 'flex' }}>/ mois · Tout Inclus Pro</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 36, flex: 1 }}>
            {[
              { t: '👥 Multi-Caissiers & Codes PIN', d: 'Chaque caissier possède ses accès sécurisés' },
              { t: '📊 Clôtures de Caisse Z', d: 'Rapports journaliers automatiques & contrôle écarts' },
              { t: '⭐ Emplacement Prioritaire Catégorie', d: 'Bannière mise en avant sur Nopalou' },
              { t: '🔗 URL Dédiée Personnalisée', d: 'nopalou.com/boutiques/votre-enseigne' },
              { t: '📞 Support Prioritaire WhatsApp Meta 24/7', d: 'Assistance dédiée pour vos équipes' },
            ].map(f => (
              <div key={f.t} style={{ background: '#FDF4FF', border: '1.5px solid #F5D0FE', borderRadius: 16, padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: C.marine, display: 'flex' }}>{f.t}</span>
                <span style={{ fontSize: 16, color: '#7E22CE', fontWeight: 700, display: 'flex' }}>{f.d}</span>
              </div>
            ))}
          </div>

          <div style={{ background: C.marine, borderRadius: 20, padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 30 }}>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#ffffff', display: 'flex' }}>🏢 Demandez votre démo Grands Comptes</span>
            <span style={{ fontSize: 24, fontWeight: 900, color: '#E9D5FF', display: 'flex' }}>nopalou.com/boutique</span>
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
            fontFamily: 'system-ui, -apple-system, sans-serif',
            padding: 50,
            boxSizing: 'border-box',
            color: C.marine,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 50, height: 50, borderRadius: 12, background: C.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 900, color: '#fff' }}>N</div>
              <span style={{ fontSize: 32, fontWeight: 900, color: C.marine, display: 'flex' }}>Nopa<span style={{ color: C.orange, display: 'flex' }}>lou</span></span>
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: C.marine, margin: 0, display: 'flex' }}>
              📊 Comparatif des Formules Boutiques Nopalou
            </h1>
          </div>

          <div style={{ display: 'flex', gap: 20, flex: 1 }}>
            
            {/* Taf Taf */}
            <div style={{ flex: 1, background: C.cardBg, border: '1.5px solid #CBD5E1', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#1D4ED8', textTransform: 'uppercase', display: 'flex' }}>Vitrine Web</span>
              <h2 style={{ fontSize: 26, fontWeight: 900, margin: '6px 0 0', color: C.marine, display: 'flex' }}>Taf Taf</h2>
              <span style={{ fontSize: 32, fontWeight: 900, color: C.vert, margin: '8px 0 16px', display: 'flex' }}>2 500 F <span style={{ fontSize: 14, color: C.gris, fontWeight: 600 }}>/mois</span></span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: C.marine, fontWeight: 600 }}>
                <span>✓ Vitrine web en 30 sec</span>
                <span>✓ Lien nopalou.com/shop</span>
                <span>✓ Commandes WhatsApp</span>
                <span>✓ Gestionnaire commandes</span>
                <span>✓ Visibilité comparateur</span>
              </div>
            </div>

            {/* Pro */}
            <div style={{ flex: 1.1, background: '#FFF7ED', border: '3px solid #C75B00', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', position: 'relative' }}>
              <span style={{ position: 'absolute', top: -14, right: 20, background: C.orange, color: '#fff', padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 900, display: 'flex' }}>RECOMMANDE</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: C.orange, textTransform: 'uppercase', display: 'flex' }}>Caisse POS Magasin</span>
              <h2 style={{ fontSize: 28, fontWeight: 900, margin: '6px 0 0', color: C.marine, display: 'flex' }}>Boutique Pro</h2>
              <span style={{ fontSize: 34, fontWeight: 900, color: C.orange, margin: '8px 0 16px', display: 'flex' }}>15 000 F <span style={{ fontSize: 14, color: C.gris, fontWeight: 600 }}>/mois</span></span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: C.marine, fontWeight: 800 }}>
                <span>✓ Tout ce qui est dans Taf Taf</span>
                <span>✓ Caisse Enregistreuse POS</span>
                <span>✓ 3 Scanners (Caméra, Cloud, USB)</span>
                <span>✓ Carnet Dettes WhatsApp 1-clic</span>
                <span>✓ Impression Stickers EAN-13</span>
                <span>✓ 0% commission sur ventes</span>
              </div>
            </div>

            {/* Business */}
            <div style={{ flex: 1, background: C.cardBg, border: '1.5px solid #CBD5E1', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#7E22CE', textTransform: 'uppercase', display: 'flex' }}>Multi-Vendeurs</span>
              <h2 style={{ fontSize: 26, fontWeight: 900, margin: '6px 0 0', color: C.marine, display: 'flex' }}>Business</h2>
              <span style={{ fontSize: 32, fontWeight: 900, color: '#7E22CE', margin: '8px 0 16px', display: 'flex' }}>35 000 F <span style={{ fontSize: 14, color: C.gris, fontWeight: 600 }}>/mois</span></span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: C.marine, fontWeight: 600 }}>
                <span>✓ Tout ce qui est dans Pro</span>
                <span>✓ Multi-Caissiers Code PIN</span>
                <span>✓ Clôtures de Caisse Z</span>
                <span>✓ URL dédiée enseigne</span>
                <span>✓ Bannière mise en avant</span>
                <span>✓ Support prioritaire 24/7</span>
              </div>
            </div>

          </div>

          <div style={{ background: C.orange, borderRadius: 16, padding: '16px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: '#fff', display: 'flex' }}>🎁 30 Jours d&apos;Essai Gratuits sans carte</span>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#fff', display: 'flex' }}>nopalou.com/boutique</span>
          </div>
        </div>
      ),
      { width: 1080, height: 1080 }
    )
  }

  // 9. VISUEL DÉFAUT : BON PLAN DU JOUR / PRODUIT COMPARATIF NOPALOU (FOND CLAIR)
  return new ImageResponse(
    (
      <div
        style={{
          width: 1080,
          height: 1080,
          display: 'flex',
          flexDirection: 'column',
          background: C.bgPage,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: 60,
          boxSizing: 'border-box',
          color: C.marine,
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: C.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 900, color: '#fff' }}>N</div>
            <span style={{ fontSize: 36, fontWeight: 900, color: C.marine, display: 'flex' }}>Nopa<span style={{ color: C.orange, display: 'flex' }}>lou</span></span>
          </div>
          <span style={{ background: C.orange, padding: '10px 24px', borderRadius: 30, fontSize: 18, fontWeight: 900, color: '#fff', display: 'flex' }}>
            🔥 BON PLAN PRIX NOPALOU
          </span>
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 40, marginTop: 30 }}>
          <div style={{ width: 380, height: 380, borderRadius: 24, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', border: '4px solid #E2E8F0', flexShrink: 0 }}>
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt={nom || 'Produit'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 80, display: 'flex' }}>🛍️</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: C.marine }}>{boutique || 'Nopalou'}</span>
              </div>
            )}
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: C.orange, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10, display: 'flex' }}>
              {boutique || 'Vendeur Vérifié Nopalou'}
            </span>
            <h2 style={{ fontSize: 42, fontWeight: 900, color: C.marine, margin: 0, lineHeight: 1.2, display: 'flex' }}>
              {nom || 'Meilleur Prix Détecté à Dakar'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: 24, gap: 8 }}>
              {prixBarre && (
                <span style={{ fontSize: 26, color: C.gris, textDecoration: 'line-through', fontWeight: 700, display: 'flex' }}>
                  {prixBarre}
                </span>
              )}
              <span style={{ fontSize: 54, fontWeight: 900, color: C.vert, display: 'flex', lineHeight: 1 }}>
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
