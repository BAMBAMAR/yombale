import type { Metadata } from 'next'
import Image from 'next/image'
import NopalouBrandLogo from '@/components/NopalouBrandLogo'
import { AlertCircle } from 'lucide-react'
import AdminLoginForm from './AdminLoginForm'

export const metadata: Metadata = {
  title: 'Connexion Admin',
  robots: 'noindex, nofollow',
}

const MESSAGES: Record<string, string> = {
  secret_requis:    'Identifiants requis.',
  secret_incorrect: 'Identifiants incorrects ou accès révoqué.',
  session_expiree:  'Votre session administrateur a expiré. Veuillez vous reconnecter.',
  erreur_serveur:   'Erreur serveur — réessayez dans quelques instants.',
}

export default async function AdminLoginPage({ searchParams }: { searchParams?: Promise<{ error?: string }> | { error?: string } }) {
  const resolved = searchParams ? await searchParams : {}
  const error = resolved?.error
  const errorMsg = error ? (MESSAGES[error] ?? 'Erreur inconnue.') : null

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ marginBottom: 16 }}>
            <NopalouBrandLogo taille={44} priority={true} sousTitre="Administration" />
          </div>
          <h1 className="auth-titre">Accès sécurisé</h1>
          <p className="auth-sous-titre">Réservé aux administrateurs Nopalou</p>
        </div>

        {errorMsg && (
          <div className="auth-error" role="alert" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <AdminLoginForm />

        <p className="auth-switch" style={{ marginTop: 24 }}>
          <a href="/" className="auth-link">← Retour au site</a>
        </p>
      </div>
    </div>
  )
}
