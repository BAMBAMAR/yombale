import type { Metadata } from 'next'
import Link from 'next/link'
import { verifySession } from '@/lib/dal'

export const metadata: Metadata = { title: 'Mon compte — Nopalou' }

const MENU = [
  { href: '/mes-annonces',       label: 'Mes annonces',      emoji: '📋', desc: 'Gérer vos annonces classifiées',   actif: true },
  { href: '/mes-annonces-immo',  label: 'Mes biens immo',    emoji: '🏠', desc: 'Gérer vos annonces immobilières',  actif: true },
  { href: '/boutique',           label: 'Ma boutique',       emoji: '🏪', desc: 'Votre vitrine commerçante',        actif: true },
  { href: '/boutique/abonnement', label: 'Abonnement Pro',   emoji: '⭐', desc: 'Boostez votre visibilité',         actif: true },
  { href: '/favoris',            label: 'Mes favoris',       emoji: '♥',  desc: 'Produits sauvegardés',            actif: true },
  { href: '/deposer-annonce',    label: 'Publier une annonce',emoji: '➕', desc: 'Publier une annonce classifiée',  actif: true },
  { href: '/deposer-immo',       label: 'Publier un bien',   emoji: '🏡', desc: 'Publier une annonce immobilière', actif: true },
  { href: '/compte/profil',      label: 'Mon profil',        emoji: '✏️', desc: 'Modifier mes informations',       actif: true },
]

export default async function ComptePage() {
  const session = await verifySession()
  const nom = session.nom ?? session.email ?? 'vous'
  const initiale = nom.charAt(0).toUpperCase()

  return (
    <div className="page-container" style={{ paddingTop: '2rem', maxWidth: 680 }}>
      {/* Profil header */}
      <div className="compte-header">
        <div className="compte-avatar">{initiale}</div>
        <div className="compte-identity">
          <h1 className="compte-nom">Bonjour, {nom} 👋</h1>
          <p className="compte-email">{session.email}</p>
        </div>
      </div>

      {/* Menu */}
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
    </div>
  )
}
