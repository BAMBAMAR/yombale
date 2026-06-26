import type { Metadata } from 'next'
import ConnexionForm from './ConnexionForm'

export const metadata: Metadata = {
  title: 'Connexion — Nopalou',
  description: 'Connectez-vous à votre compte Nopalou.',
}

export default function ConnexionPage() {
  return (
    <div className="auth-page">
      {/* Panneau gauche — visuel */}
      <div className="auth-visual">
        <a href="/" className="auth-visual-logo">
          <img src="/icons/logo-mark.svg" alt="" width={32} height={32} style={{ borderRadius: 7, flexShrink: 0 }} />
          <span className="auth-logo-name" data-suffix="lou">Nopa</span>
        </a>
        <div className="auth-visual-body">
          <h2 className="auth-visual-titre">Comparez.<br />Économisez.<br />Choisissez mieux.</h2>
          <p className="auth-visual-desc">4 566 produits · 14 marchands · prix mis à jour chaque jour</p>
          <ul className="auth-visual-list">
            <li>✅ Alertes de baisse de prix</li>
            <li>✅ Comparaison jusqu&apos;à 3 produits</li>
            <li>✅ Déposez vos annonces gratuitement</li>
            <li>✅ Gérez votre boutique en ligne</li>
          </ul>
        </div>
        <p className="auth-visual-footer">© {new Date().getFullYear()} Nopalou — Dakar, Sénégal</p>
      </div>

      {/* Panneau droit — formulaire */}
      <div className="auth-panel">
        <div className="auth-card">
          <div className="auth-card-header">
            <h1 className="auth-card-titre">Bon retour !</h1>
            <p className="auth-card-desc">Connectez-vous à votre compte Nopalou</p>
          </div>
          <ConnexionForm />
        </div>
      </div>
    </div>
  )
}
