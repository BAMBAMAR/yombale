'use client'
import React, { useEffect, useRef } from 'react'
import { logout } from '@/app/actions/auth'
import { LogOut } from 'lucide-react'
import { preparerDeconnexion } from '@/lib/deconnexion'
import { purgerDonneesLocalesPrivees } from '@/lib/db-offline'

interface Props {
  nom: string
  userId?: string
}

export default function NavbarActions({ nom, userId }: Props) {
  const purgeFaite = useRef(false)

  // AUD-091 : la purge des données locales est ATTENDUE avant la soumission du formulaire de déconnexion
  async function handleDeconnexion(e: React.MouseEvent<HTMLButtonElement>) {
    if (purgeFaite.current) return
    e.preventDefault()
    const form = e.currentTarget.form
    if (await preparerDeconnexion()) {
      purgeFaite.current = true
      form?.requestSubmit()
    }
  }

  useEffect(() => {
    if (!userId || typeof window === 'undefined') return
    const enregistrer = () => {
      try {
        localStorage.setItem('nopalou_user_id', userId)
      } catch (e) {
        console.warn('[NavbarActions] Erreur sauvegarde userId:', e)
      }
    }
    // Changement de compte sur le même appareil sans déconnexion passée par le bouton (session expirée, cookie effacé) :
    // les données locales du compte précédent sont purgées avant d'enregistrer le nouveau.
    let precedent: string | null = null
    try {
      precedent = localStorage.getItem('nopalou_user_id')
    } catch {}
    if (precedent && precedent !== userId) purgerDonneesLocalesPrivees().finally(enregistrer)
    else enregistrer()
  }, [userId])

  return (
    <div className="navbar-actions-compte" style={{ alignItems: 'center', gap: '6px', flexShrink: 0 }}>
      <a
        href="/compte"
        title={`Connecté : ${nom}`}
        style={{
          padding: '6px 10px',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 700,
          color: 'var(--navy)',
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          whiteSpace: 'nowrap',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          textDecoration: 'none',
          maxWidth: '160px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        <span style={{ flexShrink: 0 }}></span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{nom}</span>
      </a>
      <form action={logout} style={{ margin: 0 }}>
        <button
          type="submit"
          title="Se déconnecter"
          aria-label="Se déconnecter"
          onClick={handleDeconnexion}
          style={{
            padding: '6px 9px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 700,
            color: '#dc2626',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'background 0.15s, color 0.15s'
          }}
        >
          <LogOut size={14} />
          <span className="hidden-mobile navbar-logout-text">Quitter</span>
        </button>
      </form>
    </div>
  )
}
