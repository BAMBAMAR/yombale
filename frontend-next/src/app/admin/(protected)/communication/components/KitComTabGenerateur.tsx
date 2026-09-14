import React, { useState } from 'react'
import { Download, Share2, Copy, Info, Sparkles } from 'lucide-react'
import { fcfa } from '@/lib/format'

interface KitComTabGenerateurProps {
  prixDecouverte: number
  prixPro: number
  prixBusiness: number
  agentCodeFormatted: string
  tauxApporteur: number
  onCopy: (txt: string, label: string) => void
  onPublishFb: (texte: string, imageUrl?: string) => void
  publiEnCours: boolean
}

type TypeVisuel =
  | 'forfait_pro'
  | 'forfait_taftaf'
  | 'forfait_business'
  | 'chatbot_wa'
  | 'immo'
  | 'telecom'
  | 'apporteur'
  | 'comparatif_paliers'
  | 'bon_plan'

const TYPES_VISUELS = [
  { id: 'forfait_pro', label: 'Formule Pro (Caisse POS)', bg: '#FFF7ED', color: '#C75B00' },
  { id: 'forfait_taftaf', label: 'Formule Taf Taf (2 500 F)', bg: '#EFF6FF', color: '#1D4ED8' },
  { id: 'forfait_business', label: 'Formule Business (PIN)', bg: '#FDF4FF', color: '#7E22CE' },
  { id: 'chatbot_wa', label: 'Chatbot WhatsApp Meta 24/7', bg: '#F0FDF4', color: '#166534' },
  { id: 'immo', label: 'Immobilier Dakar & Sénégal', bg: '#EEF2FF', color: '#4338CA' },
  { id: 'telecom', label: 'Pass & Forfaits Télécom', bg: '#F0F9FF', color: '#0369A1' },
  { id: 'apporteur', label: "Apporteurs d'Affaires (20%)", bg: '#F0FDF4', color: '#15803D' },
  { id: 'comparatif_paliers', label: 'Tableau Synthétique Formules', bg: '#FFF7ED', color: '#C75B00' },
  { id: 'bon_plan', label: 'Bon Plan Prix Comparatif', bg: '#FEF3C7', color: '#92400E' },
]

