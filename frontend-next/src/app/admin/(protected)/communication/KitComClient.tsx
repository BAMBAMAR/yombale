'use client'

import { useState } from 'react'
import { fcfa } from '@/lib/format'

interface VisualItem {
  titre: string
  desc: string
  url: string
  usage: string
}

interface SocialItem {
  reseau: string
  emoji: string
  nom: string
  categorie: string
  bio: string
  site: string
  hashtags: string
}

interface PostTemplate {
  titre: string
  texte: string
}

interface Props {
  visuels: VisualItem[]
  textes: SocialItem[]
  postTemplates: PostTemplate[]
  prixDecouverte: number
  prixPro: number
  prixBusiness: number
  commissionBusiness: number
  tauxApporteur: number
}

export default function KitComClient({
  visuels,
  textes,
  postTemplates,
  prixDecouverte,
  prixPro,
  prixBusiness,
  commissionBusiness,
  tauxApporteur,
}: Props) {
  const [tab, setTab] = useState<'reseaux' | 'demarchage' | 'apporteur' | 'whatsapp' | 'generateur' | 'battlecard'>('reseaux')
  
  // Personnalisation Agent / Apporteur
  const [nomAgent, setNomAgent] = useState('')
  const [phoneAgent, setPhoneAgent] = useState('708717942')
  const [codeAgent, setCodeAgent] = useState('')
  
  // Notifications Toast
  const [toast, setToast] = useState<string | null>(null)

  // Générateur Visuels Nopalou (8 Types)
  const [typeVisuel, setTypeVisuel] = useState<
    'forfait_pro' | 'forfait_taftaf' | 'forfait_business' | 'chatbot_wa' | 'immo' | 'telecom' | 'apporteur' | 'comparatif_paliers' | 'bon_plan'
  >('forfait_pro')
  const [genNom, setGenNom] = useState('iPhone 15 Pro Max 256 Go')
  const [genPrix, setGenPrix] = useState('750000')
  const [genPrixBarre, setGenPrixBarre] = useState('850000')
  const [genBoutique, setGenBoutique] = useState('Dakar Tech & Mobile')
  const [genImage, setGenImage] = useState('')
  const [publiEnCours, setPubliEnCours] = useState(false)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const copyToClipboard = (txt: string, label: string) => {
    navigator.clipboard.writeText(txt)
    showToast(`✅ ${label} copié dans le presse-papier !`)
  }

  const handlePublierFb = async (texte: string, imageUrl?: string) => {
    setPubliEnCours(true)
    try {
      const res = await fetch('/admin-proxy/fb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: texte,
          image_url: imageUrl || null,
          publier_instagram: true,
          statut: 'brouillon',
        }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Erreur d\'envoi')
      }
      showToast('🚀 Post transmis au module Publications Facebook (/admin/publications) !')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erreur'
      showToast(`⚠️ Impossible d'envoyer le post : ${msg}`)
    } finally {
      setPubliEnCours(false)
    }
  }

  const agentPhoneFormatted = phoneAgent ? `+221 ${phoneAgent}` : '+221 70 871 79 42'
  const agentNameFormatted = nomAgent ? nomAgent : '[Votre Prénom]'
  const agentCodeFormatted = codeAgent ? codeAgent : '[VOTRE_CODE]'

  const scriptOralPerso = `🚨 [ACCROCHE - 15 sec]
"Bonjour ${agentNameFormatted}, partenaire certifié Nopalou. Vous savez, aujourd'hui vos clients comparent tout sur leur téléphone avant d'acheter. Nopalou, c'est l'outil qui vous permet de ne plus jamais rater une vente."

💡 [LA DOULEUR & LA SOLUTION - 30 sec]
"Actuellement, gérer les commandes WhatsApp et tenir un carnet de dettes, c'est un casse-tête. Avec Nopalou, on vous donne une vraie Caisse Enregistreuse sur votre téléphone (qui marche même sans internet) et une Vitrine en ligne automatique. Vous scannez les articles, envoyez les reçus par WhatsApp, et encaissez directement sur votre Wave ou Orange Money."

🎁 [OFFRE IRRÉFUSABLE - 15 sec]
"Le 1er mois est 100% OFFERT. Pas besoin de carte bancaire, zéro commission sur vos ventes. Après, c'est à partir de seulement ${fcfa(prixPro)}/mois. C'est l'équivalent d'un bon repas pour digitaliser tout votre commerce."

🔥 [APPEL À L'ACTION - 10 sec]
"Je vous active votre mois offert tout de suite ? C'est prêt en 2 minutes. (Renseigner le code : ${agentCodeFormatted})"`

  const apporteurTextePerso = `💼 OPPORTUNITÉ : Devenez Partenaire Nopalou !

Vous avez un réseau de commerçants à Dakar ? Vous cherchez un revenu passif fiable ?
Gagnez ${tauxApporteur}% de commission RÉCURRENTE sur chaque abonnement. Pas une seule fois, mais CHAQUE MOIS à vie !

🚀 Ce que vous gagnez :
- ${fcfa(Math.round(prixPro * tauxApporteur / 100))} à ${fcfa(Math.round(prixBusiness * tauxApporteur / 100))}/mois par boutique active.
- Paiement garanti le 5 du mois via Wave ou OM.
- 0 investissement de départ.

✅ Vente facile :
Le 1er mois est 100% offert pour le commerçant. Vous n'avez qu'à partager votre code : *${agentCodeFormatted}*

📲 Intéressé(e) ? Contactez-moi (${agentNameFormatted}) sur WhatsApp au ${agentPhoneFormatted} pour obtenir votre Kit de Démarrage.`

  // Construction dynamique de l'URL du visuel selon le type sélectionné
  let generateurUrl = `/assets/produit-promo?type=${typeVisuel}`
  if (typeVisuel === 'forfait_pro') {
    generateurUrl += `&prix=${encodeURIComponent(prixPro.toString())}`
  } else if (typeVisuel === 'forfait_taftaf') {
    generateurUrl += `&prix=${encodeURIComponent(prixDecouverte.toString())}`
  } else if (typeVisuel === 'forfait_business') {
    generateurUrl += `&prix=${encodeURIComponent(prixBusiness.toString())}`
  } else if (typeVisuel === 'bon_plan') {
    generateurUrl += `&nom=${encodeURIComponent(genNom)}&prix=${encodeURIComponent(genPrix)}&prixBarre=${encodeURIComponent(genPrixBarre)}&boutique=${encodeURIComponent(genBoutique)}${genImage ? `&image=${encodeURIComponent(genImage)}` : ''}`
  }

  // Légende automatique associée au visuel
  let legendePublication = ''
  if (typeVisuel === 'forfait_pro') {
    legendePublication = `🚀 STOP AUX GESTIONS BROUILLONNES ! Digitalisez votre magasin aujourd'hui.\n\nFini les carnets perdus et les dettes oubliées. Pour seulement ${fcfa(prixPro)}/mois, transformez votre téléphone en véritable Caisse Tactile :\n\n📱 Mode Hors-Ligne (Même sans réseau !)\n📸 Scannez les codes-barres avec votre caméra\n🧾 Éditez des factures et devis pros (PDF)\n💸 Encaissez par Wave/OM sans commission\n\n🎁 OFFRE SPÉCIALE : 30 Jours 100% OFFERTS (Sans carte bancaire)\n👉 Cliquez ici pour créer votre boutique : nopalou.com/boutique (Code : ${agentCodeFormatted})`
  } else if (typeVisuel === 'forfait_taftaf') {
    legendePublication = `⚡ Votre vitrine en ligne prête en 30 secondes chrono !\n\nVous vendez sur WhatsApp ? Ne perdez plus de temps à répondre aux mêmes questions. Pour ${fcfa(prixDecouverte)}/mois :\n\n✅ Lien personnalisé pour vos clients\n✅ Commandes pré-remplies directement sur WhatsApp\n✅ Zéro commission, l'argent tombe sur votre Wave/OM\n\n🎁 TESTEZ GRATUITEMENT pendant 1 mois !\n👉 Créez votre boutique : nopalou.com/creer-boutique`
  } else if (typeVisuel === 'forfait_business') {
    legendePublication = `👑 GESTION VIP POUR GROSSISTES ET GRANDES ENSEIGNES\n\nVous avez plusieurs employés ou boutiques ? Sécurisez votre business :\n\n🔐 Accès caissiers sécurisés par code PIN\n📊 Clôtures de caisse automatiques\n🏢 Gestion multi-magasins\n\n🎁 1er mois 100% OFFERT !\n👉 Demandez une démo : nopalou.com/boutique`
  } else if (typeVisuel === 'chatbot_wa') {
    legendePublication = `🤖 Nopalou dans votre WhatsApp 24h/24 !\n\nEnvie de connaître le prix d'un produit sans scroller pendant des heures ?\n\n💬 Envoyez "MENU" au +221 70 871 79 42\n👉 Notre IA vous donne les meilleurs prix du Sénégal en 2 secondes !\n✅ 100% Gratuit et sans application à télécharger.`
  } else if (typeVisuel === 'immo') {
    legendePublication = `🏠 Marre des courtiers fantômes à Dakar ?\n\nTrouvez votre prochain appartement ou terrain directement sur Nopalou Immo.\n✅ Annonces 100% vérifiées\n✅ Contacts directs sans intermédiaires cachés\n\n👉 Découvrez les offres du jour : nopalou.com/immo`
  } else if (typeVisuel === 'telecom') {
    legendePublication = `📉 Arrêtez de gaspiller votre crédit !\n\nOrange, Free, Expresso... Lequel offre le meilleur pass internet aujourd'hui ?\nDécouvrez notre comparateur magique qui calcule le VRAI coût au Go.\n\n👉 Faites le test gratuit : nopalou.com/telecom`
  } else if (typeVisuel === 'apporteur') {
    legendePublication = `💰 REVENUS PASSIFS : Devenez Partenaire Nopalou\n\nRecommandez le meilleur outil de gestion aux commerçants et gagnez ${tauxApporteur}% de commission CHAQUE MOIS sur leurs abonnements !\n\n✅ 0 FCFA d'investissement\n✅ Paiement assuré par Wave/OM le 5 du mois\n\n👉 Rejoignez l'équipe : nopalou.com/compte/apporteur`
  } else if (typeVisuel === 'comparatif_paliers') {
    legendePublication = `📊 3 Façons de booster votre commerce avec Nopalou :\n\n1️⃣ Taf Taf (${fcfa(prixDecouverte)}/m) : Pour vendre vite sur WhatsApp\n2️⃣ Pro (${fcfa(prixPro)}/m) : La caisse enregistreuse tactile complète\n3️⃣ Business (${fcfa(prixBusiness)}/m) : Pour gérer vos employés et fournisseurs\n\n🎁 Testez la solution de votre choix GRATUITEMENT pendant 30 jours !\n👉 Voir les détails : nopalou.com/boutique`
  } else {
    legendePublication = `🔥 DINGUERIE DU JOUR !\n\n📱 ${genNom}\n💥 PRIX CHOC : ${fcfa(parseInt(genPrix) || 0)} (au lieu de ${fcfa(parseInt(genPrixBarre) || 0)})\n🏪 Vendeur vérifié : ${genBoutique}\n\n👉 Commandez vite avant rupture sur nopalou.com !`
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 20px', fontFamily: 'var(--font-inter), system-ui, -apple-system, sans-serif' }}>
      
      {/* Toast Notification Floating */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          background: '#1C2B4A', color: '#fff', padding: '12px 24px',
          borderRadius: 12, boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
          fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          {toast}
        </div>
      )}

      {/* Header General */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1C2B4A', margin: '0 0 6px' }}>
          🎨 Kit de Communication Nopalou
        </h1>
        <p style={{ color: '#64748B', fontSize: 14, margin: 0 }}>
          Support marketing multi-canal, scripts de terrain, visuels HD et publication automatique vers tous les réseaux sociaux.
        </p>
      </div>

      {/* Barre de Personnalisation Agent / Apporteur (Refonte SaaS) */}
      <div style={{
        background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0',
        padding: '24px', marginBottom: 32, boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
        display: 'flex', flexDirection: 'column', gap: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 20 }}>👤</span>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#0f172a' }}>Identité Apporteur</h3>
            <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>Personnalisez les scripts avec vos informations.</p>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Votre Prénom</label>
            <input 
              type="text" 
              placeholder="Ex: Modou" 
              value={nomAgent} 
              onChange={e => setNomAgent(e.target.value)}
              style={{
                background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 8,
                padding: '10px 14px', fontSize: 14, outline: 'none', transition: 'border-color 0.2s',
                fontFamily: 'inherit'
              }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Numéro WhatsApp</label>
            <div style={{ display: 'flex' }}>
              <span style={{ 
                background: '#e2e8f0', border: '1px solid #cbd5e1', borderRight: 'none', 
                padding: '10px 12px', borderRadius: '8px 0 0 8px', fontSize: 14, color: '#475569', fontWeight: 600 
              }}>+221</span>
              <input 
                type="text" 
                placeholder="708717942" 
                value={phoneAgent} 
                onChange={e => setPhoneAgent(e.target.value)}
                style={{
                  flex: 1, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '0 8px 8px 0',
                  padding: '10px 14px', fontSize: 14, outline: 'none', minWidth: 0,
                  fontFamily: 'inherit'
                }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Code Promo</label>
            <input 
              type="text" 
              placeholder="Ex: MODOU20" 
              value={codeAgent} 
              onChange={e => setCodeAgent(e.target.value.toUpperCase())}
              style={{
                background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 8,
                padding: '10px 14px', fontSize: 14, outline: 'none', fontWeight: 700, color: '#C75B00',
                fontFamily: 'inherit'
              }}
            />
          </div>
        </div>
      </div>

      {/* Navigation par Onglets (6 Tabs) */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', borderBottom: '2px solid #E2E8F0', paddingBottom: 2, marginBottom: 32 }}>
        {[
          { id: 'reseaux', label: '📱 Réseaux & Contenus', emoji: '📱' },
          { id: 'demarchage', label: '🏪 Démarchage B2B & POS', emoji: '🏪' },
          { id: 'battlecard', label: '🎯 Kit Terrain & Objections', emoji: '🎯' },
          { id: 'apporteur', label: '💼 Apporteurs d\'Affaires', emoji: '💼' },
          { id: 'whatsapp', label: '💬 Écosystème WhatsApp', emoji: '💬' },
          { id: 'generateur', label: '⚡ Générateur Affiches Nopalou', emoji: '⚡' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            style={{
              padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: 14, fontWeight: tab === t.id ? 800 : 600,
              color: tab === t.id ? '#C75B00' : '#64748B',
              borderBottom: tab === t.id ? '3px solid #C75B00' : '3px solid transparent',
              whiteSpace: 'nowrap', transition: 'all 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ──── ONGLET 1 : RÉSEAUX SOCIAUX & CONTENUS ──── */}
      {tab === 'reseaux' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          
          {/* Section Liens Officiels Tous Réseaux */}
          <section>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: '#1C2B4A', marginBottom: 16 }}>
              🌐 Liens Officiels des Réseaux Nopalou
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
              {[
                { name: 'TikTok Officiel', handle: '@nopalou.com', url: 'https://www.tiktok.com/@nopalou.com?_r=1&_t=ZS-98f75NgDJNS', icon: '🎵', bg: '#000', color: '#fff' },
                { name: 'Canal WhatsApp', handle: 'Canal Nopalou.com', url: 'https://whatsapp.com/channel/0029Vb8fc4bBadmW40AFKx33', icon: '📢', bg: '#25D366', color: '#fff' },
                { name: 'Facebook Page', handle: 'Nopalou Sénégal', url: 'https://www.facebook.com/profile.php?id=61591675701726', icon: '📘', bg: '#1877F2', color: '#fff' },
                { name: 'Instagram', handle: '@nopalousn', url: 'https://www.instagram.com/nopalousn/', icon: '📸', bg: '#E4405F', color: '#fff' },
                { name: 'Twitter / X', handle: '@nopalou_sn', url: 'https://twitter.com/nopalou_sn', icon: '𝕏', bg: '#0f172a', color: '#fff' },
                { name: 'WhatsApp Support', handle: '+221 70 871 79 42', url: 'https://wa.me/221708717942', icon: '💬', bg: '#128C7E', color: '#fff' },
              ].map(s => (
                <div key={s.name} style={{ border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px', background: '#fff', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900 }}>
                      {s.icon}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#1C2B4A' }}>{s.name}</p>
                      <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>{s.handle}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => copyToClipboard(s.url, s.name)}
                      style={{ flex: 1, padding: '7px', background: '#F1F5F9', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, color: '#1C2B4A', cursor: 'pointer' }}
                    >
                      📋 Copier lien
                    </button>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ padding: '7px 12px', background: s.bg, color: s.color, borderRadius: 6, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}
                    >
                      Ouvrir →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section Visuels HD à télécharger */}
          <section>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: '#1C2B4A', marginBottom: 16 }}>
              🖼 Visuels HD avec Téléchargement Direct 1-Clic
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
              {visuels.map(v => (
                <div key={v.url} style={{ border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
                  <a href={v.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', padding: v.url.includes('icon') || v.url.includes('logo-mark') ? 20 : 0 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={v.url}
                      alt={v.titre}
                      style={{
                        width: '100%',
                        aspectRatio: '4/3',
                        objectFit: v.url.includes('icon') || v.url.includes('logo') ? 'contain' : 'cover',
                        display: 'block',
                      }}
                    />
                  </a>
                  <div style={{ padding: 14 }}>
                    <p style={{ fontSize: 13, fontWeight: 800, color: '#1C2B4A', margin: '0 0 4px' }}>{v.titre}</p>
                    <p style={{ fontSize: 11, color: '#64748B', margin: '0 0 12px' }}>{v.desc}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 10, background: '#FFF7ED', color: '#C75B00', padding: '3px 8px', borderRadius: 6, fontWeight: 800 }}>
                        {v.usage}
                      </span>
                      <a
                        href={v.url}
                        download={v.url.endsWith('.svg') ? `nopalou-${v.titre.toLowerCase().replace(/[^a-z0-9]/g, '-')}.svg` : `nopalou-${v.titre.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`}
                        style={{ padding: '6px 12px', background: '#C75B00', color: '#fff', borderRadius: 6, fontSize: 11, fontWeight: 800, textDecoration: 'none' }}
                      >
                        ⬇ {v.url.endsWith('.svg') ? 'SVG Vectoriel' : 'HD PNG'}
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section Templates de Posts & Publications Automatiques */}
          <section>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: '#1C2B4A', marginBottom: 16 }}>
              📝 Templates de Posts avec Publication Automatique Multi-Réseaux
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {postTemplates.map(p => (
                <div key={p.titre} style={{ border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 800, color: '#C75B00', margin: 0 }}>{p.titre}</h3>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => copyToClipboard(p.texte, p.titre)}
                        style={{ padding: '6px 12px', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12, fontWeight: 700, color: '#1C2B4A', cursor: 'pointer' }}
                      >
                        📋 Copier
                      </button>
                      <button
                        onClick={() => handlePublierFb(p.texte)}
                        disabled={publiEnCours}
                        style={{ padding: '6px 14px', background: '#1877F2', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 800, color: '#fff', cursor: 'pointer' }}
                      >
                        🚀 Publier FB / IG
                      </button>
                      <button
                        onClick={() => {
                          const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(p.texte)}`
                          window.open(waUrl, '_blank')
                        }}
                        style={{ padding: '6px 14px', background: '#25D366', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 800, color: '#fff', cursor: 'pointer' }}
                      >
                        📢 Diffuser Canal WA
                      </button>
                    </div>
                  </div>
                  <pre style={{
                    fontSize: 13, color: '#1C2B4A', whiteSpace: 'pre-wrap', background: '#F8FAFC',
                    border: '1px solid #E2E8F0', borderRadius: 8, padding: 14, margin: 0, lineHeight: 1.7,
                    fontFamily: 'inherit',
                  }}>
                    {p.texte}
                  </pre>
                </div>
              ))}
            </div>
          </section>

          {/* Section Bios Réseaux */}
          <section>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: '#1C2B4A', marginBottom: 16 }}>
              ✍️ Bios et Descriptions pour vos Profils Réseaux
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {textes.map(t => (
                <div key={t.reseau} style={{ border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1C2B4A', margin: 0 }}>
                      {t.emoji} {t.reseau}
                    </h3>
                    <button
                      onClick={() => copyToClipboard(`${t.bio}\n\n${t.site}\n${t.hashtags}`, `Bio ${t.reseau}`)}
                      style={{ padding: '6px 12px', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12, fontWeight: 700, color: '#1C2B4A', cursor: 'pointer' }}
                    >
                      📋 Copier Bio
                    </button>
                  </div>
                  <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 10px' }}><strong>Pseudo :</strong> {t.nom} · <strong>Catégorie :</strong> {t.categorie}</p>
                  <pre style={{ fontSize: 13, color: '#1C2B4A', whiteSpace: 'pre-wrap', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, margin: 0 }}>
                    {t.bio}
                  </pre>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ──── ONGLET 2 : DÉMARCHAGE B2B & POS MAGASIN ──── */}
      {tab === 'demarchage' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
          
          {/* Argumentaire POS & Commerce */}
          <section>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: '#1C2B4A', marginBottom: 16 }}>
              💼 7 Arguments Vendeurs POS, OHADA &amp; Magasin
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { t: '🖥️ Caisse Enregistreuse POS Tactile & 3 Scanners', d: 'Ventes en magasin, scan Caméra Smartphone, Cloud Sync (<100ms) ou Douchette USB + impression tickets.' },
                { t: '📶 Mode Caisse PWA Hors-Ligne (Offline First)', d: 'Continuez d\'encaisser même en cas de coupure Internet ou 4G à Dakar. Synchronisation automatique au retour de la connexion.' },
                { t: '🧾 Factures Proforma & Devis OHADA en PDF', d: 'Émission de documents fiscaux sénégalais conformes (NINEA, RCCM, TVA, Timbre fiscal) avec envoi WhatsApp immédiat.' },
                { t: '📦 Gestion Fournisseurs & Scan OCR', d: 'Enregistrez vos fournisseurs, créez des bons de commande et scannez automatiquement les factures d\'achat avec l\'IA.' },
                { t: '📓 Carnet de Dettes Client & Relances WhatsApp', d: 'Enregistrement des crédits clients et relance en 1-clic sur WhatsApp avec solde exact et lien de paiement.' },
                { t: '👥 Multi-Caissiers & Clôtures de Caisse Z', d: 'Chaque vendeur a son code PIN. Historique des ventes, contrôle des écarts de caisse et clôture Z automatique.' },
                { t: '🎁 1er Mois 100% Offert & Remises -25%', d: `Démarrez sans payer le 1er mois. Formule Pro à ${fcfa(prixPro)}/mois ou Business à ${fcfa(prixBusiness)}/mois avec jusqu'à 3 mois offerts sur l'abonnement annuel.` },
              ].map((a, i) => (
                <div key={a.t} style={{ border: '1px solid #E2E8F0', borderRadius: 12, padding: 18, background: '#fff', display: 'flex', gap: 14 }}>
                  <span style={{ width: 28, height: 28, borderRadius: '50%', background: '#FFF7ED', color: '#C75B00', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {i + 1}
                  </span>
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 800, color: '#1C2B4A' }}>{a.t}</p>
                    <p style={{ margin: 0, fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>{a.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Script Oral Personnalisé */}
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: '#1C2B4A', margin: 0 }}>
                🎙️ Script de Présentation Orale (2 min) — Personnalisé Agent
              </h2>
              <button
                onClick={() => copyToClipboard(scriptOralPerso, 'Script Oral')}
                style={{ padding: '6px 14px', background: '#C75B00', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
              >
                📋 Copier Script
              </button>
            </div>
            <pre style={{
              fontSize: 13, color: '#1C2B4A', whiteSpace: 'pre-wrap', background: '#F8FAFC',
              border: '1px solid #E2E8F0', borderRadius: 10, padding: 20, margin: 0, lineHeight: 1.8,
              fontFamily: 'inherit',
            }}>
              {scriptOralPerso}
            </pre>
          </section>

          {/* Sticker & Chevalet QR Code Caisse POS Imprimable */}
          <section>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: '#1C2B4A', marginBottom: 16 }}>
              🏷️ Sticker &amp; Chevalet de Caisse POS Imprimables
            </h2>
            <div style={{ border: '1px solid #E2E8F0', borderRadius: 14, padding: 24, background: '#fff', display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center' }}>
              <div style={{ width: 180, height: 240, border: '3px solid #C75B00', borderRadius: 16, background: '#FFF7ED', padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', textAlign: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 900, color: '#C75B00' }}>Nopalou POS</span>
                <span style={{ fontSize: 48 }}>📲</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#1C2B4A' }}>Scannez pour payer par Wave/OM ou voir le catalogue</span>
              </div>
              <div style={{ flex: 1, minWidth: 240 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1C2B4A', margin: '0 0 8px' }}>
                  Sticker de Comptoir Magasin (Format A5 / A6)
                </h3>
                <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, margin: '0 0 16px' }}>
                  À imprimer et coller sur la caisse ou le comptoir des boutiques marchandes pour rassurer les clients et faire scanner le QR Code du magasin.
                </p>
                <a
                  href="/assets/flyer-demarchage"
                  download="sticker-caisse-nopalou.png"
                  style={{ display: 'inline-block', padding: '10px 20px', background: '#C75B00', color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 800, textDecoration: 'none' }}
                >
                  ⬇ Télécharger Sticker Imprimable (PNG HD)
                </a>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ──── ONGLET 3 : APPORTEURS D'AFFAIRES ──── */}
      {tab === 'apporteur' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
          
          {/* Grille Commission Unique Sync DB */}
          <section>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: '#1C2B4A', marginBottom: 16 }}>
              💰 Grille de Commission Récurrente (${tauxApporteur}%)
            </h2>
            <div style={{ border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden', background: '#fff', marginBottom: 16 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                    <th style={{ padding: 12, textAlign: 'left', color: '#64748B' }}>Formule Recrutée</th>
                    <th style={{ padding: 12, textAlign: 'left', color: '#64748B' }}>Prix Mensuel</th>
                    <th style={{ padding: 12, textAlign: 'left', color: '#64748B' }}>Vos Gains / Mois (${tauxApporteur}%)</th>
                    <th style={{ padding: 12, textAlign: 'left', color: '#64748B' }}>Gain sur Paiement Annuel (-25%)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: 12, fontWeight: 700 }}>Boutique Taf Taf</td>
                    <td style={{ padding: 12 }}>{fcfa(prixDecouverte)}/mois</td>
                    <td style={{ padding: 12, fontWeight: 800, color: '#C75B00' }}>{fcfa(Math.round(prixDecouverte * tauxApporteur / 100))}/mois</td>
                    <td style={{ padding: 12, color: '#16a34a', fontWeight: 700 }}>{fcfa(Math.round(prixDecouverte * 12 * 0.75 * tauxApporteur / 100))} / an</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: 12, fontWeight: 700 }}>Boutique Pro</td>
                    <td style={{ padding: 12 }}>{fcfa(prixPro)}/mois</td>
                    <td style={{ padding: 12, fontWeight: 800, color: '#C75B00' }}>{fcfa(Math.round(prixPro * tauxApporteur / 100))}/mois</td>
                    <td style={{ padding: 12, color: '#16a34a', fontWeight: 700 }}>{fcfa(Math.round(prixPro * 12 * 0.75 * tauxApporteur / 100))} / an</td>
                  </tr>
                  <tr>
                    <td style={{ padding: 12, fontWeight: 700 }}>Boutique Business</td>
                    <td style={{ padding: 12 }}>{fcfa(prixBusiness)}/mois</td>
                    <td style={{ padding: 12, fontWeight: 800, color: '#C75B00' }}>{fcfa(Math.round(prixBusiness * tauxApporteur / 100))}/mois</td>
                    <td style={{ padding: 12, color: '#16a34a', fontWeight: 700 }}>{fcfa(Math.round(prixBusiness * 12 * 0.75 * tauxApporteur / 100))} / an</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Remises multi-durées appliquées aux commerçants */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14, display: 'flex', gap: 20, alignItems: 'center', fontSize: 13, color: '#475569' }}>
              <span style={{ fontWeight: 800, color: '#1C2B4A' }}>🏷️ Remises commerçants :</span>
              <span>3 mois (-10%)</span>
              <span>·</span>
              <span>6 mois (-15%)</span>
              <span>·</span>
              <span style={{ fontWeight: 800, color: '#C75B00' }}>12 mois (-25% / 3 mois offerts)</span>
            </div>
          </section>

          {/* Texte de Recrutement Personnalisé */}
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: '#1C2B4A', margin: 0 }}>
                📢 Texte de Recrutement Apporteur (Personnalisé)
              </h2>
              <button
                onClick={() => copyToClipboard(apporteurTextePerso, 'Texte Recrutement')}
                style={{ padding: '6px 14px', background: '#C75B00', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
              >
                📋 Copier Texte
              </button>
            </div>
            <pre style={{ fontSize: 13, color: '#1C2B4A', whiteSpace: 'pre-wrap', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 20, margin: 0, lineHeight: 1.8 }}>
              {apporteurTextePerso}
            </pre>
          </section>

          {/* Lien Brochure PDF */}
          <section>
            <div style={{ border: '1.5px solid #25D366', background: '#F0FDF4', borderRadius: 12, padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 800, color: '#166534' }}>📄 Brochure PDF Apporteur (13 Pages)</h3>
                <p style={{ margin: 0, fontSize: 13, color: '#15803D' }}>Présentation complète imprimable pour démarcher votre réseau.</p>
              </div>
              <a href="/brochure-apporteur.pdf" target="_blank" rel="noopener noreferrer" style={{ padding: '10px 18px', background: '#25D366', color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>
                Ouvrir Brochure PDF →
              </a>
            </div>
          </section>
        </div>
      )}

      {/* ──── ONGLET 4 : ÉCOSYSTÈME WHATSAPP META ──── */}
      {tab === 'whatsapp' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
          <section>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: '#1C2B4A', marginBottom: 16 }}>
              💬 4 Piliers du Chatbot WhatsApp Meta (24h/24)
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
              {[
                { t: '🔍 Recherche Unifiée Instantanée', d: 'Tapez "iPhone 15" -> renvoie les prix comparés marketplace, boutiques Nopalou et biens immo.' },
                { t: '🛍️ Panier Multi-Produits (Meta)', d: 'Composez un panier avec plusieurs articles depuis le catalogue WhatsApp et envoyez en 1 clic.' },
                { t: '🔔 Alertes Baisse de Prix', d: 'Recevez un message WhatsApp automatique dès qu\'un produit atteint votre prix cible.' },
                { t: '📓 Carnet Dettes POS Client', d: 'Le marchand enregistre le crédit et le client reçoit son récapitulatif par message WhatsApp.' },
              ].map(f => (
                <div key={f.t} style={{ border: '1px solid #E2E8F0', borderRadius: 12, padding: 18, background: '#fff' }}>
                  <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 800, color: '#25D366' }}>{f.t}</p>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748B', lineHeight: 1.5 }}>{f.d}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div style={{ border: '1px solid #E2E8F0', borderRadius: 14, padding: 24, background: '#fff', display: 'flex', alignItems: 'center', gap: 24 }}>
              <div style={{ width: 100, height: 100, borderRadius: 20, background: '#25D366', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, fontWeight: 900 }}>
                💬
              </div>
              <div>
                <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 800, color: '#1C2B4A' }}>Tester le Bot WhatsApp Nopalou</h3>
                <p style={{ margin: '0 0 14px', fontSize: 13, color: '#64748B' }}>Numéro officiel : +221 70 871 79 42</p>
                <a href="https://wa.me/221708717942" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '9px 18px', background: '#25D366', color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>
                  Envoyer "MENU" sur WhatsApp →
                </a>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ──── ONGLET 6 : KIT TERRAIN & BATTLECARD OBJECTIONS ──── */}
      {tab === 'battlecard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
          
          {/* Section 1 : Fiche Commerciale A5 Imprimable */}
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 900, color: '#1C2B4A', margin: 0 }}>
                  📄 Fiche Commerciale Terrain A5 (Imprimable Recto/Verso)
                </h2>
                <p style={{ fontSize: 13, color: '#64748b', margin: '2px 0 0' }}>
                  Support officiel pour les visites de boutiques et marchés à Dakar.
                </p>
              </div>
              <button
                onClick={() => window.print()}
                style={{
                  padding: '10px 20px', background: '#1C2B4A', color: '#fff',
                  border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 800,
                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8
                }}
              >
                🖨️ Imprimer la Fiche A5
              </button>
            </div>

            <div style={{
              background: '#ffffff', borderRadius: 16, border: '2px dashed #cbd5e1',
              padding: 28, boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
            }}>
              {/* En-tête Fiche A5 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #C75B00', paddingBottom: 16, marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 900 }}>
                    <span style={{ color: '#1C2B4A' }}>Nopa</span><span style={{ color: '#C75B00' }}>lou</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#64748b', marginLeft: 10 }}>&bull; Retail OS Sénégal</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#475569', fontWeight: 700, marginTop: 4 }}>
                    Tout votre commerce dans votre poche : Boutique en ligne, Caisse POS &amp; WhatsApp
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ background: '#16a34a', color: '#fff', fontSize: 11, fontWeight: 900, padding: '4px 12px', borderRadius: 20 }}>
                    🎁 1ER MOIS 100% OFFERT
                  </span>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Zéro carte bancaire requise</div>
                </div>
              </div>

              {/* 3 Blocs Métiers Fiche A5 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
                <div style={{ background: '#fff7ed', padding: 14, borderRadius: 10, border: '1px solid #fed7aa' }}>
                  <div style={{ fontWeight: 900, color: '#C75B00', fontSize: 13, marginBottom: 4 }}>1. Vitrine WhatsApp</div>
                  <div style={{ fontSize: 11.5, color: '#334155', lineHeight: 1.4 }}>
                    Lien web personnalisé. Les clients choisissent leurs articles et commandent directement sur votre WhatsApp.
                  </div>
                </div>
                <div style={{ background: '#f0fdf4', padding: 14, borderRadius: 10, border: '1px solid #bbf7d0' }}>
                  <div style={{ fontWeight: 900, color: '#15803d', fontSize: 13, marginBottom: 4 }}>2. Caisse POS Offline</div>
                  <div style={{ fontSize: 11.5, color: '#334155', lineHeight: 1.4 }}>
                    Caisse tactile sur smartphone/tablette. Fonctionne sans Internet en cas de coupure. Scan &amp; Factures OHADA.
                  </div>
                </div>
                <div style={{ background: '#eff6ff', padding: 14, borderRadius: 10, border: '1px solid #bfdbfe' }}>
                  <div style={{ fontWeight: 900, color: '#1d4ed8', fontSize: 13, marginBottom: 4 }}>3. Dettes &amp; Wave</div>
                  <div style={{ fontSize: 11.5, color: '#334155', lineHeight: 1.4 }}>
                    Carnet de crédits clients (Bor) avec relances WhatsApp 1-clic contenant directement votre lien de paiement Wave.
                  </div>
                </div>
              </div>

              {/* Pied de Fiche avec Coordonnées Agent */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px 16px', borderRadius: 10, fontSize: 12, fontWeight: 700, color: '#334155' }}>
                <div>
                  👤 Conseiller : <strong>{agentNameFormatted}</strong> &bull; 📲 WhatsApp : <strong>{agentPhoneFormatted}</strong>
                </div>
                <div>
                  ⚡ Code Partenaire : <strong style={{ color: '#C75B00' }}>{agentCodeFormatted}</strong> (1 mois offert)
                </div>
              </div>
            </div>
          </section>

          {/* Section 2 : Battlecard Complète des 11 Objections Commerciales */}
          <section>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: '#1C2B4A', marginBottom: 16 }}>
              🛡️ Battlecard Commerciale : Traitement des 11 Objections
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                {
                  q: "« C'est trop compliqué, je ne maîtrise pas l'informatique. »",
                  peur: "Peur de la technologie et de l'échec.",
                  r: "« Si vous savez envoyer une photo et un message vocal sur WhatsApp, vous savez utiliser Nopalou. Il n'y a rien de compliqué à installer, tout se fait avec de gros boutons simples conçus pour aller vite sur votre téléphone. »"
                },
                {
                  q: "« Je vends déjà très bien sur mes statuts WhatsApp actuels. »",
                  peur: "Satisfaction du statu quo et peur de changer d'habitudes.",
                  r: "« Vos statuts WhatsApp sont parfaits ! Nopalou ne remplace pas WhatsApp, il le rend 10 fois plus puissant. Au lieu d'écrire 50 fois le prix en privé, vous mettez votre lien Nopalou dans votre statut : vos clients commandent directement et vous n'avez plus qu'à encaisser. »"
                },
                {
                  q: "« J'ai déjà mes produits notés sur un cahier ou un fichier Excel. »",
                  peur: "Peur de perdre du temps à tout retaper.",
                  r: "« Donnez-nous votre cahier ou votre fichier : notre outil d'import intelligent transfère l'intégralité de vos articles et vos prix en 3 minutes sans que vous n'ayez rien à ressaisir. »"
                },
                {
                  q: "« Je n'ai pas de carte bancaire pour payer un abonnement. »",
                  peur: "Blocage bancaire classique en Afrique.",
                  r: "« Aucun compte bancaire n'est requis ! Vous testez gratuitement pendant 1 mois, et ensuite vous réglez vos 2 500 ou 5 000 FCFA directement avec votre compte Wave ou Orange Money habituel. »"
                },
                {
                  q: "« Que se passe-t-il si la connexion internet ou le réseau coupe ? »",
                  peur: "Instabilité des réseaux télécoms et électricité.",
                  r: "« Notre caisse POS continue de fonctionner à 100% hors-ligne. Vous continuez d'encaisser vos clients au comptoir, et dès que le réseau revient, tout se synchronise automatiquement. »"
                },
                {
                  q: "« C'est cher pour mon petit commerce. »",
                  peur: "Sensibilité au prix et méconnaissance du retour sur investissement.",
                  r: "« À 2 500 FCFA/mois, cela revient à moins de 85 FCFA par jour. Si Nopalou vous permet de récupérer une seule dette oubliée ou de faire une vente de plus par mois, l'outil est déjà 100% rentabilisé. Et le premier mois est entièrement gratuit. »"
                },
                {
                  q: "« Je n'ai pas beaucoup d'articles (moins de 15 produits). »",
                  peur: "Sentiment que l'outil est réservé aux gros magasins.",
                  r: "« C'est justement idéal : en 2 minutes votre vitrine est prête. Vos clients peuvent voir vos 15 articles disponibles en permanence sans que vous ayez à leur réécrire les détails à chaque fois. »"
                },
                {
                  q: "« J'ai déjà une boutique Shopify ou un site web. »",
                  peur: "Double emploi.",
                  r: "« Shopify vous coûte 18 000 FCFA/mois en dollars par carte Visa, sans Wave natif. Avec Nopalou, vous divisez vos coûts par 4, vos clients paient par Wave en 1 clic et vous avez la caisse physique magasin incluse. »"
                },
                {
                  q: "« Les clients préfèrent négocier et payer en espèces. »",
                  peur: "Décalage avec la réalité du marché informel.",
                  r: "« Nopalou gère parfaitement les espèces et les acomptes ! La caisse calcule instantanément le rendu de monnaie et enregistre si le client vous doit un reliquat dans le carnet de dettes sécurisé. »"
                },
                {
                  q: "« Je ne veux pas perdre mes données si j'arrête. »",
                  peur: "Enfermement propriétaire.",
                  r: "« Vos données vous appartiennent à 100%. Vous pouvez exporter tout votre catalogue et votre carnet clients au format Excel/CSV en 1 clic à tout moment. »"
                },
                {
                  q: "« Je veux continuer mon système actuel. »",
                  peur: "Inertie générale.",
                  r: "« Vous pouvez garder votre système actuel et tester Nopalou en parallèle pendant 30 jours sans risque. Si au bout d'un mois vous ne gagnez pas de temps, vous arrêtez sans payer un seul franc. On l'active ensemble ? »"
                }
              ].map((obj, idx) => (
                <div key={idx} style={{
                  background: '#ffffff', borderRadius: 14, padding: 18,
                  border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 10 }}>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 900, color: '#dc2626' }}>❌ Objection : </span>
                      <strong style={{ fontSize: 14, color: '#0f172a' }}>{obj.q}</strong>
                    </div>
                    <button
                      onClick={() => copyToClipboard(obj.r, `Réponse à ${obj.q}`)}
                      style={{
                        padding: '4px 10px', background: '#f1f5f9', border: '1px solid #cbd5e1',
                        borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', flexShrink: 0
                      }}
                    >
                      📋 Copier
                    </button>
                  </div>
                  <div style={{ fontSize: 11.5, color: '#64748b', fontStyle: 'italic', marginBottom: 8 }}>
                    💡 Réalité psychologique : {obj.peur}
                  </div>
                  <div style={{
                    background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8,
                    padding: '10px 14px', fontSize: 13, color: '#166534', lineHeight: 1.5, fontWeight: 600
                  }}>
                    ✅ Réponse recommandée : {obj.r}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 3 : Scripts WhatsApp Terrain & Relance */}
          <section>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: '#1C2B4A', marginBottom: 16 }}>
              💬 Bibliothèque des 5 Scripts WhatsApp Terrain &amp; Relance
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                {
                  titre: "1. Premier Contact Froid (Prospection)",
                  msg: `« Bonjour [Nom_Boutique] ! 👋\n\nJ'ai vu votre superbe collection sur les réseaux. Nous aidons les commerçants à Dakar à automatiser leurs commandes WhatsApp et à tenir leur caisse magasin sur téléphone sans cahier papier.\n\n👉 Exemple de vitrine en 30s : nopalou.com/demo\n\nVous bénéficiez de 30 jours 100% offerts sans engagement. Souhaitez-vous que je configure vos premiers articles gratuitement aujourd'hui ? »`
                },
                {
                  titre: "2. Relance Démo (Commerçant Intéressé)",
                  msg: `« Bonjour ! Avez-vous pu jeter un œil à la démo Nopalou ?\n\nJe peux passer 5 minutes dans votre boutique ou vous guider en direct sur WhatsApp pour mettre vos 3 premiers produits en ligne.\n\nQuel est le meilleur moment pour vous aujourd'hui ? »`
                },
                {
                  titre: "3. Activation Boutique 0 Produit (Post-Inscription)",
                  msg: `« Félicitations pour la création de votre boutique [Nom_Boutique] sur Nopalou ! 🎉\n\nIl ne vous reste qu'une étape : ajouter vos 3 premiers articles pour pouvoir partager votre lien à vos clients.\n\n💡 Envoyez-moi simplement les photos et les prix ici, notre équipe s'occupe de la mise en ligne pour vous en 5 minutes ! »`
                },
                {
                  titre: "4. Fin d'Essai (Conversion Payante Wave)",
                  msg: `« Bonjour ! Votre période d'essai gratuit de 30 jours sur Nopalou se termine dans 3 jours.\n\nPour continuer à profiter de votre caisse POS et de vos commandes WhatsApp sans interruption, vous pouvez renouveler votre formule (${fcfa(prixPro)}/mois) en 1 clic par Wave ici : [Lien_Paiement_Wave]\n\nMerci pour votre fidélité ! »`
                },
                {
                  titre: "5. Message de Parrainage (Pour vos Commerçants Actifs)",
                  msg: `« Vous appréciez Nopalou ? Partagez votre lien de parrainage à vos amis commerçants ! 🎁\n\nPour chaque boutique qui s'abonne grâce à vous, vous touchez ${tauxApporteur}% de commission chaque mois directement sur votre Wave.\n\n👉 Votre lien de parrainage : nopalou.com/creer-boutique?apporteur=${agentCodeFormatted} »`
                }
              ].map((sc, idx) => (
                <div key={idx} style={{
                  background: '#ffffff', borderRadius: 14, padding: 18,
                  border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 900, color: '#C75B00', margin: 0 }}>
                      {sc.titre}
                    </h3>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => copyToClipboard(sc.msg, sc.titre)}
                        style={{ padding: '6px 12px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                      >
                        📋 Copier
                      </button>
                      <button
                        onClick={() => {
                          const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(sc.msg)}`
                          window.open(waUrl, '_blank')
                        }}
                        style={{ padding: '6px 12px', background: '#25D366', color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                      >
                        💬 Envoyer WA
                      </button>
                    </div>
                  </div>
                  <pre style={{
                    fontSize: 12.5, color: '#1C2B4A', whiteSpace: 'pre-wrap', background: '#f8fafc',
                    border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, margin: 0, lineHeight: 1.6,
                    fontFamily: 'inherit'
                  }}>
                    {sc.msg}
                  </pre>
                </div>
              ))}
            </div>
          </section>

        </div>
      )}
      {tab === 'generateur' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <section>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: '#1C2B4A', marginBottom: 16 }}>
              ⚡ Générateur d&apos;Affiches Officiel Nopalou (8 Types de Visuels)
            </h2>

            {/* Sélecteur de type d'affiche */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
              {[
                { id: 'forfait_pro', label: '🖥️ Formule Pro (Caisse POS)', bg: '#FFF7ED', color: '#C75B00' },
                { id: 'forfait_taftaf', label: '⚡ Formule Taf Taf (2 500 F)', bg: '#EFF6FF', color: '#1D4ED8' },
                { id: 'forfait_business', label: '👑 Formule Business (PIN)', bg: '#FDF4FF', color: '#7E22CE' },
                { id: 'chatbot_wa', label: '🤖 Chatbot WhatsApp Meta 24/7', bg: '#F0FDF4', color: '#166534' },
                { id: 'immo', label: '🏠 Immobilier Dakar & Sénégal', bg: '#EEF2FF', color: '#4338CA' },
                { id: 'telecom', label: '📶 Pass & Forfaits Télécom', bg: '#F0F9FF', color: '#0369A1' },
                { id: 'apporteur', label: '💰 Apporteurs d\'Affaires (20%)', bg: '#F0FDF4', color: '#15803D' },
                { id: 'comparatif_paliers', label: '📊 Tableau Synthétique Formules', bg: '#FFF7ED', color: '#C75B00' },
                { id: 'bon_plan', label: '🔥 Bon Plan Prix Comparatif', bg: '#FEF3C7', color: '#92400E' },
              ].map(b => (
                <button
                  key={b.id}
                  onClick={() => setTypeVisuel(b.id as any)}
                  style={{
                    padding: '10px 16px', borderRadius: 10, border: typeVisuel === b.id ? `2px solid ${b.color}` : '1px solid #CBD5E1',
                    background: typeVisuel === b.id ? b.bg : '#fff', color: typeVisuel === b.id ? b.color : '#64748B',
                    fontWeight: 800, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {b.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
              
              {/* Formulaire si mode Bon Plan Produit */}
              {typeVisuel === 'bon_plan' ? (
                <div style={{ border: '1px solid #E2E8F0', borderRadius: 14, padding: 20, background: '#fff', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>Nom du Produit / Offre</label>
                  <input type="text" value={genNom} onChange={e => setGenNom(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }} />

                  <label style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>Prix Promotionnel (FCFA)</label>
                  <input type="text" value={genPrix} onChange={e => setGenPrix(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }} />

                  <label style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>Ancien Prix Barré (FCFA)</label>
                  <input type="text" value={genPrixBarre} onChange={e => setGenPrixBarre(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }} />

                  <label style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>Nom de la Boutique Vendeur</label>
                  <input type="text" value={genBoutique} onChange={e => setGenBoutique(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }} />

                  <label style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>URL de l'image Produit (Optionnel)</label>
                  <input type="url" placeholder="https://..." value={genImage} onChange={e => setGenImage(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }} />
                </div>
              ) : (
                <div style={{ border: '1px solid #E2E8F0', borderRadius: 14, padding: 20, background: '#fff', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 800, color: '#1C2B4A', margin: 0 }}>ℹ️ Description du Visuel Officiel</h3>
                  <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, margin: 0 }}>
                    Ce visuel officiel 1080×1080 aux couleurs de Nopalou met en avant les fonctionnalités clés de la thématique choisie.
                  </p>
                  <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12, color: '#1C2B4A', whiteSpace: 'pre-wrap' }}>
                    {legendePublication}
                  </div>
                  <button
                    onClick={() => copyToClipboard(legendePublication, 'Légende')}
                    style={{ padding: '8px 12px', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                  >
                    📋 Copier la légende du visuel
                  </button>
                </div>
              )}

              {/* Aperçu & Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
                <div style={{ width: '100%', maxWidth: 360, aspectRatio: '1/1', borderRadius: 16, overflow: 'hidden', border: '2px solid #C75B00', boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={generateurUrl} alt="Aperçu Visuel Formule" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 360 }}>
                  <a
                    href={generateurUrl}
                    download={`affiche-nopalou-${typeVisuel}.png`}
                    style={{ flex: 1, textAlign: 'center', padding: '10px', background: '#C75B00', color: '#fff', borderRadius: 8, fontSize: 12, fontWeight: 800, textDecoration: 'none' }}
                  >
                    ⬇ Télécharger HD
                  </a>
                  <button
                    onClick={() => handlePublierFb(legendePublication, generateurUrl)}
                    disabled={publiEnCours}
                    style={{ flex: 1, padding: '10px', background: '#1877F2', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                  >
                    🚀 Publier FB/IG
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
