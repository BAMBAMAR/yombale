'use client'

import React, { useState, useEffect } from 'react'
import AccountTopNavbar from './AccountTopNavbar'
import AccountBottomNav from './AccountBottomNav'
import AccountQuickActionsSheet from './AccountQuickActionsSheet'
import AccountMobileDrawer from './AccountMobileDrawer'

interface AccountWorkspaceWrapperProps {
  nom?: string
  email?: string | null
  initiale?: string
  activeSpace?: 'compte' | 'boutique' | 'agence'
  customCta?: {
    label: string
    onClick?: () => void
    href?: string
  }
  children: React.ReactNode
}

export default function AccountWorkspaceWrapper({
  nom = '',
  email = null,
  initiale = '',
  activeSpace = 'compte',
  customCta,
  children,
}: AccountWorkspaceWrapperProps) {
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [userName, setUserName] = useState(nom)
  const [userEmail, setUserEmail] = useState(email)
  const [userInitiale, setUserInitiale] = useState(initiale)

  useEffect(() => {
    if (nom) setUserName(nom)
    if (email) setUserEmail(email)
    if (initiale) setUserInitiale(initiale)
  }, [nom, email, initiale])

  useEffect(() => {
    if (!userName) {
      fetch('/api/auth/profil')
        .then(r => (r.ok ? r.json() : null))
        .then(d => {
          if (d?.user) {
            setUserName(d.user.nom || 'Mon Compte')
            setUserEmail(d.user.email || null)
            setUserInitiale(d.user.nom ? d.user.nom.charAt(0).toUpperCase() : 'U')
          }
        })
        .catch(() => {})
    }
  }, [userName])

  // Attacher la classe d'isolation body.in-account-workspace pour masquer l'en-tête et pied publics
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.classList.add('in-account-workspace')
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.body.classList.remove('in-account-workspace')
      }
    }
  }, [])

  const resolvedInitiale = userInitiale || (userName ? userName.charAt(0).toUpperCase() : 'U')

  return (
    <div className="account-workspace-root" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 1. En-tête Unique Espace Compte 56px */}
      <AccountTopNavbar
        nom={userName || 'Mon Compte'}
        email={userEmail}
        initiale={resolvedInitiale}
        activeSpace={activeSpace}
        customCta={customCta}
        onOpenMenu={() => setIsDrawerOpen(true)}
      />

      {/* 2. Contenu Principal de l'Espace Compte */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>

      {/* 3. Barre Inférieure Mobile Dédiée Compte (5 Boutons + FAB) */}
      <AccountBottomNav
        onOpenQuickActions={() => setIsQuickActionsOpen(true)}
        onOpenDrawer={() => setIsDrawerOpen(true)}
      />

      {/* 4. Feuille d'Actions Rapides 1-Tap (FAB +) */}
      <AccountQuickActionsSheet
        isOpen={isQuickActionsOpen}
        onClose={() => setIsQuickActionsOpen(false)}
      />

      {/* 5. Tiroir Latéral Coulissant Mobile (Menu) */}
      <AccountMobileDrawer
        nom={userName || 'Mon Compte'}
        email={userEmail}
        initiale={resolvedInitiale}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  )
}
