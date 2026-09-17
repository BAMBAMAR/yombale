import type { Metadata } from 'next'
import Link from 'next/link'
import {
  type LucideIcon,
  Search,
  Building2,
  Smartphone,
  MoreHorizontal,
  ShoppingBag,
  Bell,
  Package,
  HelpCircle,
  ShieldAlert,
  MessageSquare,
  BarChart3,
  ArrowRight,
  CheckCheck,
  CheckCircle2,
  Sparkles
} from 'lucide-react'

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'

export const metadata: Metadata = {
  title: 'Assistant WhatsApp Nopalou — Acheter, Comparer, Bilan Marchand & Suivi',
  description: `L'assistant WhatsApp officiel de Nopalou : achetez auprès de boutiques partenaires, comparez les prix réels au Sénégal, recevez votre bilan de caisse marchand du soir et trouvez votre logement sur WhatsApp.`,
  alternates: { canonical: `${BASE}/assistant-whatsapp` },
}

const WA_LINK = 'https://wa.me/221708717942?text=' + encodeURIComponent('menu')

interface FonctionItem {
  icon: LucideIcon
  couleur: string
  titre: string
  texte: string
}

interface GroupeFonctions {
  groupe: string
  items: FonctionItem[]
}

const FONCTIONS: GroupeFonctions[] = [
  {
    groupe: 'Recherche & Comparaison Instantanée',
    items: [
      {
        icon: Search,
        couleur: '#1d4ed8',
        titre: 'Rechercher un produit, une marque ou une annonce',
        texte: "Tapez le nom d'un produit (ex : \"iPhone 15\", \"climatiseur Inverter\") : le bot NLP répond avec les prix trouvés chez les marchands partenaires et boutiques vérifiées, avec le lien direct.",
      },
      {
        icon: Building2,
        couleur: '#059669',
        titre: 'Recherche Immobilière par quartier de Dakar',
        texte: "Dites \"Appartement Almadies\" ou \"Studio Mermoz\" : recevez directement dans la conversation les dernières annonces avec photos, loyers et contact agence vérifié.",
      },
      {
        icon: Smartphone,
        couleur: '#7c3aed',
        titre: 'Comparer les offres et forfaits télécom',
        texte: "Consultez les derniers forfaits mobiles Orange, Yas, Expresso et Promobile sans quitter WhatsApp.",
      },
      {
        icon: MoreHorizontal,
        couleur: '#64748b',
        titre: 'Afficher plus de résultats',
        texte: "Répondez simplement \"plus\" ou \"encore\" pour paginer les résultats sans rien retaper.",
      },
    ],
  },
  {
    groupe: 'Espace Marchand & Commandes',
    items: [
      {
        icon: BarChart3,
        couleur: '#C75B00',
        titre: 'Bilan comptable du soir automatique',
        texte: "Envoyez le mot \"Bilan\" suivi de votre code PIN marchand : recevez en 3 secondes votre chiffre d'affaires du jour ventilé (Espèces, Wave et Orange Money).",
      },
      {
        icon: ShoppingBag,
        couleur: '#25D366',
        titre: 'Commander directement dans la conversation',
        texte: "Parcourez une boutique, choisissez vos articles via le panier WhatsApp et validez votre commande préremplie. Le commerçant reçoit le détail complet instantanément.",
      },
    ],
  },
  {
    groupe: 'Alertes & Suivi de Livraison',
    items: [
      {
        icon: Bell,
        couleur: '#f59e0b',
        titre: 'Créer une alerte de baisse de prix',
        texte: "Indiquez à l'assistant le prix cible souhaité pour être notifié automatiquement sur WhatsApp dès que le tarif baisse chez un commerçant.",
      },
      {
        icon: Package,
        couleur: '#0891b2',
        titre: 'Suivre une commande en cours',
        texte: "Saisissez votre référence de commande (ex : PAY-4089) pour connaître le statut d'expédition et de livraison Tiak-Tiak en temps réel.",
      },
    ],
  },
  {
    groupe: 'Assistance & Gestion des Données',
    items: [
      {
        icon: HelpCircle,
        couleur: '#1C2B4A',
        titre: 'Poser une question sur le fonctionnement du site',
        texte: "Création de boutique, publication d'annonce, baux locatifs... L'assistant répond 24h/24 aux questions fréquentes et vous oriente vers l'équipe support.",
      },
      {
        icon: ShieldAlert,
        couleur: '#dc2626',
        titre: 'Désinscription & Suppression des annonces',
        texte: "Envoyez \"supprimer\" pour désactiver vos annonces et votre numéro, ou \"STOP\" pour vous désinscrire de tout message WhatsApp automatisé.",
      },
    ],
  },
]

