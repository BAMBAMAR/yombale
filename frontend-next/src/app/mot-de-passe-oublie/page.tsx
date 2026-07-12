import type { Metadata } from 'next'
import Image from 'next/image'
import MotDePasseOublieForm from './MotDePasseOublieForm'

export const metadata: Metadata = {
  title: 'Mot de passe oublié',
  robots: 'noindex',
}

export default function MotDePasseOubliePage() {
  return (
    <div className="auth-page">
      <div className="auth-visual">
        <a href="/" className="auth-visual-logo">
          <Image src="/icons/logo-mark.svg" alt="" width={32} height={32} style={{ borderRadius: 7, flexShrink: 0 }} priority />
          <span className="auth-logo-name" data-suffix="lou">Nopa</span>
        </a>
        <div className="auth-visual-body">
          <h2 className="auth-visual-titre">Réinitialisez<br />votre mot<br />de passe.</h2>
          <p className="auth-visual-desc">Un email avec un lien sécurisé vous sera envoyé.</p>
        </div>
        <p className="auth-visual-footer">© {new Date().getFullYear()} Nopalou — Dakar, Sénégal</p>
      </div>

      <div className="auth-panel">
        <div className="auth-card">
          <div className="auth-card-header">
            <h1 className="auth-card-titre">Mot de passe oublié</h1>
            <p className="auth-card-desc">Entrez votre email pour recevoir un lien de réinitialisation</p>
          </div>
          <MotDePasseOublieForm />
        </div>
      </div>
    </div>
  )
}
