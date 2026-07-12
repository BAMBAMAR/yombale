import type { Metadata } from 'next'
import Image from 'next/image'
import InscriptionForm from './InscriptionForm'

export const metadata: Metadata = {
  title: 'Créer un compte',
  description: 'Créez votre compte Nopalou gratuitement pour gérer vos annonces et favoris.',
}

export default function InscriptionPage() {
  return (
    <div className="auth-page">
      {/* Panneau gauche — visuel */}
      <div className="auth-visual">
        <a href="/" className="auth-visual-logo">
          <Image src="/icons/logo-mark.svg" alt="" width={32} height={32} style={{ borderRadius: 7, flexShrink: 0 }} priority />
          <span className="auth-logo-name" data-suffix="lou">Nopa</span>
        </a>
        <div className="auth-visual-body">
          <h2 className="auth-visual-titre">Rejoignez<br />la communauté<br />Nopalou.</h2>
          <p className="auth-visual-desc">Gratuit, sans engagement, 100 % sénégalais</p>
          <ul className="auth-visual-list">
            <li>✅ 2 annonces gratuites dès l&apos;inscription</li>
            <li>✅ Alertes de baisse de prix par email</li>
            <li>✅ Boutique en ligne incluse</li>
            <li>✅ Accès à tous les marchands du Sénégal</li>
          </ul>
        </div>
        <p className="auth-visual-footer">© {new Date().getFullYear()} Nopalou — Dakar, Sénégal</p>
      </div>

      {/* Panneau droit — formulaire */}
      <div className="auth-panel">
        <div className="auth-card">
          <div className="auth-card-header">
            <h1 className="auth-card-titre">Créer un compte</h1>
            <p className="auth-card-desc">C&apos;est gratuit et prend moins d&apos;une minute</p>
          </div>
          <InscriptionForm />
        </div>
      </div>
    </div>
  )
}
