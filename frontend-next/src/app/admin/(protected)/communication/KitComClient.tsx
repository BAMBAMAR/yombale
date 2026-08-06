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
  const [tab, setTab] = useState<'reseaux' | 'demarchage' | 'apporteur' | 'whatsapp' | 'generateur'>('reseaux')
  
  // Personnalisation Agent / Apporteur
  const [nomAgent, setNomAgent] = useState('')
  const [phoneAgent, setPhoneAgent] = useState('708717942')
  const [codeAgent, setCodeAgent] = useState('')
  
  // Notifications Toast
  const [toast, setToast] = useState<string | null>(null)

  // Générateur Visuels Nopalou & Formules
  const [typeVisuel, setTypeVisuel] = useState<'forfait_pro' | 'forfait_taftaf' | 'forfait_business' | 'comparatif_paliers' | 'bon_plan'>('forfait_pro')
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
      const res = await fetch('/admin-proxy/fb/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: texte,
          image_url: imageUrl || null,
          publier_instagram: true,
          statut: 'brouillon',
        }),
      })
      if (!res.ok) throw new Error('Erreur d\'envoi')
      showToast('🚀 Post transmis au module Publications Facebook (/admin/publications) !')
    } catch {
      showToast('⚠️ Impossible d\'envoyer le post (Vérifiez le module Publications proxy FB)')
    } finally {
      setPubliEnCours(false)
    }
  }

  const agentPhoneFormatted = phoneAgent ? `+221 ${phoneAgent}` : '+221 70 871 79 42'
  const agentNameFormatted = nomAgent ? nomAgent : '[Votre Prénom]'
  const agentCodeFormatted = codeAgent ? codeAgent : '[VOTRE_CODE]'

  const scriptOralPerso = `[Accroche — 15 sec]
Bonjour, je m'appelle ${agentNameFormatted}, je représente Nopalou, le comparateur de prix N°1 au Sénégal (produits, immobilier, télécom).

[Problème — 20 sec]
Vos clients comparent déjà les prix sur Facebook ou en passant en magasin. Nopalou centralise tout cela et vous rend visible gratuitement auprès d'acheteurs prêts à commander.

[Solution & Caisse POS — 40 sec]
Vous créez votre boutique en 2 min, avec Caisse Enregistreuse POS Tactile, 3 Scanners (Caméra, Cloud, USB), Carnet de Dettes Client & Relances WhatsApp 1-Clic. Les commandes arrivent directement sur votre WhatsApp.

[Offre Essai — 20 sec]
Actuellement, nous offrons 30 jours d'essai Pro gratuits sans engagement. Vous testez, vous observez les vues et contacts, et vous décidez ensuite.

[Clôture & Code — 15 sec]
Créons votre boutique ensemble en 5 min. Utilisez mon code partenaire : ${agentCodeFormatted} ou contactez-moi sur WhatsApp au ${agentPhoneFormatted}.`

  const apporteurTextePerso = `💼 Devenez apporteur d'affaires Nopalou

Vous connaissez des commerçants ou agences à Dakar ? Présentez-leur Nopalou et touchez ${tauxApporteur}% de commission récurrente sur chaque abonnement Pro ou Business recruté — chaque mois, tant que la boutique reste active !

Comment ça marche :
1. Présentez Nopalou à votre réseau avec le code : ${agentCodeFormatted}
2. Le commerçant crée sa boutique sur nopalou.com/boutique
3. Touchez ${tauxApporteur}% par Wave ou Orange Money chaque mois.

📲 Contact Apporteur (${agentNameFormatted}) : ${agentPhoneFormatted}`

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
    legendePublication = `🖥️ Digitalisez votre magasin avec Nopalou POS !\n\nVous gérez une boutique à Dakar ? Profitez de la Caisse Enregistreuse Tactile POS pour ${fcfa(prixPro)}/mois avec :\n✅ 3 Scanners inclus (Caméra Smartphone, Cloud Sync <100ms, Douchette USB)\n✅ Carnet de Dettes Client & Relance WhatsApp 1-Clic\n✅ Impression Stickers Codes-Barres EAN-13 GS1\n✅ 0% Commission sur vos ventes !\n\n🎁 30 jours d'essai Pro gratuits sans engagement !\n👉 Créez votre boutique sur nopalou.com/boutique`
  } else if (typeVisuel === 'forfait_taftaf') {
    legendePublication = `⚡ Lancez votre Vitrine Web en 30 secondes pour seulement ${fcfa(prixDecouverte)}/mois !\n\n✅ URL personnalisée nopalou.com/boutiques/votre-nom\n✅ Commandes reçues directement sur votre WhatsApp\n✅ Gestionnaire de commandes Web\n\n👉 Créez votre boutique sur nopalou.com/creer-boutique`
  } else if (typeVisuel === 'forfait_business') {
    legendePublication = `👑 Caisse POS Multi-Vendeurs pour Grandes Enseignes !\n\n✅ Multi-Caissiers sécurisés par code PIN\n✅ Clôtures de Caisse Z automatiques\n✅ Emplacement prioritaire catégorie sur Nopalou\n\n👉 Contactez-nous pour une démo sur nopalou.com/boutique`
  } else if (typeVisuel === 'comparatif_paliers') {
    legendePublication = `📊 Quelle formule Nopalou correspond à votre commerce ?\n\n1️⃣ Taf Taf (${fcfa(prixDecouverte)}/j) : Vitrine web rapide\n2️⃣ Pro (${fcfa(prixPro)}/j) : Caisse Enregistreuse POS Tactile + 3 Scanners\n3️⃣ Business (${fcfa(prixBusiness)}/j) : Multi-caissiers & Clôtures Z\n\n🎁 30 Jours d'essai gratuit sur la formule Pro !\n👉 Comparez sur nopalou.com/boutique`
  } else {
    legendePublication = `🔥 BON PLAN PRIX NOPALOU !\n\n📱 ${genNom}\n💰 ${fcfa(parseInt(genPrix) || 0)} (au lieu de ${fcfa(parseInt(genPrixBarre) || 0)})\n🏪 Vendeur : ${genBoutique}\n\n👉 Comparez tous les prix sur nopalou.com`
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

      {/* Barre de Personnalisation Agent / Apporteur */}
      <div style={{
        background: '#FFF7ED', border: '1.5px solid #FFEDD5', borderRadius: 14,
        padding: '16px 20px', marginBottom: 32, display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>💼</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#C75B00' }}>
            Personnaliser pour Agent / Apporteur :
          </span>
        </div>
        <input
          type="text"
          placeholder="Votre prénom / nom"
          value={nomAgent}
          onChange={e => setNomAgent(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, flex: 1, minWidth: 160 }}
        />
        <input
          type="text"
          placeholder="N° WhatsApp (ex: 708717942)"
          value={phoneAgent}
          onChange={e => setPhoneAgent(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, flex: 1, minWidth: 160 }}
        />
        <input
          type="text"
          placeholder="Code Apporteur (ex: AGENT221)"
          value={codeAgent}
          onChange={e => setCodeAgent(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, flex: 1, minWidth: 160 }}
        />
      </div>

      {/* Navigation par Onglets (5 Tabs) */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', borderBottom: '2px solid #E2E8F0', paddingBottom: 2, marginBottom: 32 }}>
        {[
          { id: 'reseaux', label: '📱 Réseaux & Contenus', emoji: '📱' },
          { id: 'demarchage', label: '🏪 Démarchage B2B & POS', emoji: '🏪' },
          { id: 'apporteur', label: '💼 Apporteurs d\'Affaires', emoji: '💼' },
          { id: 'whatsapp', label: '💬 Écosystème WhatsApp', emoji: '💬' },
          { id: 'generateur', label: '⚡ Générateur Affiches Formules', emoji: '⚡' },
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
                  <a href={v.url} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={v.url} alt={v.titre} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }} />
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
                        download={`nopalou-${v.titre.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`}
                        style={{ padding: '6px 12px', background: '#C75B00', color: '#fff', borderRadius: 6, fontSize: 11, fontWeight: 800, textDecoration: 'none' }}
                      >
                        ⬇ HD PNG
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
          
          {/* Argumentaire POS */}
          <section>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: '#1C2B4A', marginBottom: 16 }}>
              💼 5 Arguments Vendeurs POS & Magasin
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { t: 'Caisse Enregistreuse POS Tactile intégrée', d: 'Ventes en magasin, 3 Scanners (Caméra smartphone, Cloud Sync <100ms, Douchette USB) et tickets de caisse.' },
                { t: 'Carnet de Dettes Client & Relances WhatsApp', d: 'Enregistrement des crédits clients et relance en 1-clic sur WhatsApp avec solde exact.' },
                { t: 'Multi-Caissiers & Clôtures de Caisse Z', d: 'Chaque vendeur a son code PIN. Historique des ventes et clôture Z en fin de journée.' },
                { t: '0% Commission sur la Formule Pro', d: `Formule Pro fixe (${fcfa(prixPro)}/mois) sans aucune commission sur les ventes — contre 5 à 15% chez Jumia.` },
                { t: '30 Jours d\'Essai Gratuits sans carte', d: 'Testez la boutique et la caisse POS pendant 1 mois sans aucun engagement.' },
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
                <span style={{ fontSize: 11, fontWeight: 800, color: '#1C2B4A' }}>Scannez pour payer par Wave/OM ou comparer nos prix</span>
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
            <div style={{ border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                    <th style={{ padding: 12, textAlign: 'left', color: '#64748B' }}>Formule Recrutée</th>
                    <th style={{ padding: 12, textAlign: 'left', color: '#64748B' }}>Prix Abonnement</th>
                    <th style={{ padding: 12, textAlign: 'left', color: '#64748B' }}>Vos Gains / Mois (${tauxApporteur}%)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: 12, fontWeight: 700 }}>Boutique Taf Taf</td>
                    <td style={{ padding: 12 }}>{fcfa(prixDecouverte)}/mois</td>
                    <td style={{ padding: 12, fontWeight: 800, color: '#C75B00' }}>{fcfa(Math.round(prixDecouverte * tauxApporteur / 100))}/mois par boutique</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: 12, fontWeight: 700 }}>Boutique Pro</td>
                    <td style={{ padding: 12 }}>{fcfa(prixPro)}/mois</td>
                    <td style={{ padding: 12, fontWeight: 800, color: '#C75B00' }}>{fcfa(Math.round(prixPro * tauxApporteur / 100))}/mois par boutique</td>
                  </tr>
                  <tr>
                    <td style={{ padding: 12, fontWeight: 700 }}>Boutique Business</td>
                    <td style={{ padding: 12 }}>{fcfa(prixBusiness)}/mois</td>
                    <td style={{ padding: 12, fontWeight: 800, color: '#C75B00' }}>{fcfa(Math.round(prixBusiness * tauxApporteur / 100))}/mois par boutique</td>
                  </tr>
                </tbody>
              </table>
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

      {/* ──── ONGLET 5 : GÉNÉRATEUR D'AFFICHES FORMULES & POS NOPALOU ──── */}
      {tab === 'generateur' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <section>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: '#1C2B4A', marginBottom: 16 }}>
              ⚡ Générateur d&apos;Affiches Formules &amp; Paliers Nopalou (1080×1080)
            </h2>

            {/* Sélecteur de type d'affiche */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
              {[
                { id: 'forfait_pro', label: '🖥️ Formule Pro (Caisse POS)', bg: '#FFF7ED', color: '#C75B00' },
                { id: 'forfait_taftaf', label: '⚡ Formule Taf Taf (2 500 F)', bg: '#EFF6FF', color: '#1D4ED8' },
                { id: 'forfait_business', label: '👑 Formule Business (PIN)', bg: '#FDF4FF', color: '#7E22CE' },
                { id: 'comparatif_paliers', label: '📊 Tableau Comparatif (3 Formules)', bg: '#F0FDF4', color: '#166534' },
                { id: 'bon_plan', label: '🔥 Bon Plan Produit Comparatif', bg: '#FEF3C7', color: '#92400E' },
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
                    Ce visuel officiel 1080×1080 aux couleurs de Nopalou met en avant les fonctionnalités clés de la formule choisie (Caisse Enregistreuse POS Tactile, 3 Scanners, Carnet de Dettes WA, Multi-caissiers).
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