export default function KitComTabGenerateur({
  prixDecouverte,
  prixPro,
  prixBusiness,
  agentCodeFormatted,
  tauxApporteur,
  onCopy,
  onPublishFb,
  publiEnCours,
}: KitComTabGenerateurProps) {
  const [typeVisuel, setTypeVisuel] = useState<TypeVisuel>('forfait_pro')
  const [genNom, setGenNom] = useState('iPhone 15 Pro Max 256 Go')
  const [genPrix, setGenPrix] = useState('750000')
  const [genPrixBarre, setGenPrixBarre] = useState('850000')
  const [genBoutique, setGenBoutique] = useState('Dakar Tech & Mobile')
  const [genImage, setGenImage] = useState('')

  // Construction dynamique de l'URL du visuel
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
    legendePublication = `STOP AUX GESTIONS BROUILLONNES ! Digitalisez votre magasin aujourd'hui.\n\nFini les carnets perdus et les dettes oubliées. Pour seulement ${fcfa(prixPro)}/mois, transformez votre téléphone en véritable Caisse Tactile :\n\n- Mode Hors-Ligne (Même sans réseau !)\n- Scannez les codes-barres avec votre caméra\n- Éditez des factures et devis pros (PDF)\n- Encaissez par Wave/OM sans commission\n\nOFFRE SPÉCIALE : 30 Jours 100% OFFERTS (Sans carte bancaire)\nCliquez ici pour créer votre boutique : nopalou.com/boutique (Code : ${agentCodeFormatted})`
  } else if (typeVisuel === 'forfait_taftaf') {
    legendePublication = `Votre vitrine en ligne prête en 30 secondes chrono !\n\nVous vendez sur WhatsApp ? Ne perdez plus de temps à répondre aux mêmes questions. Pour ${fcfa(prixDecouverte)}/mois :\n\n- Lien personnalisé pour vos clients\n- Commandes pré-remplies directement sur WhatsApp\n- Zéro commission, l'argent tombe sur votre Wave/OM\n\nTESTEZ GRATUITEMENT pendant 1 mois !\nCréez votre boutique : nopalou.com/creer-boutique`
  } else if (typeVisuel === 'forfait_business') {
    legendePublication = `GESTION VIP POUR GROSSISTES ET GRANDES ENSEIGNES\n\nVous avez plusieurs employés ou boutiques ? Sécurisez votre business :\n\n- Accès caissiers sécurisés par code PIN\n- Clôtures de caisse automatiques\n- Gestion multi-magasins\n\n1er mois 100% OFFERT !\nDemandez une démo : nopalou.com/boutique`
  } else if (typeVisuel === 'chatbot_wa') {
    legendePublication = `Nopalou dans votre WhatsApp 24h/24 !\n\nEnvie de connaître le prix d'un produit sans scroller pendant des heures ?\n\nEnvoyez "MENU" au +221 70 871 79 42\nNotre IA vous donne les meilleurs prix du Sénégal en 2 secondes !\n100% Gratuit et sans application à télécharger.`
  } else if (typeVisuel === 'immo') {
    legendePublication = `Marre des courtiers fantômes à Dakar ?\n\nTrouvez votre prochain appartement ou terrain directement sur Nopalou Immo.\n- Annonces 100% vérifiées\n- Contacts directs sans intermédiaires cachés\n\nDécouvrez les offres du jour : nopalou.com/immo`
  } else if (typeVisuel === 'telecom') {
    legendePublication = `Arrêtez de gaspiller votre crédit !\n\nOrange, Free, Expresso... Lequel offre le meilleur pass internet aujourd'hui ?\nDécouvrez notre comparateur magique qui calcule le VRAI coût au Go.\n\nFaites le test gratuit : nopalou.com/telecom`
  } else if (typeVisuel === 'apporteur') {
    legendePublication = `REVENUS PASSIFS : Devenez Partenaire Nopalou\n\nRecommandez le meilleur outil de gestion aux commerçants et gagnez ${tauxApporteur}% de commission CHAQUE MOIS sur leurs abonnements !\n\n- 0 FCFA d'investissement\n- Paiement assuré par Wave/OM le 5 du mois\n\nRejoignez l'équipe : nopalou.com/compte/apporteur`
  } else if (typeVisuel === 'comparatif_paliers') {
    legendePublication = `3 Façons de booster votre commerce avec Nopalou :\n\n1. Taf Taf (${fcfa(prixDecouverte)}/m) : Pour vendre vite sur WhatsApp\n2. Pro (${fcfa(prixPro)}/m) : La caisse enregistreuse tactile complète\n3. Business (${fcfa(prixBusiness)}/m) : Pour gérer vos employés et fournisseurs\n\nTestez la solution de votre choix GRATUITEMENT pendant 30 jours !\nVoir les détails : nopalou.com/boutique`
  } else {
    legendePublication = `BON PLAN DU JOUR !\n\n${genNom}\nPRIX CHOC : ${fcfa(parseInt(genPrix, 10) || 0)} (au lieu de ${fcfa(parseInt(genPrixBarre, 10) || 0)})\nVendeur vérifié : ${genBoutique}\n\nCommandez vite avant rupture sur nopalou.com !`
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Sparkles size={18} color="var(--navy, #1C2B4A)" />
          <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
            Générateur d&apos;Affiches Officiel Nopalou (8 Types de Visuels)
          </h2>
        </div>

        {/* Sélecteur de type d'affiche */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
          {TYPES_VISUELS.map(b => (
            <button
              key={b.id}
              type="button"
              onClick={() => setTypeVisuel(b.id as TypeVisuel)}
              style={{
                padding: '10px 16px',
                borderRadius: 10,
                border: typeVisuel === b.id ? `2px solid ${b.color}` : '1px solid #CBD5E1',
                background: typeVisuel === b.id ? b.bg : '#fff',
                color: typeVisuel === b.id ? b.color : '#64748B',
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {b.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {/* Formulaire si mode Bon Plan Produit */}
          {typeVisuel === 'bon_plan' ? (
            <div
              style={{
                border: '1px solid var(--border, #E2E8F0)',
                borderRadius: 14,
                padding: 20,
                background: '#fff',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <label style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>Nom du Produit / Offre</label>
              <input
                type="text"
                value={genNom}
                onChange={e => setGenNom(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
              />

              <label style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>Prix Promotionnel (FCFA)</label>
              <input
                type="text"
                value={genPrix}
                onChange={e => setGenPrix(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
              />

              <label style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>Ancien Prix Barré (FCFA)</label>
              <input
                type="text"
                value={genPrixBarre}
                onChange={e => setGenPrixBarre(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
              />

              <label style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>Nom de la Boutique Vendeur</label>
              <input
                type="text"
                value={genBoutique}
                onChange={e => setGenBoutique(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
              />

              <label style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>URL de l&apos;image Produit (Optionnel)</label>
              <input
                type="url"
                placeholder="https://..."
                value={genImage}
                onChange={e => setGenImage(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
              />
            </div>
          ) : (
            <div
              style={{
                border: '1px solid var(--border, #E2E8F0)',
                borderRadius: 14,
                padding: 20,
                background: '#fff',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Info size={16} color="var(--navy, #1C2B4A)" />
                <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
                  Description du Visuel Officiel
                </h3>
              </div>
              <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, margin: 0 }}>
                Ce visuel officiel 1080×1080 aux couleurs de Nopalou met en avant les fonctionnalités clés de la thématique choisie.
              </p>
              <div
                style={{
                  background: '#F8FAFC',
                  padding: 14,
                  borderRadius: 8,
                  border: '1px solid var(--border, #E2E8F0)',
                  fontSize: 12,
                  color: 'var(--navy, #1C2B4A)',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {legendePublication}
              </div>
              <button
                type="button"
                onClick={() => onCopy(legendePublication, 'Légende')}
                style={{
                  padding: '8px 12px',
                  background: '#F1F5F9',
                  border: '1px solid #CBD5E1',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Copy size={12} />
                Copier la légende du visuel
              </button>
            </div>
          )}

          {/* Aperçu & Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
            <div
              style={{
                width: '100%',
                maxWidth: 360,
                aspectRatio: '1/1',
                borderRadius: 16,
                overflow: 'hidden',
                border: '2px solid var(--accent, #C75B00)',
                boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={generateurUrl} alt="Aperçu Visuel Formule" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 360 }}>
              <a
                href={generateurUrl}
                download={`affiche-nopalou-${typeVisuel}.png`}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  padding: '10px',
                  background: 'var(--accent, #C75B00)',
                  color: '#fff',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 800,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Download size={14} />
                Télécharger HD
              </a>
              <button
                type="button"
                onClick={() => onPublishFb(legendePublication, generateurUrl)}
                disabled={publiEnCours}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#1877F2',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Share2 size={14} />
                Publier FB/IG
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
