'use client'

import React, { useCallback, useRef } from 'react'
import { compterEntreesEnAttente, purgerDonneesLocalesPrivees } from '@/lib/db-offline'

/**
 * AUD-091 : à appeler et ATTENDRE avant de soumettre le formulaire de déconnexion.
 *
 * Avant : la purge IndexedDB était lancée sans être attendue puis la navigation la tuait ; le cache des
 * pages/API privées et ~40 clés localStorage restaient, et la caisse du marchand s'ouvrait encore hors-ligne
 * pour le suivant. Les opérations non synchronisées (ventes, dettes…) sont conservées (sinon perte d'argent)
 * après avertissement ; elles restent filtrées par utilisateur et ne sont envoyées que par leur propriétaire.
 *
 * Renvoie false si l'utilisateur renonce à se déconnecter.
 */
export async function preparerDeconnexion(): Promise<boolean> {
  if (typeof window === 'undefined') return true
  try {
    const enAttente = await compterEntreesEnAttente()
    if (enAttente > 0) {
      const ok = window.confirm(
        `${enAttente} opération(s) saisie(s) hors-ligne ne sont pas encore envoyées au serveur.\n\n` +
          `Se déconnecter les conserve sur cet appareil jusqu'à votre prochaine connexion avec ce compte. ` +
          `Pour les envoyer maintenant, annulez, reconnectez l'appareil à Internet et attendez la fin de la synchronisation.\n\nSe déconnecter quand même ?`
      )
      if (!ok) return false
    }
  } catch {
    /* lecture impossible : on ne bloque pas la déconnexion */
  }
  await purgerDonneesLocalesPrivees()
  try {
    document.cookie = 'nopalou_locale=fr; path=/; max-age=31536000; SameSite=Lax'
    document.documentElement.lang = 'fr'
    document.documentElement.dir = 'ltr'
  } catch {
    /* non bloquant */
  }
  return true
}

/**
 * Gestionnaire `onSubmit` commun aux formulaires `<form action={logout}>` : la préparation (avertissement sur les
 * opérations non envoyées, purge des données locales) est attendue AVANT l'envoi réel du formulaire.
 */
export function useLogoutSubmit() {
  const prete = useRef(false)
  return useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    if (prete.current) return
    e.preventDefault()
    const form = e.currentTarget
    if (await preparerDeconnexion()) {
      prete.current = true
      form.requestSubmit()
    }
  }, [])
}