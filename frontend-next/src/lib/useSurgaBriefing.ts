'use client'

// Briefing de Surga : chargement, échec, et dernier briefing reçu gardé sur l'appareil.
// SRG-A3-006 : en cas d'échec, rien n'était posé ; le squelette restait à l'écran sans message ni bouton.
// SRG-A3-003 / SRG-A3-012 : aucune copie du dernier briefing n'était gardée ; hors ligne ou sur réseau lent, l'écran
// restait vide. La copie est montrée tout de suite, avec sa date, puis remplacée par la réponse du serveur.

import { useCallback, useEffect, useState } from 'react'

export type EtatBriefing = 'chargement' | 'pret' | 'erreur'

// Préfixe « surga_offline_ » : la copie porte l'agenda du jour, elle est retirée de l'appareil à la déconnexion.
const CLE_COPIE = 'surga_offline_briefing'

function lireCopie(): { recu_le: string; data: any } | null {
  try {
    const brut = JSON.parse(localStorage.getItem(CLE_COPIE) || 'null')
    return brut && typeof brut.recu_le === 'string' && brut.data ? brut : null
  } catch {
    return null
  }
}

function garderCopie(data: any): void {
  try {
    // La liste des localités est fixe et volumineuse : elle n'a pas à être gardée.
    const { localites, ...reste } = data || {}
    localStorage.setItem(CLE_COPIE, JSON.stringify({ recu_le: new Date().toISOString(), data: reste }))
  } catch {}
}

// « choix » : paramètres d'adresse composés des réglages de l'appareil (zone, briques, heure, équipes). Quand ils
// changent, le briefing est redemandé.
export function useSurgaBriefing(actif: boolean, choix = '') {
  const [briefingData, setBriefingData] = useState<any | null>(null)
  const [etatBriefing, setEtatBriefing] = useState<EtatBriefing>('chargement')
  // Date de réception du briefing affiché quand il vient de la copie de l'appareil ; null quand il vient du serveur.
  const [briefingRecuLe, setBriefingRecuLe] = useState<string | null>(null)

  const chargerBriefing = useCallback(() => {
    setEtatBriefing('chargement')
    fetch(choix ? `/api/surga/briefing?${choix}` : '/api/surga/briefing')
      .then(async (r) => {
        const data = await r.json().catch(() => null)
        if (!r.ok || !data?.success) throw new Error(`briefing ${r.status}`)
        setBriefingData(data)
        setBriefingRecuLe(null)
        setEtatBriefing('pret')
        garderCopie(data)
      })
      .catch((err) => {
        console.warn('[SURGA BRIEFING]', err)
        const copie = lireCopie()
        if (copie) {
          setBriefingData(copie.data)
          setBriefingRecuLe(copie.recu_le)
        }
        setEtatBriefing('erreur')
      })
  }, [choix])

  useEffect(() => {
    if (!actif) return
    const copie = lireCopie()
    if (copie) {
      setBriefingData(copie.data)
      setBriefingRecuLe(copie.recu_le)
    }
    chargerBriefing()
  }, [actif, chargerBriefing])

  return { briefingData, setBriefingData, etatBriefing, briefingRecuLe, chargerBriefing }
}
