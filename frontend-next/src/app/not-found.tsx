import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Page introuvable',
  robots: 'noindex',
}

export default function NotFound() {
  return (
    <div className="notfound-page">
      <div className="notfound-inner">
        <div className="notfound-code">404</div>
        <h1 className="notfound-titre">Page introuvable</h1>
        <p className="notfound-desc">
          Cette page n&apos;existe pas ou a été déplacée.
        </p>
        <div className="notfound-actions">
          <a href="/" className="notfound-btn notfound-btn--primary">Retour à l&apos;accueil</a>
          <a href="/annonces" className="notfound-btn">Voir les annonces</a>
          <a href="/immo" className="notfound-btn">Immobilier</a>
        </div>
      </div>
    </div>
  )
}
