import type { Metadata } from 'next'
import Link from 'next/link'

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'

export const metadata: Metadata = {
  title: 'Comment utiliser Nopalou — Guide complet',
  description: `Guide pas à pas pour utiliser Nopalou : comparer les prix au Sénégal, créer une alerte prix, publier une annonce, ouvrir une boutique et devenir apporteur d'affaires.`,
  alternates: { canonical: `${BASE}/guide-emploi` },
}

const STEPS = [
  {
    icon: '🔍', couleur: '#1d4ed8',
    titre: '1. Rechercher des produits ou annonces',
    texte: 'Tapez un produit dans la barre de recherche (ex : "Samsung Galaxy A55", "climatiseur Haier"). Nopalou compare les prix chez tous les marchands partenaires et boutiques en ligne au Sénégal.',
    ctas: [{ label: 'Rechercher un produit →', href: '/', couleur: '#1d4ed8', bg: '#eff6ff' }],
  },
  {
    icon: '⚖️', couleur: '#0891b2',
    titre: '2. Comparer & Sélectionner les meilleurs prix',
    texte: "Cliquez sur ⚖ sur plusieurs produits pour les ajouter au comparateur côte à côte, ou consultez les fiches détaillées pour vérifier la disponibilité et les garanties.",
    ctas: [{ label: 'Guide d\'achat intelligent →', href: '/guide-achat', couleur: '#ea580c', bg: '#fff7ed' }],
  },
  {
    icon: '🛒', couleur: '#7c3aed',
    titre: '3. Passation de commande sur le site web',
    texte: "Naviguez sur la boutique de votre choix. Sélectionnez vos articles, renseignez votre adresse de livraison à Dakar ou dans les régions, puis validez votre commande.",
    ctas: [{ label: 'Se connecter / S\'inscrire →', href: '/connexion', couleur: '#7c3aed', bg: '#faf5ff' }],
  },
  {
    icon: '📲', couleur: '#25D366',
    titre: '4. Commande directe & Chat WhatsApp avec le marchand',
    texte: "Vous préférez discuter avec le vendeur ? Cliquez sur <strong>\"Commander via WhatsApp\"</strong>. Votre message est pré-rempli avec les articles choisis pour un échange direct.",
    ctas: [
      { label: 'Découvrir l\'assistant WhatsApp →', href: '/assistant-whatsapp', couleur: '#25D366', bg: '#f0fdf4' },
      { label: 'Discuter sur WhatsApp →', href: 'https://wa.me/221708717942?text=menu', couleur: '#25D366', bg: '#f0fdf4' },
    ],
  },
  {
    icon: '🚚', couleur: '#059669',
    titre: '5. Modes de livraison & Suivi en temps réel',
    texte: "Recevez votre colis à domicile ou au bureau. Pour suivre votre livraison, envoyez votre référence de commande (ex : PAY-12345) directement par message à l'Assistant WhatsApp Nopalou — disponible 24h/24.",
    ctas: [
      { label: 'Suivre via WhatsApp →', href: 'https://wa.me/221708717942?text=suivi', couleur: '#25D366', bg: '#f0fdf4' },
    ],
  },
  {
    icon: '🔔', couleur: '#f59e0b',
    titre: '6. Alertes de baisse de prix',
    texte: "Un produit est trop cher ? Cliquez sur \"Créer une alerte prix\". Saisissez votre budget cible. Vous serez averti automatiquement dès que le prix baisse.",
    ctas: [{ label: 'Mes alertes prix →', href: '/mes-alertes', couleur: '#f59e0b', bg: '#fffbeb' }],
  },
  {
    icon: '💼', couleur: '#C75B00',
    titre: '7. Espace Marchand & Programme Apporteur',
    texte: "Vous êtes vendeur ? Ouvrez votre boutique en ligne Nopalou et synchronisez vos ventes avec WhatsApp. Vous pouvez aussi devenir apporteur d'affaires et toucher 10% de commission récurrente sur les boutiques recrutées.",
    ctas: [
      { label: 'Ouvrir une boutique / Compte →', href: '/inscription', couleur: '#C75B00', bg: '#fff7ed' },
      { label: 'Devenir apporteur →', href: '/compte/apporteur', couleur: '#C75B00', bg: '#fff7ed' },
    ],
  },
]

export default function GuideEmploiPage() {
  return (
    <div className="page-container" style={{ paddingTop: '2rem', maxWidth: 820 }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <Link href="/" className="guide-back-btn" style={{ color: '#475569', borderColor: '#e2e8f0', background: '#fff' }}>
          ← Accueil
        </Link>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy)' }}>📖 Comment utiliser Nopalou</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>Tout ce que vous pouvez faire, en quelques étapes.</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        {STEPS.map((step, i) => (
          <div key={i} className="guide-emploi-step">
            <div className="guide-emploi-icon" style={{ background: step.couleur + '18' }}>
              {step.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="guide-emploi-titre">{step.titre}</div>
              <div className="guide-emploi-texte" dangerouslySetInnerHTML={{ __html: step.texte }} />
              {step.ctas.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 11 }}>
                  {step.ctas.map(cta => {
                    const externe = cta.href.startsWith('http')
                    return (
                      <Link
                        key={cta.href}
                        href={cta.href}
                        target={externe ? '_blank' : undefined}
                        rel={externe ? 'noopener noreferrer' : undefined}
                        className="guide-emploi-cta"
                        style={{ background: cta.bg, color: cta.couleur, borderColor: cta.couleur }}
                      >
                        {cta.label}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="guide-emploi-footer">
        <div className="guide-emploi-footer-titre">✅ Nopalou est 100% gratuit et indépendant</div>
        <div className="guide-emploi-footer-texte">Aucune commission sur les ventes. Les prix sont mis à jour depuis les sites marchands. Nopalou ne vend rien — il compare pour vous.</div>
      </div>
    </div>
  )
}
