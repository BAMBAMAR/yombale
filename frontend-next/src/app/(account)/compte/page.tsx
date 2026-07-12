import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Mon compte' }

const MENU = [
  { href: '/mes-annonces',       label: 'Mes annonces',      emoji: '📋', desc: 'Gérer vos annonces classifiées',   actif: true },
  { href: '/mes-annonces-immo',  label: 'Mes biens immo',    emoji: '🏠', desc: 'Gérer vos annonces immobilières',  actif: true },
  { href: '/boutique',           label: 'Ma boutique',       emoji: '🏪', desc: 'Votre vitrine commerçante',        actif: true },
  { href: '/boutique/abonnement', label: 'Abonnement Pro',   emoji: '⭐', desc: 'Boostez votre visibilité',         actif: true },
  { href: '/boutique/analytics',  label: 'Analytics',        emoji: '📊', desc: 'Vues et clics de votre boutique',   actif: true },
  { href: '/favoris',            label: 'Mes favoris',       emoji: '♥',  desc: 'Produits sauvegardés',            actif: true },
  { href: '/deposer-annonce',    label: 'Publier une annonce',emoji: '➕', desc: 'Publier une annonce classifiée',  actif: true },
  { href: '/deposer-immo',       label: 'Publier un bien',   emoji: '🏡', desc: 'Publier une annonce immobilière', actif: true },
  { href: '/compte/apporteur',   label: 'Apporteur d\'affaires', emoji: '💼', desc: 'Recommandez Nopalou et touchez une commission', actif: true },
  { href: '/compte/profil',      label: 'Mon profil',        emoji: '✏️', desc: 'Modifier mes informations',       actif: true },
]

export default function ComptePage() {
  return (
    <div className="compte-grid">
      {MENU.map(item => (
        item.actif ? (
          <Link key={item.href} href={item.href} className="compte-card">
            <span className="compte-card-emoji">{item.emoji}</span>
            <div>
              <p className="compte-card-label">{item.label}</p>
              <p className="compte-card-desc">{item.desc}</p>
            </div>
            <span className="compte-card-arrow">→</span>
          </Link>
        ) : (
          <div key={item.href} className="compte-card compte-card--disabled">
            <span className="compte-card-emoji">{item.emoji}</span>
            <div>
              <p className="compte-card-label">{item.label}</p>
              <p className="compte-card-desc">{item.desc}</p>
            </div>
            <span className="compte-soon-badge">Bientôt</span>
          </div>
        )
      ))}
    </div>
  )
}
