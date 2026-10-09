'use client'

// Texte lu par le briefing audio : demandé au serveur, redemandé si la demande échoue, et gardé sur l'appareil.
// Avant : une seule demande, dont l'échec était muet. Un serveur qui redémarre ou un réseau coupé à cet instant,
// et le lecteur n'apparaissait pas, audio activé, sans message ni nouvel essai ; hors ligne il n'apparaissait jamais.

import { useCallback, useEffect, useRef, useState } from 'react'

export type EtatScriptAudio = 'inactif' | 'chargement' | 'pret' | 'erreur'

// Préfixe « surga_offline_ » : retiré de l'appareil à la déconnexion avec le reste. Le texte ne porte que des titres
// de presse et des résultats sportifs, aucune donnée du compte.
const CLE_COPIE = 'surga_offline_audio_script'
// Attente avant chaque essai : le premier part tout de suite.
export const ATTENTES_MS = [0, 2000, 6000]

function lireCopie(): string {
  try { return localStorage.getItem(CLE_COPIE) || '' } catch { return '' }
}

/**
 * Demande le texte, en plusieurs essais espacés. Rend le texte, ou null si aucun essai n'a abouti.
 * `lire` fait une demande et rend le texte ou lève une erreur ; `attendre` et `abandonne` sont remplaçables pour les tests.
 */
export async function obtenirScriptAudio(
  lire: () => Promise<string>,
  options: { attentes?: number[]; attendre?: (ms: number) => Promise<void>; abandonne?: () => boolean } = {}
): Promise<string | null> {
  const { attentes = ATTENTES_MS, attendre = (ms: number) => new Promise<void>((r) => setTimeout(r, ms)), abandonne = () => false } = options
  for (const ms of attentes) {
    if (ms > 0) await attendre(ms)
    if (abandonne()) return null
    try {
      const texte = await lire()
      if (texte) return texte
    } catch {}
  }
  return null
}

async function lireServeur(): Promise<string> {
  const r = await fetch('/api/surga/audio/script')
  const data = await r.json().catch(() => null)
  if (!r.ok || !data?.success || typeof data.script !== 'string') throw new Error(`audio ${r.status}`)
  return data.script
}

// « declencheur » : le texte est redemandé quand il change (nouveau briefing reçu).
export function useSurgaAudioScript(actif: boolean, declencheur: unknown) {
  const [script, setScript] = useState('')
  const [etat, setEtat] = useState<EtatScriptAudio>('inactif')
  const demande = useRef(0)

  const charger = useCallback(() => {
    const numero = ++demande.current
    const copie = lireCopie()
    // La copie de l'appareil est montrée tout de suite : la lecture reste possible sans réseau.
    if (copie) setScript(copie)
    setEtat(copie ? 'pret' : 'chargement')
    obtenirScriptAudio(lireServeur, { abandonne: () => demande.current !== numero }).then((texte) => {
      if (demande.current !== numero) return
      if (texte) {
        setScript(texte)
        setEtat('pret')
        try { localStorage.setItem(CLE_COPIE, texte) } catch {}
      } else if (!copie) {
        setEtat('erreur')
      }
    })
  }, [])

  useEffect(() => {
    if (!actif) { demande.current += 1; setEtat('inactif'); return }
    charger()
  }, [actif, declencheur, charger])

  return { audioScript: script, etatAudio: etat, rechargerAudio: charger }
}