export default function AssistantWhatsAppPage() {
  return (
    <div className="page-container" style={{ paddingTop: '2rem', paddingBottom: '3rem', maxWidth: 860, fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>

      {/* ── En-tête avec retour ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        <Link href="/" className="guide-back-btn" style={{ color: '#475569', borderColor: '#e2e8f0', background: '#fff', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, fontSize: 13, border: '1px solid #cbd5e1' }}>
          ← Accueil
        </Link>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
            Assistant WhatsApp Nopalou
          </h1>
          <p style={{ fontSize: 12.5, color: 'var(--text-subtle, #5A4E42)', margin: '2px 0 0' }}>
            Achetez, comparez les offres, recevez votre bilan marchand et suivez vos livraisons sur WhatsApp.
          </p>
        </div>
      </div>

      {/* ── Bannière d'activation principale ── */}
      <div style={{
        background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)',
        border: '1.5px solid #25D366',
        borderRadius: 18, padding: '24px 20px', marginBottom: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 16, flexWrap: 'wrap', boxShadow: '0 4px 16px rgba(37,211,102,0.1)'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(37,211,102,0.15)', color: '#15803d', padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 800, marginBottom: 6 }}>
            <Sparkles size={13} color="#16a34a" />
            <span>DISPONIBLE 24H/24 · 100% GRATUIT</span>
          </div>
          <p style={{ fontSize: 17, fontWeight: 900, color: 'var(--navy, #1C2B4A)', margin: '0 0 4px' }}>
            Envoyez &quot;menu&quot; pour démarrer l&apos;assistant
          </p>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
            Numéro officiel : <strong>+221 70 871 79 42</strong> · Aucune inscription requise
          </p>
        </div>
        <a
          href={WA_LINK}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: '12px 24px', background: '#25D366', color: '#ffffff',
            borderRadius: 12, fontSize: 14, fontWeight: 800, textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center', gap: 8, flexShrink: 0,
            boxShadow: '0 4px 14px rgba(37,211,102,0.3)', transition: 'all 0.15s ease'
          }}
        >
          <MessageSquare size={17} color="#ffffff" />
          <span>Ouvrir dans WhatsApp</span>
        </a>
      </div>

      {/* ── SIMULATEUR VISUEL DU CHATBOT (COMMERÇANT & ACHETEUR) ── */}
      <div style={{
        background: '#efeae2', borderRadius: 18, border: '1px solid #d1d7db',
        padding: '20px', marginBottom: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #d1d7db', paddingBottom: 10, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#25D366', display: 'inline-block' }} />
            <span style={{ fontSize: 13, fontWeight: 800, color: '#075e54' }}>Simulation en direct de l&apos;Assistant Nopalou</span>
          </div>
          <span style={{ fontSize: 11, color: '#54656f' }}>WhatsApp Cloud API</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 14 }}>
          
          {/* Exemple 1 : Bilan Marchand */}
          <div style={{ background: '#ffffff', borderRadius: 12, padding: '14px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent, #C75B00)', marginBottom: 8 }}>
              EXPÉRIENCE COMMERÇANT
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
              <div style={{ background: '#d9fdd3', padding: '6px 12px', borderRadius: '10px 10px 0 10px', fontSize: 12.5 }}>
                Bilan
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{ background: '#f0f2f5', padding: '8px 12px', borderRadius: '10px 10px 10px 0', fontSize: 12, lineHeight: 1.45, color: '#111b21', maxWidth: '90%' }}>
                <strong>Bilan Caisse du 17/09</strong><br/>
                • Ventes réalisées : <strong>14</strong><br/>
                • Espèces en caisse : <strong>45 000 FCFA</strong><br/>
                • Encaissements Wave : <strong>85 000 FCFA</strong><br/>
                • Orange Money : <strong>20 000 FCFA</strong><br/>
                Total Journée : <strong style={{ color: '#16a34a' }}>150 000 FCFA</strong>
              </div>
            </div>
          </div>

          {/* Exemple 2 : Recherche Immo / Produits */}
          <div style={{ background: '#ffffff', borderRadius: 12, padding: '14px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--navy, #1C2B4A)', marginBottom: 8 }}>
              EXPÉRIENCE ACHETEUR &amp; LOCATAIRE
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
              <div style={{ background: '#d9fdd3', padding: '6px 12px', borderRadius: '10px 10px 0 10px', fontSize: 12.5 }}>
                Appartement F3 Almadies
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{ background: '#f0f2f5', padding: '8px 12px', borderRadius: '10px 10px 10px 0', fontSize: 12, lineHeight: 1.45, color: '#111b21', maxWidth: '90%' }}>
                <strong>2 biens vérifiés trouvés :</strong><br/>
                1. F3 Meublé Almadies vue mer<br/>
                Loyer : <strong>350 000 FCFA/mois</strong> (Agence Teranga)<br/>
                Lien direct avec photos HD et réservation certifiée Nopalou Pay Safe

              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── LISTE COMPLÈTE DES CAPACITÉS SANS ICÔNES VIDES ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 28 }}>
        {FONCTIONS.map(groupe => (
          <div key={groupe.groupe} style={{ background: '#ffffff', borderRadius: 16, padding: '20px 18px', border: '1px solid var(--border, #E8DDD2)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <h2 style={{ fontSize: 15, fontWeight: 900, color: 'var(--navy, #1C2B4A)', margin: '0 0 14px' }}>
              {groupe.groupe}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {groupe.items.map((f) => {
                const IconComponent = f.icon
                return (
                  <div key={f.titre} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, paddingBottom: 10, borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: f.couleur + '18', color: f.couleur, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                      <IconComponent size={17} color={f.couleur} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: '0 0 3px' }}>
                        {f.titre}
                      </h3>
                      <p style={{ fontSize: 12.5, color: 'var(--text-subtle, #5A4E42)', lineHeight: 1.45, margin: 0 }}>
                        {f.texte}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── Footer instructions de conversation ── */}
      <div style={{
        background: '#ffffff', borderRadius: 14, padding: '18px 20px',
        border: '1px solid var(--border, #E8DDD2)', textAlign: 'center'
      }}>
        <h4 style={{ fontSize: 14, fontWeight: 900, color: 'var(--navy, #1C2B4A)', margin: '0 0 6px' }}>
          Comment lancer une conversation
        </h4>
        <p style={{ fontSize: 12.5, color: 'var(--text-subtle, #5A4E42)', margin: 0, lineHeight: 1.5 }}>
          Enregistrez le numéro <strong>+221 70 871 79 42</strong> dans vos contacts ou cliquez sur le bouton vert ci-dessus. Envoyez n&apos;importe quel message : l&apos;assistant vous guide pas à pas. Tapez <strong>menu</strong> à tout moment pour revenir au menu principal.
        </p>
      </div>

    </div>
  )
}
